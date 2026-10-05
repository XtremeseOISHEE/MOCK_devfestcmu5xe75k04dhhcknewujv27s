Project rules — follow for every change.

- React + Vite, plain JavaScript. Plain CSS in src/styles.css only.
  No Tailwind, no UI library, no CDN scripts, no extra npm packages.
- The map is hand-drawn SVG. No graph library.
- All state lives in App.jsx and is passed down as props.
- Every user-facing string comes from src/i18n.js with bn and en keys.
  Never hardcode visible text in a component.
  Node labels from the dataset stay as they are — do not translate them.
- Frontend only. No backend, no fetch to any server. No API keys.
- Never hardcode a route or a cost. Everything comes from the algorithm.
- Commit message format:
  <short note of what changed>
  Prompt: "<the exact prompt I gave you>"
- Never force push, rebase, or rewrite history.
