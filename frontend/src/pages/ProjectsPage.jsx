import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Plus, FolderKanban, MoreVertical, Trash2, Edit2,
  Clock, Users, CheckSquare, Loader2, Search, X, Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/layout/Layout'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

const priorityColors = {
  low: 'text-slate-400 bg-slate-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  critical: 'text-red-400 bg-red-500/10',
}

function ProjectModal({ project, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    priority: project?.priority || 'medium',
    color: project?.color || COLORS[0],
    dueDate: project?.dueDate ? format(new Date(project.dueDate), 'yyyy-MM-dd') : '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (project) {
        await api.put(`/projects/${project._id}`, form)
        toast.success('Project updated!')
      } else {
        await api.post('/projects', form)
        toast.success('Project created!')
      }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Project Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input" placeholder="My awesome project" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none" rows={3} placeholder="What's this project about?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                className="input">
                {['low', 'medium', 'high', 'critical'].map(p => (
                  <option key={p} value={p} className="bg-surface-800">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                className="input" />
            </div>
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-lg transition-all duration-200 ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : project ? 'Update' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ project, onEdit, onDelete }) {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwner = project.owner._id === user._id || project.owner === user._id

  const progress = project.taskCounts?.total > 0
    ? Math.round((project.taskCounts.done / project.taskCounts.total) * 100)
    : 0

  const statusColors = {
    active: 'text-emerald-400 bg-emerald-500/10',
    'on-hold': 'text-amber-400 bg-amber-500/10',
    completed: 'text-blue-400 bg-blue-500/10',
    cancelled: 'text-red-400 bg-red-500/10',
  }

  return (
    <div className="card-hover group p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${project.color}20` }}>
            <FolderKanban className="w-5 h-5" style={{ color: project.color }} />
          </div>
          <div>
            <Link to={`/projects/${project._id}`} className="text-sm font-semibold text-white hover:text-brand-400 transition-colors">
              {project.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
                {project.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[project.priority]}`}>
                {project.priority}
              </span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="relative">
            <button onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen) }}
              className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-surface-800 border border-surface-700 rounded-xl overflow-hidden shadow-xl z-10 w-36 animate-slide-up">
                <button onClick={() => { onEdit(project); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-surface-700 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { onDelete(project._id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {project.description && (
        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: project.color }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <CheckSquare className="w-3.5 h-3.5" />
            {project.taskCounts?.total || 0} tasks
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            {(project.members?.length || 0) + 1}
          </span>
        </div>

        {project.dueDate && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3" />
            {format(new Date(project.dueDate), 'MMM d')}
          </span>
        )}
      </div>

      {/* Member avatars */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-surface-800">
        <div className="flex -space-x-1.5">
          {[project.owner, ...(project.members?.map(m => m.user) || [])].slice(0, 4).map((member, i) => (
            member && <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ring-1 ring-surface-900"
              style={{ background: COLORS[member.name?.charCodeAt(0) % COLORS.length] }}>
              {member.name?.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <Link to={`/projects/${project._id}`}
          className="ml-auto text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium">
          Open →
        </Link>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
      toast.success('Project deleted')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete')
  })

  const projects = (data?.projects || []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">{data?.projects?.length || 0} total projects</p>
        </div>
        <button onClick={() => { setEditProject(null); setShowModal(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-9"
          placeholder="Search projects..."
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No projects yet</p>
          <p className="text-slate-600 text-sm mt-1">Create your first project to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <ProjectCard
              key={p._id}
              project={p}
              onEdit={(proj) => { setEditProject(proj); setShowModal(true) }}
              onDelete={(id) => {
                if (window.confirm('Delete this project and all its tasks?')) {
                  deleteMutation.mutate(id)
                }
              }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null) }}
          onSuccess={() => queryClient.invalidateQueries(['projects'])}
        />
      )}
    </div>
  )
}
