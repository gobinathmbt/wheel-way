// src/pages/master_admin/GlobalLogs.tsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Filter,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Eye,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { logServices } from "@/api/services";
import { format } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { DateRange } from "react-day-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Log {
  _id: string;
  event_type: string;
  event_action: string;
  event_description: string;
  user_id?: {
    _id: string;
    username: string;
    email: string;
  };
  company_id?: {
    _id: string;
    company_name: string;
  };
  user_role: string;
  ip_address: string;
  request_method: string;
  request_url: string;
  response_status: number;
  response_time_ms: number;
  severity: string;
  status: string;
  created_at: string;
  resource_type?: string;
  resource_id?: string;
  error_message?: string;
}

interface LogsResponse {
  data: Log[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_records: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: {
    event_type: string | null;
    severity: string | null;
    user_id: string | null;
    company_id: string | null;
    date_range: {
      start: string | null;
      end: string | null;
    };
    search: string | null;
  };
}

interface AnalyticsResponse {
  analytics: {
    summary: {
      total_events: number;
      total_errors: number;
      total_warnings: number;
      avg_response_time: number;
      p95_response_time: number;
    };
    event_types: Array<{ _id: string; count: number }>;
    severity_distribution: Array<{ _id: string; count: number }>;
    daily_activity: Array<{
      _id: string;
      total_events: number;
      errors: number;
      warnings: number;
      avg_response_time: number;
    }>;
    top_users: Array<{
      _id: string;
      activity_count: number;
      user: { username: string; email: string; role: string };
    }>;
    response_time_stats: {
      avg_response_time: number;
      min_response_time: number;
      max_response_time: number;
      p95_response_time: number;
    };
    error_rate_by_endpoint: Array<{
      _id: string;
      total_requests: number;
      error_requests: number;
      error_rate: number;
    }>;
    period_days: number;
    date_range: {
      start: string | null;
      end: string | null;
    };
  };
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  company_id?: {
    _id: string;
    company_name: string;
  };
}

interface Company {
  _id: string;
  company_name: string;
  is_active: boolean;
}

const GlobalLogs: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 15,
    event_type: "",
    event_action: "",
    severity: "",
    status: "",
    user_id: "",
    company_id: "",
    user_role: "",
    request_method: "",
    response_status: "",
    resource_type: "",
    ip_address: "",
    search: "",
    start_date: "",
    end_date: "",
    sort_by: "created_at",
    sort_order: "desc",
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch logs
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<LogsResponse>({
    queryKey: ["global-logs", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value.toString());
      });

