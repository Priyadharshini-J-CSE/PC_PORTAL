export default function StatCard({ icon, value, label, onClick }) {
  return (
    <div className="box stat" onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}>
      <div className="stat-icon">{icon}</div>
      <b>{value ?? '—'}</b>
      <span>{label}</span>
    </div>
  );
}
