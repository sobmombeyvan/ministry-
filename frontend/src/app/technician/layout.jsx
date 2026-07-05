'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function TechnicianLayout({ children }) {
  return <ProtectedRoute roles={['technician']}>{children}</ProtectedRoute>;
}
