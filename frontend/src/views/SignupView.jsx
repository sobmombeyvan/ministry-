'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import { ErrorAlert } from '@/components/Layout';

export default function SignupView() {
  const { user, signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    surname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (user) {
      router.replace(`/${user.role}`);
    }
  }, [user, router]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await signup(form);
      if (result.needsConfirmation) {
        setSuccess('Account created. Check your email to confirm, then sign in.');
        setLoading(false);
        return;
      }
      router.replace(`/${result.profile.role}`);
    } catch (err) {
      setError(err.message || 'Sign up failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="login-hero-inner">
          <div className="brand-mark lg">IT</div>
          <p className="login-org">Ministry of Basic Education</p>
          <h1>Staff registration</h1>
          <p className="login-tagline">
            Create an account to submit IT support requests and communicate with the
            technical team through the support chat.
          </p>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Create account</h2>
            <p>For ministry staff only</p>
          </div>

          {!configured && (
            <div className="alert alert-info">
              System not configured. Set Supabase credentials in <code>.env</code>.
            </div>
          )}
          <ErrorAlert message={error} />
          {success && <div className="alert alert-success">{success}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="field">
                <span>First name</span>
                <input
                  value={form.name}
                  onChange={update('name')}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                  disabled={!configured || !!success}
                />
              </label>
              <label className="field">
                <span>Last name</span>
                <input
                  value={form.surname}
                  onChange={update('surname')}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                  disabled={!configured || !!success}
                />
              </label>
            </div>
            <label className="field">
              <span>Username</span>
              <input
                value={form.username}
                onChange={update('username')}
                placeholder="e.g. jmbeki"
                autoComplete="username"
                required
                disabled={!configured || !!success}
              />
            </label>
            <label className="field">
              <span>Work email</span>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@ministry.gov"
                autoComplete="email"
                required
                disabled={!configured || !!success}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                required
                disabled={!configured || !!success}
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
                disabled={!configured || !!success}
              />
            </label>
            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !configured || !!success}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-footer">
            Already registered? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
