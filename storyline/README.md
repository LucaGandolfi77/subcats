# CourseWeaver Studio

CourseWeaver Studio is a production-minded foundation for an interactive e-learning authoring platform. It is original in product design and implementation, but aimed at the same class of problems as modern slide-based course builders: scenes, slides, layers, states, triggers, variables, assessments, media, runtime preview, and portable publishing.

## Architectural Decision

CourseWeaver uses a web-first TypeScript monorepo instead of starting with Electron or Tauri.

That is the strongest MVP choice for this product because it optimizes the highest-risk engineering surfaces first:

- rich visual editing with a fast React and Vite feedback loop
- typed shared models across authoring, runtime, persistence, and export
- browser-portable authoring with local JSON project files
- a deterministic Node-based export pipeline that can evolve independently of the editor UI
- a clean path to a future desktop wrapper without rewriting the core platform

In practice this means the authoring experience can stay browser-native today, while the runtime engine, project format, exporter, and shared domain packages remain reusable if the team later ships a desktop shell with native menus, installers, or offline packaging.

## Technology Stack

### Why this stack

| Concern | Choice | Why it fits |
| --- | --- | --- |
| Language | TypeScript | Shared types across editor, runtime, persistence, exporter, and future AI services reduce drift in a complex authored-document system. |
| Authoring UI | React + Vite | Fast iteration, strong component composition, good ecosystem support, and straightforward integration with a future canvas abstraction. |
| State management | Zustand | Small API surface, predictable editor store logic, good fit for local state-heavy authoring workflows. |
| Domain validation | Zod | Runtime-safe schema validation for project JSON, migrations, and imported content. |
| Runtime player | Shared TypeScript runtime package | Keeps preview and exported playback aligned so authored behavior is executed by the same core logic. |
| Persistence | JSON project document + migration hooks | Human-inspectable, versionable, easy to diff, and portable across local workflows and future cloud sync. |
| Export pipeline | Node-based packaging layer | Deterministic publishing, filesystem access, zip generation, asset rewriting, and future SCORM or xAPI adapters. |
| Testing | Vitest | Fast unit and package-level validation for engine, persistence, and exporter workflows. |

## Product Modules

CourseWeaver is intentionally separated into platform modules with narrow responsibilities.

| Module | Responsibility |
| --- | --- |
| Authoring application | Editor shell, scene and slide management, canvas stage, layer management, object properties, preview entry points, local save and load. |
| Domain package | Typed project document, scenes, slides, layers, objects, triggers, variables, states, media, quizzes, course metadata, publishing settings, theme, player settings, export jobs. |
| Engine package | Trigger execution, variable updates, state changes, slide navigation, deterministic runtime session updates, quiz scoring. |
| Runtime package | Browser runtime player that renders authored slides and executes shared engine behavior. |
| Persistence package | Serialization, parsing, schema validation, migration hooks, snapshots, project creation helpers. |
| Asset pipeline package | Asset manifest generation and referenced asset collection for export packaging. |
| Exporter package | Web package generation, asset source rewriting, manifest creation, archive generation, and future adapter seam for LMS packaging. |
| AI package | Reserved extension point for future agents that generate slides, quiz content, voice scripts, or scenario branches. |

## Repository Structure

```text
storyline/
├── apps/
│   ├── authoring/        # Editor UI
│   └── player/           # Standalone runtime player for exported bundles
├── examples/
│   └── customer-care-foundations.project.json
├── packages/
│   ├── ai/               # AI extension seam
│   ├── asset-pipeline/   # Asset manifest and reference collection
│   ├── domain/           # Typed project model and sample project factory
│   ├── engine/           # Trigger and quiz execution engine
│   ├── exporter/         # Web packaging and zip archive generation
│   ├── persistence/      # JSON parsing, serialization, migrations, snapshots
│   └── runtime/          # Shared runtime player renderer
├── tests/
│   ├── core-engine.spec.ts
│   └── exporter.spec.ts
├── package.json
├── tsconfig.base.json
├── tsconfig.json
└── vitest.config.ts
```

## What Works Today

The current MVP is intentionally narrow, but it is real and runnable.

- create a project, save it as JSON, load it back, and recover autosave state
- add scenes and slides from the authoring workspace
- place text, shapes, buttons, images, tabs, quiz objects, and other authored objects on a slide
- define layers per slide and toggle them via triggers
- define object states and switch them through authored actions
- define variables and gate behavior with conditions
- preview the course in a runtime player driven by the shared engine
- score a multiple-choice quiz interaction
- export a runnable web package with manifest files and a zip archive
- wrap the same exported runtime in an initial SCORM 1.2 package with launch page, API bridge, and imsmanifest.xml
- package local file assets into the export bundle and rewrite exported asset paths

## Project File Format

Projects are stored as versioned JSON documents validated by Zod.

The document includes:

