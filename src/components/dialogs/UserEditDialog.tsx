
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { dealershipServices } from '@/api/services';
import apiClient from '@/api/axios';

interface User {
  _id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  dealership_ids?: any[];
}

interface UserEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: () => void;
}

const UserEditDialog: React.FC<UserEditDialogProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'company_admin',
    dealership_ids: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available dealerships
  const { data: dealerships } = useQuery({
    queryKey: ['dealerships-dropdown'],
    queryFn: async () => {
      const response = await dealershipServices.getDealershipsDropdown();
      return response.data.data;
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        dealership_ids: user.dealership_ids?.map(d => d._id || d) || []
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await apiClient.put(`/api/company/users/${user._id}`, formData);
      toast.success('User updated successfully');
      onUserUpdated();
      onClose();
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        dealership_ids: user.dealership_ids?.map(d => d._id || d) || []
      });
    }
  };

  const handleDealershipToggle = (dealershipId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dealership_ids: checked 
        ? [...prev.dealership_ids, dealershipId]
        : prev.dealership_ids.filter(id => id !== dealershipId)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role permissions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company_super_admin">Company Super Admin</SelectItem>
                <SelectItem value="company_admin">Company Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Dealership Assignment */}
          <div>
            <Label>Assigned Dealerships</Label>
            <div className="mt-2 border rounded-lg p-3 max-h-48">
              <ScrollArea className="h-full">
                {dealerships && dealerships.length > 0 ? (
                  <div className="space-y-2">
                    {dealerships.map((dealership: any) => (
                      <div key={dealership._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dealership-${dealership._id}`}
                          checked={formData.dealership_ids.includes(dealership._id)}
                          onCheckedChange={(checked) => 
                            handleDealershipToggle(dealership._id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`dealership-${dealership._id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <div>
                            <div className="font-medium">{dealership.dealership_name}</div>
                            <div className="text-xs text-muted-foreground">{dealership.dealership_id}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No dealerships available
                  </div>
                )}
              </ScrollArea>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select dealerships this user can access
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
