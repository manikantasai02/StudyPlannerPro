import { useEffect, useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Play, Pause, RotateCcw, CheckCircle, Timer, Volume2, VolumeX } from 'lucide-react';
import styles from './Focus.module.css';

const PRESETS = [
  { label: '25 min', value: 25, desc: 'Pomodoro' },
  { label: '45 min', value: 45, desc: 'Deep Work' },
  { label: '60 min', value: 60, desc: 'Power Hour' },
  { label: '15 min', value: 15, desc: 'Quick Sprint' },
];

function pad(n) { return String(n).padStart(2, '0'); }

export default function Focus() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [mute, setMute] = useState(false);
  const [sessions, setSessions] = useState([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    api.get('/tasks?completed=false').then(r => setTasks(r.data.tasks));
  }, []);

  const total = minutes * 60;
  const pct = ((total - secondsLeft) / total) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const start = () => {
    if (!selectedTask) return toast.error('Please select a task first');
    setRunning(true);
    setDone(false);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setRunning(false);
          setDone(true);
          handleComplete(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const pause = () => {
    clearInterval(timerRef.current);
    setRunning(false);
  };

  const reset = () => {
    clearInterval(timerRef.current);
    setRunning(false);
    setDone(false);
    setSecondsLeft(minutes * 60);
  };

  const handleComplete = async (auto = false) => {
    const elapsed = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 60000)
      : minutes;
    const actualMin = auto ? minutes : Math.max(1, elapsed);

    try {
      await api.post(`/tasks/${selectedTask.id}/focus-session`, {
        duration: actualMin,
        completedFully: auto,
      });
      const newSession = {
        id: Date.now(),
        taskName: `${selectedTask.subject} — ${selectedTask.topic}`,
        duration: actualMin,
        completedFully: auto,
        at: new Date().toLocaleTimeString(),
      };
      setSessions(s => [newSession, ...s]);
      if (!mute) {
        // Play a simple beep using Web Audio API
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
          osc.start(); osc.stop(ctx.currentTime + 1);
        } catch (_) {}
      }
      toast.success(auto ? `🎉 Session complete! ${actualMin}m logged.` : `✅ ${actualMin}m logged`);
    } catch {
      toast.error('Failed to log session');
    }
  };

  const stopEarly = async () => {
    clearInterval(timerRef.current);
    setRunning(false);
    await handleComplete(false);
    reset();
  };

  const setPreset = (val) => {
    if (running) return;
    setMinutes(val);
    setSecondsLeft(val * 60);
    setDone(false);
  };

  const circumference = 2 * Math.PI * 110;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="anim-fadeUp">
      <div className="page-header">
        <h1>Focus Mode</h1>
        <p className="text-muted">Stay in the zone — Pomodoro-style timer with session tracking</p>
      </div>

      <div className={styles.layout}>
        {/* Left: timer */}
        <div className={styles.timerSection}>
          {/* Presets */}
          <div className={styles.presets}>
            {PRESETS.map(p => (
              <button key={p.value}
                className={`${styles.preset} ${minutes === p.value ? styles.activePreset : ''}`}
                onClick={() => setPreset(p.value)} disabled={running}>
                <span>{p.label}</span>
                <small>{p.desc}</small>
              </button>
            ))}
          </div>

          {/* Task select */}
          <div className={styles.taskSelect}>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-mid)', marginBottom: 6, display: 'block' }}>
              Study Task
            </label>
            <select
              value={selectedTask?.id || ''}
              onChange={e => setSelectedTask(tasks.find(t => t.id === e.target.value) || null)}
              className="form-control" disabled={running}>
              <option value="">— Select a task —</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.subject} — {t.topic} ({t.duration}m)</option>
              ))}
            </select>
          </div>

          {/* Circle timer */}
          <div className={styles.timerCircle}>
            <svg width="260" height="260" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r="110" fill="none" stroke="var(--cream-border)" strokeWidth="12" />
              <circle cx="130" cy="130" r="110" fill="none"
                stroke={done ? 'var(--green-light)' : running ? 'var(--green-main)' : 'var(--green-muted)'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 130 130)"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }}
              />
            </svg>
            <div className={styles.timerDisplay}>
              <span className={styles.timerTime}>{pad(mins)}:{pad(secs)}</span>
              <span className={styles.timerStatus}>
                {done ? '✅ Done!' : running ? '🟢 Focusing…' : 'Ready'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            {!running && !done && (
              <button className="btn btn-primary btn-lg" onClick={start}>
                <Play size={18} /> Start
              </button>
            )}
            {running && (
              <>
                <button className="btn btn-secondary btn-lg" onClick={pause}><Pause size={18} /> Pause</button>
                <button className="btn btn-danger" onClick={stopEarly}><CheckCircle size={16} /> Stop & Log</button>
              </>
            )}
            {done && (
              <button className="btn btn-primary btn-lg" onClick={reset}><RotateCcw size={16} /> New Session</button>
            )}
            <button className="btn-icon" onClick={() => setMute(m => !m)} title={mute ? 'Unmute' : 'Mute'}>
              {mute ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {!running && !done && (
              <button className="btn-icon" onClick={reset} title="Reset"><RotateCcw size={18} /></button>
            )}
          </div>

          {selectedTask && (
            <div className={styles.selectedTaskInfo}>
              <Timer size={14} color="var(--green-main)" />
              <span><strong>{selectedTask.subject}</strong> — {selectedTask.topic}</span>
              <span className={`badge badge-${selectedTask.priority.toLowerCase()}`}>{selectedTask.priority}</span>
            </div>
          )}
        </div>

        {/* Right: session log */}
        <div className={styles.logSection}>
          <div className={`card ${styles.logCard}`}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Session History</h3>
            {sessions.length === 0 ? (
              <div className={styles.emptyLog}>
                <Timer size={32} color="var(--cream-border)" />
                <p>No sessions yet.</p>
                <p className="text-muted" style={{ fontSize: 12 }}>Complete a focus session to see it here.</p>
              </div>
            ) : (
              <div className={styles.logList}>
                {sessions.map(s => (
                  <div key={s.id} className={styles.logItem}>
                    <div className={styles.logDot} style={{ background: s.completedFully ? 'var(--green-main)' : '#d97706' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.taskName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.at} · {s.duration}m {s.completedFully ? '· ✅ Full' : '· ⚡ Partial'}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-dark)' }}>{s.duration}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`card ${styles.tipsCard}`}>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>💡 Focus Tips</h3>
            {[
              'Silence your phone and close social media',
              'Keep water nearby to stay hydrated',
              'One task at a time — avoid multitasking',
              'Take a 5-min break after each session',
              'Stand up and stretch between Pomodoros',
            ].map((tip, i) => (
              <p key={i} style={{ fontSize: 13, color: 'var(--text-mid)', marginBottom: 8, paddingLeft: 8, borderLeft: '2px solid var(--green-muted)' }}>
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
