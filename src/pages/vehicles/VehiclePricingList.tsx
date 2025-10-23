import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  Download,
  Car,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react"; // Remove Calculator import
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  commonVehicleServices,
  dealershipServices,
  authServices,
  vehicleServices,
} from "@/api/services";
import DataTableLayout from "@/components/common/DataTableLayout";
import { useAuth } from "@/auth/AuthContext";
import { formatApiNames } from "@/utils/GlobalUtils";
// Remove CostCalculationDialog import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import VehiclePricingSideModal from "@/components/vehicles/VehicleSideModals/VehiclePricingSideModal";

interface StatChip {
  label: string;
  value: string | number;
  variant: "default" | "outline";
  bgColor: string;
  textColor: string;
  hoverColor: string;
  onClick?: () => void;
}

const VehiclePricingList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  // Remove cost calculation states
  const [showAllStatusChips, setShowAllStatusChips] = useState(false);

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
        });

        if (searchTerm) params.append("search", searchTerm);
        if (statusFilter !== "all") params.append("status", statusFilter);

        const response = await commonVehicleServices.getPricingReadyVehicles({
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
      ? ["pricing-ready-vehicles", page, searchTerm, statusFilter, rowsPerPage]
      : ["all-pricing-ready-vehicles", searchTerm, statusFilter],
    queryFn: async () => {
      if (!paginationEnabled) {
        return await fetchAllVehicles();
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: rowsPerPage.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await commonVehicleServices.getPricingReadyVehicles({
        ...Object.fromEntries(params),
      });
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const vehicles = vehiclesData?.data || [];
  const statusCounts = vehiclesData?.statusCounts || {};

  // Sort vehicles when not using pagination
  const sortedVehicles = React.useMemo(() => {
    if (!sortField) return vehicles;

    return [...vehicles].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "vehicle_name") {
        aValue = `${a.make} ${a.model}`;
        bValue = `${b.make} ${b.model}`;
      } else if (sortField === "mileage") {
        aValue = a.latest_odometer || 0;
        bValue = b.latest_odometer || 0;
      } else if (sortField === "license_expiry") {
        aValue = a.license_expiry_date || "";
        bValue = b.license_expiry_date || "";
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

  const getExpiryStatus = (licenseExpiryDate: string) => {
    if (!licenseExpiryDate) return null;

    const today = new Date();
    const expiryDate = new Date(licenseExpiryDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "expired";
    if (diffDays <= 3) return "expiring-soon";
    return "valid";
  };

  const getRowClassName = (vehicle: any) => {
    const status = getExpiryStatus(vehicle.license_expiry_date);
    if (status === "expired") return "bg-red-50 hover:bg-red-100";
    if (status === "expiring-soon") return "bg-orange-50 hover:bg-orange-100";
    return "";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
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

  // Remove handleOpenCostCalculation function

  const getDealershipName = (dealershipId: string) => {
    const dealership = dealerships?.find(
      (dealer: any) => dealer._id === dealershipId
    );
    return dealership ? formatApiNames(dealership.dealership_name) : "Unknown";
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setPage(1);
  };

  const handlePaginationToggle = (checked: any) => {
    setPaginationEnabled(checked);
    setPage(1);
    setTimeout(() => {
      refetch();
    }, 100);
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

  const allStatChips = React.useMemo(() => {
    const chips: StatChip[] = [
      {
        label: "Total",
        value: vehiclesData?.total || 0,
        variant: "default" as const,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        hoverColor: "hover:bg-blue-100",
      },
    ];

    Object.entries(statusCounts).forEach(([status, count]) => {
      chips.push({
        label: formatApiNames(status),
        value: count as number,
        variant: "default" as const,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        hoverColor: "hover:bg-blue-100",
      });
    });

    if (chips.length > 5) {
      const visible = chips.slice(0, 5);
      visible.push({
        label: "More...",
        value: "" as const,
        variant: "default" as const,
        bgColor: "bg-gray-100",
        textColor: "text-gray-700",
        hoverColor: "hover:bg-gray-200",
        onClick: () => setShowAllStatusChips(true),
      });
      return visible;
    }

    return chips;
  }, [vehiclesData, statusCounts]);

  const visibleStatChips = allStatChips.slice(0, 4);

  // Prepare action buttons
  const actionButtons = [
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
      className:
        "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
    },
  ];

  const STATUS_FILTER_OPTIONS = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
  ];

  // Render table header - Remove Actions column
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
        onClick={() => handleSort("vin")}
      >
        <div className="flex items-center">
          VIN
          {getSortIcon("vin")}
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
        onClick={() => handleSort("mileage")}
      >
        <div className="flex items-center">
          Mileage
          {getSortIcon("mileage")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("license_expiry")}
      >
        <div className="flex items-center">
          License Expiry
          {getSortIcon("license_expiry")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("status")}
      >
        <div className="flex items-center">
          Status
          {getSortIcon("status")}
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
        onClick={() => handleSort("vehicle_type")}
      >
        <div className="flex items-center">
          Type
          {getSortIcon("vehicle_type")}
        </div>
      </TableHead>
      {/* Remove Actions TableHead */}
    </TableRow>
  );

  // Render table body - Remove Actions column
  const renderTableBody = () => (
    <>
      {sortedVehicles.map((vehicle: any, index: number) => (
        <TableRow
          key={vehicle._id}
          onClick={() =>
            handleViewDetails(vehicle.vehicle_stock_id, vehicle.vehicle_type)
          }
          className={`cursor-pointer ${getRowClassName(vehicle)}`}
        >
          <TableCell>
            {paginationEnabled
              ? (page - 1) * rowsPerPage + index + 1
              : index + 1}
          </TableCell>
          <TableCell>
            <div>
              <p
                className="font-medium text-blue-600 hover:text-blue-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(
                    vehicle.vehicle_stock_id,
                    vehicle.vehicle_type
                  );
                }}
              >
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
            <p className="font-mono text-sm">{vehicle.vin || "-"}</p>
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
          <TableCell>
            {vehicle.latest_odometer
              ? `${vehicle.latest_odometer.toLocaleString()} km`
              : "-"}
          </TableCell>
          <TableCell>
            <div className="flex flex-col">
              <p className="font-medium">
                {formatDate(vehicle.license_expiry_date)}
              </p>
              {getExpiryStatus(vehicle.license_expiry_date) === "expired" && (
                <p className="text-xs text-red-600 font-semibold">Expired</p>
              )}
              {getExpiryStatus(vehicle.license_expiry_date) ===
                "expiring-soon" && (
                <p className="text-xs text-orange-600 font-semibold">
                  Expiring Soon
                </p>
              )}
            </div>
          </TableCell>
          <TableCell>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {formatApiNames(vehicle.status || "pending")}
            </Badge>
          </TableCell>
          <TableCell>{vehicle.year}</TableCell>
          <TableCell>
            <Badge variant="outline" className="capitalize">
              {vehicle.vehicle_type}
            </Badge>
          </TableCell>
          {/* Remove Actions TableCell */}
        </TableRow>
      ))}
    </>
  );

  return (
    <>
      <DataTableLayout
        title="Vehicle Pricing"
        data={sortedVehicles}
        isLoading={isLoading}
        totalCount={vehiclesData?.total || 0}
        statChips={visibleStatChips}
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
        cookieName="vehicle_pricing_pagination"
      />

      {/* Remove CostCalculationDialog component */}

      <Dialog open={showAllStatusChips} onOpenChange={setShowAllStatusChips}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Status Counts</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {allStatChips.map((chip, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-blue-100 border border-blue-200"
              >
                <span className="text-sm font-medium text-blue-800">
                  {chip.label}
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {chip.value}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <VehiclePricingSideModal
        vehicle={selectedVehicle}
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onUpdate={refetch}
      />
    </>
  );
};

export default VehiclePricingList;