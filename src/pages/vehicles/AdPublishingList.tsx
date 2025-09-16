import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  Eye,
  Download,
  Upload,
  Plus,
  Globe,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { adPublishingServices, authServices } from "@/api/services";
import ConfigurationSearchmore from "@/components/inspection/ConfigurationSearchmore";
import VehicleDetailSideModal from "@/components/vehicles/VehicleDetailSideModal";
import CreateVehicleStockModal from "@/components/vehicles/CreateVehicleStockModal";
import DataTableLayout from "@/components/common/DataTableLayout";

const AdPublishingList = () => {
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

  // Fetch current user's permissions
  const { data: userPermissions } = useQuery({
    queryKey: ["user-permissions"],
    queryFn: async () => {
      const response = await authServices.getCurrentUserPermissions();
      return response.data;
    },
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

        const response = await adPublishingServices.getAdVehicles({
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
      ? ["ad-vehicles", page, searchTerm, statusFilter, rowsPerPage]
      : ["all-ad-vehicles", searchTerm, statusFilter],
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

      const response = await adPublishingServices.getAdVehicles({
        ...Object.fromEntries(params),
      });
      return response.data;
    },
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

  const handleSort = (field: string) => {
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

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const handlePublishAd = async (vehicleId: string) => {
    try {
      await adPublishingServices.publishAdVehicle(vehicleId);
      toast.success("Advertisement published successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to publish advertisement");
    }
  };

  const handleViewDetails = async (vehicleId: string) => {
    try {
      const response = await adPublishingServices.getAdVehicle(vehicleId);
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
    setPage(1);
  };

  const handlePaginationToggle = (checked: boolean) => {
    setPaginationEnabled(checked);
    setPage(1);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Data refreshed");
  };

  const handleExport = () => {
    toast.success("Export started");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "published":
        return "default";
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Calculate counts for chips
  const totalVehicles = vehiclesData?.total || 0;
  const pendingCount = vehicles.filter((v: any) => v.status === "pending").length;
  const publishedCount = vehicles.filter((v: any) => v.status === "published").length;
  const completedCount = vehicles.filter((v: any) => v.status === "completed").length;

  // Prepare stat chips
  const statChips = [
    {
      label: "Total Ads",
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
      label: "Published",
      value: publishedCount,
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
      tooltip: "Create Advertisement",
      onClick: () => setIsCreateModalOpen(true),
      className: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200",
    },
    {
      icon: <Upload className="h-4 w-4" />,
      tooltip: "Import Vehicles",
      onClick: () => toast.info("Import feature coming soon"),
      className: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200",
    },
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
        onClick={() => handleSort("status")}
      >
        <div className="flex items-center">
          Status
          {getSortIcon("status")}
        </div>
      </TableHead>
      <TableHead className="bg-muted/50">Actions</TableHead>
    </TableRow>
  );

  // Render table body
  const renderTableBody = () => (
    <>
      {sortedVehicles.map((vehicle: any, index: number) => (
        <TableRow key={vehicle._id}>
          <TableCell>
            {paginationEnabled
              ? (page - 1) * rowsPerPage + index + 1
              : index + 1}
          </TableCell>
          <TableCell>
            <div>
              <p className="font-medium">{vehicle.vehicle_stock_id}</p>
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Globe className="h-5 w-5 text-muted-foreground" />
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
            {vehicle.vehicle_odometer?.[0]?.reading?.toLocaleString()} km
          </TableCell>
          <TableCell>
            <Badge
              variant={getStatusColor(vehicle.status)}
              className={
                vehicle.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                  : vehicle.status === "published"
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                  : vehicle.status === "completed"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : ""
              }
            >
              {vehicle.status?.replace("_", " ") || "Pending"}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleViewDetails(vehicle.vehicle_stock_id)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {vehicle.status === "pending" && (
                <Button
                  size="sm"
                  onClick={() => handlePublishAd(vehicle.vehicle_stock_id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  Publish
                </Button>
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <>
      <DataTableLayout
        title="Advertisement Publishing"
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
      />

      {/* Vehicle Details Side Modal */}
      <VehicleDetailSideModal
        vehicle={selectedVehicle}
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onUpdate={refetch}
        vehicleType="advertisement"
      />

      {/* Create Vehicle Stock Modal */}
      <CreateVehicleStockModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        vehicleType="advertisement"
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
      />
    </>
  );
};

export default AdPublishingList;