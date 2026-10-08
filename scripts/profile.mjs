// Everything the profile visuals say, in one place. Edit here, then run
// `node scripts/build-assets.mjs` to redraw the SVGs in assets/.

export const person = {
  name: "Meer Khurram",
  role: "AI agent product manager",
  tagline: "I build and deploy voice AI agents hands-on.",
  focus: ["Voice AI", "Prompt engineering", "0-to-1 products"],
  location: "Hyderabad, India",
};

export const buttons = [
  { id: "avivro", label: "Try Avivro Voice", primary: true },
  { id: "linkedin", label: "LinkedIn" },
  { id: "email", label: "Email me" },
];

export const flagship = {
  name: "Avivro Voice",
  status: "Live at app.avivro.com",
  summary:
    "A multi-tenant platform where a business builds an AI voice agent, connects an Indian phone number and takes real inbound and outbound calls.",
  path: [
    ["Phone call", "Indian number"],
    ["SIP trunk", "carrier link"],
    ["LiveKit", "realtime media"],
    ["Voice agent", "prompt + knowledge"],
    ["Call record", "for every call"],
  ],
  engines: ["Gemini Live", "OpenAI Realtime", "Amazon Nova Sonic", "Cascade: Deepgram + Sarvam"],
  outputs: ["Transcript", "Recording", "AI summary", "Outcome", "Diagnostics"],
  facts: [
    ["11", "languages: Hindi, English and nine more"],
    ["4", "speech paths: three live engines or a cascade"],
    ["4", "team roles, with an audit log"],
    ["3", "paid plans on a prepaid rupee wallet"],
  ],
};

export const projects = [
  {
    id: "meerfit",
    kind: "Live app",
    name: "MeerFIT",
    summary: "Personal fitness tracker, built as an installable web app.",
    stack: ["React", "Vite", "Supabase", "IndexedDB"],
  },
  {
    id: "vaanichat",
    kind: "Public repo",
    name: "VaaniChat",
    summary: "AI chatbot platform with a chat playground.",
    stack: ["Next.js", "TypeScript", "Supabase", "Tailwind"],
  },
];

export const toolbox = [
  ["Voice AI", ["LiveKit", "SIP trunking", "Gemini Live", "OpenAI Realtime", "Amazon Nova Sonic", "Deepgram", "Sarvam", "Knowledge-base retrieval"]],
  ["Prompts", ["System prompts", "Conversation flows", "Evaluation on real calls", "Hindi", "Hinglish", "English"]],
  ["Build", ["TypeScript", "Next.js", "React", "Python", "Supabase", "Postgres", "Vercel"]],
  ["Product", ["Use-case discovery", "PRDs", "Roadmaps", "Prioritisation", "Go-to-market"]],
  ["Analytics", ["SQL", "GA4", "Mixpanel", "CleverTap", "A/B testing", "Funnel analysis"]],
];
