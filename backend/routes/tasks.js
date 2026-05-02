const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

const canAccessProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const isMember = project.owner.toString() === userId.toString() ||
    project.members.some(m => m.user.toString() === userId.toString());
  return isMember ? project : null;
};

// @GET /api/tasks - Get all tasks for user (dashboard)
router.get('/', async (req, res) => {
  try {
    const { project, status, priority, assignee, overdue } = req.query;

    // Find all projects user is part of
    const userProjects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }]
    }).select('_id');

    const projectIds = userProjects.map(p => p._id);
    let filter = { project: { $in: projectIds } };

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tasks/project/:projectId
router.get('/project/:projectId', async (req, res) => {
  try {
    const project = await canAccessProject(req.params.projectId, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tasks
router.post('/', [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project is required'),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('dueDate').optional().isISO8601().toDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const project = await canAccessProject(req.body.project, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('project', 'name color')
      .populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await canAccessProject(task.project._id, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await canAccessProject(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const allowed = ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'tags'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    await task.populate('assignee', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');
    await task.populate('project', 'name color');
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await canAccessProject(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const isOwnerOrAdmin = task.createdBy.toString() === req.user._id.toString() ||
      project.owner.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isOwnerOrAdmin) return res.status(403).json({ message: 'Not authorized to delete this task' });

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @POST /api/tasks/:id/comments
router.post('/:id/comments', [
  body('text').trim().notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');
    res.status(201).json({ comments: task.comments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
