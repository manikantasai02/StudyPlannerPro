import { useEffect, useState } from 'react';
import api from '../api';
import { Bell, AlertTriangle, Calendar, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import styles from './Alerts.module.css';

export default function Alerts() {
  const [overview, setOverview] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/analytics/overview'), api.get('/tasks')])
      .then(([o, t]) => { setOverview(o.data.overview); setTasks(t.data.tasks); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const pendingTasks = tasks.filter(t => !t.completed);
  const overdueTasks = pendingTasks.filter(t => t.deadline && t.deadline.split('T')[0] < todayStr);
  const todayTasks = pendingTasks.filter(t => t.deadline && t.deadline.split('T')[0] === todayStr);
  const next3DaysTasks = pendingTasks.filter(t => {
    if (!t.deadline) return false;
    const dl = t.deadline.split('T')[0];
    const in3 = new Date(now); in3.setDate(now.getDate() + 3);
    return dl > todayStr && dl <= in3.toISOString().split('T')[0];
  });
  const highPriorityPending = pendingTasks.filter(t => t.priority === 'High');
  const noDeadlineTasks = pendingTasks.filter(t => !t.deadline);

  const weekGoalPct = overview?.week.progress || 0;
  const weeklyWarning = weekGoalPct < 50 && new Date().getDay() >= 4;

  const AlertSection = ({ icon: Icon, title, color, items, emptyMsg, renderItem }) => (
    <div className={`card ${styles.alertSection}`}>
      <div className={styles.alertHeader} style={{ borderLeftColor: color }}>
        <div className={styles.alertTitle}>
          <Icon size={18} color={color} />
          <span>{title}</span>
          {items.length > 0 && <span className={styles.alertCount} style={{ background: color + '20', color }}>{items.length}</span>}
        </div>
      </div>
      {items.length === 0
        ? <p className="text-muted" style={{ fontSize: 13 }}>{emptyMsg}</p>
        : <div className={styles.alertItems}>{items.map(renderItem)}</div>}
    </div>
  );

  const taskItem = (t, urgency) => (
    <div key={t.id} className={styles.alertItem}>
      <div>
        <p style={{ fontWeight: 700, fontSize: 14 }}>{t.subject}</p>
        <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>{t.topic}</p>
        {t.deadline && <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>
          Due: {new Date(t.deadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>}
      </div>
      <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
    </div>
  );

  return (
    <div className="anim-fadeUp">
      <div className="page-header">
        <h1>Alerts & Reminders</h1>
        <p className="text-muted">Stay on top of deadlines and study goals</p>
      </div>

      {/* Summary banner */}
      {(overdueTasks.length > 0 || weeklyWarning) && (
        <div className={styles.criticalBanner}>
          <AlertTriangle size={20} color="#dc2626" />
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Attention needed!</p>
            <p style={{ fontSize: 13, marginTop: 2, opacity: .85 }}>
              {overdueTasks.length > 0 && `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`}
              {overdueTasks.length > 0 && weeklyWarning && ' · '}
              {weeklyWarning && `Weekly goal only at ${weekGoalPct}% — push harder!`}
            </p>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        <AlertSection
          icon={AlertTriangle} title="Overdue Tasks" color="#dc2626"
          items={overdueTasks} emptyMsg="🎉 No overdue tasks!"
          renderItem={(t) => taskItem(t)}
        />
        <AlertSection
          icon={Calendar} title="Due Today" color="#d97706"
          items={todayTasks} emptyMsg="Nothing due today"
          renderItem={(t) => taskItem(t)}
        />
        <AlertSection
          icon={Clock} title="Due in Next 3 Days" color="#b45309"
          items={next3DaysTasks} emptyMsg="No tasks due in next 3 days"
          renderItem={(t) => taskItem(t)}
        />
        <AlertSection
          icon={TrendingUp} title="High Priority Pending" color="#7c3aed"
          items={highPriorityPending} emptyMsg="✅ All high priority tasks done!"
          renderItem={(t) => taskItem(t)}
        />
      </div>

      {/* Weekly goal status */}
      <div className={`card ${styles.goalStatus}`}>
        <div className="flex gap-2" style={{ marginBottom: 12 }}>
          <CheckCircle size={18} color="var(--green-main)" />
          <span style={{ fontWeight: 700 }}>Weekly Study Goal Status</span>
        </div>
        <div className="progress-bar" style={{ height: 10, marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${weekGoalPct}%`, background: weekGoalPct >= 100 ? 'var(--green-dark)' : weekGoalPct >= 50 ? 'var(--green-main)' : '#d97706' }} />
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-mid)' }}>
          {weekGoalPct >= 100
            ? '🎉 Weekly goal achieved! Great work!'
            : weekGoalPct >= 50
            ? `${weekGoalPct}% done — you're halfway there!`
            : `Only ${weekGoalPct}% of your weekly goal completed. Keep going!`}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 6 }}>
          {overview?.week.minutesStudied}m studied of {overview?.week.goalMinutes}m goal
        </p>
      </div>

      {/* No-deadline warning */}
      {noDeadlineTasks.length > 0 && (
        <div className={`card ${styles.infoCard}`}>
          <div className="flex gap-2" style={{ marginBottom: 10 }}>
            <Bell size={16} color="#0891b2" />
            <span style={{ fontWeight: 700, color: '#0891b2' }}>{noDeadlineTasks.length} tasks without a deadline</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
            Consider adding deadlines to these tasks so they show up in your weekly alerts:
          </p>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {noDeadlineTasks.slice(0, 8).map(t => (
              <span key={t.id} style={{ background: 'var(--cream)', border: '1px solid var(--cream-border)', borderRadius: 8, padding: '4px 10px', fontSize: 12 }}>
                {t.subject} — {t.topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
