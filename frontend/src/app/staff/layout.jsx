'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function StaffLayout({ children }) {
  return <ProtectedRoute roles={['staff']}>{children}</ProtectedRoute>;
}
