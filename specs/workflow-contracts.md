# Workflow Contracts

> Status: Draft 0.1. These are logical payload contracts for fixtures and implementation planning, not yet a machine-readable API specification.

## Purpose

The contracts make boundaries between world-building, governance, production, evaluation, approval, and learning explicit. Every contract is serializable, versioned, tenant-scoped, and traceable to an actor or system event.

Fields shown below are minimum semantic requirements. Transport metadata, pagination, authentication, and provider-specific details are intentionally omitted.

## Shared envelope

Every contract includes:

```yaml
contract_type: production_request
contract_version: 0.1
id: request_042
tenant_id: tenant_pwp_fixture
created_at: 2026-08-01T19:00:00Z
created_by:
  actor_type: human
  actor_id: producer_01
correlation_id: launch_social_042
```

`correlation_id` connects artifacts from one workflow without replacing their stable identifiers.

## Evidence manifest

Created by intake. Describes evidence without claiming what it means.

Required content:

- source kind and source reference;
- captured files, URLs, pages, or records;
- checksums or immutable version references where possible;
- capture context and actor;
- approval posture of the source collection;
- rights, confidentiality, and expiry when applicable;
- extraction status and failures.

The approval posture distinguishes a migrated approved library from unreviewed evidence. It supplies an explicit intake default; it does not make every extracted assertion approved.

## Entity proposal batch

Created by normalization, inference, import, or a human authoring workflow. Contains proposed entities and relationships plus review exceptions.

Required content:

- source evidence manifests;
- candidate entities using the brand-world schema;
- candidate relationships;
- duplicate and contradiction findings;
- confidence for inferred assertions;
- suggested scope and governance metadata;
- fields requiring human resolution;
- normalization and inference method versions.

The batch is proposal-only. Acceptance routes each governable item through a governance event.

## Governance event

Records an attributable state transition.

```yaml
contract_type: governance_event
subject:
  entity_id: asset_package_front
  from_version: 2
  to_version: 3
action: canonical_revision
decision: approved
authority:
  required_role: brand_owner
  actor_id: owner_01
rationale: Updated legal panel and barcode; front geometry unchanged.
supersedes: asset_package_front@2
```

Allowed actions initially include:

- approve;
- reject;
- deprecate;
- supersede;
- promote_to_canonical;
- revise_canonical;
- remove_from_canon.

The service validates actor authority and schema invariants before committing the event.

## Production request

Defines the job before policy compilation.

Required content:

- objective and requested deliverables;
- selected or requested production mode;
- brand, product, audience, channel, format, geography, and campaign scope as applicable;
- requested changes and explicit non-changes;
- provided references and assets;
- deadlines or service constraints;
- intended approval route;
- human clarifications and unresolved questions.

The request does not carry resolved brand rules. Those come from the context manifest and policy snapshot.

## Context manifest

Records the exact brand-brain material selected for a job and why.

Required content:

- production request reference;
- entity and relationship version references;
- selection reason for every item;
- scope match and precedence information;
- excluded conflicting or lower-priority material;
- unresolved retrieval warnings;
- retrieval method and version.

The context manifest allows a reviewer to distinguish “the rule did not exist” from “the rule existed but retrieval missed it.”

## Policy snapshot

The immutable execution contract compiled for one job.

```yaml
contract_type: policy_snapshot
request_id: request_042
mode: hybrid
context_manifest_id: context_042
decisions:
  required:
    - entity: asset_package_front@3
      handling: compose_exact
  permitted:
    - capability: generate_scene
      scope: environment_and_casting
  conditional:
    - rule: adult_cast_only
      condition: paid_social
  prohibited:
    - rule: no_floating_package@1
locked_elements:
  - entity: asset_package_front@3
    integrity_check: pixel_and_geometry
flexible_elements:
  - concept: environment
  - concept: lighting
allowed_capabilities:
  - generate_scene
  - compose_exact_asset
  - resize_with_safe_area
evaluation_plan:
  - evaluator: locked_element_drift
    kind: deterministic
    blocking: true
  - evaluator: request_fit
    kind: judgment
    weight: 0.30
approval_route: workflow_approver
```

