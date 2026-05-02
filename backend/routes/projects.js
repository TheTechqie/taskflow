const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// Helper: check if user is project admin/owner
const isProjectAdmin = (project, userId) => {
  if (project.owner.toString() === userId.toString()) return true;
  const member = project.members.find(m => m.user.toString() === userId.toString());
  return member && member.role === 'admin';
};

// @GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .sort({ updatedAt: -1 });

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (project) => {
      const taskCounts = await Task.aggregate([
        { $match: { project: project._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0, total: 0 };
      taskCounts.forEach(tc => {
        counts[tc._id] = tc.count;
        counts.total += tc.count;
      });
      return { ...project.toObject(), taskCounts: counts };
    }));

    res.json({ projects: projectsWithCounts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('color').optional(),
  body('dueDate').optional().isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const project = await Project.create({
      ...req.body,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });
    await project.populate('owner', 'name email avatar');
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.owner._id.toString() === req.user._id.toString() ||
      project.members.some(m => m.user._id.toString() === req.user._id.toString());

    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/projects/:id
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) return res.status(403).json({ message: 'Only project admins can update' });

    const allowed = ['name', 'description', 'status', 'priority', 'color', 'dueDate', 'tags'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    await project.save();
    await project.populate('owner', 'name email avatar');
    await project.populate('members.user', 'name email avatar');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only project owner can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/projects/:id/members
router.post('/:id/members', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) return res.status(403).json({ message: 'Only admins can add members' });

    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const alreadyMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!isProjectAdmin(project, req.user._id)) return res.status(403).json({ message: 'Only admins can remove members' });

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();
    res.json({ project });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/projects/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const tasks = await Task.find({ project: req.params.id }).populate('assignee', 'name avatar');
    const now = new Date();

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      byPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        critical: tasks.filter(t => t.priority === 'critical').length,
      }
    };

    res.json({ stats });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
