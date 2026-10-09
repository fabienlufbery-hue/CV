import React from 'react';
import { ArrowUpRight, AudioLines, Mic, MicOff, PhoneCall, PhoneOff, Volume2 } from 'lucide-react';

interface VoiceSphereProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
  volume: number;
  onToggleConnect: () => void;
  onToggleMute: () => void;
  onInterrupt: () => void;
  lang: 'en' | 'fr';
  disabled?: boolean;
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({
  isConnected, isConnecting, isSpeaking, isListening, isMuted,
  volume, onToggleConnect, onToggleMute, onInterrupt, lang, disabled = false,
}) => {
  const fr = lang === 'fr';
  const status = disabled
    ? (fr ? 'SERVICE MOMENTANÉMENT INDISPONIBLE' : 'SERVICE TEMPORARILY UNAVAILABLE')
    : isConnecting
      ? (fr ? 'CONNEXION EN COURS' : 'ESTABLISHING CONNECTION')
      : isConnected
        ? (isSpeaking ? (fr ? 'ASYT VOUS RÉPOND' : 'ASYT IS SPEAKING')
          : isMuted ? (fr ? 'MICRO COUPÉ' : 'MICROPHONE MUTED')
          : isListening ? (fr ? 'ASYT VOUS ÉCOUTE' : 'ASYT IS LISTENING') : 'SESSION LIVE')
        : (fr ? 'PRÊT À ÉCHANGER' : 'READY WHEN YOU ARE');

  const label = isConnected
    ? (fr ? 'Terminer la conversation' : 'End the conversation')
    : isConnecting
      ? (fr ? 'Connexion…' : 'Connecting…')
      : (fr ? 'Parler avec ASYT' : 'Talk to ASYT');

  return (
    <section id="voice" className={`asyt-voice-card ${isConnected ? 'is-connected' : ''} ${isSpeaking ? 'is-speaking' : ''}`} aria-label={fr ? 'Assistant vocal ASYT' : 'ASYT voice assistant'}>
      <div className="asyt-voice-card-top">
        <span className="asyt-panel-index">01 <span>/</span> VOICE INTERFACE</span>
        <span className="asyt-live-pill"><i aria-hidden="true" />{isConnected ? 'ON AIR' : 'GEMINI LIVE'}</span>
      </div>

      <div className="asyt-orbit-scene" style={{ '--voice-intensity': Math.min(1, Math.max(0, volume)) } as React.CSSProperties}>
        <span className="asyt-orbit-ambient" aria-hidden="true" />
        <span className="asyt-orbit-outer" aria-hidden="true" />
        <span className="asyt-orbit-middle" aria-hidden="true" />
        <span className="asyt-orbit-inner" aria-hidden="true" />
        <span className="asyt-orbit-satellite asyt-satellite-one" aria-hidden="true" />
        <span className="asyt-orbit-satellite asyt-satellite-two" aria-hidden="true" />
        <button
          className="asyt-orbit-core"
          type="button"
          onClick={onToggleConnect}
          disabled={disabled || isConnecting}
          aria-label={label}
          title={label}
        >
          {isConnected && isSpeaking ? (
            <span className="asyt-voice-waveform" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: `${i * 105}ms` }} />)}
            </span>
          ) : (
            <span className="asyt-orbit-letter" aria-hidden="true">A<span className="asyt-orbit-spark">✦</span></span>
          )}
          <span className="asyt-orbit-core-caption">{isConnected ? 'LIVE' : 'ASYT'}</span>
        </button>
        <span className="asyt-orbit-coordinate asyt-coordinate-one" aria-hidden="true">01 / A</span>
        <span className="asyt-orbit-coordinate asyt-coordinate-two" aria-hidden="true">VOICE / 26</span>
      </div>

      <div className="asyt-voice-copy">
        <div className="asyt-voice-status" role="status" aria-live="polite">
          <span className={`asyt-status-led ${isConnected ? 'is-on' : ''}`} aria-hidden="true" />
          {status}
        </div>
        <h2>{fr ? 'Une rencontre, autrement.' : 'A conversation, reimagined.'}</h2>
        <p>{fr
          ? 'Faites connaissance avec Fabien à travers une conversation naturelle avec ASYT, son assistant intelligent.'
          : 'Discover Fabien beyond the résumé. A more human introduction, guided by his AI voice assistant.'}</p>
      </div>

      <div className="asyt-voice-actions">
        <button type="button" className="asyt-voice-primary" onClick={onToggleConnect} disabled={disabled || isConnecting}>
          {isConnected ? <PhoneOff size={18} aria-hidden="true" /> : <PhoneCall size={18} aria-hidden="true" />}
          <span>{label}</span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </button>
        {isConnected && (
          <div className="asyt-voice-secondary-actions">
            <button type="button" className={isMuted ? 'is-muted' : ''} onClick={onToggleMute} aria-label={isMuted ? (fr ? 'Réactiver le micro' : 'Unmute microphone') : (fr ? 'Couper le micro' : 'Mute microphone')} title={isMuted ? (fr ? 'Réactiver le micro' : 'Unmute mic') : (fr ? 'Couper le micro' : 'Mute mic')}>
              {isMuted ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            {isSpeaking && <button type="button" onClick={onInterrupt} aria-label={fr ? 'Interrompre la réponse' : 'Interrupt speech'} title={fr ? 'Interrompre' : 'Interrupt'}><Volume2 size={17} /></button>}
          </div>
        )}
      </div>
      <div className="asyt-voice-bottom">
        <AudioLines size={15} aria-hidden="true" />
        <span>{fr ? 'Microphone requis · Traitement vocal par Gemini' : 'Microphone access · Voice processed by Gemini'}</span>
        <span className="asyt-voice-bottom-number">001</span>
      </div>
    </section>
  );
};
