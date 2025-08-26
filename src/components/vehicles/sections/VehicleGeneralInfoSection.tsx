import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Edit3, Save, X } from "lucide-react";
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
  const sourceDetails = vehicle.vehicle_source?.[0] || {};
  
  // Local state for immediate UI updates
  const [localData, setLocalData] = useState({
    // Basic vehicle info
    make: vehicle.make || "",
    model: vehicle.model || "",
    variant: vehicle.variant || "",
    year: vehicle.year || "",
    body_style: vehicle.body_style || "",
    vehicle_category: vehicle.vehicle_category || "",
    vin: vehicle.vin || "",
    plate_no: vehicle.plate_no || "",
    chassis_no: vehicle.chassis_no || "",
    model_no: vehicle.model_no || "",
    
    // Other details
    status: otherDetails.status || "",
    
    // Source details
    purchase_date: sourceDetails.purchase_date || "",
    purchase_type: sourceDetails.purchase_type || "",
    supplier: sourceDetails.supplier || "",
    trader_acquisition: otherDetails.trader_acquisition || "",
    purchase_notes: sourceDetails.purchase_notes || "",
  });

  const [formData, setFormData] = useState({...localData});

  const handleEdit = () => {
    setFormData({...localData});
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Prepare update data
      const updateData = {
        // Basic vehicle fields
        make: formData.make,
        model: formData.model,
        variant: formData.variant,
        year: formData.year,
        body_style: formData.body_style,
        vehicle_category: formData.vehicle_category,
        vin: formData.vin,
        plate_no: formData.plate_no,
        chassis_no: formData.chassis_no,
        model_no: formData.model_no,
        
        // Other details
        vehicle_other_details: [{
          ...otherDetails,
          status: formData.status,
          trader_acquisition: formData.trader_acquisition,
        }],
        
        // Source details
        vehicle_source: [{
          ...sourceDetails,
          purchase_date: formData.purchase_date,
          purchase_type: formData.purchase_type,
          supplier: formData.supplier,
          purchase_notes: formData.purchase_notes,
        }]
      };
      
      await vehicleServices.updateVehicleGeneralInfo(vehicle._id, updateData);
      
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
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="general-info">
        <AccordionTrigger className="text-lg font-semibold">
          Vehicle General Information
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <p className="text-sm font-medium">{localData.status || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Manufacture</Label>
                <p className="text-sm font-medium">{localData.make || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Model</Label>
                <p className="text-sm font-medium">{localData.model || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Variant</Label>
                <p className="text-sm font-medium">{localData.variant || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Year</Label>
                <p className="text-sm font-medium">{localData.year || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Body Style</Label>
                <p className="text-sm font-medium">{localData.body_style || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Vehicle Type</Label>
                <p className="text-sm font-medium">{localData.vehicle_category || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">VIN</Label>
                <p className="text-sm font-medium">{localData.vin || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Reg Plate No</Label>
                <p className="text-sm font-medium">{localData.plate_no || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Chassis</Label>
                <p className="text-sm font-medium">{localData.chassis_no || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Model No</Label>
                <p className="text-sm font-medium">{localData.model_no || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Purchase Date</Label>
                <p className="text-sm font-medium">{localData.purchase_date ? new Date(localData.purchase_date).toLocaleDateString() : 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Purchase Type</Label>
                <p className="text-sm font-medium">{localData.purchase_type || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Supplier</Label>
                <p className="text-sm font-medium">{localData.supplier || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Trader Acquisition</Label>
                <p className="text-sm font-medium">{localData.trader_acquisition || 'Not specified'}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Purchase Notes</Label>
                <p className="text-sm font-medium">{localData.purchase_notes || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  // Edit Section Component
  const EditSection = () => (
    <Accordion type="single" collapsible defaultValue="general-info" className="w-full">
      <AccordionItem value="general-info">
        <AccordionTrigger className="text-lg font-semibold">
          Edit Vehicle General Information
        </AccordionTrigger>
        <AccordionContent>
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
                <Label htmlFor="make">Manufacture</Label>
                <Input
                  id="make"
                  placeholder="Enter manufacture"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="Enter model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="variant">Variant</Label>
                <Input
                  id="variant"
                  placeholder="Enter variant"
                  value={formData.variant}
                  onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="Enter year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body_style">Body Style</Label>
                <Input
                  id="body_style"
                  placeholder="Enter body style"
                  value={formData.body_style}
                  onChange={(e) => setFormData({ ...formData, body_style: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vehicle_category">Vehicle Type</Label>
                <Input
                  id="vehicle_category"
                  placeholder="Enter vehicle type"
                  value={formData.vehicle_category}
                  onChange={(e) => setFormData({ ...formData, vehicle_category: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  placeholder="Enter VIN"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plate_no">Reg Plate No</Label>
                <Input
                  id="plate_no"
                  placeholder="Enter registration plate number"
                  value={formData.plate_no}
                  onChange={(e) => setFormData({ ...formData, plate_no: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chassis_no">Chassis</Label>
                <Input
                  id="chassis_no"
                  placeholder="Enter chassis number"
                  value={formData.chassis_no}
                  onChange={(e) => setFormData({ ...formData, chassis_no: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model_no">Model No</Label>
                <Input
                  id="model_no"
                  placeholder="Enter model number"
                  value={formData.model_no}
                  onChange={(e) => setFormData({ ...formData, model_no: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date ? new Date(formData.purchase_date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchase_type">Purchase Type</Label>
                <Input
                  id="purchase_type"
                  placeholder="Enter purchase type"
                  value={formData.purchase_type}
                  onChange={(e) => setFormData({ ...formData, purchase_type: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  placeholder="Enter supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="purchase_notes">Purchase Notes</Label>
                <Input
                  id="purchase_notes"
                  placeholder="Enter purchase notes"
                  value={formData.purchase_notes}
                  onChange={(e) => setFormData({ ...formData, purchase_notes: e.target.value })}
                />
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
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="space-y-6">
      {isEditing ? <EditSection /> : <ViewSection />}
    </div>
  );
};

export default VehicleGeneralInfoSection;
