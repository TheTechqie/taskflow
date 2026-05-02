import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Plus, MoreVertical, Trash2, Edit2, Users,
  UserPlus, X, Loader2, Calendar, Flag, MessageSquare,
  ChevronDown, BarChart3, Kanban
} from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'

const STATUSES = [
  { key: 'todo', label: 'To Do', color: 'border-slate-600', bg: 'bg-slate-600' },
  { key: 'in-progress', label: 'In Progress', color: 'border-blue-500', bg: 'bg-blue-500' },
  { key: 'review', label: 'Review', color: 'border-amber-500', bg: 'bg-amber-500' },
  { key: 'done', label: 'Done', color: 'border-emerald-500', bg: 'bg-emerald-500' },
]

const PRIORITIES = ['low', 'medium', 'high', 'critical']
const PRIORITY_COLORS = {
  low: 'text-slate-400', medium: 'text-amber-400',
  high: 'text-orange-400', critical: 'text-red-400'
}

function TaskModal({ task, projectId, members, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || task?.assignee || '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, project: projectId }
      if (!payload.assignee) delete payload.assignee
      if (!payload.dueDate) delete payload.dueDate

      if (task) await api.put(`/tasks/${task._id}`, payload)
      else await api.post('/tasks', payload)
      toast.success(task ? 'Task updated!' : 'Task created!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="input" placeholder="Task title..." required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none" rows={3} placeholder="Add details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input">
                {STATUSES.map(s => <option key={s.key} value={s.key} className="bg-surface-800">{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input">
                {PRIORITIES.map(p => <option key={p} value={p} className="bg-surface-800">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} className="input">
                <option value="" className="bg-surface-800">Unassigned</option>
                {members.map(m => (
                  <option key={m.user._id} value={m.user._id} className="bg-surface-800">{m.user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : task ? 'Update' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'done'

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-3.5 hover:border-surface-600 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
          {task.title}
        </p>
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 bg-surface-700 border border-surface-600 rounded-lg overflow-hidden shadow-xl z-10 w-32 animate-slide-up">
              <button onClick={() => { onEdit(task); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-surface-600">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => { onDelete(task._id); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-2.5 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
          <Flag className="w-3 h-3 inline mr-0.5" />{task.priority}
        </span>
        {task.dueDate && (
          <span className={`text-xs flex items-center gap-0.5 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
            <Calendar className="w-3 h-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        {task.assignee && (
          <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white bg-brand-500">
            {task.assignee.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Quick status change */}
      <div className="flex gap-1 mt-3 pt-2.5 border-t border-surface-700">
        {STATUSES.map(s => (
          <button
            key={s.key}
            onClick={() => onStatusChange(task._id, s.key)}
            className={`flex-1 h-1.5 rounded-full transition-all duration-200 ${task.status === s.key ? s.bg : 'bg-surface-700 hover:bg-surface-600'}`}
            title={s.label}
          />
        ))}
      </div>
    </div>
  )
}

function AddMemberModal({ projectId, onClose, onSuccess }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post(`/projects/${projectId}/members`, { email, role })
      toast.success('Member added!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Add Member</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input" placeholder="member@company.com" required />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="input">
              <option value="member" className="bg-surface-800">Member</option>
              <option value="admin" className="bg-surface-800">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [taskModal, setTaskModal] = useState(null) // null | 'new' | task object
  const [memberModal, setMemberModal] = useState(false)
  const [view, setView] = useState('kanban')

  const { data: projectData, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data)
  })

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get(`/tasks/project/${id}`).then(r => r.data)
  })

  const { data: statsData } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => api.get(`/projects/${id}/stats`).then(r => r.data)
  })

  const invalidate = () => {
    queryClient.invalidateQueries(['tasks', id])
    queryClient.invalidateQueries(['project-stats', id])
  }

  const deleteTask = useMutation({
    mutationFn: (taskId) => api.delete(`/tasks/${taskId}`),
    onSuccess: invalidate,
    onError: () => toast.error('Failed to delete task')
  })

  const updateStatus = useMutation({
    mutationFn: ({ taskId, status }) => api.put(`/tasks/${taskId}`, { status }),
    onSuccess: invalidate,
  })

  const removeMember = useMutation({
    mutationFn: (userId) => api.delete(`/projects/${id}/members/${userId}`),
    onSuccess: () => queryClient.invalidateQueries(['project', id]),
    onError: () => toast.error('Failed to remove member')
  })

  if (projLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
  )

  const project = projectData?.project
  const tasks = tasksData?.tasks || []
  const stats = statsData?.stats
  const isAdmin = project?.owner?._id === user._id || project?.owner === user._id ||
    project?.members?.some(m => (m.user?._id || m.user) === user._id && m.role === 'admin')
  const allMembers = project ? [
    { user: project.owner, role: 'admin' },
    ...(project.members || [])
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> All Projects
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${project?.color}25` }}>
              <div className="w-4 h-4 rounded-full" style={{ background: project?.color }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{project?.name}</h1>
              <p className="text-sm text-slate-400">{project?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-surface-800 border border-surface-700 rounded-lg p-1 gap-1">
              <button onClick={() => setView('kanban')} className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-surface-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <Kanban className="w-4 h-4" />
              </button>
              <button onClick={() => setView('list')} className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-surface-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
            {isAdmin && (
              <button onClick={() => setMemberModal(true)} className="btn-secondary text-xs">
                <UserPlus className="w-3.5 h-3.5" /> Add Member
              </button>
            )}
            <button onClick={() => setTaskModal('new')} className="btn-primary text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'To Do', value: stats.todo, color: 'text-slate-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
            { label: 'Review', value: stats.review, color: 'text-amber-400' },
            { label: 'Done', value: stats.done, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="grid grid-cols-4 gap-4 overflow-x-auto">
          {STATUSES.map(status => {
            const columnTasks = tasks.filter(t => t.status === status.key)
            return (
              <div key={status.key} className="min-w-[220px]">
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${status.color}`}>
                  <span className="text-xs font-semibold text-slate-300">{status.label}</span>
                  <span className="ml-auto text-xs bg-surface-800 text-slate-400 px-2 py-0.5 rounded-full">{columnTasks.length}</span>
                </div>
                <div className="space-y-2.5">
                  {columnTasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onEdit={(t) => setTaskModal(t)}
                      onDelete={(id) => {
                        if (window.confirm('Delete this task?')) deleteTask.mutate(id)
                      }}
                      onStatusChange={(taskId, newStatus) => updateStatus.mutate({ taskId, status: newStatus })}
                    />
                  ))}
                  <button
                    onClick={() => setTaskModal('new')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-400 hover:bg-surface-800 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add task
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Task</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Assignee</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Due</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const statusCfg = STATUSES.find(s => s.key === task.status)
                return (
                  <tr key={task._id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors group">
                    <td className="px-4 py-3">
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${task.status === 'todo' ? 'badge-todo' : task.status === 'in-progress' ? 'badge-in-progress' : task.status === 'review' ? 'badge-review' : 'badge-done'}`}>
                        {statusCfg?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      {task.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-xs font-semibold text-white">
                            {task.assignee.name?.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-400">{task.assignee.name}</span>
                        </div>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? (
                        <span className={`text-xs ${isPast(new Date(task.dueDate)) && task.status !== 'done' ? 'text-red-400' : 'text-slate-500'}`}>
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setTaskModal(task)} className="p-1 text-slate-500 hover:text-slate-300">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (window.confirm('Delete?')) deleteTask.mutate(task._id) }}
                          className="p-1 text-slate-500 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-slate-600">No tasks yet. Add your first task!</p>
            </div>
          )}
        </div>
      )}

      {/* Members */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" /> Team Members ({allMembers.length})
        </h3>
        <div className="flex flex-wrap gap-3">
          {allMembers.map((m, i) => {
            const memberUser = m.user
            if (!memberUser) return null
            return (
              <div key={i} className="flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-xl px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-xs font-semibold text-white">
                  {memberUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-200">{memberUser.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{m.role}</p>
                </div>
                {isAdmin && (memberUser._id || memberUser) !== (project.owner._id || project.owner) &&
                  (memberUser._id || memberUser) !== user._id && (
                    <button
                      onClick={() => removeMember.mutate(memberUser._id || memberUser)}
                      className="ml-1 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      {(taskModal === 'new' || (taskModal && taskModal._id)) && (
        <TaskModal
          task={taskModal === 'new' ? null : taskModal}
          projectId={id}
          members={allMembers}
          onClose={() => setTaskModal(null)}
          onSuccess={invalidate}
        />
      )}
      {memberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setMemberModal(false)}
          onSuccess={() => queryClient.invalidateQueries(['project', id])}
        />
      )}
    </div>
  )
}
