import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import UsersPage from '../pages/users/UsersPage';
import RolesPage from '../pages/roles/RolesPage';
import AccessControlPage from '../pages/access-control/AccessControlPage';
import DepartmentsPage from '../pages/departments/DepartmentsPage';
import BranchesPage from '../pages/branches/BranchesPage';
import OrganizationPage from '../pages/organization/OrganizationPage';
import AuditLogsPage from '../pages/audit-logs/AuditLogsPage';
import WishlistPage from '../pages/wishlist/WishlistPage';
import ReviewsPage from '../pages/reviews/ReviewsPage';
import CustomersPage from '../pages/customers/CustomersPage';
import SalesPage from '../pages/sales/SalesPage';
import AccountingPage from '../pages/accounting/AccountingPage';
import BillingPage from '../pages/billing/BillingPage';
import CategoriesPage from '../pages/CategoriesPage';
import ProductsPage from '../pages/ProductsPage';
import WarehousesPage from '../pages/WarehousesPage';
import ProcurementPage from '../pages/ProcurementPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public Route ── */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Protected Application Layout ── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Core 8 Assigned Modules */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute roles={['admin']}>
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/access-control"
          element={
            <ProtectedRoute roles={['admin']}>
              <AccessControlPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/branches"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <OrganizationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute roles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/audit" element={<Navigate to="/audit-logs" replace />} />

        {/* Active Catalog Modules */}
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />

        {/* Inventory & Supply Modules */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/procurement" element={<ProcurementPage />} />

        {/* Commercial & Financial Modules */}
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/crm" element={<Navigate to="/customers" replace />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/accounting" element={<AccountingPage />} />

        <Route path="/payments" element={<Navigate to="/dashboard" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Fallback routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
