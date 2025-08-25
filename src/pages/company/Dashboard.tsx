
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, Car, CheckCircle, Activity, TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { companyServices } from '@/api/services';
import { toast } from 'sonner';

const CompanyDashboard = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeInspections: 0,
    completedAppraisals: 0,
    totalUsers: 0,
    monthlyInspections: 0,
    monthlyAppraisals: 0
  });

  const [vehicleStats, setVehicleStats] = useState({});
  const [inspectionStats, setInspectionStats] = useState({});
  const [appraisalStats, setAppraisalStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [revenueStats, setRevenueStats] = useState({});
  const [activityStats, setActivityStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);

  const [monthlyData, setMonthlyData] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const params = {
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      };

      const [
        statsResponse,
        vehicleResponse,
        inspectionResponse,
        appraisalResponse,
        userResponse,
        revenueResponse,
        activityResponse,
        recentResponse
      ] = await Promise.all([
        companyServices.getDashboardStats(params),
        companyServices.getVehicleStats(params),
        companyServices.getInspectionStats(params),
        companyServices.getAppraisalStats(params),
        companyServices.getUserStats(params),
        companyServices.getRevenueStats(params),
        companyServices.getActivityStats(params),
        companyServices.getRecentActivity(params)
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }
      
      if (vehicleResponse.data.success) {
        setVehicleStats(vehicleResponse.data.data);
        setVehicleTypes(vehicleResponse.data.data.vehicleTypes || []);
      }
      
      if (inspectionResponse.data.success) {
        setInspectionStats(inspectionResponse.data.data);
      }
      
      if (appraisalResponse.data.success) {
        setAppraisalStats(appraisalResponse.data.data);
      }
      
      if (userResponse.data.success) {
        setUserStats(userResponse.data.data);
      }
      
      if (revenueResponse.data.success) {
        setRevenueStats(revenueResponse.data.data);
      }
      
      if (activityResponse.data.success) {
        setActivityStats(activityResponse.data.data);
        setMonthlyData(activityResponse.data.data.monthlyData || []);
      }
      
      if (recentResponse.data.success) {
        setRecentActivity(recentResponse.data.data);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  return (
    <DashboardLayout title="Company Dashboard">
      <div className="space-y-8">
        {/* Header with Date Filter */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">Overview of your company's performance</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={loadDashboardData} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">
                Available for processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Inspections</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeInspections}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Appraisals</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedAppraisals}</div>
              <p className="text-xs text-muted-foreground">
                In selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{revenueStats.growthRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Compared to previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.monthlyInspections || 0) + (stats.monthlyAppraisals || 0)}</div>
              <p className="text-xs text-muted-foreground">
                In selected period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>Inspections and appraisals over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="inspections" stroke="#3b82f6" strokeWidth={2} name="Inspections" />
                  <Line type="monotone" dataKey="appraisals" stroke="#10b981" strokeWidth={2} name="Appraisals" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vehicle Types */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Distribution</CardTitle>
              <CardDescription>Breakdown by vehicle type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vehicleTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {vehicleTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest inspections and appraisals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.vehicle}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type} by {activity.user}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        activity.status === 'Completed' ? 'default' :
                        activity.status === 'In Progress' ? 'secondary' : 'outline'
                      }
                    >
                      {activity.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompanyDashboard;
