import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, Sparkles, User } from 'lucide-react';
import { FABIEN_PROFILE } from '../data/fabienProfile.ts';

export interface MessageItem {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
}

interface ConversationStreamProps {
  messages: MessageItem[];
  streamingText: string;
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onPlayTTS: (text: string) => void;
  lang: 'en' | 'fr';
  isPlayingTTS: boolean;
  disabled?: boolean;
}

export const ConversationStream: React.FC<ConversationStreamProps> = ({
  messages,
  streamingText,
  isStreaming,
  onSendMessage,
  onPlayTTS,
  lang,
  isPlayingTTS,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleChipClick = (question: string) => {
    if (!disabled && !isStreaming) onSendMessage(question);
  };

  return (
    <div className="asyt-chat-card flex flex-col h-full bg-[#FAF7F0] rounded-2xl border border-[#E9E3D8] shadow-sm overflow-hidden">
      {/* Stream Header */}
      <div className="asyt-chat-head px-6 py-4 border-b border-[#EBE4D8] flex items-center justify-between bg-[#F8F4EC]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#9E7D47]" />
          <h2 className="font-serif text-lg font-medium text-[#26211C]">
            {lang === 'en' ? 'Conversation Transcript' : 'Transcription de l’échange'}
          </h2>
        </div>
        <span className="text-xs text-[#807669] font-serif italic">
          {disabled ? (lang === 'fr' ? 'Mode lecture' : 'Read-only mode') : 'ASYT • Live AI'}
        </span>
      </div>

      {/* Suggested Questions Carousel / Chips */}
      <div className="asyt-chat-suggestions px-5 py-3 border-b border-[#EFE8DD] bg-[#FDFBF7]/60 overflow-x-auto scrollbar-none flex gap-2">
        {FABIEN_PROFILE.sampleQuestions.map((q, idx) => {
          const text = lang === 'en' ? q.en : q.fr;
          return (
            <button
              key={idx}
              onClick={() => handleChipClick(text)}
              disabled={disabled || isStreaming}
              title={disabled ? (lang === 'fr' ? 'IA indisponible' : 'AI offline') : undefined}
              className="asyt-chat-chip disabled:opacity-50 disabled:cursor-not-allowed shrink-0 px-3 py-1.5 rounded-full bg-[#F3EDE2] hover:bg-[#EAE1D1] text-[#3D352B] text-xs border border-[#DFD6C6] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#9E7D47]" />
              <span>{text}</span>
            </button>
          );
        })}
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="asyt-chat-feed flex-1 p-5 overflow-y-auto space-y-4 max-h-[460px] min-h-[300px]"
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`asyt-message flex gap-3 ${isUser ? 'is-user justify-end' : 'is-assistant justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#27211B] text-[#F3EFE9] flex items-center justify-center font-serif text-xs shrink-0 shadow-sm">
                  A
                </div>
              )}

              <div
                className={`asyt-chat-bubble max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#2B251F] text-[#FAF6F0] rounded-br-sm'
                    : 'bg-[#F2ECE1] text-[#221D17] border border-[#E3DACB] rounded-bl-sm shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span
                    className={`text-[11px] font-medium tracking-wide ${
                      isUser ? 'text-[#B8AEA0]' : 'text-[#7D7364]'
                    }`}
                  >
                    {isUser ? (lang === 'en' ? 'You' : 'Vous') : 'ASYT'}
                  </span>
                  {!isUser && (
                    <button
                      onClick={() => onPlayTTS(m.text)}
                      disabled={disabled || isPlayingTTS}
                      aria-label={lang === 'fr' ? 'Écouter le message' : 'Play message audio'}
                      title={lang === 'en' ? 'Listen to deep voice' : 'Écouter la voix'}
                      className="disabled:opacity-40 text-[#847868] hover:text-[#2B251F] transition-colors p-0.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#DCD3C5] text-[#332B23] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live Streaming Text Indicator */}
        {isStreaming && streamingText && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#27211B] text-[#F3EFE9] flex items-center justify-center font-serif text-xs shrink-0 shadow-sm animate-pulse">
              A
            </div>
            <div className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-[#F2ECE1] text-[#221D17] border border-[#E3DACB] rounded-bl-sm shadow-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-medium text-[#7D7364]">
                  ASYT ({lang === 'en' ? 'Speaking...' : 'En direct...'})
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#9E7D47] animate-ping" />
              </div>
              <p className="whitespace-pre-wrap">{streamingText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="asyt-chat-form p-3 border-t border-[#EBE4D8] bg-[#F7F2E8] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          maxLength={2000}
          disabled={disabled || isStreaming}
          aria-label={lang === 'fr' ? 'Votre question' : 'Your question'}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            lang === 'en'
              ? 'Ask ASYT anything about Fabien (e.g. OMD experience, skills, karting)...'
              : 'Posez une question sur Fabien (expériences, compétences, karting)...'
          }
          className="asyt-chat-input disabled:opacity-50 disabled:cursor-not-allowed min-w-0 flex-1 px-4 py-2.5 text-sm bg-[#FFFFFF] border border-[#DDD4C5] rounded-xl text-[#221D17] placeholder:text-[#9A9081] focus:outline-none focus:border-[#9E7D47] focus:ring-1 focus:ring-[#9E7D47]/30 transition-all"
        />
        <button
          type="submit"
          disabled={disabled || isStreaming || !inputText.trim()}
          aria-label={lang === 'fr' ? 'Envoyer le message' : 'Send message'}
          className="asyt-chat-submit p-2.5 bg-[#2B251F] hover:bg-[#3E352D] disabled:cursor-not-allowed disabled:opacity-40 text-[#FAF6F0] rounded-xl transition-all cursor-pointer shadow-xs"
          title={lang === 'en' ? 'Send message' : 'Envoyer'}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
