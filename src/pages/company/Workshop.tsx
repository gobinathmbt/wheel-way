import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { workshopServices } from "@/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Car, Calendar, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Workshop = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const {
    data: vehicles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workshop-vehicles", currentPage, search, vehicleType],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 20,
        ...(search && { search }),
        ...(vehicleType && { vehicle_type: vehicleType }),
      };
      const response = await workshopServices.getWorkshopVehicles(params);
      return response.data;
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleVehicleTypeChange = (value: string) => {
    setVehicleType(value === "all" ? "" : value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Workshop">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Workshop">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Error loading workshop vehicles</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Workshop">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Workshop</h2>
            <p className="text-muted-foreground">
              Manage vehicles with inspection results and create quotes
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search vehicles..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={vehicleType || "all"}
                onValueChange={handleVehicleTypeChange}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="tradein">Trade-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Table */}
        {vehicles?.data?.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sno</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Stock ID</TableHead>
                    <TableHead>Plate No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Inspection Results</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.data.map((vehicle: any, index: number) => (
                    <TableRow key={vehicle._id}>
                      <TableCell>
                        {(currentPage - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell>
                        <img
                          src={vehicle.vehicle_hero_image}
                          alt={vehicle.name}
                          className="h-12 w-20 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {vehicle.name ||
                          `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </TableCell>
                      <TableCell>{vehicle.vehicle_stock_id}</TableCell>
                      <TableCell>{vehicle.plate_no}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vehicle.vehicle_type === "inspection"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {vehicle.vehicle_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {vehicle.inspection_result?.length
                            ? `${vehicle.inspection_result.length} Sections`
                            : "0 Sections"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/company/workshop-config/${vehicle.vehicle_stock_id}/${vehicle.vehicle_type}`}
                        >
                          <Button size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  No Vehicles Found
                </h3>
                <p className="text-muted-foreground">
                  No vehicles with inspection results found. Vehicles will
                  appear here once they have inspection data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {vehicles?.pagination && vehicles.pagination.total_pages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm">
              Page {currentPage} of {vehicles.pagination.total_pages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === vehicles.pagination.total_pages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Workshop;
