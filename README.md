# Windows 11 – Basic Calculator (Web)

A web-based single-page calculator that replicates **Windows 11 Calculator – Standard (Basic) Mode**.

## Features
- Number input: `0–9`, decimal `.`
- Operators: `+  −  ×  ÷`
- Functions: `%` (percent), `√` (square root), `±` (negate), `CE`, `C`, `←` (backspace)
- Operator precedence (e.g., `2 + 3 × 4 = 14`)
- Expression history (top line) and current display (large line)
- Keyboard support: digits, `.`, `+ - * /`, `%`, `Enter`, `Backspace`, `Esc` (C), `Delete` (CE), `r` (√), `n` (±)
- Responsive, modern UI approximating Windows 11

## Assumptions
- **Percent**:
  - `a + b%` or `a − b%` ⇒ `a ± a*b/100`
  - `a × b%` or `a ÷ b%` ⇒ `a × (b/100)` or `a ÷ (b/100)`
  - Single `x %` ⇒ `x/100`
- `√` of a negative ⇒ `Error`.
- Results formatted to **12 significant digits**.

## Run Locally
Open `index.html` in a modern browser.

## Deploy
Any static host works.

### GitHub Pages
1. Push files to a repo.
2. Settings → **Pages** → Deploy from **main** branch (root).

### Netlify
Drag-and-drop the folder at https://app.netlify.com/drop.

### Vercel
Import the repo; no build step needed.