      const response = await logServices.getLogs(params.toString());
      return response.data;
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading } =
    useQuery<AnalyticsResponse>({
      queryKey: [
        "log-analytics",
        filters.start_date,
        filters.end_date,
        filters.company_id,
        filters.event_type,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.start_date) params.append("start_date", filters.start_date);
        if (filters.end_date) params.append("end_date", filters.end_date);
        if (filters.company_id && filters.company_id !== "all")
          params.append("company_id", filters.company_id);
        if (filters.event_type && filters.event_type !== "all")
          params.append("event_type", filters.event_type);
        params.append("days", "30");

        const response = await logServices.getLogAnalytics(params.toString());
        return response.data;
      },
      staleTime: 60000, // Cache for 1 minute
    });

  // Fetch users for filters
  const { data: usersData } = useQuery<{ data: User[] }>({
    queryKey: ["users-for-logs"],
    queryFn: async () => {
      const response = await logServices.getLogUsers();
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch companies for filters
  const { data: companiesData } = useQuery<{ data: Company[] }>({
    queryKey: ["companies-for-logs"],
    queryFn: async () => {
      const response = await logServices.getLogCompanies();
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? parseInt(value) : 1, // Reset to first page when filters change, except for page itself
    }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setFilters((prev) => ({
      ...prev,
      start_date: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      end_date: range?.to ? format(range.to, "yyyy-MM-dd") : "",
      page: 1,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim(),
      page: 1,
    }));
  };

  const handleQuickFilter = (filterType: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 15,
      event_type: "",
      event_action: "",
      severity: "",
      status: "",
      user_id: "",
      company_id: "",
      user_role: "",
      request_method: "",
      response_status: "",
      resource_type: "",
      ip_address: "",
      search: "",
      start_date: "",
      end_date: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
    setDateRange(undefined);
    setSearchInput("");
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all" && key !== "page" && key !== "limit") {
          params.append(key, value.toString());
        }
      });

      const response = await logServices.exportLogs(params.toString());
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `logs-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      // You might want to add a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetails = (log: Log) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "critical":
        return "destructive";
      case "warning":
        return "default"; // Changed from "warning" to "default"
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default"; // Changed from "success" to "default"
      case "failure":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getResponseStatusColor = (status: number) => {
    if (status >= 500) return "destructive";
    if (status >= 400) return "default"; // Changed from "warning" to "default"
    if (status >= 300) return "secondary";
    if (status >= 200) return "default"; // Changed from "success" to "default"
    return "secondary";
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <DashboardLayout title="Master System Log Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Global System Logs</h1>
            <p className="text-muted-foreground">
              Monitor and analyze system activities across all operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        {analyticsData && !analyticsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsData.analytics.summary.total_events.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {analyticsData.analytics.summary.total_errors.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {analyticsData.analytics.summary.total_warnings.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatResponseTime(
                    Math.round(
                      analyticsData.analytics.summary.avg_response_time || 0
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  P95 Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatResponseTime(
                    Math.round(
                      analyticsData.analytics.summary.p95_response_time || 0
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Quick Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.severity === "error" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  handleQuickFilter(
                    "severity",
                    filters.severity === "error" ? "" : "error"
                  )
                }
              >
                Errors Only
              </Button>
              <Button
                variant={filters.severity === "warning" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  handleQuickFilter(
                    "severity",
                    filters.severity === "warning" ? "" : "warning"
                  )
                }
              >
                Warnings Only
              </Button>
              <Button
                variant={
                  filters.event_type === "api_call" ? "default" : "outline"
                }
                size="sm"
                onClick={() =>
                  handleQuickFilter(
                    "event_type",
                    filters.event_type === "api_call" ? "" : "api_call"
                  )
                }
              >
                API Calls
              </Button>
              <Button
                variant={filters.event_type === "auth" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  handleQuickFilter(
                    "event_type",
                    filters.event_type === "auth" ? "" : "auth"
                  )
                }
              >
                Authentication
              </Button>
              <Button
                variant={filters.status === "failure" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  handleQuickFilter(
                    "status",
                    filters.status === "failure" ? "" : "failure"
                  )
                }
              >
                Failed Operations
              </Button>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Event Type */}
                <Select
                  value={filters.event_type || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("event_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Event Types</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="user_management">
                      User Management
                    </SelectItem>
                    <SelectItem value="vehicle_operation">
                      Vehicle Operations
                    </SelectItem>
                    <SelectItem value="inspection">Inspections</SelectItem>
                    <SelectItem value="tradein">Trade-ins</SelectItem>
                    <SelectItem value="configuration">Configuration</SelectItem>
                    <SelectItem value="api_call">API Calls</SelectItem>
                    <SelectItem value="system_error">System Errors</SelectItem>
                    <SelectItem value="security_event">
                      Security Events
                    </SelectItem>
                    <SelectItem value="queue_operation">
                      Queue Operations
                    </SelectItem>
                    <SelectItem value="system_operation">
                      System Operations
                    </SelectItem>
                    <SelectItem value="supplier_operation">
                      Supplier Operations
                    </SelectItem>
                    <SelectItem value="workshop_operation">
                      Workshop Operations
                    </SelectItem>
                    <SelectItem value="dealership_operation">
                      Dealership Operations
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Severity */}
                <Select
                  value={filters.severity || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("severity", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                {/* Request Method */}
                <Select
                  value={filters.request_method || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("request_method", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="HTTP Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>

                {/* User */}
                <Select
                  value={filters.user_id || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("user_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {usersData?.data?.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Company */}
                <Select
                  value={filters.company_id || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("company_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companiesData?.data?.map((company) => (
                      <SelectItem key={company._id} value={company._id}>
                        {company.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* User Role */}
                <Select
                  value={filters.user_role || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("user_role", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="User Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="master_admin">Master Admin</SelectItem>
                    <SelectItem value="company_super_admin">
                      Company Super Admin
                    </SelectItem>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                    <SelectItem value="inspection_manager">
                      Inspection Manager
                    </SelectItem>
                    <SelectItem value="inspector">Inspector</SelectItem>
                    <SelectItem value="supplier_admin">
                      Supplier Admin
                    </SelectItem>
                    <SelectItem value="workshop_admin">
                      Workshop Admin
                    </SelectItem>
                    <SelectItem value="dealership_admin">
                      Dealership Admin
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Response Status */}
                <Input
                  placeholder="Response Status (e.g., 404)"
                  value={filters.response_status}
                  onChange={(e) =>
                    handleFilterChange("response_status", e.target.value)
                  }
                  type="number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range */}
                <DateRangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  className="w-full"
                />

                {/* Search */}
                <Input
                  placeholder="Search in descriptions, URLs, errors..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full"
                />

                <Button type="submit" className="w-full" disabled={isFetching}>
                  <Search className="h-4 w-4 mr-2" />
                  {isFetching ? "Searching..." : "Apply Filters"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Log Entries</CardTitle>
            <CardDescription>
              {logsData?.pagination.total_records.toLocaleString()} total
              records found
              {logsData?.filters_applied && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (filtered results)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                Loading logs...
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                Error loading logs. Please try again.
              </div>
            ) : logsData?.data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found matching the current filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Timestamp</TableHead>
                        <TableHead className="min-w-[200px]">Event</TableHead>
                        <TableHead className="w-[150px]">User</TableHead>
                        <TableHead className="w-[150px]">Company</TableHead>
                        <TableHead className="w-[120px]">IP Address</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[100px]">Response</TableHead>
                        <TableHead className="w-[80px]">Severity</TableHead>
                        <TableHead className="w-[60px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData?.data.map((log) => (
                        <TableRow key={log._id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(
                              new Date(log.created_at),
                              "MMM dd HH:mm:ss"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-sm">
                                {log.event_type}.{log.event_action}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {log.event_description}
                              </div>
                              {log.request_method && log.request_url && (
                                <div className="text-xs text-blue-600">
                                  {log.request_method} {log.request_url}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user_id ? (
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {log.user_id.username}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {log.user_role}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                System
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.company_id ? (
                              log.company_id.company_name
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {log.ip_address}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusColor(log.status)}
                              className="text-xs"
                            >
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {log.response_status && (
                                <Badge
                                  variant={getResponseStatusColor(
                                    log.response_status
                                  )}
                                  className="text-xs"
                                >
                                  {log.response_status}
                                </Badge>
                              )}
                              {log.response_time_ms > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  {formatResponseTime(log.response_time_ms)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getSeverityColor(log.severity)}
                              className="text-xs"
                            >
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {logsData?.pagination && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing{" "}
                      {Math.min(
                        (filters.page - 1) * filters.limit + 1,
                        logsData.pagination.total_records
                      )}{" "}
                      to{" "}
                      {Math.min(
                        filters.page * filters.limit,
                        logsData.pagination.total_records
                      )}{" "}
                      of {logsData.pagination.total_records.toLocaleString()}{" "}
                      entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange("page", "1")}
                        disabled={filters.page === 1 || isFetching}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleFilterChange(
                            "page",
                            (filters.page - 1).toString()
                          )
                        }
                        disabled={filters.page === 1 || isFetching}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm px-2">
                        Page {filters.page} of {logsData.pagination.total_pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleFilterChange(
                            "page",
                            (filters.page + 1).toString()
                          )
                        }
                        disabled={!logsData.pagination.has_next || isFetching}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleFilterChange(
                            "page",
                            logsData.pagination.total_pages.toString()
                          )
                        }
                        disabled={!logsData.pagination.has_next || isFetching}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Entry Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected log entry
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Timestamp</h3>
                  <p>{format(new Date(selectedLog.created_at), "PPpp")}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Event Type</h3>
                  <p>
                    {selectedLog.event_type}.{selectedLog.event_action}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Severity</h3>
                  <Badge variant={getSeverityColor(selectedLog.severity)}>
                    {selectedLog.severity}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold">Status</h3>
                  <Badge variant={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-sm bg-muted p-2 rounded-md">
                  {selectedLog.event_description}
                </p>
              </div>

              {selectedLog.user_id && (
                <div>
                  <h3 className="font-semibold">User Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">
                        Username: {selectedLog.user_id.username}
                      </p>
                      <p className="text-sm">
                        Email: {selectedLog.user_id.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">Role: {selectedLog.user_role}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.company_id && (
                <div>
                  <h3 className="font-semibold">Company</h3>
                  <p className="text-sm">
                    {selectedLog.company_id.company_name}
                  </p>
                </div>
              )}

              {selectedLog.ip_address && (
                <div>
                  <h3 className="font-semibold">IP Address</h3>
                  <p className="text-sm font-mono">{selectedLog.ip_address}</p>
                </div>
              )}

              {selectedLog.request_method && (
                <div>
                  <h3 className="font-semibold">Request</h3>
                  <p className="text-sm font-mono">
                    {selectedLog.request_method} {selectedLog.request_url}
                  </p>
                </div>
              )}

              {selectedLog.response_status && (
                <div>
                  <h3 className="font-semibold">Response</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm">
                        Status: {selectedLog.response_status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">
                        Time: {formatResponseTime(selectedLog.response_time_ms)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.resource_type && (
                <div>
                  <h3 className="font-semibold">Resource</h3>
                  <p className="text-sm">
                    {selectedLog.resource_type}: {selectedLog.resource_id}
                  </p>
                </div>
              )}

              {selectedLog.error_message && (
                <div>
                  <h3 className="font-semibold">Error Message</h3>
                  <p className="text-sm text-destructive bg-muted p-2 rounded-md">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GlobalLogs;
