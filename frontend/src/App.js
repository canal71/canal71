/* eslint-disable no-undef */
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { ScrollArea } from "./components/ui/scroll-area";
import { Play, Pause, Volume2, VolumeX, Radio, Users, MessageCircle, Send, Mic, Music, TrendingUp, Brain, Trophy, Target, Headphones, Download, Clock, Tv, Calendar, Star, Server, DollarSign, BarChart3 } from "lucide-react";
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
  const [voiceMessages, setVoiceMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  // Top 10 Charts state
  const [charts, setCharts] = useState([]);
  const [selectedChartCategory, setSelectedChartCategory] = useState('most_requested');
  const [chartCategories, setChartCategories] = useState([]);
  const [showChartsModal, setShowChartsModal] = useState(false);
  
  // Trivia Game state
  const [triviaGame, setTriviaGame] = useState(null);
  const [triviaQuestions, setTriviaQuestions] = useState([]);
  const [triviaLeaderboard, setTriviaLeaderboard] = useState([]);
  const [showTriviaModal, setShowTriviaModal] = useState(false);
  const [triviaPlayerName, setTriviaPlayerName] = useState('');
  const [currentTriviaAnswer, setCurrentTriviaAnswer] = useState(null);
  const [triviaCategory, setTriviaCategory] = useState('mixed');
  
  // Breaking News state
  const [breakingNews, setBreakingNews] = useState([]);
  const [showBreakingNews, setShowBreakingNews] = useState(true);
  
  // Podcast state
  const [podcastEpisodes, setPodcastEpisodes] = useState([]);
  const [podcastCategories, setPodcastCategories] = useState([]);
  const [selectedPodcastCategory, setSelectedPodcastCategory] = useState('all');
  const [currentPodcast, setCurrentPodcast] = useState(null);
  const [isPodcastPlaying, setIsPodcastPlaying] = useState(false);
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  
  // TV state
  const [tvShows, setTvShows] = useState([]);
  const [tvCategories, setTvCategories] = useState([]);
  const [selectedTvCategory, setSelectedTvCategory] = useState('all');
  const [tvChannel, setTvChannel] = useState(null);
  const [tvSchedule, setTvSchedule] = useState([]);
  const [currentTvShow, setCurrentTvShow] = useState(null);
  const [showTvSection, setShowTvSection] = useState(false);
  
  // Reseller Hosting state
  const [hostingPlans, setHostingPlans] = useState([]);
  const [hostingClients, setHostingClients] = useState([]);
  const [hostingStats, setHostingStats] = useState(null);
  const [showHostingSection, setShowHostingSection] = useState(false);
  const [hostingSignupForm, setHostingSignupForm] = useState({
    station_name: '',
    contact_name: '',
    email: '',
    phone: '',
    plan_id: 'professional',
    notes: ''
  });
  
  // Radio Directory Page state
  const [showRadioDirectory, setShowRadioDirectory] = useState(false);
  const [showStationForm, setShowStationForm] = useState(false);
  const [stationProposal, setStationProposal] = useState({
    name: '',
    frequency: '',
    description: '',
    location: '',
    country: 'Haïti',
    genre: '',
    stream_url: '',
    website_url: '',
    contact_email: '',
    contact_name: '',
    logo_url: ''
  });
  
  const audioRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Radio Haiti Fusion live streams - configurable via environment variables
  const streamUrls = [
    process.env.REACT_APP_PRIMARY_STREAM_URL,
    `${process.env.REACT_APP_PRIMARY_STREAM_URL}${process.env.REACT_APP_STREAM_PATH_1}`,
    process.env.REACT_APP_PRIMARY_STREAM_URL, // Second stream
    `${process.env.REACT_APP_PRIMARY_STREAM_URL}${process.env.REACT_APP_STREAM_PATH_1}`, // Second stream with /stream path
    `${process.env.REACT_APP_PRIMARY_STREAM_URL}${process.env.REACT_APP_STREAM_PATH_2}`,
    `${process.env.REACT_APP_PRIMARY_STREAM_URL}${process.env.REACT_APP_STREAM_PATH_3}`,
    process.env.REACT_APP_FALLBACK_STREAM, // Fallback demo stream
    // Add more backup streams here as needed
  ].filter(Boolean); // Remove any undefined URLs
  
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

    // Load critical data first (Stage 1)
    const loadCriticalData = async () => {
      try {
        await Promise.all([
          loadRadioStatus(),
          loadNowPlaying(),
          loadStudioStatus(),
          loadVideoStatus(),
          loadLiveStats()
        ]);
      } catch (error) {
        console.error('Failed to load critical data:', error);
      }
    };

    // Load content data (Stage 2)  
    const loadContentData = async () => {
      try {
        await Promise.all([
          loadComments(),
          loadWeather(),
          loadNews(),
          loadStationInfo(),
          loadSocialMedia(),
          loadEmergencyAlerts(),
          loadSongRequests()
        ]);
      } catch (error) {
        console.error('Failed to load content data:', error);
      }
    };

    // Load feature data (Stage 3)
    const loadFeatureData = async () => {
      try {
        await Promise.all([
          loadDJs(),
          loadShowSchedule(),
          loadPromotionalVideos(),
          loadAdvertisements(),
          loadChartCategories(),
          loadCharts(),
          loadTriviaLeaderboard(),
          loadBreakingNews()
        ]);
      } catch (error) {
        console.error('Failed to load feature data:', error);
      }
    };

    // Load multimedia data (Stage 4)
    const loadMultimediaData = async () => {
      try {
        await Promise.all([
          loadPodcastCategories(),
          loadPodcastEpisodes(),
          loadTvChannel(),
          loadTvCategories(),
          loadTvShows(),
          loadTvSchedule()
        ]);
      } catch (error) {
        console.error('Failed to load multimedia data:', error);
      }
    };

    // Load hosting data (Stage 5)
    const loadHostingData = async () => {
      try {
        await Promise.all([
          loadHostingPlans(),
          loadHostingStats(),
          loadRadioDirectory(),
          loadDonationInfo()
        ]);
      } catch (error) {
        console.error('Failed to load hosting data:', error);
      }
    };

    // Execute loading in stages with delays
    const initializeApp = async () => {
      await loadCriticalData();
      setTimeout(() => loadContentData(), 100);
      setTimeout(() => loadFeatureData(), 300);
      setTimeout(() => loadMultimediaData(), 500);
      setTimeout(() => loadHostingData(), 700);
    };

    initializeApp();

    // Set up periodic now playing refresh (every 30 seconds)
    const nowPlayingInterval = setInterval(() => {
      loadNowPlaying();
    }, 30000);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
      clearInterval(nowPlayingInterval);
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

  // Voice Recording Functions
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      const timer = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) { // Max 60 seconds
            stopVoiceRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Store timer to clear it later
      recorder.timer = timer;
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès et réessayer.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      clearInterval(mediaRecorder.timer);
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const sendVoiceMessage = async (listenerName, messageType = 'song_request') => {
    if (!recordedAudio || !listenerName.trim()) return;

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = reader.result.split(',')[1]; // Remove data:audio/wav;base64, prefix
        
        const voiceData = {
          listener_name: listenerName,
          message_type: messageType,
          duration: recordingTime,
          audio_data: base64Audio
        };

        await axios.post(`${API}/voice-messages`, voiceData);
        
        // Reset recording state
        setRecordedAudio(null);
        setRecordingTime(0);
        setShowVoiceRecorder(false);
        
        alert('Message vocal envoyé avec succès!');
      };
      reader.readAsDataURL(recordedAudio);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      alert('Erreur lors de l\'envoi du message vocal.');
    }
  };

  const cancelVoiceRecording = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
    setRecordedAudio(null);
    setRecordingTime(0);
    setShowVoiceRecorder(false);
  };

  // Top 10 Charts Functions
  const loadChartCategories = async () => {
    try {
      const response = await axios.get(`${API}/charts/categories`);
      setChartCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load chart categories:', error);
    }
  };

  const loadCharts = async (category = selectedChartCategory) => {
    try {
      const response = await axios.get(`${API}/charts/${category}`);
      setCharts(response.data);
    } catch (error) {
      console.error('Failed to load charts:', error);
    }
  };

  const voteForSong = async (songTitle, artist) => {
    if (!newComment.username.trim()) {
      alert('Veuillez entrer votre nom dans le chat pour voter!');
      return;
    }
    
    try {
      await axios.post(`${API}/charts/${selectedChartCategory}/vote`, null, {
        params: {
          song_title: songTitle,
          artist: artist,
          listener_name: newComment.username
        }
      });
      
      // Refresh charts after voting
      loadCharts();
      alert('Vote enregistré avec succès!');
    } catch (error) {
      console.error('Failed to vote for song:', error);
      alert('Erreur lors du vote. Veuillez réessayer.');
    }
  };

  // Trivia Game Functions
  const loadTriviaLeaderboard = async () => {
    try {
      const response = await axios.get(`${API}/trivia/leaderboard`);
      setTriviaLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load trivia leaderboard:', error);
    }
  };

  const startTriviaGame = async () => {
    if (!triviaPlayerName.trim()) {
      alert('Veuillez entrer votre nom!');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/trivia/games`, null, {
        params: {
          player_name: triviaPlayerName,
          category: triviaCategory
        }
      });
      setTriviaGame(response.data);
      setCurrentTriviaAnswer(null);
    } catch (error) {
      console.error('Failed to start trivia game:', error);
      alert('Erreur lors du démarrage du jeu.');
    }
  };

  const answerTriviaQuestion = async (selectedAnswer) => {
    if (!triviaGame) return;
    
    try {
      const response = await axios.post(`${API}/trivia/games/${triviaGame.id}/answer`, null, {
        params: {
          selected_answer: selectedAnswer
        }
      });
      setCurrentTriviaAnswer(response.data);
      
      // If game completed, refresh leaderboard
      if (response.data.game_status === 'completed') {
        loadTriviaLeaderboard();
      }
    } catch (error) {
      console.error('Failed to answer trivia question:', error);
    }
  };

  const resetTriviaGame = () => {
    setTriviaGame(null);
    setCurrentTriviaAnswer(null);
    setTriviaPlayerName('');
  };

  // Breaking News Functions
  const loadBreakingNews = () => {
    // Sample breaking news - in production this would come from an API
    const sampleBreakingNews = [
      "🔴 EN DIRECT: Radio Haiti Fusion maintenant disponible sur toutes les plateformes - Écoutez-nous partout!",
      "🎵 NOUVEAU: Top 10 Charts mis à jour toutes les heures - Votez pour vos chansons préférées!",
      "🎤 INNOVATION: Nouveau système de messages vocaux - Envoyez vos demandes par voix!",
      "📱 SUIVEZ-NOUS: @haitifusiondon sur Instagram, @fusion_haiti sur Twitter/X, @radiohaitifusion sur TikTok",
      "🏆 TRIVIA: Testez vos connaissances sur la musique et culture haïtiennes - Jeu disponible maintenant!",
      "📧 CONTACT: haitifusionpromo@gmail.com pour collaborations et événements spéciaux"
    ];
    
    setBreakingNews(sampleBreakingNews);
  };

  // Podcast Functions
  const loadPodcastCategories = async () => {
    try {
      const response = await axios.get(`${API}/podcasts/categories`);
      setPodcastCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load podcast categories:', error);
    }
  };

  const loadPodcastEpisodes = async (category = selectedPodcastCategory) => {
    try {
      const response = await axios.get(`${API}/podcasts/episodes`, {
        params: { category: category, limit: 20 }
      });
      setPodcastEpisodes(response.data);
    } catch (error) {
      console.error('Failed to load podcast episodes:', error);
    }
  };

  const playPodcast = async (episode) => {
    try {
      setCurrentPodcast(episode);
      setIsPodcastPlaying(true);
      
      // Track play count
      await axios.post(`${API}/podcasts/episodes/${episode.id}/play`);
    } catch (error) {
      console.error('Failed to play podcast:', error);
    }
  };

  const downloadPodcast = async (episode) => {
    try {
      // Track download count
      await axios.post(`${API}/podcasts/episodes/${episode.id}/download`);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = episode.audio_url;
      link.download = `${episode.title}.mp3`;
      link.click();
    } catch (error) {
      console.error('Failed to download podcast:', error);
    }
  };

  // TV Functions
  const loadTvChannel = async () => {
    try {
      const response = await axios.get(`${API}/tv/channel`);
      setTvChannel(response.data);
    } catch (error) {
      console.error('Failed to load TV channel:', error);
    }
  };

  const loadTvCategories = async () => {
    try {
      const response = await axios.get(`${API}/tv/categories`);
      setTvCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load TV categories:', error);
    }
  };

  const loadTvShows = async (category = selectedTvCategory) => {
    try {
      const response = await axios.get(`${API}/tv/shows`, {
        params: { category: category, limit: 20 }
      });
      setTvShows(response.data);
    } catch (error) {
      console.error('Failed to load TV shows:', error);
    }
  };

  const loadTvSchedule = async () => {
    try {
      const response = await axios.get(`${API}/tv/schedule`);
      setTvSchedule(response.data);
    } catch (error) {
      console.error('Failed to load TV schedule:', error);
    }
  };

  const playTvShow = async (show) => {
    try {
      setCurrentTvShow(show);
      
      // Track view count
      await axios.post(`${API}/tv/shows/${show.id}/view`);
    } catch (error) {
      console.error('Failed to play TV show:', error);
    }
  };

  // Reseller Hosting Functions
  const loadHostingPlans = async () => {
    try {
      const response = await axios.get(`${API}/hosting/plans`);
      setHostingPlans(response.data);
    } catch (error) {
      console.error('Failed to load hosting plans:', error);
    }
  };

  const loadHostingStats = async () => {
    try {
      const response = await axios.get(`${API}/hosting/stats`);
      setHostingStats(response.data);
    } catch (error) {
      console.error('Failed to load hosting stats:', error);
    }
  };

  const loadHostingClients = async () => {
    try {
      const response = await axios.get(`${API}/hosting/clients`);
      setHostingClients(response.data);
    } catch (error) {
      console.error('Failed to load hosting clients:', error);
    }
  };

  const submitHostingSignup = async (e) => {
    e.preventDefault();
    if (!hostingSignupForm.station_name || !hostingSignupForm.contact_name || !hostingSignupForm.email) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    try {
      const response = await axios.post(`${API}/hosting/signup`, hostingSignupForm);
      alert(`Bienvenue ${response.data.station_name}! Votre compte a été créé avec succès. Vous recevrez un email avec vos informations de connexion.`);
      
      // Reset form
      setHostingSignupForm({
        station_name: '',
        contact_name: '',
        email: '',
        phone: '',
        plan_id: 'professional',
        notes: ''
      });
    } catch (error) {
      console.error('Failed to create hosting account:', error);
      alert('Erreur lors de la création du compte. Veuillez réessayer.');
    }
  };

  // Radio Station Proposal Functions
  const submitStationProposal = async (e) => {
    e.preventDefault();
    if (!stationProposal.name || !stationProposal.frequency || !stationProposal.description || !stationProposal.contact_name || !stationProposal.contact_email) {
      alert('Veuillez remplir tous les champs requis (*).');
      return;
    }

    try {
      const response = await axios.post(`${API}/radio-directory/propose`, stationProposal);
      alert(`Merci ${stationProposal.contact_name}! Votre proposition pour "${stationProposal.name}" a été soumise avec succès. Notre équipe l'examinera et vous contactera bientôt.`);
      
      // Reset form
      setStationProposal({
        name: '',
        frequency: '',
        description: '',
        location: '',
        country: 'Haïti',
        genre: '',
        stream_url: '',
        website_url: '',
        contact_email: '',
        contact_name: '',
        logo_url: ''
      });
      
      setShowStationForm(false);
    } catch (error) {
      console.error('Failed to submit station proposal:', error);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 via-purple-800 to-pink-900 relative">
      {/* Professional Header */}
      <header className="pro-radio-header relative overflow-hidden">
        {/* New Radio Haiti Fusion Banner */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://customer-assets.emergentagent.com/job_xtremecast/artifacts/f6fkw5no_bannerhf.png')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60"></div>
        <div className="max-w-7xl mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src="https://customer-assets.emergentagent.com/job_xtremecast/artifacts/ino0sotu_haitifusion.jpg" 
                  alt="Radio Haiti Fusion" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="pro-radio-heading text-xl font-bold text-white">Radio Haiti Fusion</h1>
                <p className="text-sm text-gray-400">105.3 FM • Cap-Haïtien</p>
              </div>
            </div>
            
            {/* Header Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--pro-radio-accent)' }}>
                  {liveStats?.listeners || 899}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Auditeurs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--pro-radio-accent)' }}>
                  {songRequests?.length || 17}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Demandes</div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="pro-radio-btn-secondary text-xs px-3 py-2"
                  onClick={() => window.open('mailto:info@radiohaitifusion.com', '_blank')}
                >
                  📞 Contact
                </Button>
                <Button 
                  className="pro-radio-btn-secondary text-xs px-3 py-2"
                  onClick={() => window.open('https://paypal.me/radiohaitifusion', '_blank')}
                >
                  💰 Donation
                </Button>
                <Button 
                  className="pro-radio-btn-primary text-xs px-3 py-2 animate-pulse"
                  onClick={() => {
                    // Open streaming widget in new window
                    window.open('https://sp14.instainternet.com/cp/widgets/player/dj/?p=8288', '_blank', 'width=400,height=300');
                  }}
                >
                  🎵 ÉCOUTER LIVE
                </Button>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="mt-6">
            <div className="pro-radio-nav">
              <div 
                className={`pro-radio-nav-item ${!showTvSection && !showHostingSection && !showRadioDirectory ? 'active' : ''}`}
                onClick={() => {
                  setShowTvSection(false);
                  setShowHostingSection(false);
                  setShowRadioDirectory(false);
                }}
              >
                🔴 Live
              </div>
              <div 
                className={`pro-radio-nav-item ${!showTvSection && !showHostingSection && !showRadioDirectory ? 'active' : ''}`}
                onClick={() => {
                  setShowTvSection(false);
                  setShowHostingSection(false);
                  setShowRadioDirectory(false);
                }}
              >
                📻 Radio
              </div>
              <div 
                className={`pro-radio-nav-item ${showTvSection ? 'active' : ''}`}
                onClick={() => {
                  setShowTvSection(!showTvSection);
                  setShowHostingSection(false);
                  setShowRadioDirectory(false);
                }}
              >
                📺 TV Shows
              </div>
              <div 
                className={`pro-radio-nav-item ${showHostingSection ? 'active' : ''}`}
                onClick={() => {
                  setShowHostingSection(!showHostingSection);
                  setShowTvSection(false);
                  setShowRadioDirectory(false);
                  // Ensure hosting data is loaded when section is opened
                  if (!showHostingSection && (!hostingStats || !hostingPlans.length)) {
                    loadHostingPlans();
                    loadHostingStats();
                  }
                }}
              >
                🖥️ Hosting
              </div>
              <div 
                className={`pro-radio-nav-item ${showRadioDirectory ? 'active' : ''}`}
                onClick={() => {
                  setShowRadioDirectory(!showRadioDirectory);
                  setShowTvSection(false);
                  setShowHostingSection(false);
                  // Ensure radio directory data is loaded
                  if (!showRadioDirectory && radioStations.length === 0) {
                    loadRadioDirectory();
                  }
                }}
              >
                📡 Portail Radio
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Music-Themed Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="pro-radio-card overflow-hidden relative">
          {/* Solid background instead of image */}
          <div className="absolute inset-0 bg-gradient-to-r from-magenta-900/80 via-purple-800/60 to-magenta-900/80"></div>
          
          <div className="relative z-10 p-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl">
              🎵 RADIO HAITI FUSION
            </h2>
            <p className="text-xl text-white/90 mb-6 drop-shadow-lg">
              LA RADIO QUI VA LOIN • 105.3 FM • CAP-HAÏTIEN
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                className="bg-magenta-500/80 hover:bg-magenta-600/80 backdrop-blur-sm px-8 py-3 rounded-lg text-white font-semibold border border-white/30 transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  window.open('https://sp14.instainternet.com/cp/widgets/player/dj/?p=8288', '_blank', 'width=400,height=300');
                }}
              >
                🎵 ÉCOUTER EN DIRECT
              </button>
              <button 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-8 py-3 rounded-lg text-white font-semibold border border-white/30 transition-all duration-300"
                onClick={() => {
                  // Navigate to Portail Radio section
                  setShowRadioDirectory(true);
                  setShowTvSection(false);
                  setShowHostingSection(false);
                  // Ensure radio directory data is loaded
                  if (radioStations.length === 0) {
                    loadRadioDirectory();
                  }
                }}
              >
                📡 DÉCOUVRIR NOS STATIONS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Promotional Banner Slide */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="pro-radio-card overflow-hidden">
          <div className="relative">
            {/* Promotional Header */}
            <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3">
              <div className="flex items-center justify-between">
                <h2 className="pro-radio-heading text-lg font-bold text-white flex items-center">
                  🎯 PROMOTIONS & ÉVÉNEMENTS
                </h2>
                <div className="text-xs text-pink-100">
                  Radio Haiti Fusion 105.3 FM
                </div>
              </div>
            </div>
            
            {/* Sliding Promotional Content */}
            <div className="relative h-40 md:h-48 overflow-hidden">
              {/* Background Banner Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url('https://customer-assets.emergentagent.com/job_xtremecast/artifacts/dcy7e4ay_xtremebanner2.jpg')`,
                }}
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
              
              <div 
                className="flex transition-transform duration-1000 ease-in-out h-full relative z-10"
                style={{ transform: `translateX(-${(Date.now() / 5000 | 0) % 4 * 100}%)` }}
              >
                {/* Promotion 1 - Radio Shows */}
                <div className="w-full flex-shrink-0 relative">
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center text-white">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 drop-shadow-2xl text-shadow-lg">
                        🎙️ ÉMISSIONS EN DIRECT
                      </h3>
                      <p className="text-lg mb-4 opacity-95 drop-shadow-xl">
                        Découvrez nos émissions exclusives tous les jours
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <span className="bg-magenta-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/30">Matin Compas</span>
                        <span className="bg-magenta-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/30">Talk Show</span>
                        <span className="bg-magenta-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/30">Soirée Zouk</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promotion 2 - Music Requests */}
                <div className="w-full flex-shrink-0 relative">
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center text-white">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 drop-shadow-2xl text-shadow-lg">
                        🎵 DEMANDES MUSICALES
                      </h3>
                      <p className="text-lg mb-4 opacity-95 drop-shadow-xl">
                        Demandez vos chansons préférées en direct
                      </p>
                      <div className="bg-magenta-500/80 backdrop-blur-sm px-6 py-2 rounded-lg border border-white/30 inline-block">
                        <span className="text-sm font-semibold">📞 Appelez maintenant!</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promotion 3 - Podcasts */}
                <div className="w-full flex-shrink-0 relative">
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center text-white">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 drop-shadow-2xl text-shadow-lg">
                        🎧 PODCASTS & ÉMISSIONS
                      </h3>
                      <p className="text-lg mb-4 opacity-95 drop-shadow-xl">
                        Rattrapez vos émissions favorites en replay
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <span className="bg-magenta-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/30">Culture Kreyòl</span>
                        <span className="bg-magenta-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/30">Interviews</span>
                        <span className="bg-magenta-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/30">Musique</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promotion 4 - Community */}
                <div className="w-full flex-shrink-0 relative">
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center text-white">
                      <h3 className="text-2xl md:text-3xl font-bold mb-3 drop-shadow-2xl text-shadow-lg">
                        🌍 VOTRE RADIO COMMUNAUTAIRE
                      </h3>
                      <p className="text-lg mb-4 opacity-95 drop-shadow-xl">
                        La voix de Cap-Haïtien et de toute la diaspora
                      </p>
                      <div className="bg-magenta-500/80 backdrop-blur-sm px-6 py-2 rounded-lg border border-white/30 inline-block">
                        <span className="text-sm font-semibold">🇭🇹 Fièrement Haïtienne</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                  style={{
                    width: '25%',
                    transform: `translateX(${((Date.now() / 5000 | 0) % 4) * 100}%)`,
                    transition: 'transform 1000ms ease-in-out'
                  }}
                />
              </div>
            </div>
            
            {/* Call to Action Footer */}
            <div className="bg-slate-800/50 px-6 py-4">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-white mb-4 md:mb-0">
                  <p className="text-sm">
                    <span className="font-semibold">📻 105.3 FM</span> • 
                    <span className="text-orange-400 ml-1">Écoutez-nous partout, à tout moment</span>
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button 
                    className="pro-radio-btn-secondary text-sm px-4 py-2"
                    onClick={() => window.open('mailto:info@radiohaitifusion.com', '_blank')}
                  >
                    📞 Contact
                  </button>
                  <button 
                    className="pro-radio-btn-primary text-sm px-4 py-2"
                    onClick={() => {
                      // Scroll to audio player section
                      const audioSection = document.querySelector('[data-audio-player]');
                      if (audioSection) {
                        audioSection.scrollIntoView({ behavior: 'smooth' });
                        // Try to play audio after scrolling
                        setTimeout(() => {
                          if (audioRef.current) {
                            audioRef.current.play().catch(e => console.error('Playback failed:', e));
                          }
                        }, 1000);
                      }
                    }}
                  >
                    🎵 Écouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breaking News */}
      {showBreakingNews && (
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2 overflow-hidden relative border-b border-pink-500">
          <div className="flex items-center">
            <div className="bg-white text-red-600 px-4 py-1 font-bold text-sm flex-shrink-0 uppercase tracking-wide">
              🚨 Breaking News
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="breaking-news-scroll text-sm font-medium">
                {breakingNews.join(' • ')} • 
              </div>
            </div>
            <button 
              onClick={() => setShowBreakingNews(false)}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-xs rounded transition-colors mr-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

      {/* Radio Directory Page */}
      {showRadioDirectory && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="pro-radio-card p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="pro-radio-heading text-3xl font-bold text-white mb-2 flex items-center">
                  📡 Portail Radio - Annuaire des Radios
                </h1>
                <p className="text-gray-400 text-lg">
                  Découvrez et écoutez des stations de radio haïtiennes et internationales
                </p>
              </div>
              <button
                onClick={() => setShowRadioDirectory(false)}
                className="pro-radio-btn-secondary px-4 py-2"
              >
                ← Retour
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="mb-8">
              <div className="pro-radio-grid pro-radio-grid-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rechercher une station</label>
                  <input
                    type="text"
                    placeholder="Nom de la station..."
                    className="pro-radio-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pays/Région</label>
                  <select className="pro-radio-input w-full">
                    <option>Tous les pays</option>
                    <option>Haïti</option>
                    <option>République Dominicaine</option>
                    <option>États-Unis</option>
                    <option>Canada</option>
                    <option>France</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Genre Musical</label>
                  <select className="pro-radio-input w-full">
                    <option>Tous les genres</option>
                    <option>Compas</option>
                    <option>Hip-Hop</option>
                    <option>Racine</option>
                    <option>Zouk</option>
                    <option>Merengue</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="pro-radio-grid pro-radio-grid-4 mb-8">
              <div className="pro-radio-stat">
                <div className="pro-radio-stat-number">{radioStations.length}</div>
                <div className="pro-radio-stat-label">Stations Totales</div>
              </div>
              <div className="pro-radio-stat">
                <div className="pro-radio-stat-number">{radioStations.filter(s => s.is_live).length}</div>
                <div className="pro-radio-stat-label">En Direct</div>
              </div>
              <div className="pro-radio-stat">
                <div className="pro-radio-stat-number">
                  {radioStations.filter(s => s.country === 'Haïti').length || '3'}
                </div>
                <div className="pro-radio-stat-label">Stations Haïtiennes</div>
              </div>
              <div className="pro-radio-stat">
                <div className="pro-radio-stat-number">24/7</div>
                <div className="pro-radio-stat-label">Diffusion</div>
              </div>
            </div>

            {/* Featured Station */}
            <div className="mb-8">
              <h2 className="pro-radio-heading text-xl font-semibold text-white mb-4">🌟 Station en Vedette</h2>
              <div className="pro-radio-card p-6 border-2" style={{ borderColor: 'var(--pro-radio-accent)' }}>
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: 'var(--pro-radio-accent)' }}>
                    <img 
                      src="https://customer-assets.emergentagent.com/job_xtremecast/artifacts/ino0sotu_haitifusion.jpg" 
                      alt="Radio Haiti Fusion Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">Radio Haiti Fusion</h3>
                    <p className="text-gray-300 mb-3">
                      La radio qui va loin - Votre station de référence pour la musique haïtienne et internationale
                    </p>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-orange-500 text-white">105.3 FM</Badge>
                      <Badge className="bg-green-500 text-white">🔴 LIVE</Badge>
                      <Badge className="bg-blue-500 text-white">HD 128kbps</Badge>
                      <span className="text-gray-400">📍 Cap-Haïtien, Haïti</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: 'var(--pro-radio-accent)' }}>
                      {liveStats?.listeners || 899}
                    </div>
                    <div className="text-sm text-gray-400">Auditeurs en direct</div>
                    <button 
                      className="pro-radio-btn-primary mt-3"
                      onClick={() => {
                        // Open streaming widget in new window for featured station
                        window.open('https://sp14.instainternet.com/cp/widgets/player/dj/?p=8288', '_blank', 'width=400,height=300,scrollbars=yes');
                      }}
                    >
                      🎵 Écouter Maintenant
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Radio Stations Grid */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="pro-radio-heading text-xl font-semibold text-white">📻 Toutes les Stations</h2>
                <div className="flex space-x-2">
                  <button className="pro-radio-btn-secondary text-sm">Grid View</button>
                  <button className="pro-radio-btn-primary text-sm">List View</button>
                </div>
              </div>
              
              <div className="pro-radio-grid pro-radio-grid-3">
                {radioStations.map((station) => (
                  <div 
                    key={station.id} 
                    className="pro-radio-card p-6 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <div className="flex items-center mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mr-4 text-white font-bold"
                        style={{ background: `linear-gradient(135deg, ${station.color || '#ff6b35'}, ${station.color || '#ff8a65'})` }}
                      >
                        📻
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{station.name}</h3>
                        <p className="text-sm text-gray-400">{station.frequency}</p>
                      </div>
                      <div className="text-right">
                        <div className={`w-3 h-3 rounded-full ${station.is_live ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{station.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs" style={{ color: 'var(--pro-radio-accent)' }}>
                        📍 {station.location || 'International'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${station.is_live ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {station.is_live ? '🟢 En direct' : '⚫ Hors ligne'}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        className="pro-radio-btn-primary flex-1 text-sm"
                        onClick={() => station.stream_url && window.open(station.stream_url, '_blank')}
                        disabled={!station.is_live}
                      >
                        {station.is_live ? '🎵 Écouter' : '⏸️ Hors ligne'}
                      </button>
                      <button className="pro-radio-btn-secondary px-3 text-sm">
                        ℹ️
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add New Station Card */}
                <div 
                  className="pro-radio-card p-6 border-2 border-dashed border-gray-600 hover:border-orange-500 transition-colors cursor-pointer"
                  onClick={() => setShowStationForm(true)}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl font-bold">+</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2">Ajouter une Station</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Proposez votre station de radio préférée
                    </p>
                    <button className="pro-radio-btn-secondary text-sm">
                      📝 Proposer une Station
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Statistics */}
            <div className="border-t border-gray-600 pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-gray-400 text-sm mb-4 md:mb-0">
                  <span className="font-medium">{radioStations.length} stations</span> dans l'annuaire • 
                  <span className="font-medium"> {radioStations.filter(s => s.is_live).length} en direct</span> • 
                  Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                </div>
                <div className="flex space-x-2">
                  <button className="pro-radio-btn-secondary text-sm">
                    📊 Statistiques
                  </button>
                  <button className="pro-radio-btn-secondary text-sm">
                    🔄 Actualiser
                  </button>
                  <button className="pro-radio-btn-primary text-sm">
                    📨 Nous Contacter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Station Proposal Form Modal */}
      {showStationForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="pro-radio-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="pro-radio-heading text-2xl font-bold text-white">📻 Proposer une Station Radio</h2>
              <button
                onClick={() => setShowStationForm(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={submitStationProposal} className="space-y-6">
              {/* Basic Station Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Informations de la Station</h3>
                
                <div className="pro-radio-grid pro-radio-grid-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nom de la Station *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Radio Caraïbes"
                      className="pro-radio-input w-full"
                      value={stationProposal.name}
                      onChange={(e) => setStationProposal({...stationProposal, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fréquence *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 94.5 FM"
                      className="pro-radio-input w-full"
                      value={stationProposal.frequency}
                      onChange={(e) => setStationProposal({...stationProposal, frequency: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Ex: Musique caribéenne, actualités locales et internationales"
                    className="pro-radio-input w-full resize-none"
                    value={stationProposal.description}
                    onChange={(e) => setStationProposal({...stationProposal, description: e.target.value})}
                  />
                </div>
                
                <div className="pro-radio-grid pro-radio-grid-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ville/Région
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Port-au-Prince"
                      className="pro-radio-input w-full"
                      value={stationProposal.location}
                      onChange={(e) => setStationProposal({...stationProposal, location: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pays
                    </label>
                    <select
                      className="pro-radio-input w-full"
                      value={stationProposal.country}
                      onChange={(e) => setStationProposal({...stationProposal, country: e.target.value})}
                    >
                      <option value="Haïti">Haïti</option>
                      <option value="République Dominicaine">République Dominicaine</option>
                      <option value="États-Unis">États-Unis</option>
                      <option value="Canada">Canada</option>
                      <option value="France">France</option>
                      <option value="Martinique">Martinique</option>
                      <option value="Guadeloupe">Guadeloupe</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Genre Musical
                    </label>
                    <select
                      className="pro-radio-input w-full"
                      value={stationProposal.genre}
                      onChange={(e) => setStationProposal({...stationProposal, genre: e.target.value})}
                    >
                      <option value="">Sélectionner un genre</option>
                      <option value="Compas">Compas</option>
                      <option value="Hip-Hop">Hip-Hop</option>
                      <option value="Racine">Racine</option>
                      <option value="Zouk">Zouk</option>
                      <option value="Merengue">Merengue</option>
                      <option value="Gospel">Gospel</option>
                      <option value="Jazz">Jazz</option>
                      <option value="Variété">Variété</option>
                      <option value="Actualités">Actualités</option>
                      <option value="Talk Show">Talk Show</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Technical Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Informations Techniques</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL du Stream
                  </label>
                  <input
                    type="url"
                    placeholder="Ex: http://stream.radio.com:8000/live"
                    className="pro-radio-input w-full"
                    value={stationProposal.stream_url}
                    onChange={(e) => setStationProposal({...stationProposal, stream_url: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    URL pour écouter la station en direct (optionnel)
                  </p>
                </div>
                
                <div className="pro-radio-grid pro-radio-grid-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Site Web
                    </label>
                    <input
                      type="url"
                      placeholder="Ex: https://www.radiocaraibes.com"
                      className="pro-radio-input w-full"
                      value={stationProposal.website_url}
                      onChange={(e) => setStationProposal({...stationProposal, website_url: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      URL du Logo
                    </label>
                    <input
                      type="url"
                      placeholder="Ex: https://example.com/logo.png"
                      className="pro-radio-input w-full"
                      value={stationProposal.logo_url}
                      onChange={(e) => setStationProposal({...stationProposal, logo_url: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Informations de Contact</h3>
                
                <div className="pro-radio-grid pro-radio-grid-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Votre Nom *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Jean Dupont"
                      className="pro-radio-input w-full"
                      value={stationProposal.contact_name}
                      onChange={(e) => setStationProposal({...stationProposal, contact_name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Votre Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: jean@example.com"
                      className="pro-radio-input w-full"
                      value={stationProposal.contact_email}
                      onChange={(e) => setStationProposal({...stationProposal, contact_email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-4 pt-6 border-t border-gray-600">
                <button
                  type="button"
                  onClick={() => setShowStationForm(false)}
                  className="pro-radio-btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="pro-radio-btn-primary flex-1"
                >
                  📻 Proposer la Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area - Only show when not in Radio Directory mode */}
      {!showRadioDirectory && (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Modern Radio/TV Player */}
            <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-orange-500/30 overflow-hidden" style={{boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(249, 115, 22, 0.1), 0 10px 15px -3px rgba(249, 115, 22, 0.2)'}}>
              <CardContent className="p-0">
                {/* Logo Banner Header */}
                <div 
                  className="relative h-20 md:h-24 overflow-hidden"
                  style={{
                    backgroundImage: `url('https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/okvzwb89_rhf45.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Banner Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 via-red-600/60 to-orange-600/80"></div>
                  
                  {/* Header Content */}
                  <div className="relative z-10 h-full flex items-center justify-between px-6">
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-red-500 text-white font-semibold px-3 py-1 animate-pulse shadow-lg">
                        🔴 LIVE
                      </Badge>
                      {/* <div className="text-white font-semibold text-sm md:text-base">
                        🇭🇹 La radio qui va loin
                      </div> */}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex bg-black/50 backdrop-blur-sm rounded-lg p-1">
                        <Button
                          onClick={() => switchStreamingMode('video')}
                          size="sm"
                          variant="ghost"
                          className={streamingMode === 'video' ? 'bg-red-600 text-white' : 'text-white hover:bg-white/20'}
                        >
                          📺 Live
                        </Button>
                        <Button
                          onClick={() => switchStreamingMode('audio_only')}
                          size="sm"
                          variant="ghost"
                          className={streamingMode === 'audio_only' ? 'bg-orange-600 text-white' : 'text-white hover:bg-white/20'}
                        >
                          📻 Radio
                        </Button>
                      </div>
                      
                      <Button
                        onClick={() => setShowTvSection(!showTvSection)}
                        size="sm"
                        className={`${showTvSection ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-600 hover:bg-slate-700'} text-white`}
                      >
                        <Tv className="w-4 h-4 mr-1" />
                        TV Shows
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setShowHostingSection(!showHostingSection);
                          // Ensure hosting data is loaded when section is opened
                          if (!showHostingSection && (!hostingStats || !hostingPlans.length)) {
                            loadHostingPlans();
                            loadHostingStats();
                          }
                        }}
                        size="sm"
                        className={`${showHostingSection ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'} text-white`}
                      >
                        <Server className="w-4 h-4 mr-1" />
                        Hosting
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Player Content */}
                <div className="p-6 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
                  {streamingMode === 'video' && videoStatus ? (
                    /* Video Player Mode */
                    <div className="space-y-4">
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                        <iframe
                          src={videoStatus.video_url}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Radio Haiti Fusion Live TV"
                        ></iframe>
                        
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-red-500 text-white animate-pulse">
                            🔴 LIVE TV
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Audio Player Mode */
                    <div className="space-y-6">
                      {/* Now Playing Display */}
                      <div className="text-center bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-xl p-6 shadow-inner border border-orange-500/30">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-slate-700 to-slate-600 rounded-full shadow-lg flex items-center justify-center border-4 border-orange-400/50">
                          {nowPlaying?.artwork_url ? (
                            <img 
                              src={nowPlaying.artwork_url} 
                              alt="Album Artwork" 
                              className="w-20 h-20 rounded-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/2zozn1fx_radiohaitifusion.jpg";
                              }}
                            />
                          ) : (
                            <img 
                              src="https://customer-assets.emergentagent.com/job_radio-pulse-13/artifacts/2zozn1fx_radiohaitifusion.jpg" 
                              alt="Radio Haiti Fusion Logo" 
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-1">
                          {nowPlaying?.song || "Compas Direct Live"}
                        </h3>
                        <p className="text-slate-300 mb-2">
                          {nowPlaying?.artist || "Radio Haiti Fusion"}
                        </p>
                        {nowPlaying?.genre && (
                          <Badge className="bg-orange-500 text-white">
                            {nowPlaying.genre}
                          </Badge>
                        )}
                      </div>

                      {/* Professional Audio Player */}
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-xl" data-audio-player>
                        {/* Stream Widget Integration */}
                        <div className="mb-6">
                          <div className="bg-slate-700/30 rounded-lg overflow-hidden border border-gray-600">
                            <iframe 
                              src="https://sp14.instainternet.com/cp/widgets/player/dj/?p=8288" 
                              height="110" 
                              width="100%" 
                              scrolling="no" 
                              frameBorder="0"
                              allow="autoplay; encrypted-media; fullscreen"
                              style={{ border: 'none', minHeight: '110px' }}
                              title="Radio Haiti Fusion Live Player"
                              className="w-full"
                              loading="eager"
                            />
                          </div>
                          <p className="text-center text-sm text-gray-400 mt-2">
                            🎵 Player Professionnel - Radio Haiti Fusion 105.3 FM
                          </p>
                          <div className="text-center mt-2">
                            <button 
                              className="pro-radio-btn-secondary text-xs px-3 py-1"
                              onClick={() => {
                                // Open player in new window if embedded doesn't work
                                window.open('https://sp14.instainternet.com/cp/widgets/player/dj/?p=8288', '_blank', 'width=400,height=300,scrollbars=yes,resizable=yes');
                              }}
                            >
                              🎵 Ouvrir dans une nouvelle fenêtre
                            </button>
                          </div>
                        </div>

                        {/* Additional HTML5 Audio Player */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-center mb-4">Lecteur Audio Alternatif</h4>
                          
                          {/* Audio Element */}
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
                                // Automatically try next stream
                                setTimeout(() => {
                                  if (audioRef.current) {
                                    audioRef.current.load();
                                    audioRef.current.play().catch(err => console.error('Auto-retry failed:', err));
                                  }
                                }, 1000);
                              }
                            }}
                            crossOrigin="anonymous"
                            preload="none"
                          />

                          {/* Main Play Button */}
                          <div className="flex items-center justify-center mb-4">
                            <Button
                              onClick={togglePlay}
                              className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all duration-300 shadow-2xl transform hover:scale-105"
                              data-testid="play-pause-button"
                            >
                              {isPlaying ? (
                                <Pause className="w-8 h-8" />
                              ) : (
                                <Play className="w-8 h-8 ml-1" />
                              )}
                            </Button>
                          </div>

                          {/* Volume & Controls Bar */}
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleMute}
                              className="text-slate-300 hover:text-white"
                            >
                              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </Button>
                            
                            <div className="flex-1">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, var(--pro-radio-accent) 0%, var(--pro-radio-accent) ${volume * 100}%, #475569 ${volume * 100}%, #475569 100%)`
                                }}
                              />
                            </div>
                            
                            <span className="text-slate-300 text-sm min-w-[3rem] font-mono">
                              {Math.round(volume * 100)}%
                            </span>
                          </div>

                          {/* Stream Info & Status */}
                          <div className="bg-slate-700/50 rounded-lg p-3 mt-4">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                <span className={isPlaying ? 'text-green-400' : 'text-gray-400'}>
                                  {isPlaying ? 'Diffusion en cours' : 'En attente'}
                                </span>
                              </div>
                              <div className="text-gray-400">
                                Stream {currentStreamIndex + 1}/{streamUrls.length}
                              </div>
                            </div>
                            
                            {/* Stream URL Debug Info */}
                            <div className="mt-2 text-xs text-gray-500">
                              URL: {streamUrl}
                            </div>
                          </div>

                          {/* Stream Selector */}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400">Source:</span>
                            <select 
                              value={currentStreamIndex}
                              onChange={(e) => {
                                setCurrentStreamIndex(parseInt(e.target.value));
                                setIsPlaying(false);
                                if (audioRef.current) {
                                  audioRef.current.load();
                                }
                              }}
                              className="pro-radio-input text-sm py-1"
                            >
                              {streamUrls.map((url, index) => (
                                <option key={index} value={index}>
                                  Stream {index + 1} ({url.includes('xtremeradiohosting') ? 'Xtreme' : 'Backup'})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* External Player Links */}
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Radio className="w-5 h-5 mr-2 text-magenta-500" />
                  Écouter avec vos Applications Préférées
                </h3>
                
                {/* Direct Stream Link */}
                <div className="mb-4 p-3 bg-magenta-500/20 rounded-lg border border-magenta-500/50">
                  <p className="text-sm text-white mb-2">🔗 Lien Direct du Stream:</p>
                  <input 
                    type="text" 
                    value="https://sp14.instainternet.com/cp/links.php?p=8288&m=direct" 
                    readOnly 
                    className="w-full bg-slate-800 text-white text-xs px-3 py-2 rounded border border-slate-600 select-all"
                    onClick={(e) => e.target.select()}
                  />
                  <p className="text-xs text-gray-400 mt-1">Copiez ce lien pour l'utiliser dans votre lecteur audio préféré</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <a 
                    href="https://sp14.instainternet.com/cp/links.php?p=8288&m=pls" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/80 transition-all duration-300 group"
                    title="Écouter avec Winamp"
                  >
                    <img 
                      src="https://sp14.instainternet.com/cp/inc/images/players/winamp2.png" 
                      alt="Winamp"
                      className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs text-slate-300 text-center">Winamp</span>
                  </a>

                  <a 
                    href="https://sp14.instainternet.com/cp/links.php?p=8288&m=asx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/80 transition-all duration-300 group"
                    title="Écouter avec Windows Media Player"
                  >
                    <img 
                      src="https://sp14.instainternet.com/cp/inc/images/players/mediaplayer.png" 
                      alt="Media Player"
                      className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs text-slate-300 text-center">Media Player</span>
                  </a>

                  <a 
                    href="https://sp14.instainternet.com/cp/links.php?p=8288&m=pls"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/80 transition-all duration-300 group"
                    title="Écouter avec VLC"
                  >
                    <img 
                      src="https://sp14.instainternet.com/cp/inc/images/players/vlc.png" 
                      alt="VLC"
                      className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs text-slate-300 text-center">VLC</span>
                  </a>

                  <a 
                    href="https://sp14.instainternet.com/cp/links.php?p=8288&m=pls"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/80 transition-all duration-300 group"
                    title="Écouter avec iTunes"
                  >
                    <img 
                      src="https://sp14.instainternet.com/cp/inc/images/players/itunes.png" 
                      alt="iTunes"
                      className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs text-slate-300 text-center">iTunes</span>
                  </a>

                  <a 
                    href="https://sp14.instainternet.com/cp/links.php?p=8288&m=ram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/80 transition-all duration-300 group"
                    title="Écouter avec RealPlayer"
                  >
                    <img 
                      src="https://sp14.instainternet.com/cp/inc/images/players/real.png" 
                      alt="RealPlayer"
                      className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs text-slate-300 text-center">RealPlayer</span>
                  </a>

                  <a 
                    href="https://sp14.instainternet.com/8288/stream"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/80 transition-all duration-300 group"
                    title="Écouter dans le navigateur"
                  >
                    <img 
                      src="https://sp14.instainternet.com/cp/inc/images/players/sslplay.png" 
                      alt="SSL Play"
                      className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform"
                    />
                    <span className="text-xs text-slate-300 text-center">Navigateur</span>
                  </a>
                </div>

                {/* Alternative Audio Player */}
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                    <Play className="w-4 h-4 mr-2 text-orange-400" />
                    Lecteur Audio Alternatif
                  </h4>
                  <audio 
                    controls 
                    className="w-full h-10 bg-slate-800 rounded"
                    style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                  >
                    <source src="https://sp14.instainternet.com/8288/stream" type="audio/mpeg" />
                    Votre navigateur ne supporte pas l'élément audio.
                  </audio>
                  <p className="text-xs text-slate-400 mt-2">
                    Stream direct haute qualité - Compatible avec tous les navigateurs modernes
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Professional Sliding Advertisement Banner */}
            {advertisements.length > 0 && (
              <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm border-orange-500/50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    {/* Ad Header */}
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center">
                          📢 PUBLICITÉ
                        </h3>
                        <div className="text-xs text-pink-100">
                          {currentAdSlide + 1} / {advertisements.length}
                        </div>
                      </div>
                    </div>
                    
                    {/* Sliding Ad Content */}
                    <div className="relative h-32 md:h-40 overflow-hidden">
                      <div 
                        className="flex transition-transform duration-700 ease-in-out h-full"
                        style={{ transform: `translateX(-${currentAdSlide * 100}%)` }}
                      >
                        {advertisements.map((ad, index) => (
                          <div
                            key={ad.id || index}
                            className="w-full flex-shrink-0 relative cursor-pointer group"
                            onClick={() => handleAdClick(ad)}
                          >
                            {/* Ad Background */}
                            <div 
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                              style={{
                                backgroundImage: ad.image_url ? `url(${ad.image_url})` : 'linear-gradient(135deg, #ff6b35, #f59e0b)',
                              }}
                            />
                            
                            {/* Ad Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
                            
                            {/* Ad Content */}
                            <div className="relative z-10 h-full flex items-center justify-center p-6">
                              <div className="text-center text-white">
                                <h4 className="text-lg md:text-xl font-bold mb-2 drop-shadow-lg">
                                  {ad.title || "Votre Publicité Ici"}
                                </h4>
                                <p className="text-sm md:text-base opacity-90 mb-3 drop-shadow">
                                  {ad.description || "Contactez-nous pour promouvoir votre entreprise"}
                                </p>
                                {ad.call_to_action && (
                                  <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 hover:bg-white/30 transition-colors">
                                    <span className="text-sm font-semibold">
                                      {ad.call_to_action} →
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Ad Type Badge */}
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-orange-500 text-white text-xs">
                                {ad.ad_type || 'PROMO'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Navigation Dots */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {advertisements.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentAdSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentAdSlide 
                              ? 'bg-white shadow-lg scale-125' 
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Navigation Arrows */}
                    {advertisements.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentAdSlide(prev => 
                            prev === 0 ? advertisements.length - 1 : prev - 1
                          )}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setCurrentAdSlide(prev => 
                            (prev + 1) % advertisements.length
                          )}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                        >
                          →
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TV Section */}
            {showTvSection && (
              <Card className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 backdrop-blur-sm border-slate-600/50">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Tv className="w-5 h-5 mr-2 text-purple-500" />
                    Radio Haiti Fusion TV
                  </h3>
                  
                  {/* TV Channel Info */}
                  {tvChannel && (
                    <div className="mb-6 bg-slate-700/50 rounded-lg p-4 border border-purple-500/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Tv className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">{tvChannel.name}</h4>
                            <p className="text-slate-300 text-sm">{tvChannel.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-red-400 font-semibold mb-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">LIVE</span>
                          </div>
                          <p className="text-slate-400 text-xs">{tvChannel.viewer_count} spectateurs</p>
                        </div>
                      </div>
                      
                      {/* Live TV Stream */}
                      <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-3">
                        <video
                          controls
                          className="w-full h-full"
                          poster="https://via.placeholder.com/800x450?text=Radio+Haiti+Fusion+TV"
                        >
                          <source src={tvChannel.stream_url} type="video/mp4" />
                          Votre navigateur ne supporte pas la vidéo.
                        </video>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-slate-300">En cours: <span className="text-white">{tvChannel.current_show}</span></span>
                          <span className="text-slate-300">Ensuite: <span className="text-purple-400">{tvChannel.next_show}</span></span>
                        </div>
                        <Button size="sm" variant="outline" className="text-purple-400 border-purple-400">
                          Programme TV
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* TV Categories Filter */}
                  <div className="mb-4">
                    <select 
                      value={selectedTvCategory}
                      onChange={(e) => {
                        setSelectedTvCategory(e.target.value);
                        loadTvShows(e.target.value);
                      }}
                      className="w-full bg-slate-700/60 border-slate-500 text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="all">Toutes les catégories</option>
                      {tvCategories && tvCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name} ({category.show_count})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* TV Shows Grid */}
                  <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {tvShows && tvShows.map((show, index) => (
                      <div key={show.id || index} className="bg-slate-700/50 rounded-lg overflow-hidden hover:border-purple-500/50 transition-all duration-200 border border-transparent">
                        <div className="relative">
                          <img 
                            src={show.thumbnail_url} 
                            alt={show.title}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            {show.is_live && (
                              <Badge className="bg-red-500 text-white text-xs">
                                🔴 LIVE
                              </Badge>
                            )}
                            {show.is_featured && (
                              <Badge className="bg-yellow-500 text-black text-xs ml-1">
                                ⭐ FEATURED
                              </Badge>
                            )}
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {show.duration}
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h5 className="text-white font-medium text-sm mb-1 truncate">{show.title}</h5>
                          <p className="text-slate-400 text-xs mb-2">{show.host}</p>
                          <p className="text-slate-300 text-xs mb-3 line-clamp-2">{show.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-slate-400">
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {show.view_count.toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1" />
                                {show.rating}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => playTvShow(show)}
                              className="bg-purple-600 hover:bg-purple-700 text-white p-1"
                              title="Regarder"
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {show.tags && show.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {show.tags.slice(0, 2).map((tag, tagIndex) => (
                                <span key={tagIndex} className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Currently Playing TV Show */}
                  {currentTvShow && (
                    <div className="mt-4 pt-4 border-t border-slate-600/50">
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white text-sm font-medium truncate">
                            En cours: {currentTvShow.title}
                          </p>
                          <Badge className="bg-purple-600 text-white">
                            TV
                          </Badge>
                        </div>
                        
                        {currentTvShow.video_url && (
                          <video
                            src={currentTvShow.video_url}
                            controls
                            className="w-full h-48 bg-black rounded"
                            poster={currentTvShow.thumbnail_url}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reseller Stream Hosting Section */}
            {showHostingSection && (
              <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm border-slate-600/50">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <Server className="w-5 h-5 mr-2 text-green-500" />
                    Stream Hosting Solutions
                  </h3>
                  
                  {/* Hosting Stats Overview */}
                  {hostingStats && (
                    <div className="mb-6 grid md:grid-cols-4 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">{hostingStats.active_clients}</div>
                        <div className="text-slate-300 text-xs">Clients Actifs</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-400">{hostingStats.total_listeners_now.toLocaleString()}</div>
                        <div className="text-slate-300 text-xs">Auditeurs Total</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-yellow-400">${hostingStats.monthly_revenue.toLocaleString()}</div>
                        <div className="text-slate-300 text-xs">Revenus Mensuels</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-400">{hostingStats.uptime_percentage}%</div>
                        <div className="text-slate-300 text-xs">Uptime</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Hosting Plans */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Plans d'Hébergement</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {hostingPlans && hostingPlans.map((plan, index) => (
                        <div key={plan.id || index} className={`bg-slate-700/50 rounded-lg p-4 border-2 transition-all duration-200 hover:border-green-500/50 ${plan.is_popular ? 'border-green-500/50 bg-green-600/10' : 'border-transparent'}`}>
                          {plan.is_popular && (
                            <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded mb-2 text-center">
                              POPULAIRE
                            </div>
                          )}
                          
                          <h5 className="text-white font-bold text-lg mb-2">{plan.name}</h5>
                          <p className="text-slate-300 text-sm mb-3">{plan.description}</p>
                          
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-green-400">${plan.monthly_price}</div>
                            <div className="text-slate-400 text-xs">par mois</div>
                          </div>
                          
                          <div className="space-y-1 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Max Auditeurs:</span>
                              <span className="text-white">{plan.max_listeners}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Qualité:</span>
                              <span className="text-white">{plan.bandwidth}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">Stockage:</span>
                              <span className="text-white">{plan.storage_gb} GB</span>
                            </div>
                            {plan.trial_days > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Essai gratuit:</span>
                                <span className="text-green-400">{plan.trial_days} jours</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1 mb-4">
                            {plan.features.slice(0, 4).map((feature, fIndex) => (
                              <div key={fIndex} className="flex items-center text-xs text-slate-300">
                                <div className="w-1 h-1 bg-green-400 rounded-full mr-2"></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                          
                          <Button
                            onClick={() => {
                              setHostingSignupForm({...hostingSignupForm, plan_id: plan.id});
                              document.getElementById('hosting-signup').scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`w-full ${plan.is_popular ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'} text-white`}
                          >
                            Choisir ce Plan
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Client Signup Form */}
                  <div id="hosting-signup" className="bg-slate-700/30 rounded-lg p-4 border border-green-500/30">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                      Commencer Maintenant - Essai Gratuit
                    </h4>
                    
                    <form onSubmit={submitHostingSignup} className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Input
                          placeholder="Nom de la station *"
                          value={hostingSignupForm.station_name}
                          onChange={(e) => setHostingSignupForm({...hostingSignupForm, station_name: e.target.value})}
                          className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                          required
                        />
                        <Input
                          placeholder="Nom du contact *"
                          value={hostingSignupForm.contact_name}
                          onChange={(e) => setHostingSignupForm({...hostingSignupForm, contact_name: e.target.value})}
                          className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                          required
                        />
                        <Input
                          type="email"
                          placeholder="Email *"
                          value={hostingSignupForm.email}
                          onChange={(e) => setHostingSignupForm({...hostingSignupForm, email: e.target.value})}
                          className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                          required
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Input
                          placeholder="Téléphone (optionnel)"
                          value={hostingSignupForm.phone}
                          onChange={(e) => setHostingSignupForm({...hostingSignupForm, phone: e.target.value})}
                          className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                        />
                        <select
                          value={hostingSignupForm.plan_id}
                          onChange={(e) => setHostingSignupForm({...hostingSignupForm, plan_id: e.target.value})}
                          className="w-full bg-slate-700/60 border-slate-500 text-white rounded px-3 py-2"
                        >
                          {hostingPlans && hostingPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} - ${plan.monthly_price}/mois
                            </option>
                          ))}
                        </select>
                        <textarea
                          placeholder="Notes ou besoins spéciaux (optionnel)"
                          value={hostingSignupForm.notes}
                          onChange={(e) => setHostingSignupForm({...hostingSignupForm, notes: e.target.value})}
                          className="w-full bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300 rounded px-3 py-2 text-sm"
                          rows="2"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Button
                          type="submit"
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                        >
                          <Server className="w-4 h-4 mr-2" />
                          Créer mon Compte - Essai Gratuit 14 Jours
                        </Button>
                        <p className="text-slate-400 text-xs mt-2 text-center">
                          * Pas de carte de crédit requise pour l'essai gratuit
                        </p>
                      </div>
                    </form>
                  </div>
                  
                  {/* Business Features */}
                  <div className="mt-6 grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <BarChart3 className="w-4 h-4 text-blue-400 mr-2" />
                        <h5 className="text-white font-semibold text-sm">Statistiques Avancées</h5>
                      </div>
                      <p className="text-slate-300 text-xs">Analyses détaillées des auditeurs, géolocalisation, et rapports de performance.</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Server className="w-4 h-4 text-green-400 mr-2" />
                        <h5 className="text-white font-semibold text-sm">Infrastructure Robuste</h5>
                      </div>
                      <p className="text-slate-300 text-xs">Serveurs redondants, CDN global, et SLA 99.9% pour une diffusion fiable.</p>
                    </div>
                    
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Users className="w-4 h-4 text-purple-400 mr-2" />
                        <h5 className="text-white font-semibold text-sm">Support Expert</h5>
                      </div>
                      <p className="text-slate-300 text-xs">Équipe technique spécialisée, support 24/7, et assistance à la migration.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Podcast Episodes Section */}
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Headphones className="w-5 h-5 mr-2 text-purple-500" />
                  Podcasts & Émissions
                </h3>
                
                <div className="space-y-4 mb-4">
                  <select 
                    value={selectedPodcastCategory}
                    onChange={(e) => {
                      setSelectedPodcastCategory(e.target.value);
                      loadPodcastEpisodes(e.target.value);
                    }}
                    className="w-full bg-slate-700/60 border-slate-500 text-white rounded px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les catégories</option>
                    {podcastCategories && podcastCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.episode_count})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {podcastEpisodes && podcastEpisodes.map((episode, index) => (
                    <div key={episode.id || index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30 hover:border-purple-500/50 transition-all duration-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex-shrink-0 overflow-hidden">
                          {episode.cover_art ? (
                            <img 
                              src={episode.cover_art} 
                              alt={episode.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Headphones className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm truncate">{episode.title}</h4>
                              <p className="text-slate-400 text-xs">{episode.host}</p>
                              {episode.is_featured && (
                                <Badge className="bg-yellow-500 text-black text-xs mt-1">
                                  ⭐ FEATURED
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-slate-300 text-xs mb-3 line-clamp-2">
                            {episode.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-slate-400">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {episode.duration}
                              </span>
                              <span className="flex items-center">
                                <Play className="w-3 h-3 mr-1" />
                                {episode.play_count.toLocaleString()}
                              </span>
                              <span className="flex items-center">
                                <Download className="w-3 h-3 mr-1" />
                                {episode.download_count.toLocaleString()}
                              </span>
                              {episode.file_size && (
                                <span>{episode.file_size}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                onClick={() => playPodcast(episode)}
                                className={`bg-purple-600 hover:bg-purple-700 text-white p-2 ${
                                  currentPodcast?.id === episode.id && isPodcastPlaying ? 'bg-purple-700' : ''
                                }`}
                                title="Écouter"
                              >
                                {currentPodcast?.id === episode.id && isPodcastPlaying ? (
                                  <Pause className="w-3 h-3" />
                                ) : (
                                  <Play className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadPodcast(episode)}
                                className="text-slate-300 hover:text-white p-2"
                                title="Télécharger"
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {episode.tags && episode.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {episode.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span key={tagIndex} className="bg-slate-600/50 text-slate-300 text-xs px-2 py-1 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {currentPodcast && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <div className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white text-sm font-medium truncate">
                          En cours: {currentPodcast.title}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setIsPodcastPlaying(!isPodcastPlaying)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isPodcastPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                      </div>
                      
                      <audio
                        src={currentPodcast.audio_url}
                        controls
                        className="w-full h-8 bg-slate-600 rounded"
                        style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                        onPlay={() => setIsPodcastPlaying(true)}
                        onPause={() => setIsPodcastPlaying(false)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recently Played */}
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="font-medium text-slate-300 text-sm">Pa Manyen</p>
                    <p className="text-slate-500 text-xs">Boukman Eksperyans</p>
                    <p className="text-slate-500 text-xs">3:45</p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="font-medium text-slate-300 text-sm">Kite Mwen Viv</p>
                    <p className="text-slate-500 text-xs">Sweet Micky</p>
                    <p className="text-slate-500 text-xs">4:12</p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="font-medium text-slate-300 text-sm">Sispann</p>
                    <p className="text-slate-500 text-xs">Carimi</p>
                    <p className="text-slate-500 text-xs">3:28</p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-3">
                    <p className="font-medium text-slate-300 text-sm">Haiti Cherie</p>
                    <p className="text-slate-500 text-xs">Tabou Combo</p>
                    <p className="text-slate-500 text-xs">4:56</p>
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
                    <div className="bg-fuchsia-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Émission Actuelle</h4>
                      <p className="text-slate-300 text-sm">Compas Direct Live</p>
                      <p className="text-slate-400 text-xs">Avec DJ Kenley</p>
                    </div>
                    <div className="bg-fuchsia-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Prochaine Émission</h4>
                      <p className="text-slate-300 text-sm">Nouvèl ak Mizik</p>
                      <p className="text-slate-400 text-xs">18:00 - 20:00</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-fuchsia-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Fréquence</h4>
                      <p className="text-slate-300 text-sm">105.3 FM</p>
                      <p className="text-slate-400 text-xs">Cap-Haïtien & environs</p>
                    </div>
                    <div className="bg-fuchsia-800/50 rounded-lg p-3">
                      <h4 className="font-semibold text-white text-sm mb-1">Qualité Stream</h4>
                      <p className="text-slate-300 text-sm">128 kbps MP3</p>
                      <p className="text-slate-400 text-xs">Haute qualité stéréo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Haiti Weather Widget */}
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
                      
                      {/* Biography Section */}
                      <div className="mb-4">
                        <h5 className="text-orange-400 font-semibold text-sm mb-2 flex items-center">
                          🎯 Biographie | Biography
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              <strong className="text-orange-300">Français:</strong> {stationInfo.bio_fr}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              <strong className="text-orange-300">English:</strong> {stationInfo.bio_en}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mission Section */}
                      <div className="mb-4">
                        <h5 className="text-orange-400 font-semibold text-sm mb-2 flex items-center">
                          🎯 Mission
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              <strong className="text-orange-300">Français:</strong> {stationInfo.mission_fr}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              <strong className="text-orange-300">English:</strong> {stationInfo.mission_en}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Vision Section */}
                      <div className="mb-4">
                        <h5 className="text-orange-400 font-semibold text-sm mb-2 flex items-center">
                          🌍 Vision
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              <strong className="text-orange-300">Français:</strong> {stationInfo.vision_fr}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                              <strong className="text-orange-300">English:</strong> {stationInfo.vision_en}
                            </p>
                          </div>
                        </div>
                      </div>
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
                          <span className="text-green-400 text-sm">{stationInfo.whatsapp || "5026017368"}</span>
                        </div>
                      </div>
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
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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

            {/* Dynamic Advertising Banners */}
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    📢 Publicités
                    {advertisements.length > 0 && (
                      <Badge className="ml-2 bg-orange-500 text-white text-xs">
                        {currentAdSlide + 1}/{advertisements.length}
                      </Badge>
                    )}
                  </h3>
                  
                  {advertisements.length > 1 && (
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCurrentAdSlide(currentAdSlide === 0 ? advertisements.length - 1 : currentAdSlide - 1)}
                        className="w-8 h-8 p-0 border-orange-500 text-orange-400 hover:bg-orange-500/10"
                      >
                        ←
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setCurrentAdSlide((currentAdSlide + 1) % advertisements.length)}
                        className="w-8 h-8 p-0 border-orange-500 text-orange-400 hover:bg-orange-500/10"
                      >
                        →
                      </Button>
                    </div>
                  )}
                </div>
                
                {advertisements.length > 0 ? (
                  <div>
                    {/* Current Ad Display */}
                    <div 
                      className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg overflow-hidden cursor-pointer hover:from-orange-700 hover:to-red-700 transition-all duration-300 group shadow-lg"
                      onClick={() => handleAdClick(advertisements[currentAdSlide])}
                    >
                      <div className="relative h-32 flex items-center justify-center p-6">
                        <div className="text-center text-white z-10">
                          <h4 className="text-xl font-bold mb-2">
                            {advertisements[currentAdSlide]?.title}
                          </h4>
                          <p className="text-sm opacity-90 mb-3">
                            {advertisements[currentAdSlide]?.description}
                          </p>
                          <div className="flex items-center justify-center space-x-4 text-xs">
                            <span className="bg-white/20 px-2 py-1 rounded">
                              Par: {advertisements[currentAdSlide]?.advertiser}
                            </span>
                            <span className="bg-white/20 px-2 py-1 rounded">
                              👀 {advertisements[currentAdSlide]?.impressions?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/90 text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            </svg>
                            Cliquer pour plus d'infos
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Auto-advance Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-400 text-xs">
                          Prochaine pub dans {advertisements[currentAdSlide]?.duration_seconds || 5}s
                        </span>
                        <span className="text-slate-500 text-xs">
                          Auto-avance activé
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full"
                          style={{ 
                            animation: `progress ${(advertisements[currentAdSlide]?.duration_seconds || 5)}s linear infinite` 
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Navigation Dots */}
                    {advertisements.length > 1 && (
                      <div className="flex justify-center space-x-2 mt-3">
                        {advertisements.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentAdSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                              currentAdSlide === index 
                                ? 'bg-orange-500 w-6' 
                                : 'bg-slate-600 hover:bg-slate-500'
                            }`}
                            title={`Pub ${index + 1}: ${advertisements[index]?.title}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback Ad Space */
                  <div className="bg-slate-700/30 rounded-lg p-6 border-2 border-dashed border-orange-500/50 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">📢</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Espace Publicitaire Disponible</h4>
                    <p className="text-slate-300 text-sm mb-3">
                      Votre publicité peut être ici! Atteignez des milliers d'auditeurs.
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                      onClick={() => window.open('mailto:haitifusionpromo@gmail.com', '_blank')}
                    >
                      Réserver cet espace
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Radio Directory Portal */}
            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50">
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
                
                {showVoiceRecorder ? (
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 border border-green-500/30">
                      <div className="flex items-center justify-center mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          <span className={`font-medium ${isRecording ? 'text-red-400' : 'text-slate-300'}`}>
                            {isRecording ? 'Enregistrement...' : 'Prêt à enregistrer'}
                          </span>
                        </div>
                      </div>
                      
                      {isRecording && (
                        <div className="text-center mb-3">
                          <span className="text-lg font-mono text-white">
                            {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                          </span>
                          <p className="text-xs text-slate-400">max 60 secondes</p>
                        </div>
                      )}
                      
                      <div className="flex justify-center space-x-2 mb-3">
                        {!isRecording && !recordedAudio && (
                          <Button 
                            onClick={startVoiceRecording}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            🎤 Commencer
                          </Button>
                        )}
                        {isRecording && (
                          <Button 
                            onClick={stopVoiceRecording}
                            className="bg-gray-600 hover:bg-gray-700 text-white"
                          >
                            ⏹️ Arrêter
                          </Button>
                        )}
                        {recordedAudio && (
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => {
                                const audio = new Audio(URL.createObjectURL(recordedAudio));
                                audio.play();
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              ▶️ Écouter
                            </Button>
                            <Button 
                              onClick={() => {
                                setRecordedAudio(null);
                                setRecordingTime(0);
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              🔄 Refaire
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {recordedAudio && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Votre nom"
                            value={newRequest.listener_name}
                            onChange={(e) => setNewRequest({...newRequest, listener_name: e.target.value})}
                            className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                          />
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => sendVoiceMessage(newRequest.listener_name)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              disabled={!newRequest.listener_name.trim()}
                            >
                              📤 Envoyer
                            </Button>
                            <Button 
                              onClick={cancelVoiceRecording}
                              variant="outline"
                            >
                              ❌ Annuler
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setShowRequestForm(true)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex items-center justify-center space-x-2"
                      data-testid="request-song-button"
                    >
                      <Music className="w-4 h-4" />
                      <span>Demander une Chanson</span>
                    </Button>
                    <Button 
                      onClick={() => setShowVoiceRecorder(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 flex items-center justify-center space-x-2"
                      data-testid="voice-request-button"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Message Vocal</span>
                    </Button>
                  </div>
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

                {/* Song Request Form - Hidden state */}
                {showRequestForm && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top 10 Charts Widget */}
            <Card className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-400" />
                  Top 10 Charts
                </h3>
                
                <div className="space-y-2 mb-3">
                  <select 
                    value={selectedChartCategory}
                    onChange={(e) => {
                      setSelectedChartCategory(e.target.value);
                      loadCharts(e.target.value);
                    }}
                    className="w-full bg-slate-700/60 border-slate-500 text-white rounded px-3 py-2 text-sm"
                  >
                    {chartCategories && chartCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {charts && charts.slice(0, 5).map((song, index) => (
                    <div key={song.id || index} className="bg-slate-700/30 rounded p-2 flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-slate-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">"{song.song_title}"</p>
                          <p className="text-slate-400 text-xs truncate">{song.artist}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => voteForSong(song.song_title, song.artist)}
                        className="text-orange-400 hover:text-orange-300 p-1 ml-1"
                        title="Voter pour cette chanson"
                      >
                        <Target className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => setShowChartsModal(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  Voir le Top 10 complet
                </Button>
              </CardContent>
            </Card>

            {/* Trivia Game Widget */}
            <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm border-slate-600/50">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-400" />
                  Trivia Haïtien
                </h3>
                
                {!triviaGame ? (
                  <div className="space-y-3">
                    <Input
                      placeholder="Votre nom"
                      value={triviaPlayerName}
                      onChange={(e) => setTriviaPlayerName(e.target.value)}
                      className="bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300"
                    />
                    
                    <select 
                      value={triviaCategory}
                      onChange={(e) => setTriviaCategory(e.target.value)}
                      className="w-full bg-slate-700/60 border-slate-500 text-white rounded px-3 py-2 text-sm"
                    >
                      <option value="mixed">Mixte</option>
                      <option value="haitian_music">Musique Haïtienne</option>
                      <option value="haitian_culture">Culture Haïtienne</option>
                      <option value="radio_fusion">Radio Fusion</option>
                    </select>
                    
                    <Button 
                      onClick={startTriviaGame}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                    >
                      Commencer le Jeu
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Score: {triviaGame && triviaGame.score}</span>
                      <span>Vies: {triviaGame && triviaGame.lives}/3</span>
                      <span>Q{triviaGame && triviaGame.current_question + 1}/10</span>
                    </div>
                    
                    {triviaGame && triviaGame.current_question < triviaGame.questions.length ? (
                      <div className="space-y-2">
                        {triviaGame && triviaGame.questions && triviaGame.questions[triviaGame.current_question] && (
                          <p className="text-white text-sm font-medium">
                            {triviaGame.questions[triviaGame.current_question].question}
                          </p>
                        )}
                        
                        {currentTriviaAnswer ? (
                          <div className={`p-3 rounded ${currentTriviaAnswer.is_correct ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            <p className={`text-sm font-medium ${currentTriviaAnswer.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                              {currentTriviaAnswer.is_correct ? '✓ Correct!' : '✗ Incorrect'}
                            </p>
                            {currentTriviaAnswer.explanation && (
                              <p className="text-slate-300 text-xs mt-1">{currentTriviaAnswer.explanation}</p>
                            )}
                            <Button 
                              onClick={() => setCurrentTriviaAnswer(null)}
                              size="sm"
                              className="mt-2 bg-blue-600 hover:bg-blue-700"
                            >
                              Question Suivante
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {triviaGame && triviaGame.questions && triviaGame.questions[triviaGame.current_question] && 
                             triviaGame.questions[triviaGame.current_question].options.map((option, index) => (
                              <Button
                                key={index}
                                onClick={() => answerTriviaQuestion(index)}
                                variant="outline"
                                className="w-full text-left justify-start text-xs p-2 h-auto"
                              >
                                {String.fromCharCode(65 + index)}. {option}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Trophy className="w-8 h-8 text-yellow-500 mx-auto" />
                        <p className="text-white font-bold">Jeu Terminé!</p>
                        <p className="text-slate-300 text-sm">Score Final: {triviaGame && triviaGame.score}</p>
                        <Button 
                          onClick={resetTriviaGame}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Rejouer
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {triviaLeaderboard.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-600/50">
                    <p className="text-slate-400 text-xs mb-2">Top Joueurs:</p>
                    <div className="space-y-1">
                      {triviaLeaderboard && triviaLeaderboard.slice(0, 3).map((player, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-white">{player.rank}. {player.player_name}</span>
                          <span className="text-slate-400">{player.score}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-fuchsia-800/40 backdrop-blur-sm border-fuchsia-600/50 h-[500px] flex flex-col">
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
      )}
    </div>
  );
}

export default App;