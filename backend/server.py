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
    album: Optional[str] = "Live Session"
    artwork_url: Optional[str] = None
    duration: Optional[str] = None
    genre: Optional[str] = "Compas"

class NowPlaying(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    song: str
    artist: str
    album: Optional[str] = None
    artwork_url: Optional[str] = None
    duration: Optional[str] = None
    genre: Optional[str] = "General"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NowPlayingUpdate(BaseModel):
    song: str
    artist: str
    album: Optional[str] = None
    artwork_url: Optional[str] = None
    duration: Optional[str] = None
    genre: Optional[str] = "General"

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

class WeatherData(BaseModel):
    location: str = "Port-au-Prince, Haiti"
    temperature: float = 28.5
    condition: str = "Ensoleillé"
    humidity: int = 72
    wind_speed: float = 15.2
    icon: str = "☀️"

class NewsArticle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    source: str
    published_at: str
    url: Optional[str] = None
    image_url: Optional[str] = None

class StationInfo(BaseModel):
    station_name: str = "Radio Haiti Fusion"
    tagline: str = "La radio qui va loin"
    description: str = "Radio Haiti Fusion est votre station de radio préférée, diffusant le meilleur de la musique haïtienne et internationale 24h/24. Depuis notre création, nous nous engageons à promouvoir la culture haïtienne tout en restant connectés au monde."
    founded_year: int = 2020
    frequency: str = "FM 104.5 MHz"
    location: str = "Port-au-Prince, Haïti"
    mission: str = "Divertir, informer et rassembler la communauté haïtienne à travers une programmation de qualité."
    contact_email: str = "info@radiohaitifusion.com"
    contact_phone: str = "+509 xxxx-xxxx"

class DonationInfo(BaseModel):
    title: str = "Soutenez Radio Haiti Fusion"
    description: str = "Votre soutien nous aide à continuer notre mission de diffusion d'une programmation de qualité pour la communauté haïtienne."
    goal_amount: Optional[float] = 5000.0
    current_amount: Optional[float] = 1250.0
    currency: str = "USD"
    payment_methods: List[str] = ["PayPal", "Zelle", "MonCash", "Carte de crédit"]
    paypal_email: Optional[str] = "fusionviberadio@gmail.com"
    moncash_number: Optional[str] = "+509 xxxx-xxxx"

class DJ(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    stage_name: str
    bio: str
    photo_url: Optional[str] = None
    specialty: str = "Compas & Hip-Hop"
    years_experience: int = 3
    social_media: Optional[dict] = {}
    schedule: Optional[str] = "Lundi - Vendredi"
    is_active: bool = True

class Show(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    host_dj: str
    day_of_week: str  # "Lundi", "Mardi", etc.
    start_time: str   # "08:00"
    end_time: str     # "10:00"
    genre: str = "Variété"
    is_live: bool = False

class DJCreate(BaseModel):
    name: str
    stage_name: str
    bio: str
    photo_url: Optional[str] = None
    specialty: str = "Compas & Hip-Hop"
    years_experience: int = 3
    social_media: Optional[dict] = {}
    schedule: Optional[str] = "Lundi - Vendredi"

class ShowCreate(BaseModel):
    name: str
    description: str
    host_dj: str
    day_of_week: str
    start_time: str
    end_time: str
    genre: str = "Variété"

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
    return RadioStatus(
        current_song="Mwen Renmen'w",
        current_artist="T-Vice",
        album="Best of Compas",
        artwork_url="https://i.scdn.co/image/ab67616d0000b273f3b7b9a1b5b2c1e8d4c0b2a1",
        duration="4:32",
        genre="Compas"
    )

@api_router.get("/now-playing", response_model=NowPlaying)
async def get_now_playing():
    # Get the current song info - in production, this would come from your streaming server
    current_playing = NowPlaying(
        song="Mwen Renmen'w",
        artist="T-Vice",
        album="Best of Compas",
        artwork_url="https://i.scdn.co/image/ab67616d0000b273f3b7b9a1b5b2c1e8d4c0b2a1",
        duration="4:32",
        genre="Compas"
    )
    return current_playing

@api_router.post("/now-playing", response_model=NowPlaying)
async def update_now_playing(track_info: NowPlayingUpdate):
    # Update current playing track - useful for DJ management
    track_dict = track_info.dict()
    now_playing_obj = NowPlaying(**track_dict)
    
    # Store in database for history
    mongo_data = prepare_for_mongo(now_playing_obj.dict())
    await db.now_playing.insert_one(mongo_data)
    
    # Broadcast to WebSocket connections
    await manager.broadcast(json.dumps({
        "type": "now_playing_update",
        "track": {
            "song": now_playing_obj.song,
            "artist": now_playing_obj.artist,
            "album": now_playing_obj.album,
            "artwork_url": now_playing_obj.artwork_url,
            "duration": now_playing_obj.duration,
            "genre": now_playing_obj.genre
        }
    }))
    
    return now_playing_obj

@api_router.get("/now-playing/history", response_model=List[NowPlaying])
async def get_playing_history(limit: int = 10):
    # Get recently played tracks
    tracks_data = await db.now_playing.find().sort("timestamp", -1).limit(limit).to_list(length=None)
    tracks = []
    for track_data in tracks_data:
        parsed_track = parse_from_mongo(track_data)
        tracks.append(NowPlaying(**parsed_track))
    return tracks

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

# Weather API Endpoint
@api_router.get("/weather")
async def get_weather():
    # Haiti-specific weather data
    # In production, this would connect to a weather API like OpenWeatherMap for Haiti
    import random
    
    # Sample weather conditions typical for Haiti
    haiti_conditions = [
        {"condition": "Ensoleillé", "icon": "☀️", "temp_range": (26, 32)},
        {"condition": "Partiellement nuageux", "icon": "⛅", "temp_range": (24, 29)},
        {"condition": "Orageux", "icon": "⛈️", "temp_range": (22, 28)},
        {"condition": "Pluie légère", "icon": "🌦️", "temp_range": (21, 26)},
        {"condition": "Nuageux", "icon": "☁️", "temp_range": (23, 28)}
    ]
    
    current_condition = random.choice(haiti_conditions)
    temp = random.uniform(current_condition["temp_range"][0], current_condition["temp_range"][1])
    
    return WeatherData(
        location="Haïti",
        temperature=round(temp, 1),
        condition=current_condition["condition"],
        humidity=random.randint(65, 85),  # Typical for tropical climate
        wind_speed=round(random.uniform(10, 25), 1),  # km/h
        icon=current_condition["icon"]
    )

@api_router.get("/weather/cities")
async def get_haiti_cities_weather():
    # Multiple Haitian cities weather
    cities_weather = []
    haiti_cities = [
        "Port-au-Prince", "Cap-Haïtien", "Gonaïves", "Saint-Marc", 
        "Petit-Goâve", "Jacmel", "Les Cayes", "Fort-de-Paix"
    ]
    
    conditions = ["Ensoleillé", "Partiellement nuageux", "Nuageux", "Orageux"]
    icons = ["☀️", "⛅", "☁️", "⛈️"]
    
    for city in haiti_cities:
        import random
        condition_idx = random.randint(0, len(conditions)-1)
        cities_weather.append({
            "city": city,
            "temperature": round(random.uniform(24, 32), 1),
            "condition": conditions[condition_idx],
            "icon": icons[condition_idx]
        })
    
    return cities_weather

# World News API Endpoints
@api_router.get("/news", response_model=List[NewsArticle])
async def get_world_news():
    # In production, this would connect to news APIs like NewsAPI, Reuters, etc.
    # Sample world news data
    sample_news = [
        {
            "title": "Sommet climatique mondial: nouveaux accords sur les énergies renouvelables",
            "description": "Les dirigeants mondiaux s'accordent sur de nouveaux objectifs ambitieux pour réduire les émissions de carbone d'ici 2030.",
            "source": "Reuters",
            "published_at": "2024-09-24T14:30:00Z",
            "url": "https://example.com/news1",
            "image_url": "https://via.placeholder.com/300x200?text=Climate+Summit"
        },
        {
            "title": "Avancées technologiques: l'IA révolutionne la médecine",
            "description": "De nouvelles applications d'intelligence artificielle promettent d'améliorer le diagnostic médical.",
            "source": "BBC News",
            "published_at": "2024-09-24T12:15:00Z",
            "url": "https://example.com/news2",
            "image_url": "https://via.placeholder.com/300x200?text=AI+Medicine"
        },
        {
            "title": "Économie mondiale: croissance stable malgré les défis",
            "description": "Le FMI révise ses prévisions économiques avec un optimisme prudent pour 2024.",
            "source": "Financial Times",
            "published_at": "2024-09-24T10:45:00Z",
            "url": "https://example.com/news3",
            "image_url": "https://via.placeholder.com/300x200?text=World+Economy"
        },
        {
            "title": "Exploration spatiale: nouvelle mission vers Mars",
            "description": "La NASA annonce une mission ambitieuse pour explorer la surface martienne.",
            "source": "CNN",
            "published_at": "2024-09-24T08:20:00Z",
            "url": "https://example.com/news4",
            "image_url": "https://via.placeholder.com/300x200?text=Mars+Mission"
        }
    ]
    
    return [NewsArticle(**article) for article in sample_news]

# Station Info API
@api_router.get("/station/about")
async def get_station_info():
    return StationInfo()

# Donations API
@api_router.get("/donations/info")
async def get_donation_info():
    return DonationInfo()

# DJ Management APIs
@api_router.get("/djs", response_model=List[DJ])
async def get_djs():
    djs_data = await db.djs.find().to_list(length=None)
    if not djs_data:
        # Return sample DJs if none exist
        sample_djs = [
            {
                "name": "Kenley Pierre",
                "stage_name": "DJ Kenley",
                "bio": "Passionné de musique haïtienne depuis plus de 10 ans, DJ Kenley anime l'émission matinale avec énergie et bonne humeur.",
                "photo_url": "https://via.placeholder.com/150x150?text=DJ+Kenley",
                "specialty": "Compas & Zouk",
                "years_experience": 10,
                "social_media": {"instagram": "@djkenley", "facebook": "DJ Kenley Official"},
                "schedule": "Lundi - Vendredi 6h-10h",
                "is_active": True
            },
            {
                "name": "Marie Jeanne",
                "stage_name": "DJ Marie J",
                "bio": "Experte en musique internationale et haïtienne, Marie J apporte une touche féminine unique à nos ondes.",
                "photo_url": "https://via.placeholder.com/150x150?text=DJ+Marie",
                "specialty": "R&B & Compas",
                "years_experience": 7,
                "social_media": {"instagram": "@djmariej", "twitter": "@mariejradio"},
                "schedule": "Weekend 14h-18h",
                "is_active": True
            },
            {
                "name": "Jean Claude Michel",
                "stage_name": "JC Mix",
                "bio": "Producteur et DJ, JC Mix est reconnu pour ses mixes innovants mélangeant tradition et modernité.",
                "photo_url": "https://via.placeholder.com/150x150?text=JC+Mix",
                "specialty": "Hip-Hop & Rap Kreyòl",
                "years_experience": 12,
                "social_media": {"youtube": "JC Mix Official", "instagram": "@jcmixofficial"},
                "schedule": "Lundi, Mercredi, Vendredi 20h-22h",
                "is_active": True
            }
        ]
        return [DJ(**dj) for dj in sample_djs]
    
    return [DJ(**dj_data) for dj_data in djs_data]

@api_router.post("/djs", response_model=DJ)
async def create_dj(dj_input: DJCreate):
    dj_dict = dj_input.dict()
    dj_obj = DJ(**dj_dict)
    
    mongo_data = prepare_for_mongo(dj_obj.dict())
    await db.djs.insert_one(mongo_data)
    return dj_obj

# Show Schedule APIs
@api_router.get("/schedule", response_model=List[Show])
async def get_show_schedule():
    shows_data = await db.shows.find().to_list(length=None)
    if not shows_data:
        # Return sample schedule if none exists
        sample_shows = [
            {
                "name": "Réveil Konpa",
                "description": "Commencez votre journée avec les meilleurs hits compas et les dernières nouvelles",
                "host_dj": "DJ Kenley",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "06:00",
                "end_time": "10:00",
                "genre": "Compas & Actualités",
                "is_live": True
            },
            {
                "name": "Midi Mizik",
                "description": "Pause déjeuner avec un mélange de musique haïtienne et internationale",
                "host_dj": "DJ Marie J",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "12:00",
                "end_time": "14:00",
                "genre": "Variété",
                "is_live": False
            },
            {
                "name": "Sware Konpa",
                "description": "Les soirées compas avec les plus grands classiques et nouveautés",
                "host_dj": "DJ Kenley",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "18:00",
                "end_time": "20:00",
                "genre": "Compas",
                "is_live": False
            },
            {
                "name": "Weekend Vibes",
                "description": "Détente du weekend avec R&B, zouk et musique internationale",
                "host_dj": "DJ Marie J",
                "day_of_week": "Samedi-Dimanche",
                "start_time": "14:00",
                "end_time": "18:00",
                "genre": "R&B & Zouk",
                "is_live": False
            },
            {
                "name": "Nwit Rap Kreyòl",
                "description": "Soirée dédiée au rap kreyòl et hip-hop haïtien",
                "host_dj": "JC Mix",
                "day_of_week": "Lundi, Mercredi, Vendredi",
                "start_time": "20:00",
                "end_time": "22:00",
                "genre": "Rap Kreyòl",
                "is_live": False
            }
        ]
        return [Show(**show) for show in sample_shows]
    
    return [Show(**show_data) for show_data in shows_data]

@api_router.post("/schedule", response_model=Show)
async def create_show(show_input: ShowCreate):
    show_dict = show_input.dict()
    show_obj = Show(**show_dict)
    
    mongo_data = prepare_for_mongo(show_obj.dict())
    await db.shows.insert_one(mongo_data)
    return show_obj

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