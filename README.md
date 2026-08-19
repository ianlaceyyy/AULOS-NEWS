# AULOS NEWS

**A personal world-intelligence platform built on traceable evidence.**

AULOS NEWS organizes reporting around living event dossiers rather than an endless headline feed. It is designed to connect primary evidence, independent reporting, specialist analysis, market data, disputed claims, and competing narratives into a continuously updated picture of what is happening and why it matters.

## Prototype

The first vertical slice includes:

- A **World Now** homepage organized by consequential events
- A cross-asset **Market Pulse**
- A personalized **Morning Brief**
- Searchable, selectable event dossiers
- A claim ledger with confirmed, supported, and disputed states
- Competing interpretations without false balance
- Confidence and source-mix transparency
- Responsive desktop and mobile layouts

> Current stories and market values are illustrative prototype content. Live source ingestion is the next development phase.

## Product principles

1. Evidence before narrative.
2. Events, not duplicate headlines.
3. Claim-level provenance.
4. Uncertainty should be visible.
5. Primary evidence outranks commentary.
6. Repetition is not independent corroboration.
7. Perspective diversity is not false balance.
8. Corrections and revisions remain visible.

## Planned architecture

- **Interface:** Next.js, React, TypeScript
- **Ingestion and analysis:** Python services
- **Core data:** PostgreSQL and `pgvector`
- **Source types:** official APIs, RSS, filings, datasets, research papers, and compliant web extraction
- **Primary objects:** source, document, claim, event, entity, metric, narrative, scenario, and update

## Development

Requirements: Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run build
```

## Roadmap

1. Source registry and ingestion adapters
2. Document normalization and deduplication
3. Entity resolution and event clustering
4. Atomic claim extraction and provenance
5. Contradiction and dependency detection
6. Living narrative generation
7. Live market and economic-data overlays
8. Alerts and personalized briefings

