
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit3, Save, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { vehicleServices } from "@/api/services";

interface VehicleGeneralInfoSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleGeneralInfoSection: React.FC<VehicleGeneralInfoSectionProps> = ({
  vehicle,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const otherDetails = vehicle.vehicle_other_details?.[0] || {};
  
  // Local state for immediate UI updates
  const [localData, setLocalData] = useState({
    status: otherDetails.status || "",
    trader_acquisition: otherDetails.trader_acquisition || "",
    odometer_certified: otherDetails.odometer_certified || false,
    odometer_status: otherDetails.odometer_status || "",
    purchase_price: otherDetails.purchase_price || 0,
    exact_expenses: otherDetails.exact_expenses || 0,
    estimated_expenses: otherDetails.estimated_expenses || 0,
    gst_inclusive: otherDetails.gst_inclusive || false,
    retail_price: otherDetails.retail_price || 0,
    sold_price: otherDetails.sold_price || 0,
    included_in_exports: otherDetails.included_in_exports || true,
  });

  const [formData, setFormData] = useState({...localData});

  // Only show if there's data
  if (!vehicle.vehicle_other_details?.length) {
    return null;
  }

  const handleEdit = () => {
    setFormData({...localData});
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await vehicleServices.updateVehicleGeneralInfo(vehicle._id, { vehicle_other_details: [formData] });
      
      // Update local state immediately for instant UI feedback
      setLocalData({...formData});
      
      toast.success("General information updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update general information");
      console.error('Update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({...localData});
    setIsEditing(false);
  };

  // View Section Component
  const ViewSection = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Vehicle General Information
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <p className="text-sm font-medium">{localData.status || 'Not specified'}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Trader Acquisition</Label>
            <p className="text-sm font-medium">{localData.trader_acquisition || 'Not specified'}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Odometer Status</Label>
            <p className="text-sm font-medium">{localData.odometer_status || 'Not specified'}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Purchase Price</Label>
            <p className="text-sm font-medium">${localData.purchase_price?.toLocaleString() || 0}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Exact Expenses</Label>
            <p className="text-sm font-medium">${localData.exact_expenses?.toLocaleString() || 0}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Estimated Expenses</Label>
            <p className="text-sm font-medium">${localData.estimated_expenses?.toLocaleString() || 0}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Retail Price</Label>
            <p className="text-sm font-medium">${localData.retail_price?.toLocaleString() || 0}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Sold Price</Label>
            <p className="text-sm font-medium">${localData.sold_price?.toLocaleString() || 0}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Odometer Certified</Label>
            <p className="text-sm font-medium">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                localData.odometer_certified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {localData.odometer_certified ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">GST Inclusive</Label>
            <p className="text-sm font-medium">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                localData.gst_inclusive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {localData.gst_inclusive ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Included in Exports</Label>
            <p className="text-sm font-medium">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                localData.included_in_exports 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {localData.included_in_exports ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Edit Section Component
  const EditSection = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Edit3 className="h-5 w-5" />
          Edit Vehicle General Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                placeholder="Enter status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trader_acquisition">Trader Acquisition</Label>
              <Input
                id="trader_acquisition"
                placeholder="Enter trader acquisition"
                value={formData.trader_acquisition}
                onChange={(e) => setFormData({ ...formData, trader_acquisition: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="odometer_status">Odometer Status</Label>
              <Input
                id="odometer_status"
                placeholder="Enter odometer status"
                value={formData.odometer_status}
                onChange={(e) => setFormData({ ...formData, odometer_status: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price ($)</Label>
              <Input
                id="purchase_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exact_expenses">Exact Expenses ($)</Label>
              <Input
                id="exact_expenses"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.exact_expenses}
                onChange={(e) => setFormData({ ...formData, exact_expenses: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimated_expenses">Estimated Expenses ($)</Label>
              <Input
                id="estimated_expenses"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.estimated_expenses}
                onChange={(e) => setFormData({ ...formData, estimated_expenses: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retail_price">Retail Price ($)</Label>
              <Input
                id="retail_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.retail_price}
                onChange={(e) => setFormData({ ...formData, retail_price: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sold_price">Sold Price ($)</Label>
              <Input
                id="sold_price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.sold_price}
                onChange={(e) => setFormData({ ...formData, sold_price: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Switch
                id="odometer_certified"
                checked={formData.odometer_certified}
                onCheckedChange={(checked) => setFormData({ ...formData, odometer_certified: checked })}
              />
              <Label htmlFor="odometer_certified" className="text-sm font-medium">
                Odometer Certified
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Switch
                id="gst_inclusive"
                checked={formData.gst_inclusive}
                onCheckedChange={(checked) => setFormData({ ...formData, gst_inclusive: checked })}
              />
              <Label htmlFor="gst_inclusive" className="text-sm font-medium">
                GST Inclusive
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Switch
                id="included_in_exports"
                checked={formData.included_in_exports}
                onCheckedChange={(checked) => setFormData({ ...formData, included_in_exports: checked })}
              />
              <Label htmlFor="included_in_exports" className="text-sm font-medium">
                Included in Exports
              </Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {isEditing ? <EditSection /> : <ViewSection />}
    </div>
  );
};

export default VehicleGeneralInfoSection;
