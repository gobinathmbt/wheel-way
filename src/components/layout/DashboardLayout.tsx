
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/ui/sidebar';
import SubscriptionBanner from './SubscriptionBanner';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <SubscriptionBanner />
          {title && (
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            </div>
          )}
          {children || <Outlet />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
