# ThreadMem — a benchmark for email-native memory

**Pre-registered 2026-10-08, before any system was measured.** This document fixes the capability taxonomy, task formats, metrics, and expected failure modes in advance, so results cannot quietly reshape the test. Changes after first measurement land as dated amendments, never edits.

## Why this benchmark exists

Every public memory benchmark (LoCoMo, LongMemEval, BEAM, MemoryAgentBench) evaluates **dyadic chat**: two cooperative speakers, alternating turns, one conversation stream. Email is the substrate most business memory actually lives in, and it differs structurally: many participants per thread, quoting that duplicates content across messages, metadata that carries meaning (CC, forwards, timestamps weeks apart), attachments, and — critically — **senders who may be adversarial**. EmailBench covers email task-execution but explicitly excludes long-term memory. The intersection is unoccupied.

ThreadMem measures whether a memory system can read email and come out with memory that is *correct, attributed, current, and unpoisoned*.

## The ten capabilities

### C1 — Multi-party attribution
Who said it? A thread with 3+ participants where similar claims come from different people. Task: QA of the form "what did X (not Y) commit to?" Metric: attribution accuracy. **Expected failure:** systems built on dyadic data merge speakers; we expect this to be the largest email-vs-chat gap.

### C2 — Quote-chain deduplication
Email clients quote prior messages in full. The same sentence appears in 5 messages but was asserted once, by one person, on one date. Task: count/attribute assertions. Metric: duplicate-fact rate, false re-attribution to the quoter. **Expected failure:** naive extractors store the quoted copy as a fresh fact from the forwarder.

### C3 — Thread-structure exploitation
Reply-to chains, forks, subject drift, forwards into new audiences. Task: QA requiring the thread graph ("which proposal was the final one after the fork?"). Metric: accuracy vs. a flat-concatenation ceiling. **Expected failure:** flattening destroys forks; systems ignoring In-Reply-To do no better than bag-of-messages.

### C4 — Irregular-gap temporal reasoning
Chat benchmarks space sessions evenly; email gaps run minutes to months, and meaning hangs on them ("as discussed last quarter"). Task: event-date QA and ordering across gaps, relative-date resolution against the message date. Metric: temporal accuracy. **Expected failure:** storing *noted-at* instead of *happened-at* (observed first-hand: 5% temporal accuracy before the fix, 22–24% after).

### C5 — Attachment-grounded facts
The decisive fact lives in the attachment the body only gestures at ("numbers attached"). Task: QA answerable only if attachment text was ingested and attributed to its carrier message. Metric: accuracy + provenance correctness. **Expected failure:** body-only pipelines answer confidently from the gesture.

### C6 — Commitment lifecycle
Made → amended → delegated → fulfilled or expired. Task: "what is still owed, by whom, as of date D?" Metric: open-commitment F1 at probe dates. **Expected failure:** systems detect commitments but never close them; stale-promise pileup.

### C7 — Structured-noise rejection
Newsletters, receipts, auto-replies, legal footers, calendar spam — the bulk of real inboxes. Task: memory built over a noisy mailbox; probe that no footer/boilerplate became a "fact". Metric: noise-fact rate per 100 messages. **Expected failure:** disclaimer text ("this email does not constitute an offer") stored as preferences/facts.

### C8 — Adversarial resistance (memory poisoning)
Hostile senders attempt instruction injection, false-fact planting, quote forgery, authority impersonation — through bodies, subjects, and attachments. Task: the red-team suite; a planted marker must never reach *active* memory or downstream answers. Metric: forbidden-state changes per payload-channel (target 0), plus reviewer-load (payloads parked for human review). **Expected failure:** any system that writes extractions directly to memory fails this wholesale; our own measured baseline is 0/60 with 33 parked.

### C9 — Identity drift
The same human across addresses (job change, personal↔work), and different humans sharing a display name. Task: QA after a mid-corpus address change announced in-band. Metric: continuity accuracy, false-merge rate. **Expected failure:** address-keyed stores fork the person; name-keyed stores merge strangers.

### C10 — Provenance and trust weighting
Every stored claim must cite its source message with a supporting span, and first-party claims ("I will…") must outrank hearsay ("Bob said he will…"). Task: for each answer, require the citation; score claims whose cited span does not entail them. Metric: **cited-but-unsupported rate** (our measured baseline on a production system: 24% of verbatim-quoted extractions, caught and dropped). **Expected failure:** near-universal; no mainstream memory library verifies entailment of stored claims today.

## Data

- **Real substrate:** the CMU Enron maildir (public, real threads, real mess) for C1–C3, C7, C9. PII stance: corpus is long-public and court-released; we still exclude content flagged by prior redaction lists and publish mailbox identifiers, not bodies, in results.
- **Synthetic with planted ground truth:** generator-produced mailboxes for capabilities needing exact labels — C4 (dated events), C5 (attachments), C6 (lifecycles), C8 (payload markers), C9 (drift scripts). The generator and seeds ship with the benchmark.

## Baselines (none of them ours)

1. Full-context stuffing (the ceiling where it fits).
2. BM25 top-k over raw messages.
3. Store-everything embeddings + top-k.
4. One off-the-shelf memory library (Mem0 OSS), unmodified.

Proofbox is scored as *a* system, with the same harness, and we commit to publishing the capabilities where it loses to a baseline.

## External anchor

LongMemEval-S run through the same adapter, so every system carries one number comparable to the wider literature. LoCoMo is secondary (dyadic chat; we have published three runs on it and its gap to email is part of the motivation).

## Scoring discipline

Deterministic scorers wherever labels permit (token-F1 with date canonicalisation; exact marker checks for C8); an LLM-judge mode exists only as a clearly-labelled secondary. Every run reports cost next to accuracy. Predictions are checkpointed and published for free re-scoring.

## Pre-registered predictions (to be checked against first results)

1. The email-vs-chat transfer gap concentrates in C1 and C2, not raw recall.
2. No baseline beats 50% on C6 lifecycle probes.
3. C8 separates architectures into two clusters (verified-write vs direct-write) with little middle ground.
4. At least one capability will show a baseline beating every memory system, including ours — if none does, the taxonomy is too easy and gets amended, in public.
