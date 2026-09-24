# Mossbound design

This folder is the home for Mossbound's design source files. The app itself (`index.html`) inlines copies of these vectors, so treat the files here as the originals and update them first when a design changes.

## Terrain bands

Each file is one tile of a terrain band: the band's background color plus the objects scattered on it. The bands are listed from lowest to highest, as in `BAND_STYLES` in `index.html`.

| Band | File | Background | In the app | What's on it |
|---|---|---|---|---|
| Water | [water.svg](assets/terrain/water.svg) | `#92D1BC` | `#8FCDB9` | white wave crests |
| Shore | [shore.svg](assets/terrain/shore.svg) | `#95B063` | `#95B063` | bushes, a round tree, grass tufts |
| Fields | [fields.svg](assets/terrain/fields.svg) | `#7FAC63` | `#7FAC63` | bushes and round trees |
| Hills | [hills.svg](assets/terrain/hills.svg) | `#5B8757` | `#5B8757` | pine trees, bushes, round trees |
| Mountains | [mountains.svg](assets/terrain/mountains.svg) | `#6E918B` | `#6F928C` | shadow ridges (`#435665` fading out) |
| Snow | none yet | | `#AEC4C1` | |

## Known differences

- **Water and Mountains** use slightly different background colors in the app than in these files. Decide which is right and update the other.
- **Shore** reuses the Fields shapes in shore colors and adds grass tufts.
- **Snow** has a color in the app but no design file.
