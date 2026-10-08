// Server-side proxy for Google Gemini (Vercel Function, Web-standard handler).
// The API key lives only in the server environment (GEMINI_API_KEY) and is never
// shipped to the browser. Only a fixed set of tasks is accepted, each with its own
// input limits, so this endpoint cannot be used as a general-purpose Gemini proxy.
//
// Keep this file self-contained (no relative imports): it is bundled by Vercel as a
// standalone Node ESM function, and also loaded by the Vite dev middleware.
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-2.5-flash';
const MAX_CHAT_PROMPT_CHARS = 30_000;
const MAX_GUESTBOOK_MESSAGE_CHARS = 2_000;
const MAX_KEYWORDS_CHARS = 200;
const MAX_SKILLS = 50;

// Best-effort per-instance rate limit. Use Vercel Firewall rules for a hard limit.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map<string, number[]>();

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  if (requestLog.size > 5_000) requestLog.clear();
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
};

const asString = (value: unknown, maxLength: number): string | null =>
  typeof value === 'string' && value.trim() !== '' && value.length <= maxLength ? value : null;

const buildProjectSuggestionPrompt = (skills: string[], keywords: string): string => {
  const keywordInstruction = keywords
    ? `The user has also provided these keywords/interests for the project idea: "${keywords}". Please try to incorporate these themes or topics naturally into your suggestion if possible, while still aligning with the developer's skills.`
    : '';
  return `
You are an expert project manager and creative software architect.
Your task is to suggest a new and interesting software project idea.
The project should be innovative yet feasible.
Consider these skills of the developer who might build this: ${skills.join(', ')}.
${keywordInstruction}
Please generate the following details for the project:
1.  **title**: A catchy and descriptive project title (string).
2.  **description**: A concise (2-3 sentences) description of what the project does, its purpose, and key features (string).
3.  **technologies**: An array of 3-5 core technologies or tools that would be suitable for building this project (array of strings).
4.  **year**: A plausible year of completion (number, e.g., ${new Date().getFullYear() + 1}).
5.  **related_skills**: An array of 2-4 skills relevant to developing this project, possibly drawing from or complementing the developer's existing skills (array of strings).

Return the response as a single, valid JSON object with exactly these keys: "title", "description", "technologies", "year", "related_skills".
Do not include any other text or explanation outside of the JSON object.
`;
};

const buildModerationPrompt = (message: string): string => `
    You are a content moderation assistant for a public guest book.
    Your task is to determine if the following message is respectful, appropriate, and not spammy for a public guest book on a developer's portfolio website.
    The message should be generally positive or constructive. Avoid hate speech, offensive language, personal attacks, excessive profanity, or clearly irrelevant spam.
    Respond with ONLY ONE of the following keywords:
    - "OK" if the message is appropriate.
    - "FLAGGED" if the message is inappropriate, offensive, spam, or otherwise problematic.

    Message to validate: "${message}"

    Your response:
  `;

export async function GET(): Promise<Response> {
  return json({ configured: !!process.env.GEMINI_API_KEY });
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: 'Gemini API key is not configured on the server.' }, 503);

  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) return json({ error: 'Too many requests. Please slow down.' }, 429);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  let contents: string;
  let config: Record<string, unknown> | undefined;

  switch (body.task) {
    case 'chat': {
      const prompt = asString(body.prompt, MAX_CHAT_PROMPT_CHARS);
      if (!prompt) return json({ error: 'Invalid prompt.' }, 400);
      contents = prompt;
      break;
    }
    case 'suggest-project': {
      const skills = Array.isArray(body.skills)
        ? body.skills.filter((s): s is string => typeof s === 'string' && s.length <= 100).slice(0, MAX_SKILLS)
        : [];
      const keywords = typeof body.keywords === 'string' ? body.keywords.slice(0, MAX_KEYWORDS_CHARS) : '';
      contents = buildProjectSuggestionPrompt(skills, keywords);
      config = { responseMimeType: 'application/json', temperature: 0.8 };
      break;
    }
    case 'moderate': {
      const message = asString(body.message, MAX_GUESTBOOK_MESSAGE_CHARS);
      if (!message) return json({ error: 'Invalid message.' }, 400);
      contents = buildModerationPrompt(message);
      config = { temperature: 0.1, topK: 1 };
      break;
    }
    default:
      return json({ error: 'Unknown task.' }, 400);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({ model: MODEL, contents, config });
    return json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Gemini request failed:', error);
    return json({ error: 'Upstream AI request failed.' }, 502);
  }
}
