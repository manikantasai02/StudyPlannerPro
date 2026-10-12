const express = require('express');
const router = express.Router();
const { Tasks, Analytics } = require('../db');
const { protect } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', protect, (req, res) => {
  const uid = req.user.id;
  const allTasks = Tasks.allForUser(uid);
  const completed = allTasks.filter(t => t.completed).length;
  const highPriority = allTasks.filter(t => !t.completed && t.priority === 'High').length;

  const allAnalytics = Analytics.allForUser(uid);
  const totalMinutes = allAnalytics.reduce((s, a) => s + a.minutesStudied, 0);
  const totalFocus = allAnalytics.reduce((s, a) => s + a.focusSessions, 0);

  const today = new Date().toISOString().split('T')[0];
  const todayRow = Analytics.findOne(uid, today);

  // This week (Mon to today)
  const now = new Date();
  const dow = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekRows = allAnalytics.filter(a => new Date(a.date) >= weekStart);
  const weekMinutes = weekRows.reduce((s, a) => s + a.minutesStudied, 0);
  const weekDone = weekRows.reduce((s, a) => s + a.tasksCompleted, 0);

  // Upcoming deadlines (next 7 days)
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const deadlines = allTasks
    .filter(t => !t.completed && t.deadline && t.deadline >= today && t.deadline <= nextWeek)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5);

  // Subject breakdown
  const subjectMap = {};
  allTasks.forEach(t => {
    if (!subjectMap[t.subject]) subjectMap[t.subject] = { subject: t.subject, total: 0, completed: 0, minutes: 0 };
    subjectMap[t.subject].total++;
    if (t.completed) subjectMap[t.subject].completed++;
    subjectMap[t.subject].minutes += t.actualTimeSpent || 0;
  });
  const subjectBreakdown = Object.values(subjectMap).sort((a, b) => b.total - a.total);

  const weeklyGoal = req.user.weeklyGoal || 600;

  res.json({
    success: true,
    overview: {
      totalTasks: allTasks.length,
      completedTasks: completed,
      pendingTasks: allTasks.length - completed,
      highPriority,
      totalMinutes,
      totalFocusSessions: totalFocus,
      completionRate: allTasks.length ? Math.round((completed / allTasks.length) * 100) : 0,
      today: {
        minutesStudied: todayRow?.minutesStudied || 0,
        tasksCompleted: todayRow?.tasksCompleted || 0,
        focusSessions: todayRow?.focusSessions || 0,
        subjects: todayRow?.subjects || [],
      },
      week: {
        minutesStudied: weekMinutes,
        tasksCompleted: weekDone,
        goalMinutes: weeklyGoal,
        progress: Math.min(Math.round((weekMinutes / weeklyGoal) * 100), 100),
      },
      upcomingDeadlines: deadlines,
      subjectBreakdown,
    },
  });
});

// GET /api/analytics/weekly
router.get('/weekly', protect, (req, res) => {
  const uid = req.user.id;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  const result = days.map(dateStr => {
    const row = Analytics.findOne(uid, dateStr);
    const d = new Date(dateStr + 'T00:00:00');
    return {
      date: dateStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      minutesStudied: row?.minutesStudied || 0,
      tasksCompleted: row?.tasksCompleted || 0,
      focusSessions: row?.focusSessions || 0,
    };
  });

  res.json({ success: true, weekly: result });
});

// GET /api/analytics/streak
router.get('/streak', protect, (req, res) => {
  const uid = req.user.id;
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const row = Analytics.findOne(uid, dateStr);
    if (row && row.minutesStudied > 0) streak++;
    else break;
  }
  res.json({ success: true, streak });
});

module.exports = router;
