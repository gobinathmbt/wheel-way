import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { workshopServices } from "@/api/services";
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
  ArrowDown,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import DataTableLayout from "@/components/common/DataTableLayout";
import ConfigurationSearchmore from "@/components/inspection/ConfigurationSearchmore";

const Workshop = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [paginationEnabled, setPaginationEnabled] = useState(true);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Function to fetch all vehicles when pagination is disabled
  const fetchAllVehicles = async () => {
    try {
      let allData = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = {
          page: currentPage,
          limit: 100,
          ...(searchTerm && { search: searchTerm }),
          ...(vehicleTypeFilter !== "all" && { vehicle_type: vehicleTypeFilter }),
        };

        const response = await workshopServices.getWorkshopVehicles(params);
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
      ? ["workshop-vehicles", page, searchTerm, vehicleTypeFilter, rowsPerPage]
      : ["all-workshop-vehicles", searchTerm, vehicleTypeFilter],
    queryFn: async () => {
      if (!paginationEnabled) {
        return await fetchAllVehicles();
      }

      const params = {
        page: page,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(vehicleTypeFilter !== "all" && { vehicle_type: vehicleTypeFilter }),
      };

      const response = await workshopServices.getWorkshopVehicles(params);
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
        aValue = a.name || `${a.year} ${a.make} ${a.model}`;
        bValue = b.name || `${b.year} ${b.make} ${b.model}`;
      } else if (sortField === "created_at") {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
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
    setVehicleTypeFilter("all");
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

  // Calculate counts for chips
  const totalVehicles = vehiclesData?.total || 0;
  const inspectionCount = vehicles.filter(
    (v: any) => v.vehicle_type === "inspection"
  ).length;
  const tradeinCount = vehicles.filter(
    (v: any) => v.vehicle_type === "tradein"
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
      label: "Inspection",
      value: inspectionCount,
      variant: "default" as const,
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      hoverColor: "hover:bg-blue-100",
    },
    {
      label: "Trade-in",
      value: tradeinCount,
      variant: "secondary" as const,
      bgColor: "bg-purple-100",
      textColor: "text-purple-800",
      hoverColor: "hover:bg-purple-100",
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
      icon: <Upload className="h-4 w-4" />,
      tooltip: "Import Vehicles",
      onClick: () => toast.info("Import feature coming soon"),
      className:
        "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200",
    },
  ];

  // Render table header
  const renderTableHeader = () => (
    <TableRow>
      <TableHead className="bg-muted/50">S.No</TableHead>
      <TableHead className="bg-muted/50">Image</TableHead>
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
        onClick={() => handleSort("vehicle_stock_id")}
      >
        <div className="flex items-center">
          Stock ID
          {getSortIcon("vehicle_stock_id")}
        </div>
      </TableHead>
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("plate_no")}
      >
        <div className="flex items-center">
          Plate No
          {getSortIcon("plate_no")}
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
      <TableHead
        className="bg-muted/50 cursor-pointer hover:bg-muted/70"
        onClick={() => handleSort("created_at")}
      >
        <div className="flex items-center">
          Created At
          {getSortIcon("created_at")}
        </div>
      </TableHead>
      <TableHead className="bg-muted/50">Action</TableHead>
    </TableRow>
  );

  // Render table body
  const renderTableBody = () => (
    <>
      {sortedVehicles.length > 0 ? (
        sortedVehicles.map((vehicle: any, index: number) => (
          <TableRow key={vehicle._id}>
            <TableCell>
              {paginationEnabled
                ? (page - 1) * rowsPerPage + index + 1
                : index + 1}
            </TableCell>
            <TableCell>
              <img
                src={vehicle.vehicle_hero_image}
                alt={vehicle.name}
                className="h-12 w-20 object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-vehicle.png";
                }}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-3">
                <div>
                  <p className="font-medium">
                    {vehicle.name ||
                      `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.variant || vehicle.model}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{vehicle.vehicle_stock_id}</p>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{vehicle.plate_no}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  vehicle.vehicle_type === "inspection"
                    ? "default"
                    : "secondary"
                }
                className={
                  vehicle.vehicle_type === "inspection"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                    : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                }
              >
                {vehicle.vehicle_type}
              </Badge>
            </TableCell>
            <TableCell>
              <div>
                <p className="font-medium">
                  {new Date(vehicle.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(vehicle.created_at).toLocaleTimeString()}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Link
                to={`/company/workshop-config/${vehicle.vehicle_stock_id}/${vehicle.vehicle_type}`}
              >
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-16">
            <div className="flex flex-col items-center">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
              <p className="text-muted-foreground">
                No vehicles with inspection results found. Vehicles will appear
                here once they have inspection data.
              </p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );

  return (
    <>
      <DataTableLayout
        title="Workshop"
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

      {/* Search and Filter Modal */}
      <WorkshopSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        vehicleTypeFilter={vehicleTypeFilter}
        onVehicleTypeChange={setVehicleTypeFilter}
        onClear={handleClearFilters}
        isLoading={isLoading}
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
      />
    </>
  );
};

// Workshop-specific search and filter component
const WorkshopSearchFilter = ({
  searchTerm,
  onSearchChange,
  vehicleTypeFilter,
  onVehicleTypeChange,
  onClear,
  isLoading,
  isOpen,
  onOpenChange,
}) => {
  return (
    <ConfigurationSearchmore
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      statusFilter={vehicleTypeFilter}
      onFilterChange={onVehicleTypeChange}
      onClear={onClear}
      isLoading={isLoading}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      filterOptions={[
        { value: "all", label: "All Types" },
        { value: "inspection", label: "Inspection" },
        { value: "tradein", label: "Trade-in" },
      ]}
      filterLabel="Vehicle Type"
    />
  );
};

export default Workshop;