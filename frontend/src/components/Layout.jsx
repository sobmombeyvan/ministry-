'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';

const navByRole = {
  staff: [
    { to: '/staff', label: 'Dashboard', end: true },
    { to: '/staff/tickets', label: 'My tickets' },
    { to: '/staff/support', label: 'Support chat' },
    { to: '/staff/new-ticket', label: 'New ticket' },
    { to: '/staff/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/tickets', label: 'All tickets' },
    { to: '/admin/support', label: 'Support chat' },
    { to: '/admin/assign-task', label: 'Assign task' },
    { to: '/admin/reassign-task', label: 'Reassign task' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/history', label: 'History' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/profile', label: 'Profile' },
  ],
  technician: [
    { to: '/technician', label: 'Dashboard', end: true },
    { to: '/technician/tasks', label: 'My tasks' },
    { to: '/technician/tickets', label: 'Tickets' },
    { to: '/technician/support', label: 'Support chat' },
    { to: '/technician/profile', label: 'Profile' },
  ],
};

function isActive(pathname, link) {
  if (link.end) return pathname === link.to;
  return pathname.startsWith(link.to);
}

function initials(user) {
  if (!user) return '?';
  return `${user.name?.[0] || ''}${user.surname?.[0] || ''}`.toUpperCase();
}

function formatRole(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'technician') return 'Technician';
  return 'Staff';
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const links = navByRole[user?.role] || [];
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const sidebar = (
    <>
      <div className="brand">
        <div className="brand-mark">IT</div>
        <div>
          <h1>Ministry IT</h1>
          <p>Support Portal</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            href={link.to}
            className={`nav-link${isActive(pathname, link) ? ' active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials(user)}</div>
          <div className="user-info">
            <p className="user-name">
              {user?.name} {user?.surname}
            </p>
            <p className="user-role">{formatRole(user?.role)}</p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setLogoutOpen(true)}>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} />
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>{sidebar}</aside>

      <div className="app-main">
        <header className="mobile-header">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
          <span className="mobile-title">Ministry IT Support</span>
        </header>
        <main className="main-content">{children}</main>
      </div>
      <ConfirmModal
        open={logoutOpen}
        title="Sign out?"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        onConfirm={handleLogout}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export function Card({ children, className = '', title }) {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}

export function StatGrid({ stats }) {
  return (
    <div className="stat-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card">
          <p className="stat-label">{stat.label}</p>
          <p className="stat-value">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  );
}

export function ContentLoading({ message = 'Loading…' }) {
  return (
    <div className="content-loading">
      <div className="spinner-sm" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return <div className="alert-error">{message}</div>;
}

export function LinkButton({ href, children }) {
  return (
    <Link href={href} className="btn btn-primary">
      {children}
    </Link>
  );
}
