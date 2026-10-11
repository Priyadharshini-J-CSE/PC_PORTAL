import Icon from './Icon';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--t2)' }}>
      <div style={{ fontSize: '1.8rem', marginBottom: 12, color: 'var(--o)', animation: 'spin 1s linear infinite', display: 'inline-block' }}>
        <Icon name="rotate" />
      </div>
      <div>{text}</div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
