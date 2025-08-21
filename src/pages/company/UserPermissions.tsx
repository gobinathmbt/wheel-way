
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Settings, Save, Filter } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { companyServices } from "@/api/services";

import DashboardLayout from "@/components/layout/DashboardLayout";

interface Permission {
  _id: string;
  module_name: string;
  internal_name: string;
  description: string;
}

interface UserPermission {
  permission_id: Permission;
  actions: string[];
}

interface User {
  _id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  permissions: UserPermission[];
}

const UserPermissions = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["company-users-permissions", page, search, statusFilter],
    queryFn: () =>
      companyServices
        .getUsersWithPermissions({
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        })
        .then((res) => res.data),
  });

  const { data: availablePermissions } = useQuery({
    queryKey: ["available-permissions"],
    queryFn: () =>
      companyServices.getAvailablePermissions().then((res) => res.data.data),
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: any[];
    }) => companyServices.updateUserPermissions(userId, { permissions }),
    onSuccess: () => {
      toast.success("User permissions updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["company-users-permissions"],
      });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update permissions"
      );
    },
  });

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user);

    // Initialize permissions state
    if (availablePermissions) {
      const initialPermissions = availablePermissions.map(
        (permission: Permission) => {
          const userPermission = user.permissions?.find(
            (up: UserPermission) => up.permission_id._id === permission._id
          );

          return {
            permission_id: permission._id,
            module_name: permission.module_name,
            internal_name: permission.internal_name,
            description: permission.description,
            enabled: !!userPermission,
            actions: userPermission?.actions || ["read"],
          };
        }
      );
      setUserPermissions(initialPermissions);
    }

    setIsDialogOpen(true);
  };

  const handlePermissionToggle = (permissionId: string, enabled: boolean) => {
    setUserPermissions((prev) =>
      prev.map((p) =>
        p.permission_id === permissionId
          ? { ...p, enabled, actions: enabled ? p.actions : [] }
          : p
      )
    );
  };

  const handleActionToggle = (
    permissionId: string,
    action: string,
    checked: boolean
  ) => {
    setUserPermissions((prev) =>
      prev.map((p) =>
        p.permission_id === permissionId
          ? {
              ...p,
              actions: checked
                ? [...p.actions, action]
                : p.actions.filter((a: string) => a !== action),
            }
          : p
      )
    );
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;

    const enabledPermissions = userPermissions
      .filter((p) => p.enabled)
      .map((p) => ({
        permission_id: p.permission_id,
        actions: p.actions.length > 0 ? p.actions : ["read"],
      }));

    updatePermissionsMutation.mutate({
      userId: selectedUser._id,
      permissions: enabledPermissions,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const actionTypes = ["create", "read", "update", "delete"];

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = usersData?.pagination?.total_pages || 1;

  return (
    <DashboardLayout title="User Permissions">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Permissions Assignment
          </h2>
          <p className="text-muted-foreground">
            Assign the Permissions To Users and Manage Their Access
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading users...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Permissions Count</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.data?.map((user: User, index: number) => (
                      <TableRow key={user._id}>
                        <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role.replace("_", " ").toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? "default" : "secondary"}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.permissions?.length || 0}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManagePermissions(user)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Permissions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(pageNum => {
                            return pageNum === 1 || 
                                   pageNum === totalPages || 
                                   (pageNum >= page - 1 && pageNum <= page + 1);
                          })
                          .map((pageNum, index, array) => (
                            <React.Fragment key={pageNum}>
                              {index > 0 && array[index - 1] !== pageNum - 1 && (
                                <PaginationItem>
                                  <span className="px-3 py-2">...</span>
                                </PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNum)}
                                  isActive={pageNum === page}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            </React.Fragment>
                          ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Manage Permissions - {selectedUser?.first_name}{" "}
                {selectedUser?.last_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4">
                {userPermissions.map((permission) => (
                  <Card key={permission.permission_id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.permission_id}
                          checked={permission.enabled}
                          onCheckedChange={(checked) =>
                            handlePermissionToggle(
                              permission.permission_id,
                              !!checked
                            )
                          }
                        />
                        <Label
                          htmlFor={permission.permission_id}
                          className="font-semibold"
                        >
                          {permission.module_name}
                        </Label>
                        <Badge variant="outline">
                          {permission.internal_name}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground ml-6">
                        {permission.description}
                      </p>

                      {permission.enabled && (
                        <div className="ml-6 space-y-2">
                          <Label className="text-sm font-medium">
                            Actions:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {actionTypes.map((action) => (
                              <div
                                key={action}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`${permission.permission_id}-${action}`}
                                  checked={permission.actions.includes(action)}
                                  onCheckedChange={(checked) =>
                                    handleActionToggle(
                                      permission.permission_id,
                                      action,
                                      !!checked
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`${permission.permission_id}-${action}`}
                                  className="text-sm capitalize"
                                >
                                  {action}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={updatePermissionsMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Permissions
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserPermissions;
