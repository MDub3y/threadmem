// Minimal OpenAI-compatible chat call (OpenRouter by default). The harness
// stays SDK-free so a baseline is ~50 lines and nothing hides in a client.

const BASE = process.env.BENCH_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = process.env.BENCH_MODEL || 'openai/gpt-oss-120b';

export interface Usage { input: number; output: number }
export const totals: Usage = { input: 0, output: 0 };

export async function complete(system: string, user: string): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY || process.env.BENCH_API_KEY;
  if (!key) throw new Error('set OPENROUTER_API_KEY (or BENCH_API_KEY)');
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, temperature: 0, max_tokens: 400, messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ] }),
    });
    const body = await res.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { message?: string } };
    if (body.choices?.[0]?.message?.content != null) {
      totals.input += body.usage?.prompt_tokens ?? 0;
      totals.output += body.usage?.completion_tokens ?? 0;
      return body.choices[0].message.content;
    }
    if (attempt === 2) throw new Error(`provider: ${body.error?.message ?? `HTTP ${res.status}`}`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  throw new Error('unreachable');
}

export const modelName = (): string => MODEL;
