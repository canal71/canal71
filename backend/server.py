from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
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
from datetime import datetime, timezone, timedelta

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
    tagline: str = "Your Ultimate Media Experience"
    
    # Biography - English & French
    bio_en: str = "Radio Haiti Fusion is a dynamic media platform that blends culture, music, and information to inspire and entertain. Rooted in Caribbean traditions while embracing global influences, we are a cultural bridge connecting communities worldwide."
    bio_fr: str = "Radio Haiti Fusion est une plateforme média dynamique qui fusionne culture, musique et information pour inspirer et divertir. Ancrée dans les traditions caribéennes tout en s'ouvrant aux influences mondiales, elle est un pont culturel reliant les communautés du monde entier."
    
    # Mission - English & French  
    mission_en: str = "Our mission is to inform, inspire, and entertain with diverse programs that reflect cultural identity while embracing international perspectives. We are committed to unity, positivity, and creativity through every broadcast."
    mission_fr: str = "Notre mission est d'informer, d'inspirer et de divertir avec une programmation variée qui reflète l'identité culturelle tout en s'ouvrant aux perspectives internationales. Nous nous engageons à promouvoir l'unité, la positivité et la créativité à travers chacune de nos émissions."
    
    # Vision - English & French
    vision_en: str = "Our vision is to become the leading multimedia platform with global influence, recognized for cultural pride, innovation, and community impact — a platform without borders where every listener feels connected and inspired."
    vision_fr: str = "Notre vision est de devenir la principale plateforme multimédia à rayonnement mondial, reconnue pour sa fierté culturelle, son innovation et son impact communautaire — une plateforme sans frontières où chaque auditeur se sent connecté et inspiré."
    
    # Station Details
    description: str = "Radio Haiti Fusion est une plateforme dynamique qui fusionne culture, musique et information pour inspirer et divertir."
    founded_year: int = 2020
    frequency: str = "105.3 FM"
    location: str = "Cap-Haïtien, Haïti"
    contact_email: str = "info@xtremehostingmedia.com"
    promo_email: str = "promo@xtremehostingmedia.com"
    website: str = "www.xtremehostingmedia.com"
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

# Podcast Models
class PodcastEpisode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str = "music_show"  # music_show, talk_show, news, interview, comedy
    host: str = "DJ Kenley"
    duration: str = "45:30"  # MM:SS format
    audio_url: str
    cover_art: Optional[str] = None
    published_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    episode_number: Optional[int] = None
    season: Optional[int] = 1
    download_count: int = 0
    play_count: int = 0
    tags: List[str] = []
    is_featured: bool = False
    transcript: Optional[str] = None
    file_size: Optional[str] = "25.4 MB"

class PodcastEpisodeCreate(BaseModel):
    title: str
    description: str
    category: str = "music_show"
    host: str = "DJ Kenley"
    duration: str
    audio_url: str
    cover_art: Optional[str] = None
    episode_number: Optional[int] = None
    season: Optional[int] = 1
    tags: List[str] = []
    is_featured: bool = False

class PodcastCategory(BaseModel):
    id: str
    name: str
    description: str
    episode_count: int = 0
    cover_image: Optional[str] = None

class PodcastPlaylist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    episodes: List[str] = []  # Episode IDs
    created_by: str = "Radio Haiti Fusion"
    is_public: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# TV Models
class TVShow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str = "variety"  # variety, news, music, talk, drama, comedy, documentary
    host: str = "Équipe TV"
    duration: str = "60:00"  # MM:SS format
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    season: Optional[int] = 1
    episode_number: Optional[int] = None
    air_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    view_count: int = 0
    rating: float = 0.0
    tags: List[str] = []
    is_live: bool = False
    is_featured: bool = False
    language: str = "français"

class TVShowCreate(BaseModel):
    title: str
    description: str
    category: str = "variety"
    host: str = "Équipe TV"
    duration: str = "60:00"
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    season: Optional[int] = 1
    episode_number: Optional[int] = None
    tags: List[str] = []
    is_live: bool = False
    is_featured: bool = False

class TVSchedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    show_title: str
    description: str
    host: str
    day_of_week: str = "Lundi-Vendredi"
    start_time: str = "20:00"
    end_time: str = "21:00"
    category: str = "variety"
    is_live: bool = True
    is_repeat: bool = False

class TVChannel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Radio Haiti Fusion TV"
    description: str = "Chaîne TV officielle de Radio Haiti Fusion"
    logo_url: Optional[str] = None
    stream_url: Optional[str] = None
    backup_stream_urls: List[str] = []
    current_show: Optional[str] = None
    next_show: Optional[str] = None
    is_live: bool = True
    viewer_count: int = 0

# Reseller Stream Hosting Models
class StreamingPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    max_listeners: int
    bandwidth: str  # e.g., "128 kbps", "320 kbps"
    storage_gb: int
    monthly_price: float
    features: List[str] = []
    is_popular: bool = False
    setup_fee: float = 0.0
    trial_days: int = 0

class ResellerClient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    station_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    plan_id: str
    stream_url: Optional[str] = None
    admin_panel_url: Optional[str] = None
    status: str = "active"  # active, suspended, trial, expired
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expiry_date: Optional[datetime] = None
    current_listeners: int = 0
    monthly_bandwidth_gb: float = 0.0
    notes: Optional[str] = None

class ResellerClientCreate(BaseModel):
    station_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    plan_id: str
    notes: Optional[str] = None

class StreamingStats(BaseModel):
    client_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    current_listeners: int = 0
    peak_listeners: int = 0
    bandwidth_used_mb: float = 0.0
    uptime_percentage: float = 99.9
    total_listening_hours: float = 0.0

