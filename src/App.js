import { useState, useEffect } from "react";

const STORAGE_KEY = "habitboard_v1";
const TODAY = new Date().toDateString();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.date !== TODAY) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = s.date === yesterday.toDateString();
        const streaks = {};
        (s.habits || []).forEach(h => {
          if (wasYesterday && s.done[h.id]) {
            streaks[h.id] = s.streaks[h.id] || 0;
          } else {
            streaks[h.id] = wasYesterday ? (s.streaks[h.id] || 0) : 0;
          }
        });
        return { ...s, date: TODAY, done: {}, streaks, lastCompleted: s.lastCompleted || {} };
      }
      return s;
    }
  } catch(e) {}
  return { date: TODAY, habits: [], done: {}, streaks: {}, lastCompleted: {}, cleanSince: null };
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000);
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #080808;
  color: #e8e4dc;
  font-family: 'Syne', sans-serif;
  min-height: 100vh;
}

.app {
  max-width: 500px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 5rem;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}
.logo {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #555;
}
.date-label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444;
  letter-spacing: 0.06em;
}

.hero { margin-bottom: 2rem; }
.hero-count {
  font-size: 80px;
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: #e8e4dc;
}
.hero-count .denom { color: #2a2a2a; }
.hero-label {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 0.5rem;
}

.progress-line {
  width: 100%;
  height: 1px;
  background: #1e1e1e;
  margin: 1.5rem 0 2rem;
  position: relative;
}
.progress-fill {
  height: 1px;
  background: #e8e4dc;
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
  position: absolute;
  top: 0; left: 0;
}

.clean-card {
  border: 1px solid #1e1e1e;
  border-radius: 10px;
  padding: 18px 20px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.clean-card:hover { border-color: #2e2e2e; }
.clean-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 6px;
}
.clean-days {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #e8e4dc;
  line-height: 1;
}
.clean-sub {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #555;
  letter-spacing: 0.06em;
  margin-top: 4px;
}
.clean-since {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333;
  margin-top: 5px;
  letter-spacing: 0.04em;
}
.clean-action {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid #222;
  border-radius: 4px;
  padding: 6px 10px;
  transition: color 0.2s, border-color 0.2s;
  white-space: nowrap;
}
.clean-card:hover .clean-action { color: #666; border-color: #333; }

.section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #444;
  margin-bottom: 0.5rem;
}

.missions { display: flex; flex-direction: column; }

.mission {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid #141414;
  transition: opacity 0.25s;
}
.mission:first-of-type { border-top: 1px solid #141414; }
.mission.done { opacity: 0.3; }

.check-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid #2a2a2a;
  background: transparent;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, background 0.2s;
  -webkit-appearance: none;
}
.check-btn:hover { border-color: #555; }
.mission.done .check-btn { background: #1a1a1a; border-color: #333; }
.checkmark { display: none; }
.mission.done .checkmark { display: block; }

.mission-body { flex: 1; min-width: 0; cursor: pointer; }
.mission-name {
  font-size: 15px;
  font-weight: 700;
  color: #c8c4bc;
  transition: color 0.2s;
}
.mission:not(.done):hover .mission-name { color: #fff; }
.mission.done .mission-name { text-decoration: line-through; color: #444; }
.mission-meta {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444;
  margin-top: 2px;
  letter-spacing: 0.05em;
}

.streak-pill {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #5a4a1a;
  background: #100e04;
  border: 1px solid #1e1a08;
  border-radius: 4px;
  padding: 3px 8px;
  white-space: nowrap;
  flex-shrink: 0;
}
.streak-num { color: #c8a040; }

.delete-btn {
  background: transparent;
  border: none;
  color: #2a2a2a;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
  flex-shrink: 0;
  -webkit-appearance: none;
}
.delete-btn:hover { color: #666; }

.empty-state {
  padding: 2.5rem 0;
  text-align: center;
  border-top: 1px solid #141414;
  border-bottom: 1px solid #141414;
}
.empty-title { font-size: 14px; color: #555; margin-bottom: 0.4rem; }
.empty-sub {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #3a3a3a;
  letter-spacing: 0.06em;
}

.add-section { margin-top: 2rem; }
.add-form { display: flex; flex-direction: column; gap: 8px; margin-top: 0.75rem; }
.add-row { display: flex; gap: 8px; }

.add-input {
  flex: 1;
  background: #0f0f0f;
  border: 1px solid #222;
  border-radius: 6px;
  padding: 10px 12px;
  color: #e8e4dc;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  -webkit-appearance: none;
}
.add-input::placeholder { color: #333; }
.add-input:focus { border-color: #3a3a3a; }

.add-meta-input {
  background: #0f0f0f;
  border: 1px solid #222;
  border-radius: 6px;
  padding: 10px 12px;
  color: #888;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.05em;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  -webkit-appearance: none;
}
.add-meta-input::placeholder { color: #2a2a2a; }
.add-meta-input:focus { border-color: #3a3a3a; }

.add-btn {
  background: #e8e4dc;
  border: none;
  border-radius: 6px;
  padding: 10px 18px;
  color: #080808;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  -webkit-appearance: none;
}
.add-btn:hover { opacity: 0.85; }
.add-btn:disabled { opacity: 0.15; cursor: default; }

.all-done {
  margin-top: 2rem;
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #3a3a3a;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.reset-btn {
  display: block;
  width: 100%;
  margin-top: 2.5rem;
  padding: 12px;
  background: transparent;
  border: 1px solid #1a1a1a;
  border-radius: 6px;
  color: #333;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
  -webkit-appearance: none;
}
.reset-btn:hover { border-color: #333; color: #666; }
`;

export default function App() {
  const [state, setState] = useState(loadState);
  const [newName, setNewName] = useState("");
  const [newMeta, setNewMeta] = useState("");

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
  }, [state]);

  function toggle(id) {
    setState(prev => {
      const nowDone = !prev.done[id];
      const done = { ...prev.done, [id]: nowDone };
      const streaks = { ...prev.streaks };
      const lastCompleted = { ...(prev.lastCompleted || {}) };
      if (nowDone && lastCompleted[id] !== TODAY) {
        streaks[id] = (streaks[id] || 0) + 1;
        lastCompleted[id] = TODAY;
      }
      return { ...prev, done, streaks, lastCompleted };
    });
  }

  function addHabit() {
    const name = newName.trim();
    if (!name) return;
    const habit = { id: genId(), name, meta: newMeta.trim() };
    setState(prev => ({ ...prev, habits: [...prev.habits, habit] }));
    setNewName("");
    setNewMeta("");
  }

  function deleteHabit(id) {
    setState(prev => {
      const habits = prev.habits.filter(h => h.id !== id);
      const done = { ...prev.done };
      const streaks = { ...prev.streaks };
      delete done[id];
      delete streaks[id];
      return { ...prev, habits, done, streaks };
    });
  }

  function resetClean() {
    setState(prev => ({ ...prev, cleanSince: new Date().toISOString() }));
  }

  function resetDay() {
    setState(prev => ({ ...prev, date: TODAY, done: {} }));
  }

  const { habits, done, streaks, cleanSince } = state;
  const doneCount = habits.filter(h => done[h.id]).length;
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;
  const cleanDays = daysSince(cleanSince);
  const dateStr = new Date().toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short"
  }).toUpperCase();

  return (
    <div className="app">
      <div className="topbar">
        <div className="logo">Habit Board</div>
        <div className="date-label">{dateStr}</div>
      </div>

      <div className="hero">
        <div className="hero-count">
          {doneCount}<span className="denom">/{habits.length}</span>
        </div>
        <div className="hero-label">missions complete</div>
      </div>

      <div className="progress-line">
        <div className="progress-fill" style={{ width: pct + "%" }} />
      </div>

      <div className="clean-card" onClick={resetClean}>
        <div>
          <div className="clean-label">Clean streak</div>
          <div className="clean-days">{cleanDays}</div>
          <div className="clean-sub">days clean</div>
          {cleanSince && (
            <div className="clean-since">
              since {new Date(cleanSince).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </div>
          )}
        </div>
        <div className="clean-action">tap to reset</div>
      </div>

      <div className="section-label">Today</div>

      <div className="missions">
        {habits.length === 0 && (
          <div className="empty-state">
            <div className="empty-title">No habits yet</div>
            <div className="empty-sub">add your first one below</div>
          </div>
        )}
        {habits.map(h => {
          const isDone = !!done[h.id];
          const streak = streaks[h.id] || 0;
          return (
            <div key={h.id} className={`mission${isDone ? " done" : ""}`}>
              <button className="check-btn" onClick={() => toggle(h.id)}>
                <svg className="checkmark" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="#e8e4dc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="mission-body" onClick={() => toggle(h.id)}>
                <div className="mission-name">{h.name}</div>
                {h.meta && <div className="mission-meta">{h.meta}</div>}
              </div>
              {streak > 0 && (
                <div className="streak-pill">
                  <span className="streak-num">{streak}</span>d
                </div>
              )}
              <button className="delete-btn" onClick={() => deleteHabit(h.id)}>×</button>
            </div>
          );
        })}
      </div>

      {habits.length > 0 && doneCount === habits.length && (
        <div className="all-done">— all clear —</div>
      )}

      <div className="add-section">
        <div className="section-label">Add habit</div>
        <div className="add-form">
          <div className="add-row">
            <input
              className="add-input"
              placeholder="Habit name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addHabit()}
            />
            <button className="add-btn" onClick={addHabit} disabled={!newName.trim()}>Add</button>
          </div>
          <input
            className="add-meta-input"
            placeholder="Note (optional) — e.g. 20 minutes"
            value={newMeta}
            onChange={e => setNewMeta(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addHabit()}
          />
        </div>
      </div>

      <button className="reset-btn" onClick={resetDay}>reset today</button>
    </div>
  );
}