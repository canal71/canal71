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
    promo_email: str = "haitifusionpromo@gmail.com"
    website: str = "www.radiohaitifusion.com"
    whatsapp: str = "5026017368"
    contact_phone: str = "+509 xxxx-xxxx"

class SocialMedia(BaseModel):
    platform: str
    handle: str
    url: str
    follower_count: Optional[int] = 0
    is_active: bool = True

class DonationInfo(BaseModel):
    title: str = "Soutenez Radio Haiti Fusion"
    description: str = "Votre soutien nous aide à continuer notre mission de diffusion d'une programmation de qualité pour la communauté haïtienne."
    goal_amount: Optional[float] = 5000.0
    current_amount: Optional[float] = 1250.0
    currency: str = "USD"
    payment_methods: List[str] = ["PayPal", "Zelle", "Cash App", "MonCash", "Carte de crédit"]
    paypal_email: Optional[str] = "fusionviberadio@gmail.com"
    zelle_email: Optional[str] = "fusionviberadio@gmail.com"
    cashapp_number: Optional[str] = "5026017368"
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

class SongRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listener_name: str
    song_title: str
    artist: str
    dedication_to: Optional[str] = None
    dedication_message: Optional[str] = None
    status: str = "pending"  # pending, approved, played
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SongRequestCreate(BaseModel):
    listener_name: str
    song_title: str
    artist: str
    dedication_to: Optional[str] = None
    dedication_message: Optional[str] = None

class VoiceMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listener_name: str
    message_type: str = "vocal_request"  # vocal_request, dedication, shoutout
    audio_data: Optional[str] = None  # Base64 encoded audio
    duration: Optional[float] = None  # Duration in seconds
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"  # pending, approved, played
    transcription: Optional[str] = None

class VoiceMessageCreate(BaseModel):
    listener_name: str
    message_type: str = "vocal_request"
    audio_data: str  # Base64 encoded audio
    duration: Optional[float] = None

# Top 10 Charts Models
class ChartEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    song_title: str
    artist: str
    album: Optional[str] = None
    genre: Optional[str] = None
    position: int
    previous_position: Optional[int] = None
    votes: int = 0
    request_count: int = 0
    chart_category: str = "most_requested"  # most_requested, haitian_hits, international, compas, zouk
    artwork_url: Optional[str] = None
    spotify_url: Optional[str] = None
    youtube_url: Optional[str] = None
    weeks_on_chart: int = 1
    peak_position: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChartEntryCreate(BaseModel):
    song_title: str
    artist: str
    album: Optional[str] = None
    genre: Optional[str] = None
    chart_category: str = "most_requested"
    artwork_url: Optional[str] = None
    spotify_url: Optional[str] = None
    youtube_url: Optional[str] = None

class ChartVote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chart_entry_id: str
    listener_name: str
    chart_category: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Trivia Game Models
class TriviaQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int  # Index of correct option
    category: str = "haitian_music"  # haitian_music, haitian_culture, general_music, radio_fusion
    difficulty: str = "medium"  # easy, medium, hard
    explanation: Optional[str] = None
    image_url: Optional[str] = None
    points: int = 10

