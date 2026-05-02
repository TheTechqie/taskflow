import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Shield, Users, Loader2, Crown, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/users/all').then(r => r.data)
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }) => api.put(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users'])
      toast.success('Role updated!')
    },
    onError: () => toast.error('Failed to update role')
  })

  const users = data?.users || []
  const admins = users.filter(u => u.role === 'admin').length
  const members = users.filter(u => u.role === 'member').length

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-brand-400" />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>
        <p className="text-slate-400 text-sm">Manage users and system settings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-brand-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-white">{users.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Admins</span>
          </div>
          <p className="text-3xl font-bold text-white">{admins}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Members</span>
          </div>
          <p className="text-3xl font-bold text-white">{members}</p>
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">All Users</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-brand-500 animate-spin" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-xs font-semibold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{u.name}</p>
                        {u._id === currentUser._id && (
                          <span className="text-[10px] text-brand-400">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-400">{u.email}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-slate-500">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u._id === currentUser._id ? (
                      <span className="badge bg-brand-500/10 text-brand-400 border border-brand-500/20">
                        {u.role}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => updateRole.mutate({ id: u._id, role: e.target.value })}
                        className={`text-xs border rounded-full px-3 py-1 cursor-pointer focus:outline-none transition-all bg-transparent ${
                          u.role === 'admin'
                            ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                            : 'text-slate-400 border-slate-600/50 bg-slate-700/30'
                        }`}
                      >
                        <option value="member" className="bg-surface-800 text-slate-200">member</option>
                        <option value="admin" className="bg-surface-800 text-slate-200">admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
