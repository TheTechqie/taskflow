import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { CheckSquare, Clock, Flag, Calendar, Loader2, Filter, X, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { Link } from 'react-router-dom'

const STATUS_LABELS = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done' }
const STATUS_STYLES = {
  todo: 'badge-todo',
  'in-progress': 'badge-in-progress',
  review: 'badge-review',
  done: 'badge-done'
}
const PRIORITY_COLORS = {
  low: 'text-slate-400', medium: 'text-amber-400',
  high: 'text-orange-400', critical: 'text-red-400'
}

export default function TasksPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ status: '', priority: '', overdue: false })

  const { data, isLoading } = useQuery({
    queryKey: ['all-tasks', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.overdue) params.append('overdue', 'true')
      return api.get(`/tasks?${params}`).then(r => r.data)
    }
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/tasks/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries(['all-tasks']),
    onError: () => toast.error('Failed to update status')
  })

  const deleteTask = useMutation({
    mutationFn: (id) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-tasks'])
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task')
  })

  const tasks = data?.tasks || []
  const hasFilters = filters.status || filters.priority || filters.overdue

  const clearFilters = () => setFilters({ status: '', priority: '', overdue: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-slate-400 text-sm mt-0.5">{tasks.length} tasks across all projects</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" /> Filter by:
        </div>
        <select
          value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
          className="text-xs bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
        >
          <option value="" className="bg-surface-800">All Statuses</option>
          {['todo', 'in-progress', 'review', 'done'].map(s => (
            <option key={s} value={s} className="bg-surface-800">{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
          className="text-xs bg-surface-800 border border-surface-700 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500/40"
        >
          <option value="" className="bg-surface-800">All Priorities</option>
          {['low', 'medium', 'high', 'critical'].map(p => (
            <option key={p} value={p} className="bg-surface-800">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={() => setFilters(p => ({ ...p, overdue: !p.overdue }))}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${
            filters.overdue
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-surface-800 border-surface-700 text-slate-400 hover:border-surface-600'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" /> Overdue
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No tasks found</p>
          <p className="text-slate-600 text-sm mt-1">
            {hasFilters ? 'Try adjusting your filters' : 'Tasks assigned to you will appear here'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] items-center gap-4 px-4 py-2.5 border-b border-surface-800 bg-surface-900/80">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Task</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Project</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Due</span>
            <span />
          </div>
          <div>
            {tasks.map(task => {
              const overdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'done'
              return (
                <div key={task._id} className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] items-center gap-4 px-4 py-3 border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors group">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {overdue && <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                    </div>
                    {task.assignee && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned to: {task.assignee.name}
                      </p>
                    )}
                  </div>
                  <div>
                    {task.project && (
                      <Link to={`/projects/${task.project._id}`}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors hover:text-brand-400"
                        style={{ background: `${task.project.color}15`, color: task.project.color }}>
                        {task.project.name}
                      </Link>
                    )}
                  </div>
                  <div>
                    <span className={`text-xs font-medium flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
                      <Flag className="w-3 h-3" />{task.priority}
                    </span>
                  </div>
                  <div>
                    <select
                      value={task.status}
                      onChange={e => updateStatus.mutate({ id: task._id, status: e.target.value })}
                      className={`text-xs border rounded-full px-2.5 py-1 cursor-pointer focus:outline-none transition-all ${STATUS_STYLES[task.status]} bg-transparent`}
                    >
                      {['todo', 'in-progress', 'review', 'done'].map(s => (
                        <option key={s} value={s} className="bg-surface-800 text-slate-200">{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    {task.dueDate ? (
                      <span className={`text-xs flex items-center gap-1 whitespace-nowrap ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { if (window.confirm('Delete this task?')) deleteTask.mutate(task._id) }}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