class TriviaGame(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str
    questions: List[TriviaQuestion]
    current_question: int = 0
    score: int = 0
    lives: int = 3
    category: str = "mixed"
    status: str = "active"  # active, completed, abandoned
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class TriviaAnswer(BaseModel):
    game_id: str
    question_id: str
    selected_answer: int
    is_correct: bool
    points_earned: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LiveStats(BaseModel):
    current_listeners: int = 1247
    peak_today: int = 1856
    total_requests: int = 23
    countries_listening: List[str] = ["Haiti", "USA", "Canada", "France", "Dominican Republic"]

class EmergencyAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    urgency: str = "medium"  # low, medium, high
    is_active: bool = True
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LiveStudioStatus(BaseModel):
    is_live: bool = True
    dj_name: str = "DJ Kenley"
    show_name: str = "Compas Direct Live"
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    studio_location: str = "Studio Principal"
    next_break: Optional[str] = "20:30"
    live_callers: int = 0
    
class LiveStudioUpdate(BaseModel):
    is_live: bool
    dj_name: Optional[str] = None
    show_name: Optional[str] = None
    studio_location: str = "Studio Principal"

class VideoStream(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    stream_url: str
    stream_type: str = "hls"  # hls, rtmp, youtube, facebook
    quality: str = "720p"
    is_active: bool = True
    title: str = "Radio Haiti Fusion Live TV"
    description: str = "Diffusion en direct depuis nos studios"

class VideoStreamStatus(BaseModel):
    is_streaming: bool = True
    video_url: Optional[str] = "https://www.youtube.com/embed/jfKfPfyJRdk"  # Sample live stream
    audio_url: str = "http://xtremeradiohosting.com:8076"
    mode: str = "video"  # video, audio_only
    viewers: int = 892
    chat_enabled: bool = True
    recording: bool = False
    cameras: List[str] = ["Studio Principal", "Studio 2", "Extérieur"]
    current_camera: str = "Studio Principal"

class PromotionalVideo(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    video_url: str
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    category: str = "promotion"  # promotion, interview, concert, behind_scenes
    view_count: int = 0
    likes: int = 0
    upload_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_featured: bool = False

class VideoUpload(BaseModel):
    title: str
    description: str
    video_url: str
    thumbnail_url: Optional[str] = None
    duration: Optional[str] = None
    category: str = "promotion"
    is_featured: bool = False

class Advertisement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    advertiser: str
    duration_seconds: int = 5  # How long to show this ad
    is_active: bool = True
    ad_type: str = "banner"  # banner, video, text
    target_audience: str = "general"
    impressions: int = 0
    clicks: int = 0

class AdCreate(BaseModel):
    title: str
    description: str
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    advertiser: str
    duration_seconds: int = 5
    ad_type: str = "banner"
    target_audience: str = "general"

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
    return StationInfo(
        promo_email="haitifusionpromo@gmail.com",
        website="www.radiohaitifusion.com",
        whatsapp="5026017368"
    )

# Social Media API
@api_router.get("/social-media")
async def get_social_media():
    # Return social media platforms for Radio Haiti Fusion
    social_platforms = [
        {
            "platform": "WhatsApp",
            "handle": "5026017368",
            "url": "https://wa.me/5026017368",
            "follower_count": 1500,
            "is_active": True
        },
        {
            "platform": "Facebook",
            "handle": "@RadioHaitiFusion",
            "url": "https://facebook.com/RadioHaitiFusion",
            "follower_count": 8500,
            "is_active": True
        },
        {
            "platform": "Instagram",
            "handle": "@radiohaitifusion",
            "url": "https://instagram.com/radiohaitifusion",
            "follower_count": 5200,
            "is_active": True
        },
        {
            "platform": "Twitter",
            "handle": "@RadioHaitiFusion",
            "url": "https://twitter.com/RadioHaitiFusion",
            "follower_count": 3100,
            "is_active": True
        },
        {
            "platform": "YouTube",
            "handle": "Radio Haiti Fusion",
            "url": "https://youtube.com/@RadioHaitiFusion",
            "follower_count": 2800,
            "is_active": True
        },
        {
            "platform": "TikTok",
            "handle": "@radiohaitifusion",
            "url": "https://tiktok.com/@radiohaitifusion",
            "follower_count": 4600,
            "is_active": True
        }
    ]
    return [SocialMedia(**platform) for platform in social_platforms]

# Song Request System
@api_router.post("/song-requests", response_model=SongRequest)
async def create_song_request(request_input: SongRequestCreate):
    request_dict = request_input.dict()
    request_obj = SongRequest(**request_dict)
    
    mongo_data = prepare_for_mongo(request_obj.dict())
    await db.song_requests.insert_one(mongo_data)
    
    # Broadcast new request to WebSocket connections
    await manager.broadcast(json.dumps({
        "type": "new_song_request",
        "request": {
            "id": request_obj.id,
            "listener_name": request_obj.listener_name,
            "song_title": request_obj.song_title,
            "artist": request_obj.artist,
            "dedication_to": request_obj.dedication_to,
            "dedication_message": request_obj.dedication_message
        }
    }))
    
    return request_obj

@api_router.get("/song-requests", response_model=List[SongRequest])
async def get_song_requests(status: str = "pending", limit: int = 10):
    requests_data = await db.song_requests.find({"status": status}).sort("timestamp", 1).limit(limit).to_list(length=None)
    requests = []
    for request_data in requests_data:
        parsed_request = parse_from_mongo(request_data)
        requests.append(SongRequest(**parsed_request))
    return requests

# Live Statistics
@api_router.get("/stats/live")
async def get_live_stats():
    import random
    return LiveStats(
        current_listeners=random.randint(800, 1500),
        peak_today=random.randint(1500, 2000),
        total_requests=random.randint(15, 50),
        countries_listening=["Haiti", "USA", "Canada", "France", "Dominican Republic", "Brazil"]
    )

# Emergency Alerts System
@api_router.get("/alerts/emergency")
async def get_emergency_alerts():
    # Sample emergency alert for Haiti
    sample_alerts = [
        {
            "title": "Météo: Alerte Pluie",
            "message": "Fortes pluies prévues ce soir à Port-au-Prince. Soyez prudents sur les routes.",
            "urgency": "medium",
            "is_active": True
        }
    ]
    return [EmergencyAlert(**alert) for alert in sample_alerts]

# Popular Songs Tracking
@api_router.get("/stats/popular-songs")
async def get_popular_songs():
    popular_tracks = [
        {"title": "Mwen Renmen'w", "artist": "T-Vice", "requests": 15, "plays": 8},
        {"title": "Pa Manyen", "artist": "Boukman Eksperyans", "requests": 12, "plays": 6},
        {"title": "Kite Mwen Viv", "artist": "Sweet Micky", "requests": 10, "plays": 5},
        {"title": "Haiti Cherie", "artist": "Tabou Combo", "requests": 9, "plays": 7},
        {"title": "Sispann", "artist": "Carimi", "requests": 8, "plays": 4}
    ]
    return popular_tracks

# Live Studio Status
@api_router.get("/studio/status")
async def get_studio_status():
    return LiveStudioStatus(
        is_live=True,
        dj_name="DJ Kenley",
        show_name="Compas Direct Live",
        studio_location="Studio Principal",
        next_break="20:30",
        live_callers=0
    )

@api_router.post("/studio/status")
async def update_studio_status(status_update: LiveStudioUpdate):
    # Update studio status - for DJ use
    studio_status = LiveStudioStatus(
        is_live=status_update.is_live,
        dj_name=status_update.dj_name or "DJ",
        show_name=status_update.show_name or "Live Show",
        studio_location=status_update.studio_location
    )
    
    # Broadcast studio status change to all listeners
    await manager.broadcast(json.dumps({
        "type": "studio_status_update",
        "status": {
            "is_live": studio_status.is_live,
            "dj_name": studio_status.dj_name,
            "show_name": studio_status.show_name,
            "studio_location": studio_status.studio_location,
            "started_at": studio_status.started_at.isoformat()
        }
    }))
    
    return studio_status

# Video Streaming APIs
@api_router.get("/video/status")
async def get_video_stream_status():
    return VideoStreamStatus(
        is_streaming=True,
        video_url="https://www.youtube.com/embed/jfKfPfyJRdk",  # Replace with your stream
        audio_url="http://xtremeradiohosting.com:8076",
        mode="video",
        viewers=892,
        chat_enabled=True,
        recording=False,
        cameras=["Studio Principal", "Studio 2", "Extérieur"],
        current_camera="Studio Principal"
    )

@api_router.get("/video/streams")
async def get_video_streams():
    # Available video stream sources
    streams = [
        {
            "stream_url": "https://www.youtube.com/embed/jfKfPfyJRdk",
            "stream_type": "youtube",
            "quality": "1080p",
            "title": "Studio Principal - HD",
            "description": "Caméra principale du studio radio"
        },
        {
            "stream_url": "rtmp://live.twitch.tv/live/YOUR_STREAM_KEY",
            "stream_type": "rtmp", 
            "quality": "720p",
            "title": "Twitch Live",
            "description": "Diffusion simultanée sur Twitch"
        },
        {
            "stream_url": "https://www.facebook.com/plugins/video.php?href=YOUR_FB_VIDEO",
            "stream_type": "facebook",
            "quality": "720p", 
            "title": "Facebook Live",
            "description": "Diffusion simultanée sur Facebook"
        }
    ]
    return [VideoStream(**stream) for stream in streams]

@api_router.post("/video/switch-camera")
async def switch_camera(camera_name: str):
    # Switch between camera feeds
    camera_urls = {
        "Studio Principal": "https://www.youtube.com/embed/jfKfPfyJRdk",
        "Studio 2": "https://www.youtube.com/embed/SECONDARY_STREAM_ID", 
        "Extérieur": "https://www.youtube.com/embed/OUTDOOR_STREAM_ID"
    }
    
    new_url = camera_urls.get(camera_name, camera_urls["Studio Principal"])
    
    # Broadcast camera switch to all viewers
    await manager.broadcast(json.dumps({
        "type": "camera_switch",
        "camera": camera_name,
        "video_url": new_url
    }))
    
    return {"message": f"Switched to {camera_name}", "video_url": new_url}

@api_router.post("/video/toggle-mode")
async def toggle_streaming_mode(mode: str):  # video or audio_only
    # Switch between video and audio-only mode
    await manager.broadcast(json.dumps({
        "type": "mode_switch", 
        "mode": mode
    }))
    
    return {"message": f"Switched to {mode} mode", "mode": mode}

# Promotional Videos API
@api_router.get("/videos/promotional", response_model=List[PromotionalVideo])
async def get_promotional_videos(category: Optional[str] = None, limit: int = 12):
    videos_data = await db.promotional_videos.find().sort("upload_date", -1).limit(limit).to_list(length=None)
    
    if not videos_data:
        # Sample promotional videos
        sample_videos = [
            {
                "title": "Radio Haiti Fusion - Promo Officiel 2024",
                "description": "Découvrez la nouvelle saison de Radio Haiti Fusion avec une programmation exceptionnelle!",
                "video_url": "https://www.youtube.com/embed/jfKfPfyJRdk",
                "thumbnail_url": "https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg",
                "duration": "2:45",
                "category": "promotion",
                "view_count": 15420,
                "likes": 892,
                "is_featured": True
            },
            {
                "title": "Interview Exclusive - T-Vice sur Radio Haiti Fusion",
                "description": "Rencontre avec le groupe T-Vice dans nos studios pour parler de leur nouvel album.",
                "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
                "duration": "15:30",
                "category": "interview", 
                "view_count": 8750,
                "likes": 567,
                "is_featured": False
            },
            {
                "title": "Concert Live - Boukman Eksperyans",
                "description": "Performance live exceptionnelle de Boukman Eksperyans en direct de nos studios.",
                "video_url": "https://www.youtube.com/embed/9bZkp7q19f0",
                "thumbnail_url": "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
                "duration": "45:20",
                "category": "concert",
                "view_count": 12340,
                "likes": 743,
                "is_featured": True
            },
            {
                "title": "Dans les Coulisses - Studio Radio Haiti Fusion",
                "description": "Découvrez l'envers du décor et l'équipe qui fait vibrer Radio Haiti Fusion chaque jour.",
                "video_url": "https://www.youtube.com/embed/ScMzIvxBSi4",
                "thumbnail_url": "https://i.ytimg.com/vi/ScMzIvxBSi4/maxresdefault.jpg",
                "duration": "8:15",
                "category": "behind_scenes",
                "view_count": 5680,
                "likes": 234,
                "is_featured": False
            },
            {
                "title": "DJ Kenley - Mix Compas 2024",
                "description": "Le meilleur du compas mixé par DJ Kenley, notre animateur vedette du matin.",
                "video_url": "https://www.youtube.com/embed/kJQP7kiw5Fk",
                "thumbnail_url": "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
                "duration": "25:00",
                "category": "promotion",
                "view_count": 9870,
                "likes": 456,
                "is_featured": False
            },
            {
                "title": "Festival Compas - Highlights 2024",
                "description": "Les meilleurs moments du Festival Compas 2024 avec la couverture exclusive de RHF.",
                "video_url": "https://www.youtube.com/embed/L_jWHffIx5E",
                "thumbnail_url": "https://i.ytimg.com/vi/L_jWHffIx5E/maxresdefault.jpg", 
                "duration": "12:45",
                "category": "concert",
                "view_count": 18950,
                "likes": 1120,
                "is_featured": True
            }
        ]
        return [PromotionalVideo(**video) for video in sample_videos]
    
    videos = []
    for video_data in videos_data:
        parsed_video = parse_from_mongo(video_data)
        videos.append(PromotionalVideo(**parsed_video))
    
    if category:
        videos = [v for v in videos if v.category == category]
    
    return videos

@api_router.post("/videos/promotional", response_model=PromotionalVideo)
async def upload_promotional_video(video_input: VideoUpload):
    video_dict = video_input.dict()
    video_obj = PromotionalVideo(**video_dict)
    
    mongo_data = prepare_for_mongo(video_obj.dict())
    await db.promotional_videos.insert_one(mongo_data)
    
    return video_obj

@api_router.get("/videos/featured")
async def get_featured_videos():
    videos_data = await db.promotional_videos.find({"is_featured": True}).sort("upload_date", -1).limit(3).to_list(length=None)
    
    if not videos_data:
        # Return sample featured videos
        featured = [
            {
                "title": "Radio Haiti Fusion - Promo Officiel 2024",
                "video_url": "https://www.youtube.com/embed/jfKfPfyJRdk",
                "view_count": 15420,
                "category": "promotion"
            }
        ]
        return [PromotionalVideo(**video) for video in featured]
    
    return [PromotionalVideo(**parse_from_mongo(video)) for video in videos_data]

# Advertisement Carousel API
@api_router.get("/ads/banners", response_model=List[Advertisement])
async def get_advertisement_banners():
    ads_data = await db.advertisements.find({"is_active": True}).to_list(length=None)
    
    if not ads_data:
        # Sample advertisements
        sample_ads = [
            {
                "title": "Publicité avec Radio Haiti Fusion!",
                "description": "Atteignez des milliers d'auditeurs chaque jour avec nos espaces publicitaires premium.",
                "image_url": "https://via.placeholder.com/800x300/FF6B35/FFFFFF?text=PUBLICITÉ+AVEC+NOUS",
                "link_url": "mailto:haitifusionpromo@gmail.com",
                "advertiser": "Radio Haiti Fusion",
                "duration_seconds": 6,
                "ad_type": "banner",
                "target_audience": "general",
                "impressions": 12500,
                "clicks": 234
            },
            {
                "title": "Supportez la Culture Haïtienne",
                "description": "Vos dons nous aident à promouvoir la musique et la culture haïtiennes dans le monde entier.",
                "image_url": "https://via.placeholder.com/800x300/1E40AF/FFFFFF?text=SOUTENEZ+NOUS+🇭🇹",
                "link_url": "https://paypal.me/fusionviberadio",
                "advertiser": "Radio Haiti Fusion",
                "duration_seconds": 5,
                "ad_type": "banner",
                "target_audience": "diaspora",
                "impressions": 8900,
                "clicks": 445
            },
            {
                "title": "Écoutez-nous Partout!",
                "description": "Radio Haiti Fusion maintenant disponible sur toutes les plateformes. TV, Radio, et plus!",
                "image_url": "https://via.placeholder.com/800x300/059669/FFFFFF?text=📻+RADIO+📺+TV+📱+MOBILE",
                "link_url": "https://www.radiohaitifusion.com",
                "advertiser": "Radio Haiti Fusion",
                "duration_seconds": 4,
                "ad_type": "banner", 
                "target_audience": "general",
                "impressions": 15670,
                "clicks": 687
            },
            {
                "title": "Votre Entreprise Ici!",
                "description": "Réservez votre espace publicitaire et rejoignez nos partenaires de confiance.",
                "image_url": "https://via.placeholder.com/800x300/7C3AED/FFFFFF?text=VOTRE+PUB+ICI+💼",
                "link_url": "mailto:haitifusionpromo@gmail.com",
                "advertiser": "Disponible",
                "duration_seconds": 5,
                "ad_type": "banner",
                "target_audience": "business",
                "impressions": 7520,
                "clicks": 189
            },
            {
                "title": "Rejoignez Notre Communauté",
                "description": "Suivez-nous sur les réseaux sociaux pour ne rien manquer de l'actualité RHF!",
                "image_url": "https://via.placeholder.com/800x300/DC2626/FFFFFF?text=SUIVEZ+NOUS+📱+RÉSEAUX+SOCIAUX",
                "link_url": "https://facebook.com/RadioHaitiFusion",
                "advertiser": "Radio Haiti Fusion",
                "duration_seconds": 4,
                "ad_type": "banner",
                "target_audience": "social",
                "impressions": 11200,
                "clicks": 523
            }
        ]
        return [Advertisement(**ad) for ad in sample_ads]
    
    return [Advertisement(**parse_from_mongo(ad)) for ad in ads_data]

@api_router.post("/ads/banners", response_model=Advertisement)
async def create_advertisement(ad_input: AdCreate):
    ad_dict = ad_input.dict()
    ad_obj = Advertisement(**ad_dict)
    
    mongo_data = prepare_for_mongo(ad_obj.dict())
    await db.advertisements.insert_one(mongo_data)
    
    return ad_obj

@api_router.post("/ads/{ad_id}/click")
async def track_ad_click(ad_id: str):
    # Track ad click for analytics
    await db.advertisements.update_one(
        {"id": ad_id},
        {"$inc": {"clicks": 1}}
    )
    return {"message": "Click tracked"}

@api_router.post("/ads/{ad_id}/impression")  
async def track_ad_impression(ad_id: str):
    # Track ad impression for analytics
    await db.advertisements.update_one(
        {"id": ad_id},
        {"$inc": {"impressions": 1}}
    )
    return {"message": "Impression tracked"}

# Voice Messages API
@api_router.post("/voice-messages", response_model=VoiceMessage)
async def create_voice_message(voice_input: VoiceMessageCreate):
    voice_dict = voice_input.dict()
    voice_obj = VoiceMessage(**voice_dict)
    
    mongo_data = prepare_for_mongo(voice_obj.dict())
    await db.voice_messages.insert_one(mongo_data)
    
    # Broadcast new voice message to WebSocket connections
    await manager.broadcast(json.dumps({
        "type": "new_voice_message",
        "message": {
            "id": voice_obj.id,
            "listener_name": voice_obj.listener_name,
            "message_type": voice_obj.message_type,
            "duration": voice_obj.duration,
            "timestamp": voice_obj.timestamp.isoformat()
        }
    }))
    
    return voice_obj

@api_router.get("/voice-messages", response_model=List[VoiceMessage])
async def get_voice_messages(status: str = "pending", limit: int = 10):
    messages_data = await db.voice_messages.find({"status": status}).sort("timestamp", 1).limit(limit).to_list(length=None)
    messages = []
    for message_data in messages_data:
        parsed_message = parse_from_mongo(message_data)
        # Don't return audio_data in list view for performance
        parsed_message["audio_data"] = None
        messages.append(VoiceMessage(**parsed_message))
    return messages

@api_router.get("/voice-messages/{message_id}/audio")
async def get_voice_message_audio(message_id: str):
    message_data = await db.voice_messages.find_one({"id": message_id})
    if not message_data or not message_data.get("audio_data"):
        return {"error": "Audio not found"}
    return {"audio_data": message_data["audio_data"]}

# Donations API
@api_router.get("/donations/info")
async def get_donation_info():
    return DonationInfo(
        paypal_email="fusionviberadio@gmail.com",
        payment_methods=["PayPal", "Zelle", "Cash App", "MonCash", "Carte de crédit"],
        zelle_email="fusionviberadio@gmail.com",
        cashapp_number="5026017368"
    )

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

# Top 10 Charts API
@api_router.get("/charts/{category}", response_model=List[ChartEntry])
async def get_chart(category: str = "most_requested", limit: int = 10):
    """Get Top 10 charts by category"""
    charts_data = await db.charts.find({"chart_category": category}).sort("position", 1).limit(limit).to_list(length=None)
    
    if not charts_data:
        # Return sample chart data
        sample_charts = []
        if category == "most_requested":
            songs = [
                {"song_title": "Mwen Renmen'w", "artist": "T-Vice", "votes": 245, "request_count": 89, "position": 1},
                {"song_title": "Pa Manyen", "artist": "Boukman Eksperyans", "votes": 210, "request_count": 76, "position": 2},
                {"song_title": "Kite Mwen Viv", "artist": "Sweet Micky", "votes": 198, "request_count": 69, "position": 3},
                {"song_title": "Map Viv Lavi Mwen", "artist": "Tabou Combo", "votes": 187, "request_count": 61, "position": 4},
                {"song_title": "Ayiti", "artist": "BIC", "votes": 175, "request_count": 58, "position": 5},
                {"song_title": "Konpa Love", "artist": "Carimi", "votes": 164, "request_count": 52, "position": 6},
                {"song_title": "Mwen Bezwen'w", "artist": "Krezi Mizik", "votes": 151, "request_count": 47, "position": 7},
                {"song_title": "Cheri", "artist": "Zin", "votes": 142, "request_count": 44, "position": 8},
                {"song_title": "Lanmou San Fen", "artist": "Djakout Mizik", "votes": 138, "request_count": 41, "position": 9},
                {"song_title": "Peze Kafe", "artist": "Boukan Ginen", "votes": 129, "request_count": 38, "position": 10}
            ]
        elif category == "haitian_hits":
            songs = [
                {"song_title": "Ayiti Cheri", "artist": "Manman Brigit", "votes": 189, "request_count": 0, "position": 1},
                {"song_title": "Nou La", "artist": "BIC", "votes": 176, "request_count": 0, "position": 2},
                {"song_title": "Konpa Gonaives", "artist": "Septentrional", "votes": 165, "request_count": 0, "position": 3},
                {"song_title": "Map Marye", "artist": "Tabou Combo", "votes": 154, "request_count": 0, "position": 4},
                {"song_title": "Kanga", "artist": "Boukman Eksperyans", "votes": 143, "request_count": 0, "position": 5}
            ]
        else:
            songs = []
            
        for song in songs:
            song.update({
                "chart_category": category,
                "genre": "Compas",
                "weeks_on_chart": 3,
                "peak_position": song["position"],
                "previous_position": song["position"] + 1 if song["position"] < 10 else None
            })
            sample_charts.append(ChartEntry(**song))
        return sample_charts
    
    return [ChartEntry(**parse_from_mongo(chart)) for chart in charts_data]

@api_router.post("/charts/{category}/vote")
async def vote_for_song(category: str, song_title: str, artist: str, listener_name: str):
    """Vote for a song in the charts"""
    # Check if song exists in charts
    existing_entry = await db.charts.find_one({"song_title": song_title, "artist": artist, "chart_category": category})
    
    if existing_entry:
        # Increment votes
        await db.charts.update_one(
            {"song_title": song_title, "artist": artist, "chart_category": category},
            {"$inc": {"votes": 1}}
        )
    else:
        # Create new chart entry
        new_entry = ChartEntry(
            song_title=song_title,
            artist=artist,
            chart_category=category,
            position=11,  # Start outside top 10
            votes=1,
            peak_position=11
        )
        await db.charts.insert_one(prepare_for_mongo(new_entry.dict()))
    
    # Record the vote
    vote = ChartVote(
        chart_entry_id=existing_entry.get("id") if existing_entry else "",
        listener_name=listener_name,
        chart_category=category
    )
    await db.chart_votes.insert_one(prepare_for_mongo(vote.dict()))
    
    return {"message": "Vote recorded successfully"}

@api_router.get("/charts/categories")
async def get_chart_categories():
    """Get available chart categories"""
    return {
        "categories": [
            {"id": "most_requested", "name": "Plus Demandées", "description": "Chansons les plus demandées par nos auditeurs"},
            {"id": "haitian_hits", "name": "Hits Haïtiens", "description": "Les meilleurs tubes haïtiens du moment"},
            {"id": "compas", "name": "Top Compas", "description": "Meilleurs morceaux compas"},
            {"id": "zouk", "name": "Top Zouk", "description": "Meilleurs morceaux zouk"},
            {"id": "international", "name": "International", "description": "Hits internationaux populaires"}
        ]
    }

# Trivia Game API
@api_router.get("/trivia/questions/{category}")
async def get_trivia_questions(category: str = "mixed", limit: int = 10):
    """Get trivia questions by category"""
    if category == "mixed":
        questions_data = await db.trivia_questions.aggregate([{"$sample": {"size": limit}}]).to_list(length=None)
    else:
        questions_data = await db.trivia_questions.find({"category": category}).limit(limit).to_list(length=None)
    
    if not questions_data:
        # Return sample trivia questions
        sample_questions = [
            {
                "question": "Quel est le rythme musical traditionnel le plus populaire d'Haïti?",
                "options": ["Merengue", "Compas", "Salsa", "Bachata"],
                "correct_answer": 1,
                "category": "haitian_music",
                "explanation": "Le compas (ou konpa) est le rythme musical traditionnel le plus populaire d'Haïti, créé dans les années 1950."
            },
            {
                "question": "Qui est considéré comme le 'Roi du Compas'?",
                "options": ["Tabou Combo", "Nemours Jean-Baptiste", "Sweet Micky", "T-Vice"],
                "correct_answer": 1,
                "category": "haitian_music",
                "explanation": "Nemours Jean-Baptiste est considéré comme le créateur et le roi du compas direct."
            },
            {
                "question": "Dans quelle ville se trouve Radio Haiti Fusion?",
                "options": ["Cap-Haïtien", "Port-au-Prince", "Les Gonaïves", "Jacmel"],
                "correct_answer": 1,
                "category": "radio_fusion",
                "explanation": "Radio Haiti Fusion diffuse depuis Port-au-Prince, la capitale d'Haïti."
            },
            {
                "question": "Quel groupe a popularisé la chanson 'Pa Manyen'?",
                "options": ["RAM", "Boukman Eksperyans", "Tabou Combo", "BIC"],
                "correct_answer": 1,
                "category": "haitian_music",
                "explanation": "Boukman Eksperyans est le groupe qui a rendu célèbre cette chanson emblématique."
            },
            {
                "question": "Quelle est la date de l'indépendance d'Haïti?",
                "options": ["1er Janvier 1804", "15 Mai 1791", "22 Septembre 1804", "1er Décembre 1803"],
                "correct_answer": 0,
                "category": "haitian_culture",
                "explanation": "Haïti a proclamé son indépendance le 1er janvier 1804, devenant la première république noire libre."
            }
        ]
        return [TriviaQuestion(**q) for q in sample_questions]
    
    return [TriviaQuestion(**parse_from_mongo(q)) for q in questions_data]

@api_router.post("/trivia/games", response_model=TriviaGame)
async def start_trivia_game(player_name: str, category: str = "mixed", difficulty: str = "medium"):
    """Start a new trivia game"""
    # Get questions for the game
    if category == "mixed":
        questions_data = await db.trivia_questions.aggregate([{"$sample": {"size": 10}}]).to_list(length=None)
    else:
        questions_data = await db.trivia_questions.find({"category": category, "difficulty": difficulty}).limit(10).to_list(length=None)
    
    if not questions_data:
        # Use sample questions if none in database
        questions_data = await get_trivia_questions(category, 10)
        questions_data = [q.dict() for q in questions_data]
    
    questions = [TriviaQuestion(**parse_from_mongo(q)) for q in questions_data]
    
    game = TriviaGame(
        player_name=player_name,
        questions=questions,
        category=category
    )
    
    mongo_data = prepare_for_mongo(game.dict())
    await db.trivia_games.insert_one(mongo_data)
    
    return game

@api_router.post("/trivia/games/{game_id}/answer")
async def answer_trivia_question(game_id: str, selected_answer: int):
    """Submit answer for current trivia question"""
    game_data = await db.trivia_games.find_one({"id": game_id})
    if not game_data:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = TriviaGame(**parse_from_mongo(game_data))
    if game.current_question >= len(game.questions):
        raise HTTPException(status_code=400, detail="Game completed")
    
    current_question = game.questions[game.current_question]
    is_correct = selected_answer == current_question.correct_answer
    points_earned = current_question.points if is_correct else 0
    
    # Record answer
    answer = TriviaAnswer(
        game_id=game_id,
        question_id=current_question.id,
        selected_answer=selected_answer,
        is_correct=is_correct,
        points_earned=points_earned
    )
    await db.trivia_answers.insert_one(prepare_for_mongo(answer.dict()))
    
    # Update game state
    game.score += points_earned
    if not is_correct:
        game.lives -= 1
    
    game.current_question += 1
    
    if game.lives <= 0 or game.current_question >= len(game.questions):
        game.status = "completed"
        game.completed_at = datetime.now(timezone.utc)
    
    # Update game in database
    await db.trivia_games.update_one(
        {"id": game_id},
        {"$set": prepare_for_mongo({
            "score": game.score,
            "lives": game.lives,
            "current_question": game.current_question,
            "status": game.status,
            "completed_at": game.completed_at.isoformat() if game.completed_at else None
        })}
    )
    
    return {
        "is_correct": is_correct,
        "points_earned": points_earned,
        "total_score": game.score,
        "lives_remaining": game.lives,
        "correct_answer": current_question.correct_answer,
        "explanation": current_question.explanation,
        "game_status": game.status
    }

@api_router.get("/trivia/leaderboard")
async def get_trivia_leaderboard(category: str = "all", limit: int = 10):
    """Get trivia game leaderboard"""
    match_filter = {"status": "completed"}
    if category != "all":
        match_filter["category"] = category
    
    leaderboard_data = await db.trivia_games.find(match_filter).sort("score", -1).limit(limit).to_list(length=None)
    
    leaderboard = []
    for i, game_data in enumerate(leaderboard_data):
        game = parse_from_mongo(game_data)
        leaderboard.append({
            "rank": i + 1,
            "player_name": game["player_name"],
            "score": game["score"],
            "category": game["category"],
            "completed_at": game["completed_at"]
        })
    
    return leaderboard

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