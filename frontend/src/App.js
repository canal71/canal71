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
  const [stationInfo, setStationInfo] = useState(null);
  const [donationInfo, setDonationInfo] = useState(null);
  const [djs, setDjs] = useState([]);
  const [showSchedule, setShowSchedule] = useState([]);
  const [socialMedia, setSocialMedia] = useState([]);
  const [songRequests, setSongRequests] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    listener_name: '',
    song_title: '',
    artist: '',
    dedication_to: '',
    dedication_message: ''
  });
  const [studioStatus, setStudioStatus] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [streamingMode, setStreamingMode] = useState('video'); // video or audio_only
  const [promotionalVideos, setPromotionalVideos] = useState([]);
  const [selectedVideoCategory, setSelectedVideoCategory] = useState('all');
  const [currentVideoSlide, setCurrentVideoSlide] = useState(0);
  const [advertisements, setAdvertisements] = useState([]);
  const [currentAdSlide, setCurrentAdSlide] = useState(0);
  
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
      } else if (data.type === 'new_song_request') {
        setSongRequests(prev => [data.request, ...prev.slice(0, 4)]);
      } else if (data.type === 'studio_status_update') {
        setStudioStatus(data.status);
      } else if (data.type === 'camera_switch') {
        if (videoStatus) {
          setVideoStatus({...videoStatus, current_camera: data.camera, video_url: data.video_url});
        }
      } else if (data.type === 'mode_switch') {
        setStreamingMode(data.mode);
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
    loadStationInfo();
    loadDonationInfo();
    loadDJs();
    loadShowSchedule();
    loadSocialMedia();
    loadLiveStats();
    loadEmergencyAlerts();
    loadSongRequests();
    loadStudioStatus();
    loadVideoStatus();
    loadPromotionalVideos();
    loadAdvertisements();

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
      
      // Also load cities weather
      const citiesResponse = await axios.get(`${API}/weather/cities`);
      setHaitiCities(citiesResponse.data);
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

  const loadStationInfo = async () => {
    try {
      const response = await axios.get(`${API}/station/about`);
      setStationInfo(response.data);
    } catch (error) {
      console.error('Failed to load station info:', error);
    }
  };

  const loadDonationInfo = async () => {
    try {
      const response = await axios.get(`${API}/donations/info`);
      setDonationInfo(response.data);
    } catch (error) {
      console.error('Failed to load donation info:', error);
    }
  };

  const loadDJs = async () => {
    try {
      const response = await axios.get(`${API}/djs`);
      setDjs(response.data);
    } catch (error) {
      console.error('Failed to load DJs:', error);
    }
  };

  const loadShowSchedule = async () => {
    try {
      const response = await axios.get(`${API}/schedule`);
      setShowSchedule(response.data);
    } catch (error) {
      console.error('Failed to load show schedule:', error);
    }
  };

  const loadSocialMedia = async () => {
    try {
      const response = await axios.get(`${API}/social-media`);
      setSocialMedia(response.data);
    } catch (error) {
      console.error('Failed to load social media:', error);
    }
  };

  const loadLiveStats = async () => {
    try {
      const response = await axios.get(`${API}/stats/live`);
      setLiveStats(response.data);
    } catch (error) {
      console.error('Failed to load live stats:', error);
    }
  };

  const loadEmergencyAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts/emergency`);
      setEmergencyAlerts(response.data.filter(alert => alert.is_active));
    } catch (error) {
      console.error('Failed to load emergency alerts:', error);
    }
  };

  const loadSongRequests = async () => {
    try {
      const response = await axios.get(`${API}/song-requests?status=pending&limit=5`);
      setSongRequests(response.data);
    } catch (error) {
      console.error('Failed to load song requests:', error);
    }
  };

  const handleSongRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.listener_name.trim() || !newRequest.song_title.trim() || !newRequest.artist.trim()) return;

    try {
      await axios.post(`${API}/song-requests`, newRequest);
      setNewRequest({
        listener_name: '',
        song_title: '',
        artist: '',
        dedication_to: '',
        dedication_message: ''
      });
      setShowRequestForm(false);
      loadSongRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to send song request:', error);
    }
  };

  const loadStudioStatus = async () => {
    try {
      const response = await axios.get(`${API}/studio/status`);
      setStudioStatus(response.data);
    } catch (error) {
      console.error('Failed to load studio status:', error);
    }
  };

  const loadVideoStatus = async () => {
    try {
      const response = await axios.get(`${API}/video/status`);
      setVideoStatus(response.data);
      setStreamingMode(response.data.mode);
    } catch (error) {
      console.error('Failed to load video status:', error);
    }
  };

  const switchStreamingMode = async (mode) => {
    try {
      await axios.post(`${API}/video/toggle-mode?mode=${mode}`);
      setStreamingMode(mode);
    } catch (error) {
      console.error('Failed to switch mode:', error);
    }
  };

  const switchCamera = async (cameraName) => {
    try {
      const response = await axios.post(`${API}/video/switch-camera?camera_name=${encodeURIComponent(cameraName)}`);
      if (videoStatus) {
        setVideoStatus({...videoStatus, current_camera: cameraName, video_url: response.data.video_url});
      }
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  const loadPromotionalVideos = async () => {
    try {
      const response = await axios.get(`${API}/videos/promotional?limit=12`);
      setPromotionalVideos(response.data);
    } catch (error) {
      console.error('Failed to load promotional videos:', error);
    }
  };

  // Auto-advance carousel every 10 seconds
  useEffect(() => {
    if (promotionalVideos.length === 0) return;
    
    const filteredVideos = promotionalVideos.filter(video => 
      selectedVideoCategory === 'all' || video.category === selectedVideoCategory
    );
    
    if (filteredVideos.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentVideoSlide(prev => (prev + 1) % filteredVideos.length);
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, [promotionalVideos, selectedVideoCategory, currentVideoSlide]);

  const loadAdvertisements = async () => {
    try {
      const response = await axios.get(`${API}/ads/banners`);
      setAdvertisements(response.data);
    } catch (error) {
      console.error('Failed to load advertisements:', error);
    }
  };

  // Auto-advance ads carousel based on ad duration
  useEffect(() => {
    if (advertisements.length === 0) return;
    
    const currentAd = advertisements[currentAdSlide];
    if (!currentAd) return;
    
    const interval = setInterval(() => {
      setCurrentAdSlide(prev => (prev + 1) % advertisements.length);
    }, (currentAd.duration_seconds || 5) * 1000);
    
    return () => clearInterval(interval);
  }, [advertisements, currentAdSlide]);

  const handleAdClick = async (ad) => {
    if (ad.link_url) {
      try {
        await axios.post(`${API}/ads/${ad.id}/click`);
        window.open(ad.link_url, '_blank');
      } catch (error) {
        console.error('Failed to track ad click:', error);
        window.open(ad.link_url, '_blank');
      }
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
              {liveStats && (
                <div className="flex items-center space-x-4 text-slate-300 text-sm">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {liveStats.current_listeners.toLocaleString()} en ligne
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {liveStats.total_requests} demandes
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Alerts */}
      {emergencyAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-600/90 to-orange-600/90 backdrop-blur-sm border-b border-red-500/50">
          <div className="container mx-auto px-4 py-3">
            {emergencyAlerts.map((alert, index) => (
              <div key={alert.id || index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-white animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <span className="font-semibold text-white text-sm">{alert.title}</span>
                    <span className="text-red-100 text-sm ml-2">{alert.message}</span>
                  </div>
                </div>
                <Badge className="bg-red-500 text-white text-xs">
                  {alert.urgency.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live TV/Radio Player */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                {/* Mode Switch */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    {streamingMode === 'video' ? (
                      <svg className="w-6 h-6 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    ) : (
                      <Radio className="w-6 h-6 mr-2 text-orange-400" />
                    )}
                    Radio Haiti Fusion {streamingMode === 'video' ? 'TV' : 'Radio'}
                  </h2>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => switchStreamingMode('video')}
                      size="sm"
                      variant={streamingMode === 'video' ? 'default' : 'outline'}
                      className={streamingMode === 'video' ? 'bg-red-600 hover:bg-red-700' : 'border-red-500 text-red-400 hover:bg-red-500/10'}
                    >
                      📺 TV
                    </Button>
                    <Button
                      onClick={() => switchStreamingMode('audio_only')}
                      size="sm"
                      variant={streamingMode === 'audio_only' ? 'default' : 'outline'}
                      className={streamingMode === 'audio_only' ? 'bg-orange-600 hover:bg-orange-700' : 'border-orange-500 text-orange-400 hover:bg-orange-500/10'}
                    >
                      📻 Radio
                    </Button>
                  </div>
                </div>

                {streamingMode === 'video' && videoStatus ? (
                  <div className="space-y-4">
                    {/* Video Player */}
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                      <iframe
                        src={videoStatus.video_url}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Radio Haiti Fusion Live TV"
                      ></iframe>
                      
                      {/* Video Overlay */}
                      <div className="absolute top-4 left-4 flex space-x-2">
                        <Badge className="bg-red-500 text-white animate-pulse">
                          🔴 LIVE TV
                        </Badge>
                        <Badge variant="outline" className="bg-black/50 text-white">
                          👁️ {videoStatus.viewers} viewers
                        </Badge>
                      </div>
                      
                      {/* Camera Switch */}
                      <div className="absolute top-4 right-4">
                        <select 
                          value={videoStatus.current_camera}
                          onChange={(e) => switchCamera(e.target.value)}
                          className="bg-black/70 text-white text-sm rounded px-2 py-1 border border-slate-600"
                        >
                          {videoStatus.cameras.map((camera) => (
                            <option key={camera} value={camera}>{camera}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Video Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button size="sm" variant="outline" className="border-red-500 text-red-400">
                          📹 Enregistrer
                        </Button>
                        <Button size="sm" variant="outline" className="border-blue-500 text-blue-400">
                          📸 Capture
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <span>Qualité: 1080p HD</span>
                        <span>•</span>
                        <span>Studio: {videoStatus.current_camera}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Album Artwork Display */}
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-6 bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-orange-500/30 overflow-hidden">
                        {nowPlaying?.artwork_url ? (
                          <img 
                            src={nowPlaying.artwork_url} 
                            alt="Album Artwork" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
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
                    </div>
                    
                    {/* Audio Player */}
                    <audio
                      ref={audioRef}
                      src={streamUrl}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={(e) => {
                        console.error('Stream error:', e);
                        setIsPlaying(false);
                        if (currentStreamIndex < streamUrls.length - 1) {
                          setCurrentStreamIndex(prev => prev + 1);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Now Playing Info */}
                <div className="text-center mb-4 mt-4">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {nowPlaying?.song || radioStatus?.current_song || 'En Direct'}
                  </h3>
                  <p className="text-slate-400">
                    {nowPlaying?.artist || radioStatus?.current_artist || 'Radio Haiti Fusion'}
                  </p>
                  {nowPlaying?.genre && (
                    <Badge variant="outline" className="mt-2 text-orange-400 border-orange-400/50">
                      {nowPlaying.genre}
                    </Badge>
                  )}
                </div>

                {/* Universal Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-6">
                    <Button
                      onClick={togglePlay}
                      size="lg"
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 transition-all duration-200 shadow-lg"
                      data-testid="play-pause-button"
                    >
                      {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                    </Button>
                  </div>

                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-slate-400 hover:text-white"
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
                      />
                    </div>
                    <span className="text-slate-400 text-sm min-w-[3rem]">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>

                {/* Stream Status */}
                {currentStreamIndex > 0 && (
                  <p className="text-yellow-400 text-sm text-center mt-4">
                    Backup stream ({currentStreamIndex + 1}/{streamUrls.length})
                  </p>
                )}
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

                    {/* Haiti Cities Overview */}
                    <div className="border-t border-slate-600/50 pt-3">
                      <p className="text-slate-400 text-xs mb-2">Autres villes haïtiennes:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {haitiCities.slice(0, 4).map((city, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-slate-300">{city.city}</span>
                            <span className="text-white">{city.temperature}°C {city.icon}</span>
                          </div>
                        ))}
                        {haitiCities.length === 0 && (
                          <>
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
                          </>
                        )}
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

            {/* About Radio Haiti Fusion */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  À Propos de la Station
                </h3>
                
                {stationInfo ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-white text-lg mb-2">{stationInfo.station_name}</h4>
                      <p className="text-orange-400 text-sm mb-3 italic">"{stationInfo.tagline}"</p>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {stationInfo.description}
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-600/50">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-slate-400 text-xs w-20">Fondée:</span>
                          <span className="text-white text-sm">{stationInfo.founded_year}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-400 text-xs w-20">Fréquence:</span>
                          <span className="text-white text-sm">{stationInfo.frequency}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-400 text-xs w-20">Lieu:</span>
                          <span className="text-white text-sm">{stationInfo.location}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="text-slate-400 text-xs w-16">Email:</span>
                          <span className="text-orange-400 text-sm">{stationInfo.contact_email}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-400 text-xs w-16">Promo:</span>
                          <span className="text-orange-400 text-sm">{stationInfo.promo_email}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-400 text-xs w-16">Site:</span>
                          <span className="text-blue-400 text-sm">{stationInfo.website}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-slate-400 text-xs w-16">WhatsApp:</span>
                          <span className="text-green-400 text-sm">{stationInfo.whatsapp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-600/50">
                      <p className="text-slate-300 text-sm italic">
                        <strong className="text-orange-400">Mission:</strong> {stationInfo.mission}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Chargement des informations...</p>
                )}
              </CardContent>
            </Card>

            {/* Donations Support */}
            <Card className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                  </svg>
                  Soutenez Radio Haiti Fusion 🇭🇹
                </h3>
                
                {donationInfo ? (
                  <div className="space-y-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {donationInfo.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Objectif de collecte</span>
                        <span className="text-white font-semibold">
                          ${donationInfo.current_amount?.toLocaleString()} / ${donationInfo.goal_amount?.toLocaleString()} {donationInfo.currency}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((donationInfo.current_amount / donationInfo.goal_amount) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-green-400 text-xs">
                        {Math.round((donationInfo.current_amount / donationInfo.goal_amount) * 100)}% de l'objectif atteint
                      </p>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <p className="text-slate-400 text-sm font-medium">Méthodes de don acceptées:</p>
                      <div className="grid grid-cols-2 gap-3">
                        {donationInfo.payment_methods?.map((method, index) => (
                          <div key={index} className="bg-slate-700/50 rounded-lg p-3 text-center">
                            <span className="text-white text-sm font-medium">{method}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Methods Details */}
                    <div className="space-y-3 mb-4">
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-xs font-semibold">PayPal:</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 px-2 text-xs border-blue-500 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => window.open(`https://paypal.me/${donationInfo.paypal_email?.replace('@gmail.com', '')}`, '_blank')}
                          >
                            Envoyer
                          </Button>
                        </div>
                        <p className="text-green-400 text-sm font-mono">{donationInfo.paypal_email}</p>
                      </div>
                      
                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-xs font-semibold">Zelle:</span>
                          <span className="text-purple-400 text-xs">Email</span>
                        </div>
                        <p className="text-green-400 text-sm font-mono">{donationInfo.zelle_email}</p>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-xs font-semibold">Cash App:</span>
                          <span className="text-green-400 text-xs">$5026017368</span>
                        </div>
                        <p className="text-green-400 text-sm font-mono">{donationInfo.cashapp_number}</p>
                      </div>
                    </div>

                    {/* Donation Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-xs"
                        onClick={() => window.open(`https://paypal.me/${donationInfo.paypal_email?.replace('@gmail.com', '')}`, '_blank')}
                      >
                        PayPal
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(donationInfo.zelle_email);
                          // You could add a toast notification here
                        }}
                      >
                        Zelle
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-xs"
                        onClick={() => window.open(`https://cash.app/$5026017368`, '_blank')}
                      >
                        Cash App
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-green-500 text-green-400 hover:bg-green-500/10 text-xs"
                      >
                        MonCash
                      </Button>
                    </div>

                    <p className="text-slate-500 text-xs text-center">
                      Merci pour votre soutien à la culture haïtienne! 🙏
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Chargement des informations de donation...</p>
                )}
              </CardContent>
            </Card>

            {/* Show Schedule */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Programme des Émissions
                </h3>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {showSchedule.map((show, index) => (
                    <div key={show.id || index} className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-purple-400">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white text-sm">{show.name}</h4>
                        {show.is_live && (
                          <Badge className="bg-red-500 text-white text-xs animate-pulse">
                            EN DIRECT
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs mb-2 line-clamp-2">
                        {show.description}
                      </p>
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-purple-400 font-medium">{show.host_dj}</span>
                          <span className="text-slate-500 ml-2">• {show.genre}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400">{show.day_of_week}</p>
                          <p className="text-white font-mono">{show.start_time} - {show.end_time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-600/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-purple-400 hover:text-purple-300 text-xs w-full"
                  >
                    Voir le programme complet →
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* DJ Space */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Nos DJs
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {djs.slice(0, 4).map((dj, index) => (
                    <div key={dj.id || index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                          {dj.photo_url ? (
                            <img 
                              src={dj.photo_url} 
                              alt={dj.stage_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span className="text-white font-bold text-sm">
                            {dj.stage_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-sm">{dj.stage_name}</h4>
                          <p className="text-slate-400 text-xs">{dj.name}</p>
                        </div>
                      </div>
                      
                      <p className="text-slate-300 text-xs mb-2 line-clamp-2">
                        {dj.bio}
                      </p>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Spécialité:</span>
                          <span className="text-yellow-400">{dj.specialty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Expérience:</span>
                          <span className="text-white">{dj.years_experience} ans</span>
                        </div>
                        {dj.schedule && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Horaires:</span>
                            <span className="text-white">{dj.schedule}</span>
                          </div>
                        )}
                      </div>

                      {/* Social Media Links */}
                      {dj.social_media && Object.keys(dj.social_media).length > 0 && (
                        <div className="flex space-x-2 mt-3 pt-2 border-t border-slate-600/50">
                          {Object.entries(dj.social_media).map(([platform, handle]) => (
                            <div key={platform} className="text-xs">
                              <span className="text-slate-500 capitalize">{platform}:</span>
                              <span className="text-yellow-400 ml-1">{handle}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {djs.length > 4 && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-yellow-400 hover:text-yellow-300 text-xs w-full"
                    >
                      Voir tous les DJs ({djs.length}) →
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5zM15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  Suivez-nous sur les Réseaux Sociaux
                </h3>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {socialMedia.map((platform, index) => (
                    <div 
                      key={platform.platform || index} 
                      className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30 hover:border-pink-500/50 transition-all duration-200 cursor-pointer group"
                      onClick={() => platform.url && window.open(platform.url, '_blank')}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {/* Platform Icons */}
                          {platform.platform === 'WhatsApp' && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">W</span>
                            </div>
                          )}
                          {platform.platform === 'Facebook' && (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">f</span>
                            </div>
                          )}
                          {platform.platform === 'Instagram' && (
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">📷</span>
                            </div>
                          )}
                          {platform.platform === 'Twitter' && (
                            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">🐦</span>
                            </div>
                          )}
                          {platform.platform === 'YouTube' && (
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">▶️</span>
                            </div>
                          )}
                          {platform.platform === 'TikTok' && (
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">🎵</span>
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-white text-sm">{platform.platform}</h4>
                            <p className="text-slate-400 text-xs">{platform.handle}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-xs">
                          {platform.follower_count?.toLocaleString()} followers
                        </span>
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-600/50">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="font-semibold text-white text-sm mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Contacts Directs
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400">WhatsApp:</span>
                        <span className="text-green-400 ml-2 font-mono">5026017368</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Promo:</span>
                        <span className="text-pink-400 ml-2">haitifusionpromo@gmail.com</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-400">Site Web:</span>
                        <span className="text-blue-400 ml-2">www.radiohaitifusion.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Statistics */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  Statistiques en Direct
                </h3>
                
                {liveStats ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{liveStats.current_listeners.toLocaleString()}</div>
                      <div className="text-slate-400 text-sm">En ligne maintenant</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{liveStats.peak_today.toLocaleString()}</div>
                      <div className="text-slate-400 text-sm">Record du jour</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">{liveStats.total_requests}</div>
                      <div className="text-slate-400 text-sm">Demandes reçues</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-400">{liveStats.countries_listening.length}</div>
                      <div className="text-slate-400 text-sm">Pays à l'écoute</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">Chargement des statistiques...</div>
                )}
                
                {liveStats && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <p className="text-slate-400 text-sm mb-2">Pays à l'écoute:</p>
                    <div className="flex flex-wrap gap-2">
                      {liveStats.countries_listening.map((country, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {country === 'Haiti' ? '🇭🇹' : country === 'USA' ? '🇺🇸' : country === 'Canada' ? '🇨🇦' : country === 'France' ? '🇫🇷' : '🌍'} {country}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Promotional Videos Carousel */}
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Vidéos Promotionnelles
                  </h3>
                  
                  <div className="flex items-center space-x-3">
                    <select 
                      value={selectedVideoCategory}
                      onChange={(e) => {
                        setSelectedVideoCategory(e.target.value);
                        setCurrentVideoSlide(0);
                      }}
                      className="bg-slate-700 text-white text-sm rounded px-3 py-1 border border-slate-600"
                    >
                      <option value="all">Toutes</option>
                      <option value="promotion">Promos</option>
                      <option value="interview">Interviews</option>
                      <option value="concert">Concerts</option>
                      <option value="behind_scenes">Coulisses</option>
                    </select>
                    
                    {/* Navigation Arrows */}
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setCurrentVideoSlide(Math.max(0, currentVideoSlide - 1))}
                        disabled={currentVideoSlide === 0}
                        className="text-slate-400 hover:text-white p-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          const filteredVideos = promotionalVideos.filter(video => 
                            selectedVideoCategory === 'all' || video.category === selectedVideoCategory
                          );
                          setCurrentVideoSlide(Math.min(filteredVideos.length - 1, currentVideoSlide + 1));
                        }}
                        disabled={currentVideoSlide >= (promotionalVideos.filter(video => 
                          selectedVideoCategory === 'all' || video.category === selectedVideoCategory
                        ).length - 1)}
                        className="text-slate-400 hover:text-white p-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Video Carousel */}
                <div className="relative overflow-hidden rounded-lg">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ 
                      transform: `translateX(-${currentVideoSlide * 100}%)` 
                    }}
                  >
                    {promotionalVideos
                      .filter(video => selectedVideoCategory === 'all' || video.category === selectedVideoCategory)
                      .map((video, index) => (
                      <div key={video.id || index} className="w-full flex-shrink-0">
                        <div className="bg-slate-700/50 rounded-lg overflow-hidden">
                          {/* Main Video Display */}
                          <div className="relative aspect-video bg-black group cursor-pointer">
                            {video.video_url ? (
                              <iframe
                                src={video.video_url}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={video.title}
                              ></iframe>
                            ) : video.thumbnail_url ? (
                              <img 
                                src={video.thumbnail_url} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center">
                                <svg className="w-20 h-20 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                              </div>
                            )}
                            
                            {/* Video Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  {video.duration && (
                                    <Badge className="bg-red-500 text-white text-xs">
                                      {video.duration}
                                    </Badge>
                                  )}
                                  {video.is_featured && (
                                    <Badge className="bg-yellow-500 text-black text-xs">
                                      ⭐ FEATURED
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-white border-white/30 text-xs capitalize">
                                    {video.category}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-white text-xs">
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    {video.view_count?.toLocaleString()}
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                    {video.likes?.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Video Details */}
                          <div className="p-4">
                            <h4 className="text-xl font-bold text-white mb-2">
                              {video.title}
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {video.description}
                            </p>
                            <p className="text-slate-500 text-xs mt-2">
                              Publié le {new Date(video.upload_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Slide Indicators */}
                {promotionalVideos.filter(video => selectedVideoCategory === 'all' || video.category === selectedVideoCategory).length > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    {promotionalVideos
                      .filter(video => selectedVideoCategory === 'all' || video.category === selectedVideoCategory)
                      .map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentVideoSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentVideoSlide === index ? 'bg-red-500' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Advertising Carousel */}
            <Card className="bg-gradient-to-r from-orange-600/20 to-orange-500/15 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    📢 Publicités
                  </h3>
                  <div className="flex items-center space-x-2">
                    {advertisements.length > 1 && (
                      <>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setCurrentAdSlide(Math.max(0, currentAdSlide - 1))}
                          className="text-orange-400 hover:text-white p-1"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </Button>
                        <span className="text-slate-400 text-xs">
                          {currentAdSlide + 1}/{advertisements.length}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setCurrentAdSlide((currentAdSlide + 1) % advertisements.length)}
                          className="text-orange-400 hover:text-white p-1"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Advertisement Carousel */}
                <div className="relative overflow-hidden rounded-lg min-h-[200px]">
                  {advertisements.length > 0 ? (
                    <div 
                      className="flex transition-transform duration-1000 ease-in-out"
                      style={{ 
                        transform: `translateX(-${currentAdSlide * 100}%)` 
                      }}
                    >
                      {advertisements.map((ad, index) => (
                        <div key={ad.id || index} className="w-full flex-shrink-0">
                          <div 
                            className="bg-slate-800/40 rounded-lg overflow-hidden cursor-pointer hover:bg-slate-800/60 transition-all duration-200 group"
                            onClick={() => handleAdClick(ad)}
                          >
                            {/* Ad Image/Banner */}
                            <div className="relative aspect-[8/3] bg-gradient-to-r from-orange-500 to-orange-600">
                              {ad.image_url ? (
                                <img 
                                  src={ad.image_url} 
                                  alt={ad.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                                <div className="text-center text-white">
                                  <h4 className="text-2xl font-bold mb-2">{ad.title}</h4>
                                  <p className="text-lg opacity-90">{ad.description}</p>
                                </div>
                              </div>
                              
                              {/* Click Indicator */}
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                    <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z" />
                                  </svg>
                                  Cliquer
                                </div>
                              </div>
                            </div>
                            
                            {/* Ad Footer */}
                            <div className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-slate-400 text-xs">Annonceur:</p>
                                  <p className="text-white font-medium text-sm">{ad.advertiser}</p>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                  <div className="flex items-center space-x-3">
                                    <span>👀 {ad.impressions?.toLocaleString()}</span>
                                    <span>👆 {ad.clicks?.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 rounded-lg p-8 border-2 border-dashed border-slate-600 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">AD</span>
                      </div>
                      <p className="text-slate-300 mb-3">Espace publicitaire disponible</p>
                      <p className="text-slate-400 text-sm">Contactez-nous: haitifusionpromo@gmail.com</p>
                    </div>
                  )}
                </div>
                
                {/* Progress Indicator */}
                {advertisements.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-400 text-xs">Prochaine pub dans:</span>
                      <span className="text-orange-400 text-xs">
                        {advertisements[currentAdSlide]?.duration_seconds || 5}s
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-1 rounded-full transition-all duration-100"
                        style={{ 
                          animation: `progress ${(advertisements[currentAdSlide]?.duration_seconds || 5)}s linear infinite` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Slide Dots */}
                {advertisements.length > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    {advertisements.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentAdSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          currentAdSlide === index ? 'bg-orange-500' : 'bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                )}
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
          <div className="lg:col-span-1 space-y-6">
            {/* Live Studio Status */}
            {studioStatus && (
              <Card className={`backdrop-blur-sm border-slate-600/50 ${studioStatus.is_live ? 'bg-gradient-to-r from-red-600/30 to-red-500/20' : 'bg-slate-800/40'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <svg className="w-5 h-5 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                      Studio Status
                    </h3>
                    <Badge className={`${studioStatus.is_live ? 'bg-red-500 animate-pulse' : 'bg-gray-500'} text-white text-xs`}>
                      {studioStatus.is_live ? 'EN DIRECT' : 'HORS ANTENNE'}
                    </Badge>
                  </div>
                  
                  {studioStatus.is_live ? (
                    <div className="space-y-3">
                      <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-400 font-semibold text-sm">LIVE DU STUDIO</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-white font-medium">{studioStatus.dj_name}</p>
                          <p className="text-slate-300 text-sm">{studioStatus.show_name}</p>
                          <p className="text-slate-400 text-xs">{studioStatus.studio_location}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-700/50 rounded p-2">
                          <span className="text-slate-400">Début:</span>
                          <p className="text-white font-mono">
                            {new Date(studioStatus.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        {studioStatus.next_break && (
                          <div className="bg-slate-700/50 rounded p-2">
                            <span className="text-slate-400">Pause:</span>
                            <p className="text-white font-mono">{studioStatus.next_break}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-600/50">
                        <span className="text-slate-400 text-xs">Appels en attente:</span>
                        <span className="text-orange-400 font-semibold">{studioStatus.live_callers}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <svg className="w-12 h-12 text-slate-500 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <p className="text-slate-400 text-sm">Programmation automatique</p>
                      <p className="text-slate-500 text-xs">Aucun DJ en direct</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Song Request Widget */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Demandes de Chansons
                </h3>
                
                {!showRequestForm ? (
                  <Button 
                    onClick={() => setShowRequestForm(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    data-testid="request-song-button"
                  >
                    🎵 Demander une Chanson
                  </Button>
                ) : (
                  <form onSubmit={handleSongRequest} className="space-y-3">
                    <Input
                      placeholder="Votre nom"
                      value={newRequest.listener_name}
                      onChange={(e) => setNewRequest({...newRequest, listener_name: e.target.value})}
                      className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                    />
                    <Input
                      placeholder="Titre de la chanson"
                      value={newRequest.song_title}
                      onChange={(e) => setNewRequest({...newRequest, song_title: e.target.value})}
                      className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                    />
                    <Input
                      placeholder="Artiste"
                      value={newRequest.artist}
                      onChange={(e) => setNewRequest({...newRequest, artist: e.target.value})}
                      className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                    />
                    <Input
                      placeholder="Dédicace à... (optionnel)"
                      value={newRequest.dedication_to}
                      onChange={(e) => setNewRequest({...newRequest, dedication_to: e.target.value})}
                      className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                    />
                    <Input
                      placeholder="Message de dédicace (optionnel)"
                      value={newRequest.dedication_message}
                      onChange={(e) => setNewRequest({...newRequest, dedication_message: e.target.value})}
                      className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                    />
                    <div className="flex space-x-2">
                      <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                        Envoyer
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowRequestForm(false)}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                )}
                
                {/* Recent Requests */}
                {songRequests.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <p className="text-slate-400 text-xs mb-2">Demandes récentes:</p>
                    <div className="space-y-2">
                      {songRequests.slice(0, 3).map((request, index) => (
                        <div key={request.id || index} className="bg-slate-700/30 rounded p-2">
                          <p className="text-white text-xs font-medium">"{request.song_title}" - {request.artist}</p>
                          <p className="text-slate-400 text-xs">par {request.listener_name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-600/50 h-[500px] flex flex-col">
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