Every decision includes its originating rule, scope, and rationale in the full contract. Explicit job overrides record who authorized them. Overrides cannot bypass system invariants or canonical rules without the authority required to change those rules.

## Execution plan

Created after preflight. Describes an ordered or dependency-linked set of resumable steps.

Required content:

- policy snapshot reference;
- step identifiers and dependencies;
- required capability for each step;
- pinned inputs and expected outputs;
- retry and fallback policy;
- determinism or judgment classification;
- cache and idempotency key where supported;
- approval gates;
- estimated cost class when available.

A plan targets capabilities, not named providers. Provider selection is recorded when a step begins.

## Step result

Records one execution attempt.

Required content:

- execution plan and step reference;
- attempt number and status;
- provider, model, tool, and version;
- exact input references and parameter digest;
- output artifact references;
- start and end time;
- usage and cost;
- failure classification and recovery action;
- substitution from the preferred provider, if any.

Sensitive prompt or provider payload storage may be redacted by tenant policy, but the record must retain enough information to explain the operation.

## Artifact manifest

Identifies a produced or composed artifact and how it was made.

Required content:

- source job and step results;
- asset URI, media type, checksum, dimensions, and rendition information;
- composition lineage for locked assets;
- generated regions or layers when the medium supports them;
- embedded claims, logos, products, or templates;
- technical validation results;
- rights and usage scope;
- lifecycle if the artifact enters a reusable library.

The composition lineage must state whether each locked element was copied, transformed deterministically, or regenerated. Regeneration of a locked element requires a blocking policy exception.

## Evaluation record

Stores findings against the policy snapshot and request.

Required content:

- artifact and policy snapshot references;
- evaluator type, version, and inputs;
- deterministic findings before judgment findings;
- result per requirement or criterion;
- evidence supporting each failure;
- pass, fail, or needs-human-review outcome;
- blocking and non-blocking distinction;
- evaluator uncertainty where relevant.

Model-based evaluation reports uncertainty and rationale; it does not borrow the schema's epistemic-confidence field for generated artifacts.

## Revision request

Describes a targeted change while protecting everything else.

Required content:

- source artifact and evaluation references;
- requested changes;
- protected non-changes;
- reason and actor;
- policy snapshot reference;
- whether recompilation is required;
- affected execution steps.

If scope or policy changes, the system compiles a new policy snapshot. A cosmetic correction that does not affect policy may reuse the existing snapshot and branch the execution plan.

## Approval event

Records a human decision about an output or guidance proposal.

Required content:

- subject and exact version;
- decision and rationale;
- actor and verified authority;
- approval scope;
- related evaluations and exceptions;
- downstream action.

Output approval, guidance approval, and canonical promotion use distinct actions. The interface and API must not collapse them into one generic approval.

## Memory proposal

Created from corrections, repeated preferences, failures, or successful precedents.

Required content:

- supporting jobs, outputs, evaluations, or corrections;
- proposed entity, relationship, validator, or workflow change;
- epistemic origin and conditional confidence;
- proposed scope;
- contradiction check against approved and canonical material;
- required reviewer and promotion path.

Memory proposals never mutate the brand repository directly.

## Contract invariants

1. Every production artifact resolves to one production request and policy snapshot.
2. Every job uses exact entity versions, not “latest” pointers after execution begins.
3. Every policy decision resolves to a rule, invariant, mode default, or authorized override.
4. Every locked asset has a composition lineage and integrity check.
5. Every blocking evaluation finding prevents workflow approval unless an authorized exception is recorded.
6. Every revision states protected non-changes.
7. Every governance and approval event identifies the authority exercised.
8. No memory proposal changes canon without a separate governance event.

## Fixture requirements

PWP and Riggg fixtures should each provide representative examples of every contract used by their workflow. The hybrid control test must reuse a common request family and brand-brain snapshot while producing distinct policy snapshots, execution plans, and evaluation order.

These fixtures should settle optional fields, enum values, error formats, and contract versioning before public APIs are designed.
