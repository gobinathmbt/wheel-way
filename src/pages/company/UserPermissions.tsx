
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Settings, Save, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { companyServices } from "@/api/services";

import DashboardLayout from "@/components/layout/DashboardLayout";

interface Permission {
  _id: string;
  module_name: string;
  internal_name: string;
  description: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  permissions: string[];
}

interface UserPermission {
  permission_id: string;
  module_name: string;
  internal_name: string;
  description: string;
  enabled: boolean;
}

const UserPermissions = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);

  // ... keep existing code (data fetching and mutations)

  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ["company-users-permissions", page, search, statusFilter],
    queryFn: () =>
      companyServices
        .getUsersWithPermissions({
          page,
          limit: 10,
          search: search || undefined,
          status: statusFilter,
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
      permissions: string[];
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
      const initialPermissions: UserPermission[] = availablePermissions.map(
        (permission: Permission) => {
          const hasPermission = user.permissions?.includes(permission.internal_name) || false;

          return {
            permission_id: permission._id,
            module_name: permission.module_name,
            internal_name: permission.internal_name,
            description: permission.description,
            enabled: hasPermission
          };
        }
      );
      setUserPermissions(initialPermissions);
    }

    setIsDialogOpen(true);
  };

  const handlePermissionToggle = (internalName: string, enabled: boolean) => {
    setUserPermissions((prev) =>
      prev.map((p) =>
        p.internal_name === internalName
          ? { ...p, enabled }
          : p
      )
    );
  };

  const handleSavePermissions = () => {
    if (!selectedUser) return;

    const enabledPermissions = userPermissions
      .filter((p) => p.enabled)
      .map((p) => p.internal_name);

    updatePermissionsMutation.mutate({
      userId: selectedUser._id,
      permissions: enabledPermissions,
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = usersData?.pagination?.total_pages || 1;

  // Group permissions by module
  const groupedPermissions = userPermissions.reduce((acc, permission) => {
    const module = permission.module_name;
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(permission);
    return acc;
  }, {} as Record<string, UserPermission[]>);

  return (
    <DashboardLayout title="User Permissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              User Permissions
            </h2>
            <p className="text-muted-foreground">
              Assign permissions to users and manage their access
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  {search && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={handleClear}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <Button
                onClick={handleClear}
                disabled={!search}
                className="bg-blue-600 text-white hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2 text-white" />
                Clear
              </Button>

              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
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
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => handlePageChange(pageNum)}
                                isActive={page === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
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

        {/* Permissions Management Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                Manage Permissions - {selectedUser?.first_name}{" "}
                {selectedUser?.last_name}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 min-h-0">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([moduleName, permissions]) => (
                    <div key={moduleName} className="space-y-3">
                      <div className="sticky top-0 bg-background pb-2 border-b z-20">
                        <h3 className="text-lg font-semibold text-primary">
                          {moduleName}
                        </h3>
                      </div>
                      
                      <div className="space-y-3 pl-2">
                        {permissions.map((permission) => (
                          <div 
                            key={permission.permission_id} 
                            className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative z-10"
                          >
                            <Switch
                              checked={permission.enabled}
                              onCheckedChange={(checked) =>
                                handlePermissionToggle(
                                  permission.internal_name,
                                  checked
                                )
                              }
                              className="mt-1 relative z-10"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Label className="font-medium text-sm">
                                  {permission.internal_name}
                                </Label>
                                <Badge variant="outline" className="text-xs">
                                  {permission.internal_name}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
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
                {updatePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserPermissions;
