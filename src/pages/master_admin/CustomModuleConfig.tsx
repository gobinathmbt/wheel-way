import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, Edit, Trash2, Building2, Settings } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { customModuleServices, masterServices, companyServices } from '@/api/services';

interface CustomModule {
  module_name: string;
  module_display: string;
  is_active: boolean;
  assigned_date?: string;
}

interface CustomModuleConfig {
  _id: string;
  company_id: {
    _id: string;
    company_name: string;
    email: string;
  };
  custom_modules: CustomModule[];
  is_active: boolean;
  created_by: {
    name: string;
    email: string;
  };
  updated_by?: {
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

interface AvailableModule {
  option_value: string;
  display_value: string;
  is_active: boolean;
  _id: string;
}

const CustomModuleConfig = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<CustomModuleConfig | null>(null);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedModules, setSelectedModules] = useState<CustomModule[]>([]);
  const [availableModules, setAvailableModules] = useState<AvailableModule[]>([]);

  const queryClient = useQueryClient();
  const limit = 10;

  // Load available modules
  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await masterServices.getMasterdropdownvalues({
          dropdown_name: ["custom_user_modules"],
        });
        if (response.data.success) {
          // Map the API response to match the expected structure
          const modules = response.data.data[0]?.values || [];
          setAvailableModules(modules);
        }
      } catch (error) {
        console.error('Failed to load modules:', error);
        toast.error('Failed to load available modules');
      }
    };
    loadModules();
  }, []);

  // Fetch configurations
  const { data: configsData, isLoading, error } = useQuery({
    queryKey: ['custom-module-configs', currentPage, searchTerm, statusFilter],
    queryFn: () => customModuleServices.getCustomModuleConfigs({
      page: currentPage,
      limit,
      search: searchTerm,
      status: statusFilter === 'all' ? '' : statusFilter
    }),
  });

  // Fetch companies without configuration
  const { data: companiesData } = useQuery({
    queryKey: ['companies-without-config'],
    queryFn: () => customModuleServices.getCompaniesWithoutConfig(),
    enabled: isDialogOpen && !selectedConfig
  });

  // Create/Update mutation
  const createUpdateMutation = useMutation({
    mutationFn: (data: any) => 
      selectedConfig 
        ? customModuleServices.updateCustomModuleConfig(selectedConfig._id, data)
        : customModuleServices.createCustomModuleConfig(data),
    onSuccess: () => {
      toast.success(`Configuration ${selectedConfig ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['custom-module-configs'] });
      queryClient.invalidateQueries({ queryKey: ['companies-without-config'] });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Operation failed');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customModuleServices.deleteCustomModuleConfig(id),
    onSuccess: () => {
      toast.success('Configuration deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['custom-module-configs'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete configuration');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => 
      customModuleServices.toggleCustomModuleConfigStatus(id, { is_active }),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['custom-module-configs'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleOpenDialog = (config?: CustomModuleConfig) => {
    setSelectedConfig(config || null);
    if (config) {
      setSelectedCompany(config.company_id._id);
      setSelectedModules(config.custom_modules);
    } else {
      setSelectedCompany('');
      setSelectedModules([]);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedConfig(null);
    setSelectedCompany('');
    setSelectedModules([]);
  };

  const handleModuleToggle = (module: AvailableModule, checked: boolean) => {
    if (checked) {
      const newModule: CustomModule = {
        module_name: module.option_value,
        module_display: module.display_value,
        is_active: true
      };
      setSelectedModules([...selectedModules, newModule]);
    } else {
      setSelectedModules(selectedModules.filter(m => m.module_name !== module.option_value));
    }
  };

  const handleModuleStatusToggle = (moduleName: string, isActive: boolean) => {
    setSelectedModules(prevModules => 
      prevModules.map(module => 
        module.module_name === moduleName 
          ? { ...module, is_active: isActive }
          : module
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      toast.error('Please select a company');
      return;
    }

    createUpdateMutation.mutate({
      company_id: selectedCompany,
      custom_modules: selectedModules
    });
  };

  const handleDelete = (config: CustomModuleConfig) => {
    if (window.confirm(`Are you sure you want to delete the configuration for ${config.company_id.company_name}?`)) {
      deleteMutation.mutate(config._id);
    }
  };

  const handleToggleStatus = (config: CustomModuleConfig) => {
    toggleStatusMutation.mutate({
      id: config._id,
      is_active: !config.is_active
    });
  };

  const configs = configsData?.data?.data || [];
  const pagination = configsData?.data?.pagination;

  if (error) {
    return (
      <DashboardLayout title="Custom Module Configuration">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Failed to load configurations</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Custom Module Configuration">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Custom Module Configuration</h1>
            <p className="text-muted-foreground">
              Manage custom modules for companies
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Configuration
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by company name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Custom Modules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading configurations...
                    </TableCell>
                  </TableRow>
                ) : configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No configurations found
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((config: CustomModuleConfig) => (
                    <TableRow key={config._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{config.company_id.company_name}</div>
                          <div className="text-sm text-muted-foreground">{config.company_id.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {config.custom_modules.slice(0, 3).map((module, index) => (
                            <Badge
                              key={index}
                              variant={module.is_active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {module.module_display}
                            </Badge>
                          ))}
                          {config.custom_modules.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{config.custom_modules.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => handleToggleStatus(config)}
                            disabled={toggleStatusMutation.isPending}
                          />
                          <Badge variant={config.is_active ? "default" : "secondary"}>
                            {config.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {config.created_by?.name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(config.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(config)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(config)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
              {pagination.total} configurations
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.current_page - 1)}
                disabled={!pagination.has_prev_page}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.current_page + 1)}
                disabled={!pagination.has_next_page}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedConfig ? 'Edit Configuration' : 'Add Configuration'}
              </DialogTitle>
              <DialogDescription>
                {selectedConfig 
                  ? `Update custom modules for ${selectedConfig.company_id.company_name}`
                  : 'Select a company and assign custom modules'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!selectedConfig && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companiesData?.data?.data?.map((company: any) => (
                        <SelectItem key={company._id} value={company._id}>
                          {company.company_name} ({company.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <Label>Available Custom Modules</Label>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableModules.map((module: AvailableModule) => {
                    const isSelected = selectedModules.some(m => m.module_name === module.option_value);
                    const selectedModule = selectedModules.find(m => m.module_name === module.option_value);
                    
                    return (
                      <div key={module._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={module._id}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleModuleToggle(module, !!checked)}
                          />
                          <Label htmlFor={module._id} className="font-medium">
                            {module.display_value}
                          </Label>
                        </div>
                        {isSelected && selectedModule && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={selectedModule.is_active}
                              onCheckedChange={(checked) => {
                                handleModuleStatusToggle(module.option_value, checked);
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {selectedModule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUpdateMutation.isPending || (!selectedConfig && !selectedCompany)}
                >
                  {createUpdateMutation.isPending
                    ? 'Saving...'
                    : selectedConfig
                    ? 'Update Configuration'
                    : 'Create Configuration'
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CustomModuleConfig;