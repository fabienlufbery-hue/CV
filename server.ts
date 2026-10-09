import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, type LiveServerMessage } from '@google/genai';
import { createWindowLimiter, isAllowedOrigin, parseChatBody, parseTtsBody, pcmToWav } from './server/security.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// An Origin check helps guard browser requests; deploy behind network rate limits
// and provider spending quotas as this cannot authenticate a public endpoint.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'https://fabienlufbery-hue.github.io,http://localhost:3000,http://localhost:5173')
  .split(',').map((value) => value.trim()).filter(Boolean);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin, req.headers.host, allowedOrigins)) {
    res.status(403).json({ error: 'Origin not permitted' });
    return;
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});
app.use(express.json({ limit: '24kb' }));

const chatLimit = createWindowLimiter(12, 60_000);
const ttsLimit = createWindowLimiter(8, 60_000);
function enforceLimit(req: import('express').Request, res: import('express').Response, limit: (key: string) => boolean): boolean {
  if (limit(req.ip || req.socket.remoteAddress || 'unknown')) return true;
  res.setHeader('Retry-After', '60');
  res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
  return false;
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('[Server] Warning: GEMINI_API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const ASYT_SYSTEM_INSTRUCTION = `
You are ASYt, the personal voice assistant representing Fabien Lufbery.
Your identity and voice persona:
- Your name is ASYt (pronounced "Ace-it").
- You speak English and French in a deep, masculine, elegant tone (American accent for English, refined French accent for French).
- You are professional, polite, sophisticated, articulate, and poised.
- You represent Fabien Lufbery, a business student at ESCE Business School in Paris with international experience at Omnicom Media Group (OMD) on the Renault/Dacia account, business development at Cogeus, and real estate at Bimbenet Immobilier.
- In your initial message or greeting, say: "Hello, I am Fabien's assistant, what would you like to know about him?" (or in French: "Bonjour, je suis l'assistant de Fabien, que souhaiteriez-vous savoir sur lui ?").
- You seamlessly adapt to the user's language: if they speak English, reply in English; if they speak French, reply in French.
- Keep your spoken responses concise, punchy, elegant, and conversational (typically 2 to 4 sentences) unless the user specifically asks for deep details.
- Fabien's Profile Data:
  * Full Name: Fabien Lufbery (Lufbery Fabien)
  * Current status: Student at ESCE Business School, Paris La Défense (Programme Grande École, 2023-2028).
  * Contact: Email fabienlufbery@yahoo.com (or fabienlufbery45@gmail.com), Phone +33 6 10 94 21 69 (06 10 94 21 69), based in Paris, France.
  * Experience:
    1. International Account (Renault / Dacia) at Omnicom Media Group (OMD) (July 2025 - January 2026):
       - Audit of media campaign investments across Europe.
       - Coordination of multi-country media campaigns (Germany, Spain, Italy, UK, Belgium, Netherlands...).
       - Follow-up of media strategies and schedule implementation.
       - Production of digital campaign performance reports (social media, display).
       - Regular liaison with European local agencies.
       - Continuous watch over media & advertising innovations.
    2. Business Developer at Cogeus (March 2025):
       - B2B prospecting and client acquisition.
       - Pitching Cogeus solutions, structuring deals, negotiating commercial contracts.
       - Designing high-impact visual presentation decks to support negotiations.
    3. Commercial Consultant at Bimbenet Immobilier (May 2024 - August 2024):
       - Personalized greeting and advisory for clients' real estate projects.
       - Organization and management of rental property visits ensuring high customer quality.
       - Lease negotiation and deal closing.
       - Expanding client portfolio and increasing local agency visibility.
  * Education:
    - Programme Grande École, ESCE Business School (La Défense, 2023-2028)
    - BBA, Excelia Business School (La Rochelle, 2022-2023)
    - Scientific Baccalaureate (Bac S), Saint Martin de France (Pontoise, 2020-2022)
  * Languages:
    - French (native)
    - English (fluent / professional international coordination)
    - German (intermediate working knowledge)
    - Spanish (conversational)
  * Competences & Soft Skills:
    - Leadership & teamwork
    - Project management
    - Decision making
    - Active listening
    - High organization & rigor
  * Technical & Design Tools:
    - Adobe Creative Cloud: Photoshop, Illustrator, After Effects, InDesign, Lightroom, Premiere Pro
    - Microsoft 365: Excel, PowerPoint, Word
  * Extracurriculars & Passions:
    - 7 years of competitive karting (7 ans d'expérience en karting de compétition: reflexes, speed, composure under pressure, strategy).
    - Digital content creation (video editing, graphics, digital storytelling).
    - International travel & cultural immersion.
    - Volunteer work / Maraude with charity association "dansmarue" (providing direct assistance and meals to vulnerable individuals in Paris).
    - Summer packaging / conditioning jobs (conditionneur).
- Tone reminder: Speak in a deep male voice tone. Express Fabien's qualities with natural confidence, clarity, and sophistication.
`;

// Public readiness check: never reveals credentials.
app.get('/api/health', (_req, res) => {
  res.status(apiKey ? 200 : 503).json({ status: apiKey ? 'ok' : 'unavailable' });
});

// API Endpoints
app.get('/api/profile', (_req, res) => {
  res.json({
    name: 'Fabien Lufbery',
    title: 'Student at ESCE Business School | International Media & Business Developer',
    location: 'Paris, France',
    email: 'fabienlufbery@yahoo.com',
    phone: '+33 6 10 94 21 69',
    school: 'ESCE Business School (Programme Grande École, 2023-2028)',
    experiences: [
      {
        role: 'International Account (Renault / Dacia)',
        company: 'Omnicom Media Group (OMD)',
        period: 'July 2025 – January 2026',
        description: 'Audit of media investments, European campaign coordination across Germany, UK, Spain, Italy, Belgium, Netherlands, digital performance reporting and media innovation watch.',
      },
      {
        role: 'Business Developer',
        company: 'Cogeus',
        period: 'March 2025',
        description: 'B2B client prospecting & acquisition, presentation and negotiation of offers, creation of visual pitch decks.',
      },
      {
        role: 'Commercial Consultant',
        company: 'Bimbenet Immobilier',
        period: 'May 2024 – August 2024',
        description: 'Client advisory, rental property visits management, lease term negotiations, portfolio development.',
      },
    ],
    education: [
      { institution: 'ESCE Business School', degree: 'Programme Grande École', dates: '2023 – 2028', location: 'La Défense' },
      { institution: 'Excelia Business School', degree: 'BBA', dates: '2022 – 2023', location: 'La Rochelle' },
      { institution: 'Saint Martin de France', degree: 'Baccalauréat Scientifique', dates: '2020 – 2022', location: 'Pontoise' },
    ],
    languages: ['French (Native)', 'English (Fluent)', 'German (Intermediate)', 'Spanish (Working)'],
    skills: ['Leadership & Teamwork', 'Project Management', 'Decision Making', 'Active Listening', 'Organization'],
    tools: ['Adobe Photoshop', 'Illustrator', 'Premiere Pro', 'After Effects', 'InDesign', 'Lightroom', 'MS Excel', 'PowerPoint'],
    passions: ['Competitive Karting (7 years)', 'Digital Content Creation', 'Cultural Travel', 'Volunteering (dansmarue association)'],
  });
});

// REST Fallback for Chat
app.post('/api/chat', async (req, res) => {
  try {
    if (!apiKey) return res.status(503).json({ error: 'Voice service is not configured' });
    if (!enforceLimit(req, res, chatLimit)) return;
    const parsed = parseChatBody(req.body);
    if (!parsed) return res.status(400).json({ error: 'Invalid message or history' });
    const { message, history } = parsed;

    const contents = [
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_CHAT_MODEL || 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: ASYT_SYSTEM_INSTRUCTION,
      },
    });

    const reply = response.text || "Hello, I am Fabien's assistant. How may I assist you?";
    res.json({ reply });
  } catch (error: any) {
    console.error('[API /api/chat error]:', error);
    res.status(502).json({ error: 'Chat temporarily unavailable' });
  }
});

// REST Endpoint for TTS using Gemini Voice
app.post('/api/tts', async (req, res) => {
  try {
    if (!apiKey) return res.status(503).json({ error: 'Voice service is not configured' });
    if (!enforceLimit(req, res, ttsLimit)) return;
    const parsed = parseTtsBody(req.body);
    if (!parsed) return res.status(400).json({ error: 'Invalid TTS text' });
    const { text } = parsed;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: `Speak in a deep, sophisticated male tone: ${text}` }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!audioPart?.data) return res.status(502).json({ error: 'No audio generated' });
    // Gemini TTS often emits raw 16-bit PCM; browsers need a WAV container.
    const raw = Buffer.from(audioPart.data, 'base64');
    const mime = audioPart.mimeType || '';
    const wav = mime.startsWith('audio/wav') ? raw : pcmToWav(raw);
    res.json({ audio: wav.toString('base64'), mimeType: 'audio/wav' });
  } catch (error: any) {
    console.error('[API /api/tts error]:', error);
    res.status(502).json({ error: 'Speech temporarily unavailable' });
  }
});

// WebSocket Server for Gemini Live API
// Explicit upgrade validation, fixed payload caps and connection quotas.
const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024, perMessageDeflate: false });
const liveLimit = createWindowLimiter(6, 60_000);
const liveConnections = new Map<string, number>();
server.on('upgrade', (req, socket, head) => {
  const ip = req.socket.remoteAddress || 'unknown';
  const reject = (code: number, reason: string) => {
    socket.write(`HTTP/1.1 ${code} ${reason}\r\nConnection: close\r\n\r\n`);
    socket.destroy();
  };
  if (req.url !== '/live') return reject(404, 'Not Found');
  if (!apiKey) return reject(503, 'Service Unavailable');
  if (!isAllowedOrigin(req.headers.origin, req.headers.host, allowedOrigins)) return reject(403, 'Forbidden');
  if (!liveLimit(ip) || (liveConnections.get(ip) || 0) >= 2 || wss.clients.size >= 30) return reject(429, 'Too Many Requests');
  wss.handleUpgrade(req, socket, head, (client) => {
    liveConnections.set(ip, (liveConnections.get(ip) || 0) + 1);
    client.once('close', () => {
      const current = liveConnections.get(ip) || 1;
      if (current <= 1) liveConnections.delete(ip);
      else liveConnections.set(ip, current - 1);
    });
    wss.emit('connection', client, req);
  });
});

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live WebSocket] Client connected');

  let liveSession: any = null;
  let isClosing = false;

  const cleanupSession = () => {
    isClosing = true;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (err) {
        // ignore
      }
      liveSession = null;
    }
  };

  try {
    // Connect to gemini-3.8-live
    liveSession = await ai.live.connect({
      model: process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Fenrir' is a resonant, deep male voice ideal for ASYt persona
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
        systemInstruction: ASYT_SYSTEM_INSTRUCTION,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // Model audio chunk
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }

          // Model transcription text
          const outputText = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
          if (outputText) {
            clientWs.send(JSON.stringify({ type: 'model_text', text: outputText }));
          }

          // User transcription text (if available)
          // @ts-ignore
          const userTranscription = (message.serverContent as any)?.userTurn?.parts?.[0]?.text;
          if (userTranscription) {
            clientWs.send(JSON.stringify({ type: 'user_text', text: userTranscription }));
          }

          // Turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }

          // Interruption event
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }
        },
        onclose: () => {
          console.log('[Live Session] Gemini Live session closed');
          if (clientWs.readyState === WebSocket.OPEN && !isClosing) {
            clientWs.send(JSON.stringify({ type: 'live_closed' }));
          }
        },
        onerror: (err: any) => {
          console.error('[Live Session Error]:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: 'Live session interrupted' }));
          }
        },
      },
    });

    if (isClosing || clientWs.readyState !== WebSocket.OPEN) {
      cleanupSession();
      return;
    }
    clientWs.send(JSON.stringify({ type: 'ready', message: 'Connected to Gemini Live' }));

    // Send initial greeting trigger to the model if session connected
    try {
      liveSession.sendRealtimeInput({
        text: 'Begin the conversation now with your introductory greeting: "Hello, I am Fabien\'s assistant, what would you like to know about him?"',
      });
    } catch (e) {
      console.warn('Initial greeting prompt warning:', e);
    }
  } catch (err: any) {
    console.error('[Live Connect Error]:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: 'Voice connection could not be established',
        })
      );
    }
  }

  clientWs.on('message', (rawData) => {
    try {
      const parsed = JSON.parse(rawData.toString());

      if (!parsed || typeof parsed !== 'object') return;
      if (parsed.type === 'audio' && typeof parsed.audio === 'string' && parsed.audio.length <= 60_000 && /^[A-Za-z0-9+/=]+$/.test(parsed.audio)) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } else if (parsed.type === 'text' && typeof parsed.text === 'string' && parsed.text.trim() && parsed.text.length <= 2000) {
        if (liveSession) {
          liveSession.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } else if (parsed.type === 'ping') {
        if (clientWs.readyState === WebSocket.OPEN) clientWs.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (err) {
      console.error('[Live WS Message parse error]:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[Live WebSocket] Client disconnected');
    cleanupSession();
  });

  clientWs.on('error', (err) => {
    console.error('[Live WebSocket error]:', err);
    cleanupSession();
  });
});

// Serve frontend with Vite in dev, or static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Server] Listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server startup error]:', err);
  process.exitCode = 1;
});
