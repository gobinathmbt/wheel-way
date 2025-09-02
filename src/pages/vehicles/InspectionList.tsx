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
import { Eye, Download, Upload, Calendar, Car, Plus } from "lucide-react";
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
  const limit = 20;

  // ... keep existing code (userPermissions query)

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

  // Check if user has specific permission
  const hasPermission = (permission: string) => {
    return userPermissions?.data?.permissions?.includes(permission) || false;
  };

  const handleStartInspection = async (vehicleId: string) => {
    if (!hasPermission("start_inspection")) {
      toast.error("You do not have permission to start inspections");
      return;
    }

    try {
      await inspectionServices.startInspection(vehicleId);
      toast.success("Inspection started successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to start inspection");
    }
  };

  const handleViewDetails = async (vehicleId: string) => {
    if (!hasPermission("view_vehicle_details")) {
      toast.error("You do not have permission to view vehicle details");
      return;
    }

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

  // ... keep existing code (handleClearSearch, handleFilterChange, getStatusColor functions)

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

  return (
    <DashboardLayout title="Vehicle Inspections">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Vehicle Inspections
            </h2>
            <p className="text-muted-foreground">
              Manage vehicle inspection workflows
            </p>
          </div>
          <div className="flex space-x-2">
            {hasPermission("create_vehicle_stock") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Vehicle Stock
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create Vehicle Stock</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {hasPermission("import_vehicles") && (
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Vehicles
              </Button>
            )}

            {hasPermission("export_reports") && (
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Vehicles
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehiclesData?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for inspection
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  vehicles.filter((v: any) => v.inspection_status === "pending")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting inspection
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  vehicles.filter(
                    (v: any) => v.inspection_status === "in_progress"
                  ).length
                }
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
                {
                  vehicles.filter(
                    (v: any) => v.inspection_status === "completed"
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <ConfigurationSearchmore
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onFilterChange={handleFilterChange}
          onSearch={handleClearSearch}
          isLoading={isLoading}
        />

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Vehicles</CardTitle>
            <CardDescription>
              Vehicle inventory available for inspection
            </CardDescription>
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
                      <TableHead>S.No</TableHead>
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
                            {hasPermission("view_vehicle_details") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewDetails(vehicle.vehicle_stock_id)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {vehicle.inspection_status === "pending" &&
                              hasPermission("start_inspection") && (
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-4">
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
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Details Side Modal */}
      <VehicleDetailSideModal
        vehicle={selectedVehicle}
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onUpdate={refetch}
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
