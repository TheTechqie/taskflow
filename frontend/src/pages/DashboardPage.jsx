import { useQuery } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import {
  FolderKanban, CheckSquare, AlertCircle, TrendingUp,
  Clock, ArrowRight, Circle, Loader2
} from 'lucide-react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const statusConfig = {
  todo: { label: 'To Do', color: 'bg-slate-600', text: 'text-slate-400' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500', text: 'text-blue-400' },
  review: { label: 'Review', color: 'bg-amber-500', text: 'text-amber-400' },
  done: { label: 'Done', color: 'bg-emerald-500', text: 'text-emerald-400' },
}

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card p-5 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  )
}

function PriorityDot({ priority }) {
  const colors = { low: 'bg-slate-500', medium: 'bg-amber-500', high: 'bg-orange-500', critical: 'bg-red-500' }
  return <span className={`w-2 h-2 rounded-full ${colors[priority] || 'bg-slate-500'} shrink-0`} />
}

function DueDateBadge({ dueDate }) {
  if (!dueDate) return null
  const date = new Date(dueDate)
  const overdue = isPast(date) && !isToday(date)
  const label = isToday(date) ? 'Today' : isTomorrow(date) ? 'Tomorrow' : format(date, 'MMM d')
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
      overdue ? 'bg-red-500/15 text-red-400' : 'bg-surface-700 text-slate-400'
    }`}>
      <Clock className="w-3 h-3" />
      {label}
    </span>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/users/dashboard').then(r => r.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
    </div>
  )

  const { stats, myTasks = [], overdueTasks = [], recentTasks = [] } = data || {}

  const chartData = [
    { name: 'To Do', value: stats?.todo || 0, color: '#64748b' },
    { name: 'In Progress', value: stats?.inProgress || 0, color: '#3b82f6' },
    { name: 'Review', value: stats?.review || 0, color: '#f59e0b' },
    { name: 'Done', value: stats?.done || 0, color: '#22c55e' },
  ]

  const completionRate = stats?.totalTasks > 0
    ? Math.round((stats.done / stats.totalTasks) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Here's what's happening across your projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Projects" value={stats?.projects || 0} color="bg-brand-500" sub="active" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats?.totalTasks || 0} color="bg-blue-500" sub={`${completionRate}% complete`} />
        <StatCard icon={TrendingUp} label="In Progress" value={stats?.inProgress || 0} color="bg-amber-500" sub="tasks" />
        <StatCard icon={AlertCircle} label="Overdue" value={stats?.overdue || 0} color={stats?.overdue > 0 ? 'bg-red-500' : 'bg-emerald-500'} sub="tasks" />
      </div>

      {/* Charts + Overdue */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Task Status Overview</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Completion rate */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#6366f1" strokeWidth="10"
                strokeDasharray={`${completionRate * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{completionRate}%</span>
              <span className="text-xs text-slate-500">done</span>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-300">Completion Rate</p>
          <p className="text-xs text-slate-500">{stats?.done || 0} of {stats?.totalTasks || 0} tasks</p>
        </div>
      </div>

      {/* Tasks grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">My Tasks</h2>
            <Link to="/tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {myTasks.length === 0 && (
              <p className="text-center text-sm text-slate-600 py-6">No tasks assigned to you</p>
            )}
            {myTasks.slice(0, 5).map(task => (
              <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-800 transition-colors group">
                <PriorityDot priority={task.priority} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{task.project?.name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DueDateBadge dueDate={task.dueDate} />
                  <span className={`badge ${task.status === 'todo' ? 'badge-todo' : task.status === 'in-progress' ? 'badge-in-progress' : task.status === 'review' ? 'badge-review' : 'badge-done'} text-xs`}>
                    {statusConfig[task.status]?.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overdue */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">
              Overdue Tasks
              {overdueTasks.length > 0 && (
                <span className="ml-2 badge bg-red-500/15 text-red-400 border border-red-500/20">{overdueTasks.length}</span>
              )}
            </h2>
          </div>
          <div className="space-y-2">
            {overdueTasks.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-500">No overdue tasks! 🎉</p>
              </div>
            ) : (
              overdueTasks.map(task => (
                <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Due {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{task.project?.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
