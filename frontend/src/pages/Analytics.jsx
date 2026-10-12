import { useEffect, useState } from 'react';
import api from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import { BarChart2, Flame, Clock, CheckCircle, Zap } from 'lucide-react';
import styles from './Analytics.module.css';

const COLORS = ['#4a9b5c', '#7ab648', '#2d6a41', '#86c96e', '#c8e6c9', '#a5d6a7'];

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('activity');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/weekly'),
      api.get('/analytics/streak'),
    ]).then(([o, w, s]) => {
      setOverview(o.data.overview);
      setWeekly(w.data.weekly);
      setStreak(s.data.streak);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const o = overview;
  const pieData = o.subjectBreakdown.map((s, i) => ({
    name: s.subject, value: s.total, color: COLORS[i % COLORS.length],
  }));

  const totalWeekMin = weekly.reduce((s, d) => s + d.minutesStudied, 0);
  const avgDaily = weekly.length ? Math.round(totalWeekMin / 7) : 0;

  return (
    <div className="anim-fadeUp">
      <div className="page-header">
        <h1>Analytics</h1>
        <p className="text-muted">Visualize your study patterns and progress</p>
      </div>

      {/* Top KPIs */}
      <div className={styles.kpiRow}>
        {[
          { icon: Clock, label: 'Total Study Time', value: `${Math.floor(o.totalMinutes / 60)}h ${o.totalMinutes % 60}m`, color: '#7c3aed' },
          { icon: CheckCircle, label: 'Tasks Completed', value: o.completedTasks, color: '#16a34a' },
          { icon: Flame, label: 'Current Streak', value: `${streak} days`, color: '#f97316' },
          { icon: Zap, label: 'Focus Sessions', value: o.totalFocusSessions, color: '#0891b2' },
          { icon: BarChart2, label: 'Completion Rate', value: `${o.completionRate}%`, color: '#4a9b5c' },
        ].map(k => (
          <div key={k.label} className={`card ${styles.kpiCard}`}>
            <div className={styles.kpiIcon} style={{ background: k.color + '18', color: k.color }}>
              <k.icon size={18} />
            </div>
            <p className={styles.kpiValue}>{k.value}</p>
            <p className={styles.kpiLabel}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['activity', 'subjects', 'tasks'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.activeTab : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'activity' && (
        <div className={styles.charts}>
          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.chartTitle}>Study Minutes — Last 7 Days</h3>
            <p className="text-muted" style={{ marginBottom: 16 }}>Weekly avg: {avgDaily}m/day · Total: {totalWeekMin}m</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekly} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cream-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--cream-border)', fontSize: 13 }}
                  formatter={(v) => [`${v} min`, 'Studied']} />
                <Bar dataKey="minutesStudied" radius={[6, 6, 0, 0]}>
                  {weekly.map((_, i) => <Cell key={i} fill={i === weekly.length - 1 ? 'var(--green-main)' : 'var(--green-muted)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.chartTitle}>Focus Sessions — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cream-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--cream-border)', fontSize: 13 }}
                  formatter={(v) => [v, 'Sessions']} />
                <Line type="monotone" dataKey="focusSessions" stroke="var(--green-main)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--green-main)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={`card ${styles.chartCard}`}>
            <h3 className={styles.chartTitle}>Tasks Completed Daily</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekly} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--cream-border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--cream-border)', fontSize: 13 }} />
                <Bar dataKey="tasksCompleted" fill="var(--green-light)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'subjects' && (
        <div className={styles.charts}>
          <div className={`card ${styles.chartCard}`} style={{ gridColumn: '1/2' }}>
            <h3 className={styles.chartTitle}>Tasks by Subject</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={`card ${styles.chartCard}`} style={{ gridColumn: '2/3' }}>
            <h3 className={styles.chartTitle}>Subject Completion Rates</h3>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {o.subjectBreakdown.map(s => {
                const pct = s.total ? Math.round((s.completed / s.total) * 100) : 0;
                return (
                  <div key={s.subject}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{s.subject}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-light)' }}>{s.completed}/{s.total} · {s.minutes}m studied</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {o.subjectBreakdown.length === 0 && <p className="text-muted">No data yet</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <div className={`card`} style={{ marginTop: 8 }}>
          <h3 className={styles.chartTitle} style={{ marginBottom: 16 }}>All-time Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Total Tasks Created', value: o.totalTasks },
              { label: 'Completed', value: o.completedTasks },
              { label: 'Pending', value: o.pendingTasks },
              { label: 'High Priority Pending', value: o.highPriority },
              { label: 'Total Study Time', value: `${Math.floor(o.totalMinutes / 60)}h ${o.totalMinutes % 60}m` },
              { label: 'Overall Completion', value: `${o.completionRate}%` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--cream)', borderRadius: 'var(--r-sm)', padding: '16px 18px' }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-dark)' }}>{value}</p>
                <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
