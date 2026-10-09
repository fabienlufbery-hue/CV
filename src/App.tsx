/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { VoiceSphere } from './components/VoiceSphere.tsx';
import { ConversationStream, MessageItem } from './components/ConversationStream.tsx';
import { ProfileDossier } from './components/ProfileDossier.tsx';
import { LiveAudioPlayer, LiveMicRecorder } from './utils/audio.ts';
import { apiUrl, backendConfigured, liveUrl } from './config/api.ts';
import { WifiOff, RefreshCcw } from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'en' | 'fr'>('en');

  // Live WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);

  // Conversation transcripts
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const micRecorderRef = useRef<LiveMicRecorder | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeStreamTextRef = useRef('');
  const mutedRef = useRef(isMuted);
  const speakingRef = useRef(isSpeaking);
  const [backendState, setBackendState] = useState<'checking' | 'online' | 'offline'>(backendConfigured ? 'checking' : 'offline');
  const [healthRetry, setHealthRetry] = useState(0);
  const [connectionError, setConnectionError] = useState('');

  useEffect(() => { mutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { speakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => {
    if (!backendConfigured) { setBackendState('offline'); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);
    setBackendState('checking');
    fetch(apiUrl('/api/health'), { signal: controller.signal })
      .then((response) => setBackendState(response.ok ? 'online' : 'offline'))
      .catch(() => setBackendState('offline'))
      .finally(() => window.clearTimeout(timeout));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [healthRetry]);

  // Set initial greeting
  useEffect(() => {
    const greetingText =
      lang === 'en'
        ? "Hello, I am Fabien's assistant, what would you like to know about him?"
        : "Bonjour, je suis l'assistant de Fabien, que souhaiteriez-vous savoir sur lui ?";

    setMessages([
      {
        id: 'initial-greeting',
        role: 'assistant',
        text: greetingText,
        timestamp: new Date(),
      },
    ]);
  }, [lang]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectLive();
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
    };
  }, []);

  // Connect to Gemini Live WebSocket
  const connectLive = async () => {
    if (isConnected || isConnecting || backendState !== 'online') return;
    setConnectionError('');
    setIsConnecting(true);

    try {
      // 1. Initialize Audio Player
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new LiveAudioPlayer();
      }
      audioPlayerRef.current.onVolumeChange = (vol) => {
        if (vol > 0.05) {
          setIsSpeaking(true);
          setAudioVolume(vol);
        } else {
          setIsSpeaking(false);
          // If mic is active, mic volume handler sets it
        }
      };

      // 2. Setup WebSocket
      const ws = new WebSocket(liveUrl());
      wsRef.current = ws;
      let ready = false;
      const connectTimeout = window.setTimeout(() => {
        if (!ready && wsRef.current === ws) {
          setConnectionError(lang === 'fr' ? 'Connexion vocale trop longue.' : 'Voice connection timed out.');
          ws.close();
        }
      }, 15000);

      const startMicrophone = async () => {

        // 3. Initialize Mic Recorder
        try {
          const mic = new LiveMicRecorder();
          micRecorderRef.current = mic;
          mic.onVolumeChange = (vol) => {
            if (!speakingRef.current) {
              setAudioVolume(vol);
            }
          };

          await mic.start((base64Chunk) => {
            if (!mutedRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'audio',
                  audio: base64Chunk,
                })
              );
              setIsListening(true);
            }
          });
          setIsListening(true);
        } catch (micErr) {
          console.warn('[Live] Microphone access denied or unavailable:', micErr);
          // User can still chat or listen to ASYt's voice
        }
      };

      ws.onopen = () => { /* Wait for Gemini's ready acknowledgement. */ };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            ready = true;
            window.clearTimeout(connectTimeout);
            setIsConnected(true);
            setIsConnecting(false);
            void startMicrophone();
          } else if (msg.type === 'audio' && msg.audio) {
            // Play 24kHz raw PCM chunk
            audioPlayerRef.current?.playChunk(msg.audio);
            setIsSpeaking(true);
          } else if (msg.type === 'model_text' && msg.text) {
            setIsStreaming(true);
            activeStreamTextRef.current += msg.text;
            setStreamingText(activeStreamTextRef.current);
          } else if (msg.type === 'user_text' && msg.text) {
            // Add user message if transcribed
            setMessages((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                role: 'user',
                text: msg.text,
                timestamp: new Date(),
              },
            ]);
          } else if (msg.type === 'turn_complete') {
            if (activeStreamTextRef.current.trim()) {
              setMessages((prev) => [
                ...prev,
                {
                  id: String(Date.now()),
                  role: 'assistant',
                  text: activeStreamTextRef.current.trim(),
                  timestamp: new Date(),
                },
              ]);
            }
            activeStreamTextRef.current = '';
            setStreamingText('');
            setIsStreaming(false);
          } else if (msg.type === 'interrupted') {
            console.log('[Live] Interrupted by user');
            audioPlayerRef.current?.stopAndClear();
            setIsSpeaking(false);
            if (activeStreamTextRef.current.trim()) {
              setMessages((prev) => [
                ...prev,
                {
                  id: String(Date.now()),
                  role: 'assistant',
                  text: activeStreamTextRef.current.trim(),
                  timestamp: new Date(),
                },
              ]);
            }
            activeStreamTextRef.current = '';
            setStreamingText('');
            setIsStreaming(false);
          } else if (msg.type === 'error' || msg.type === 'live_closed') {
            setConnectionError(lang === 'fr' ? 'Session vocale interrompue, réessayez.' : 'Voice session interrupted. Please retry.');
            disconnectLive();
          }
        } catch (err) {
          console.error('[Live WebSocket Message parse error]:', err);
        }
      };

      ws.onclose = () => {
        window.clearTimeout(connectTimeout);
        if (!ready && wsRef.current === ws) setConnectionError(lang === 'fr' ? 'Connexion vocale impossible.' : 'Voice connection failed.');
        console.log('[Live] WebSocket closed');
        disconnectLive();
      };

      ws.onerror = (err) => {
        window.clearTimeout(connectTimeout);
        setConnectionError(lang === 'fr' ? 'Erreur réseau de l’assistant vocal.' : 'Voice connection network error.');
        console.error('[Live] WebSocket error:', err);
        disconnectLive();
      };
    } catch (e) {
      console.error('[Live Init error]:', e);
      setConnectionError(lang === 'fr' ? 'Le micro n’a pas pu démarrer.' : 'Microphone could not start.');
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const disconnectLive = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsListening(false);
    setAudioVolume(0);

    if (micRecorderRef.current) {
      micRecorderRef.current.stop();
      micRecorderRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.stopAndClear();
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        // ignore
      }
      wsRef.current = null;
    }

    if (activeStreamTextRef.current.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'assistant',
          text: activeStreamTextRef.current.trim(),
          timestamp: new Date(),
        },
      ]);
      activeStreamTextRef.current = '';
      setStreamingText('');
      setIsStreaming(false);
    }
  };

  const toggleConnect = () => {
    if (isConnected || isConnecting) {
      disconnectLive();
    } else {
      connectLive();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleInterrupt = () => {
    audioPlayerRef.current?.stopAndClear();
    setIsSpeaking(false);
  };

  // Play a specific text message via Gemini TTS (voice Fenrir)
  const playTTS = async (text: string) => {
    try {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }

      setIsPlayingTTS(true);
      if (backendState !== 'online') return;
      const res = await fetch(apiUrl('/api/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Fenrir' }),
      });

      if (!res.ok) throw new Error('Failed to fetch TTS');
      const data = await res.json();

      if (data.audio) {
        const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audio}`);
        ttsAudioRef.current = audio;
        audio.onended = () => {
          setIsPlayingTTS(false);
        };
        audio.onerror = () => {
          setIsPlayingTTS(false);
        };
        await audio.play();
      } else {
        setIsPlayingTTS(false);
      }
    } catch (e) {
      console.error('Error playing TTS:', e);
      setIsPlayingTTS(false);
    }
  };

  // Send a message (either typed or clicked)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    if (backendState !== 'online') {
      setConnectionError(lang === 'fr' ? 'Le chat nécessite un serveur actif.' : 'Chat requires a running server.');
      return;
    }
    setConnectionError('');

    // 1. Add user message to transcript
    const userMsg: MessageItem = {
      id: String(Date.now()),
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // 2. If Live WebSocket is open, send realtime text
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text',
          text,
        })
      );
      return;
    }

    // 3. Fallback: REST API /api/chat + /api/tts
    try {
      setIsStreaming(true);
      setStreamingText(lang === 'en' ? 'ASYt is formulating reply...' : 'ASYt formule sa réponse...');

      const chatRes = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.text })),
        }),
      });

      if (!chatRes.ok) throw new Error('Failed to get chat response');
      const chatData = await chatRes.json();
      const reply = chatData.reply || "I am Fabien's assistant. How may I help you?";

      setStreamingText('');
      setIsStreaming(false);

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'assistant',
          text: reply,
          timestamp: new Date(),
        },
      ]);

      // Speak reply in deep voice
      playTTS(reply);
    } catch (err) {
      console.error('Chat error:', err);
      setIsStreaming(false);
      setStreamingText('');
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          role: 'assistant',
          text:
            lang === 'en'
              ? 'I apologize, an error occurred while connecting. Please try again.'
              : 'Veuillez m’excuser, une erreur est survenue lors de l’échange. Merci de réessayer.',
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1E1B18]">
      {/* Top Navigation */}
      <Header
        lang={lang}
        onToggleLang={(newLang) => setLang(newLang)}
        isLiveActive={isConnected}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {backendState !== 'online' && (
          <section role="status" aria-live="polite" className="mb-7 rounded-2xl border border-[#DED3BF] bg-[#F3EBDD] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <WifiOff aria-hidden="true" className="mt-0.5 w-5 h-5 text-[#9A7B48] shrink-0" />
              <div>
                <p className="font-semibold text-sm text-[#31291E]">
                  {backendState === 'checking' ? (lang === 'fr' ? 'Vérification du serveur vocal…' : 'Checking voice service…')
                    : (lang === 'fr' ? 'CV disponible · assistant IA hors ligne' : 'CV available · AI assistant offline')}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-[#675A48]">
                  {lang === 'fr' ? 'Le dossier reste consultable. Le chat et la voix nécessitent un serveur Gemini actif.'
                    : 'The profile remains accessible. Chat and voice need a running Gemini server.'}
                </p>
              </div>
            </div>
            {backendConfigured && backendState === 'offline' && (
              <button type="button" onClick={() => setHealthRetry((v) => v + 1)} className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full border border-[#CBBCA3] px-4 py-2 text-xs font-semibold hover:bg-white transition-colors">
                <RefreshCcw className="w-3.5 h-3.5" />{lang === 'fr' ? 'Réessayer' : 'Try again'}
              </button>
            )}
          </section>
        )}
        {connectionError && <p role="alert" className="mb-5 rounded-xl bg-[#FCEFEB] border border-[#EAD3CA] px-4 py-3 text-sm text-[#8A3628]">{connectionError}</p>}
        {/* Intro Subtitle Banner */}
        <div className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-[#9A7B48] font-semibold mb-1">
            {lang === 'en' ? 'Executive Profile & AI Voice' : 'Profil Cadre & Voix IA'}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#1E1914] tracking-tight">
            Fabien Lufbery
          </h2>
          <p className="font-serif italic text-base text-[#675C4E] mt-1">
            {lang === 'en'
              ? 'Interactive Voice Representation • Powered by ASYt'
              : 'Représentation Vocale Interactive • Animée par ASYt'}
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Left Column: Voice Sphere & Conversation Transcript */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <VoiceSphere
              isConnected={isConnected}
              isConnecting={isConnecting}
              isSpeaking={isSpeaking}
              isListening={isListening}
              isMuted={isMuted}
              volume={audioVolume}
              onToggleConnect={toggleConnect}
              onToggleMute={toggleMute}
              onInterrupt={handleInterrupt}
              lang={lang}
              disabled={backendState !== 'online'}
            />

            <ConversationStream
              messages={messages}
              streamingText={streamingText}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onPlayTTS={playTTS}
              lang={lang}
              isPlayingTTS={isPlayingTTS}
              disabled={backendState !== 'online'}
            />
          </div>

          {/* Right Column: Fabien's Dossier */}
          <div className="lg:col-span-7">
            <ProfileDossier
              lang={lang}
              onAskTopic={(topic) => handleSendMessage(topic)}
              disabled={backendState !== 'online'}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ECE5D9] bg-[#F7F3EA] py-6 text-center text-xs text-[#7F7464]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-serif">
          <span>ASYt • Voice Assistant representing Fabien Lufbery</span>
          <span>ESCE Business School — Paris La Défense</span>
          <span>Powered by Gemini Live API</span>
        </div>
      </footer>
    </div>
  );
}
