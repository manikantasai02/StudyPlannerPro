import { useEffect, useState } from 'react';
import api from '../api';
import { CheckCircle, Circle, Calendar, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Weekly.module.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getWeekDates() {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  return DAYS.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { name, date: d.toISOString().split('T')[0], dateObj: d };
  });
}

export default function Weekly() {
  const [tasks, setTasks] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);
  const weekDates = getWeekDates();

  useEffect(() => {
    Promise.all([api.get('/tasks'), api.get('/analytics/weekly')])
      .then(([t, w]) => { setTasks(t.data.tasks); setWeekly(w.data.weekly); })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (task) => {
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { completed: !task.completed });
      setTasks(ts => ts.map(t => t.id === task.id ? data.task : t));
      toast.success(data.task.completed ? '✅ Completed!' : 'Marked pending');
    } catch { toast.error('Update failed'); }
  };

  const today = new Date().toISOString().split('T')[0];

  // Group tasks by scheduled date or deadline falling this week
  const getTasksForDay = (dateStr) => {
    return tasks.filter(t => {
      const scheduled = t.scheduledDate ? t.scheduledDate.split('T')[0] : null;
      const deadline = t.deadline ? t.deadline.split('T')[0] : null;
      return scheduled === dateStr || (!scheduled && deadline === dateStr);
    });
  };

  // Unscheduled tasks (no date this week)
  const weekDateStrings = weekDates.map(d => d.date);
  const unscheduled = tasks.filter(t => {
    const scheduled = t.scheduledDate ? t.scheduledDate.split('T')[0] : null;
    const deadline = t.deadline ? t.deadline.split('T')[0] : null;
    return !weekDateStrings.includes(scheduled) && !weekDateStrings.includes(deadline) && !t.completed;
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="anim-fadeUp">
      <div className="page-header">
        <h1>Weekly Plan</h1>
        <p className="text-muted">
          Week of {weekDates[0].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {weekDates[6].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Mini analytics row */}
      <div className={styles.miniRow}>
        {weekly.map(d => (
          <div key={d.date} className={`${styles.miniDay} ${d.date === today ? styles.miniToday : ''}`}>
            <p className={styles.miniDayName}>{d.day}</p>
            <p className={styles.miniMins}>{d.minutesStudied}m</p>
            <div className={styles.miniBar}>
              <div className={styles.miniFill} style={{ height: `${Math.min((d.minutesStudied / 120) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Week grid */}
      <div className={styles.weekGrid}>
        {weekDates.map(({ name, date, dateObj }) => {
          const dayTasks = getTasksForDay(date);
          const isToday = date === today;
          const isPast = dateObj < new Date() && !isToday;
          const totalMin = dayTasks.reduce((s, t) => s + (t.duration || 0), 0);
          const doneCount = dayTasks.filter(t => t.completed).length;

          return (
            <div key={date} className={`${styles.dayCol} ${isToday ? styles.todayCol : ''} ${isPast ? styles.pastCol : ''}`}>
              <div className={styles.dayHeader}>
                <div>
                  <p className={styles.dayName}>{name.slice(0, 3)}</p>
                  <p className={styles.dayDate}>{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
                {dayTasks.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-light)' }}>{doneCount}/{dayTasks.length} · {totalMin}m</span>
                )}
              </div>

              <div className={styles.dayTasks}>
                {dayTasks.length === 0 ? (
                  <p className={styles.noTasks}>—</p>
                ) : (
                  dayTasks.map(t => (
                    <div key={t.id} className={`${styles.dayTask} ${t.completed ? styles.doneTask : ''}`} onClick={() => toggle(t)}>
                      {t.completed ? <CheckCircle size={14} color="var(--green-main)" /> : <Circle size={14} color="var(--cream-border)" />}
                      <div>
                        <p className={styles.dayTaskSubject}>{t.subject}</p>
                        <p className={styles.dayTaskTopic}>{t.topic}</p>
                        <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ fontSize: 10, padding: '2px 7px' }}>{t.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className={`card ${styles.unscheduled}`}>
          <div className="flex gap-2" style={{ marginBottom: 14 }}>
            <AlertTriangle size={16} color="#d97706" />
            <span style={{ fontWeight: 700 }}>Unscheduled Tasks ({unscheduled.length})</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {unscheduled.map(t => (
              <div key={t.id} className={styles.unschedChip}>
                <span style={{ fontWeight: 600 }}>{t.subject}</span> — {t.topic}
                <span className={`badge badge-${t.priority.toLowerCase()}`} style={{ marginLeft: 6, fontSize: 10 }}>{t.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
