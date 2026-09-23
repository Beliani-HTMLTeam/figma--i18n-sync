# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is Bun. Build tooling is [Plugma](https://plugma.dev/docs) (wraps Vite).

- `bun install` — install deps
- `bun run dev` — dev server; rebuilds to `dist/` on save
- `bun run build` — production build to `dist/` (required before publishing; dev build points at dev server)
- `bun run typecheck` — type-checks main and UI projects (both are `noEmit`)
- `bun run release` — Plugma release

No test runner or linter configured.

Load in Figma desktop: Actions menu (`Ctrl/Cmd+K`) → "Import plugin from manifest…" → select `dist/manifest.json`. Edit root `manifest.json`, not the one in `dist/`. Never change the manifest `id`: plugin data (saved configs, clone metadata) is namespaced by it.

## Figma sandbox constraints

The main thread runs in Figma's QuickJS sandbox, not a browser or Node. Code that type-checks and builds can still be rejected at load time:

- Never put `await` in a `for...of` head (`for (x of await f())`). The build turns it into `yield`, and QuickJS fails with `InternalError: stack underflow`. Assign to a variable first.
- No DOM, no `AbortController`; `fetch` and `setTimeout` are available. The main tsconfig uses `lib: ["ES2022"]` without DOM to catch this.
- To verify a bundle, compile `dist/main.js` with `quickjs-emscripten` (`evalCode(code, "x.js", { compileOnly: true })`).
- The UI window size is controlled only by main (`figma.ui.resize`); the UI requests it via `RESIZE_UI` from the corner handle, clamped to `UI_SIZE` and persisted in `clientStorage`.

## Architecture

Figma plugin that clones selected frames once per locale and fills their text nodes with translations fetched from an external sheets API.

- **Main thread** (`src/main/`, entry `main.ts`) — `figma` API access, node manipulation, network fetches.
- **UI iframe** (`src/ui/`, entry `ui.tsx`, React 19) — configuration UI only, no `figma` access. Styles use Figma theme variables (`--figma-color-*`, mapped in `styles/base.css`) so light and dark themes both work.
- **Shared** (`src/shared/`) — types, constants (`TRANSLATION_TYPES`, `ALL_LOCALES`, `UI_SIZE`, sheet year options) and clone naming (`buildLocaleFrameName`). Must stay free of `figma` and DOM APIs.

### Message protocol

Message unions `UIMessage` and `PluginMessage` live in `src/shared/types.ts`, wrapped by `postToUi` (`src/main/frame.ts`) and `postToPlugin` / `usePluginMessages` (`src/ui/lib/messaging.ts`).

- UI → main: `REQUEST_SELECTION_FRAMES`, `RENAME_FRAME`, `SAVE_FRAME_CONFIG` (debounced auto-save of edits), `RESIZE_UI`, `GENERATE_TRANSLATED_FRAMES`. Routed by the typed `handlers` map in `src/main/main.ts`; a message type without a handler is a compile error. Handler errors surface as `figma.notify`.
- main → UI: `POST_SELECTION_FRAMES` (every `selectionchange`, includes `ignoredCount` of non-frame layers), `GENERATION_STATUS` (`running` / `completed` with a `GenerationReport` / `failed` with `error`).

### Translation data (`src/main/api.ts`, `src/main/data.ts`)

Text nodes are collected depth-first (`getTextNodes`). **Rules match text nodes by index**: `config.rules[i]` fills the i-th text node.

- `sheet` → `${API_URL}/dynamic/{sheetYear}/{sheetTab}/{row}`. `rule.range` is a single sheet row; the response `data` maps uppercase locale → one-element array. `sheetYear`/`sheetTab` are per frame.
- other types → `${API_URL}/static/{type}`; `data.slug` is an array of lowercase locales, `data[lookupKey]` (case-insensitive) a parallel array of values.

Locales are normalized to lowercase so sheet and static rules merge into one clone per language. `null` cells mean "missing translation", `undefined` means "keep source text". HTML tags and basic entities are stripped from values. `createApiClient()` is created per generation run: it validates the envelope (`code === 200`, object `data`), times out after `API_TIMEOUT_MS`, and caches requests only within that run, so sheet edits show up on the next Generate.

### Generation (`src/main/generate.ts`)

For each source frame: save config, fetch locale texts, then per selected locale upsert a clone named `{locale}{delimiter}{suffix or frame name}` (`{date}` / `%date%` replaced). Source frames are never moved; new clones are stacked below the source (`stackedPosition`).

- Clones carry `cloneMetaStore` data (`sourceId`, `locale`) and are found by it, so renaming via suffix/date renames existing clones instead of stacking new ones on top. Legacy clones without metadata fall back to name matching.
- A clone whose signature (texts + fit options + `serializeNodeState` of source + `FIT_ALGORITHM_VERSION`) matches is left alone (only renamed if needed). Bump `FIT_ALGORITHM_VERSION` whenever output for the same input changes.
- Generated clones are detected with `isGeneratedClone` and are skipped for generation and config saving; the UI shows them as read-only `CloneCard`s.
- The run returns a `GenerationReport` (created / updated / renamed / up to date + warnings for missing translations, missing fonts and locales unknown to `ALL_LOCALES`), shown in the UI `ResultBanner`.

### Text fitting (`src/main/frame.ts`, `src/main/text.ts`)

- Available width is the nearest width-bounding ancestor (first non-`HUG`, non-`GROUP` container) minus paddings of hugging containers on the way and `2 * fitPadding`. Fixed-width text (`HEIGHT`, `NONE`, `TRUNCATE`) is also limited to its original height.
- Font size is found by binary search between `MIN_FONT_SIZE` and the current size.
- Text nodes are grouped by **original** typography (`getTypographyKey`, read before text is replaced). Each group is synced to its smallest size within a clone, and with `resizeWithinCountryScope` across all frames of one locale (`createFontSizeSync`, bucket `locale::typography`).
- Empty/missing values: `removeEmptyTextNodes` removes the node, or hides it when it sits inside an instance (instance children cannot be removed). Nodes with missing fonts are left unchanged and reported.

### UI state (`src/ui/`)

`useFrameConfigs` keeps configs for every frame seen in the session (switching selection does not discard edits) and auto-saves each edit to the frame's plugin data. `mergeFrameConfig` (`lib/config.ts`) merges defaults ← saved ← in-memory state and migrates legacy saved configs (per-rule `year`/`sheetTab`, `parentName`). The base name for clones is always the frame's current name. Validation is the `configChecks` list returning user-facing messages; Generate is enabled only when there are none. Rule list operations (bulk source change, row auto-numbering) are pure functions in `lib/rules.ts`.

## Agent rules

`AGENTS.md`, `.cursor/rules/`, `.github/copilot-instructions.md` etc. contain only a terse-response style rule (caveman); no project-specific coding conventions.
