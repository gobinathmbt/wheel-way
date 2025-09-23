import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  Eye,
  Download,
  Upload,
  Car,
  Plus,
  ArrowUpDown,
  ArrowUp,
  SlidersHorizontal,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  vehicleServices,
  inspectionServices,
  authServices,
  dealershipServices,
} from "@/api/services";
import ConfigurationSearchmore from "@/components/inspection/ConfigurationSearchmore";
import VehicleInspectSideModal from "@/components/vehicles/VehicleSideModals/VehicleInspectSideModal";
import CreateVehicleInspectModal from "@/components/vehicles/CreateSideModals/CreateVehicleInspectModal";
import DataTableLayout from "@/components/common/DataTableLayout";
import { useAuth } from "@/auth/AuthContext";
import { MoveHorizontal } from "lucide-react";
import BulkOperationsDialog from "@/components/common/BulkOperationsDialog";

const InspectionList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const { completeUser } = useAuth();

  // Fetch current user's permissions
  const { data: userPermissions } = useQuery({
    queryKey: ["user-permissions"],
    queryFn: async () => {
      const response = await authServices.getCurrentUserPermissions();
      return response.data;
    },
  });

  const { data: dealerships } = useQuery({
    queryKey: ["dealerships-dropdown", completeUser?.is_primary_admin],
    queryFn: async () => {
      const response = await dealershipServices.getDealershipsDropdown();

      if (!completeUser?.is_primary_admin && completeUser?.dealership_ids) {
        const userDealershipIds = completeUser.dealership_ids.map((d: any) =>
          typeof d === "object" ? d._id : d
        );
        return response.data.data.filter((dealership: any) =>
          userDealershipIds.includes(dealership._id)
        );
      }

      return response.data.data;
    },
    enabled: !!completeUser,
  });
  // Function to fetch all vehicles when pagination is disabled
  const fetchAllVehicles = async () => {
    try {
      let allData = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "100",
          vehicle_type: "inspection",
        });

        if (searchTerm) params.append("search", searchTerm);
        if (statusFilter !== "all") params.append("status", statusFilter);

        const response = await vehicleServices.getVehicleStock({
          ...Object.fromEntries(params),
        });

        allData = [...allData, ...response.data.data];

        if (response.data.data.length < 100) {
          hasMore = false;
        } else {
          currentPage++;
        }
      }

      return {
        data: allData,
        total: allData.length,
      };
    } catch (error) {
      throw error;
    }
  };

  const {
    data: vehiclesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: paginationEnabled
      ? [
          "inspection-vehicles-paginated",
          page,
          searchTerm,
          statusFilter,
          rowsPerPage,
        ]
      : ["inspection-vehicles-all", searchTerm, statusFilter],
    queryFn: async () => {
      if (!paginationEnabled) {
        return await fetchAllVehicles();
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
        vehicle_type: "inspection",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await vehicleServices.getVehicleStock({
        ...Object.fromEntries(params),
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0, // Consider data stale immediately
  });

  const vehicles = vehiclesData?.data || [];

  // Sort vehicles when not using pagination
  const sortedVehicles = React.useMemo(() => {
    if (!sortField) return vehicles;

    return [...vehicles].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle nested properties
      if (sortField === "vehicle_name") {
        aValue = `${a.make} ${a.model}`;
        bValue = `${b.make} ${b.model}`;
      } else if (sortField === "mileage") {
        aValue = a.vehicle_odometer?.[0]?.reading || 0;
        bValue = b.vehicle_odometer?.[0]?.reading || 0;
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [vehicles, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPage(1);
    refetch();
  };

  const getDealershipName = (dealershipId: string) => {
    const dealership = dealerships?.find(
      (dealer: any) => dealer._id === dealershipId
    );
    return dealership ? dealership.dealership_name : "Unknown";
  };

  const getSortIcon = (field: any) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const handleStartInspection = async (vehicleId: string) => {
    toast.error("You do not have permission to start inspections");
    return;
  };

  const handleViewDetails = async (vehicleId: string, vehicleType: string) => {
    try {
      const response = await vehicleServices.getVehicleDetail(
        vehicleId,
        vehicleType
      );
      setSelectedVehicle(response.data.data);
    } catch (error) {
      toast.error("Failed to load vehicle details");
    }
  };

  const handleCreateSuccess = () => {
    refetch();
    setIsCreateModalOpen(false);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1); // Reset to first page when changing rows per page
  };

  const handlePaginationToggle = (checked: boolean) => {
    setPaginationEnabled(checked);
    setPage(1); // Reset to first page when toggling
    setTimeout(() => {
      refetch();
    }, 100);
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
  const pendingCount = vehicles.filter(
    (v: any) => v.inspection_status === "pending"
  ).length;
  const inProgressCount = vehicles.filter(
    (v: any) => v.inspection_status === "in_progress"
  ).length;
  const completedCount = vehicles.filter(
    (v: any) => v.inspection_status === "completed"
  ).length;

  // Prepare stat chips
  const statChips = [
    {
      label: "Total",
      value: totalVehicles,
      variant: "outline" as const,
      bgColor: "bg-gray-100",
    },
    {
      label: "Pending",
      value: pendingCount,
      variant: "secondary" as const,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      hoverColor: "hover:bg-yellow-100",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      variant: "default" as const,
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      hoverColor: "hover:bg-blue-100",
    },
    {
      label: "Completed",
      value: completedCount,
      variant: "default" as const,
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      hoverColor: "hover:bg-green-100",
    },
  ];

  // Prepare action buttons
  const actionButtons = [
    {
      icon: <MoveHorizontal className="h-4 w-4" />,
      tooltip: "Bulk Operations",
      onClick: () => setIsBulkDialogOpen(true),
      className:
        "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200",
    },
    {
      icon: <SlidersHorizontal className="h-4 w-4" />,
      tooltip: "Search & Filters",
      onClick: () => setIsFilterDialogOpen(true),
      className: "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200",
    },
    {
      icon: <Download className="h-4 w-4" />,
      tooltip: "Export Report",
      onClick: handleExport,
      className: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200",
    },
    {
      icon: <Plus className="h-4 w-4" />,
      tooltip: "Add Vehicle",
      onClick: () => setIsCreateModalOpen(true),
      className:
        "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
    },
    {
      icon: <Upload className="h-4 w-4" />,
      tooltip: "Import Vehicles",
      onClick: () => toast.info("Import feature coming soon"),
      className:
        "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200",
    },
  ];

  const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
  ];

  // Render table header
  const renderTableHeader = () => (
    <TableRow>
      <TableHead className="bg-muted/50">S.No</TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("vehicle_stock_id")}
      >
        <div className="flex items-center">
          Stock No
          {getSortIcon("vehicle_stock_id")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("vehicle_name")}
      >
        <div className="flex items-center">
          Vehicle
          {getSortIcon("vehicle_name")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("plate_no")}
      >
        <div className="flex items-center">
          Registration
          {getSortIcon("plate_no")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("dealership_id")}
      >
        <div className="flex items-center">
          Dealership
          {getSortIcon("dealership_id")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("year")}
      >
        <div className="flex items-center">
          Year
          {getSortIcon("year")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("mileage")}
      >
        <div className="flex items-center">
          Mileage
          {getSortIcon("mileage")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("inspection_status")}
      >
        <div className="flex items-center">
          Status
          {getSortIcon("inspection_status")}
        </div>
      </TableHead>
    </TableRow>
  );

  const renderTableBody = () => (
    <>
      {sortedVehicles.map((vehicle: any, index: number) => (
        <TableRow key={vehicle._id}>
          <TableCell>
            {paginationEnabled
              ? (page - 1) * rowsPerPage + index + 1
              : index + 1}
          </TableCell>
          <TableCell
            onClick={() =>
              handleViewDetails(vehicle.vehicle_stock_id, vehicle.vehicle_type)
            }
          >
            <div>
              <p className="font-medium text-blue-600 hover:text-blue-600 cursor-pointer">
                {vehicle.vehicle_stock_id}
              </p>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {vehicle.vehicle_hero_image ? (
                  <img
                    src={vehicle.vehicle_hero_image}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Car className="h-5 w-5 text-muted-foreground" />
                )}
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
          <TableCell>
            <div className="flex flex-wrap gap-1">
              <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-600">
                {getDealershipName(vehicle?.dealership_id)}
              </Badge>
            </div>
          </TableCell>

          <TableCell>{vehicle.year}</TableCell>
          <TableCell>
            {vehicle.vehicle_odometer?.[0]?.reading?.toLocaleString()} km
          </TableCell>
          <TableCell>
            <Badge
              variant={getStatusColor(vehicle.inspection_status)}
              className={
                vehicle.inspection_status === "pending"
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                  : vehicle.inspection_status === "in_progress"
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                  : vehicle.inspection_status === "completed"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : ""
              }
            >
              {vehicle.inspection_status?.replace("_", " ") || "Pending"}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <>
      <DataTableLayout
        title="Vehicle Inspections"
        data={sortedVehicles}
        isLoading={isLoading}
        totalCount={vehiclesData?.total || 0}
        statChips={statChips}
        actionButtons={actionButtons}
        page={page}
        rowsPerPage={rowsPerPage}
        paginationEnabled={paginationEnabled}
        onPageChange={setPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        onPaginationToggle={handlePaginationToggle}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        getSortIcon={getSortIcon}
        renderTableHeader={renderTableHeader}
        renderTableBody={renderTableBody}
        onRefresh={handleRefresh}
        cookieName="inspection_pagination_enabled" // Custom cookie name
        cookieMaxAge={60 * 60 * 24 * 30} // 30 days
      />

      {/* Vehicle Details Side Modal */}
      <VehicleInspectSideModal
        vehicle={selectedVehicle}
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onUpdate={refetch}
        vehicleType="inspection"
      />

      {/* Create Vehicle Stock Modal */}
      <CreateVehicleInspectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        vehicleType="inspection"
      />

      <BulkOperationsDialog
        isOpen={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        vehicleType="inspection"
        onSuccess={refetch}
      />

      <ConfigurationSearchmore
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onClear={handleClearFilters}
        isLoading={isLoading}
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        filterOptions={STATUS_FILTER_OPTIONS}
        filterLabel="Status"
      />
    </>
  );
};

export default InspectionList;
