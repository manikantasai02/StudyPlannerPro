const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Tasks, Documents, FocusSessions, Analytics } = require('../db');
const { protect } = require('../middleware/auth');

// ── File upload setup ─────────────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOADS_DIR, req.user.id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg'];
    if (ok.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('File type not supported'));
  },
});

// ── GET /api/tasks ────────────────────────────────────────────────────────────
router.get('/', protect, (req, res) => {
  let tasks = Tasks.allForUser(req.user.id);
  const { priority, completed, sort } = req.query;
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (completed !== undefined) tasks = tasks.filter(t => t.completed === (completed === 'true'));

  if (sort === 'priority') {
    const order = { High: 1, Medium: 2, Low: 3 };
    tasks.sort((a, b) => (order[a.priority] || 4) - (order[b.priority] || 4));
  } else if (sort === 'deadline') {
    tasks.sort((a, b) => new Date(a.deadline || '9999') - new Date(b.deadline || '9999'));
  } else {
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json({ success: true, count: tasks.length, tasks });
});

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────
router.get('/:id', protect, (req, res) => {
  const task = Tasks.findOne(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  const docs = Documents.allForTask(req.params.id);
  const sessions = FocusSessions.allForTask(req.params.id);
  res.json({ success: true, task: { ...task, documents: docs, focusSessions: sessions } });
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────
router.post('/', protect, (req, res) => {
  const { subject, topic, duration, priority, deadline, notes, tags, scheduledDate } = req.body;
  if (!subject || !topic || !duration)
    return res.status(400).json({ success: false, message: 'Subject, topic and duration are required' });

  const task = Tasks.create({ userId: req.user.id, subject, topic, duration, priority, deadline, notes, tags, scheduledDate });
  res.status(201).json({ success: true, task });
});

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────
router.put('/:id', protect, (req, res) => {
  const existing = Tasks.findOne(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

  const updates = {};
  const fields = ['subject', 'topic', 'duration', 'priority', 'deadline', 'notes', 'tags', 'scheduledDate'];
  fields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  // Handle completion
  if (req.body.completed !== undefined) {
    updates.completed = req.body.completed;
    if (!existing.completed && req.body.completed) {
      updates.completedAt = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];
      Analytics.upsert(req.user.id, today, { taskCompleted: true, subject: existing.subject });
    } else if (existing.completed && !req.body.completed) {
      updates.completedAt = null;
    }
  }

  const task = Tasks.update(req.params.id, req.user.id, updates);
  res.json({ success: true, task });
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────
router.delete('/:id', protect, (req, res) => {
  const existing = Tasks.findOne(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Task not found' });

  const docs = Documents.deleteForTask(req.params.id);
  docs.forEach(d => { if (fs.existsSync(d.filePath)) fs.unlinkSync(d.filePath); });
  Tasks.delete(req.params.id, req.user.id);
  res.json({ success: true, message: 'Task deleted' });
});

// ── POST /api/tasks/:id/upload ────────────────────────────────────────────────
router.post('/:id/upload', protect, upload.single('document'), (req, res) => {
  const task = Tasks.findOne(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const doc = Documents.create({
    taskId: req.params.id,
    userId: req.user.id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    filePath: req.file.path,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });

  res.json({ success: true, document: doc });
});

// ── DELETE /api/tasks/:id/documents/:docId ────────────────────────────────────
router.delete('/:id/documents/:docId', protect, (req, res) => {
  const doc = Documents.findOne(req.params.docId, req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
  if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
  Documents.delete(doc.id);
  res.json({ success: true, message: 'Document deleted' });
});

// ── GET /api/tasks/:id/documents/:docId/download ──────────────────────────────
router.get('/:id/documents/:docId/download', protect, (req, res) => {
  const doc = Documents.findOne(req.params.docId, req.params.id, req.user.id);
  if (!doc || !fs.existsSync(doc.filePath))
    return res.status(404).json({ success: false, message: 'File not found' });
  res.download(doc.filePath, doc.originalName);
});

// ── POST /api/tasks/:id/focus-session ─────────────────────────────────────────
router.post('/:id/focus-session', protect, (req, res) => {
  const { duration, completedFully } = req.body;
  const task = Tasks.findOne(req.params.id, req.user.id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  FocusSessions.create({ taskId: req.params.id, userId: req.user.id, duration, completedFully: !!completedFully });
  Tasks.update(req.params.id, req.user.id, { actualTimeSpent: (task.actualTimeSpent || 0) + Number(duration) });

  const today = new Date().toISOString().split('T')[0];
  Analytics.upsert(req.user.id, today, { minutesAdd: Number(duration), focusAdd: 1, subject: task.subject });

  res.json({ success: true, message: 'Focus session logged' });
});

module.exports = router;
