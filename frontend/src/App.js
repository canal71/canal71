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
  
  const audioRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Radio Haiti Fusion live streams - you can add unlimited streams here
  const streamUrls = [
    "http://xtremeradiohosting.com:8076",
    "http://xtremeradiohosting.com:8076/stream",
    "http://xtremeradiohosting.com:8076/live",
    "http://xtremeradiohosting.com:8076/radio",
    "https://stream.radiojar.com/4wqre23fytzuv", // Fallback demo stream
    // Add more backup streams here as needed
    // "http://backup1.your-radio.com:8000/stream",
    // "http://backup2.your-radio.com:8000/stream",
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
      }
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Load initial data
    loadRadioStatus();
    loadComments();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-600/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <img 
                  src="https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/ck3ei9rs_IMG_0124.png" 
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
                  <div className="w-32 h-32 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                    <img 
                      src="https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/ck3ei9rs_IMG_0124.png" 
                      alt="Radio Haiti Fusion Logo" 
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {radioStatus?.current_song || 'Loading...'}
                  </h2>
                  <p className="text-slate-400 text-lg">
                    {radioStatus?.current_artist || 'Radio Station'}
                  </p>
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
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 transition-all duration-200 shadow-lg border border-white/20"
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

            {/* Dedicated Advertising Space */}
            <Card className="bg-gradient-to-r from-red-600/25 to-blue-600/25 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-white mb-2">📢 Espace Publicitaire</h3>
                  <p className="text-slate-300 mb-4">
                    Votre publicité ici! Atteignez notre audience de milliers d'auditeurs quotidiens.
                  </p>
                </div>
                
                {/* Ad Placeholder - Replace with actual ads */}
                <div className="bg-slate-800/30 rounded-lg p-8 border-2 border-dashed border-slate-600 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AD</span>
                  </div>
                  <p className="text-slate-300 mb-3">Espace réservé pour publicité</p>
                  <p className="text-slate-400 text-sm mb-4">300x250 px recommandé</p>
                  <Button 
                    className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700"
                    data-testid="advertise-button"
                  >
                    Réservez cet espace
                  </Button>
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
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    data-testid="username-input"
                  />
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={newComment.message}
                      onChange={(e) => setNewComment({...newComment, message: e.target.value})}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 flex-1"
                      data-testid="message-input"
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700"
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
    </div>
  );
}

export default App;