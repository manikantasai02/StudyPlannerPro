/**
 * Pure JS data store using JSON files — no native modules required.
 * Each entity (users, tasks, documents, focusSessions, analytics) is
 * stored in a separate JSON file inside /data.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Low-level helpers ─────────────────────────────────────────────────────────
function readJson(file) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

function writeJson(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ── Collections ───────────────────────────────────────────────────────────────
const USERS    = 'users.json';
const TASKS    = 'tasks.json';
const DOCS     = 'documents.json';
const SESSIONS = 'focus_sessions.json';
const ANALYTICS = 'analytics.json';

// ── Users ─────────────────────────────────────────────────────────────────────
const Users = {
  all: () => readJson(USERS),
  findById: (id) => readJson(USERS).find(u => u.id === id) || null,
  findByEmail: (email) => readJson(USERS).find(u => u.email === email.toLowerCase()) || null,
  create: (data) => {
    const users = readJson(USERS);
    const user = {
      id: data.id || uuidv4(),
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      avatar: data.avatar || '',
      weeklyGoal: data.weeklyGoal || 600,
      alertEmail: true,
      alertDeadline: true,
      alertWeekly: true,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeJson(USERS, users);
    return user;
  },
  update: (id, updates) => {
    const users = readJson(USERS);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    writeJson(USERS, users);
    return users[idx];
  },
  safe: (u) => {
    if (!u) return null;
    const { password, ...safe } = u;
    return safe;
  },
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
const Tasks = {
  allForUser: (userId) => readJson(TASKS).filter(t => t.userId === userId),
  findOne: (id, userId) => readJson(TASKS).find(t => t.id === id && t.userId === userId) || null,
  create: (data) => {
    const tasks = readJson(TASKS);
    const task = {
      id: uuidv4(),
      userId: data.userId,
      subject: data.subject,
      topic: data.topic,
      duration: Number(data.duration),
      priority: data.priority || 'Medium',
      completed: false,
      completedAt: null,
      deadline: data.deadline || null,
      notes: data.notes || '',
      tags: data.tags || [],
      actualTimeSpent: 0,
      scheduledDate: data.scheduledDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(task);
    writeJson(TASKS, tasks);
    return task;
  },
  update: (id, userId, updates) => {
    const tasks = readJson(TASKS);
    const idx = tasks.findIndex(t => t.id === id && t.userId === userId);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJson(TASKS, tasks);
    return tasks[idx];
  },
  delete: (id, userId) => {
    const tasks = readJson(TASKS);
    const filtered = tasks.filter(t => !(t.id === id && t.userId === userId));
    writeJson(TASKS, filtered);
  },
};

// ── Documents ─────────────────────────────────────────────────────────────────
const Documents = {
  allForTask: (taskId) => readJson(DOCS).filter(d => d.taskId === taskId),
  findOne: (id, taskId, userId) => readJson(DOCS).find(d => d.id === id && d.taskId === taskId && d.userId === userId) || null,
  create: (data) => {
    const docs = readJson(DOCS);
    const doc = { id: uuidv4(), ...data, uploadedAt: new Date().toISOString() };
    docs.push(doc);
    writeJson(DOCS, docs);
    return doc;
  },
  delete: (id) => {
    writeJson(DOCS, readJson(DOCS).filter(d => d.id !== id));
  },
  deleteForTask: (taskId) => {
    const toDelete = readJson(DOCS).filter(d => d.taskId === taskId);
    writeJson(DOCS, readJson(DOCS).filter(d => d.taskId !== taskId));
    return toDelete;
  },
};

// ── Focus Sessions ────────────────────────────────────────────────────────────
const FocusSessions = {
  allForTask: (taskId) => readJson(SESSIONS).filter(s => s.taskId === taskId),
  create: (data) => {
    const sessions = readJson(SESSIONS);
    const session = { id: uuidv4(), ...data, startedAt: new Date().toISOString() };
    sessions.push(session);
    writeJson(SESSIONS, sessions);
    return session;
  },
};

// ── Daily Analytics ───────────────────────────────────────────────────────────
const Analytics = {
  allForUser: (userId) => readJson(ANALYTICS).filter(a => a.userId === userId),
  findOne: (userId, date) => readJson(ANALYTICS).find(a => a.userId === userId && a.date === date) || null,
  upsert: (userId, date, { minutesAdd = 0, taskCompleted = false, subject = null, focusAdd = 0 }) => {
    const all = readJson(ANALYTICS);
    const idx = all.findIndex(a => a.userId === userId && a.date === date);
    if (idx === -1) {
      const entry = {
        id: uuidv4(), userId, date,
        minutesStudied: minutesAdd,
        tasksCompleted: taskCompleted ? 1 : 0,
        focusSessions: focusAdd,
        subjects: subject ? [subject] : [],
      };
      all.push(entry);
    } else {
      all[idx].minutesStudied += minutesAdd;
      all[idx].tasksCompleted += taskCompleted ? 1 : 0;
      all[idx].focusSessions += focusAdd;
      if (subject && !all[idx].subjects.includes(subject)) all[idx].subjects.push(subject);
    }
    writeJson(ANALYTICS, all);
  },
};

// ── Seed demo account ─────────────────────────────────────────────────────────
function seedDemo() {
  if (Users.findByEmail('demo@studyplanner.com')) return;

  const demoId = 'demo-user-001';
  const hash = bcrypt.hashSync('demo1234', 10);
  Users.create({ id: demoId, name: 'Demo Student', email: 'demo@studyplanner.com', password: hash, weeklyGoal: 600 });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'English'];
  const topicsMap = {
    Mathematics: ['Calculus', 'Linear Algebra', 'Statistics', 'Trigonometry'],
    Physics: ['Mechanics', 'Thermodynamics', 'Optics'],
    Chemistry: ['Organic Chemistry', 'Inorganic Chemistry'],
    'Computer Science': ['Data Structures', 'Algorithms', 'Networks'],
    English: ['Essay Writing', 'Grammar'],
  };
  const priorities = ['High', 'Medium', 'Low'];

  subjects.forEach((subj, si) => {
    topicsMap[subj].forEach((topic, ti) => {
      const completed = ti === 0;
      Tasks.create({
        userId: demoId, subject: subj, topic,
        duration: 30 + (si * 10) + (ti * 5),
        priority: priorities[(si + ti) % 3],
        completed, notes: '',
        deadline: ti === 1 ? new Date(Date.now() + (si + 1) * 2 * 86400000).toISOString() : null,
      });
      if (completed) {
        Tasks.update(Tasks.allForUser(demoId).slice(-1)[0]?.id, demoId, {
          completed: true, completedAt: new Date(Date.now() - 86400000).toISOString(),
          actualTimeSpent: 25 + (si * 8),
        });
      }
    });
  });

  // Seed analytics for last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    Analytics.upsert(demoId, dateStr, {
      minutesAdd: 30 + Math.floor(Math.random() * 90),
      focusAdd: Math.floor(Math.random() * 3) + 1,
      subject: subjects[i % subjects.length],
    });
    if (i % 2 === 0) {
      Analytics.upsert(demoId, dateStr, { taskCompleted: true });
    }
  }

  console.log('✅ Demo account seeded (demo@studyplanner.com / demo1234)');
}

seedDemo();

module.exports = { Users, Tasks, Documents, FocusSessions, Analytics };
