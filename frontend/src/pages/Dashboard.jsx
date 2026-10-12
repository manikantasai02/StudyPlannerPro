import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { BarChart2, CheckCircle, Clock, Flame, TrendingUp, AlertTriangle, BookOpen, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from './Dashboard.module.css';
import { format, parseISO } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className={`card ${styles.statCard}`}>
      <div className={styles.statIcon} style={{ background: color + '20', color }}>
        <Icon size={20} />
      </div>
      <div>
        <p className={styles.statValue}>{value}</p>
        <p className={styles.statLabel}>{label}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

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
  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="anim-fadeUp">
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.greeting}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-muted">Here's your study overview for today</p>
        </div>
        <div className={styles.streakBadge}>
          <Flame size={18} color="#f97316" />
          <span>{streak} day streak</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard icon={BookOpen}    label="Total Tasks"      value={o.totalTasks}       color="#4a9b5c" />
        <StatCard icon={CheckCircle} label="Completed"        value={o.completedTasks}   sub={`${o.completionRate}% rate`} color="#16a34a" />
        <StatCard icon={Clock}       label="Today's Study"    value={`${o.today.minutesStudied}m`} sub={`${o.today.focusSessions} focus sessions`} color="#7c3aed" />
        <StatCard icon={AlertTriangle} label="High Priority" value={o.highPriority}     sub="pending tasks" color="#dc2626" />
      </div>

      {/* Weekly Progress + Chart */}
      <div className={styles.midRow}>
        {/* Weekly Goal */}
        <div className={`card ${styles.goalCard}`}>
          <div className="flex-between" style={{ marginBottom: 12 }}>
            <div className="flex gap-2">
              <Target size={18} color="var(--green-main)" />
              <span style={{ fontWeight: 700 }}>Weekly Goal</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
              {o.week.minutesStudied}m / {o.week.goalMinutes}m
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${o.week.progress}%` }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 8 }}>
            {o.week.progress >= 100 ? '🎉 Goal reached!' : `${o.week.goalMinutes - o.week.minutesStudied}m remaining this week`}
          </p>
          <div className={styles.weekStats}>
            <div><span>{o.week.tasksCompleted}</span><p>tasks done</p></div>
            <div><span>{o.today.subjects.length || '—'}</span><p>subjects today</p></div>
            <div><span>{o.totalFocusSessions}</span><p>total sessions</p></div>
          </div>
        </div>

        {/* Bar chart */}
        <div className={`card ${styles.chartCard}`}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div className="flex gap-2">
              <BarChart2 size={18} color="var(--green-main)" />
              <span style={{ fontWeight: 700 }}>Study Minutes — Last 7 Days</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekly} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-light)' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid var(--cream-border)', borderRadius: 10, fontSize: 13 }}
                formatter={(v) => [`${v} minutes`, 'Studied']}
              />
              <Bar dataKey="minutesStudied" radius={[6, 6, 0, 0]}>
                {weekly.map((_, i) => (
                  <Cell key={i} fill={i === weekly.length - 1 ? 'var(--green-main)' : 'var(--green-muted)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className={styles.bottomRow}>
        {/* Upcoming deadlines */}
        <div className={`card ${styles.deadlinesCard}`}>
          <div className="flex gap-2" style={{ marginBottom: 16 }}>
            <AlertTriangle size={18} color="#d97706" />
            <span style={{ fontWeight: 700 }}>Upcoming Deadlines</span>
          </div>
          {o.upcomingDeadlines.length === 0 ? (
            <p className="text-muted">No deadlines in the next 7 days 🎉</p>
          ) : (
            <div className={styles.deadlineList}>
              {o.upcomingDeadlines.map(t => {
                const daysLeft = Math.ceil((new Date(t.deadline) - new Date()) / 86400000);
                return (
                  <div key={t.id} className={styles.deadlineItem}>
                    <div>
                      <p className={styles.deadlineSubject}>{t.subject}</p>
                      <p className={styles.deadlineTopic}>{t.topic}</p>
                    </div>
                    <span className={`badge ${daysLeft <= 1 ? 'badge-high' : daysLeft <= 3 ? 'badge-medium' : 'badge-low'}`}>
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subject breakdown */}
        <div className={`card ${styles.subjectsCard}`}>
          <div className="flex gap-2" style={{ marginBottom: 16 }}>
            <TrendingUp size={18} color="var(--green-main)" />
            <span style={{ fontWeight: 700 }}>Subject Progress</span>
          </div>
          {o.subjectBreakdown.length === 0 ? (
            <p className="text-muted">Add tasks to see subject breakdown</p>
          ) : (
            <div className={styles.subjectList}>
              {o.subjectBreakdown.slice(0, 5).map(s => {
                const pct = s.total ? Math.round((s.completed / s.total) * 100) : 0;
                return (
                  <div key={s.subject} className={styles.subjectItem}>
                    <div className="flex-between" style={{ marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{s.subject}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{s.completed}/{s.total}</span>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
