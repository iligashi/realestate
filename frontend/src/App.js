import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import SessionProvider from './components/SessionProvider';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Profile/ProfilePage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import SellerDashboard from './pages/Seller/SellerDashboard';
import BuyerDashboard from './pages/Buyer/BuyerDashboard';
import PropertyListPage from './pages/Properties/PropertyListPage';
import PropertyDetailPage from './pages/Properties/PropertyDetailPage';
import PropertyFormPage from './pages/Properties/PropertyFormPage';
import AdminRoute from './components/Auth/AdminRoute';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <SessionProvider>
      <Layout>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/seller" 
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/buyer" 
          element={
            <ProtectedRoute>
              <BuyerDashboard />
            </ProtectedRoute>
          } 
        />
        {/* Properties Routes */}
        <Route path="/properties" element={<PropertyListPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route 
          path="/properties/create" 
          element={
            <ProtectedRoute>
              <PropertyFormPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/properties/:id/edit" 
          element={
            <ProtectedRoute>
              <PropertyFormPage />
            </ProtectedRoute>
          } 
        />
        </Routes>
      </Layout>
    </SessionProvider>
  );
}

export default App;
