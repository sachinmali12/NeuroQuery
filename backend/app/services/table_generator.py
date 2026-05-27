import re
from typing import List, Dict, Any

def clean_table_name(table_name: str) -> str:
    """
    Clean table name to be PostgreSQL compatible:
    lowercase, replace spaces with _, no special symbols.
    """
    name = str(table_name).strip().lower()
    # Replace non-alphanumeric with underscore
    name = re.sub(r'[^a-z0-9_]', '_', name)
    # Replace multiple underscores with a single underscore
    name = re.sub(r'_+', '_', name)
    # Trim leading/trailing underscores
    name = name.strip('_')
    
    if not name:
        name = "imported_dataset"
    elif name[0].isdigit():
        name = "tbl_" + name
        
    return name

def generate_create_table_ddl(table_name: str, columns: List[Dict[str, Any]]) -> str:
    """
    Generates SQL CREATE TABLE query.
    columns list of dict: [{"cleaned_name": "...", "type": "INTEGER/TEXT/FLOAT/DATE/BOOLEAN"}]
    """
    cleaned_name = clean_table_name(table_name)
    
    column_definitions = []
    # Add auto-incrementing primary key ID first
    column_definitions.append("id SERIAL PRIMARY KEY")
    
    for col in columns:
        col_name = col["cleaned_name"]
        col_type = col["type"].upper()
        
        # Validate data types
        if col_type not in ["INTEGER", "FLOAT", "DATE", "BOOLEAN", "TEXT"]:
            col_type = "TEXT"
            
        column_definitions.append(f'"{col_name}" {col_type}')
        
    cols_joined = ",\n    ".join(column_definitions)
    ddl = f'CREATE TABLE "{cleaned_name}" (\n    {cols_joined}\n);'
    
    return ddl
