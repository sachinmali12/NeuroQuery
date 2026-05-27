import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from typing import List, Dict, Any

def cast_column_data(series: pd.Series, target_type: str) -> pd.Series:
    """
    Casts a pandas Series to a specific target SQL-compatible type,
    ensuring that NaN/NaT values are converted to standard Python None (SQL NULL).
    """
    target_type = target_type.upper()
    
    if target_type == "INTEGER":
        # Parse to numeric, round, and convert to nullable Int64
        num_series = pd.to_numeric(series, errors='coerce')
        # Replace inf with nan
        num_series = num_series.replace([np.inf, -np.inf], np.nan)
        return num_series.round().astype('Int64').where(num_series.notna(), None)
        
    elif target_type == "FLOAT":
        num_series = pd.to_numeric(series, errors='coerce')
        num_series = num_series.replace([np.inf, -np.inf], np.nan)
        # Using standard float object type or float64 with NaN replaced by None
        return num_series.astype(object).where(num_series.notna(), None)
        
    elif target_type == "BOOLEAN":
        # Convert boolean representation intelligently
        def parse_bool(val):
            if pd.isna(val):
                return None
            val_str = str(val).strip().lower()
            if val_str in ['true', '1', 't', 'y', 'yes']:
                return True
            if val_str in ['false', '0', 'f', 'n', 'no']:
                return False
            return None
            
        return series.apply(parse_bool)
        
    elif target_type == "DATE":
        # Convert to datetime and then convert to date objects
        date_series = pd.to_datetime(series, errors='coerce')
        return date_series.dt.date.astype(object).where(date_series.notna(), None)
        
    else: # TEXT
        # Convert to string, preserving None for NaNs
        return series.apply(lambda x: str(x).strip() if pd.notna(x) else None)

def import_file_data(engine_conn, file_path: str, original_filename: str, table_name: str, selected_columns: List[Dict[str, Any]]) -> int:
    """
    Reads the file, filters by selected columns, renames to cleaned names,
    casts data types, and inserts data into the PostgreSQL database.
    Returns: The total number of rows imported.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    
    if ext == '.csv':
        df = pd.read_csv(file_path)
    elif ext in ['.xlsx', '.xls']:
        df = pd.read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    if df.empty:
        return 0
        
    # Get mappings
    # columns format: [{"original_name": "...", "cleaned_name": "...", "type": "INTEGER/TEXT/..."}]
    orig_names = [col["original_name"] for col in selected_columns]
    
    # Check if all selected columns exist in dataframe
    for col in orig_names:
        if col not in df.columns:
            # Try string match as column names are read as string
            str_cols = [str(c) for c in df.columns]
            if str(col) in str_cols:
                # Find index of match and map it
                idx = str_cols.index(str(col))
                df.rename(columns={df.columns[idx]: str(col)}, inplace=True)
            else:
                raise ValueError(f"Selected column '{col}' not found in file.")
                
    # Filter by selected columns
    df_filtered = df[orig_names].copy()
    
    # Cast each column to selected type and rename
    rename_mapping = {}
    for col in selected_columns:
        orig = col["original_name"]
        clean = col["cleaned_name"]
        t_type = col["type"]
        
        # Cast column
        df_filtered[orig] = cast_column_data(df_filtered[orig], t_type)
        rename_mapping[orig] = clean
        
    # Apply column rename to clean names
    df_filtered.rename(columns=rename_mapping, inplace=True)
    
    # Convert numpy nan and float nan to None
    df_filtered = df_filtered.replace({np.nan: None})
    
    # Insert into database using SQLAlchemy to_sql
    # Since we are appending, we expect the table to have been created by /create-table
    df_filtered.to_sql(
        name=table_name,
        con=engine_conn,
        if_exists='append',
        index=False,
        method='multi',
        chunksize=1000
    )
    
    return len(df_filtered)
