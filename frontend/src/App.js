import { useState, useEffect, useRef } from "react";
import "./App.css";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { ScrollArea } from "./components/ui/scroll-area";
import { Play, Pause, Volume2, VolumeX, Radio, Users, MessageCircle, Send } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [radioStatus, setRadioStatus] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ username: '', message: '' });
  const [ws, setWs] = useState(null);
  const [radioStations, setRadioStations] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [haitiCities, setHaitiCities] = useState([]);
  
  const audioRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Radio Haiti Fusion live streams - you can add unlimited streams here
  const streamUrls = [
    "http://xtremeradiohosting.com:8076",
    "http://xtremeradiohosting.com:8076/stream",
    "http://xtremeradiohosting.com:8288", // Second stream
    "http://xtremeradiohosting.com:8288/stream", // Second stream with /stream path
    "http://xtremeradiohosting.com:8076/live",
    "http://xtremeradiohosting.com:8076/radio",
    "https://stream.radiojar.com/4wqre23fytzuv", // Fallback demo stream
    // Add more backup streams here as needed
  ];
  
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const streamUrl = streamUrls[currentStreamIndex];

  useEffect(() => {
    // Initialize WebSocket connection
    const websocket = new WebSocket(`${WS_URL}/ws`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_comment') {
        setComments(prev => [...prev, {
          ...data.comment,
          timestamp: new Date(data.comment.timestamp)
        }]);
      } else if (data.type === 'comments_cleared') {
        setComments([]);
      } else if (data.type === 'now_playing_update') {
        setNowPlaying(data.track);
      }
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Load initial data
    loadRadioStatus();
    loadComments();
    loadRadioDirectory();
    loadNowPlaying();
    loadWeather();
    loadNews();

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadRadioStatus = async () => {
    try {
      const response = await axios.get(`${API}/radio/status`);
      setRadioStatus(response.data);
    } catch (error) {
      console.error('Failed to load radio status:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await axios.get(`${API}/comments`);
      setComments(response.data.map(comment => ({
        ...comment,
        timestamp: new Date(comment.timestamp)
      })));
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadRadioDirectory = async () => {
    try {
      const response = await axios.get(`${API}/radio-directory`);
      setRadioStations(response.data);
    } catch (error) {
      console.error('Failed to load radio directory:', error);
    }
  };

  const loadNowPlaying = async () => {
    try {
      const response = await axios.get(`${API}/now-playing`);
      setNowPlaying(response.data);
    } catch (error) {
      console.error('Failed to load now playing:', error);
    }
  };

  const loadWeather = async () => {
    try {
      const response = await axios.get(`${API}/weather`);
      setWeather(response.data);
    } catch (error) {
      console.error('Failed to load weather:', error);
    }
  };

  const loadNews = async () => {
    try {
      const response = await axios.get(`${API}/news`);
      setNews(response.data);
    } catch (error) {
      console.error('Failed to load news:', error);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Playback failed:', error);
          // Try next stream URL if current one fails
          if (currentStreamIndex < streamUrls.length - 1) {
            setCurrentStreamIndex(prev => prev + 1);
            console.log(`Trying stream ${currentStreamIndex + 1}: ${streamUrls[currentStreamIndex + 1]}`);
          }
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.username.trim() || !newComment.message.trim()) return;

    try {
      await axios.post(`${API}/comments`, newComment);
      setNewComment({ ...newComment, message: '' });
    } catch (error) {
      console.error('Failed to send comment:', error);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Google AdSense Integration
  useEffect(() => {
    // Add Google AdSense script
    const adsenseScript = document.createElement('script');
    adsenseScript.async = true;
    adsenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5797573653969589';
    adsenseScript.crossOrigin = 'anonymous';
    document.head.appendChild(adsenseScript);

    // Initialize ads after script loads
    adsenseScript.onload = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense error:', error);
      }
    };

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(adsenseScript)) {
        document.head.removeChild(adsenseScript);
      }
    };
  }, []);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 relative"
      style={{
        backgroundImage: `url('https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/dc83vhra_a12a6cc8-c410-4855-811c-4f5c5fce72c6.jpeg')`,
        backgroundSize: '400px 400px',
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-slate-800/85 backdrop-blur-[1px]"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-600/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/20 backdrop-blur-sm flex items-center justify-center border border-orange-500/30">
                <img 
                  src="https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/bskjptue_IMG_0178.jpeg" 
                  alt="Radio Haiti Fusion Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Radio Haiti Fusion</h1>
                <p className="text-slate-400 text-sm">La radio qui va loin</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                LIVE
              </Badge>
              {radioStatus && (
                <div className="flex items-center text-slate-300 text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  {radioStatus.listeners.toLocaleString()} listeners
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Now Playing */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  {/* Album Artwork or Logo */}
                  <div className="w-32 h-32 mx-auto mb-6 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-orange-500/30 overflow-hidden">
                    {nowPlaying?.artwork_url ? (
                      <img 
                        src={nowPlaying.artwork_url} 
                        alt="Album Artwork" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to logo if artwork fails to load
                          e.target.src = "https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/bskjptue_IMG_0178.jpeg";
                          e.target.className = "w-24 h-24 object-contain";
                        }}
                      />
                    ) : (
                      <img 
                        src="https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/bskjptue_IMG_0178.jpeg" 
                        alt="Radio Haiti Fusion Logo" 
                        className="w-24 h-24 object-contain"
                      />
                    )}
                  </div>

                  {/* Now Playing Info */}
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {nowPlaying?.song || radioStatus?.current_song || 'Loading...'}
                    </h2>
                    <p className="text-slate-400 text-lg mb-1">
                      {nowPlaying?.artist || radioStatus?.current_artist || 'Radio Station'}
                    </p>
                    {nowPlaying?.album && (
                      <p className="text-slate-500 text-sm">
                        Album: {nowPlaying.album}
                      </p>
                    )}
                    {nowPlaying?.genre && (
                      <Badge variant="outline" className="mt-2 text-orange-400 border-orange-400/50">
                        {nowPlaying.genre}
                      </Badge>
                    )}
                  </div>

                  {/* Stream Status */}
                  {currentStreamIndex > 0 && (
                    <p className="text-yellow-400 text-sm mt-1">
                      Using fallback stream ({currentStreamIndex + 1}/{streamUrls.length})
                    </p>
                  )}
                </div>

                {/* Audio Player */}
                <audio
                  ref={audioRef}
                  src={streamUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Stream error:', e, 'URL:', streamUrl);
                    setIsPlaying(false);
                    // Try next stream URL
                    if (currentStreamIndex < streamUrls.length - 1) {
                      setCurrentStreamIndex(prev => prev + 1);
                      console.log(`Stream failed, trying next: ${streamUrls[currentStreamIndex + 1]}`);
                    }
                  }}
                  onCanPlay={() => console.log('Stream ready:', streamUrl)}
                  onLoadStart={() => console.log('Loading stream:', streamUrl)}
                />

                <div className="space-y-6">
                  {/* Play Controls */}
                  <div className="flex items-center justify-center space-x-6">
                    <Button
                      onClick={togglePlay}
                      size="lg"
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all duration-200 shadow-lg border border-orange-400/30"
                      data-testid="play-pause-button"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-slate-400 hover:text-white"
                      data-testid="mute-button"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <div className="flex-1 max-w-32">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider haiti-slider"
                        data-testid="volume-slider"
                      />
                    </div>
                    <span className="text-slate-400 text-sm min-w-[3rem]">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recently Played */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2z" clipRule="evenodd" />
                  </svg>
                  Récemment Joué
                </h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {/* Current Track */}
                  {nowPlaying && (
                    <div className="flex items-center space-x-3 bg-orange-500/10 rounded-lg p-3 border border-orange-500/30">
                      <div className="w-12 h-12 bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                        {nowPlaying.artwork_url ? (
                          <img 
                            src={nowPlaying.artwork_url} 
                            alt="Album" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 010 1.414L13.414 10l2.243 2.243a1 1 0 11-1.414 1.414L12 11.414l-2.243 2.243a1 1 0 01-1.414-1.414L10.586 10 8.343 7.757a1 1 0 011.414-1.414L12 8.586l2.243-2.243a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">
                          {nowPlaying.song}
                        </p>
                        <p className="text-slate-400 text-xs truncate">
                          {nowPlaying.artist}
                        </p>
                        {nowPlaying.duration && (
                          <p className="text-orange-400 text-xs">
                            {nowPlaying.duration}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center text-orange-400">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse mr-1"></div>
                        <span className="text-xs">En cours</span>
                      </div>
                    </div>
                  )}

                  {/* Placeholder for previous tracks */}
                  <div className="flex items-center space-x-3 bg-slate-700/30 rounded-lg p-3">
                    <div className="w-12 h-12 bg-slate-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-300 text-sm">Pa Manyen</p>
                      <p className="text-slate-500 text-xs">Boukman Eksperyans</p>
                      <p className="text-slate-500 text-xs">3:45</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 bg-slate-700/30 rounded-lg p-3">
                    <div className="w-12 h-12 bg-slate-600 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-300 text-sm">Kite Mwen Viv</p>
                      <p className="text-slate-500 text-xs">Sweet Micky</p>
                      <p className="text-slate-500 text-xs">4:12</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radio Information */}
            <Card className="bg-black/30 backdrop-blur-sm border-slate-700/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Radio className="w-5 h-5 mr-2 text-red-500" />
                  Informations de la Radio
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Émission Actuelle</h4>
                      <p className="text-slate-300 text-sm">Compas Direct Live</p>
                      <p className="text-slate-400 text-xs">Avec DJ Kenley</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Prochaine Émission</h4>
                      <p className="text-slate-300 text-sm">Nouvèl ak Mizik</p>
                      <p className="text-slate-400 text-xs">18:00 - 20:00</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Fréquence</h4>
                      <p className="text-slate-300 text-sm">FM 104.5 MHz</p>
                      <p className="text-slate-400 text-xs">Port-au-Prince & environs</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Qualité Stream</h4>
                      <p className="text-slate-300 text-sm">128 kbps MP3</p>
                      <p className="text-slate-400 text-xs">Haute qualité stéréo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Haiti Weather Widget */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                  </svg>
                  Météo Haïti 🇭🇹
                </h3>
                
                {weather ? (
                  <div>
                    {/* Main Weather Display */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{weather.icon}</div>
                        <div>
                          <p className="text-2xl font-bold text-white">{weather.temperature}°C</p>
                          <p className="text-slate-400 text-sm">{weather.condition}</p>
                          <p className="text-slate-500 text-xs">{weather.location}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        <p>Humidité: {weather.humidity}%</p>
                        <p>Vent: {weather.wind_speed} km/h</p>
                      </div>
                    </div>

                    {/* Quick Cities Overview */}
                    <div className="border-t border-slate-600/50 pt-3">
                      <p className="text-slate-400 text-xs mb-2">Autres villes haïtiennes:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Cap-Haïtien</span>
                          <span className="text-white">29°C ☀️</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Jacmel</span>
                          <span className="text-white">27°C ⛅</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Gonaïves</span>
                          <span className="text-white">31°C ☀️</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Les Cayes</span>
                          <span className="text-white">26°C 🌦️</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <div className="text-4xl">🌤️</div>
                    <div>
                      <p className="text-2xl font-bold text-white">28°C</p>
                      <p className="text-slate-400 text-sm">Chargement météo Haïti...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* World News */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                  </svg>
                  Actualités Mondiales
                </h3>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {news.length > 0 ? news.slice(0, 4).map((article, index) => (
                    <div key={article.id || index} className="border-l-4 border-green-400 pl-4 py-2">
                      <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-green-400 text-xs">{article.source}</span>
                        <span className="text-slate-500 text-xs">
                          {new Date(article.published_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-slate-400 text-sm">Chargement des actualités...</p>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-600/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-green-400 hover:text-green-300 text-xs w-full"
                  >
                    Voir toutes les actualités →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Google AdSense Ad Space */}
            <Card className="bg-gradient-to-r from-orange-600/20 to-orange-500/15 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">📢 Publicité</h3>
                </div>
                
                {/* Google AdSense Ad Unit */}
                <div className="flex justify-center">
                  <ins 
                    className="adsbygoogle"
                    style={{display: 'block'}}
                    data-ad-client="ca-pub-5797573653969589"
                    data-ad-slot="YOUR_AD_SLOT_ID"
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  ></ins>
                </div>
                
                {/* Fallback for when ads are loading */}
                <div className="bg-slate-800/30 rounded-lg p-8 border-2 border-dashed border-slate-600 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AD</span>
                  </div>
                  <p className="text-slate-300 mb-3">Espace publicitaire</p>
                  <p className="text-slate-400 text-sm">Google AdSense intégré</p>
                </div>
              </CardContent>
            </Card>

            {/* Radio Directory Portal */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Radio className="w-5 h-5 mr-2 text-blue-500" />
                  Portail Radio - Annuaire des Radios
                </h3>
                <p className="text-slate-300 text-sm mb-4">
                  Découvrez d'autres stations de radio haïtiennes et internationales
                </p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Dynamic Radio Stations */}
                  {radioStations.map((station) => (
                    <div 
                      key={station.id} 
                      className="bg-slate-700/60 rounded-lg p-4 border border-slate-600/30 hover:border-red-500/50 transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center mb-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                          style={{ background: `linear-gradient(to right, ${station.color}, ${station.color}dd)` }}
                        >
                          <Radio className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm">{station.name}</h4>
                          <p className="text-slate-400 text-xs">{station.frequency}</p>
                        </div>
                      </div>
                      <p className="text-slate-300 text-xs mb-2">{station.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 text-xs flex items-center">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                          {station.is_live ? 'En direct' : 'Hors ligne'}
                        </span>
                        <button 
                          className="text-blue-400 text-xs hover:text-blue-300 transition-colors"
                          onClick={() => station.stream_url && window.open(station.stream_url, '_blank')}
                        >
                          Écouter →
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add More Station Button */}
                  <div className="bg-slate-700/30 rounded-lg p-4 border-2 border-dashed border-slate-600/50 flex items-center justify-center hover:border-blue-500/50 transition-all duration-200 cursor-pointer group">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white text-lg font-bold">+</span>
                      </div>
                      <p className="text-slate-300 text-xs">Ajouter</p>
                      <p className="text-slate-300 text-xs">une radio</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs">
                      {radioStations.length} stations disponibles dans l'annuaire
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      Voir toutes les radios →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50 h-[600px] flex flex-col">
              <div className="p-4 border-b border-slate-600/50">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-slate-400" />
                  <h3 className="font-semibold text-white">Chat en direct</h3>
                  <Badge variant="outline" className="text-xs">
                    {comments.length}
                  </Badge>
                </div>
              </div>

              {/* Comments List */}
              <ScrollArea className="flex-1 p-4" data-testid="comments-area">
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-700/60 rounded-lg p-3 border border-slate-600/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">
                          {comment.username}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{comment.message}</p>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              </ScrollArea>

              <Separator className="bg-slate-600/50" />

              {/* Comment Form */}
              <div className="p-4">
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <Input
                    placeholder="Votre nom"
                    value={newComment.username}
                    onChange={(e) => setNewComment({...newComment, username: e.target.value})}
                    className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                    data-testid="username-input"
                  />
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newComment.message}
                      onChange={(e) => setNewComment({...newComment, message: e.target.value})}
                      className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300 flex-1"
                      data-testid="message-input"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                      data-testid="send-comment-button"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
      </div> {/* End content wrapper */}
    </div>
  );
}

export default App;