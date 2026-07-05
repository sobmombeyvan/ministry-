'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ErrorAlert } from '@/components/Layout';

export default function LoginView() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (user) {
      router.replace(`/${user.role}`);
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(identifier, password);
      router.replace(`/${loggedIn.role}`);
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-inner">
          <div className="brand-mark lg">IT</div>
          <p className="login-org">Ministry of Basic Education</p>
          <h1>IT Support Portal</h1>
          <p className="login-tagline">
            Internal system for reporting IT issues, tracking requests, and communicating
            with the technical support team.
          </p>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Sign in</h2>
            <p>Use your ministry email or username</p>
          </div>

          {!configured && (
            <div className="alert alert-info">
              System not configured. Set Supabase credentials in <code>.env</code>.
            </div>
          )}
          <ErrorAlert message={error} />

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Email or username</span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="your.email@ministry.gov"
                autoComplete="username"
                required
                disabled={!configured}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                disabled={!configured}
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !configured}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Staff account? <Link href="/signup">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
