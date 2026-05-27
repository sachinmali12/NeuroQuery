import os
import uuid
import shutil
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from pydantic import BaseModel
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session

from app.database import get_db, engine
from app.models.user_model import User
from app.auth.auth_handler import get_current_user
from app.services.file_parser import parse_file_preview
from app.services.table_generator import clean_table_name, generate_create_table_ddl
from app.services.import_service import import_file_data

router = APIRouter(prefix="/upload", tags=["file-import"])

TEMP_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_uploads")
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

class CreateTableRequest(BaseModel):
    table_name: str
    columns: List[Dict[str, Any]] # [{"cleaned_name": str, "type": str}]
    replace_existing: bool = False

class ImportDataRequest(BaseModel):
    file_id: str
    original_filename: str
    table_name: str
    selected_columns: List[Dict[str, Any]] # [{"original_name": str, "cleaned_name": str, "type": str}]

@router.post("/upload-file")
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Receives file, saves it temporarily, and returns a unique file ID.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.xls']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload CSV, XLSX or XLS."
        )
        
    file_id = str(uuid.uuid4())
    temp_filename = f"{file_id}{ext}"
    temp_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )
        
    return {
        "file_id": file_id,
        "original_filename": file.filename
    }

@router.get("/preview-file")
def preview_file(
    file_id: str = Query(..., description="The temporary file ID returned during upload"),
    original_filename: str = Query(..., description="The original filename to derive extension"),
    current_user: User = Depends(get_current_user)
):
    """
    Parses the temporary file, returns a preview and detected columns.
    """
    ext = os.path.splitext(original_filename)[1].lower()
    temp_filename = f"{file_id}{ext}"
    temp_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
    
    if not os.path.exists(temp_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file not found or expired. Please upload again."
        )
        
    try:
        preview_data = parse_file_preview(temp_path, original_filename)
        return preview_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file preview: {str(e)}"
        )

@router.post("/create-table")
def create_table(
    data: CreateTableRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Validates and creates the custom table. Handles duplicate tables with rename/replace.
    """
    cleaned_name = clean_table_name(data.table_name)
    
    # Check if table already exists in PostgreSQL
    inspector = inspect(engine)
    if inspector.has_table(cleaned_name):
        if not data.replace_existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": f"Table '{cleaned_name}' already exists in the database.",
                    "code": "DUPLICATE_TABLE",
                    "table_name": cleaned_name
                }
            )
            
    try:
        # Generate CREATE TABLE SQL statement
        create_sql = generate_create_table_ddl(cleaned_name, data.columns)
        
        # Execute dynamically in a transaction
        with engine.begin() as conn:
            if data.replace_existing:
                # Drop existing table first cascading any dependencies
                conn.execute(text(f'DROP TABLE IF EXISTS "{cleaned_name}" CASCADE;'))
            conn.execute(text(create_sql))
            
        return {
            "message": f"Table '{cleaned_name}' created successfully.",
            "table_name": cleaned_name,
            "sql": create_sql
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SQL creation error: {str(e)}"
        )

@router.post("/import-data")
def import_data(
    data: ImportDataRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Reads selected columns from the temporary file, casts them, and bulk loads into the database.
    """
    cleaned_name = clean_table_name(data.table_name)
    ext = os.path.splitext(data.original_filename)[1].lower()
    temp_filename = f"{data.file_id}{ext}"
    temp_path = os.path.join(TEMP_UPLOAD_DIR, temp_filename)
    
    if not os.path.exists(temp_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File has expired or table schema generation timed out. Please upload again."
        )
        
    try:
        # Run import service
        rows_imported = import_file_data(
            engine_conn=engine,
            file_path=temp_path,
            original_filename=data.original_filename,
            table_name=cleaned_name,
            selected_columns=data.selected_columns
        )
        
        # Clean up temporary file once imported successfully
        try:
            os.remove(temp_path)
        except Exception:
            pass
            
        return {
            "message": f"Table '{cleaned_name}' imported successfully.",
            "table_name": cleaned_name,
            "rows_imported": rows_imported
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data insertion failure: {str(e)}"
        )
