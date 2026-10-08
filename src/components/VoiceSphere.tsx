import React from 'react';
import { Mic, MicOff, Volume2, PhoneOff, PhoneCall, Sparkles, Radio } from 'lucide-react';

interface VoiceSphereProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
  volume: number; // 0 to 1
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  lang: 'en' | 'fr';
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({
  isConnected,
  isConnecting,
  isSpeaking,
  isListening,
  isMuted,
  volume,
  onToggleConnect,
  onToggleMute,
  onInterrupt,
  lang,
}) => {
  // Compute visual ring scale based on audio volume
  const scale = 1 + Math.min(volume * 0.45, 0.45);
  const ringOpacity = Math.max(0.2, Math.min(1, 0.3 + volume * 0.7));

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#FAF7F0] rounded-2xl border border-[#E9E3D8] shadow-sm relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ease-out"
        style={{
          background: isSpeaking
            ? 'radial-gradient(circle, rgba(179, 143, 86, 0.22) 0%, rgba(245, 237, 222, 0) 70%)'
            : isListening
            ? 'radial-gradient(circle, rgba(140, 120, 100, 0.18) 0%, rgba(245, 237, 222, 0) 70%)'
            : 'radial-gradient(circle, rgba(200, 190, 175, 0.12) 0%, rgba(245, 237, 222, 0) 70%)',
        }}
      />

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-6 px-3.5 py-1 rounded-full bg-[#F3EDE2] border border-[#DFD7C9] text-xs font-medium text-[#5E574E] tracking-wide">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected
              ? isSpeaking
                ? 'bg-[#B48446] animate-ping'
                : 'bg-emerald-600'
              : isConnecting
              ? 'bg-amber-500 animate-pulse'
              : 'bg-stone-400'
          }`}
        />
        <span>
          {isConnecting
            ? lang === 'en'
              ? 'Connecting to Live API...'
              : 'Connexion à Live API...'
            : isConnected
            ? isSpeaking
              ? lang === 'en'
                ? 'ASYt Speaking (Deep Tone)'
                : 'ASYt s’exprime (Voix grave)'
              : isMuted
              ? lang === 'en'
                ? 'Microphone Muted'
                : 'Microphone coupé'
              : lang === 'en'
              ? 'Listening...'
              : 'À l’écoute...'
            : lang === 'en'
            ? 'Voice Assistant Ready'
            : 'Assistant vocal prêt'}
        </span>
      </div>

      {/* Main Interactive Audio Orb */}
      <div className="relative w-48 h-48 flex items-center justify-center my-4">
        {/* Dynamic audio waves when active */}
        {isConnected && (
          <>
            <div
              className="absolute inset-0 rounded-full border border-[#D5C7B0] transition-transform duration-100 ease-out pointer-events-none"
              style={{
                transform: `scale(${scale * 1.15})`,
                opacity: ringOpacity * 0.7,
              }}
            />
            <div
              className="absolute inset-0 rounded-full border border-[#BFA785] transition-transform duration-100 ease-out pointer-events-none"
              style={{
                transform: `scale(${scale * 1.3})`,
                opacity: ringOpacity * 0.4,
              }}
            />
          </>
        )}

        {/* Central Core Sphere */}
        <button
          onClick={onToggleConnect}
          disabled={isConnecting}
          title={
            isConnected
              ? lang === 'en'
                ? 'Click to end session'
                : 'Cliquer pour terminer la session'
              : lang === 'en'
              ? 'Click to speak with ASYt'
              : 'Cliquer pour parler avec ASYt'
          }
          className={`group relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9E7D47]/40 ${
            isConnected
              ? isSpeaking
                ? 'bg-gradient-to-br from-[#2E2822] via-[#241F1A] to-[#1A1613] text-[#F7F2EA] shadow-xl shadow-[#9E7D47]/10'
                : 'bg-gradient-to-br from-[#29241F] to-[#1C1814] text-[#EFEBE4] shadow-md'
              : 'bg-gradient-to-br from-[#EFEAE1] to-[#E3DCD0] text-[#3A342D] hover:from-[#EAE3D7] hover:to-[#DDD4C5] shadow-sm hover:shadow'
          }`}
          style={{
            transform: isSpeaking ? `scale(${scale})` : undefined,
          }}
        >
          {/* Inner waveform or icon */}
          {isConnected ? (
            <div className="flex flex-col items-center gap-2">
              {isSpeaking ? (
                <div className="flex items-center gap-1.5 h-7">
                  <span className="w-1 bg-[#D4AF37] rounded-full animate-voice-wave" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-[#E8C56B] rounded-full animate-voice-wave" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 bg-[#F5DE9C] rounded-full animate-voice-wave" style={{ animationDelay: '400ms' }} />
                  <span className="w-1 bg-[#E8C56B] rounded-full animate-voice-wave" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-[#D4AF37] rounded-full animate-voice-wave" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <Radio className="w-8 h-8 text-[#D1C6B4] animate-pulse" />
              )}
              <span className="text-[11px] font-serif tracking-widest uppercase text-[#B9AC9A]">
                {isSpeaking ? 'ASYt' : 'Live'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-center px-2">
              <Sparkles className="w-7 h-7 text-[#8B6E3F]" />
              <span className="text-sm font-serif font-semibold tracking-wider text-[#2A241D]">
                ASYt
              </span>
              <span className="text-[10px] tracking-wider uppercase text-[#73685B]">
                {lang === 'en' ? 'Start Voice' : 'Démarrer'}
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Minimal Voice Description */}
      <div className="text-center mt-2 mb-6">
        <h3 className="font-serif text-xl font-medium text-[#231F1A]">
          ASYt
        </h3>
        <p className="text-xs text-[#756C60] max-w-xs mt-0.5">
          {lang === 'en'
            ? 'Fabien Lufbery’s Voice Assistant • Deep tone (Fenrir) with American English & French accents'
            : 'Assistant vocal de Fabien Lufbery • Voix grave (Fenrir) avec accents américain et français'}
        </p>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center gap-3">
        {isConnected ? (
          <>
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-full transition-all duration-200 border text-xs flex items-center justify-center ${
                isMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-[#F2ECE0] border-[#DDD5C5] text-[#3D352C] hover:bg-[#EAE2D3]'
              }`}
              title={
                isMuted
                  ? lang === 'en'
                    ? 'Unmute Microphone'
                    : 'Activer le micro'
                  : lang === 'en'
                  ? 'Mute Microphone'
                  : 'Couper le micro'
              }
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {isSpeaking && (
              <button
                onClick={onInterrupt}
                className="px-3.5 py-2.5 rounded-full bg-[#EFE8DC] border border-[#DDD4C4] text-[#4A4136] hover:bg-[#E5DDCB] text-xs font-medium flex items-center gap-1.5 transition-colors"
                title={lang === 'en' ? 'Interrupt speech' : 'Interrompre'}
              >
                <Volume2 className="w-4 h-4 text-[#8C6D3F]" />
                <span>{lang === 'en' ? 'Stop' : 'Pause'}</span>
              </button>
            )}

            <button
              onClick={onToggleConnect}
              className="px-4 py-2.5 rounded-full bg-[#8E3232] hover:bg-[#7D2A2A] text-[#FAF5EE] text-xs font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{lang === 'en' ? 'End Conversation' : 'Terminer'}</span>
            </button>
          </>
        ) : (
          <button
            onClick={onToggleConnect}
            disabled={isConnecting}
            className="px-6 py-3 rounded-full bg-[#241F1A] hover:bg-[#342D26] text-[#FBF8F2] text-sm font-medium flex items-center gap-2.5 shadow-sm hover:shadow transition-all"
          >
            <PhoneCall className="w-4 h-4 text-[#E6C687]" />
            <span>
              {isConnecting
                ? lang === 'en'
                  ? 'Connecting...'
                  : 'Connexion...'
                : lang === 'en'
                ? 'Speak with ASYt'
                : 'Parler avec ASYt'}
            </span>
          </button>
        )}
      </div>

      {/* Initial Greeting reminder */}
      <p className="text-[11px] text-[#8C8274] italic mt-4 text-center">
        {lang === 'en'
          ? '“Hello, I am Fabien’s assistant, what would you like to know about him?”'
          : '« Bonjour, je suis l’assistant de Fabien, que souhaiteriez-vous savoir sur lui ? »'}
      </p>
    </div>
  );
};
