
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/auth/AuthContext';
import ProtectedRoute from '@/auth/ProtectedRoute';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import RegisterCompany from '@/pages/RegisterCompany';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import NoAccess from '@/pages/NoAccess';
import Documentation from '@/pages/Documentation';

// Master Admin Pages
import MasterDashboard from '@/pages/master_admin/Dashboard';
import MasterCompanies from '@/pages/master_admin/Companies';
import MasterPlans from '@/pages/master_admin/Plans';
import MasterPermissions from '@/pages/master_admin/Permissions';
import MasterDropdownMaster from '@/pages/master_admin/DropdownMaster';
import MasterSettings from '@/pages/master_admin/Settings';

// Company Pages
import CompanyDashboard from '@/pages/company/Dashboard';
import CompanyUsers from '@/pages/company/Users';
import CompanyUserPermissions from '@/pages/company/UserPermissions';
import CompanyDropdownMaster from '@/pages/company/DropdownMaster';
import CompanyInspectionConfig from '@/pages/company/InspectionConfig';
import CompanyTradeinConfig from '@/pages/company/TradeinConfig';
import CompanySettings from '@/pages/company/Settings';
import CompanySubscription from '@/pages/company/Subscription';

// Vehicle Pages
// import VehicleStock from '@/pages/vehicles/VehicleStock';
import InspectionList from '@/pages/vehicles/InspectionList';
import TradeinList from '@/pages/vehicles/TradeinList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register-company" element={<RegisterCompany />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/no-access" element={<NoAccess />} />

              {/* Master Admin Routes */}
              <Route
                path="/master/*"
                element={
                  <ProtectedRoute requiredRole="master_admin">
                    <Routes>
                      <Route path="/" element={<Navigate to="/master/dashboard" replace />} />
                      <Route path="/dashboard" element={<MasterDashboard />} />
                      <Route path="/companies" element={<MasterCompanies />} />
                      <Route path="/plans" element={<MasterPlans />} />
                      <Route path="/permissions" element={<MasterPermissions />} />
                      <Route path="/dropdown-master" element={<MasterDropdownMaster />} />
                      <Route path="/settings" element={<MasterSettings />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Company Routes */}
              <Route
                path="/company/*"
                element={
                  <ProtectedRoute requiredRole={['company_super_admin', 'company_admin']}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/company/dashboard" replace />} />
                      <Route path="/dashboard" element={<CompanyDashboard />} />
                      <Route path="/users" element={<CompanyUsers />} />
                      <Route path="/user-permissions" element={<CompanyUserPermissions />} />
                      <Route path="/dropdown-master" element={<CompanyDropdownMaster />} />
                      <Route path="/inspection-config" element={<CompanyInspectionConfig />} />
                      <Route path="/tradein-config" element={<CompanyTradeinConfig />} />
                      <Route path="/settings" element={<CompanySettings />} />
                      <Route path="/subscription" element={<CompanySubscription />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Vehicle Routes */}
              <Route
                path="/vehicles/*"
                element={
                  <ProtectedRoute requiredRole={['company_super_admin', 'company_admin']}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/vehicles/stock" replace />} />
                      {/* <Route path="/stock" element={<VehicleStock />} /> */}
                      <Route path="/inspections" element={<InspectionList />} />
                      <Route path="/tradein" element={<TradeinList />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />

              {/* Subscription Route (accessible for inactive subscriptions) */}
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute requiredRole="company_super_admin" allowInactiveSubscription>
                    <CompanySubscription />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
