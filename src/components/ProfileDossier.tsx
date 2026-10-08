import React, { useState } from 'react';
import {
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Flame,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { FABIEN_PROFILE } from '../data/fabienProfile.ts';

interface ProfileDossierProps {
  lang: 'en' | 'fr';
  onAskTopic: (topicPrompt: string) => void;
}

export const ProfileDossier: React.FC<ProfileDossierProps> = ({ lang, onAskTopic }) => {
  const [activeTab, setActiveTab] = useState<'experiences' | 'education' | 'skills' | 'passions'>('experiences');

  return (
    <div className="bg-[#FAF7F0] rounded-2xl border border-[#E9E3D8] shadow-sm overflow-hidden flex flex-col">
      {/* Dossier Header */}
      <div className="p-6 md:p-8 bg-[#F6F1E6] border-b border-[#E9E1D4]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] tracking-widest font-semibold uppercase text-[#8F7449]">
                {lang === 'en' ? 'Professional Dossier' : 'Dossier Professionnel'}
              </span>
              <span className="text-[#C5BBAA]">•</span>
              <span className="text-xs text-[#6F6659]">ESCE Business School</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-[#1E1914]">
              {FABIEN_PROFILE.name}
            </h1>
            <p className="font-serif italic text-base text-[#61574A] mt-1">
              {lang === 'en' ? FABIEN_PROFILE.titleEn : FABIEN_PROFILE.titleFr}
            </p>
          </div>

          {/* Contact quick buttons */}
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href={`mailto:${FABIEN_PROFILE.email}`}
              className="px-3 py-1.5 rounded-lg bg-[#EFE9DD] hover:bg-[#E4DBCB] text-[#362E25] border border-[#DDD3C2] flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#8F7449]" />
              <span>{FABIEN_PROFILE.email}</span>
            </a>
            <a
              href={`tel:${FABIEN_PROFILE.phone.replace(/\s+/g, '')}`}
              className="px-3 py-1.5 rounded-lg bg-[#EFE9DD] hover:bg-[#E4DBCB] text-[#362E25] border border-[#DDD3C2] flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#8F7449]" />
              <span>{FABIEN_PROFILE.phone}</span>
            </a>
            <span className="px-3 py-1.5 rounded-lg bg-[#EFE9DD] text-[#362E25] border border-[#DDD3C2] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#8F7449]" />
              <span>{FABIEN_PROFILE.location}</span>
            </span>
          </div>
        </div>

        {/* Short Executive Summary */}
        <p className="text-sm leading-relaxed text-[#4A4237] mt-4 max-w-3xl font-light">
          {lang === 'en' ? FABIEN_PROFILE.summaryEn : FABIEN_PROFILE.summaryFr}
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[#EBE4D7] bg-[#F7F3EB] px-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('experiences')}
          className={`px-4 py-3 text-xs md:text-sm font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'experiences'
              ? 'border-[#8F7449] text-[#1E1914] font-semibold'
              : 'border-transparent text-[#6F6659] hover:text-[#25201A]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>{lang === 'en' ? 'Experiences' : 'Expériences'}</span>
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`px-4 py-3 text-xs md:text-sm font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'education'
              ? 'border-[#8F7449] text-[#1E1914] font-semibold'
              : 'border-transparent text-[#6F6659] hover:text-[#25201A]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{lang === 'en' ? 'Education' : 'Formations'}</span>
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-3 text-xs md:text-sm font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'skills'
              ? 'border-[#8F7449] text-[#1E1914] font-semibold'
              : 'border-transparent text-[#6F6659] hover:text-[#25201A]'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{lang === 'en' ? 'Skills & Tools' : 'Compétences'}</span>
        </button>

        <button
          onClick={() => setActiveTab('passions')}
          className={`px-4 py-3 text-xs md:text-sm font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'passions'
              ? 'border-[#8F7449] text-[#1E1914] font-semibold'
              : 'border-transparent text-[#6F6659] hover:text-[#25201A]'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>{lang === 'en' ? 'Passions & Extracurricular' : 'Centres d’intérêt'}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {activeTab === 'experiences' && (
          <div className="space-y-6">
            {FABIEN_PROFILE.experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] hover:border-[#D5C7B0] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#211C16]">
                      {lang === 'en' ? exp.role : exp.roleFr}
                    </h3>
                    <p className="text-sm font-medium text-[#7D643B]">
                      {exp.company}
                    </p>
                  </div>
                  <span className="text-xs text-[#7A7061] font-serif italic">
                    {lang === 'en' ? exp.period : exp.periodFr} • {exp.location}
                  </span>
                </div>

                <ul className="space-y-1.5 mt-3 text-xs md:text-sm text-[#473F34]">
                  {(lang === 'en' ? exp.highlights : exp.highlightsFr).map((item, hIdx) => (
                    <li key={hIdx} className="flex items-start gap-2">
                      <span className="text-[#8F7449] mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-[#E6DDD0] flex justify-end">
                  <button
                    onClick={() =>
                      onAskTopic(
                        lang === 'en'
                          ? `Tell me more about Fabien's role at ${exp.company} (${exp.role}).`
                          : `Parle-moi en détail du rôle de Fabien chez ${exp.company} (${exp.roleFr}).`
                      )
                    }
                    className="text-xs text-[#7A6244] hover:text-[#1E1914] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Ask ASYt about this' : 'Demander à ASYt'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-4">
            {FABIEN_PROFILE.education.map((edu, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <h4 className="font-serif text-base font-semibold text-[#211C16]">
                    {lang === 'en' ? edu.degree : edu.degreeFr}
                  </h4>
                  <p className="text-sm text-[#7D643B] font-medium">
                    {edu.institution}
                  </p>
                  <p className="text-xs text-[#7A7061]">{edu.location}</p>
                </div>
                <div className="sm:text-right">
                  <span className="px-2.5 py-1 rounded-full bg-[#EDE5D8] border border-[#DFD5C4] text-xs font-serif text-[#5E5446]">
                    {edu.period}
                  </span>
                </div>
              </div>
            ))}

            {/* Languages */}
            <div className="mt-6 p-5 rounded-xl bg-[#F4EFE3] border border-[#E4DCcd]">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-[#8F7449]" />
                <h4 className="font-serif text-base font-semibold text-[#211C16]">
                  {lang === 'en' ? 'Languages' : 'Langues'}
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
                {FABIEN_PROFILE.languages.map((l, lIdx) => (
                  <div
                    key={lIdx}
                    className="p-2.5 rounded-lg bg-[#FAF7F0] border border-[#E5DDD0] flex justify-between items-center"
                  >
                    <span className="font-medium text-[#2A231B]">{l.name}</span>
                    <span className="text-[#726757] text-xs">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-6">
            {/* Core Competences */}
            <div>
              <h4 className="font-serif text-base font-semibold text-[#211C16] mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8F7449]" />
                <span>{lang === 'en' ? 'Core Competencies' : 'Compétences clés'}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {FABIEN_PROFILE.competences.map((c, cIdx) => (
                  <span
                    key={cIdx}
                    className="px-3.5 py-1.5 rounded-full bg-[#F4EEE3] border border-[#E3DACB] text-xs md:text-sm text-[#352D24] font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Software & Tools */}
            <div>
              <h4 className="font-serif text-base font-semibold text-[#211C16] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8F7449]" />
                <span>{lang === 'en' ? 'Software & Creative Tools' : 'Outils et logiciels'}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {FABIEN_PROFILE.tools.map((tool, tIdx) => (
                  <div
                    key={tIdx}
                    className="p-3 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] text-center"
                  >
                    <p className="text-xs font-semibold text-[#251E17]">{tool.name}</p>
                    <span className="text-[10px] text-[#867B6C] uppercase tracking-wider font-mono">
                      {tool.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'passions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FABIEN_PROFILE.passions.map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#F6F1E7] border border-[#E7DFD1] hover:border-[#D5C7B0] transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-serif text-lg font-semibold text-[#211C16] mb-1.5">
                    {lang === 'en' ? p.titleEn : p.titleFr}
                  </h4>
                  <p className="text-xs md:text-sm text-[#4E453A] leading-relaxed">
                    {lang === 'en' ? p.descEn : p.descFr}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6DDD0] flex justify-end">
                  <button
                    onClick={() =>
                      onAskTopic(
                        lang === 'en'
                          ? `Tell me about Fabien's passion for ${p.titleEn}.`
                          : `Parle-moi de la passion de Fabien pour : ${p.titleFr}.`
                      )
                    }
                    className="text-xs text-[#7A6244] hover:text-[#1E1914] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Ask ASYt' : 'En savoir plus'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
