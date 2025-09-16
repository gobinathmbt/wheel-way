import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RefreshCw,
  Download,
  Upload,
  Plus,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface StatChip {
  label: string;
  value: number;
  variant?: "outline" | "secondary" | "default" | "destructive";
  bgColor?: string;
  textColor?: string;
  hoverColor?: string;
}

interface ActionButton {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
}

interface SortConfig {
  field: string;
  order: "asc" | "desc";
}

interface DataTableLayoutProps {
  // Layout props
  title: string;

  // Data props
  data: any[];
  isLoading: boolean;
  totalCount: number;

  // Stats props
  statChips: StatChip[];

  // Action buttons props
  actionButtons: ActionButton[];

  // Pagination props
  page: number;
  rowsPerPage: number;
  paginationEnabled: boolean;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: string) => void;
  onPaginationToggle: (enabled: boolean) => void;

  // Sorting props
  sortField: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  getSortIcon: (field: string) => React.ReactNode;

  // Table content (render props)
  renderTableHeader: () => React.ReactNode;
  renderTableBody: () => React.ReactNode;

  // Refresh
  onRefresh: () => void;
}

const DataTableLayout: React.FC<DataTableLayoutProps> = ({
  title,
  data,
  isLoading,
  totalCount,
  statChips,
  actionButtons,
  page,
  rowsPerPage,
  paginationEnabled,
  onPageChange,
  onRowsPerPageChange,
  onPaginationToggle,
  sortField,
  sortOrder,
  onSort,
  getSortIcon,
  renderTableHeader,
  renderTableBody,
  onRefresh,
}) => {
  const totalPages = paginationEnabled
    ? Math.ceil(totalCount / rowsPerPage)
    : 1;

  // Generate pagination items with first, last, and nearby pages
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    // Always show first page
    if (totalPages > 0) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => onPageChange(1)}
            isActive={page === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Add ellipsis if there's a gap after first page
    if (page > 4 && totalPages > 6) {
      items.push(
        <PaginationItem key="start-ellipsis">
          <span className="px-3 py-1">...</span>
        </PaginationItem>
      );
    }

    // Show previous 2, current, and next 2 pages (excluding first and last)
    const start = Math.max(2, page - 2);
    const end = Math.min(totalPages - 1, page + 2);

    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => onPageChange(i)}
              isActive={page === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    // Add ellipsis if there's a gap before last page
    if (page < totalPages - 3 && totalPages > 6) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <span className="px-3 py-1">...</span>
        </PaginationItem>
      );
    }

    // Always show last page (if more than 1 page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => onPageChange(totalPages)}
            isActive={page === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Generate page options for dropdown
  const getPageOptions = () => {
    const options = [];
    for (let i = 1; i <= totalPages; i++) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {i}
        </SelectItem>
      );
    }
    return options;
  };

  return (
    <DashboardLayout title={title}>
      <div className="flex flex-col h-full">
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left side - Count chips */}
            <div className="flex items-center space-x-3">
              {statChips.map((chip, index) => (
                <Badge
                  key={index}
                  variant={chip.variant || "outline"}
                  className={`px-3 py-1 ${chip.bgColor || "bg-gray-100"} ${
                    chip.textColor || ""
                  } ${chip.hoverColor || "hover:bg-gray-100"}`}
                >
                  {chip.label}: {chip.value}
                </Badge>
              ))}
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRefresh}
                      disabled={isLoading}
                      className="bg-gray-50 hover:bg-gray-100 p-2"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh Data</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Custom Action Buttons */}
              {actionButtons.map((button, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={button.variant || "outline"}
                        size="sm"
                        onClick={button.onClick}
                        disabled={button.disabled}
                        className={`p-2 ${button.className || ""}`}
                      >
                        {button.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{button.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}

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
                    <TableHeader className="sticky top-0 bg-white z-10 border-b shadow-sm">
                      {renderTableHeader()}
                    </TableHeader>
                    <TableBody>{renderTableBody()}</TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fixed Footer with Pagination */}
        <div className="bg-white border-t border-gray-200 py-2 px-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Left side - Pagination checkbox */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pagination"
                  checked={paginationEnabled}
                  onCheckedChange={onPaginationToggle}
                />
                <Label
                  htmlFor="pagination"
                  className="text-sm text-muted-foreground"
                >
                  Pagination
                </Label>
              </div>

              {paginationEnabled && (
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={onRowsPerPageChange}
                >
                  <SelectTrigger className="w-16 h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Center - Pagination controls */}
            {paginationEnabled && totalPages > 0 && (
              <Pagination className="justify-center">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && onPageChange(page - 1)}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getPaginationItems()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        page < totalPages && onPageChange(page + 1)
                      }
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

            {/* Right side - Go to page dropdown */}
            {paginationEnabled && totalPages > 0 && (
              <div className="flex items-center space-x-2">
                <Select
                  value={page.toString()}
                  onValueChange={(value) => onPageChange(parseInt(value))}
                >
                  <SelectTrigger className="w-16 h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{getPageOptions()}</SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DataTableLayout;
