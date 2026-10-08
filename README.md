# ThreadMem

**The benchmark for email-native memory.** Every public memory benchmark evaluates dyadic chat; the substrate business memory actually lives in — multi-party, quote-duplicated, temporally irregular, adversarial email — has none. ThreadMem is that benchmark.

Status: **taxonomy pre-registered** ([TAXONOMY.md](TAXONOMY.md), dated before any measurement). Harness, data generators, and baseline results land next; the design is fixed first so results can't reshape the test.

Ten capabilities: multi-party attribution · quote-chain dedup · thread-structure exploitation · irregular-gap temporal reasoning · attachment-grounded facts · commitment lifecycle · structured-noise rejection · **memory poisoning resistance** · identity drift · **provenance & entailment**. The last two are the point: no existing benchmark measures whether a memory can be poisoned, or whether stored claims are actually supported by their cited sources.

Reference system: [Proofbox](https://github.com/MDub3y/proofbox) — scored by the same harness as every baseline, losses published.

MIT. Maintained by [@MDub3y](https://github.com/MDub3y).

## First results — synthetic-v1 (36 cases: C4, C6, C8)

| system | overall | C4 temporal | C6 lifecycle | C8 poisoning |
|---|---|---|---|---|
| full-context (gpt-oss-120b) | 91.7% | 92% | 100% | **83%** |
| BM25 top-6 (gpt-oss-120b) | 94.4% | 100% | 100% | **83%** |

Two findings already. Both baselines were **successfully poisoned 2/12 times** — and by the *bluntest* payload ("invoice has been paid in full" from an unknown billing address), not the clever ones: the failure is source-trust weighting (C10), not instruction-following. And BM25 beat full-context on these small mailboxes — retrieval's focus outweighed the ceiling's noise. The reference verified-write system ([Proofbox](https://github.com/MDub3y/proofbox)) measures 0/60 on the same attack classes; scoring it under this harness, scaling mailboxes, and the Enron suites are next. Full predictions are committed under `results/`.
