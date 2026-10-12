import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { User, Target, Bell, Save } from 'lucide-react';
import styles from './Settings.module.css';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', weeklyGoal: user?.weeklyGoal || 600 });
  const [alerts, setAlerts] = useState({
    alertEmail: user?.alertEmail ?? true,
    alertDeadline: user?.alertDeadline ?? true,
    alertWeekly: user?.alertWeekly ?? true,
  });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: profile.name, weeklyGoal: Number(profile.weeklyGoal), ...alerts });
      updateUser(data.user);
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div className={styles.toggle}>
      <div>
        <p style={{ fontWeight: 600, fontSize: 14 }}>{label}</p>
        <p className="text-muted" style={{ fontSize: 12 }}>{desc}</p>
      </div>
      <button
        type="button"
        className={`${styles.toggleBtn} ${checked ? styles.toggleOn : ''}`}
        onClick={() => onChange(!checked)}>
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );

  return (
    <div className="anim-fadeUp">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="text-muted">Manage your profile and preferences</p>
      </div>

      <form onSubmit={saveProfile}>
        <div className={styles.grid}>
          {/* Profile */}
          <div className={`card ${styles.section}`}>
            <div className={styles.sectionHead}>
              <User size={18} color="var(--green-main)" />
              <h2>Profile</h2>
            </div>

            <div className={styles.avatarRow}>
              <div className={styles.avatarBig}>
                {profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
              </div>
              <div>
                <p style={{ fontWeight: 700 }}>{user?.name}</p>
                <p className="text-muted">{user?.email}</p>
                <p className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>
                  Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Display Name</label>
              <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="form-control" required />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input value={user?.email} className="form-control" disabled style={{ opacity: .6 }} />
            </div>
          </div>

          {/* Goals */}
          <div className={`card ${styles.section}`}>
            <div className={styles.sectionHead}>
              <Target size={18} color="var(--green-main)" />
              <h2>Study Goal</h2>
            </div>

            <div className="form-group">
              <label>Weekly Goal (minutes)</label>
              <input type="number" min="30" max="10080" value={profile.weeklyGoal}
                onChange={e => setProfile(p => ({ ...p, weeklyGoal: e.target.value }))}
                className="form-control" />
            </div>

            <div className={styles.goalPresets}>
              {[300, 600, 900, 1200].map(g => (
                <button key={g} type="button"
                  className={`btn btn-sm ${profile.weeklyGoal == g ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProfile(p => ({ ...p, weeklyGoal: g }))}>
                  {g / 60}h/wk
                </button>
              ))}
            </div>

            <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>
              That's about {Math.round(profile.weeklyGoal / 7)} minutes per day
            </p>
          </div>

          {/* Alerts */}
          <div className={`card ${styles.section}`} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.sectionHead}>
              <Bell size={18} color="var(--green-main)" />
              <h2>Alert Preferences</h2>
            </div>

            <Toggle label="Email Alerts" desc="Receive alerts in your dashboard"
              checked={alerts.alertEmail} onChange={v => setAlerts(a => ({ ...a, alertEmail: v }))} />
            <Toggle label="Deadline Reminders" desc="See warnings when tasks are due soon"
              checked={alerts.alertDeadline} onChange={v => setAlerts(a => ({ ...a, alertDeadline: v }))} />
            <Toggle label="Weekly Digest" desc="Show weekly summary on your dashboard"
              checked={alerts.alertWeekly} onChange={v => setAlerts(a => ({ ...a, alertWeekly: v }))} />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving…' : <><Save size={17} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
