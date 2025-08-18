
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Eye, Download, Upload, Calendar, Car } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';

const InspectionList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: vehiclesData, isLoading, refetch } = useQuery({
    queryKey: ['inspection-vehicles', page, searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        vehicle_type: 'inspection'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await apiClient.get(`/api/vehicle/stock?${params}`);
      return response.data;
    }
  });

  const vehicles = vehiclesData?.data || [];
  const totalPages = Math.ceil((vehiclesData?.total || 0) / limit);

  const handleStartInspection = async (vehicleId) => {
    try {
      await apiClient.post(`/api/inspection/start/${vehicleId}`);
      toast.success('Inspection started successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to start inspection');
    }
  };

  const handleViewDetails = async (vehicleId) => {
    try {
      const response = await apiClient.get(`/api/vehicle/detail/${vehicleId}`);
      setSelectedVehicle(response.data.data);
    } catch (error) {
      toast.error('Failed to load vehicle details');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout title="Vehicle Inspections">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Vehicle Inspections</h2>
            <p className="text-muted-foreground">Manage vehicle inspection workflows</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import Vehicles
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehiclesData?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Available for inspection</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles.filter(v => v.inspection_status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting inspection</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles.filter(v => v.inspection_status === 'in_progress').length}
              </div>
              <p className="text-xs text-muted-foreground">Being inspected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles.filter(v => v.inspection_status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, VIN, or registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Vehicles</CardTitle>
            <CardDescription>Vehicle inventory available for inspection</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Car className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                              <p className="text-sm text-muted-foreground">{vehicle.variant}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vehicle.registration_number}</p>
                            <p className="text-sm text-muted-foreground">{vehicle.registration_state}</p>
                          </div>
                        </TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell>{vehicle.kms_driven?.toLocaleString()} km</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(vehicle.inspection_status)}>
                            {vehicle.inspection_status?.replace('_', ' ') || 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{vehicle.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewDetails(vehicle.vehicle_id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {vehicle.inspection_status === 'pending' && (
                              <Button 
                                size="sm"
                                onClick={() => handleStartInspection(vehicle.vehicle_id)}
                              >
                                Start Inspection
                              </Button>
                            )}
                            {vehicle.inspection_status === 'completed' && (
                              <Button variant="outline" size="sm">
                                View Report
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, vehiclesData?.total || 0)} of {vehiclesData?.total || 0} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <Button
                              key={pageNumber}
                              variant={page === pageNumber ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNumber)}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Details Dialog */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedVehicle?.make} {selectedVehicle?.model}
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Make & Model</Label>
                  <p className="text-lg font-semibold">{selectedVehicle.make} {selectedVehicle.model}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Variant</Label>
                  <p className="text-lg">{selectedVehicle.variant}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Year</Label>
                  <p className="text-lg">{selectedVehicle.year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Registration</Label>
                  <p className="text-lg">{selectedVehicle.registration_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fuel Type</Label>
                  <p className="text-lg">{selectedVehicle.fuel_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Transmission</Label>
                  <p className="text-lg">{selectedVehicle.transmission}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mileage</Label>
                  <p className="text-lg">{selectedVehicle.kms_driven?.toLocaleString()} km</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner Type</Label>
                  <p className="text-lg">{selectedVehicle.owner_type}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedVehicle(null)}>
                  Close
                </Button>
                <Button onClick={() => handleStartInspection(selectedVehicle.vehicle_id)}>
                  Start Inspection
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default InspectionList;
