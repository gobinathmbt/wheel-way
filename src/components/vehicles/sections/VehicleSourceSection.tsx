
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Edit3, Save, X } from "lucide-react";
import { toast } from "sonner";
import { vehicleServices } from "@/api/services";

interface VehicleSourceSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleSourceSection: React.FC<VehicleSourceSectionProps> = ({
  vehicle,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const sourceData = vehicle.vehicle_source?.[0] || {};
  
  const [formData, setFormData] = useState({
    supplier: sourceData.supplier || "",
    purchase_date: sourceData.purchase_date ? new Date(sourceData.purchase_date).toISOString().split('T')[0] : "",
    purchase_type: sourceData.purchase_type || "",
    purchase_notes: sourceData.purchase_notes || "",
  });

  // Only show if there's data
  if (!vehicle.vehicle_source?.length) {
    return null;
  }

  const handleSave = async () => {
    try {
      await vehicleServices.updateVehicleSource(vehicle._id, { vehicle_source: [formData] });
      toast.success("Vehicle source updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update vehicle source");
    }
  };

  const handleCancel = () => {
    setFormData({
      supplier: sourceData.supplier || "",
      purchase_date: sourceData.purchase_date ? new Date(sourceData.purchase_date).toISOString().split('T')[0] : "",
      purchase_type: sourceData.purchase_type || "",
      purchase_notes: sourceData.purchase_notes || "",
    });
    setIsEditing(false);
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="source">
        <AccordionTrigger className="text-lg font-semibold">
          <div className="flex items-center justify-between w-full mr-4">
            <span>Vehicle Source</span>
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
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchase_date">Purchase Date</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="purchase_type">Purchase Type</Label>
                      <Input
                        id="purchase_type"
                        value={formData.purchase_type}
                        onChange={(e) => setFormData({ ...formData, purchase_type: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="purchase_notes">Purchase Notes</Label>
                    <Textarea
                      id="purchase_notes"
                      value={formData.purchase_notes}
                      onChange={(e) => setFormData({ ...formData, purchase_notes: e.target.value })}
                    />
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Supplier</Label>
                    <p className="text-sm text-muted-foreground">{sourceData.supplier}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Purchase Date</Label>
                    <p className="text-sm text-muted-foreground">
                      {sourceData.purchase_date ? new Date(sourceData.purchase_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Purchase Type</Label>
                    <p className="text-sm text-muted-foreground">{sourceData.purchase_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Purchase Notes</Label>
                    <p className="text-sm text-muted-foreground">{sourceData.purchase_notes}</p>
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

export default VehicleSourceSection;
