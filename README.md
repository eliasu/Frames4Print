# Frames4Print

A Figma plugin for creating print-ready frames with correct pixel dimensions.

---

## What it does

You pick a paper format (A1–A6) or enter a custom size in millimeters. The plugin calculates pixel dimensions that map cleanly to that physical size at a given resolution — no rounding errors, no fractional pixels. Optionally adds bleed with Figma guides placed at exact inset positions.

**Key features:**
- A1–A6 presets + custom mm input
- Shows multiple resolution options (all with perfect integer pixel ratios)
- Filters to 300 PPI minimum by default (print standard)
- Optional bleed: adds mm on each side and places Figma guides at the trim line
- Frame is named with its physical dimensions for easy identification

---

## Why this matters

Figma works in pixels. Print works in millimeters. The conversion between them is not always clean.

If you just multiply millimeters by a rough number (e.g. `210mm × 11.811 = 2480.01px`), you get fractional pixels. Figma rounds these, which means your frame dimensions no longer correspond exactly to the physical size. At 300 PPI, a 1px error across 210mm is small — but it compounds: guides sit in the wrong place, bleeds don't align, and exported files handed to a print shop may produce unexpected results.

This plugin finds multipliers where the math works out to whole numbers for both dimensions simultaneously — so the frame you design in is exactly the sheet the printer sees.

---

## Setup

```bash
npm install
npm run watch   # compiles code.ts → code.js on save
```

In Figma: **Plugins → Development → Import plugin from manifest** → select `manifest.json`.

> `code.js` is already compiled and committed, so you can load the plugin without a build step if you're not editing `code.ts`.
