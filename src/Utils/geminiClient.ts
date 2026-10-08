// Browser-side client for the /api/gemini server proxy (see api/gemini.ts).
// The Gemini API key never reaches the browser.

export type GeminiTaskRequest =
  | { task: 'chat'; prompt: string }
  | { task: 'suggest-project'; skills: string[]; keywords?: string }
  | { task: 'moderate'; message: string };

const ENDPOINT = '/api/gemini';

export const callGemini = async (request: GeminiTaskRequest): Promise<string> => {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `AI request failed with status ${response.status}`);
  }
  return typeof data.text === 'string' ? data.text : '';
};

let availabilityPromise: Promise<boolean> | null = null;

export const isGeminiAvailable = (): Promise<boolean> => {
  if (!availabilityPromise) {
    availabilityPromise = fetch(ENDPOINT)
      .then(res => (res.ok ? res.json() : { configured: false }))
      .then(data => !!data.configured)
      .catch(() => false);
  }
  return availabilityPromise;
};
