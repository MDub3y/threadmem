import { BenchCase, Message, SystemAdapter } from '../types';
import { complete } from '../provider';
import { ANSWER_SYSTEM, renderMessage } from './fullContext';

// Baseline 2: BM25 retrieval over raw messages, top-k into the prompt. The
// standard-issue "memory" most products actually ship.

const K1 = 1.5, B = 0.75, TOP_K = 6;
const tok = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 1);

function bm25TopK(messages: Message[], query: string, k: number): Message[] {
  const docs = messages.map((m) => tok(`${m.subject} ${m.body} ${m.from}`));
  const avgLen = docs.reduce((n, d) => n + d.length, 0) / Math.max(1, docs.length);
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const N = docs.length;
  const scores = docs.map((d) => {
    const tf = new Map<string, number>();
    d.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    let s = 0;
    for (const q of new Set(tok(query))) {
      const f = tf.get(q) ?? 0;
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(q) ?? 0) + 0.5) / ((df.get(q) ?? 0) + 0.5));
      s += idf * (f * (K1 + 1)) / (f + K1 * (1 - B + B * d.length / avgLen));
    }
    return s;
  });
  return messages
    .map((m, i) => ({ m, s: scores[i] }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .sort((a, b) => a.m.date.localeCompare(b.m.date))
    .map((x) => x.m);
}

export const bm25: SystemAdapter = {
  name: `bm25-top${TOP_K}`,
  async answer(c: BenchCase): Promise<string> {
    const picked = bm25TopK(c.messages, c.probe.question, TOP_K);
    const mailbox = picked.map(renderMessage).join('\n\n---\n\n');
    const asOf = c.probe.asOf ? ` (answer as of ${c.probe.asOf})` : '';
    return complete(ANSWER_SYSTEM, `Retrieved emails from the mailbox of ${c.owner}:\n\n${mailbox}\n\nQuestion${asOf}: ${c.probe.question}`);
  },
};
