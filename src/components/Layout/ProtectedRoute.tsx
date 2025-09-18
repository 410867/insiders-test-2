import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // можно заменить на спиннер
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};


export default ProtectedRoute;
