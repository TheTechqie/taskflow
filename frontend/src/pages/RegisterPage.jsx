import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff, ArrowRight, Loader2, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password, form.role)
      toast.success('Account created! Welcome to TaskFlow 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-glow-sm">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white">TaskFlow</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
        <p className="text-slate-400 mb-8 text-sm">Start managing your projects for free</p>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { value: 'member', icon: User, label: 'Member', desc: 'Join projects & manage tasks' },
            { value: 'admin', icon: Shield, label: 'Admin', desc: 'Full project control' },
          ].map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm(p => ({ ...p, role: value }))}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                form.role === value
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-surface-700 bg-surface-800/50 hover:border-surface-600'
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${form.role === value ? 'text-brand-400' : 'text-slate-500'}`} />
              <p className={`text-sm font-semibold ${form.role === value ? 'text-white' : 'text-slate-300'}`}>{label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="input"
              placeholder="you@company.com"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input pr-10"
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>Create account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
