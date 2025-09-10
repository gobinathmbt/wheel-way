import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Bell,
  User,
  LogOut,
  Settings,
  Home,
  Users,
  FileText,
  Car,
  Database,
  Cog,
  Lock,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Building2,
  Shield,
  CreditCard,
  Globe,
  UserCog,
  Wrench,
  Building,
  Truck,
  ClipboardList,
  Package,
  BarChart3,
  Search,
  Archive,
} from "lucide-react";
import { authServices, subscriptionServices } from "@/api/services";
import { Badge } from "../ui/badge";
import { Link, useLocation } from "react-router-dom";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavigationItem {
  icon: any;
  label: string;
  path?: string;
  module?: string;
  children?: NavigationItem[];
}

// Cookie utilities with user-specific keys
const getUserSpecificKey = (baseKey: string, userEmail: string | undefined) => {
  if (!userEmail) return baseKey;
  // Create a simple hash of the email to keep cookie names clean
  const hash = userEmail.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${baseKey}_${Math.abs(hash)}`;
};

const setCookie = (name: string, value: string, days: number = 30) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
}) => {
  const { user, logout, completeUser } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [clickedMenu, setClickedMenu] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Generate user-specific cookie keys
  const sidebarCookieKey = getUserSpecificKey("sidebar-collapsed", user?.email);
  const expandedMenusCookieKey = getUserSpecificKey(
    "expanded-menus",
    user?.email
  );

  // Load sidebar state from user-specific cookie on component mount
  useEffect(() => {
    if (user?.email) {
      const savedCollapsedState = getCookie(sidebarCookieKey);
      if (savedCollapsedState !== null) {
        setIsSidebarCollapsed(savedCollapsedState === "true");
      }

      const savedExpandedMenus = getCookie(expandedMenusCookieKey);
      if (savedExpandedMenus) {
        try {
          const expandedArray = JSON.parse(savedExpandedMenus);
          setExpandedMenus(new Set(expandedArray));
        } catch (error) {
          console.error("Error parsing expanded menus cookie:", error);
        }
      }
    }
  }, [user?.email, sidebarCookieKey, expandedMenusCookieKey]);

  // Save sidebar state to user-specific cookie when it changes
  const handleSidebarToggle = () => {
    const newCollapsedState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsedState);
    setCookie(sidebarCookieKey, newCollapsedState.toString());

    // If collapsing, also collapse all expanded menus
    if (newCollapsedState) {
      setExpandedMenus(new Set());
      setCookie(expandedMenusCookieKey, "[]");
      setClickedMenu(null);
    }
  };

  // Save expanded menus state to user-specific cookie
  const toggleMenuExpansion = (menuKey: string) => {
    if (isSidebarCollapsed) return; // Don't toggle if sidebar is collapsed

    const newExpandedMenus = new Set(expandedMenus);
    if (newExpandedMenus.has(menuKey)) {
      newExpandedMenus.delete(menuKey);
    } else {
      newExpandedMenus.add(menuKey);
    }
    setExpandedMenus(newExpandedMenus);
    setCookie(
      expandedMenusCookieKey,
      JSON.stringify(Array.from(newExpandedMenus))
    );
  };

  const { data: userModule } = useQuery({
    queryKey: ["user-module"],
    queryFn: async () => {
      const response = await authServices.getCurrentUserModule();
      return response.data;
    },
  });

  // Get company subscription info
  const { data: companySubscription } = useQuery({
    queryKey: ["company-subscription-info"],
    queryFn: async () => {
      if (
        user?.role === "company_super_admin" ||
        user?.role === "company_admin"
      ) {
        const response =
          await subscriptionServices.getCompanySubscriptionInfo();
        return response.data.data;
      }
      return null;
    },
    enabled: !!(
      user?.role === "company_super_admin" || user?.role === "company_admin"
    ),
  });

  // Show subscription modal for force cases
  useEffect(() => {
    if (
      user?.subscription_modal_force &&
      user?.role === "company_super_admin"
    ) {
      setShowSubscriptionModal(true);
    }
  }, [user]);

  console.log(userModule);

  const getNavigationItems = (): NavigationItem[] => {
    if (user?.role === "master_admin") {
      return [
        { icon: Home, label: "Dashboard", path: "/master/dashboard" },
        { icon: Building2, label: "Companies", path: "/master/companies" },
        { icon: Shield, label: "Permission", path: "/master/permissions" },
        { icon: CreditCard, label: "Plans", path: "/master/plans" },

        { icon: Globe, label: "Master Dropdown", path: "/master/dropdowns" },
        { icon: Cog, label: "Custom Module", path: "/master/custom-modules" },
        {
          icon: Wrench,
          label: "Website Maintenance",
          path: "/master/maintenance",
        },
        { icon: FileText, label: "Global Logs", path: "/master/global-logs" },
        { icon: Database, label: "Vehicle MetaData", path: "/master/vehicle-metadata" },
        { icon: Settings, label: "Settings", path: "/master/settings" },
      ];
    }

    if (user?.role === "company_super_admin") {
      return [
        {
          icon: Home,
          label: "Dashboard",
          path: "/company/dashboard",
          module: "vehicle_dashboard",
        },
        {
          icon: Building,
          label: "Multi Dealership",
          path: "/company/dealerships",
          module: "multi_dealsership",
        },
        {
          icon: Users,
          label: "Users",
          path: "/company/users",
          module: "vehicle_user",
        },
        {
          icon: Shield,
          label: "Permission",
          path: "/company/permissions",
          module: "vehicle_permission",
        },
        {
          icon: Database,
          label: "Dropdown Master",
          path: "/company/dropdown-master",
          module: "dropdown_master",
        },
        {
          icon: Car,
          label: "Master Vehicle",
          module: "master_vehicle",
          children: [
            {
              icon: Car,
              label: "Master Vehicles",
              path: "/vehicles/mastervehicle",
            },
          ],
        },
        {
          icon: Search,
          label: "Inspection",
          module: "vehicle_inspection",
          children: [
            {
              icon: ClipboardList,
              label: "Inspections",
              path: "/vehicles/inspection",
            },
            {
              icon: Cog,
              label: "Inspection Config",
              path: "/company/inspection-config",
            },
          ],
        },
        {
          icon: Archive,
          label: "Trade-in",
          module: "vehicle_tradein",
          children: [
            { icon: Car, label: "Trade-ins", path: "/vehicles/tradein" },
            {
              icon: Settings,
              label: "Tradein Config",
              path: "/company/tradein-config",
            },
          ],
        },

        {
          icon: Globe,
          label: "Ad Publishing",
          module: "ad_publishing",
          children: [
            {
              icon: Globe,
              label: "Advertisements",
              path: "/vehicles/adpublishing",
            },
          ],
        },
        {
          icon: Wrench,
          label: "Workshop",
          module: "work_shop",
          children: [
            { icon: Package, label: "Workshop", path: "/company/workshop" },
            { icon: Truck, label: "Suppliers", path: "/company/suppliers" },
          ],
        },
        {
          icon: UserCog,
          label: "Settings",
          path: "/company/settings",
          module: "company_settings",
        },
      ];
    }

    return [
      {
        icon: BarChart3,
        label: "Dashboard",
        path: "/company/dashboard",
        module: "vehicle_dashboard",
      },
      {
        icon: Search,
        label: "Inspections",
        path: "/vehicles/inspection",
        module: "vehicle_inspection",
      },
      {
        icon: Archive,
        label: "Trade-ins",
        path: "/vehicles/tradein",
        module: "vehicle_tradein",
      },
    ];
  };

  const getFilteredNavigationItems = (): NavigationItem[] => {
    const allNavigationItems = getNavigationItems();

    if (user?.role === "master_admin") {
      return allNavigationItems;
    }

    if (!userModule?.data?.module || !Array.isArray(userModule.data.module)) {
      return allNavigationItems?.filter((item) => !item.module);
    }

    return allNavigationItems.filter((item) => {
      if (!item.module) {
        return true;
      }

      return userModule.data.module.includes(item.module);
    });
  };

  const navigationItems = getFilteredNavigationItems();

  const hasNoModuleAccess =
    (user?.role === "company_admin" || user?.role === "company_super_admin") &&
    (!userModule?.data?.module ||
      !Array.isArray(userModule.data.module) ||
      userModule.data.module.length === 0);

  // Check if current path matches any child path
  const isMenuActive = (item: NavigationItem): boolean => {
    if (item.path && location.pathname === item.path) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => child.path === location.pathname);
    }
    return false;
  };

  // Auto-expand menu if current path is in its children
  useEffect(() => {
    if (!isSidebarCollapsed) {
      const newExpandedMenus = new Set(expandedMenus);
      let hasChanges = false;

      navigationItems.forEach((item, index) => {
        if (item.children) {
          const menuKey = `menu-${index}`;
          const isChildActive = item.children.some(
            (child) => child.path === location.pathname
          );

          if (isChildActive && !expandedMenus.has(menuKey)) {
            newExpandedMenus.add(menuKey);
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        setExpandedMenus(newExpandedMenus);
        setCookie(
          expandedMenusCookieKey,
          JSON.stringify(Array.from(newExpandedMenus))
        );
      }
    }
  }, [location.pathname, isSidebarCollapsed, expandedMenusCookieKey]);

  const NoAccessContent = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
        <p className="text-muted-foreground mb-4">
          You don't have access to any modules. Please contact your
          administrator to get the necessary permissions.
        </p>
        <p className="text-sm text-muted-foreground">
          Administrator can assign module permissions from the User Management
          section.
        </p>
      </div>
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside any popover content
      const popoverContent = document.querySelector(
        "[data-radix-popover-content]"
      );
      const popoverTrigger = document.querySelector(
        "[data-radix-popover-trigger]"
      );

      if (
        popoverContent &&
        !popoverContent.contains(event.target as Node) &&
        popoverTrigger &&
        !popoverTrigger.contains(event.target as Node)
      ) {
        setClickedMenu(null);
      }
    };

    if (clickedMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [clickedMenu]);

  // Handle menu click for collapsed sidebar
  const handleMenuClick = (menuKey: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (clickedMenu === menuKey) {
      setClickedMenu(null);
    } else {
      setClickedMenu(menuKey);
    }
  };

  // Render collapsed menu item with popover for submenus
  const renderCollapsedMenuItem = (item: NavigationItem, index: number) => {
    const Icon = item.icon;
    const isActive = isMenuActive(item);
    const menuKey = `menu-${index}`;
    const isOpen = clickedMenu === menuKey;

    if (item.children && item.children.length > 0) {
      return (
        <div key={menuKey}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div>
                <Popover
                  open={isOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      setClickedMenu(null);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 cursor-pointer w-full ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={(e) => handleMenuClick(menuKey, e)}
                      type="button"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    className="w-48 p-2"
                    sideOffset={8}
                    align="start"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-sm px-2 py-1 border-b mb-2">
                        {item.label}
                      </div>
                      {item.children.map((child, childIndex) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.path;

                        return (
                          <Link
                            key={childIndex}
                            to={child.path || "#"}
                            className={`flex items-center p-2 rounded-md transition-colors text-sm ${
                              isChildActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            }`}
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              setClickedMenu(null);
                            }}
                          >
                            <ChildIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    } else {
      return (
        <Tooltip key={index} delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              to={item.path || "#"}
              className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => {
                setIsMobileMenuOpen(false);
                setClickedMenu(null);
              }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
  };

  const renderNavigationItem = (item: NavigationItem, index: number) => {
    if (isSidebarCollapsed) {
      return renderCollapsedMenuItem(item, index);
    }

    const Icon = item.icon;
    const isActive = isMenuActive(item);
    const menuKey = `menu-${index}`;
    const isExpanded = expandedMenus.has(menuKey);

    if (item.children && item.children.length > 0) {
      // Parent item with children (expanded sidebar)
      return (
        <Collapsible
          key={menuKey}
          open={isExpanded}
          onOpenChange={() => toggleMenuExpansion(menuKey)}
        >
          <CollapsibleTrigger
            className={`w-full flex items-center rounded-lg transition-all duration-200 p-3 space-x-3 justify-between ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </div>
            <div className="ml-auto">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child, childIndex) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.path;

                return (
                  <Link
                    key={childIndex}
                    to={child.path || "#"}
                    className={`flex items-center p-2 rounded-lg transition-colors text-sm ${
                      isChildActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChildIcon className="h-4 w-4 mr-3" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    } else {
      // Regular navigation item (expanded sidebar)
      return (
        <Link
          key={index}
          to={item.path || "#"}
          className={`flex items-center rounded-lg transition-all duration-200 p-3 space-x-3 ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Icon className="h-5 w-5 flex-shrink-0" />
          <span>{item.label}</span>
        </Link>
      );
    }
  };

  const Sidebar = ({ className = "" }) => (
    <div
      className={`flex flex-col h-full bg-card border-r transition-all duration-300 ease-in-out ${className} ${
        isSidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo and Toggle Button */}
      <div className="p-4 flex items-center justify-between">
        <div
          className={`flex items-center transition-all duration-300 ${
            isSidebarCollapsed ? "justify-center w-full" : "space-x-2"
          }`}
        >
          {!isSidebarCollapsed && (
            <>
              <Car className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Vehcile Erp</span>
            </>
          )}
          {isSidebarCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Car className="h-6 w-6 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Vehcile Erp</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {!isSidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-100"
            onClick={handleSidebarToggle}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation Items with Scroll */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto py-4">
        {navigationItems.length > 0 ? (
          <TooltipProvider>
            {navigationItems.map((item, index) =>
              renderNavigationItem(item, index)
            )}
          </TooltipProvider>
        ) : (
          <div
            className={`text-center p-4 text-muted-foreground transition-all duration-300 ${
              isSidebarCollapsed ? "px-2" : ""
            }`}
          >
            <Lock className="h-6 w-6 mx-auto mb-2" />
            {!isSidebarCollapsed && (
              <p className="text-sm">No modules accessible</p>
            )}
          </div>
        )}
      </nav>

      {/* User Info and Logout */}
      <div className="p-3 border-t">
        <div
          className={`flex items-center transition-all duration-300 ${
            isSidebarCollapsed ? "justify-center" : "space-x-3 mb-3"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden transition-all duration-300">
              <p className="font-medium text-sm truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              onClick={logout}
              variant="ghost"
              className={`w-full transition-all duration-300 ${
                isSidebarCollapsed ? "p-2 justify-center" : "justify-start"
              }`}
            >
              <LogOut className="h-4 w-4" />
              {!isSidebarCollapsed && <span className="ml-2">Logout</span>}
            </Button>
          </TooltipTrigger>
          {isSidebarCollapsed && (
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden absolute top-4 left-4 z-10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar className="w-full" />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {isSidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex"
                onClick={handleSidebarToggle}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-2xl font-bold">
              {hasNoModuleAccess ? "Access Restricted" : title}
            </h1>
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

            {/* Company ID Chip */}
            {completeUser?.company_id?._id && (
              <Badge variant="outline" className="ml-2">
                Company ID: {completeUser.company_id._id}
              </Badge>
            )}

            {/* Dealership Chips */}
            {completeUser?.dealership_ids?.length > 0 && (
              <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-600">
                Dealerships:{" "}
                {completeUser.dealership_ids
                  .map((d) => d.dealership_name)
                  .join(", ")}
              </Badge>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {hasNoModuleAccess ? <NoAccessContent /> : children}
        </main>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={
          user?.subscription_modal_force
            ? undefined
            : () => setShowSubscriptionModal(false)
        }
        canClose={!user?.subscription_modal_force}
        mode="new"
        onSuccess={() => setShowSubscriptionModal(false)}
        fullScreen={user?.subscription_modal_force} // Add this line
      />
    </div>
  );
};

export default DashboardLayout;
