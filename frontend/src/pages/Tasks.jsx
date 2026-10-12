import { useEffect, useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Trash2, CheckCircle, Circle,
  ChevronDown, ChevronUp, Paperclip, Upload, X, Download,
  Edit2, Clock, Calendar, Tag
} from 'lucide-react';
import styles from './Tasks.module.css';

const PRIORITY_ORDER = { High: 1, Medium: 2, Low: 3 };

function TaskModal({ task, onClose, onSave }) {
  const isEdit = !!task?.id;
  const [form, setForm] = useState({
    subject: task?.subject || '',
    topic: task?.topic || '',
    duration: task?.duration || 30,
    priority: task?.priority || 'Medium',
    deadline: task?.deadline ? task.deadline.split('T')[0] : '',
    notes: task?.notes || '',
    tags: task?.tags?.join(', ') || '',
    scheduledDate: task?.scheduledDate ? task.scheduledDate.split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);

  const h = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        deadline: form.deadline || null,
        scheduledDate: form.scheduledDate || null,
      };
      if (isEdit) {
        const { data } = await api.put(`/tasks/${task.id}`, payload);
        onSave(data.task, 'update');
      } else {
        const { data } = await api.post('/tasks', payload);
        onSave(data.task, 'create');
      }
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'Add New Task'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Subject</label>
              <input name="subject" value={form.subject} onChange={h} className="form-control" placeholder="e.g. Mathematics" required />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Topic</label>
              <input name="topic" value={form.topic} onChange={h} className="form-control" placeholder="e.g. Calculus — Integration" required />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input name="duration" type="number" min="1" value={form.duration} onChange={h} className="form-control" required />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={form.priority} onChange={h} className="form-control">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input name="deadline" type="date" value={form.deadline} onChange={h} className="form-control" />
            </div>
            <div className="form-group">
              <label>Scheduled Date</label>
              <input name="scheduledDate" type="date" value={form.scheduledDate} onChange={h} className="form-control" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Tags (comma separated)</label>
              <input name="tags" value={form.tags} onChange={h} className="form-control" placeholder="exam, revision, important" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={h} className="form-control" placeholder="Any notes..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete, onEdit, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState([]);
  const fileRef = useRef();

  const loadDocs = async () => {
    const { data } = await api.get(`/tasks/${task.id}`);
    setDocs(data.task.documents || []);
  };

  const toggleExpand = () => {
    if (!expanded) loadDocs();
    setExpanded(e => !e);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('document', file);
    setUploading(true);
    try {
      await api.post(`/tasks/${task.id}/upload`, fd);
      toast.success('File uploaded!');
      loadDocs();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    await api.delete(`/tasks/${task.id}/documents/${docId}`);
    toast.success('File removed');
    loadDocs();
  };

  const handleDownload = (docId, name) => {
    window.open(`/api/tasks/${task.id}/documents/${docId}/download`, '_blank');
  };

  const formatSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className={`${styles.taskCard} ${task.completed ? styles.done : ''}`}>
      <div className={styles.taskMain}>
        <button className={styles.checkBtn} onClick={() => onToggle(task)}>
          {task.completed
            ? <CheckCircle size={22} color="var(--green-main)" />
            : <Circle size={22} color="var(--cream-border)" />}
        </button>

        <div className={styles.taskInfo} onClick={toggleExpand} style={{ cursor: 'pointer', flex: 1 }}>
          <div className={styles.taskTop}>
            <span className={styles.taskSubject}>{task.subject}</span>
            <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
            {task.completed && <span className="badge badge-completed">Done</span>}
          </div>
          <p className={styles.taskTopic}>{task.topic}</p>
          <div className={styles.taskMeta}>
            <span><Clock size={12} /> {task.duration}m planned {task.actualTimeSpent > 0 && `· ${task.actualTimeSpent}m actual`}</span>
            {task.deadline && <span><Calendar size={12} /> Due {new Date(task.deadline).toLocaleDateString()}</span>}
            {task.tags?.length > 0 && <span><Tag size={12} /> {task.tags.join(', ')}</span>}
          </div>
        </div>

        <div className={styles.taskActions}>
          <button className="btn-icon" onClick={toggleExpand} title="Expand">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="btn-icon" onClick={() => onEdit(task)} title="Edit"><Edit2 size={15} /></button>
          <button className="btn-icon" onClick={() => onDelete(task.id)} title="Delete" style={{ color: '#dc2626' }}><Trash2 size={15} /></button>
        </div>
      </div>

      {expanded && (
        <div className={styles.taskExpanded}>
          {task.notes && <p className={styles.taskNotes}>{task.notes}</p>}

          <div className={styles.docsSection}>
            <div className="flex-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-mid)' }}>
                <Paperclip size={13} style={{ marginRight: 5 }} />Documents ({docs.length})
              </span>
              <button className="btn btn-sm btn-secondary" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : <><Upload size={13} /> Upload</>}
              </button>
              <input ref={fileRef} type="file" hidden accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg" onChange={handleUpload} />
            </div>

            {docs.length === 0 ? (
              <p className="text-muted" style={{ fontSize: 12 }}>No documents yet — upload PDFs, slides, or images.</p>
            ) : (
              <div className={styles.docList}>
                {docs.map(d => (
                  <div key={d.id} className={styles.docItem}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{d.originalName}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-light)' }}>{formatSize(d.size)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-icon" onClick={() => handleDownload(d.id, d.originalName)} title="Download"><Download size={14} /></button>
                      <button className="btn-icon" onClick={() => handleDeleteDoc(d.id)} title="Remove" style={{ color: '#dc2626' }}><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('');

  const loadTasks = async () => {
    const { data } = await api.get('/tasks');
    setTasks(data.tasks);
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, []);

  const handleToggle = async (task) => {
    try {
      const { data } = await api.put(`/tasks/${task.id}`, { completed: !task.completed });
      setTasks(ts => ts.map(t => t.id === task.id ? data.task : t));
      toast.success(data.task.completed ? 'Task completed! 🎉' : 'Marked as pending');
    } catch { toast.error('Failed to update task'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    setTasks(ts => ts.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  const handleSave = (task, type) => {
    if (type === 'create') setTasks(ts => [task, ...ts]);
    else setTasks(ts => ts.map(t => t.id === task.id ? task : t));
  };

  const openEdit = (task) => { setEditTask(task); setShowModal(true); };
  const openCreate = () => { setEditTask(null); setShowModal(true); };

  // Filter + sort
  let visible = tasks.filter(t => {
    const q = search.toLowerCase();
    if (q && !t.subject.toLowerCase().includes(q) && !t.topic.toLowerCase().includes(q)) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterStatus === 'completed' && !t.completed) return false;
    if (filterStatus === 'pending' && t.completed) return false;
    return true;
  });

  if (sortBy === 'priority') visible.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  else if (sortBy === 'deadline') visible.sort((a, b) => new Date(a.deadline || '9999') - new Date(b.deadline || '9999'));
  else if (sortBy === 'subject') visible.sort((a, b) => a.subject.localeCompare(b.subject));

  const pending = visible.filter(t => !t.completed);
  const done = visible.filter(t => t.completed);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><div className="spinner" /></div>;

  return (
    <div className="anim-fadeUp">
      <div className="page-header flex-between">
        <div>
          <h1>Study Tasks</h1>
          <p className="text-muted">{tasks.length} tasks · {tasks.filter(t => t.completed).length} completed</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> Add Task</button>
      </div>

      {/* Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} color="var(--text-light)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject or topic…" className={styles.searchInput} />
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="form-control" style={{ width: 'auto' }}>
          <option value="">All Priorities</option>
          <option>High</option><option>Medium</option><option>Low</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="form-control" style={{ width: 'auto' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="form-control" style={{ width: 'auto' }}>
          <option value="">Sort: Latest</option>
          <option value="priority">Priority</option>
          <option value="deadline">Deadline</option>
          <option value="subject">Subject</option>
        </select>
      </div>

      {visible.length === 0 && (
        <div className={styles.empty}>
          <p>No tasks found.</p>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add your first task</button>
        </div>
      )}

      {pending.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Pending ({pending.length})</h3>
          {pending.map(t => (
            <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} onRefresh={loadTasks} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Completed ({done.length})</h3>
          {done.map(t => (
            <TaskCard key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} onEdit={openEdit} onRefresh={loadTasks} />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal task={editTask} onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
