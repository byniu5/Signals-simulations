# Signals simulations

Interactive, single-file simulations for learning radio and signal-processing concepts.

Open `index.html` – the hub page – to browse them. It works straight from disk or when deployed
(Netlify via `netlify.toml`, or GitHub Pages via `.github/workflows/pages.yml`).

## Adding a simulation

1. Create a folder with an `index.html` (link back with `<a href="../index.html">`).
2. Add an entry to the `SIMULATIONS` routing table near the top of the script in the root `index.html`.

| Simulation | Folder |
| --- | --- |
| Beam steering with a 4-element phased array | `beam forming/` |
