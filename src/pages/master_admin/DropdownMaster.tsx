
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Search, Edit, Trash2, Database, Settings, Plus, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { masterDropdownServices } from '@/api/services';
import MasterValueManagementDialog from '@/components/master-dropdown/MasterValueManagementDialog';

const MasterDropdownMaster = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDropdown, setSelectedDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editDropdown, setEditDropdown] = useState(null);

  const [formData, setFormData] = useState({
    dropdown_name: '',
    display_name: '',
    description: '',
    allow_multiple_selection: false,
    is_required: false
  });

  const { data: dropdownsData, isLoading, refetch } = useQuery({
    queryKey: ['master-dropdowns', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await masterDropdownServices.getMasterDropdowns({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });
      return response.data;
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await masterDropdownServices.createMasterDropdown(formData);
      toast.success('Master dropdown created successfully');
      setIsDialogOpen(false);
      setFormData({
        dropdown_name: '',
        display_name: '',
        description: '',
        allow_multiple_selection: false,
        is_required: false
      });
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create master dropdown');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await masterDropdownServices.updateMasterDropdown(editDropdown._id, editDropdown);
      toast.success('Master dropdown updated successfully');
      setIsEditDialogOpen(false);
      setEditDropdown(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update master dropdown');
    }
  };

  const handleToggleStatus = async (dropdownId, currentStatus) => {
    try {
      await masterDropdownServices.updateMasterDropdown(dropdownId, { is_active: !currentStatus });
      toast.success('Status updated successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const confirmDeleteDropdown = (dropdownId) => {
    setDeleteTargetId(dropdownId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDropdown = async () => {
    try {
      await masterDropdownServices.deleteMasterDropdown(deleteTargetId);
      toast.success('Master dropdown deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete master dropdown');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  const dropdowns = dropdownsData?.data || [];
  const pagination = dropdownsData?.pagination || {};

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleClear = () => {
    setSearchTerm('');
    setCurrentPage(1);
    refetch();
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout title="Master Dropdown Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Master Dropdown Management</h2>
            <p className="text-muted-foreground">Create and manage global dropdown options for all companies</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Database className="h-4 w-4 mr-2" />
                Create Master Dropdown
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Master Dropdown</DialogTitle>
                <DialogDescription>
                  Create a global dropdown that can be used across all companies
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="dropdown_name">Dropdown Name</Label>
                  <Input
                    id="dropdown_name"
                    value={formData.dropdown_name}
                    onChange={(e) => setFormData({ ...formData, dropdown_name: e.target.value })}
                    placeholder="vehicle_condition"
                    required
                  />
                  <p className="text-sm text-muted-foreground">Used internally (lowercase, no spaces)</p>
                </div>
                <div>
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Vehicle Condition"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Global condition options for vehicles"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allow_multiple"
                    checked={formData.allow_multiple_selection}
                    onCheckedChange={(checked) => setFormData({ ...formData, allow_multiple_selection: checked === true })}
                  />
                  <Label htmlFor="allow_multiple">Allow multiple selections</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked === true })}
                  />
                  <Label htmlFor="is_required">Required field</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Dropdown</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
                    placeholder="Search master dropdowns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              <Button
                onClick={handleClear}
                disabled={!searchTerm}
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

        {/* Dropdowns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Master Dropdowns</CardTitle>
            <CardDescription>Manage global dropdown configurations for all companies</CardDescription>
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
                      <TableHead>Display Name</TableHead>
                      <TableHead>Values</TableHead>
                      <TableHead>Settings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dropdowns.map((dropdown, index) => (
                      <TableRow key={dropdown._id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dropdown.dropdown_name}</p>
                            <p className="text-sm text-muted-foreground">{dropdown.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{dropdown.display_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dropdown.values?.slice(0, 3).map((value, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {value.display_value || value.option_value}
                              </Badge>
                            ))}
                            {dropdown.values?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{dropdown.values.length - 3} more
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDropdown(dropdown);
                                setIsValueDialogOpen(true);
                              }}
                              className="h-6 px-2"
                              title="Add Value"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {dropdown.allow_multiple_selection && (
                              <Badge variant="outline" className="text-xs">Multi</Badge>
                            )}
                            {dropdown.is_required && (
                              <Badge variant="outline" className="text-xs">Required</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={dropdown.is_active}
                              onCheckedChange={() => handleToggleStatus(dropdown._id, dropdown.is_active)}
                            />
                            <Badge variant={dropdown.is_active ? "default" : "secondary"} className={dropdown.is_active ? "bg-green-500" : "bg-gray-500"}>
                              {dropdown.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedDropdown(dropdown);
                                setIsValueDialogOpen(true);
                              }}
                              title="Manage Values"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditDropdown(dropdown);
                                setIsEditDialogOpen(true);
                              }}
                              title="Edit Dropdown"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => confirmDeleteDropdown(dropdown._id)}
                              title="Delete Dropdown"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          let page;
                          if (pagination.pages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= pagination.pages - 2) {
                            page = pagination.pages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handlePageChange(Math.min(pagination.pages, currentPage + 1))}
                            className={currentPage === pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

        {/* Value Management Dialog */}
        <MasterValueManagementDialog
          isOpen={isValueDialogOpen}
          onClose={() => setIsValueDialogOpen(false)}
          dropdown={selectedDropdown}
          onRefetch={refetch}
        />

        {/* Edit Dropdown Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Master Dropdown</DialogTitle>
              <DialogDescription>Update details for this master dropdown</DialogDescription>
            </DialogHeader>
            {editDropdown && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit_dropdown_name">Dropdown Name</Label>
                  <Input
                    id="edit_dropdown_name"
                    value={editDropdown.dropdown_name}
                    onChange={(e) =>
                      setEditDropdown({ ...editDropdown, dropdown_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_display_name">Display Name</Label>
                  <Input
                    id="edit_display_name"
                    value={editDropdown.display_name}
                    onChange={(e) =>
                      setEditDropdown({ ...editDropdown, display_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_description">Description</Label>
                  <Input
                    id="edit_description"
                    value={editDropdown.description}
                    onChange={(e) =>
                      setEditDropdown({ ...editDropdown, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_allow_multiple"
                    checked={editDropdown.allow_multiple_selection}
                    onCheckedChange={(checked) =>
                      setEditDropdown({ ...editDropdown, allow_multiple_selection: checked === true })
                    }
                  />
                  <Label htmlFor="edit_allow_multiple">Allow multiple selections</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_is_required"
                    checked={editDropdown.is_required}
                    onCheckedChange={(checked) =>
                      setEditDropdown({ ...editDropdown, is_required: checked === true })
                    }
                  />
                  <Label htmlFor="edit_is_required">Required field</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Dropdown</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Confirmation</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this master dropdown? This action cannot be undone and will affect all companies using this dropdown.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteDropdown}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MasterDropdownMaster;
