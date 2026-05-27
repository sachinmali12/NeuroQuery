import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Database, User, Mail, Lock, Loader2, Sparkles } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register(username, email, password);
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0b0f19] text-slate-100 overflow-hidden relative font-sans">
      {/* Background aesthetic glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-950/15 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md p-8 glass-panel border border-slate-800/40 rounded-2xl shadow-2xl relative z-15 backdrop-blur-md animate-row-stagger">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <Database className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent">
            Create your account
          </h1>
          <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase mt-1 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI SQL Companion
          </p>
        </div>

        {/* Error Alert box */}
        {error && (
          <div className="mb-5 p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {/* Register form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username input field */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="DataEngineer101"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs py-3 pl-10 pr-4 rounded-xl glass-input text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder-slate-600 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="developer@novasql.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs py-3 pl-10 pr-4 rounded-xl glass-input text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder-slate-600 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs py-3 pl-10 pr-4 rounded-xl glass-input text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder-slate-600 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-xs text-white transition-all shadow-lg shadow-indigo-600/15 disabled:opacity-50 disabled:pointer-events-none active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-8 text-center border-t border-slate-800/30 pt-6">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;
