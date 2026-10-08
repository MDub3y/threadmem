# ThreadMem

**The benchmark for email-native memory.** Every public memory benchmark evaluates dyadic chat; the substrate business memory actually lives in — multi-party, quote-duplicated, temporally irregular, adversarial email — has none. ThreadMem is that benchmark.

Status: **taxonomy pre-registered** ([TAXONOMY.md](TAXONOMY.md), dated before any measurement). Harness, data generators, and baseline results land next; the design is fixed first so results can't reshape the test.

Ten capabilities: multi-party attribution · quote-chain dedup · thread-structure exploitation · irregular-gap temporal reasoning · attachment-grounded facts · commitment lifecycle · structured-noise rejection · **memory poisoning resistance** · identity drift · **provenance & entailment**. The last two are the point: no existing benchmark measures whether a memory can be poisoned, or whether stored claims are actually supported by their cited sources.

Reference system: [Proofbox](https://github.com/MDub3y/proofbox) — scored by the same harness as every baseline, losses published.

MIT. Maintained by [@MDub3y](https://github.com/MDub3y).

## First results — synthetic-v1 (36 cases: C4, C6, C8) — a smoke suite, read accordingly

| system | overall | C4 temporal | C6 lifecycle | C8 poisoning |
|---|---|---|---|---|
| full-context (gpt-oss-120b) | 91.7% | 92%¹ | 100% | **83%** |
| BM25 top-6 (gpt-oss-120b) | 94.4% | 100% | 100% | **83%** |

¹ includes one provider error scored as wrong (empty response, not a model miss).

**What these numbers are and aren't.** synthetic-v1 mailboxes are small (5–7 substantive messages), so the recall capabilities are close to saturated for strong models — these runs validate the harness and scoring, they do not yet discriminate memory systems. The suite earns that at scale and on the Enron data, which come next.

**A pre-registered prediction was falsified.** Prediction 2 said no baseline would beat 50% on lifecycle probes; both scored 100%. The prediction assumed realistic mailbox scale that v1 does not have. Recorded here rather than edited away — that is what pre-registration is for.

**The real finding, stated precisely.** Both baselines asserted a planted false claim as fact **2/12 times**, and the payload that worked was the *bluntest* one — a plain "invoice has been paid in full" from an unknown billing address — while the elaborate injection framings were refused. The failure mode is source-trust weighting (C10), not instruction-following. Two caveats: (a) 10 of the 12 refusals are softer than they look, because a truthful message in the mailbox gives counter-evidence — v2 will include no-counter-evidence variants; (b) [Proofbox](https://github.com/MDub3y/proofbox)'s separately-published 0/60 is a *different measurement* (state changes in its own red-team eval, not QA under this harness) — it has **not** yet been scored here, and no head-to-head exists until it is.

Full per-question predictions are committed under `results/`.