class SupportTicket(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    subject: str
    description: str
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "open"  # open, in_progress, resolved, closed
    created_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_date: Optional[datetime] = None
    admin_notes: Optional[str] = None

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

# Global variable to store current playing track
current_playing_track = {
    "song": "Mwen Renmen'w",
    "artist": "T-Vice", 
    "album": "Best of Compas",
    "artwork_url": "https://i.scdn.co/image/ab67616d0000b273f3b7b9a1b5b2c1e8d4c0b2a1",
    "duration": "4:32",
    "genre": "Compas",
    "timestamp": datetime.now(timezone.utc).isoformat()
}

# Sample songs for auto-rotation
sample_songs = [
    {
        "song": "Pa Manyen",
        "artist": "Disip",
        "album": "Haitian Compas Hits",
        "artwork_url": "https://i.scdn.co/image/ab67616d0000b273a8c2b5d4e1f3c2a9b7e6f4d8",
        "duration": "3:45",
        "genre": "Compas"
    },
    {
        "song": "Kite Mwen Viv",
        "artist": "Sweet Micky",
        "album": "Konpa Collection",
        "artwork_url": "https://i.scdn.co/image/ab67616d0000b273c5d8a2f1b4e3c6b9a8e7f5d2",
        "duration": "4:12",
        "genre": "Compas"
    },
    {
        "song": "Ayisyen",
        "artist": "Boukman Eksperyans",
        "album": "Revolutionnaire",
        "artwork_url": "https://i.scdn.co/image/ab67616d0000b273b9c3f2e1a8d4c7b5e6f9a2d8",
        "duration": "5:28",
        "genre": "Racine"
    },
    {
        "song": "Mwen Renmen'w",
        "artist": "T-Vice", 
        "album": "Best of Compas",
        "artwork_url": "https://i.scdn.co/image/ab67616d0000b273f3b7b9a1b5b2c1e8d4c0b2a1",
        "duration": "4:32",
        "genre": "Compas"
    },
    {
        "song": "Lanmou San Manti",
        "artist": "Tabou Combo",
        "album": "Classic Compas",
        "artwork_url": "https://i.scdn.co/image/ab67616d0000b273e2f5c8b1a9d3c4b7e8f6a5d9",
        "duration": "4:18",
        "genre": "Compas"
    },
    {
        "song": "Haiti Chérie", 
        "artist": "Wyclef Jean",
        "album": "From the Hut, to the Projects",
        "artwork_url": "https://i.scdn.co/image/ab67616d0000b273d4c7b2a8e5f1c9b6a3e8f2d5",
        "duration": "3:56",
        "genre": "Hip-Hop Créole"
    }
]

current_song_index = 0
last_song_change = datetime.now(timezone.utc)

@api_router.get("/now-playing", response_model=NowPlaying)
async def get_now_playing():
    global current_song_index, last_song_change, current_playing_track
    
    # Auto-rotate songs every 4 minutes (simulate radio)
    current_time = datetime.now(timezone.utc)
    if (current_time - last_song_change).total_seconds() > 240:  # 4 minutes
        current_song_index = (current_song_index + 1) % len(sample_songs)
        current_playing_track = sample_songs[current_song_index].copy()
        current_playing_track["timestamp"] = current_time.isoformat()
        last_song_change = current_time
        
        # Broadcast the new track via WebSocket
        await manager.broadcast(json.dumps({
            "type": "now_playing_update",
            "track": current_playing_track
        }))
    
    # First, try to get the latest from database (manual updates)
    latest_track = await db.now_playing.find().sort("timestamp", -1).limit(1).to_list(length=1)
    
    if latest_track:
        # Check if database track is newer than auto-rotation
        db_track = parse_from_mongo(latest_track[0])
        db_time = datetime.fromisoformat(db_track.get("timestamp", "1970-01-01T00:00:00+00:00"))
        if db_time > last_song_change:
            return NowPlaying(**db_track)
    
    # Return current auto-rotated track
    return NowPlaying(**current_playing_track)

@api_router.post("/now-playing/update-current")
async def update_current_song():
    """Manually trigger song change for testing"""
    global current_song_index, last_song_change, current_playing_track
    
    # Move to next song
    current_song_index = (current_song_index + 1) % len(sample_songs)
    current_playing_track = sample_songs[current_song_index].copy()
    current_playing_track["timestamp"] = datetime.now(timezone.utc).isoformat()
    last_song_change = datetime.now(timezone.utc)
    
    # Broadcast the new track via WebSocket
    await manager.broadcast(json.dumps({
        "type": "now_playing_update", 
        "track": current_playing_track
    }))
    
    return {"message": "Song updated", "current_song": current_playing_track}

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
    # Get all radio stations from the database
    stations = await db.radio_stations.find().to_list(length=None)
    
    if not stations:
        # Return sample radio stations if database is empty
        sample_stations = [
            {
                "id": str(uuid.uuid4()),
                "name": "Radio Caraïbes",
                "frequency": "94.5 FM",
                "description": "Musique caribéenne, actualités locales et internationales",
                "location": "Port-au-Prince",
                "country": "Haïti",
                "genre": "Variété",
                "is_live": True,
                "listeners": 1250,
                "color": "#E53E3E",
                "stream_url": "http://streaming.example.com:8000/caraibes",
                "website": "https://radiocaraibes.com"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Radio Métropole",
                "frequency": "100.1 FM", 
                "description": "Talk-show, informations et débats politiques",
                "location": "Port-au-Prince",
                "country": "Haïti",
                "genre": "Talk Show",
                "is_live": True,
                "listeners": 980,
                "color": "#3182CE",
                "stream_url": "http://streaming.example.com:8000/metropole",
                "website": "https://radiometropole.com"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Radio Kiskeya",
                "frequency": "88.5 FM",
                "description": "Nouvelles, culture haïtienne et musique traditionnelle",
                "location": "Port-au-Prince", 
                "country": "Haïti",
                "genre": "Actualités",
                "is_live": True,
                "listeners": 850,
                "color": "#38A169",
                "stream_url": "http://streaming.example.com:8000/kiskeya",
                "website": "https://radiokiskeya.com"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Radio Lumière",
                "frequency": "91.9 FM",
                "description": "Musique gospel, programmes spirituels et communautaires",
                "location": "Cap-Haïtien",
                "country": "Haïti", 
                "genre": "Gospel",
                "is_live": True,
                "listeners": 650,
                "color": "#D69E2E",
                "stream_url": "http://streaming.example.com:8000/lumiere",
                "website": "https://radiolumiere.com"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Magik9",
                "frequency": "99.9 FM",
                "description": "Hip-hop, R&B et musique urbaine haïtienne",
                "location": "Port-au-Prince",
                "country": "Haïti",
                "genre": "Hip-Hop", 
                "is_live": True,
                "listeners": 1100,
                "color": "#805AD5",
                "stream_url": "http://streaming.example.com:8000/magik9",
                "website": "https://magik9.com"
            }
        ]
        return [RadioStation(**station) for station in sample_stations]
    else:
        return [RadioStation(**parse_from_mongo(station)) for station in stations]

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

# Radio Station Proposal Models
class StationProposal(BaseModel):
    name: str
    frequency: str
    description: str
    location: str = ""
    country: str = "Haïti"
    genre: str = ""
    stream_url: str = ""
    website_url: str = ""
    contact_email: str
    contact_name: str
    logo_url: str = ""
    status: str = "pending"  # pending, approved, rejected
    submission_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/radio-directory/propose")
async def propose_radio_station(proposal: StationProposal):
    """Submit a new radio station proposal"""
    try:
        # Prepare data for MongoDB storage
        proposal_data = prepare_for_mongo(proposal.dict())
        proposal_data["id"] = str(uuid.uuid4())
        proposal_data["submission_date"] = datetime.now(timezone.utc).isoformat()
        
        # Save to database
        await db.station_proposals.insert_one(proposal_data)
        
        # Optionally, broadcast notification to admin WebSocket connections
        await manager.broadcast(json.dumps({
            "type": "new_station_proposal",
            "proposal": {
                "id": proposal_data["id"],
                "name": proposal.name,
                "frequency": proposal.frequency,
                "contact_name": proposal.contact_name,
                "submission_date": proposal_data["submission_date"]
            }
        }))
        
        return {
            "status": "success",
            "message": f"Proposition pour '{proposal.name}' soumise avec succès",
            "proposal_id": proposal_data["id"],
            "contact_name": proposal.contact_name
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la soumission: {str(e)}")

@api_router.get("/radio-directory/proposals")
async def get_station_proposals(status: str = "pending"):
    """Get all station proposals (admin only)"""
    try:
        proposals = await db.station_proposals.find({"status": status}).to_list(length=None)
        return [parse_from_mongo(proposal) for proposal in proposals]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

@api_router.post("/radio-directory/proposals/{proposal_id}/approve")
async def approve_station_proposal(proposal_id: str):
    """Approve a station proposal and add it to the directory (admin only)"""
    try:
        # Get the proposal
        proposal = await db.station_proposals.find_one({"id": proposal_id})
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposition non trouvée")
        
        # Create the radio station from proposal
        station_data = prepare_for_mongo({
            "id": str(uuid.uuid4()),
            "name": proposal["name"],
            "frequency": proposal["frequency"],
            "description": proposal["description"],
            "location": proposal["location"],
            "country": proposal["country"],
            "genre": proposal["genre"],
            "is_live": False,  # Set to false initially, admin can enable later
            "listeners": 0,
            "color": "#FF6B35",  # Default orange color
            "stream_url": proposal.get("stream_url", ""),
            "website": proposal.get("website_url", ""),
            "logo_url": proposal.get("logo_url", ""),
            "approved_date": datetime.now(timezone.utc).isoformat()
        })
        
        # Add to radio stations collection
        await db.radio_stations.insert_one(station_data)
        
        # Update proposal status
        await db.station_proposals.update_one(
            {"id": proposal_id}, 
            {"$set": {"status": "approved", "approved_date": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {
            "status": "success", 
            "message": f"Station '{proposal['name']}' approuvée et ajoutée au répertoire",
            "station_id": station_data["id"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'approbation: {str(e)}")

@api_router.get("/recently-played", response_model=List[NowPlaying])
async def get_recently_played(limit: int = 10):
    """Get recently played tracks"""
    try:
        tracks_data = await db.now_playing.find().sort("timestamp", -1).limit(limit).to_list(length=None)
        tracks = []
        for track_data in tracks_data:
            parsed_track = parse_from_mongo(track_data)
            tracks.append(NowPlaying(**parsed_track))
        return tracks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération: {str(e)}")

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
            "platform": "Instagram",
            "handle": "@haitifusiondon",
            "url": "https://www.instagram.com/haitifusiondon/",
            "follower_count": 2800,
            "is_active": True
        },
        {
            "platform": "Twitter/X",
            "handle": "@fusion_haiti",
            "url": "https://x.com/fusion_haiti",
            "follower_count": 1200,
            "is_active": True
        },
        {
            "platform": "TikTok",
            "handle": "@radiohaitifusion",
            "url": "https://www.tiktok.com/@radiohaitifusion",
            "follower_count": 4600,
            "is_active": True
        },
        {
            "platform": "Facebook",
            "handle": "Radio Haiti Fusion",
            "url": "https://facebook.com/radiohaitifusion",
            "follower_count": 3200,
            "is_active": True
        },
        {
            "platform": "Email",
            "handle": "haitifusionpromo@gmail.com",
            "url": "mailto:haitifusionpromo@gmail.com",
            "follower_count": 0,
            "is_active": True
        },
        {
            "platform": "Website",
            "handle": "www.radiohaitifusion.com",
            "url": "https://www.radiohaitifusion.com",
            "follower_count": 0,
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
        # Radio Haiti Fusion Real DJ Team
        sample_djs = [
            {
                "name": "Nicolas Pierre",
                "stage_name": "DJ Niko",
                "bio": "Animateur charismatique et maître des ondes, DJ Niko anime les émissions matinales avec son style unique et sa connaissance approfondie de la musique haïtienne.",
                "photo_url": "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=150&h=150&fit=crop&crop=face",
                "specialty": "Compas & Morning Shows",
                "years_experience": 12,
                "social_media": {"instagram": "@djniko_rhf", "facebook": "DJ Niko RHF"},
                "schedule": "Reveil en Douceur & Breakfast Show",
                "is_active": True
            },
            {
                "name": "Kaelle Montilus",
                "stage_name": "Kaelle",
                "bio": "Voix douce et mélodieuse de Radio Haiti Fusion, Kaelle apporte une touche féminine raffinée avec sa passion pour la musique romantique et les ballades.",
                "photo_url": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face",
                "specialty": "Romantique & Ballades",
                "years_experience": 8,
                "social_media": {"instagram": "@kaelle_rhf", "facebook": "Kaelle RHF"},
                "schedule": "Romance en Musique",
                "is_active": True
            },
            {
                "name": "Hugo Destiné",
                "stage_name": "Hugo",
                "bio": "Producteur talentueux et DJ innovant, Hugo révolutionne les ondes avec ses mixes créatifs mélangeant tradition haïtienne et modernité urbaine.",
                "photo_url": "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face",
                "specialty": "Hip-Hop & Urban Mix",
                "years_experience": 10,
                "social_media": {"instagram": "@hugo_rhf", "youtube": "Hugo RHF Official"},
                "schedule": "Mes Premieres Tubes & Traffic Jam",
                "is_active": True
            },
            {
                "name": "Brigitte Lafortune",
                "stage_name": "Brigitte",
                "bio": "Intellectuelle passionnée et animatrice culturelle, Brigitte fait découvrir les trésors de la culture haïtienne et guide les discussions enrichissantes.",
                "photo_url": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&h=150&fit=crop&crop=face",
                "specialty": "Culture & Talk Shows",
                "years_experience": 15,
                "social_media": {"facebook": "Brigitte Culture RHF", "linkedin": "brigitte-lafortune"},
                "schedule": "Kwaze Chimen (Culture)",
                "is_active": True
            },
            {
                "name": "Sylvie Monestime",
                "stage_name": "Sylvie",
                "bio": "Spécialiste de la musique internationale et des hits caribéens, Sylvie transporte les auditeurs dans un voyage musical à travers les îles.",
                "photo_url": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
                "specialty": "Caribbean & International",
                "years_experience": 9,
                "social_media": {"instagram": "@sylvie_rhf", "twitter": "@sylvie_caribbean"},
                "schedule": "Caribbean Vibe Show & Fusion Latino Mix",
                "is_active": True
            },
            {
                "name": "Camilo Guerrero",
                "stage_name": "Don Camilo",
                "bio": "Légende vivante de la radio, Don Camilo fascine avec ses émissions rétro et sa connaissance encyclopédique des grands classiques musicaux.",
                "photo_url": "https://images.unsplash.com/photo-1558618666-fdcd25c85cd4?w=150&h=150&fit=crop&crop=face",
                "specialty": "Rétro & Classics",
                "years_experience": 25,
                "social_media": {"facebook": "Don Camilo RHF", "instagram": "@doncamilo_retro"},
                "schedule": "RETRO FRIDAY LIVE & Le Temps du Jazz",
                "is_active": True
            },
            {
                "name": "Sophie Brillant",
                "stage_name": "DJ Sunshine",
                "bio": "Énergie pure et bonne humeur matinale, DJ Sunshine illumine les journées avec des mélodies ensoleillées et sa personnalité pétillante.",
                "photo_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                "specialty": "Pop & Feel Good",
                "years_experience": 6,
                "social_media": {"instagram": "@djsunshine_rhf", "tiktok": "@sunshine_melodies"},
                "schedule": "Sunshine Melodies",
                "is_active": True
            },
            {
                "name": "Marcus Thompson",
                "stage_name": "DJ Traffic",
                "bio": "Expert en musique énergique, DJ Traffic accompagne les auditeurs dans leurs trajets avec des rythmes entraînants et des hits dynamiques.",
                "photo_url": "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face",
                "specialty": "Energetic Mix",
                "years_experience": 8,
                "social_media": {"instagram": "@djtraffic", "facebook": "DJ Traffic RHF"},
                "schedule": "Traffic Jam",
                "is_active": True
            },
            {
                "name": "Claire Moïse",
                "stage_name": "Marie Spirituelle",
                "bio": "Voix apaisante du petit matin, Marie Spirituelle guide les âmes vers l'éveil spirituel avec gospel et musique inspirante.",
                "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
                "specialty": "Gospel & Spirituel",
                "years_experience": 14,
                "social_media": {"facebook": "Marie Spirituelle", "youtube": "Reveil Spirituel"},
                "schedule": "Reveil Spirituel",
                "is_active": True
            },
            {
                "name": "Antonio Rodriguez",
                "stage_name": "DJ Sonidero",
                "bio": "Ambassadeur de la musique mexicaine authentique, DJ Sonidero fait découvrir les trésors du mariachi et de la ranchera chaque dimanche.",
                "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                "specialty": "Mariachi & Ranchera",
                "years_experience": 16,
                "social_media": {"instagram": "@sonidero_domingo", "facebook": "DJ Sonidero RHF"},
                "schedule": "Domingo Sonidero",
                "is_active": True
            },
            {
                "name": "Patricia Konpa",
                "stage_name": "DJ Konpa",
                "bio": "Reine incontestée du compas moderne, DJ Konpa fait vibrer les weekends avec les meilleurs morceaux compas contemporains et classiques.",
                "photo_url": "https://images.unsplash.com/photo-1494790108755-2616b612b494?w=150&h=150&fit=crop&crop=face",
                "specialty": "Compas Moderne",
                "years_experience": 11,
                "social_media": {"instagram": "@djkonpa_rhf", "facebook": "DJ Konpa Official"},
                "schedule": "Detente Konpa",
                "is_active": True
            },
            {
                "name": "David Lumumba",
                "stage_name": "Maestro Jazz",
                "bio": "Virtuose du jazz et du blues, Maestro Jazz clôture les soirées avec sophistication et élégance musicale intemporelle.",
                "photo_url": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face",
                "specialty": "Jazz & Blues",
                "years_experience": 20,
                "social_media": {"instagram": "@maestro_jazz", "facebook": "Maestro Jazz RHF"},
                "schedule": "Love Frequency",
                "is_active": True
            }
        ]
        return [DJ(**dj) for dj in sample_djs]
    
    return [DJ(**parse_from_mongo(dj_data)) for dj_data in djs_data]

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
        # Real Radio Haiti Fusion Programming Schedule
        sample_shows = [
            # Daily Programming
            {
                "name": "Rythme Planetaire",
                "description": "Musique internationale et hits planétaires pour commencer la nuit",
                "host_dj": "DJ Night",
                "day_of_week": "Lundi-Jeudi",
                "start_time": "00:00",
                "end_time": "02:00",
                "genre": "International",
                "is_live": False
            },
            {
                "name": "Fusion En Couleur",
                "description": "Un mix coloré de genres musicaux variés",
                "host_dj": "DJ Colors",
                "day_of_week": "Lundi-Jeudi",
                "start_time": "02:00",
                "end_time": "03:00",
                "genre": "Mix",
                "is_live": False
            },
            {
                "name": "Reveil Spirituel",
                "description": "Réveillez votre âme avec de la musique inspirante et spirituelle",
                "host_dj": "Marie Spirituelle",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "03:00",
                "end_time": "05:00",
                "genre": "Gospel & Spirituel",
                "is_live": False
            },
            {
                "name": "Reveil en Douceur",
                "description": "Un réveil tout en douceur avec des mélodies apaisantes",
                "host_dj": "DJ Kenley",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "06:00",
                "end_time": "07:00",
                "genre": "Soft Rock & Pop",
                "is_live": True
            },
            {
                "name": "Sunshine Melodies",
                "description": "Des mélodies ensoleillées pour bien commencer la journée",
                "host_dj": "DJ Sunshine",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "07:00",
                "end_time": "08:00",
                "genre": "Pop & Feel Good",
                "is_live": False
            },
            {
                "name": "Breakfast Show",
                "description": "L'émission parfaite pour accompagner votre petit-déjeuner",
                "host_dj": "DJ Kenley",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "08:00",
                "end_time": "09:00",
                "genre": "Morning Mix",
                "is_live": True
            },
            {
                "name": "Fusion Latino Mix",
                "description": "Les meilleurs hits latino pour faire bouger vos matinées",
                "host_dj": "DJ Latino",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "09:00",
                "end_time": "10:00",
                "genre": "Latino",
                "is_live": False
            },
            {
                "name": "Caribbean Vibe Show",
                "description": "Voyage musical à travers les Caraïbes avec compas, reggae et soca",
                "host_dj": "DJ Caribbean",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "10:00",
                "end_time": "12:00",
                "genre": "Caribbean",
                "is_live": False
            },
            {
                "name": "Romance en Musique",
                "description": "L'heure de la romance avec les plus belles ballades d'amour",
                "host_dj": "Marie Jeanne",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "12:00",
                "end_time": "13:00",
                "genre": "Romantique",
                "is_live": False
            },
            {
                "name": "Kwaze Chimen (Culture)",
                "description": "Émission culturelle haïtienne - Histoire, traditions et patrimoine",
                "host_dj": "Dr. Marie Carmel",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "14:00",
                "end_time": "15:00",
                "genre": "Culture & Éducation",
                "is_live": True
            },
            {
                "name": "Traffic Jam",
                "description": "Musique énergique pour vous accompagner dans les embouteillages",
                "host_dj": "DJ Traffic",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "16:00",
                "end_time": "18:00",
                "genre": "Énergique Mix",
                "is_live": False
            },
            {
                "name": "Fusion Ballade",
                "description": "Soirée en douceur avec les plus belles ballades",
                "host_dj": "DJ Ballade",
                "day_of_week": "Lundi-Jeudi",
                "start_time": "18:00",
                "end_time": "19:00",
                "genre": "Ballade",
                "is_live": False
            },
            {
                "name": "Mes Premieres Tubes",
                "description": "Redécouvrez vos tubes préférés d'hier et d'aujourd'hui",
                "host_dj": "JC Mix",
                "day_of_week": "Lundi-Jeudi",
                "start_time": "19:00",
                "end_time": "21:00",
                "genre": "Hits & Nostalgie",
                "is_live": False
            },
            {
                "name": "Love Frequency",
                "description": "Fréquence d'amour - Musique romantique pour les cœurs sensibles",
                "host_dj": "DJ Love",
                "day_of_week": "Lundi-Jeudi",
                "start_time": "22:00",
                "end_time": "23:00",
                "genre": "Love Songs",
                "is_live": False
            },
            {
                "name": "Le Temps du Jazz",
                "description": "Voyage dans l'univers sophistiqué du jazz et du blues",
                "host_dj": "Maestro Jazz",
                "day_of_week": "Lundi-Jeudi",
                "start_time": "23:00",
                "end_time": "00:00",
                "genre": "Jazz & Blues",
                "is_live": False
            },
            # Weekend Special Programming
            {
                "name": "RETRO FRIDAY LIVE",
                "description": "Soirée rétro en direct avec les hits d'antan",
                "host_dj": "DJ Retro",
                "day_of_week": "Vendredi",
                "start_time": "18:00",
                "end_time": "23:59",
                "genre": "Rétro",
                "is_live": True
            },
            {
                "name": "Positive Vibration",
                "description": "Vibrations positives pour bien commencer le weekend",
                "host_dj": "DJ Positive",
                "day_of_week": "Samedi",
                "start_time": "14:00",
                "end_time": "15:00",
                "genre": "Reggae & Positive",
                "is_live": False
            },
            {
                "name": "Detente Konpa",
                "description": "Détente avec les meilleurs morceaux compas du moment",
                "host_dj": "DJ Konpa",
                "day_of_week": "Samedi",
                "start_time": "18:00",
                "end_time": "23:59",
                "genre": "Compas",
                "is_live": False
            },
            {
                "name": "Classique du Dimanche",
                "description": "Réveil dominical avec la musique classique et traditionnelle",
                "host_dj": "Marie Classique",
                "day_of_week": "Dimanche",
                "start_time": "04:00",
                "end_time": "05:00",
                "genre": "Classique",
                "is_live": False
            },
            {
                "name": "Domingo Sonidero",
                "description": "Musique mexicaine authentique - Mariachi et Ranchera",
                "host_dj": "DJ Sonidero",
                "day_of_week": "Dimanche",
                "start_time": "05:00",
                "end_time": "07:00",
                "genre": "Mariachi & Ranchera",
                "is_live": False
            },
            {
                "name": "Dimanche Tendre",
                "description": "Dimanche en douceur avec les plus beaux boléros",
                "host_dj": "DJ Bolero",
                "day_of_week": "Dimanche",
                "start_time": "07:00",
                "end_time": "08:00",
                "genre": "Bolero",
                "is_live": False
            },
            {
                "name": "Dimanche Dominicale",
                "description": "Programmation spéciale dominicale - Mix varié et détente",
                "host_dj": "Équipe Dimanche",
                "day_of_week": "Dimanche",
                "start_time": "10:00",
                "end_time": "18:00",
                "genre": "Mix Dominical",
                "is_live": False
            },
            {
                "name": "Ambiance Retro",
                "description": "Ambiance rétro pour terminer le weekend en beauté",
                "host_dj": "DJ Vintage",
                "day_of_week": "Dimanche",
                "start_time": "18:00",
                "end_time": "22:00",
                "genre": "Rétro & Vintage",
                "is_live": False
            },
            {
                "name": "Melodias en La Noche",
                "description": "Mélodies nocturnes pour clôturer le weekend",
                "host_dj": "DJ Noche",
                "day_of_week": "Dimanche",
                "start_time": "21:00",
                "end_time": "22:00",
                "genre": "Nocturne",
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

# Podcast API
@api_router.get("/podcasts/episodes", response_model=List[PodcastEpisode])
async def get_podcast_episodes(category: str = "all", limit: int = 20, featured: bool = None):
    """Get podcast episodes with optional filtering"""
    match_filter = {}
    if category != "all":
        match_filter["category"] = category
    if featured is not None:
        match_filter["is_featured"] = featured
    
    episodes_data = await db.podcast_episodes.find(match_filter).sort("published_date", -1).limit(limit).to_list(length=None)
    
    if not episodes_data:
        # Return sample episodes
        sample_episodes = [
            {
                "title": "Matinée Compas avec DJ Kenley",
                "description": "Réveillez-vous avec les meilleurs hits compas! DJ Kenley vous présente une sélection exclusive des tubes qui font danser Haïti.",
                "category": "music_show",
                "host": "DJ Kenley",
                "duration": "1:45:30",
                "audio_url": "https://example.com/episodes/morning-compas-01.mp3",
                "cover_art": "https://via.placeholder.com/300x300?text=Morning+Compas",
                "episode_number": 15,
                "season": 1,
                "download_count": 2840,
                "play_count": 8920,
                "tags": ["compas", "morning", "music", "dance"],
                "is_featured": True,
                "file_size": "95.2 MB"
            },
            {
                "title": "Interview Exclusive avec T-Vice",
                "description": "Découvrez l'histoire fascinante du groupe T-Vice, leurs inspirations et leurs projets futurs dans cette interview exclusive.",
                "category": "interview",
                "host": "Marie Jeanne",
                "duration": "42:15",
                "audio_url": "https://example.com/episodes/t-vice-interview.mp3",
                "cover_art": "https://via.placeholder.com/300x300?text=T-Vice+Interview",
                "episode_number": 8,
                "season": 2,
                "download_count": 4200,
                "play_count": 12500,
                "tags": ["interview", "t-vice", "music", "artists"],
                "is_featured": True,
                "file_size": "38.4 MB"
            },
            {
                "title": "Actualités Haïtiennes de la Semaine",
                "description": "Résumé des événements marquants de la semaine en Haïti et dans la diaspora haïtienne.",
                "category": "news",
                "host": "Jean Claude Michel",
                "duration": "28:45",
                "audio_url": "https://example.com/episodes/news-weekly-03.mp3",
                "cover_art": "https://via.placeholder.com/300x300?text=Actualités",
                "episode_number": 12,
                "season": 1,
                "download_count": 1850,
                "play_count": 5200,
                "tags": ["news", "haiti", "diaspora", "weekly"],
                "is_featured": False,
                "file_size": "26.1 MB"
            },
            {
                "title": "Histoire du Compas Direct",
                "description": "Plongez dans l'histoire riche du compas direct, de Nemours Jean-Baptiste aux artistes contemporains.",
                "category": "talk_show",
                "host": "Dr. Marie Carmel",
                "duration": "52:20",
                "audio_url": "https://example.com/episodes/compas-history.mp3",
                "cover_art": "https://via.placeholder.com/300x300?text=Histoire+Compas",
                "episode_number": 5,
                "season": 1,
                "download_count": 3100,
                "play_count": 7800,
                "tags": ["history", "compas", "culture", "music"],
                "is_featured": False,
                "file_size": "47.6 MB"
            },
            {
                "title": "Mix Zouk & Compas Weekend",
                "description": "Le mix parfait pour vos weekends! Une fusion entre zouk et compas pour faire danser toute la famille.",
                "category": "music_show",
                "host": "DJ Mix Master",
                "duration": "1:20:15",
                "audio_url": "https://example.com/episodes/weekend-mix-02.mp3",
                "cover_art": "https://via.placeholder.com/300x300?text=Weekend+Mix",
                "episode_number": 22,
                "season": 1,
                "download_count": 3800,
                "play_count": 9500,
                "tags": ["zouk", "compas", "mix", "weekend", "dance"],
                "is_featured": False,
                "file_size": "72.8 MB"
            }
        ]
        return [PodcastEpisode(**episode) for episode in sample_episodes]
    
    return [PodcastEpisode(**parse_from_mongo(episode)) for episode in episodes_data]

@api_router.get("/podcasts/categories")
async def get_podcast_categories():
    """Get available podcast categories"""
    return {
        "categories": [
            {"id": "music_show", "name": "Émissions Musicales", "description": "Mixes, découvertes musicales et hits du moment", "episode_count": 45},
            {"id": "interview", "name": "Interviews", "description": "Rencontres exclusives avec des artistes et personnalités", "episode_count": 23},
            {"id": "talk_show", "name": "Talk Shows", "description": "Discussions sur la culture, l'histoire et la société haïtienne", "episode_count": 18},
            {"id": "news", "name": "Actualités", "description": "Informations et analyses sur Haïti et la diaspora", "episode_count": 32},
            {"id": "comedy", "name": "Comédie", "description": "Humour haïtien et sketchs divertissants", "episode_count": 12}
        ]
    }

@api_router.get("/podcasts/episodes/{episode_id}", response_model=PodcastEpisode)
async def get_podcast_episode(episode_id: str):
    """Get specific podcast episode"""
    episode_data = await db.podcast_episodes.find_one({"id": episode_id})
    if not episode_data:
        raise HTTPException(status_code=404, detail="Episode not found")
    
    return PodcastEpisode(**parse_from_mongo(episode_data))

@api_router.post("/podcasts/episodes/{episode_id}/play")
async def track_episode_play(episode_id: str):
    """Track episode play count"""
    await db.podcast_episodes.update_one(
        {"id": episode_id},
        {"$inc": {"play_count": 1}}
    )
    return {"message": "Play count updated"}

@api_router.post("/podcasts/episodes/{episode_id}/download")
async def track_episode_download(episode_id: str):
    """Track episode download count"""
    await db.podcast_episodes.update_one(
        {"id": episode_id},
        {"$inc": {"download_count": 1}}
    )
    return {"message": "Download count updated"}

@api_router.get("/podcasts/featured", response_model=List[PodcastEpisode])
async def get_featured_episodes(limit: int = 5):
    """Get featured podcast episodes"""
    return await get_podcast_episodes(featured=True, limit=limit)

# TV API Endpoints
@api_router.get("/tv/channel")
async def get_tv_channel():
    """Get TV channel information"""
    return TVChannel(
        name="Xtreme Hosting Media TV",
        description="Chaîne TV officielle de Xtreme Hosting Media - Programmes, émissions et divertissement 24h/24",
        logo_url="https://via.placeholder.com/200x100?text=RHF+TV",
        stream_url="https://xtremeradiohosting.com/8288/stream",  # Using the same stream for now
        backup_stream_urls=[
            "https://xtremeradiohosting.com/8076/stream"
        ],
        current_show="Programme en Direct",
        next_show="Émission du Soir",
        is_live=True,
        viewer_count=1250
    )

@api_router.get("/tv/shows", response_model=List[TVShow])
async def get_tv_shows(category: str = "all", limit: int = 20, featured: bool = None):
    """Get TV shows with optional filtering"""
    match_filter = {}
    if category != "all":
        match_filter["category"] = category
    if featured is not None:
        match_filter["is_featured"] = featured
    
    shows_data = await db.tv_shows.find(match_filter).sort("air_date", -1).limit(limit).to_list(length=None)
    
    if not shows_data:
        # Return sample TV shows
        sample_shows = [
            {
                "title": "Matin Xtreme Media TV",
                "description": "Émission matinale avec actualités, interviews et divertissement pour bien commencer la journée.",
                "category": "variety",
                "host": "DJ Niko & Kaelle",
                "duration": "120:00",
                "video_url": "https://xtremeradiohosting.com/8288/stream",
                "thumbnail_url": "https://via.placeholder.com/400x225?text=Matin+TV",
                "season": 1,
                "episode_number": 45,
                "view_count": 15200,
                "rating": 4.8,
                "tags": ["matinale", "actualités", "divertissement"],
                "is_live": True,
                "is_featured": True,
                "language": "français"
            },
            {
                "title": "Culture Kreyòl",
                "description": "Émission culturelle explorant les richesses de la culture haïtienne avec des invités exceptionnels.",
                "category": "documentary",
                "host": "Brigitte",
                "duration": "45:00",
                "video_url": "https://example.com/culture-kreyol-ep12.mp4",
                "thumbnail_url": "https://via.placeholder.com/400x225?text=Culture+Kreyol",
                "season": 2,
                "episode_number": 12,
                "view_count": 8900,
                "rating": 4.9,
                "tags": ["culture", "tradition", "histoire"],
                "is_live": False,
                "is_featured": True,
                "language": "français"
            },
            {
                "title": "Compas Live Sessions",
                "description": "Sessions live avec les meilleurs artistes compas, performances exclusives et interviews.",
                "category": "music",
                "host": "Hugo",
                "duration": "90:00",
                "video_url": "https://example.com/compas-live-tvice.mp4",
                "thumbnail_url": "https://via.placeholder.com/400x225?text=Compas+Live",
                "season": 1,
                "episode_number": 8,
                "view_count": 22300,
                "rating": 4.7,
                "tags": ["compas", "live", "musique", "artistes"],
                "is_live": False,
                "is_featured": True,
                "language": "français"
            },
            {
                "title": "Journal TV Xtreme Media",
                "description": "Informations complètes sur Haiti et la diaspora, analyses et reportages exclusifs.",
                "category": "news",
                "host": "Équipe Journalisme",
                "duration": "30:00",
                "video_url": "https://example.com/journal-tv-today.mp4",
                "thumbnail_url": "https://via.placeholder.com/400x225?text=Journal+TV",
                "season": 1,
                "episode_number": 234,
                "view_count": 12800,
                "rating": 4.6,
                "tags": ["actualités", "haiti", "diaspora"],
                "is_live": False,
                "is_featured": False,
                "language": "français"
            },
            {
                "title": "Talk Show Dimanche",
                "description": "Discussions ouvertes sur des sujets d'actualité avec des personnalités influentes.",
                "category": "talk",
                "host": "Don Camilo",
                "duration": "75:00",
                "video_url": "https://example.com/talk-show-sunday.mp4",
                "thumbnail_url": "https://via.placeholder.com/400x225?text=Talk+Show",
                "season": 3,
                "episode_number": 18,
                "view_count": 9500,
                "rating": 4.5,
                "tags": ["débat", "société", "personnalités"],
                "is_live": False,
                "is_featured": False,
                "language": "français"
            },
            {
                "title": "Comedy Haiti",
                "description": "Spectacle d'humour haïtien avec les meilleurs comédiens du pays.",
                "category": "comedy",
                "host": "Équipe Comedy",
                "duration": "60:00",
                "video_url": "https://example.com/comedy-haiti-ep5.mp4",
                "thumbnail_url": "https://via.placeholder.com/400x225?text=Comedy+Haiti",
                "season": 2,
                "episode_number": 5,
                "view_count": 18600,
                "rating": 4.8,
                "tags": ["humour", "comédie", "spectacle"],
                "is_live": False,
                "is_featured": False,
                "language": "français"
            }
        ]
        return [TVShow(**show) for show in sample_shows]
    
    return [TVShow(**parse_from_mongo(show)) for show in shows_data]

@api_router.get("/tv/categories")
async def get_tv_categories():
    """Get TV show categories"""
    return {
        "categories": [
            {"id": "variety", "name": "Variétés", "description": "Émissions de divertissement et spectacles", "show_count": 15},
            {"id": "news", "name": "Actualités", "description": "Journaux télévisés et reportages", "show_count": 8},
            {"id": "music", "name": "Musique", "description": "Concerts, clips et émissions musicales", "show_count": 12},
            {"id": "talk", "name": "Talk Shows", "description": "Débats et discussions avec invités", "show_count": 6},
            {"id": "documentary", "name": "Documentaires", "description": "Programmes culturels et éducatifs", "show_count": 9},
            {"id": "comedy", "name": "Comédie", "description": "Spectacles d'humour et divertissement", "show_count": 4}
        ]
    }

@api_router.get("/tv/schedule", response_model=List[TVSchedule])
async def get_tv_schedule():
    """Get TV programming schedule"""
    schedule_data = await db.tv_schedule.find().to_list(length=None)
    if not schedule_data:
        # Sample TV schedule
        sample_schedule = [
            {
                "show_title": "Matin Haiti Fusion TV",
                "description": "Émission matinale avec actualités et divertissement",
                "host": "DJ Niko & Kaelle",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "07:00",
                "end_time": "09:00",
                "category": "variety",
                "is_live": True
            },
            {
                "show_title": "Journal TV Midi",
                "description": "Actualités de la mi-journée",
                "host": "Équipe Journalisme",
                "day_of_week": "Lundi-Vendredi",
                "start_time": "12:00",
                "end_time": "12:30",
                "category": "news",
                "is_live": True
            },
            {
                "show_title": "Culture Kreyòl",
                "description": "Émission culturelle haïtienne",
                "host": "Brigitte",
                "day_of_week": "Mercredi",
                "start_time": "19:00",
                "end_time": "20:00",
                "category": "documentary",
                "is_live": True
            },
            {
                "show_title": "Compas Live Sessions",
                "description": "Sessions musicales live",
                "host": "Hugo",
                "day_of_week": "Vendredi",
                "start_time": "20:00",
                "end_time": "21:30",
                "category": "music",
                "is_live": True
            },
            {
                "show_title": "Talk Show Dimanche",
                "description": "Discussions et débats du dimanche",
                "host": "Don Camilo",
                "day_of_week": "Dimanche",
                "start_time": "15:00",
                "end_time": "16:30",
                "category": "talk",
                "is_live": True
            }
        ]
        return [TVSchedule(**show) for show in sample_schedule]
    
    return [TVSchedule(**parse_from_mongo(show)) for show in schedule_data]

@api_router.post("/tv/shows/{show_id}/view")
async def track_tv_view(show_id: str):
    """Track TV show view count"""
    await db.tv_shows.update_one(
        {"id": show_id},
        {"$inc": {"view_count": 1}}
    )
    return {"message": "View count updated"}

@api_router.get("/tv/featured", response_model=List[TVShow])
async def get_featured_tv_shows(limit: int = 5):
    """Get featured TV shows"""
    return await get_tv_shows(featured=True, limit=limit)

# Reseller Stream Hosting API
@api_router.get("/hosting/plans", response_model=List[StreamingPlan])
async def get_hosting_plans():
    """Get available streaming hosting plans"""
    plans_data = await db.streaming_plans.find().to_list(length=None)
    
    if not plans_data:
        # Sample hosting plans
        sample_plans = [
            {
                "name": "Starter",
                "description": "Perfect pour les nouvelles stations de radio",
                "max_listeners": 50,
                "bandwidth": "128 kbps",
                "storage_gb": 5,
                "monthly_price": 29.99,
                "features": [
                    "Stream 24/7",
                    "Panel d'administration",
                    "Statistiques de base",
                    "Support email"
                ],
                "is_popular": False,
                "setup_fee": 0.0,
                "trial_days": 7
            },
            {
                "name": "Professional",
                "description": "Idéal pour les stations établies",
                "max_listeners": 150,
                "bandwidth": "256 kbps",
                "storage_gb": 15,
                "monthly_price": 59.99,
                "features": [
                    "Stream haute qualité",
                    "Panel avancé",
                    "Statistiques détaillées",
                    "Support prioritaire",
                    "URLs personnalisées",
                    "Backup automatique"
                ],
                "is_popular": True,
                "setup_fee": 0.0,
                "trial_days": 14
            },
            {
                "name": "Enterprise",
                "description": "Solutions pour grandes stations",
                "max_listeners": 500,
                "bandwidth": "320 kbps",
                "storage_gb": 50,
                "monthly_price": 129.99,
                "features": [
                    "Stream qualité CD",
                    "Panel enterprise",
                    "Analytics avancées",
                    "Support 24/7",
                    "White label",
                    "API access",
                    "Multiple streams",
                    "CDN global"
                ],
                "is_popular": False,
                "setup_fee": 50.0,
                "trial_days": 30
            },
            {
                "name": "Premium",
                "description": "Solution unlimited pour réseaux",
                "max_listeners": 1000,
                "bandwidth": "320 kbps",
                "storage_gb": 100,
                "monthly_price": 249.99,
                "features": [
                    "Listeners illimités*",
                    "Bande passante premium",
                    "Stockage étendu",
                    "Support dédié",
                    "Intégration personnalisée",
                    "SLA 99.9%",
                    "Monitoring avancé",
                    "Disaster recovery"
                ],
                "is_popular": False,
                "setup_fee": 100.0,
                "trial_days": 30
            }
        ]
        return [StreamingPlan(**plan) for plan in sample_plans]
    
    return [StreamingPlan(**parse_from_mongo(plan)) for plan in plans_data]

@api_router.post("/hosting/signup", response_model=ResellerClient)
async def create_hosting_client(client_data: ResellerClientCreate):
    """Sign up new hosting client"""
    # Generate stream URL and admin panel URL
    stream_id = str(uuid.uuid4())[:8]
    
    client = ResellerClient(
        **client_data.dict(),
        stream_url=f"https://stream.xtremehostingmedia.com/{stream_id}/stream",
        admin_panel_url=f"https://admin.xtremehostingmedia.com/{stream_id}",
        status="trial",
        expiry_date=datetime.now(timezone.utc) + timedelta(days=14)  # 14-day trial
    )
    
    mongo_data = prepare_for_mongo(client.dict())
    await db.reseller_clients.insert_one(mongo_data)
    
    return client

@api_router.get("/hosting/clients", response_model=List[ResellerClient])
async def get_hosting_clients(status: str = "all"):
    """Get hosting clients (admin only)"""
    match_filter = {}
    if status != "all":
        match_filter["status"] = status
    
    clients_data = await db.reseller_clients.find(match_filter).sort("created_date", -1).to_list(length=None)
    
    if not clients_data:
        # Sample clients for demo
        sample_clients = [
            {
                "station_name": "Radio Konpa Classic",
                "contact_name": "Marie Dubois",
                "email": "marie@radiokonpa.com",
                "phone": "+509 3456-7890",
                "plan_id": "professional",
                "stream_url": "https://stream.xtremehostingmedia.com/rk001/stream",
                "admin_panel_url": "https://admin.xtremehostingmedia.com/rk001",
                "status": "active",
                "current_listeners": 89,
                "monthly_bandwidth_gb": 245.6,
                "notes": "Client fidèle depuis 2 ans"
            },
            {
                "station_name": "Caribbean Beats FM",
                "contact_name": "Jean-Paul Martin",
                "email": "jp@caribbeatsfm.com",
                "phone": "+1 786-555-0123",
                "plan_id": "starter",
                "stream_url": "https://stream.xtremehostingmedia.com/cb002/stream",
                "admin_panel_url": "https://admin.xtremehostingmedia.com/cb002",
                "status": "trial",
                "current_listeners": 23,
                "monthly_bandwidth_gb": 56.2,
                "notes": "Essai gratuit - expire dans 5 jours"
            },
            {
                "station_name": "Zouk Paradise Radio",
                "contact_name": "Sandra Joseph",
                "email": "sandra@zoukparadise.com",
                "phone": "+590 690-12-34-56",
                "plan_id": "enterprise",
                "stream_url": "https://stream.xtremehostingmedia.com/zp003/stream",
                "admin_panel_url": "https://admin.xtremehostingmedia.com/zp003",
                "status": "active",
                "current_listeners": 234,
                "monthly_bandwidth_gb": 567.8,
                "notes": "Client premium - support prioritaire"
            }
        ]
        return [ResellerClient(**client) for client in sample_clients]
    
    return [ResellerClient(**parse_from_mongo(client)) for client in clients_data]

@api_router.get("/hosting/stats")
async def get_hosting_overview():
    """Get hosting business overview"""
    return {
        "total_clients": 156,
        "active_clients": 142,
        "trial_clients": 8,
        "suspended_clients": 6,
        "monthly_revenue": 8745.50,
        "total_listeners_now": 3250,
        "bandwidth_used_gb": 1250.75,
        "uptime_percentage": 99.8,
        "top_plans": [
            {"name": "Professional", "clients": 89, "percentage": 57.1},
            {"name": "Starter", "clients": 45, "percentage": 28.8},
            {"name": "Enterprise", "clients": 18, "percentage": 11.5},
            {"name": "Premium", "clients": 4, "percentage": 2.6}
        ],
        "recent_signups": 12,
        "churn_rate": 2.3
    }

@api_router.post("/hosting/tickets", response_model=SupportTicket)
async def create_support_ticket(client_id: str, subject: str, description: str, priority: str = "medium"):
    """Create support ticket"""
    ticket = SupportTicket(
        client_id=client_id,
        subject=subject,
        description=description,
        priority=priority
    )
    
    mongo_data = prepare_for_mongo(ticket.dict())
    await db.support_tickets.insert_one(mongo_data)
    
    return ticket

@api_router.get("/hosting/tickets", response_model=List[SupportTicket])
async def get_support_tickets(status: str = "open"):
    """Get support tickets"""
    match_filter = {"status": status} if status != "all" else {}
    tickets_data = await db.support_tickets.find(match_filter).sort("created_date", -1).to_list(length=None)
    
    if not tickets_data:
        # Sample tickets
        sample_tickets = [
            {
                "client_id": "rk001",
                "subject": "Stream cutting out intermittently",
                "description": "Our stream keeps disconnecting every few hours. Listeners are complaining about interruptions.",
                "priority": "high",
                "status": "in_progress",
                "admin_notes": "Investigating server load - may need bandwidth upgrade"
            },
            {
                "client_id": "cb002",
                "subject": "Need help with autodj setup",
                "description": "Can you help us configure the AutoDJ feature? We want to schedule playlists for overnight hours.",
                "priority": "medium",
                "status": "open",
                "admin_notes": None
            }
        ]
        return [SupportTicket(**ticket) for ticket in sample_tickets]
    
    return [SupportTicket(**parse_from_mongo(ticket)) for ticket in tickets_data]

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