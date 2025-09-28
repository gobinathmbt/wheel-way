import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationConfigServices, dealershipServices } from '@/api/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Bell, Settings, Users, Database, Search, MoreHorizontal, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EnhancedNotificationConfigForm from '@/components/notifications/EnhancedNotificationConfigForm'; // Import the enhanced form

interface NotificationConfiguration {
  _id: string;
  name: string;
  description: string;
  trigger_type: 'create' | 'update' | 'delete' | 'custom_event';
  target_schema: string;
  target_fields: Array<{
    field_name: string;
    operator: string;
    value: any;
    condition: 'and' | 'or';
  }>;
  target_users: {
    type: 'all' | 'specific_users' | 'role_based' | 'department_based' | 'dealership_based';
    user_ids: string[];
    roles: string[];
    departments: string[];
    dealership_ids: string[];
    exclude_user_ids: string[];
  };
  message_template: {
    title: string;
    body: string;
    action_url?: string;
    variables: Array<{
      variable_name: string;
      field_path: string;
    }>;
  };
  notification_channels: {
    in_app: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_active: boolean;
  created_by: {
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface SchemaField {
  field: string;
  type: string;
  enums?: string[];
}

interface Schema {
  fields: SchemaField[];
  relationships: string[];
}

const NotificationConfiguration: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<NotificationConfiguration | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch notification configurations
  const { data: configurationsData, isLoading: loadingConfigurations } = useQuery({
    queryKey: ['notification-configurations', currentPage, searchTerm, statusFilter],
    queryFn: () => notificationConfigServices.getNotificationConfigurations({
      page: currentPage,
      limit: 10,
      search: searchTerm,
      status: statusFilter
    })
  });

  // Fetch available schemas
  const { data: schemasData } = useQuery({
    queryKey: ['available-schemas'],
    queryFn: () => notificationConfigServices.getAvailableSchemas()
  });

  // Fetch company users
  const { data: usersData } = useQuery({
    queryKey: ['company-users'],
    queryFn: () => notificationConfigServices.getCompanyUsers()
  });

  // Fetch dealerships
  const { data: dealershipsData } = useQuery({
    queryKey: ['company-dealerships'],
    queryFn: () => dealershipServices.getDealerships()
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationConfigServices.deleteNotificationConfiguration(id),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Notification configuration deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['notification-configurations'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete configuration', variant: 'destructive' });
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      notificationConfigServices.toggleNotificationConfigurationStatus(id, { is_active }),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Status updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['notification-configurations'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to update status', variant: 'destructive' });
    }
  });

  const configurations = configurationsData?.data?.data?.configurations || [];
  const pagination = configurationsData?.data?.data?.pagination;
  const availableSchemas = schemasData?.data?.data || {};
  const users = usersData?.data?.data || [];
  const dealerships = dealershipsData?.data?.data || [];

  const handleDelete = (config: NotificationConfiguration) => {
    if (window.confirm(`Are you sure you want to delete "${config.name}"?`)) {
      deleteMutation.mutate(config._id);
    }
  };

  const handleToggleStatus = (config: NotificationConfiguration) => {
    toggleStatusMutation.mutate({
      id: config._id,
      is_active: !config.is_active
    });
  };

  const handleEdit = (config: NotificationConfiguration) => {
    setSelectedConfig(config);
    setIsEditDialogOpen(true);
  };

  const handleView = (config: NotificationConfiguration) => {
    setSelectedConfig(config);
    // Could open a view-only dialog here
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getSchemaIcon = (schema: string) => {
    switch (schema) {
      case 'User': return <Users className="h-4 w-4" />;
      case 'Vehicle': return <Database className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const handleFormSuccess = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedConfig(null);
    queryClient.invalidateQueries({ queryKey: ['notification-configurations'] });
  };

  return (
    <DashboardLayout title="Notification Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notification Configuration</h1>
            <p className="text-muted-foreground">
              Create and manage custom notifications for your organization
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Configuration
            </Button>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <EnhancedNotificationConfigForm
                schemas={availableSchemas}
                users={users}
                dealerships={dealerships}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Configurations</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pagination?.total_records || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {configurations.filter((c: NotificationConfiguration) => c.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Schemas</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(availableSchemas).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search configurations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Configurations</CardTitle>
            <CardDescription>
              Manage your notification configurations and their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingConfigurations ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading configurations...</div>
              </div>
            ) : configurations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notification configurations found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    Create Your First Configuration
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schema</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Conditions</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configurations.map((config: NotificationConfiguration) => (
                    <TableRow key={config._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{config.name}</div>
                          {config.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {config.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getSchemaIcon(config.target_schema)}
                          <span>{config.target_schema}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {config.trigger_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {config.target_fields && config.target_fields.length > 0 ? (
                          <Badge variant="secondary">
                            {config.target_fields.length} condition{config.target_fields.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(config.priority) as any}>
                          {config.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => handleToggleStatus(config)}
                            disabled={toggleStatusMutation.isPending}
                          />
                          <span className="text-sm text-muted-foreground">
                            {config.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {config.created_by?.first_name} {config.created_by?.last_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(config)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(config)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(config)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {configurations.length} of {pagination.total_records} configurations
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.has_previous}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.has_next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedConfig && (
              <EnhancedNotificationConfigForm
                schemas={availableSchemas}
                users={users}
                dealerships={dealerships}
                editData={selectedConfig}
                onSuccess={handleFormSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default NotificationConfiguration;