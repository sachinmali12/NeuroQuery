from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.models.query_model import QueryHistory
from app.models.user_model import User

from app.routes.query_routes import router
from app.routes.auth_routes import router as auth_router
from app.routes.voice_routes import router as voice_router
from app.routes.upload_routes import router as upload_router

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Expand origins to allow local connection from any interface
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(router)
app.include_router(voice_router)
app.include_router(upload_router)


@app.get("/")
def home():
    return {
        "message": "AI SQL Query Generator Backend Running"
    }