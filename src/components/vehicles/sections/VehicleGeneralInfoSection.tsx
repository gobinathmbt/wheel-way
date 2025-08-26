
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  const otherDetails = vehicle.vehicle_other_details?.[0] || {};
  
  const [formData, setFormData] = useState({
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

  // Only show if there's data
  if (!vehicle.vehicle_other_details?.length) {
    return null;
  }

  const handleSave = async () => {
    try {
      await vehicleServices.updateVehicleGeneralInfo(vehicle._id, { vehicle_other_details: [formData] });
      toast.success("General information updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update general information");
    }
  };

  const handleCancel = () => {
    setFormData({
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
    setIsEditing(false);
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="general-info">
        <AccordionTrigger className="text-lg font-semibold">
          <div className="flex items-center justify-between w-full mr-4">
            <span>General Information</span>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardContent className="pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Input
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="trader_acquisition">Trader Acquisition</Label>
                      <Input
                        id="trader_acquisition"
                        value={formData.trader_acquisition}
                        onChange={(e) => setFormData({ ...formData, trader_acquisition: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchase_price">Purchase Price</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="retail_price">Retail Price</Label>
                      <Input
                        id="retail_price"
                        type="number"
                        value={formData.retail_price}
                        onChange={(e) => setFormData({ ...formData, retail_price: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="odometer_certified"
                        checked={formData.odometer_certified}
                        onCheckedChange={(checked) => setFormData({ ...formData, odometer_certified: checked })}
                      />
                      <Label htmlFor="odometer_certified">Odometer Certified</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gst_inclusive"
                        checked={formData.gst_inclusive}
                        onCheckedChange={(checked) => setFormData({ ...formData, gst_inclusive: checked })}
                      />
                      <Label htmlFor="gst_inclusive">GST Inclusive</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm text-muted-foreground">{otherDetails.status}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Purchase Price</Label>
                    <p className="text-sm text-muted-foreground">${otherDetails.purchase_price}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Retail Price</Label>
                    <p className="text-sm text-muted-foreground">${otherDetails.retail_price}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Trader Acquisition</Label>
                    <p className="text-sm text-muted-foreground">{otherDetails.trader_acquisition}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Odometer Certified</Label>
                    <p className="text-sm text-muted-foreground">{otherDetails.odometer_certified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">GST Inclusive</Label>
                    <p className="text-sm text-muted-foreground">{otherDetails.gst_inclusive ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleGeneralInfoSection;
