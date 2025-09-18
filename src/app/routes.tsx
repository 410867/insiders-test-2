import React from 'react';
import { RouteObject } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import RoomsPage from '../pages/RoomsPage';
import BookingsPage from '../pages/BookingsPage';
import ProtectedRoute from '../components/Layout/ProtectedRoute';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RoomsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/bookings',
    element: (
      <ProtectedRoute>
        <BookingsPage />
      </ProtectedRoute>
    ),
  },
];
