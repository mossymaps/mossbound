# Mossbound design

This folder is the home for Mossbound's design source files. The app itself (`index.html`) inlines copies of these vectors, so treat the files here as the originals and update them first when a design changes.

## Terrain bands

Each file is one tile of a terrain band: the band's background color plus the objects scattered on it. The bands are listed from lowest to highest, as in `BAND_STYLES` in `index.html`.

| Band | File | Background | In the app | What's on it |
|---|---|---|---|---|
| Water | [water.svg](assets/terrain/water.svg) | `#92D1BC` | `#92D1BC` | white wave crests |
| Shore | [shore.svg](assets/terrain/shore.svg) | `#95B063` | `#95B063` | bushes, a round tree, grass tufts |
| Fields | [fields.svg](assets/terrain/fields.svg) | `#7FAC63` | `#7FAC63` | bushes and round trees |
| Hills | [hills.svg](assets/terrain/hills.svg) | `#5B8757` | `#5B8757` | pine trees, bushes, round trees |
| Mountains | [mountains.svg](assets/terrain/mountains.svg) | `#6E918B` | `#6E918B` | shadow ridges (`#435665` fading out) |
| Mountains, large | [mountains-large.svg](assets/terrain/mountains-large.svg) | `#6E918B` | `#6E918B` | big mountains, only where a 3×3 block of grid cells is all Mountains |
| Snow | [snow-peak.svg](assets/terrain/snow-peak.svg) | `#6E918B` (drawn on the mountain color) | `#AEC4C1` | a snow-capped peak |

## Known differences

- **Shore** reuses the Fields shapes in shore colors and adds grass tufts.
- **Snow** has no background swatch of its own; the peak file is drawn on the Mountains color.
