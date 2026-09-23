# figma--i18n-sync

Figma plugin that creates one translated copy of a frame per language. Texts come from the translations API.

## Using the plugin

1. Select one or more frames
2. For every text layer, pick where its translation comes from:
   - **sheet**: a row of a campaign sheet. Set _Sheet year_ and _Sheet tab_ once per frame, then the row number per text. _Number rows ↓_ fills consecutive rows
   - **category_titles, templates, header, footer, category_links**: a static dictionary entry, looked up by key
3. Set the delimiter and the name suffix (`%date%` is replaced with the date in the footer), and pick the languages (globe button)
4. Click **Generate translated frames**

Copies are named `{language}{delimiter}{suffix}`, e.g. `pl_20260923_deal`, and are stacked below the source frame. Generating again updates existing copies in place, renames them when the suffix or date changes, and skips copies that are already up to date. The result panel lists missing translations and other warnings.

Settings are saved in the file with each frame, as you edit.

### Shrink text to fit

When enabled, translated texts that are wider than their container get a smaller font size. Texts that had the same style in the source (font, weight, size) keep the same size in each copy, so repeated elements such as prices in a row stay consistent. _Same font size across frames of one language_ extends this to all selected frames.

## Development

Requirements: [Bun](https://bun.sh) and the Figma desktop app.

```bash
bun install
bun run dev
bun run typecheck
bun run build # production build
```

In Figma: `Ctrl + K` → **Import plugin from manifest…** → select `dist/manifest.json`.

The API address is set in `src/main/constants.ts`.
