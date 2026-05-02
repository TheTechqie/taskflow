require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create users
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@demo.com',
      password: 'demo1234',
      role: 'admin'
    });

    const memberUser = await User.create({
      name: 'Jane Member',
      email: 'member@demo.com',
      password: 'demo1234',
      role: 'member'
    });

    const devUser = await User.create({
      name: 'Alex Dev',
      email: 'alex@demo.com',
      password: 'demo1234',
      role: 'member'
    });

    console.log('👤 Created users');

    // Create projects
    const project1 = await Project.create({
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern UI/UX',
      status: 'active',
      priority: 'high',
      color: '#6366f1',
      owner: adminUser._id,
      members: [
        { user: adminUser._id, role: 'admin' },
        { user: memberUser._id, role: 'member' },
        { user: devUser._id, role: 'member' }
      ],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    const project2 = await Project.create({
      name: 'Mobile App MVP',
      description: 'Build and launch the first version of our mobile application',
      status: 'active',
      priority: 'critical',
      color: '#8b5cf6',
      owner: adminUser._id,
      members: [
        { user: adminUser._id, role: 'admin' },
        { user: devUser._id, role: 'member' }
      ],
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });

    const project3 = await Project.create({
      name: 'Q1 Marketing Campaign',
      description: 'Plan and execute the Q1 2024 marketing initiatives',
      status: 'on-hold',
      priority: 'medium',
      color: '#f59e0b',
      owner: memberUser._id,
      members: [
        { user: memberUser._id, role: 'admin' },
        { user: adminUser._id, role: 'member' }
      ],
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // overdue
    });

    console.log('📁 Created projects');

    // Create tasks for project1
    const tasks1 = [
      { title: 'Design new homepage mockup', status: 'done', priority: 'high', assignee: devUser._id, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { title: 'Implement responsive navigation', status: 'in-progress', priority: 'high', assignee: devUser._id, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      { title: 'Write API documentation', status: 'todo', priority: 'medium', assignee: memberUser._id, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { title: 'SEO optimization', status: 'todo', priority: 'low', assignee: memberUser._id },
      { title: 'Set up CI/CD pipeline', status: 'review', priority: 'critical', assignee: devUser._id, dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      { title: 'User testing session', status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { title: 'Fix login page bugs', status: 'in-progress', priority: 'critical', assignee: devUser._id, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { title: 'Performance audit', status: 'done', priority: 'medium', assignee: adminUser._id },
    ];

    const tasks2 = [
      { title: 'Set up React Native project', status: 'done', priority: 'critical', assignee: devUser._id },
      { title: 'Design onboarding screens', status: 'done', priority: 'high', assignee: devUser._id },
      { title: 'Implement authentication flow', status: 'in-progress', priority: 'critical', assignee: devUser._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { title: 'Build push notification system', status: 'todo', priority: 'high', dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) },
      { title: 'App Store submission prep', status: 'todo', priority: 'medium', dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) },
    ];

    const tasks3 = [
      { title: 'Create campaign brief', status: 'done', priority: 'high', assignee: memberUser._id },
      { title: 'Design social media assets', status: 'review', priority: 'medium', assignee: memberUser._id, dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { title: 'Write email newsletter copy', status: 'todo', priority: 'low', dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ];

    await Task.insertMany([
      ...tasks1.map(t => ({ ...t, project: project1._id, createdBy: adminUser._id })),
      ...tasks2.map(t => ({ ...t, project: project2._id, createdBy: adminUser._id })),
      ...tasks3.map(t => ({ ...t, project: project3._id, createdBy: memberUser._id })),
    ]);

    console.log('✅ Created tasks');

    console.log('\n🎉 Seed complete!\n');
    console.log('Demo accounts:');
    console.log('  Admin  → admin@demo.com  / demo1234');
    console.log('  Member → member@demo.com / demo1234');
    console.log('  Dev    → alex@demo.com   / demo1234\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
