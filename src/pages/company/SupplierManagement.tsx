import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supplierServices, companyServices } from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, ChevronDown, Check, ChevronsUpDown } from "lucide-react";
import { Search, Plus, Edit, Trash2, Tags, Filter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  option_value: string;
  display_value: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);

  const toggleOption = (displayValue: string) => {
    const isSelected = selectedValues.includes(displayValue);
    if (isSelected) {
      onSelectionChange(selectedValues.filter((item) => item !== displayValue));
    } else {
      onSelectionChange([...selectedValues, displayValue]);
    }
  };

  const removeItem = (valueToRemove: string) => {
    onSelectionChange(selectedValues.filter((item) => item !== valueToRemove));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-10 px-3 py-2"
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedValues.map((value, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {value}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(value);
                    }}
                  />
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search options..." className="h-9" />
          <CommandEmpty>No options found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-60">
              {selectedValues.length > 0 && (
                <CommandItem
                  onSelect={clearAll}
                  className="justify-center text-center cursor-pointer"
                >
                  Clear all
                </CommandItem>
              )}
              {options.map((option) => {
                const isSelected = selectedValues.includes(
                  option.display_value
                );
                return (
                  <CommandItem
                    key={option.option_value}
                    onSelect={() => toggleOption(option.display_value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.display_value}
                  </CommandItem>
                );
              })}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const SupplierManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    supplier_shop_name: "",
    tags: [] as string[],
    is_active: true,
  });

  const queryClient = useQueryClient();

  // Fetch suppliers with pagination and filters
  const {
    data: suppliersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["suppliers", page, search, statusFilter, tagFilter],
    queryFn: async () => {
      const params = {
        page,
        limit: 20,
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(tagFilter.length > 0 && { tags: tagFilter }),
      };
      const response = await supplierServices.getSuppliers(params);
      return response.data;
    },
  });

  // Fetch tradie tags
  const { data: tradieTagsData } = useQuery({
    queryKey: ["tradie-tags"],
    queryFn: () =>
      companyServices
        .getCompanyMasterdropdownvalues({
          dropdown_name: ["tradie_tags"],
        })
        .then((res) => res.data),
  });

  const availableTags =
    tradieTagsData?.data?.find(
      (dropdown) => dropdown.dropdown_name === "tradie_tags"
    )?.values || [];

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: (data: any) => supplierServices.createSupplier(data),
    onSuccess: () => {
      toast.success("Supplier created successfully");
      refetch();
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create supplier");
    },
  });

  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      supplierServices.updateSupplier(id, data),
    onSuccess: () => {
      toast.success("Supplier updated successfully");
      refetch();
      setIsEditModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update supplier");
    },
  });

  // Toggle supplier status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      supplierServices.updateSupplier(id, { is_active }),
    onSuccess: () => {
      toast.success("Supplier status updated successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      address: "",
      supplier_shop_name: "",
      tags: [],
      is_active: true,
    });
    setSelectedSupplier(null);
  };

  const handleCreateSupplier = () => {
    setIsCreateModalOpen(true);
    resetForm();
  };

  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name || "",
      email: supplier.email || "",
      address: supplier.address || "",
      supplier_shop_name: supplier.supplier_shop_name || "",
      tags: supplier.tags || [],
      is_active: supplier.is_active,
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error("Name and email are required");
      return;
    }

    if (selectedSupplier) {
      updateSupplierMutation.mutate({
        id: selectedSupplier._id,
        data: formData,
      });
    } else {
      createSupplierMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (supplier: any) => {
    toggleStatusMutation.mutate({
      id: supplier._id,
      is_active: !supplier.is_active,
    });
  };

  const suppliers = suppliersData?.data || [];
  const pagination = suppliersData?.pagination || {};

  return (
    <DashboardLayout title="Supplier Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Supplier Management</h2>
            <p className="text-muted-foreground">
              Manage workshop suppliers and service providers
            </p>
          </div>
          <Button onClick={handleCreateSupplier}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
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
                    placeholder="Search suppliers by name, email, or shop..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-full md:w-48">
                <MultiSelectDropdown
                  options={availableTags}
                  selectedValues={tagFilter}
                  onSelectionChange={setTagFilter}
                  placeholder="Filter by Tags"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Supplier Details</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((supplier: any, index: number) => (
                      <TableRow key={supplier._id}>
                        <TableCell>{(page - 1) * 20 + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            {supplier.supplier_shop_name && (
                              <p className="text-sm text-muted-foreground">
                                {supplier.supplier_shop_name}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{supplier.email}</p>
                            {supplier.address && (
                              <p className="text-xs text-muted-foreground truncate max-w-32">
                                {supplier.address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {supplier.tags
                              ?.slice(0, 2)
                              .map((tag: string, tagIndex: number) => (
                                <Badge
                                  key={tagIndex}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            {supplier.tags?.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{supplier.tags.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={supplier.is_active}
                              onCheckedChange={() =>
                                handleToggleStatus(supplier)
                              }
                            />
                            <Badge
                              variant={
                                supplier.is_active ? "default" : "secondary"
                              }
                            >
                              {supplier.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSupplier(supplier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(page - 1) * 20 + 1} to{" "}
                      {Math.min(page * 20, pagination.total_records)} of{" "}
                      {pagination.total_records} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(5, pagination.total_pages) },
                          (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  page === pageNum ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setPage(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                        {pagination.total_pages > 5 && (
                          <>
                            <span className="px-2">...</span>
                            <Button
                              variant={
                                page === pagination.total_pages
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setPage(pagination.total_pages)}
                            >
                              {pagination.total_pages}
                            </Button>
                          </>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={page === pagination.total_pages}
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

      {/* Create/Edit Supplier Modal */}
      <Dialog
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSupplier ? "Edit Supplier" : "Create New Supplier"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter supplier name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shop_name">Shop Name</Label>
                <Input
                  id="shop_name"
                  value={formData.supplier_shop_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplier_shop_name: e.target.value,
                    }))
                  }
                  placeholder="Enter shop name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label>Active Status</Label>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Enter supplier address"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="mt-2">
                <MultiSelectDropdown
                  options={availableTags}
                  selectedValues={formData.tags}
                  onSelectionChange={(selectedTags) =>
                    setFormData((prev) => ({ ...prev, tags: selectedTags }))
                  }
                  placeholder="Select tags for supplier"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createSupplierMutation.isPending ||
                  updateSupplierMutation.isPending
                }
              >
                {createSupplierMutation.isPending ||
                updateSupplierMutation.isPending
                  ? "Saving..."
                  : selectedSupplier
                  ? "Update Supplier"
                  : "Create Supplier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default SupplierManagement;
