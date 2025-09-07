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
      description: 'Overview and statistics',
      count: 0
    },
    {
      icon: User,
      label: 'Profile',
      path: '/supplier/profile',
      description: 'Supplier profile settings',
      count: 0
    },
    {
      icon: ClipboardList,
      label: 'Quote Requests',
      path: '/supplier/quotes/quote_request',
      description: 'Pending quote requests',
      count: 0
    },
    {
      icon: CheckCircle,
      label: 'Quote Approved',
      path: '/supplier/quotes/quote_approved',
      description: 'Approved quotes',
      count: 0
    },
    {
      icon: XCircle,
      label: 'Quote Rejected',
      path: '/supplier/quotes/quote_rejected',
      description: 'Rejected quotes',
      count: 0
    },
    {
      icon: Clock,
      label: 'Work In Progress',
      path: '/supplier/quotes/work_in_progress',
      description: 'Ongoing work',
      count: 0
    },
    {
      icon: FileCheck,
      label: 'Work Review',
      path: '/supplier/quotes/work_review',
      description: 'Work under review',
      count: 0
    },
    {
      icon: FileCheck,
      label: 'Completed Jobs',
      path: '/supplier/quotes/completed_jobs',
      description: 'Finished work',
      count: 0
    },
    {
      icon: XCircle,
      label: 'Rework',
      path: '/supplier/quotes/rework',
      description: 'Rework required',
      count: 0
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
                      {item.count > 0 && (
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          isActive ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {item.count}
                        </div>
                      )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default SupplierSidebar;