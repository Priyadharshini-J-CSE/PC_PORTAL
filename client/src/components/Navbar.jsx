import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();

  const isPortal = location.pathname.startsWith('/pc') ||
    location.pathname.startsWith('/faculty') ||
    location.pathname.startsWith('/student');
  if (isPortal) return null;

  return (
    <header>
      <Link to="/" className="logo">
        <Icon name="bullseye" style={{ color: 'var(--o)' }} /> SECE Placement
      </Link>
      <nav>
        <Link to="/" className="nb"><Icon name="home" /> Home</Link>
        <a
          href="/#how"
          className="nb"
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          How It Works
        </a>
        {user ? (
          <Link to={`/${user.role}/dashboard`} className="nb cta">
            <Icon name="gauge" /> Dashboard
          </Link>
        ) : (
          <Link to="/portal" className="nb cta">
            <Icon name="right-to-bracket" /> Portal
          </Link>
        )}
      </nav>
    </header>
  );
}
