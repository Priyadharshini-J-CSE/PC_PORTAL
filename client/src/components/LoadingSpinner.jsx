export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--t2)' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>⟳</div>
      {text}
    </div>
  );
}
