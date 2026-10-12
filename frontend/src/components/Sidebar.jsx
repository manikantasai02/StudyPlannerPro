import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ListTodo, BarChart2,
  Calendar, Bell, Timer, Settings, LogOut, BookOpen
} from 'lucide-react';
import styles from './Sidebar.module.css';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/weekly', icon: Calendar, label: 'Weekly Plan' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/focus', icon: Timer, label: 'Focus Mode' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}><BookOpen size={22} /></div>
        <span>Study Planner</span>
      </div>

      <nav className={styles.nav}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.userText}>
            <p className={styles.userName}>{user?.name}</p>
            <p className={styles.userEmail}>{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
