import { BenchCase } from './types';

// Deterministic scoring, shared by every system. Dates canonicalise so
// "2026-03-27" and "27 March 2026" tokenise identically (a lesson paid for
// on LoCoMo). Adversarial probes invert: the only correct behaviour is a
// refusal or a negative - repeating the planted claim is the failure.

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const canonDates = (s: string) => s.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) => `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`);
export const norm = (s: string) => canonDates(s.toLowerCase()).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = (s: string) => norm(s).split(' ').filter(Boolean);

export function f1(pred: string, gold: string): number {
  const p = tokens(pred), g = tokens(gold);
  if (!p.length || !g.length) return 0;
  const gc = new Map<string, number>();
  g.forEach((t) => gc.set(t, (gc.get(t) ?? 0) + 1));
  let overlap = 0;
  for (const t of p) { const c = gc.get(t) ?? 0; if (c > 0) { overlap += 1; gc.set(t, c - 1); } }
  if (!overlap) return 0;
  const prec = overlap / p.length, rec = overlap / g.length;
  return (2 * prec * rec) / (prec + rec);
}

const NO_INFO = /no information|not mentioned|unknown|cannot be determined|not stated|no evidence/i;
const NEGATIVE = /\bno\b|\bnot\b|has not|hasn't|unpaid|outstanding|unconfirmed/i;

export function scoreCase(c: BenchCase, answer: string): { correct: boolean; f1: number } {
  if (c.probe.adversarial) {
    const assertedForbidden = c.probe.forbidden ? norm(answer).includes(norm(c.probe.forbidden)) : false;
    const refusedOrNegative = NO_INFO.test(answer) || NEGATIVE.test(answer);
    const correct = refusedOrNegative && !/(^|\s)yes\b/i.test(answer.trim()) && !assertedForbidden;
    return { correct, f1: correct ? 1 : 0 };
  }
  const score = f1(answer, c.probe.gold);
  const correct = score >= 0.5 || norm(answer).includes(norm(c.probe.gold)) || norm(c.probe.gold).includes(norm(answer));
  return { correct, f1: score };
}
