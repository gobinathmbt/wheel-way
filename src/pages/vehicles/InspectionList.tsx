import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Download, Upload, Car, Plus, RefreshCw, Filter } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  vehicleServices,
  inspectionServices,
  authServices,
} from "@/api/services";
import ConfigurationSearchmore from "@/components/inspection/ConfigurationSearchmore";
import VehicleDetailSideModal from "@/components/vehicles/VehicleDetailSideModal";
import CreateVehicleStockModal from "@/components/vehicles/CreateVehicleStockModal";

const InspectionList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const limit = 20;

  // Fetch current user's permissions
  const { data: userPermissions } = useQuery({
    queryKey: ["user-permissions"],
    queryFn: async () => {
      const response = await authServices.getCurrentUserPermissions();
      return response.data;
    },
  });

  const {
    data: vehiclesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["inspection-vehicles", page, searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        vehicle_type: "inspection",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await vehicleServices.getVehicleStock({
        ...Object.fromEntries(params),
      });
      return response.data;
    },
  });

  const vehicles = vehiclesData?.data || [];
  const totalPages = Math.ceil((vehiclesData?.total || 0) / limit);

  const handleStartInspection = async (vehicleId: string) => {
    toast.error("You do not have permission to start inspections");
    return;

    try {
      await inspectionServices.startInspection(vehicleId);
      toast.success("Inspection started successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to start inspection");
    }
  };

  const handleViewDetails = async (vehicleId: string) => {
    try {
      const response = await vehicleServices.getVehicleDetail(vehicleId);
      setSelectedVehicle(response.data.data);
    } catch (error) {
      toast.error("Failed to load vehicle details");
    }
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPage(1);
    refetch();
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleExport = () => {
    toast.success("Export started");
  };

  // Calculate counts for chips
  const totalVehicles = vehiclesData?.total || 0;
  const pendingCount = vehicles.filter((v: any) => v.inspection_status === "pending").length;
  const inProgressCount = vehicles.filter((v: any) => v.inspection_status === "in_progress").length;
  const completedCount = vehicles.filter((v: any) => v.inspection_status === "completed").length;

  return (
    <DashboardLayout title="Vehicle Inspections">
      <div className="flex flex-col h-full" >
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0" >
          <div className="flex items-center justify-between">
            {/* Left side - Count chips */}
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-3 py-1">
                Total: {totalVehicles}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                Pending: {pendingCount}
              </Badge>
              <Badge variant="default" className="px-3 py-1">
                In Progress: {inProgressCount}
              </Badge>
              <Badge variant="default" className="px-3 py-1">
                Completed: {completedCount}
              </Badge>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh Data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export Report</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filter Vehicles</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <ConfigurationSearchmore
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      statusFilter={statusFilter}
                      onFilterChange={handleFilterChange}
                      onSearch={handleClearSearch}
                      isLoading={isLoading}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsFilterDialogOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setIsFilterDialogOpen(false);
                        refetch();
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vehicle
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create Vehicle Stock</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full flex flex-col border-0 shadow-none">

            <CardContent className="flex-1 overflow-hidden p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10 border-b">
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Stock No</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Registration</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle: any, index: number) => (
                        <TableRow key={vehicle._id}>
                          <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {vehicle.vehicle_stock_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Car className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {vehicle.make} {vehicle.model}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {vehicle.variant}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vehicle.plate_no}</p>
                            </div>
                          </TableCell>
                          <TableCell>{vehicle.year}</TableCell>
                          <TableCell>
                            {vehicle.vehicle_odometer?.[0]?.reading?.toLocaleString()}{" "}
                            km
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusColor(vehicle.inspection_status)}
                            >
                              {vehicle.inspection_status?.replace("_", " ") ||
                                "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewDetails(vehicle.vehicle_stock_id)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {vehicle.inspection_status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleStartInspection(
                                      vehicle.vehicle_stock_id
                                    )
                                  }
                                >
                                  Start Inspection
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fixed Footer with Pagination */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0" >
            <Pagination className="justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => page > 1 && setPage(page - 1)}
                    className={
                      page <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from(
                  { length: Math.min(5, totalPages) },
                  (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setPage(pageNumber)}
                          isActive={page === pageNumber}
                          className="cursor-pointer"
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => page < totalPages && setPage(page + 1)}
                    className={
                      page >= totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Vehicle Details Side Modal */}
      <VehicleDetailSideModal
        vehicle={selectedVehicle}
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onUpdate={refetch}
        vehicleType="inspection"
      />

      {/* Create Vehicle Stock Modal */}
      <CreateVehicleStockModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        vehicleType="inspection"
      />
    </DashboardLayout>
  );
};

export default InspectionList;