
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Trash2, Database, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';

const DropdownMaster = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDropdown, setSelectedDropdown] = useState(null);
  const [formData, setFormData] = useState({
    dropdown_name: '',
    display_name: '',
    description: '',
    allow_multiple_selection: false,
    is_required: false
  });
  const [valueFormData, setValueFormData] = useState({
    option_value: '',
    display_order: 0,
    is_default: false
  });

  const { data: dropdowns, isLoading, refetch } = useQuery({
    queryKey: ['dropdowns'],
    queryFn: async () => {
      const response = await apiClient.get('/api/dropdown');
      return response.data.data;
    }
  });

  const filteredDropdowns = dropdowns?.filter(dropdown =>
    dropdown.dropdown_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dropdown.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/dropdown', formData);
      toast.success('Dropdown created successfully');
      setIsDialogOpen(false);
      setFormData({
        dropdown_name: '',
        display_name: '',
        description: '',
        allow_multiple_selection: false,
        is_required: false
      });
      refetch();
    } catch (error) {
      toast.error('Failed to create dropdown');
    }
  };

  const handleAddValue = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/dropdown/${selectedDropdown._id}/values`, valueFormData);
      toast.success('Value added successfully');
      setIsValueDialogOpen(false);
      setValueFormData({
        option_value: '',
        display_order: 0,
        is_default: false
      });
      refetch();
    } catch (error) {
      toast.error('Failed to add value');
    }
  };

  const handleDeleteDropdown = async (dropdownId) => {
    try {
      await apiClient.delete(`/api/dropdown/${dropdownId}`);
      toast.success('Dropdown deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete dropdown');
    }
  };

  const handleDeleteValue = async (dropdownId, valueId) => {
    try {
      await apiClient.delete(`/api/dropdown/${dropdownId}/values/${valueId}`);
      toast.success('Value deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete value');
    }
  };

  return (
    <DashboardLayout title="Dropdown Master">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dropdown Master</h2>
            <p className="text-muted-foreground">Create and manage custom dropdown options for forms</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Database className="h-4 w-4 mr-2" />
                Create Dropdown
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dropdown</DialogTitle>
                <DialogDescription>
                  Create a custom dropdown for use in inspection and trade-in forms
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
                    placeholder="Condition options for vehicles"
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

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dropdowns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Dropdowns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Dropdowns</CardTitle>
            <CardDescription>Manage your custom dropdown configurations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Values</TableHead>
                    <TableHead>Settings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDropdowns.map((dropdown) => (
                    <TableRow key={dropdown._id}>
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
                              {value.option_value}
                            </Badge>
                          ))}
                          {dropdown.values?.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{dropdown.values.length - 3} more
                            </Badge>
                          )}
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
                        <Badge variant={dropdown.is_active ? "default" : "secondary"}>
                          {dropdown.is_active ? "Active" : "Inactive"}
                        </Badge>
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
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteDropdown(dropdown._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Value Dialog */}
        <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Value to {selectedDropdown?.display_name}</DialogTitle>
              <DialogDescription>
                Add a new option value to this dropdown
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddValue} className="space-y-4">
              <div>
                <Label htmlFor="option_value">Option Value</Label>
                <Input
                  id="option_value"
                  value={valueFormData.option_value}
                  onChange={(e) => setValueFormData({ ...valueFormData, option_value: e.target.value })}
                  placeholder="Excellent"
                  required
                />
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={valueFormData.display_order}
                  onChange={(e) => setValueFormData({ ...valueFormData, display_order: parseInt(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={valueFormData.is_default}
                  onCheckedChange={(checked) => setValueFormData({ ...valueFormData, is_default: checked === true })}
                />
                <Label htmlFor="is_default">Default value</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsValueDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Value</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DropdownMaster;