- scenes and slide hierarchy
- slide layers and object placements
- object states and interaction metadata
- triggers, conditions, and actions
- variables and player settings
- course metadata such as language, provider, subject, keywords, and estimated duration
- publishing settings such as SCORM package identifier, mastery score, time limits, and lesson mode defaults
- media assets and export job records
- theme tokens

Migration logic lives in the persistence package so older document versions can be normalized as the schema evolves.

## Example Project

The repository includes a persisted sample project at:

- examples/customer-care-foundations.project.json

That fixture is used to validate:

- JSON schema round-trip behavior
- export manifest generation
- archive creation
- stable sample content for demos and packaging tests

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the authoring app

```bash
npm run dev:authoring
```

### Run the standalone player

```bash
npm run dev:player
```

### Run the test suite

```bash
npm test
```

### Build both applications

```bash
npm run build
```

### Export the sample course as a runnable web package

```bash
npm run export:demo
```

The exported bundle is written to dist/demo-web and a zip archive is created alongside it.

### Export the sample course as a SCORM 1.2 package

```bash
npm run export:demo:scorm
```

The SCORM bundle is written to dist/demo-scorm and a SCORM-ready zip archive is created alongside it.

## Important Scripts

| Command | Purpose |
| --- | --- |
| npm run dev:authoring | Starts the authoring editor in development mode. |
| npm run dev:player | Starts the standalone runtime player in development mode. |
| npm run build:authoring | Builds the authoring app. |
| npm run build:player | Builds the standalone player used for exported packages. |
| npm run build | Builds player and authoring together. |
| npm test | Runs the Vitest suite. |
| npm run export:demo | Builds the player and exports the persisted sample project. |
| npm run export:demo:scorm | Builds the player and exports the persisted sample project as SCORM 1.2. |
| npm run validate | Runs tests, builds both apps, and exports the demo package. |

## Export Flow

The current exporter targets web delivery first.

1. A project JSON document is loaded from disk or provided in memory.
2. The built player is copied into a clean output directory.
3. Asset sources are normalized for export.
4. Local file assets are copied into the bundle and their project paths are rewritten.
5. The exporter writes:
	- course.json
	- manifest.json
	- course-assets.json
6. The SCORM adapter can optionally layer on:
	- imsmanifest.xml
	- scorm-launch.html
	- scorm-api-adapter.js
7. The full bundle is archived into a zip file for transport or upload.

This is the intended seam for future publishing adapters.

## Future Publishing Architecture

The exporter is designed so additional adapters can be added without changing the editor or the runtime session engine.

Planned publishing directions:

- web package, already implemented
- SCORM 1.2 adapter, implemented as a packaging layer around the same web runtime
- xAPI adapter with statement emitters and completion hooks
- LMS metadata and completion rules layer
- asset optimization and transcoding pipeline

The current SCORM adapter is intentionally narrow: it packages the course with a valid SCORM 1.2 manifest, a launch shell, and a lightweight LMS API bridge. Richer completion, suspend data, score reporting, and xAPI event emission remain follow-up work.

## AI Extension Direction

The AI package is intentionally small today. It exists as an integration boundary, not as a speculative feature dump.

The planned use cases are:

- draft quiz generation from slide goals
- branching scenario suggestions
- narration and voice script drafting
- summary generation for slide notes or transcripts
- interaction recommendations based on learning objectives

The important architectural rule is that AI suggestions should produce or modify normal project documents and authored entities, not a parallel hidden format.

## Engineering Notes

- The editor stays browser-portable by exporting clean project JSON in the client.
- The heavy publish workflow stays in the Node exporter where filesystem access and packaging are deterministic.
- Runtime playback and preview share the same core execution logic to reduce authoring versus export drift.
- The sample project fixture is persisted on disk so export behavior is testable without relying only on generated data.

## Roadmap

### Phase 1: Authoring foundation

- strengthen canvas tooling with resize handles, snapping, alignment, and keyboard nudging
- improve scene tree management and drag reorder operations
- add richer media placement and caption timeline editing

### Phase 2: Interaction depth

- expand reusable interaction editors for accordion, slider, marker, drag-and-drop, and branching scenario objects
- add slide-level triggers and timeline events in the authoring UI
- improve state authoring and conditional authoring ergonomics

### Phase 3: Publishing adapters

- add SCORM packaging
- add xAPI event emitters
- add course metadata, completion rules, and reporting hooks

### Phase 4: Platform hardening

- project import validation and repair flows
- autosave history and restore points
- larger runtime test coverage and visual regression checks
- optional desktop wrapper for native distribution

## Validation Status

The repository includes focused tests for:

- engine trigger behavior
- variable-driven navigation
- quiz scoring
- persistence round-trips and snapshots
- sample project fixture parsing
- exporter output cleaning, packaging, and archive generation
- SCORM manifest, launch wrapper, and archive generation
- local asset rewriting during export