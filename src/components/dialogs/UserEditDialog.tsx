import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { dealershipServices } from "@/api/services";
import apiClient from "@/api/axios";
import Select from "react-select";

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
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "company_admin",
    dealership_ids: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available dealerships
  const { data: dealerships } = useQuery({
    queryKey: ["dealerships-dropdown"],
    queryFn: async () => {
      const response = await dealershipServices.getDealershipsDropdown();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        dealership_ids: user.dealership_ids?.map((d) => d._id || d) || [],
      });
    }
  }, [user]);

  const { data: userInfo } = useQuery({
    queryKey: ["user-info"],
    queryFn: async () => {
      const response = await apiClient.get("/api/auth/me");
      console.log("Auth me response:", response.data); // Check the exact structure
      // Based on your console log, it should be response.data.user
      return response.data.user;
    },
  });

  const isPrimaryAdmin = userInfo?.is_primary_admin || false;
  console.log("Is primary admin:", isPrimaryAdmin, userInfo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await apiClient.put(`/api/company/users/${user._id}`, formData);
      toast.success("User updated successfully");
      onUserUpdated();
      onClose();
    } catch (error) {
      toast.error("Failed to update user");
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
        dealership_ids: user.dealership_ids?.map((d) => d._id || d) || [],
      });
    }
  };

  const handleDealershipToggle = (dealershipId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      dealership_ids: checked
        ? [...prev.dealership_ids, dealershipId]
        : prev.dealership_ids.filter((id) => id !== dealershipId),
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
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <ShadcnSelect
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isPrimaryAdmin && (
                  <SelectItem value="company_super_admin">
                    Company Super Admin
                  </SelectItem>
                )}
                <SelectItem value="company_admin">Company Admin</SelectItem>
              </SelectContent>
            </ShadcnSelect>
          </div>

          {/* Dealership Assignment */}
          <div>
            <Label>Assign Dealerships</Label>
            <Select
              isMulti
              isSearchable
              name="dealerships"
              options={
                dealerships?.map((d: any) => ({
                  value: d._id,
                  label: `${d.dealership_name}`,
                })) || []
              }
              className="mt-2"
              classNamePrefix="select"
              value={formData.dealership_ids
                .map((id) => {
                  const found = dealerships?.find((d: any) => d._id === id);
                  return found
                    ? {
                        value: found._id,
                        label: `${found.dealership_name}`,
                      }
                    : null;
                })
                .filter(Boolean)}
              onChange={(selected) =>
                setFormData({
                  ...formData,
                  dealership_ids: selected.map((s: any) => s.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              Select dealerships this user can access
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditDialog;
