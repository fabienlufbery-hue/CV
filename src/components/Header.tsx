import React from 'react';
import { Volume2 } from 'lucide-react';

interface HeaderProps {
  lang: 'en' | 'fr';
  onToggleLang: (newLang: 'en' | 'fr') => void;
  isLiveActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ lang, onToggleLang, isLiveActive }) => {
  return (
    <header className="border-b border-[#ECE5D9] bg-[#FAF7F0]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#26211C] text-[#F9F5EE] flex items-center justify-center font-serif text-lg font-bold shadow-sm">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold tracking-tight text-[#1E1914]">
                ASYt
              </span>
              <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#EFE8DC] border border-[#DDD4C5] text-[#786D5D] font-medium">
                Gemini AI
              </span>
            </div>
            <p className="text-xs text-[#6F6558] font-light">
              {lang === 'en'
                ? 'Voice Assistant representing Fabien Lufbery'
                : 'Assistant vocal représentant Fabien Lufbery'}
            </p>
          </div>
        </div>

        {/* Right tools: Voice Specs & Language Toggle */}
        <div className="flex items-center gap-3">
          {/* Voice Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F3EDE2] border border-[#DFD6C6] text-xs text-[#574E42]">
            <Volume2 className="w-3.5 h-3.5 text-[#9E7D47]" />
            <span className="font-serif">
              {lang === 'en' ? 'Deep Male Tone (Fenrir)' : 'Voix grave (Fenrir)'}
            </span>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-[#EFE8DD] p-1 rounded-full border border-[#DCD3C3]">
            <button
              onClick={() => onToggleLang('en')}
              aria-label="English"
              aria-pressed={lang === 'en'}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#28221D] text-[#FAF6F0] shadow-xs'
                  : 'text-[#6F6456] hover:text-[#1F1914]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onToggleLang('fr')}
              aria-label="Français"
              aria-pressed={lang === 'fr'}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                lang === 'fr'
                  ? 'bg-[#28221D] text-[#FAF6F0] shadow-xs'
                  : 'text-[#6F6456] hover:text-[#1F1914]'
              }`}
            >
              FR
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
