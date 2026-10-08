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
    if (isConnected || isConnecting) return;
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
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('[Live] Connected to WebSocket bridge');
        setIsConnected(true);
        setIsConnecting(false);

        // 3. Initialize Mic Recorder
        try {
          const mic = new LiveMicRecorder();
          micRecorderRef.current = mic;
          mic.onVolumeChange = (vol) => {
            if (!isSpeaking) {
              setAudioVolume(vol);
            }
          };

          await mic.start((base64Chunk) => {
            if (!isMuted && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && msg.audio) {
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
          } else if (msg.type === 'error') {
            console.error('[Live Server Error]:', msg.error);
          }
        } catch (err) {
          console.error('[Live WebSocket Message parse error]:', err);
        }
      };

      ws.onclose = () => {
        console.log('[Live] WebSocket closed');
        disconnectLive();
      };

      ws.onerror = (err) => {
        console.error('[Live] WebSocket error:', err);
        disconnectLive();
      };
    } catch (e) {
      console.error('[Live Init error]:', e);
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
      const res = await fetch('/api/tts', {
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
      }
    } catch (e) {
      console.error('Error playing TTS:', e);
      setIsPlayingTTS(false);
    }
  };

  // Send a message (either typed or clicked)
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

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

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Subtitle Banner */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
            />

            <ConversationStream
              messages={messages}
              streamingText={streamingText}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onPlayTTS={playTTS}
              lang={lang}
              isPlayingTTS={isPlayingTTS}
            />
          </div>

          {/* Right Column: Fabien's Dossier */}
          <div className="lg:col-span-7">
            <ProfileDossier
              lang={lang}
              onAskTopic={(topic) => handleSendMessage(topic)}
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
