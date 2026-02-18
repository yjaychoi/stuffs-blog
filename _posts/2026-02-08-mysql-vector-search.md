---
layout: post
post_uid: 2026-02-08-mysql-vector-search
slug: mysql-vector-search
title: "Paths of MySQL, vector search edition"
date: 2026-02-08 09:00:00 +0900
tags: [databases, mysql, vector-search]
summary: "A practical look at MySQL vector-search options, with tradeoffs across native features, extensions, and operational constraints."
featured: true
comments: true
---
In the ever-evolving landscape of database technology, the integration of vector search capabilities has become a pivotal feature for modern applications. As we move deeper into 2026, the demand for semantic search powered by large language models continues to reshape how we architect data storage layers.

MySQL, often seen as the traditional workhorse of the web, has not been sitting idle. The ecosystem has bifurcated into several interesting paths, each attempting to solve the `k-nearest neighbor` problem without sacrificing the ACID guarantees teams still depend on.

## The Native Approach

Initially, many teams stored vectors as `BLOB` values and performed brute-force scans. While simple, that approach scales linearly with data size and quickly becomes unworkable for latency-sensitive applications.

```sql
CREATE TABLE embeddings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT,
  embedding VECTOR(1536)
);

SELECT id,
       content,
       vec_cosine_distance(embedding, @query_vector) AS distance
FROM embeddings
ORDER BY distance ASC
LIMIT 5;
```

The native syntax is clean and integrated. For small-to-mid datasets it can be enough, but once row counts enter eight digits you start feeling the absence of stronger ANN index options. For baseline SQL behavior and engine details, the [MySQL Reference Manual](https://dev.mysql.com/doc/) is still the canonical source.

## Operational Topology

The main architecture decision is where candidate generation runs and where reranking runs. This split tends to dominate latency more than the exact schema.

```mermaid
flowchart TB
  subgraph C["Client + Edge"]
    U["User"]
    UI["Web / Mobile UI"]
    CDN["CDN + WAF"]
    RL["Edge Rate Limit"]
    AB["A/B Router"]
    U --> UI --> CDN --> RL --> AB
  end

  subgraph API["Application Layer"]
    GW["API Gateway"]
    AUTH["AuthN/AuthZ"]
    QP["Query Preprocessor"]
    LC["Language + Tenant Context"]
    PB["Prompt Builder"]
    AB --> GW --> AUTH --> QP --> LC --> PB
  end

  subgraph EMB["Embedding Services"]
    EC["Embedding Cache (Redis)"]
    EW["Embedding Worker Pool"]
    EM["Embedding Model (1536d)"]
    EDLQ["Embedding DLQ"]
    QV["Query Vector"]
    PB --> EC
    EC -- "cache hit" --> QV
    EC -- "cache miss" --> EW --> EM --> QV
    EW -. "worker failure" .-> EDLQ
  end

  subgraph RET["Candidate Retrieval"]
    MF["Metadata Filter Pushdown"]
    ANN["MySQL ANN Index"]
    BF["Brute-force Fallback"]
    HYB["Hybrid BM25 + Vector Merge"]
    QV --> MF --> ANN
    QV --> BF
    LC --> MF
    ANN --> HYB
    BF --> HYB
  end

  subgraph MYSQL["MySQL + Sync Topology"]
    RW["Primary (RW)"]
    RO1["Replica A (RO)"]
    RO2["Replica B (RO)"]
    BIN["Binlog Stream"]
    CDC["CDC / Debezium"]
    EXT["External Vector Engine"]
    ANN --> RO1
    ANN --> RO2
    BF --> RO1
    RW --> BIN --> CDC --> EXT
    EXT --> HYB
  end

  subgraph RR["Rerank + Response"]
    TOPK["Top K IDs + Scores"]
    FD["Fetch Full Documents"]
    FJ["Feature Join"]
    XRR["Cross-Encoder Reranker"]
    POL["Policy / Safety Filters"]
    RC["Response Composer"]
    HYB --> TOPK --> FD --> FJ --> XRR --> POL --> RC
  end

  subgraph OBS["Observability + Cost"]
    MET["Metrics (p95, recall@k)"]
    TR["Distributed Traces"]
    LOG["Structured Logs"]
    SLO["SLO Alerts"]
    DASH["Ops Dashboard"]
    COST["Token + Infra Cost"]
    RC --> MET
    RC --> TR
    RC --> LOG
    EM --> COST
    XRR --> COST
    MET --> SLO --> DASH
    COST --> DASH
  end

  subgraph RES["Resilience Paths"]
    CB["Circuit Breaker"]
    CACHE["Result Cache"]
    DEG["Degraded Mode"]
    RETRY["Retry Queue"]
    GW -. "timeout" .-> CB
    ANN -. "slow / unavailable" .-> CB
    CB --> CACHE --> DEG
    XRR -. "model saturation" .-> RETRY
    RETRY --> XRR
  end

  RC --> OUT["User Response"]

  classDef hot fill:#ffe5e5,stroke:#d62728,stroke-width:2px,color:#111;
  classDef data fill:#e8f4ff,stroke:#1f77b4,stroke-width:1.5px,color:#111;
  classDef control fill:#eefbe7,stroke:#2ca02c,stroke-width:1.5px,color:#111;

  class ANN,BF,XRR hot;
  class RW,RO1,RO2,EXT,TOPK,FD data;
  class CB,CACHE,DEG,RETRY control;
```

### Alternative Extensions

A second strategy is to combine MySQL with engines that specialize in high-dimensional search while preserving MySQL as the source of truth.

- PlanetScale Vector for serverless operational simplicity.
- Manticore-style protocol-compatible search engines for high-throughput retrieval.

Both approaches can work if you document ownership of truth, sync lag policy, and failure-mode behavior before launch.
