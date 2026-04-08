import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ──────────────────────────────────────────────────────────────

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Curated Unsplash photos per month (deterministic, no API key needed)
const MONTH_IMAGES = [
  { url: "https://images.unsplash.com/photo-1478719059408-592965723cbc?w=900&q=80", label: "Snowy Peaks", palette: ["#c9d6df","#52616b","#1e2832"] },
  { url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=900&q=80", label: "Winter Bloom", palette: ["#f7e6d3","#d4a5a5","#7a5c61"] },
  { url: "https://images.unsplash.com/photo-1490750967868-88df5691cc5e?w=900&q=80", label: "Spring Blossom", palette: ["#fce4ec","#f48fb1","#880e4f"] },
  { url: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900&q=80", label: "April Meadow", palette: ["#e8f5e9","#66bb6a","#1b5e20"] },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80", label: "Golden Hour", palette: ["#fff8e1","#ffb300","#e65100"] },
  { url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80", label: "Summer Waves", palette: ["#e0f7fa","#00acc1","#006064"] },
  { url: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=900&q=80", label: "Midsummer", palette: ["#fff3e0","#fb8c00","#bf360c"] },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80", label: "Coastal Drift", palette: ["#e3f2fd","#42a5f5","#0d47a1"] },
  { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=80", label: "Harvest Light", palette: ["#fbe9e7","#ff7043","#bf360c"] },
  { url: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=900&q=80", label: "Autumn Forest", palette: ["#efebe9","#a1887f","#4e342e"] },
  { url: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=900&q=80", label: "First Frost", palette: ["#e8eaf6","#7986cb","#283593"] },
  { url: "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=900&q=80", label: "Winter Solstice", palette: ["#e3f2fd","#90caf9","#0d47a1"] },
];

const US_HOLIDAYS_2025 = {
  "1-1":   "New Year's Day",
  "1-20":  "MLK Jr. Day",
  "2-17":  "Presidents' Day",
  "5-26":  "Memorial Day",
  "6-19":  "Juneteenth",
  "7-4":   "Independence Day",
  "9-1":   "Labor Day",
  "11-27": "Thanksgiving",
  "12-25": "Christmas Day",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isInRange(date, start, end) {
  if (!start || !end) return false;
  const [s, e] = start <= end ? [start, end] : [end, start];
  return date > s && date < e;
}
function formatDate(d) {
  if (!d) return "";
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}
function holidayKey(date) {
  return `${date.getMonth() + 1}-${date.getDate()}`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PageHoles() {
  return (
    <div style={{ display: "flex", gap: "clamp(60px, 15vw, 140px)", justifyContent: "center", position: "relative", zIndex: 10, marginBottom: "-14px" }}>
      {[0, 1].map(i => (
        <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg)", border: "3px solid var(--wire)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.3)", position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 10, height: 10, borderRadius: "50%", background: "var(--wire)", opacity: 0.6 }} />
        </div>
      ))}
    </div>
  );
}

function RingBinding() {
  return (
    <div style={{ position: "absolute", top: -6, left: 0, right: 0, height: 12, background: "var(--wire)", borderRadius: "6px 6px 0 0", zIndex: 5, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function WallCalendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [selecting, setSelecting] = useState(false); // true = waiting for end date
  const [notes, setNotes] = useState({});           // key: "YYYY-M-D" or "YYYY-M" => string
  const [noteInput, setNoteInput] = useState("");
  const [noteMode, setNoteMode] = useState("month"); // "month" | "range"
  const [theme, setTheme] = useState("warm");
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState(1);
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const flipRef = useRef(null);

  const monthData = MONTH_IMAGES[viewMonth];
  const palette = monthData.palette;

  // Theme tokens
  const themes = {
    warm: { "--bg": "#fdf8f0", "--surface": "#ffffff", "--text": "#2c2118", "--muted": "#9e8a7a", "--accent": palette[1], "--accent2": palette[2], "--wire": "#8d6e63", "--hover": palette[0] },
    cool: { "--bg": "#f0f4f8", "--surface": "#ffffff", "--text": "#1a2332", "--muted": "#6b7f96", "--accent": "#3b82f6", "--accent2": "#1d4ed8", "--wire": "#64748b", "--hover": "#dbeafe" },
    dark: { "--bg": "#1a1a2e", "--surface": "#16213e", "--text": "#e0e0e0", "--muted": "#8888aa", "--accent": palette[1], "--accent2": palette[0], "--wire": "#444466", "--hover": "#2d2d4e" },
  };
  const cssVars = themes[theme];

  // Sync note input when selection / month changes
  useEffect(() => {
    const key = noteMode === "month"
      ? `${viewYear}-${viewMonth}`
      : rangeStart ? `${viewYear}-${viewMonth}-${rangeStart.getDate()}-${rangeEnd?.getDate() ?? ""}` : "";
    setNoteInput(notes[key] || "");
  }, [noteMode, viewMonth, viewYear, rangeStart, rangeEnd]);

  // Reset img loaded on month change
  useEffect(() => { setImgLoaded(false); }, [viewMonth]);

  // Toast helper
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };

  // Month navigation with flip animation
  const navigate = (dir) => {
    if (flipping) return;
    setFlipDir(dir);
    setFlipping(true);
    setTimeout(() => {
      setViewMonth(prev => {
        let m = prev + dir;
        if (m < 0) { setViewYear(y => y - 1); return 11; }
        if (m > 11) { setViewYear(y => y + 1); return 0; }
        return m;
      });
      setFlipping(false);
    }, 350);
  };

  // Date click handler
  const handleDayClick = (date) => {
    if (!selecting) {
      setRangeStart(date);
      setRangeEnd(null);
      setSelecting(true);
      setShowNotePanel(false);
    } else {
      if (isSameDay(date, rangeStart)) {
        setSelecting(false);
        setRangeEnd(null);
        return;
      }
      const [s, e] = date >= rangeStart ? [rangeStart, date] : [date, rangeStart];
      setRangeStart(s);
      setRangeEnd(e);
      setSelecting(false);
      setNoteMode("range");
      setShowNotePanel(true);
    }
  };

  const saveNote = () => {
    const key = noteMode === "month"
      ? `${viewYear}-${viewMonth}`
      : `${viewYear}-${viewMonth}-${rangeStart?.getDate()}-${rangeEnd?.getDate() ?? ""}`;
    setNotes(n => ({ ...n, [key]: noteInput }));
    showToast("Note saved ✓");
  };

  const clearSelection = () => {
    setRangeStart(null); setRangeEnd(null); setSelecting(false);
    setNoteMode("month"); setShowNotePanel(false);
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDay + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? new Date(viewYear, viewMonth, dayNum) : null;
  });

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "clamp(12px, 3vw, 40px)", fontFamily: "'Playfair Display', Georgia, serif", transition: "background 0.5s", ...cssVars }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { color-scheme: light dark; }
        .cal-day { cursor: pointer; transition: all 0.15s ease; }
        .cal-day:hover { transform: scale(1.08); }
        .cal-day.start, .cal-day.end { color: #fff !important; }
        .flip-enter { animation: flipIn 0.35s ease both; }
        @keyframes flipIn {
          from { opacity: 0; transform: rotateX(${flipDir === 1 ? "-" : ""}25deg) translateY(${flipDir === 1 ? "20px" : "-20px"}); }
          to   { opacity: 1; transform: rotateX(0deg) translateY(0); }
        }
        textarea { resize: vertical; font-family: 'DM Sans', sans-serif; }
        textarea:focus, button:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
        .theme-btn { transition: all 0.2s; }
        .theme-btn:hover { transform: scale(1.15); }
        .toast { animation: toastIn 0.3s ease, toastOut 0.3s ease 1.9s forwards; }
        @keyframes toastIn  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastOut { to   { opacity: 0; transform: translateY(12px); } }
        @media (max-width: 680px) {
          .calendar-layout { flex-direction: column !important; }
          .hero-panel { border-radius: 12px 12px 0 0 !important; min-height: 200px !important; max-height: 240px !important; }
          .grid-panel { border-radius: 0 0 12px 12px !important; }
        }
        .note-panel-slide { animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Calendar Card */}
      <div style={{ width: "100%", maxWidth: 900, position: "relative" }}>

        {/* Holes at top */}
        <PageHoles />

        {/* Main card */}
        <div style={{ background: "var(--surface)", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)", overflow: "hidden", position: "relative" }}>
          <RingBinding />

          {/* Top bar: month nav + theme switcher */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 10px", borderBottom: "1px solid rgba(0,0,0,0.06)", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "var(--muted)", padding: "2px 8px", borderRadius: 6 }} aria-label="Previous month">‹</button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(1.4rem, 4vw, 2rem)", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1 }}>{MONTHS[viewMonth]}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--muted)", fontWeight: 300, letterSpacing: "0.12em" }}>{viewYear}</div>
              </div>
              <button onClick={() => navigate(1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "var(--muted)", padding: "2px 8px", borderRadius: 6 }} aria-label="Next month">›</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Theme switcher */}
              {[["warm","#d4845a"],["cool","#4a9af5"],["dark","#8b8bb8"]].map(([t, c]) => (
                <button key={t} className="theme-btn" onClick={() => setTheme(t)} aria-label={`${t} theme`}
                  style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: theme === t ? "3px solid var(--text)" : "2px solid transparent", cursor: "pointer" }} />
              ))}
              {/* Today button */}
              <button onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, background: "var(--accent)", color: "#fff", border: "none", borderRadius: 20, padding: "5px 14px", cursor: "pointer", letterSpacing: "0.05em" }}>
                TODAY
              </button>
            </div>
          </div>

          {/* Main layout: hero | grid */}
          <div className="calendar-layout" style={{ display: "flex", minHeight: 440 }}>

            {/* ── Hero Panel ── */}
            <div className="hero-panel" style={{ width: "clamp(180px, 32%, 280px)", minWidth: 180, flexShrink: 0, position: "relative", overflow: "hidden", background: palette[2] }}>
              {!imgLoaded && (
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${palette[2]}, ${palette[1]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "rgba(255,255,255,0.9)", animation: "spin 0.8s linear infinite" }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                </div>
              )}
              <img
                src={monthData.url}
                alt={monthData.label}
                onLoad={() => setImgLoaded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: imgLoaded ? "block" : "none", transition: "opacity 0.5s", opacity: imgLoaded ? 1 : 0 }}
              />
              {/* Image overlay label */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 16px 16px", background: "linear-gradient(transparent, rgba(0,0,0,0.55))" }}>
                <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 11, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.15em", textTransform: "uppercase" }}>{monthData.label}</div>
              </div>
              {/* Month number watermark */}
              <div style={{ position: "absolute", top: 12, right: 12, fontSize: "clamp(3rem, 8vw, 5rem)", fontWeight: 900, color: "rgba(255,255,255,0.15)", lineHeight: 1, pointerEvents: "none", fontStyle: "italic" }}>
                {String(viewMonth + 1).padStart(2, "0")}
              </div>
            </div>

            {/* ── Grid Panel ── */}
            <div className="grid-panel" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 20px 20px" }}>

              {/* Range selection status */}
              {(rangeStart || selecting) && (
                <div style={{ marginBottom: 10, padding: "8px 14px", background: "var(--hover)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text)", flexWrap: "wrap", gap: 6 }}>
                  <span>
                    {selecting ? `📍 From ${formatDate(rangeStart)} — click end date` :
                     rangeEnd ? `📅 ${formatDate(rangeStart)} → ${formatDate(rangeEnd)}` :
                     `📍 ${formatDate(rangeStart)} selected`}
                  </span>
                  <button onClick={clearSelection} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14, padding: "0 2px" }}>✕</button>
                </div>
              )}

              {/* Day headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
                {DAYS_SHORT.map(d => (
                  <div key={d} style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 500, color: "var(--muted)", letterSpacing: "0.1em", padding: "4px 0", textTransform: "uppercase" }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div key={`${viewYear}-${viewMonth}`} className="flip-enter" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", flex: 1, gap: "3px 2px" }}>
                {cells.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const isToday = isSameDay(date, today);
                  const isStart = isSameDay(date, rangeStart);
                  const isEnd = rangeEnd && isSameDay(date, rangeEnd);
                  const inRange = isInRange(date, rangeStart, rangeEnd || (selecting ? hoverDate : null));
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const holiday = US_HOLIDAYS_2025[holidayKey(date)];
                  const hasNote = notes[`${viewYear}-${viewMonth}-${date.getDate()}-`] || notes[`${viewYear}-${viewMonth}`];
                  const hk = holidayKey(date);

                  let bg = "transparent";
                  let color = isWeekend ? "var(--accent2)" : "var(--text)";
                  if (inRange) { bg = `${palette[0]}88`; }
                  if (isStart || isEnd) { bg = "var(--accent)"; color = "#fff"; }
                  if (isToday && !isStart && !isEnd) { bg = "var(--hover)"; }

                  return (
                    <div
                      key={i}
                      className={`cal-day${isStart ? " start" : ""}${isEnd ? " end" : ""}`}
                      onClick={() => handleDayClick(date)}
                      onMouseEnter={() => { if (selecting) setHoverDate(date); }}
                      onMouseLeave={() => { if (selecting) setHoverDate(null); }}
                      title={holiday || undefined}
                      style={{
                        position: "relative",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        borderRadius: isStart ? "50% 0 0 50%" : isEnd ? "0 50% 50% 0" : inRange ? 0 : 8,
                        background: bg,
                        color,
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: isToday ? 700 : 400,
                        fontSize: "clamp(11px, 2vw, 14px)",
                        minHeight: "clamp(34px, 7vw, 48px)",
                        userSelect: "none",
                      }}
                    >
                      <span>{date.getDate()}</span>
                      {/* Indicators row */}
                      <div style={{ display: "flex", gap: 2, marginTop: 1 }}>
                        {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: isStart || isEnd ? "#fff" : "var(--accent)" }} />}
                        {holiday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#f97316" }} />}
                        {hasNote && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#8b5cf6" }} />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Holiday legend */}
              <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--muted)", flexWrap: "wrap" }}>
                {[["var(--accent)", "Selected"], ["#f97316", "Holiday"], ["#8b5cf6", "Note"]].map(([c, l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Notes Section ── */}
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "16px 24px 20px", background: theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)" }}>
            {/* Note mode tabs */}
            <div style={{ display: "flex", gap: 0, marginBottom: 12, background: "var(--hover)", borderRadius: 8, padding: 3, width: "fit-content" }}>
              {[["month", `📋 ${MONTHS[viewMonth]} Notes`], ["range", "📌 Selection Notes"]].map(([mode, label]) => (
                <button key={mode} onClick={() => setNoteMode(mode)}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "6px 14px", border: "none", borderRadius: 6, cursor: "pointer", background: noteMode === mode ? "var(--surface)" : "transparent", color: noteMode === mode ? "var(--text)" : "var(--muted)", boxShadow: noteMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Note input + holiday list */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                {noteMode === "range" && !rangeStart && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--muted)", fontStyle: "italic", marginBottom: 8 }}>
                    Select a date range on the calendar to attach a note.
                  </div>
                )}
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder={noteMode === "month" ? `Jot down your ${MONTHS[viewMonth]} plans…` : rangeStart ? `Notes for ${formatDate(rangeStart)}${rangeEnd ? " → " + formatDate(rangeEnd) : ""}…` : "Select a range first…"}
                  disabled={noteMode === "range" && !rangeStart}
                  style={{ width: "100%", minHeight: 80, padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(0,0,0,0.1)", background: "var(--surface)", color: "var(--text)", fontSize: 13, lineHeight: 1.6 }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button onClick={saveNote}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500, padding: "8px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 20, cursor: "pointer", letterSpacing: "0.05em" }}>
                    Save Note
                  </button>
                  {noteInput && (
                    <button onClick={() => setNoteInput("")}
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, padding: "8px 16px", background: "transparent", color: "var(--muted)", border: "1px solid var(--muted)", borderRadius: 20, cursor: "pointer" }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Holidays this month */}
              <div style={{ flex: "1 1 200px" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Holidays this month</div>
                {Object.entries(US_HOLIDAYS_2025)
                  .filter(([k]) => parseInt(k.split("-")[0]) === viewMonth + 1)
                  .length === 0
                  ? <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>No public holidays</div>
                  : Object.entries(US_HOLIDAYS_2025)
                      .filter(([k]) => parseInt(k.split("-")[0]) === viewMonth + 1)
                      .map(([k, name]) => (
                        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--accent2)", minWidth: 24 }}>
                            {k.split("-")[1]}
                          </span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--text)" }}>{name}</span>
                        </div>
                      ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* Paper edge shadow */}
        <div style={{ height: 8, background: "linear-gradient(rgba(0,0,0,0.06), transparent)", borderRadius: "0 0 12px 12px", marginTop: -2 }} />
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "var(--bg)", padding: "10px 24px", borderRadius: 24, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, zIndex: 9999, pointerEvents: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
