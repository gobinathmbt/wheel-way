
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { dropdownServices } from '@/api/services';

interface ValueManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dropdown: any;
  onRefetch: () => void;
}

const ValueManagementDialog: React.FC<ValueManagementDialogProps> = ({
  isOpen,
  onClose,
  dropdown,
  onRefetch
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [valueFormData, setValueFormData] = useState({
    option_value: '',
    display_value: '',
    display_order: 0,
    is_default: false,
    is_active: true
  });

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dropdownServices.addValue(dropdown._id, valueFormData);
      toast.success('Value added successfully');
      setIsAddDialogOpen(false);
      setValueFormData({
        option_value: '',
        display_value: '',
        display_order: 0,
        is_default: false,
        is_active: true
      });
      onRefetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add value');
    }
  };

  const handleEditValue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dropdownServices.updateValue(dropdown._id, selectedValue._id, valueFormData);
      toast.success('Value updated successfully');
      setIsEditDialogOpen(false);
      setSelectedValue(null);
      onRefetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update value');
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    try {
      await dropdownServices.deleteValue(dropdown._id, valueId);
      toast.success('Value deleted successfully');
      onRefetch();
    } catch (error) {
      toast.error('Failed to delete value');
    }
  };

  const openEditDialog = (value: any) => {
    setSelectedValue(value);
    setValueFormData({
      option_value: value.option_value,
      display_value: value.display_value || value.option_value,
      display_order: value.display_order,
      is_default: value.is_default,
      is_active: value.is_active
    });
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage Values - {dropdown?.display_name}</DialogTitle>
            <DialogDescription>
              Add, edit, and manage option values for this dropdown
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Option Values</h3>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Value
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Option Value</TableHead>
                  <TableHead>Display Value</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dropdown?.values?.map((value: any) => (
                  <TableRow key={value._id}>
                    <TableCell className="font-medium">{value.option_value}</TableCell>
                    <TableCell>{value.display_value || value.option_value}</TableCell>
                    <TableCell>{value.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={value.is_active ? "default" : "secondary"}>
                        {value.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {value.is_default && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(value)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteValue(value._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Value Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Value to {dropdown?.display_name}</DialogTitle>
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
                placeholder="excellent"
                required
              />
            </div>
            <div>
              <Label htmlFor="display_value">Display Value</Label>
              <Input
                id="display_value"
                value={valueFormData.display_value}
                onChange={(e) => setValueFormData({ ...valueFormData, display_value: e.target.value })}
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
              <Switch
                id="is_default"
                checked={valueFormData.is_default}
                onCheckedChange={(checked) => setValueFormData({ ...valueFormData, is_default: checked })}
              />
              <Label htmlFor="is_default">Default value</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={valueFormData.is_active}
                onCheckedChange={(checked) => setValueFormData({ ...valueFormData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Value</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Value Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Value</DialogTitle>
            <DialogDescription>
              Update this option value
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditValue} className="space-y-4">
            <div>
              <Label htmlFor="edit_option_value">Option Value</Label>
              <Input
                id="edit_option_value"
                value={valueFormData.option_value}
                onChange={(e) => setValueFormData({ ...valueFormData, option_value: e.target.value })}
                placeholder="excellent"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_display_value">Display Value</Label>
              <Input
                id="edit_display_value"
                value={valueFormData.display_value}
                onChange={(e) => setValueFormData({ ...valueFormData, display_value: e.target.value })}
                placeholder="Excellent"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_display_order">Display Order</Label>
              <Input
                id="edit_display_order"
                type="number"
                value={valueFormData.display_order}
                onChange={(e) => setValueFormData({ ...valueFormData, display_order: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_default"
                checked={valueFormData.is_default}
                onCheckedChange={(checked) => setValueFormData({ ...valueFormData, is_default: checked })}
              />
              <Label htmlFor="edit_is_default">Default value</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={valueFormData.is_active}
                onCheckedChange={(checked) => setValueFormData({ ...valueFormData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Value</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ValueManagementDialog;
