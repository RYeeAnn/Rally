import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0e1a13] flex-col justify-between p-12">
        <span className="text-white font-semibold text-lg tracking-tight">Rally</span>
        <div>
          <p className="text-zinc-300 text-lg leading-relaxed font-light max-w-sm">
            Track leagues, split costs, and chase down payments. All in one place.
          </p>
          <p className="text-zinc-600 text-sm mt-4">Built for recreational sports captains</p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 lg:hidden">Rally</p>
            <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>
            <p className="text-zinc-500 text-sm mt-1">Get started for free.</p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2.5 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Your name</label>
              <input
                id="name"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-zinc-900 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
