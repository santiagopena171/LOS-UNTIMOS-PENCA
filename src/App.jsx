import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Admin/AdminDashboard';
import UserDashboard from './components/User/UserDashboard';

// Loading component
const Loading = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    color: 'white',
    gap: '20px'
  }}>
    <div className="spinner"></div>
    <p>Cargando...</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, userRole } = useAuth();

  console.log('ProtectedRoute - User:', currentUser?.email, 'Role:', userRole);

  if (!currentUser) {
    console.log('No user, redirecting to /');
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log('Wrong role, redirecting to correct dashboard');
    return <Navigate to={userRole === 'admin' ? '/admin' : '/user'} replace />;
  }

  return children;
};

// Main App Router
const AppRoutes = () => {
  const { currentUser, userRole } = useAuth();

  console.log('AppRoutes - User:', currentUser?.email, 'Role:', userRole);

  // Si hay usuario pero aún no se cargó el rol, mostrar cargando
  if (currentUser && !userRole) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          currentUser ? (
            userRole === 'admin' 
              ? <Navigate to="/admin" replace /> 
              : <Navigate to="/user" replace />
          ) : (
            <Login />
          )
        } 
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/user"
        element={
          <ProtectedRoute requiredRole="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
