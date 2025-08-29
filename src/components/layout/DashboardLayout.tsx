import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Bell, User, LogOut, Settings, Home, Users, FileText, Car, Database, Cog } from 'lucide-react';
import { authServices } from '@/api/services';
import { Link, useLocation } from 'react-router-dom';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavigationItem {
  icon: any;
  label: string;
  path: string;
  module?: string; // Add module property for access control
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: userModule } = useQuery({
    queryKey: ['user-module'],
    queryFn: async () => {
      const response = await authServices.getCurrentUserModule();
      return response.data;
    }
  });

  console.log(userModule);

  const getNavigationItems = (): NavigationItem[] => {
    if (user?.role === 'master_admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/master/dashboard' },
        { icon: Users, label: 'Companies', path: '/master/companies' },
        { icon: Users, label: 'Permission', path: '/master/permissions' },
        { icon: FileText, label: 'Plans', path: '/master/plans' },
        { icon: Settings, label: 'Settings', path: '/master/settings' },
        { icon: Settings, label: 'Master Dropdown', path: '/master/dropdowns' },
      ];
    }

    if (user?.role === 'company_super_admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/company/dashboard' },
        { icon: Users, label: 'Users', path: '/company/users' },
        { icon: Users, label: 'Permission', path: '/company/permissions' },
        { icon: Database, label: 'Dropdown Master', path: '/company/dropdown-master' },
        { icon: Cog, label: 'Inspection Config', path: '/company/inspection-config'},
        { icon: Cog, label: 'Tradein Config', path: '/company/tradein-config' },
        { icon: Car, label: 'Inspections', path: '/vehicles/inspection' },
        { icon: Car, label: 'Trade-ins', path: '/vehicles/tradein' },
        { icon: Settings, label: 'Settings', path: '/company/settings' },
      ];
    }

    // For regular users, define all possible navigation items with their required modules
    return [
      { icon: Home, label: 'Dashboard', path: '/company/dashboard', module: 'vehicle_dashboard' },
      { icon: Car, label: 'Inspections', path: '/vehicles/inspection', module: 'vehicle_inspection' },
      { icon: Car, label: 'Trade-ins', path: '/vehicles/tradein', module: 'vehicle_tradein' },
    ];
  };

  // Filter navigation items based on user modules
  const getFilteredNavigationItems = (): NavigationItem[] => {
    const allNavigationItems = getNavigationItems();
    
    // If user is master_admin or company_super_admin, show all items
    if (user?.role === 'master_admin' || user?.role === 'company_super_admin') {
      return allNavigationItems;
    }

    // For other roles, filter based on user modules
    if (!userModule?.data?.module || !Array.isArray(userModule.data.module)) {
      // If no modules assigned, only show items without module requirement
      return allNavigationItems.filter(item => !item.module);
    }

    // Filter items based on user's assigned modules
    return allNavigationItems.filter(item => {
      // If item doesn't require a module, always show it
      if (!item.module) {
        return true;
      }
      
      // Check if user has the required module
      return userModule.data.module.includes(item.module);
    });
  };

  const navigationItems = getFilteredNavigationItems();

  const Sidebar = ({ className = '' }) => (
    <div className={`flex flex-col h-full bg-card border-r ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Car className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">VehiclePro</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user?.email}</p>
            <p className="text-sm text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Link to="/docs">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Docs
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;