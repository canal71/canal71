from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                # Remove dead connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

# Define Models
class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    message: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    username: str
    message: str

class RadioStatus(BaseModel):
    is_live: bool = True
    current_song: str = "Compas Direct - Live Stream"
    current_artist: str = "Radio Haiti Fusion"
    listeners: int = 1247

class RadioStation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    frequency: str
    description: str
    stream_url: Optional[str] = None
    is_live: bool = True
    genre: str = "General"
    color: str = "#3b82f6"  # Default blue color
    
class RadioStationCreate(BaseModel):
    name: str
    frequency: str
    description: str
    stream_url: Optional[str] = None
    genre: str = "General"
    color: str = "#3b82f6"

# Helper function for MongoDB serialization
def prepare_for_mongo(data):
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    if isinstance(item.get('timestamp'), str):
        try:
            item['timestamp'] = datetime.fromisoformat(item['timestamp'])
        except:
            item['timestamp'] = datetime.now(timezone.utc)
    return item

# WebSocket endpoint for real-time comments
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo back for now - in production you might want to validate/process
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Radio Station API"}

@api_router.get("/radio/status")
async def get_radio_status():
    # In a real app, this would connect to your streaming server
    return RadioStatus()

@api_router.post("/comments", response_model=Comment)
async def create_comment(comment_input: CommentCreate):
    comment_dict = comment_input.dict()
    comment_obj = Comment(**comment_dict)
    
    # Prepare for MongoDB storage
    mongo_data = prepare_for_mongo(comment_obj.dict())
    await db.comments.insert_one(mongo_data)
    
    # Broadcast to WebSocket connections
    await manager.broadcast(json.dumps({
        "type": "new_comment",
        "comment": {
            "id": comment_obj.id,
            "username": comment_obj.username,
            "message": comment_obj.message,
            "timestamp": comment_obj.timestamp.isoformat()
        }
    }))
    
    return comment_obj

@api_router.get("/comments", response_model=List[Comment])
async def get_comments(limit: int = 50):
    comments_data = await db.comments.find().sort("timestamp", -1).limit(limit).to_list(length=None)
    comments = []
    for comment_data in comments_data:
        parsed_comment = parse_from_mongo(comment_data)
        comments.append(Comment(**parsed_comment))
    return list(reversed(comments))  # Return in chronological order

@api_router.delete("/comments")
async def clear_comments():
    await db.comments.delete_many({})
    await manager.broadcast(json.dumps({"type": "comments_cleared"}))
    return {"message": "All comments cleared"}

# Radio Directory Endpoints
@api_router.get("/radio-directory", response_model=List[RadioStation])
async def get_radio_directory():
    stations_data = await db.radio_stations.find().to_list(length=None)
    if not stations_data:
        # Return default stations if none exist
        default_stations = [
            {"name": "Radio Caraïbes", "frequency": "94.5 FM", "description": "Musique caribéenne & actualités", "genre": "Caribbean", "color": "#10b981"},
            {"name": "Radio Métropole", "frequency": "100.1 FM", "description": "Talk-show & informations", "genre": "Talk", "color": "#8b5cf6"},
            {"name": "Radio Kiskeya", "frequency": "88.5 FM", "description": "Nouvelles & culture", "genre": "News", "color": "#f59e0b"},
            {"name": "Radio Lumière", "frequency": "91.9 FM", "description": "Musique gospel & spirituel", "genre": "Gospel", "color": "#eab308"},
            {"name": "Magik9", "frequency": "99.9 FM", "description": "Hip-hop & musique urbaine", "genre": "Hip-Hop", "color": "#14b8a6"}
        ]
        return [RadioStation(**station) for station in default_stations]
    
    return [RadioStation(**station_data) for station_data in stations_data]

@api_router.post("/radio-directory", response_model=RadioStation)
async def add_radio_station(station_input: RadioStationCreate):
    station_dict = station_input.dict()
    station_obj = RadioStation(**station_dict)
    
    # Prepare for MongoDB storage
    mongo_data = prepare_for_mongo(station_obj.dict())
    await db.radio_stations.insert_one(mongo_data)
    
    return station_obj

@api_router.delete("/radio-directory/{station_id}")
async def delete_radio_station(station_id: str):
    result = await db.radio_stations.delete_one({"id": station_id})
    if result.deleted_count == 0:
        return {"error": "Station not found"}
    return {"message": "Station deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()