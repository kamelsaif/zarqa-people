# Third-party assets

Zarqa People uses locally hosted assets. Loading the interface does not request fonts or icons from a third-party CDN.

- **IBM Plex Sans Arabic**, weights 400, 500, 600 and 700. Downloaded from Google Fonts on 2026-10-14, served as unmodified WOFF2 subsets. SIL Open Font License; see `fonts/ibmplexsansarabic-OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/ibmplexsansarabic
- **Inter**, weights 400, 500, 600 and 700. Downloaded from Google Fonts on 2026-10-14, served as unmodified WOFF2 subsets. SIL Open Font License; see `fonts/inter-OFL.txt`. Source: https://github.com/google/fonts/tree/main/ofl/inter
- **Lucide icons**, selected source SVGs retrieved on 2026-10-14 from https://github.com/lucide-icons/lucide/tree/main/icons. Source SVGs are retained in `icons/`; the same paths are bundled in `icons.js`. ISC license, with retained contributor notices: `icons/LICENSE`.

The Google Workspace package embeds fonts and icon paths in its self-contained HTML. Its asset licenses are included alongside the project files.
