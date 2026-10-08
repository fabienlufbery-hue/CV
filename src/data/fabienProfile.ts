export interface ExperienceItem {
  role: string;
  roleFr: string;
  company: string;
  period: string;
  periodFr: string;
  location: string;
  highlights: string[];
  highlightsFr: string[];
}

export interface EducationItem {
  degree: string;
  degreeFr: string;
  institution: string;
  period: string;
  location: string;
}

export const FABIEN_PROFILE = {
  name: "Fabien Lufbery",
  titleEn: "Business Student at ESCE | International Media & Business Developer",
  titleFr: "Étudiant à l'ESCE Business School | International Media & Business Developer",
  location: "Paris, France",
  email: "Fabienlufbery@yahoo.com",
  phone: "+33 6 10 94 21 69",
  summaryEn:
    "Student in ESCE Business School's Master Grande École program in Paris La Défense with solid experience in international media campaign management at Omnicom Media Group (OMD for Renault/Dacia), B2B business development at Cogeus, and real estate sales.",
  summaryFr:
    "Étudiant en Programme Grande École à l'ESCE Business School à La Défense avec des expériences confirmées en gestion de campagnes médias internationales chez Omnicom Media Group (OMD pour Renault/Dacia), en développement commercial B2B chez Cogeus et en immobilier.",
  
  experiences: [
    {
      role: "International Account (Renault / Dacia)",
      roleFr: "International Account (Renault / Dacia)",
      company: "Omnicom Media Group (OMD)",
      period: "July 2025 – January 2026",
      periodFr: "Juillet 2025 – Janvier 2026",
      location: "Paris, France",
      highlights: [
        "Audit of media campaign investments across Europe",
        "Coordination of media campaigns across multiple European markets (Germany, Spain, Italy, UK, Belgium, Netherlands...)",
        "Monitoring implementation of media strategies and planning",
        "Digital campaign reporting across social media and display channels",
        "Liaison with local European market agencies",
        "Continuous intelligence watch on media innovations & ad technologies",
      ],
      highlightsFr: [
        "Audit des investissements des campagnes médias",
        "Coordination des campagnes médias sur différents pays (Allemagne, Espagne, Italie, Belgique, Royaume-Uni, Pays-Bas...)",
        "Suivi des implémentations des stratégies et plannings médias",
        "Réalisation de rapports de campagnes digitales (social media, display)",
        "Assurer un suivi auprès des agences locales européennes",
        "Assurer une veille des innovations médias",
      ],
    },
    {
      role: "Business Developer",
      roleFr: "Business Developer",
      company: "Cogeus",
      period: "March 2025",
      periodFr: "Mars 2025",
      location: "Paris, France",
      highlights: [
        "Prospection and acquisition of new B2B clients",
        "Presentation of Cogeus solutions and contract negotiation",
        "Design of high-impact pitch decks and visual documents to support negotiations",
      ],
      highlightsFr: [
        "Prospection et acquisition de nouveaux clients",
        "Présentation des solutions Cogeus, négociation des offres",
        "Conception de présentations et documents visuels pour appuyer les négociations",
      ],
    },
    {
      role: "Real Estate Sales Consultant",
      roleFr: "Commercial en agence immobilière",
      company: "Bimbenet Immobilier",
      period: "May 2024 – August 2024",
      periodFr: "Mai 2024 – Août 2024",
      location: "France",
      highlights: [
        "Personalized greeting and advisory for clients' property projects",
        "Organization and management of rental visits ensuring premium client satisfaction",
        "Negotiation of rental conditions and lease closings",
        "Portfolio expansion and contributing to agency visibility",
      ],
      highlightsFr: [
        "Accueil et conseil personnalisé des clients pour leurs projets immobiliers",
        "Organisation et gestion des visites de biens locatifs avec un service client d'excellence",
        "Négociation des conditions de location pour conclure les transactions",
        "Développement du portefeuille clients et contribution à la visibilité de l’agence",
      ],
    },
  ] as ExperienceItem[],

  education: [
    {
      degree: "Programme Grande École (Master in Management)",
      degreeFr: "Programme Grande École",
      institution: "ESCE Business School",
      period: "2023 – 2028",
      location: "Paris La Défense",
    },
    {
      degree: "BBA (Bachelor in Business Administration)",
      degreeFr: "BBA",
      institution: "Excelia Business School",
      period: "2022 – 2023",
      location: "La Rochelle",
    },
    {
      degree: "Scientific Baccalaureate (Bac S)",
      degreeFr: "Baccalauréat Scientifique",
      institution: "Saint Martin de France",
      period: "2020 – 2022",
      location: "Pontoise",
    },
  ] as EducationItem[],

  languages: [
    { name: "French", level: "Native (Langue maternelle)" },
    { name: "English", level: "Professional / Fluent (International coordination)" },
    { name: "German", level: "Working knowledge (Allemand)" },
    { name: "Spanish", level: "Conversational (Espagnol)" },
  ],

  competences: [
    "Leadership & teamwork",
    "Project management",
    "Decision making",
    "Active listening",
    "High organization & rigor",
  ],

  tools: [
    { name: "Adobe Photoshop", category: "Design" },
    { name: "Adobe Illustrator", category: "Design" },
    { name: "Adobe Premiere Pro", category: "Video" },
    { name: "Adobe After Effects", category: "Motion" },
    { name: "Adobe InDesign", category: "Editorial" },
    { name: "Adobe Lightroom", category: "Photo" },
    { name: "Microsoft Excel", category: "Business" },
    { name: "Microsoft PowerPoint", category: "Business" },
  ],

  passions: [
    {
      titleEn: "Competitive Karting",
      titleFr: "Karting en compétition",
      descEn: "7 years of competitive karting: rapid decision making under pressure, spatial anticipation, and precision racing discipline.",
      descFr: "7 ans d'expérience en karting de compétition : réflexes affûtés, gestion du stress, rigueur et stratégie de trajectoire.",
    },
    {
      titleEn: "Digital Content Creation",
      titleFr: "Création de contenu numérique",
      descEn: "Video production, motion graphics, and graphic storytelling across modern digital platforms.",
      descFr: "Production audiovisuelle, montage vidéo, design graphique et narration numérique.",
    },
    {
      titleEn: "Travel & Cultural Immersion",
      titleFr: "Voyage et immersion culturelle",
      descEn: "Linguistic stays and global travels developing strong intercultural adaptability and open-mindedness.",
      descFr: "Séjours linguistiques et voyages favorisant l'adaptabilité internationale et l'ouverture d'esprit.",
    },
    {
      titleEn: "Social Volunteering (dansmarue)",
      titleFr: "Maraude associative « dansmarue »",
      descEn: "Volunteer street outreach supporting unhoused people in Paris with meals, clothing, and warm human connection.",
      descFr: "Maraudes citoyennes à Paris auprès de personnes sans-abri : écoute active, distribution de vivres et soutien humain.",
    },
  ],

  sampleQuestions: [
    {
      en: "Can you summarize Fabien's experience at Omnicom Media Group (OMD)?",
      fr: "Peux-tu résumer l'expérience de Fabien chez Omnicom Media Group (OMD) ?",
      tag: "Experience",
    },
    {
      en: "What did Fabien do for Renault and Dacia?",
      fr: "Qu'a fait Fabien pour Renault et Dacia ?",
      tag: "Media",
    },
    {
      en: "What are Fabien's key leadership and technical skills?",
      fr: "Quelles sont les compétences clés de Fabien ?",
      tag: "Skills",
    },
    {
      en: "Tell me about his 7 years of competitive karting.",
      fr: "Parle-moi de ses 7 ans d'expérience en karting.",
      tag: "Passions",
    },
    {
      en: "What is Fabien's academic background at ESCE?",
      fr: "Quelle est la formation académique de Fabien à l'ESCE ?",
      tag: "Education",
    },
    {
      en: "How can I contact Fabien for an interview or opportunity?",
      fr: "Comment puis-je contacter Fabien pour une opportunité ?",
      tag: "Contact",
    },
  ],
};
