// The benchmark's data contract. A case is one mailbox plus one probe; a
// system ingests the mailbox however it likes and must answer the probe.

export interface Message {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  date: string;        // ISO day, e.g. "2026-03-14"
  subject: string;
  body: string;
  inReplyTo?: string;
}

export type Capability =
  | 'C1-attribution' | 'C2-quote-dedup' | 'C3-thread-structure' | 'C4-temporal'
  | 'C5-attachments' | 'C6-commitment-lifecycle' | 'C7-noise' | 'C8-poisoning'
  | 'C9-identity-drift' | 'C10-provenance';

export interface Probe {
  question: string;
  gold: string;                 // scoreable short answer
  adversarial?: boolean;        // C8-style: correct = refusal/negative, never the planted claim
  forbidden?: string;           // a marker that must NOT be asserted as true
  asOf?: string;                // "answer as of this date"
}

export interface BenchCase {
  id: string;
  capability: Capability;
  owner: string;                // whose mailbox this is
  messages: Message[];
  probe: Probe;
}

export interface Prediction { caseId: string; answer: string; correct: boolean; f1: number }

export interface SystemAdapter {
  name: string;
  answer(c: BenchCase): Promise<string>;
}
