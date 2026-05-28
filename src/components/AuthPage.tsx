/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, FileText, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: UserType) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dynamic avatar preview for registration
  const avatarUrl = name 
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`
    : `https://api.dicebear.com/7.x/identicon/svg?seed=guest`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { email, name, password, bio };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authenication failed. Please try again.');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Server connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div id="auth-card" className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header Branding */}
        <div className="px-6 py-8 bg-slate-50 border-b border-slate-150 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-3">
            {isLogin ? <LogIn className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold font-sans text-slate-900">
            {isLogin ? 'Sign In to Your Account' : 'Create Student Account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLogin ? 'Welcome back! Enter your details.' : 'Join the developer community cohort.'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div id="auth-error" className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <>
              {/* Dynamic Avatar Preview */}
              <div className="flex items-center gap-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <img 
                  src={avatarUrl} 
                  alt="Avatar Preview" 
                  className="w-12 h-12 rounded-lg bg-white border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-700 block">Identicon Generated</span>
                  <span className="text-slate-500">Preview changes dynamically as you type your name.</span>
                </div>
              </div>

              {/* Full Name input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550"
                  />
                </div>
              </div>

              {/* Interactive Bio Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 block">Personal Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <textarea
                    id="reg-bio"
                    placeholder="Tell us what you are building..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="name@forum.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-600">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:border-indigo-550"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing Workspace...' : isLogin ? 'Sign In' : 'Register & Log In'}
          </button>
        </form>

        {/* Demo Credentials Info Panel */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          {isLogin ? (
            <p>
              Dont have an account?{' '}
              <button 
                id="toggle-register"
                onClick={() => { setIsLogin(false); setError(null); }} 
                className="text-indigo-600 font-semibold hover:underline"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button 
                id="toggle-login"
                onClick={() => { setIsLogin(true); setError(null); }} 
                className="text-indigo-600 font-semibold hover:underline"
              >
                Sign In Instead
              </button>
            </p>
          )}

          {isLogin && (
            <div className="mt-2 text-left bg-slate-100 p-2.5 rounded border border-slate-200">
              <div className="font-bold text-slate-600 mb-0.5">Quick Student Demo Credentials:</div>
              <div><b>Admin:</b> admin@forum.com / <code className="bg-white px-0.5 rounded">admin123</code></div>
              <div><b>Member:</b> member@forum.com / <code className="bg-white px-0.5 rounded">member123</code></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
