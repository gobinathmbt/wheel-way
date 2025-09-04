import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, User, ClipboardList, CheckCircle, XCircle, Clock, FileCheck, BarChart3 } from 'lucide-react';

const SupplierSidebar = () => {
  const location = useLocation();

  const navigationItems = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      path: '/supplier/dashboard',
      description: 'Overview and statistics'
    },
    {
      icon: User,
      label: 'Profile',
      path: '/supplier/profile',
      description: 'Supplier profile settings'
    },
    {
      icon: ClipboardList,
      label: 'Quote Requests',
      path: '/supplier/quote-requests',
      description: 'Pending quote requests'
    },
    {
      icon: CheckCircle,
      label: 'Quote Approved',
      path: '/supplier/quote-approved',
      description: 'Approved quotes'
    },
    {
      icon: XCircle,
      label: 'Quote Rejected',
      path: '/supplier/quote-rejected',
      description: 'Rejected quotes'
    },
    {
      icon: Clock,
      label: 'Work In Progress',
      path: '/supplier/work-in-progress',
      description: 'Ongoing work'
    },
    {
      icon: FileCheck,
      label: 'Completed Jobs',
      path: '/supplier/completed-jobs',
      description: 'Finished work'
    }
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-2">
          <Car className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Supplier Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}`} />
              <div className="flex-1">
                <div className={`font-medium ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {item.label}
                </div>
                <div className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default SupplierSidebar;