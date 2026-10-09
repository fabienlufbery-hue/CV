import React from 'react';
import { ArrowUpRight, AudioLines } from 'lucide-react';

interface HeaderProps {
  lang: 'en' | 'fr';
  onToggleLang: (newLang: 'en' | 'fr') => void;
  isLiveActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ lang, onToggleLang, isLiveActive }) => (
  <header className="asyt-header">
    <div className="asyt-header-inner">
      <a className="asyt-brand" href="#top" aria-label="ASYT — top of page">
        <span className="asyt-monogram" aria-hidden="true"><span>A</span><i /></span>
        <span className="asyt-brand-copy">
          <strong>ASYT<span className="asyt-brand-period">.</span></strong>
          <small>THE HUMAN SIDE OF AI</small>
        </span>
      </a>
      <nav className="asyt-nav" aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'}>
        <a href="#voice">{lang === 'fr' ? 'Expérience vocale' : 'Voice experience'} <AudioLines aria-hidden="true" size={14} /></a>
        <a href="#profile">{lang === 'fr' ? 'Le parcours' : 'The profile'} <ArrowUpRight aria-hidden="true" size={14} /></a>
      </nav>
      <div className="asyt-header-actions">
        <span className={`asyt-connection-indicator ${isLiveActive ? 'is-active' : ''}`} aria-label={isLiveActive ? 'Live conversation active' : 'Conversation inactive'}>
          <i aria-hidden="true" />
          <span>{isLiveActive ? 'LIVE' : 'AI EXPERIENCE'}</span>
        </span>
        <div className="asyt-language" role="group" aria-label={lang === 'fr' ? 'Langue' : 'Language'}>
          <button type="button" className={lang === 'en' ? 'selected' : ''} onClick={() => onToggleLang('en')} aria-label="English" aria-pressed={lang === 'en'}>EN</button>
          <button type="button" className={lang === 'fr' ? 'selected' : ''} onClick={() => onToggleLang('fr')} aria-label="Français" aria-pressed={lang === 'fr'}>FR</button>
        </div>
      </div>
    </div>
  </header>
);
