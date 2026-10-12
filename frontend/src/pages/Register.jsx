import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import styles from './Auth.module.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome 🌿');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}><BookOpen size={28} /></div>
          <h1>Study Planner</h1>
        </div>

        <h2 className={styles.title}>Create account</h2>
        <p className={styles.subtitle}>Start your organized study journey today</p>

        <form onSubmit={submit} className={styles.form}>
          <div className="form-group">
            <label>Full Name</label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input name="name" type="text" value={form.name} onChange={handle}
                className={`form-control ${styles.inputWithIcon}`}
                placeholder="Your Name" required />
            </div>
          </div>

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
                placeholder="Min 6 characters" required />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input name="confirmPassword" type={showPass ? 'text' : 'password'} value={form.confirmPassword} onChange={handle}
                className={`form-control ${styles.inputWithIcon}`}
                placeholder="Repeat password" required />
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" style={{ width:18, height:18, borderWidth:2 }} /> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <div className={styles.authIllustration}>
        <div className={styles.illustrationContent}>
          <h2>Your study, organized.</h2>
          <p>Create a fresh account and start building productive study habits with analytics, focus mode, and deadline tracking.</p>
          <div className={styles.features}>
            {['✅ Fresh start — no dummy data', '🗂️ Upload study documents', '🔔 Smart deadline alerts', '🔥 Track study streaks'].map(f => (
              <div key={f} className={styles.featureItem}>{f}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
