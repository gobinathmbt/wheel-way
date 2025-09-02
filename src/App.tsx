
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RegisterCompany from "./pages/RegisterCompany";
import NoAccess from "./pages/NoAccess";
import Unauthorized from "./pages/Unauthorized";

// Master Admin Pages
import MasterDashboard from "./pages/master_admin/Dashboard";
import MasterCompanies from "./pages/master_admin/Companies";
import MasterPlans from "./pages/master_admin/Plans";
import MasterSettings from "./pages/master_admin/Settings";
import Permissions from './pages/master_admin/Permissions';
import MasterDropdownMaster from "./pages/master_admin/DropdownMaster";

// Company Pages  
import CompanyDashboard from "./pages/company/Dashboard";
import CompanyUsers from "./pages/company/Users";
import CompanySettings from "./pages/company/Settings";
import DropdownMaster from "./pages/company/DropdownMaster";
import InspectionConfig from "./pages/company/InspectionConfig";
import TradeinConfig from "./pages/company/TradeinConfig";
import UserPermissions from './pages/company/UserPermissions';

// Vehicle Pages
import InspectionList from "./pages/vehicles/InspectionList";
import TradeinList from "./pages/vehicles/TradeinList";

import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-company" element={<RegisterCompany />} />
            <Route path="/no-access" element={<NoAccess />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Master Admin Routes */}
            <Route path="/master/dashboard" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterDashboard />
              </ProtectedRoute>
            } />
            <Route path="/master/companies" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterCompanies />
              </ProtectedRoute>
            } />
            <Route path="/master/plans" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterPlans />
              </ProtectedRoute>
            } />
            <Route path="/master/permissions" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <Permissions />
              </ProtectedRoute>
            } />
            <Route path="/master/settings" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterSettings />
              </ProtectedRoute>
            } />
            <Route path="/master/dropdowns" element={
              <ProtectedRoute allowedRoles={['master_admin']}>
                <MasterDropdownMaster />
              </ProtectedRoute>
            } />
            
            {/* Company Routes */}
            <Route path="/company/dashboard" element={
              <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="vehicle_dashboard">
                <CompanyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/company/users" element={
              <ProtectedRoute allowedRoles={['company_super_admin']}>
                <CompanyUsers />
              </ProtectedRoute>
            } />
            <Route path="/company/permissions" element={
              <ProtectedRoute allowedRoles={['company_super_admin']}>
                <UserPermissions />
              </ProtectedRoute>
            } />
            <Route path="/company/settings" element={
              <ProtectedRoute allowedRoles={['company_super_admin']}>
                <CompanySettings />
              </ProtectedRoute>
            } />
            <Route path="/company/dropdown-master" element={
              <ProtectedRoute allowedRoles={['company_super_admin']}>
                <DropdownMaster />
              </ProtectedRoute>
            } />
            <Route path="/company/inspection-config" element={
              <ProtectedRoute allowedRoles={['company_super_admin']}>
                <InspectionConfig />
              </ProtectedRoute>
            } />
            <Route path="/company/tradein-config" element={
              <ProtectedRoute allowedRoles={['company_super_admin']}>
                <TradeinConfig />
              </ProtectedRoute>
            } />
            
            {/* Vehicle Routes with Module Requirements */}
            <Route path="/vehicles/inspection" element={
              <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="vehicle_inspection">
                <InspectionList />
              </ProtectedRoute>
            } />
            <Route path="/vehicles/tradein" element={
              <ProtectedRoute allowedRoles={['company_super_admin', 'company_admin']} requiredModule="vehicle_tradein">
                <TradeinList />
              </ProtectedRoute>
            } />
            
            {/* Documentation */}
            <Route path="/docs" element={
              <ProtectedRoute allowedRoles={['master_admin', 'company_super_admin', 'company_admin']}>
                <Documentation />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
