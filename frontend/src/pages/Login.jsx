import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import styles from './Auth.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🌿');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      await login('demo@studyplanner.com', 'demo1234');
      toast.success('Logged in as Demo Student');
      navigate('/dashboard');
    } catch {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}><BookOpen size={28} /></div>
          <h1>Study Planner</h1>
        </div>

        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to continue your learning journey</p>

        <form onSubmit={submit} className={styles.form}>
          <div className="form-group">
            <label>Email</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input name="email" type="email" value={form.email} onChange={handle}
                className={`form-control ${styles.inputWithIcon}`}
                placeholder="your@email.com" required />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle}
                className={`form-control ${styles.inputWithIcon}`}
                placeholder="••••••••" required />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>

        <button onClick={demoLogin} className={`btn btn-ghost ${styles.demoBtn}`} disabled={loading}>
          🎓 Try Demo Account
        </button>

        <p className={styles.switchText}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>

      <div className={styles.authIllustration}>
        <div className={styles.illustrationContent}>
          <h2>Plan. Focus. Achieve.</h2>
          <p>Track your study sessions, manage tasks by priority, and visualize your progress week by week.</p>
          <div className={styles.features}>
            {['📚 Organize tasks by subject', '⏱️ Built-in focus timer', '📊 Weekly analytics', '🎯 Track deadlines'].map(f => (
              <div key={f} className={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
