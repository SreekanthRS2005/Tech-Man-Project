import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/ui/LoadingSpinner';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy-loaded components
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const DomainSelection = lazy(() => import('./pages/assessment/DomainSelection'));
const Round1 = lazy(() => import('./pages/assessment/Round1'));
const Round2 = lazy(() => import('./pages/assessment/Round2'));
const Results = lazy(() => import('./pages/assessment/Results'));
const QuizGame = lazy(() => import('./pages/QuizGame'));

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard\" replace />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard\" replace />} />
          <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard\" replace />} />
          <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to="/dashboard\" replace />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login\" replace />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login\" replace />} />
          
          {/* Assessment Routes */}
          <Route path="/assessment" element={user ? <DomainSelection /> : <Navigate to="/login\" replace />} />
          <Route path="/assessment/:assessmentId/round1" element={user ? <Round1 /> : <Navigate to="/login\" replace />} />
          <Route path="/assessment/:assessmentId/round2" element={user ? <Round2 /> : <Navigate to="/login\" replace />} />
          <Route path="/assessment/:assessmentId/results" element={user ? <Results /> : <Navigate to="/login\" replace />} />
          
          {/* Quiz Game Route */}
          <Route path="/quiz" element={user ? <QuizGame /> : <Navigate to="/login\" replace />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;