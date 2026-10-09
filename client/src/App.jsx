import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Landing from './pages/public/Landing';
import PortalSelect from './pages/public/PortalSelect';
import AuthPage from './pages/public/AuthPage';

import PCLayout from './layouts/PCLayout';
import PCDashboard from './pages/pc/PCDashboard';
import PCStudents from './pages/pc/PCStudents';
import PCLeetCode from './pages/pc/PCLeetCode';
import PCInterviews from './pages/pc/PCInterviews';
import PCLingua from './pages/pc/PCLingua';

import FacultyLayout from './layouts/FacultyLayout';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyStudents from './pages/faculty/FacultyStudents';
import FacultyLeetCode from './pages/faculty/FacultyLeetCode';
import FacultyInterviews from './pages/faculty/FacultyInterviews';
import FacultyLingua from './pages/faculty/FacultyLingua';

import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentInterviews from './pages/student/StudentInterviews';
import ChangePassword from './pages/student/ChangePassword';

import ProtectedRoute from './routes/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Loading session..." />;

  if (user?.role === 'student' && user?.mustChangePassword) {
    return (
      <Routes>
        <Route path="*" element={<ChangePassword />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/portal" element={<PortalSelect />} />
      <Route path="/portal/:role" element={<AuthPage />} />

      <Route path="/pc" element={<ProtectedRoute role="pc"><PCLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/pc/dashboard" replace />} />
        <Route path="dashboard" element={<PCDashboard />} />
        <Route path="students" element={<PCStudents />} />
        <Route path="leetcode" element={<PCLeetCode />} />
        <Route path="interviews" element={<PCInterviews />} />
        <Route path="lingua" element={<PCLingua />} />
      </Route>

      <Route path="/faculty" element={<ProtectedRoute role="faculty"><FacultyLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="students" element={<FacultyStudents />} />
        <Route path="leetcode" element={<FacultyLeetCode />} />
        <Route path="interviews" element={<FacultyInterviews />} />
        <Route path="lingua" element={<FacultyLingua />} />
      </Route>

      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="interviews" element={<StudentInterviews />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
