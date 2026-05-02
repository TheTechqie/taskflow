const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect);

// @GET /api/users - Search users (for adding to projects)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const users = await User.find(filter).select('name email avatar role').limit(20);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/users/dashboard - Dashboard stats for current user
router.get('/dashboard', async (req, res) => {
  try {
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    });

    const projectIds = userProjects.map(p => p._id);
    const now = new Date();

    const [allTasks, myTasks, overdueTasks, recentTasks] = await Promise.all([
      Task.find({ project: { $in: projectIds } }),
      Task.find({ project: { $in: projectIds }, assignee: req.user._id })
        .populate('project', 'name color')
        .populate('assignee', 'name avatar')
        .sort({ updatedAt: -1 }).limit(10),
      Task.find({
        project: { $in: projectIds },
        dueDate: { $lt: now },
        status: { $ne: 'done' }
      }).populate('project', 'name color').populate('assignee', 'name avatar').limit(5),
      Task.find({ project: { $in: projectIds } })
        .populate('project', 'name color')
        .populate('assignee', 'name avatar')
        .sort({ updatedAt: -1 }).limit(5)
    ]);

    const stats = {
      projects: userProjects.length,
      totalTasks: allTasks.length,
      myTasks: allTasks.filter(t => t.assignee && t.assignee.toString() === req.user._id.toString()).length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in-progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      done: allTasks.filter(t => t.status === 'done').length,
      overdue: overdueTasks.length,
    };

    res.json({ stats, myTasks, overdueTasks, recentTasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/users/all - Admin only
router.get('/all', restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/users/:id/role - Admin only
router.put('/:id/role', restrictTo('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
