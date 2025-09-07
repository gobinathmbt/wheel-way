import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Edit, Trash2, Building2, Plus, X, Filter, MapPin, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { dealershipServices } from '@/api/services';
import DeleteConfirmationDialog from '@/components/dialogs/DeleteConfirmationDialog';

const Dealerships = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editDealership, setEditDealership] = useState(null);

  const [formData, setFormData] = useState({
    dealership_name: '',
    dealership_address: '',
    dealership_email: ''
  });

  const { data: dealershipsData, isLoading, refetch } = useQuery({
    queryKey: ['dealerships', currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await dealershipServices.getDealerships({
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
      await dealershipServices.createDealership(formData);
      toast.success('Dealership created successfully');
      setIsDialogOpen(false);
      setFormData({
        dealership_name: '',
        dealership_address: '',
        dealership_email: ''
      });
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create dealership');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await dealershipServices.updateDealership(editDealership._id, editDealership);
      toast.success('Dealership updated successfully');
      setIsEditDialogOpen(false);
      setEditDealership(null);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update dealership');
    }
  };

  const handleToggleStatus = async (dealershipId, currentStatus) => {
    try {
      await dealershipServices.toggleDealershipStatus(dealershipId, { is_active: !currentStatus });
      toast.success('Dealership status updated successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to update dealership status');
    }
  };

  const confirmDeleteDealership = (dealershipId) => {
    setDeleteTargetId(dealershipId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDealership = async () => {
    try {
      await dealershipServices.deleteDealership(deleteTargetId);
      toast.success('Dealership deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete dealership');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };

  const dealerships = dealershipsData?.data || [];
  const pagination = dealershipsData?.pagination || {};
  const stats = dealershipsData?.stats || {};

  const handlePageChange = (page) => {
    setCurrentPage(page);
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
    <DashboardLayout title="Multi Dealership">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Multi Dealership</h2>
            <p className="text-muted-foreground">Manage multiple dealership locations for your company</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Add Dealership
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Dealership</DialogTitle>
                <DialogDescription>
                  Create a new dealership location for your company
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="dealership_name">Dealership Name</Label>
                  <Input
                    id="dealership_name"
                    value={formData.dealership_name}
                    onChange={(e) => setFormData({ ...formData, dealership_name: e.target.value })}
                    placeholder="Downtown Auto Center"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dealership_address">Dealership Address</Label>
                  <Input
                    id="dealership_address"
                    value={formData.dealership_address}
                    onChange={(e) => setFormData({ ...formData, dealership_address: e.target.value })}
                    placeholder="123 Main Street, City, State, ZIP"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dealership_email">Dealership Email (Optional)</Label>
                  <Input
                    id="dealership_email"
                    type="email"
                    value={formData.dealership_email}
                    onChange={(e) => setFormData({ ...formData, dealership_email: e.target.value })}
                    placeholder="dealership@company.com"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Dealership</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dealerships</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDealerships || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Dealerships</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDealerships || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Dealerships</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactiveDealerships || 0}</div>
            </CardContent>
          </Card>
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
                    placeholder="Search dealerships..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === "Enter" && refetch()}
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

        {/* Dealerships Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dealership Locations</CardTitle>
            <CardDescription>Manage your company's dealership locations</CardDescription>
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
                      <TableHead>Dealership ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dealerships.map((dealership, index) => (
                      <TableRow key={dealership._id}>
                        <TableCell>{(currentPage - 1) * 10 + index + 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {dealership.dealership_id}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{dealership.dealership_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm max-w-xs truncate">{dealership.dealership_address}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {dealership.dealership_email ? (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{dealership.dealership_email}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={dealership.is_active}
                              onCheckedChange={() => handleToggleStatus(dealership._id, dealership.is_active)}
                            />
                            <Badge variant={dealership.is_active ? "default" : "secondary"}>
                              {dealership.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {dealership.created_by?.first_name} {dealership.created_by?.last_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditDealership(dealership);
                                setIsEditDialogOpen(true);
                              }}
                              title="Edit Dealership"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => confirmDeleteDealership(dealership._id)}
                              title="Delete Dealership"
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
                {pagination.total_pages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                          let page;
                          if (pagination.total_pages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= pagination.total_pages - 2) {
                            page = pagination.total_pages - 4 + i;
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
                            onClick={() => handlePageChange(Math.min(pagination.total_pages, currentPage + 1))}
                            className={currentPage === pagination.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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

        {/* Edit Dealership Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Dealership</DialogTitle>
              <DialogDescription>Update dealership information</DialogDescription>
            </DialogHeader>
            {editDealership && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit_dealership_name">Dealership Name</Label>
                  <Input
                    id="edit_dealership_name"
                    value={editDealership.dealership_name}
                    onChange={(e) =>
                      setEditDealership({ ...editDealership, dealership_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dealership_address">Dealership Address</Label>
                  <Input
                    id="edit_dealership_address"
                    value={editDealership.dealership_address}
                    onChange={(e) =>
                      setEditDealership({ ...editDealership, dealership_address: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_dealership_email">Dealership Email</Label>
                  <Input
                    id="edit_dealership_email"
                    type="email"
                    value={editDealership.dealership_email || ''}
                    onChange={(e) =>
                      setEditDealership({ ...editDealership, dealership_email: e.target.value })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Dealership</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setDeleteTargetId(null);
          }}
          onConfirm={handleDeleteDealership}
          title="Delete Dealership"
          description="Are you sure you want to delete this dealership? This action cannot be undone."
        />
      </div>
    </DashboardLayout>
  );
};

export default Dealerships;