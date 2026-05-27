import os
import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List

def clean_column_name(col_name: str) -> str:
    """
    Clean column name to make it PostgreSQL compatible.
    E.g., "Employee Name" -> "employee_name", "Salary($)" -> "salary"
    """
    col_str = str(col_name).strip()
    col_str = col_str.lower()
    # Replace non-alphanumeric (except underscore) with underscore
    col_str = re.sub(r'[^a-z0-9_]', '_', col_str)
    # Replace multiple underscores with a single underscore
    col_str = re.sub(r'_+', '_', col_str)
    # Trim leading/trailing underscores
    col_str = col_str.strip('_')
    
    if not col_str:
        col_str = "column_field"
    elif col_str[0].isdigit():
        col_str = "col_" + col_str
        
    return col_str

def detect_column_type(series: pd.Series) -> str:
    """
    Intelligently detect SQL data type for a pandas series:
    INTEGER, FLOAT, BOOLEAN, DATE, TEXT
    """
    non_nulls = series.dropna()
    if len(non_nulls) == 0:
        return "TEXT"
        
    # Check if boolean-like
    bool_values = {True, False, 1, 0, '1', '0', 'true', 'false', 'yes', 'no', 't', 'f', 'y', 'n'}
    if all(str(val).lower() in bool_values for val in non_nulls):
        # Verify if there are actual boolean indicators, otherwise it might just be 0/1 integers
        str_lowers = [str(val).lower() for val in non_nulls]
        if any(v in {'true', 'false', 'yes', 'no', 't', 'f'} for v in str_lowers):
            return "BOOLEAN"
            
    # Check if integer
    try:
        # Check if converting to numeric is successful and there are no fractional parts
        numeric_series = pd.to_numeric(non_nulls, errors='raise')
        if all(numeric_series % 1 == 0):
            return "INTEGER"
        else:
            return "FLOAT"
    except (ValueError, TypeError):
        pass
        
    # Check if date
    try:
        # Avoid treating simple numbers as dates
        if not all(isinstance(val, (int, float)) for val in non_nulls):
            pd.to_datetime(non_nulls, errors='raise')
            # Verify it contains typical date characters or length to avoid false positives
            if all(isinstance(v, str) and (any(char in v for char in ['-', '/', ':']) or len(v) >= 8) for v in non_nulls):
                return "DATE"
    except (ValueError, TypeError):
        pass
        
    return "TEXT"

def parse_file_preview(file_path: str, original_filename: str) -> Dict[str, Any]:
    """
    Reads the file, extracts the first 10 rows, cleans columns, and detects types.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    
    if ext == '.csv':
        df = pd.read_csv(file_path, nrows=100) # Read slightly more to detect types accurately, but preview only 10
    elif ext in ['.xlsx', '.xls']:
        df = pd.read_excel(file_path, nrows=100)
    else:
        raise ValueError(f"Unsupported file format: {ext}")
        
    if df.empty:
        raise ValueError("The uploaded file is empty.")
        
    # Default cleaned table name
    base_name = os.path.splitext(original_filename)[0]
    cleaned_table_name = re.sub(r'[^a-zA-Z0-9_]', '_', base_name).lower()
    cleaned_table_name = re.sub(r'_+', '_', cleaned_table_name).strip('_')
    if not cleaned_table_name or cleaned_table_name[0].isdigit():
        cleaned_table_name = "imported_" + (cleaned_table_name or "table")
        
    columns_metadata = []
    for col in df.columns:
        cleaned_name = clean_column_name(col)
        detected_type = detect_column_type(df[col])
        columns_metadata.append({
            "original_name": str(col),
            "cleaned_name": cleaned_name,
            "detected_type": detected_type
        })
        
    # Prepare preview rows (limit to first 10 for table render)
    preview_df = df.head(10).replace({np.nan: None})
    preview_rows = preview_df.to_dict(orient='records')
    
    # Cast keys to string for JSON safety
    safe_preview_rows = []
    for row in preview_rows:
        safe_row = {str(k): v for k, v in row.items()}
        safe_preview_rows.append(safe_row)
        
    return {
        "default_table_name": cleaned_table_name,
        "columns": columns_metadata,
        "preview_data": safe_preview_rows,
        "total_rows_approx": len(df) # approx because we capped read at 100 for fast preview
    }
