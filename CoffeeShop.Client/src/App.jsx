import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { LoginPage } from './pages/Login/LoginPage';
import { PosPage } from './pages/Pos/PosPage';
import { OrderDetailPage } from './pages/Orders/OrderDetailPage';
import { OrderHistoryPage } from './pages/Orders/OrderHistoryPage';
import { ProductManagementPage } from './pages/Products/ProductManagementPage';
import { CategoryManagementPage } from './pages/Categories/CategoryManagementPage';
import { TableManagementPage } from './pages/Tables/TableManagementPage';
import { UserManagementPage } from './pages/Users/UserManagementPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';

// Layout wrapper for authenticated pages
const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Root redirector based on user role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'Admin' ? <Navigate to="/dashboard" replace /> : <Navigate to="/pos" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Staff & Admin Routes */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['Admin', 'Staff']}>
                <AppLayout>
                  <PosPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute roles={['Admin', 'Staff']}>
                <AppLayout>
                  <OrderDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/history"
            element={
              <ProtectedRoute roles={['Admin', 'Staff']}>
                <AppLayout>
                  <OrderHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout>
                  <ProductManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout>
                  <CategoryManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tables"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout>
                  <TableManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['Admin']}>
                <AppLayout>
                  <UserManagementPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
