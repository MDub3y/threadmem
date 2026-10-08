import fs from 'fs';
import path from 'path';
import { BenchCase, Prediction, SystemAdapter } from './types';
import { scoreCase } from './score';
import { fullContext } from './baselines/fullContext';
import { bm25 } from './baselines/bm25';
import { modelName, totals } from './provider';

//   npm run bench -- --system full-context|bm25 [--data data/synthetic-v1] [--limit n]
// Writes results/<suite>.<system>.<model>.json with every prediction, so
// re-scoring is free and nothing about a run is unpublishable.

const SYSTEMS: Record<string, SystemAdapter> = { 'full-context': fullContext, bm25 };

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function main(): Promise<void> {
  const systemName = arg('system') ?? 'full-context';
  const system = SYSTEMS[systemName];
  if (!system) { console.error(`unknown system; pick one of: ${Object.keys(SYSTEMS).join(', ')}`); process.exit(1); }
  const dataDir = arg('data') ?? path.join('data', 'synthetic-v1');
  const { suite, cases } = JSON.parse(fs.readFileSync(path.join(dataDir, 'cases.json'), 'utf8')) as { suite: string; cases: BenchCase[] };
  const limit = Number(arg('limit') ?? 0) || cases.length;

  const preds: Prediction[] = [];
  for (const c of cases.slice(0, limit)) {
    let answer = '';
    try { answer = await system.answer(c); } catch (err) { answer = `ERROR: ${err instanceof Error ? err.message : err}`; }
    const { correct, f1 } = answer.startsWith('ERROR:') ? { correct: false, f1: 0 } : scoreCase(c, answer);
    preds.push({ caseId: c.id, answer, correct, f1 });
    process.stdout.write(`\r${preds.length}/${limit} | acc ${(preds.filter((p) => p.correct).length / preds.length * 100).toFixed(0)}%   `);
  }
  console.log('\n');

  const byCap = new Map<string, Prediction[]>();
  for (const p of preds) {
    const cap = cases.find((c) => c.id === p.caseId)!.capability;
    byCap.set(cap, [...(byCap.get(cap) ?? []), p]);
  }
  console.log(`== ThreadMem ${suite} | system: ${system.name} | answering model: ${modelName()}`);
  console.log(`overall: acc ${(preds.filter((p) => p.correct).length / preds.length * 100).toFixed(1)}%  mean F1 ${(preds.reduce((a, p) => a + p.f1, 0) / preds.length).toFixed(3)}  (n=${preds.length})`);
  for (const [cap, ps] of [...byCap.entries()].sort()) {
    console.log(`  ${cap.padEnd(26)} n=${String(ps.length).padStart(2)}  acc ${(ps.filter((p) => p.correct).length / ps.length * 100).toFixed(0).padStart(3)}%  F1 ${(ps.reduce((a, p) => a + p.f1, 0) / ps.length).toFixed(3)}`);
  }
  console.log(`tokens: ${totals.input} in / ${totals.output} out`);

  fs.mkdirSync('results', { recursive: true });
  const outPath = path.join('results', `${suite}.${system.name}.${modelName().replace(/[^a-z0-9.-]/gi, '_')}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ suite, system: system.name, model: modelName(), at: new Date().toISOString(), preds }, null, 1));
  console.log(`wrote ${outPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
