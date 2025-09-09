import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Car,
  BarChart3,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  Settings,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SupplierLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavigationItem {
  icon: any;
  label: string;
  path: string;
  description?: string;
  count?: number;
}

const SupplierLayout: React.FC<SupplierLayoutProps> = ({
  children,
  title,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Get supplier info from session storage
  const supplierInfo = JSON.parse(sessionStorage.getItem('supplier_info') || '{}');

  const navigationItems: NavigationItem[] = [
    {
      icon: BarChart3,
      label: 'Dashboard',
      path: '/supplier/dashboard',
      description: 'Overview and statistics',
    },
    {
      icon: User,
      label: 'Profile',
      path: '/supplier/profile',
      description: 'Supplier profile settings',
    },
    {
      icon: ClipboardList,
      label: 'Quote Requests',
      path: '/supplier/quotes/quote_request',
      description: 'Pending quote requests',
    },
    {
      icon: CheckCircle,
      label: 'Quote Approved',
      path: '/supplier/quotes/quote_approved',
      description: 'Approved quotes',
    },
    {
      icon: XCircle,
      label: 'Quote Rejected',
      path: '/supplier/quotes/quote_rejected',
      description: 'Rejected quotes',
    },
    {
      icon: Clock,
      label: 'Work In Progress',
      path: '/supplier/quotes/work_in_progress',
      description: 'Ongoing work',
    },
    {
      icon: FileCheck,
      label: 'Work Review',
      path: '/supplier/quotes/work_review',
      description: 'Work under review',
    },
    {
      icon: FileCheck,
      label: 'Completed Jobs',
      path: '/supplier/quotes/completed_jobs',
      description: 'Finished work',
    },
    {
      icon: XCircle,
      label: 'Rework',
      path: '/supplier/quotes/rework',
      description: 'Rework required',
    }
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('supplier_token');
    sessionStorage.removeItem('supplier_info');
    navigate('/supplier/login');
  };

  const isMenuActive = (item: NavigationItem): boolean => {
    return location.pathname === item.path;
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex flex-col h-full ${isMobile ? 'w-full' : ''}`}>
      {/* Logo */}
      <div className={`p-6 border-b ${isSidebarCollapsed && !isMobile ? 'px-4' : ''}`}>
        <div className="flex items-center space-x-2">
          <Car className="h-8 w-8 text-primary flex-shrink-0" />
          {(!isSidebarCollapsed || isMobile) && (
            <div>
              <span className="text-xl font-bold">Supplier Portal</span>
              {supplierInfo?.business_name && (
                <p className="text-xs text-muted-foreground truncate">
                  {supplierInfo.business_name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 p-4 space-y-2 overflow-y-auto ${isSidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isMenuActive(item);
          
          if (isSidebarCollapsed && !isMobile) {
            return (
              <TooltipProvider key={item.path}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-sm' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'}`} />
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {item.label}
                </div>
                {item.description && (
                  <div className={`text-xs truncate ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {item.description}
                  </div>
                )}
              </div>
              {item.count && item.count > 0 && (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="text-xs flex-shrink-0"
                >
                  {item.count}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t ${isSidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full ${isSidebarCollapsed && !isMobile ? 'h-12 px-2' : 'justify-start'}`}
            >
              <User className="h-5 w-5 flex-shrink-0" />
              {(!isSidebarCollapsed || isMobile) && (
                <div className="ml-2 text-left flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {supplierInfo?.contact_person || 'Supplier'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {supplierInfo?.email || ''}
                  </div>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <div className="space-y-2">
              <Link
                to="/supplier/profile"
                className="flex items-center space-x-2 w-full p-2 hover:bg-accent rounded-sm"
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Profile Settings</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:flex flex-col bg-card border-r transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}>
          <SidebarContent />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>

              {/* Desktop Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex"
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                <p className="text-sm text-muted-foreground">
                  {supplierInfo?.business_name || 'Supplier Portal'}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                  0
                </Badge>
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SupplierLayout;