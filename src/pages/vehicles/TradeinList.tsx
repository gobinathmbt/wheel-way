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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  Eye,
  Download,
  Upload,
  Calendar,
  Car,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/axios";
import ConfigurationSearchmore from "@/components/inspection/ConfigurationSearchmore";

const TradeinList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 20;

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

  const {
    data: vehiclesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tradein-vehicles", page, searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        vehicle_type: "tradein",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await apiClient.get(`/api/vehicle/stock?${params}`);
      return response.data;
    },
  });

  const vehicles = vehiclesData?.data || [];
  const totalPages = Math.ceil((vehiclesData?.total || 0) / limit);

  const handleStartAppraisal = async (vehicleId) => {
    try {
      await apiClient.post(`/api/tradein/start/${vehicleId}`);
      toast.success("Trade-in appraisal started successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to start appraisal");
    }
  };

  const handleViewDetails = async (vehicleId) => {
    try {
      const response = await apiClient.get(`/api/vehicle/detail/${vehicleId}`);
      setSelectedVehicle(response.data.data);
    } catch (error) {
      toast.error("Failed to load vehicle details");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "default";
      case "offer_made":
        return "default";
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  return (
    <DashboardLayout title="Vehicle Trade-ins">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Vehicle Trade-ins
            </h2>
            <p className="text-muted-foreground">
              Manage vehicle trade-in evaluations and offers
            </p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                Available for trade-in
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
                {vehicles.filter((v) => v.tradein_status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting appraisal
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  vehicles.filter((v) => v.tradein_status === "in_progress")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Being evaluated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers Made</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  vehicles.filter((v) => v.tradein_status === "offer_made")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
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
                  vehicles.filter((v) =>
                    ["accepted", "completed"].includes(v.tradein_status)
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
            <CardTitle>Trade-in Vehicles</CardTitle>
            <CardDescription>
              Vehicle inventory available for trade-in evaluation
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
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Registration</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Market Value</TableHead>
                      <TableHead>Offer Value</TableHead>
                      <TableHead>Status</TableHead>
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
                            <p className="font-medium">
                              {vehicle.registration_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.registration_state}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell>
                          {vehicle.kms_driven?.toLocaleString()} km
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(vehicle.estimated_market_value)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {vehicle.offer_value
                              ? formatCurrency(vehicle.offer_value)
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusColor(vehicle.tradein_status)}
                          >
                            {vehicle.tradein_status?.replace("_", " ") ||
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
                            {vehicle.tradein_status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleStartAppraisal(vehicle.vehicle_stock_id)
                                }
                              >
                                Start Appraisal
                              </Button>
                            )}
                            {vehicle.tradein_status === "offer_made" && (
                              <Button variant="outline" size="sm">
                                View Offer
                              </Button>
                            )}
                            {["accepted", "completed"].includes(
                              vehicle.tradein_status
                            ) && (
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
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, vehiclesData?.total || 0)} of{" "}
                      {vehiclesData?.total || 0} results
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
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNumber = i + 1;
                            return (
                              <Button
                                key={pageNumber}
                                variant={
                                  page === pageNumber ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setPage(pageNumber)}
                              >
                                {pageNumber}
                              </Button>
                            );
                          }
                        )}
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
      <Dialog
        open={!!selectedVehicle}
        onOpenChange={() => setSelectedVehicle(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
            <DialogDescription>
              Complete information for {selectedVehicle?.make}{" "}
              {selectedVehicle?.model}
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Make & Model</Label>
                  <p className="text-lg font-semibold">
                    {selectedVehicle.make} {selectedVehicle.model}
                  </p>
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
                  <p className="text-lg">
                    {selectedVehicle.registration_number}
                  </p>
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
                  <p className="text-lg">
                    {selectedVehicle.kms_driven?.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner Type</Label>
                  <p className="text-lg">{selectedVehicle.owner_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Market Value</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedVehicle.estimated_market_value)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Offer</Label>
                  <p className="text-lg font-semibold text-blue-600">
                    {selectedVehicle.offer_value
                      ? formatCurrency(selectedVehicle.offer_value)
                      : "Not evaluated"}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedVehicle(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() =>
                    handleStartAppraisal(selectedVehicle.vehicle_stock_id)
                  }
                >
                  Start Appraisal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TradeinList;
