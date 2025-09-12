import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
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
  TrendingUp,
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
  DialogTrigger,
} from "@/components/ui/dialog";

// Custom hook for smooth number animation
const useSmoothCounter = (target: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    let start = 0;
    const fps = 90;
    const frameTime = 1000 / fps;
    const increment = (target / duration) * frameTime;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

// Delay function for API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

interface DailyAnalytics {
  date: string;
  total_events: number;
  errors: number;
  warnings: number;
  avg_response_time: number;
  p95_response_time: number;
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
    daily_breakdown: DailyAnalytics[];
    period_days: number;
    date_range: {
      start: string | null;
      end: string | null;
    };
    status: "loading" | "complete" | "error";
    progress: number;
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // State for individual metrics
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalWarnings, setTotalWarnings] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [p95ResponseTime, setP95ResponseTime] = useState(0);

  // Use smooth counters for all metrics
  const smoothTotalEvents = useSmoothCounter(totalEvents);
  const smoothTotalErrors = useSmoothCounter(totalErrors);
  const smoothTotalWarnings = useSmoothCounter(totalWarnings);
  const smoothAvgResponseTime = useSmoothCounter(Math.round(avgResponseTime));
  const smoothP95ResponseTime = useSmoothCounter(Math.round(p95ResponseTime));

  // Get color for response time metrics
  const getResponseTimeColor = (time: number) => {
    if (time < 400) return "text-green-600";
    if (time <= 800) return "text-orange-600";
    return "text-destructive";
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setAnalyticsLoading(true);
      setTotalEvents(0);
      setTotalErrors(0);
      setTotalWarnings(0);
      setAvgResponseTime(0);
      setP95ResponseTime(0);

      try {
        const days = 10;
        const dailyAnalytics: DailyAnalytics[] = [];
        let events = 0;
        let errors = 0;
        let warnings = 0;
        const allResponseTimes: number[] = [];
        const allP95ResponseTimes: number[] = [];

        const dates = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split("T")[0];
        }).reverse();

        for (const [index, date] of dates.entries()) {
          try {
            const params = new URLSearchParams();
            params.append("date", date);
            if (filters.company_id && filters.company_id !== "all")
              params.append("company_id", filters.company_id);
            if (filters.event_type && filters.event_type !== "all")
              params.append("event_type", filters.event_type);

            const response = await logServices.getDailyAnalytics(params.toString());
            const dailyData = response.data.data;
            dailyAnalytics.push(dailyData);

            events += dailyData.total_events;
            errors += dailyData.errors;
            warnings += dailyData.warnings;

            setTotalEvents(events);
            setTotalErrors(errors);
            setTotalWarnings(warnings);

            if (dailyData.avg_response_time > 0) {
              allResponseTimes.push(dailyData.avg_response_time);
            }
            if (dailyData.p95_response_time > 0) {
              allP95ResponseTimes.push(dailyData.p95_response_time);
            }

            const currentAvgResponseTime =
              allResponseTimes.length > 0
                ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
                : 0;

            const currentP95ResponseTime =
              allP95ResponseTimes.length > 0
                ? allP95ResponseTimes.reduce((sum, time) => sum + time, 0) / allP95ResponseTimes.length
                : 0;

            setAvgResponseTime(currentAvgResponseTime);
            setP95ResponseTime(currentP95ResponseTime);
          } catch (error) {
            console.error(`Failed to fetch analytics for date ${date}:`, error);
          }
        }

        setAnalyticsData({
          analytics: {
            summary: {
              total_events: events,
              total_errors: errors,
              total_warnings: warnings,
              avg_response_time: avgResponseTime,
              p95_response_time: p95ResponseTime,
            },
            daily_breakdown: dailyAnalytics,
            period_days: days,
            date_range: {
              start: dates[0],
              end: dates[dates.length - 1],
            },
            status: "complete",
            progress: 100,
          },
        });

        setAnalyticsLoading(false);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        setAnalyticsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

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
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: usersData } = useQuery<{ data: User[] }>({
    queryKey: ["users-for-logs"],
    queryFn: async () => {
      const response = await logServices.getLogUsers();
      return response.data;
    },
    staleTime: 300000,
  });

  const { data: companiesData } = useQuery<{ data: Company[] }>({
    queryKey: ["companies-for-logs"],
    queryFn: async () => {
      const response = await logServices.getLogCompanies();
      return response.data;
    },
    staleTime: 300000,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? parseInt(value) : 1,
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
      link.download = `logs-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
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
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "failure":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getResponseStatusColor = (status: number) => {
    if (status >= 500) return "destructive";
    if (status >= 400) return "default";
    if (status >= 300) return "secondary";
    if (status >= 200) return "default";
    return "secondary";
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Filter Dialog Content
  const FilterDialog = () => (
    <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Logs</DialogTitle>
          <DialogDescription>
            Apply filters to find specific log entries
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event Type</label>
            <Select
              value={filters.event_type}
              onValueChange={(value) => handleFilterChange("event_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All event types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="api_call">API Call</SelectItem>
                <SelectItem value="data_access">Data Access</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="user_management">User Management</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Severity</label>
            <Select
              value={filters.severity}
              onValueChange={(value) => handleFilterChange("severity", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All severity levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company</label>
            <Select
              value={filters.company_id}
              onValueChange={(value) => handleFilterChange("company_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companiesData?.data.map((company) => (
                  <SelectItem key={company._id} value={company._id}>
                    {company.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">User</label>
            <Select
              value={filters.user_id}
              onValueChange={(value) => handleFilterChange("user_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {usersData?.data.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">HTTP Method</label>
            <Select
              value={filters.request_method}
              onValueChange={(value) => handleFilterChange("request_method", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Response Status</label>
            <Select
              value={filters.response_status}
              onValueChange={(value) => handleFilterChange("response_status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All status codes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status Codes</SelectItem>
                <SelectItem value="200">200 (OK)</SelectItem>
                <SelectItem value="201">201 (Created)</SelectItem>
                <SelectItem value="400">400 (Bad Request)</SelectItem>
                <SelectItem value="401">401 (Unauthorized)</SelectItem>
                <SelectItem value="403">403 (Forbidden)</SelectItem>
                <SelectItem value="404">404 (Not Found)</SelectItem>
                <SelectItem value="500">500 (Server Error)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs by description, URL, IP, etc..."
                className="pl-8"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </form>

          <Button type="submit" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleQuickFilter("severity", "error");
              setIsFilterDialogOpen(false);
            }}
          >
            Show Errors
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleQuickFilter("severity", "warning");
              setIsFilterDialogOpen(false);
            }}
          >
            Show Warnings
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleQuickFilter("response_status", "500");
              setIsFilterDialogOpen(false);
            }}
          >
            Server Errors
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleQuickFilter("response_status", "400");
              setIsFilterDialogOpen(false);
            }}
          >
            Client Errors
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <DashboardLayout title="Global System Logs">
      <div className="flex flex-col h-full">
        {/* Fixed Header with Taskbar style */}
        <div className="bg-card border-b px-6 py-4 flex items-center justify-between shadow-sm">
          {/* Left side - Count chips */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {analyticsLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <span>{smoothTotalEvents.toLocaleString()}</span>
              )}
              <span className="text-xs">Events</span>
            </Badge>

            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {analyticsLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <span>{smoothTotalErrors.toLocaleString()}</span>
              )}
              <span className="text-xs">Errors</span>
            </Badge>

            <Badge className="flex items-center gap-1 bg-orange-100 text-orange-800 border-orange-200">
              <AlertCircle className="h-3 w-3" />
              {analyticsLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <span>{smoothTotalWarnings.toLocaleString()}</span>
              )}
              <span className="text-xs">Warnings</span>
            </Badge>

            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {analyticsLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <span className={getResponseTimeColor(smoothAvgResponseTime)}>
                  {formatResponseTime(smoothAvgResponseTime)}
                </span>
              )}
              <span className="text-xs">Avg</span>
            </Badge>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
            </Button>

            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              disabled={isExporting}
            >
              <Download className="h-4 w-4" />
            </Button>

        
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterDialogOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
       
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col m-6 mb-0">
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Scrollable Table Container */}
              <div className="flex-1 overflow-auto">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-destructive">
                    Failed to load logs. Please try again.
                  </div>
                ) : (
                  <Table>
                    <TableBody>
                      {logsData?.data.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell className="whitespace-nowrap">
                            {format(
                              new Date(log.created_at),
                              "MMM dd, yyyy HH:mm:ss"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {log.event_description}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.event_type} · {log.event_action}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user_id ? (
                              <div>
                                <div>{log.user_id.username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {log.user_role}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">System</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.company_id?.company_name || (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getResponseStatusColor(log.response_status)}
                            >
                              {log.response_status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={getResponseTimeColor(log.response_time_ms)}
                          >
                            {formatResponseTime(log.response_time_ms)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fixed Footer with Pagination */}
          {logsData && logsData.pagination.total_pages > 1 && (
            <div className="bg-card border-t px-6 py-4 flex items-center justify-between shadow-sm">
              <div className="text-sm text-muted-foreground">
                Page {logsData.pagination.current_page} of{" "}
                {logsData.pagination.total_pages} ({logsData.pagination.total_records} total records)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFilterChange("page", "1")}
                  disabled={filters.page === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleFilterChange("page", (filters.page - 1).toString())
                  }
                  disabled={filters.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleFilterChange("page", (filters.page + 1).toString())
                  }
                  disabled={filters.page === logsData.pagination.total_pages}
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
                  disabled={filters.page === logsData.pagination.total_pages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Dialog */}
        <FilterDialog />

        {/* Log Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Details</DialogTitle>
              <DialogDescription>
                Complete information for this log entry
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Basic Information</h3>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Type</p>
                    <p>{selectedLog.event_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Event Action</p>
                    <p>{selectedLog.event_action}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p>{selectedLog.event_description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p>
                      {format(
                        new Date(selectedLog.created_at),
                        "MMM dd, yyyy HH:mm:ss"
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">User Information</h3>
                  {selectedLog.user_id ? (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">User</p>
                        <p>
                          {selectedLog.user_id.username} (
                          {selectedLog.user_id.email})
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <p>{selectedLog.user_role}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      System-generated event
                    </p>
                  )}
                  {selectedLog.company_id && (
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p>{selectedLog.company_id.company_name}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Request Information</h3>
                  <div>
                    <p className="text-sm text-muted-foreground">HTTP Method</p>
                    <p>{selectedLog.request_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">URL</p>
                    <p className="break-all">{selectedLog.request_url}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IP Address</p>
                    <p>{selectedLog.ip_address}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Response Information</h3>
                  <div>
                    <p className="text-sm text-muted-foreground">Status Code</p>
                    <Badge
                      variant={getResponseStatusColor(selectedLog.response_status)}
                    >
                      {selectedLog.response_status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                    <p
                      className={getResponseTimeColor(selectedLog.response_time_ms)}
                    >
                      {formatResponseTime(selectedLog.response_time_ms)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Severity</p>
                    <Badge variant={getSeverityColor(selectedLog.severity)}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={getStatusColor(selectedLog.status)}>
                      {selectedLog.status}
                    </Badge>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div className="col-span-full space-y-2">
                    <h3 className="font-semibold">Error Details</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm break-all">
                        {selectedLog.error_message}
                      </p>
                    </div>
                  </div>
                )}

                {selectedLog.resource_type && (
                  <div className="col-span-full space-y-2">
                    <h3 className="font-semibold">Resource Information</h3>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Resource Type
                      </p>
                      <p>{selectedLog.resource_type}</p>
                    </div>
                    {selectedLog.resource_id && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Resource ID
                        </p>
                        <p>{selectedLog.resource_id}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default GlobalLogs;