
import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Company {
  _id: string;
  company_name: string;
  contact_email: string;
  subscription_plan: string;
  status: string;
  created_at: string;
}

interface CompanyEditDialogProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Company>) => void;
}


export const CompanyEditDialog: React.FC<CompanyEditDialogProps> = ({
  company,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Company>>({
    company_name: company.company_name,
    contact_email: company.contact_email,
    subscription_plan: company.subscription_plan,
    status: company.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(company._id, formData);
    onClose();
  };

  const handleInputChange = (field: keyof Company, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update the company information below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name || ""}
              onChange={(e) => handleInputChange("company_name", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email || ""}
              onChange={(e) => handleInputChange("contact_email", e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="subscription_plan">Subscription Plan</Label>
            <Select
              value={formData.subscription_plan}
              onValueChange={(value) => handleInputChange("subscription_plan", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};


