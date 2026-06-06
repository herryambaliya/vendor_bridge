import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

interface PrivateRouteProps {
  allowedRoles?: ('admin' | 'procurement_officer' | 'manager' | 'vendor')[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.role === 'officer' ? 'procurement_officer' : user.role;
  const mappedAllowed = allowedRoles?.map(r => r === 'officer' ? 'procurement_officer' : r);

  if (mappedAllowed && !mappedAllowed.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and role matches, render the nested routes
  return <Outlet />;
};

export default PrivateRoute;
