# ADR 0004: Separate shared platform from private brand data

- Status: Accepted
- Date: 2026-08-01
- Owner: Higher Roads

## Context

The commercial opportunity depends on reusing schemas, workflows, policies, adapters, and evaluators across engagements. Brand evidence, assets, canon, requests, outputs, and approval history are client-owned and may be confidential. Mixing reusable platform code with client configuration would weaken security, portability, and product learning.

## Decision

Shared infrastructure contains schemas, contract definitions, policy and governance logic, orchestration, provider adapters, evaluators, administrative tools, and sanitized fixtures.

Each brand environment contains private evidence, entities, relationships, assets, rules, jobs, memory, permissions, integrations, and tenant configuration. Every runtime record and storage key is tenant-scoped.

## Options considered

- One repository and data space per custom implementation.
- Shared application with unstructured client folders.
- Shared platform contracts with isolated tenant data and configuration.

## Rationale

The selected boundary permits reusable product development without treating client content as shared intellectual property. It also supports client ownership and eventual portability.

## Consequences

- Public fixtures must remain synthetic or sanitized.
- Provider context is minimized to the task and tenant.
- Logs, caches, search indexes, queues, and object paths preserve tenant isolation.
- Export, retention, deletion, encryption, and deployment requirements remain explicit tenant-policy concerns.
