import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";
import { masterServices } from "@/api/services";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface Permission {
  _id: string;
  module_name: string;
  internal_name: string;
  description: string;
  is_active: boolean;
  created_by?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
}

interface MasterDropdown {
  _id: string;
  option_value: string;
  display_value: string;
  is_active: boolean;
}

const Permissions = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPermission, setDeletingPermission] =
    useState<Permission | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [formData, setFormData] = useState({
    module_name: "",
    internal_name: "",
    description: "",
    is_active: true,
  });

  // Fetch master dropdowns for module selection
  const { data: dropdownsData } = useQuery({
    queryKey: ["master-modules-for-permissions"],
    queryFn: () =>
      masterServices
        .getMasterdropdownvalues({
          dropdown_name: ["modules"],
        })
        .then((res) => res.data),
  });

  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ["master-permissions", page, search, status],
    queryFn: () =>
      masterServices
        .getPermissions({
          page,
          limit: 10,
          search: search.trim() || undefined,
          status: status === "all" ? undefined : status,
        })
        .then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: masterServices.createPermission,
    onSuccess: () => {
      toast.success("Permission created successfully");
      queryClient.invalidateQueries({ queryKey: ["master-permissions"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create permission"
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      masterServices.updatePermission(id, data),
    onSuccess: () => {
      toast.success("Permission updated successfully");
      queryClient.invalidateQueries({ queryKey: ["master-permissions"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update permission"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: masterServices.deletePermission,
    onSuccess: () => {
      toast.success("Permission deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["master-permissions"] });
      setIsDeleteDialogOpen(false);
      setDeletingPermission(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete permission"
      );
      setIsDeleteDialogOpen(false);
      setDeletingPermission(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      masterServices.togglePermissionStatus(id, { is_active }),
    onSuccess: () => {
      toast.success("Permission status updated");
      queryClient.invalidateQueries({ queryKey: ["master-permissions"] });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update permission status"
      );
    },
  });

  const resetForm = () => {
    setFormData({
      module_name: "",
      internal_name: "",
      description: "",
      is_active: true,
    });
    setEditingPermission(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPermission) {
      updateMutation.mutate({ id: editingPermission._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      module_name: permission.module_name,
      internal_name: permission.internal_name,
      description: permission.description,
      is_active: permission.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (permission: Permission) => {
    setDeletingPermission(permission);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingPermission) {
      deleteMutation.mutate(deletingPermission._id);
    }
  };

  const handleToggleStatus = (id: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleModuleSelect = (optionValue: string) => {
    const selectedModule = availableModules.find(
      (moduleValue) => moduleValue.option_value === optionValue
    );
    if (selectedModule) {
      setFormData({
        ...formData,
        module_name: selectedModule.option_value,
      });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1); // Reset to first page when filtering
  };

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const availableModules =
    dropdownsData?.data?.find(
      (dropdown) => dropdown.dropdown_name === "modules"
    )?.values || [];
  console.log(availableModules);

  return (
    <DashboardLayout title="User Permissions">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Permission
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPermission ? "Edit Permission" : "Add New Permission"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="module_name">Module Name</Label>
                  {editingPermission ? (
                    <Input
                      id="module_name"
                      value={
                        availableModules.find(
                          (moduleValue) =>
                            moduleValue.option_value === formData.module_name
                        )?.display_value || formData.module_name
                      }
                      disabled
                    />
                  ) : (
                    <Select
                      value={formData.module_name}
                      onValueChange={handleModuleSelect}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a module" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModules.map((moduleValue) => (
                          <SelectItem
                            key={moduleValue._id}
                            value={moduleValue.option_value}
                          >
                            {moduleValue.display_value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internal_name">Internal Name</Label>
                  <Input
                    id="internal_name"
                    value={formData.internal_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        internal_name: e.target.value,
                      })
                    }
                    placeholder="create_user"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Internal permission identifier (lowercase, underscores)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Ability to create new users"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {editingPermission ? "Update" : "Create"} Permission
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={search}
                    onChange={handleSearchChange}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading permissions...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Module Name</TableHead>
                    <TableHead>Internal Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissionsData?.data?.map(
                    (permission: Permission, index: number) => {
                      const moduleDisplayName =
                        availableModules.find(
                          (moduleValue) =>
                            moduleValue.option_value === permission.module_name
                        )?.display_value || permission.module_name;

                      return (
                        <TableRow key={permission._id}>
                          <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {moduleDisplayName}
                          </TableCell>
                          <TableCell>{permission.internal_name}</TableCell>
                          <TableCell>{permission.description}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                permission.is_active ? "default" : "secondary"
                              }
                            >
                              {permission.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {permission.created_by
                              ? `${permission.created_by.first_name} ${permission.created_by.last_name}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(permission)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleToggleStatus(
                                    permission._id,
                                    permission.is_active
                                  )
                                }
                              >
                                {permission.is_active ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(permission)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeletingPermission(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Permission"
          description={`Are you sure you want to delete the permission "${deletingPermission?.internal_name}"? This action cannot be undone.`}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default Permissions;
