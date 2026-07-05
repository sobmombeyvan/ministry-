'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(`/${user.role}`);
    }
  }, [user, loading, roles, router]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return children;
}
