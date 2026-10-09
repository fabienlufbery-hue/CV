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
    const timeout = window.setTimeout(() => controller.abort(), 90000);
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
      }, 120000);

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
          // User can still chat or listen to ASYT's voice
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
      setStreamingText(lang === 'en' ? 'ASYT is formulating reply...' : 'ASYT formule sa réponse...');

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
    <div id="top" className="asyt-page">
      {/* Top Navigation */}
      <Header
        lang={lang}
        onToggleLang={(newLang) => setLang(newLang)}
        isLiveActive={isConnected}
      />

      {/* Main Container */}
      <main className="asyt-main">
        {backendState !== 'online' && (
          <section role="status" aria-live="polite" className="asyt-service-notice mb-7 rounded-2xl border border-[#DED3BF] bg-[#F3EBDD] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
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
        {/* Editorial hero — the story starts with the person, not the technology. */}
        <section className="asyt-hero" aria-labelledby="asyt-hero-title">
          <div className="asyt-hero-content">
            <span className="asyt-eyebrow"><span className="asyt-eyebrow-dash" /> {lang === 'fr' ? 'UNE NOUVELLE FAÇON DE SE PRÉSENTER' : 'A NEW WAY TO INTRODUCE YOURSELF'}</span>
            <h1 id="asyt-hero-title" className="asyt-hero-title">
              <span>Fabien</span>
              <span>Lufbery<span className="asyt-hero-dot">.</span></span>
            </h1>
            <p className="asyt-hero-subtitle">{lang === 'fr' ? 'Au-delà du CV.' : 'Beyond the résumé.'} <em>{lang === 'fr' ? 'Une conversation.' : 'A conversation.'}</em></p>
            <p className="asyt-hero-description">
              {lang === 'fr'
                ? 'Un parcours, des ambitions, des idées. Découvrez la personne derrière les expériences — avec ASYT, une nouvelle façon d’entrer en contact.'
                : 'Experience, ambition, perspective. Discover the person behind the work — through ASYT, a new way to connect.'}
            </p>
            <div className="asyt-hero-cta-row">
              <a href="#voice" className="asyt-hero-cta-primary">{lang === 'fr' ? 'Rencontrer ASYT' : 'Meet ASYT'} <span aria-hidden="true">↗</span></a>
              <a href="#profile" className="asyt-hero-cta-secondary">{lang === 'fr' ? 'Découvrir le parcours' : 'Explore the profile'} <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <div className="asyt-hero-art" aria-hidden="true">
            <div className="asyt-hero-art-label">THE ASYT <span>EXPERIENCE</span></div>
            <div className="asyt-hero-art-orbit">
              <span className="asyt-art-ring ring-1" />
              <span className="asyt-art-ring ring-2" />
              <span className="asyt-art-ring ring-3" />
              <span className="asyt-art-mark">A</span>
              <span className="asyt-art-gold-point point-1" />
              <span className="asyt-art-gold-point point-2" />
            </div>
            <div className="asyt-hero-art-foot"><span>HUMAN FIRST</span><span>EST. 2026 — PARIS</span></div>
          </div>
          <div className="asyt-hero-corner" aria-hidden="true">✳</div>
        </section>

        <div className="asyt-section-lead">
          <div><span className="asyt-section-count">01—02</span><span className="asyt-section-divider" /> <span className="asyt-section-label">{lang === 'fr' ? 'L’EXPÉRIENCE INTERACTIVE' : 'THE INTERACTIVE EXPERIENCE'}</span></div>
          <span className="asyt-section-side">{lang === 'fr' ? 'Faites connaissance, autrement' : 'GET TO KNOW ME, DIFFERENTLY'}</span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="asyt-experience-grid">
          {/* Left Column: Voice Sphere & Conversation Transcript */}
          <div className="asyt-experience-left">
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
          <div className="asyt-experience-right">
            <ProfileDossier
              lang={lang}
              onAskTopic={(topic) => handleSendMessage(topic)}
              disabled={backendState !== 'online'}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="asyt-footer">
        <div className="asyt-footer-inner">
          <span className="asyt-footer-brand">ASYT<span>.</span></span>
          <span>{lang === 'fr' ? 'Des idées humaines. Une nouvelle expérience.' : 'Human ideas. A new experience.'}</span>
          <span>© 2026 <span className="asyt-footer-separator">/</span> PARIS, FRANCE</span>
        </div>
      </footer>
    </div>
  );
}
