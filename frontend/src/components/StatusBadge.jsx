const badgeClass = {
  open: 'badge-blue',
  pending: 'badge-amber',
  in_progress: 'badge-violet',
  closed: 'badge-green',
  refused: 'badge-red',
  low: 'badge-slate',
  medium: 'badge-amber',
  high: 'badge-red',
  hardware: 'badge-cyan',
  network: 'badge-violet',
  software: 'badge-green',
  active: 'badge-green',
  deactivated: 'badge-red',
};

export default function StatusBadge({ value }) {
  const label = (value || '').replace(/_/g, ' ');
  const cls = badgeClass[value] || 'badge-slate';

  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}
