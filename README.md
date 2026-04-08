# 📅 Wall Calendar — Interactive React Component

A polished, feature-rich wall calendar component built in React. Inspired by the physical wall calendar aesthetic, it combines beautiful photography, fluid interactions, and a functional notes system.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Wall Calendar Aesthetic** | Hero photograph panel (changes per month via Unsplash), ring-binding visual detail, page-holes, and paper texture |
| **Day Range Selector** | Click start → click end; visual states for start, end, in-between (hover preview), and today |
| **Integrated Notes** | Per-month notes AND per-selection notes, with tabbed UI and persistent state |
| **Holiday Markers** | US public holidays highlighted with orange dots and a sidebar list |
| **3 Themes** | Warm (default), Cool (blue), Dark mode — toggle with colored circles |
| **Flip Animation** | Month transitions animate like turning a physical page |
| **Responsive** | Desktop: side-by-side hero+grid; Mobile: stacked vertically |
| **Today Button** | Jump back to current month instantly |
| **Toast Notifications** | Subtle confirmation on note save |

---

## 🏗 Architecture

```
WallCalendar.jsx
├── PageHoles          — decorative binding holes at top
├── RingBinding        — metal ring visual at the top edge
├── Hero Panel         — Unsplash photo + month watermark
├── Grid Panel         — day headers + interactive date grid
└── Notes Section      — tabbed textarea + holiday sidebar
```

### State Management
- All state is local React (`useState`) — no external store needed.
- Notes use an in-memory object keyed by `YYYY-M` (month notes) or `YYYY-M-startDay-endDay` (range notes).
- Theme tokens are CSS custom properties injected inline for instant switching.

---

## 🚀 Running Locally

### Option A — Drop into any React project

```bash
# Copy WallCalendar.jsx into your src/components directory
cp WallCalendar.jsx your-project/src/components/

# In your App.jsx:
import WallCalendar from "./components/WallCalendar";
export default function App() { return <WallCalendar />; }
```

### Option B — Vite scaffold

```bash
npm create vite@latest wall-calendar -- --template react
cd wall-calendar
npm install
# Replace src/App.jsx with the WallCalendar import above
npm run dev
```

### Dependencies
- React 18+
- No additional npm packages (fonts loaded via Google Fonts CDN)

---

## 🎨 Design Decisions

1. **Playfair Display + DM Sans pairing** — editorial serif for the month name gives gravitas; clean geometric DM Sans for grid numerals ensures readability at small sizes.

2. **Dynamic palette from hero image** — each month's accent color is derived from its photograph's dominant palette, making the theme feel alive and contextual.

3. **Ring binding + page holes** — subtle skeuomorphic details that nod to the physical wall calendar inspiration without being kitsch.

4. **Hover range preview** — while selecting, moving the cursor shows a live preview of the range that would be selected, dramatically improving UX for multi-day selections.

5. **Tabbed note modes** — separating "month notes" from "selection notes" prevents confusion about what a note is attached to.

---

## 📱 Responsive Breakpoints

| Viewport | Layout |
|---|---|
| ≥ 680px | Hero photo on left (~30%), grid on right |
| < 680px | Photo stacked above grid (max-height 240px) |

---

## 🔮 Possible Extensions

- `localStorage` persistence for notes across sessions
- iCal/Google Calendar export of selected ranges
- Custom event creation (click + type on any day)
- Week numbers in left margin
- Multi-month range selection spanning month boundaries
