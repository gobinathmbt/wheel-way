
import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, X, Wrench, ClipboardList, Calculator } from "lucide-react";
import { vehicleServices } from "@/api/services";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Import section components
import VehicleOverviewSection from "./sections/VehicleOverviewSection";
import VehicleGeneralInfoSection from "./sections/VehicleGeneralInfoSection";
import VehicleSourceSection from "./sections/VehicleSourceSection";
import VehicleRegistrationSection from "./sections/VehicleRegistrationSection";
import VehicleImportSection from "./sections/VehicleImportSection";
import VehicleEngineSection from "./sections/VehicleEngineSection";
import VehicleSpecificationsSection from "./sections/VehicleSpecificationsSection";
import VehicleSafetySection from "./sections/VehicleSafetySection";
import VehicleOdometerSection from "./sections/VehicleOdometerSection";
import VehicleOwnershipSection from "./sections/VehicleOwnershipSection";
import VehicleAttachmentsSection from "./sections/VehicleAttachmentsSection";

interface VehicleDetailSideModalProps {
  vehicle: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const VehicleDetailSideModal: React.FC<VehicleDetailSideModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const navigate = useNavigate();

  if (!vehicle) return null;

  const handlePushToWorkshop = async () => {
    try {
      await vehicleServices.updateVehicleWorkshopStatus(vehicle._id, {
        is_workshop: true,
        workshop_progress: 'in_progress'
      });
      toast.success('Vehicle pushed to workshop successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to push vehicle to workshop');
    }
  };

  const handleOpenMasterInspection = () => {
    // Navigate to master inspection/tradein page
    const mode = 'edit'; // Can be 'view' or 'edit'
    navigate(`/vehicle/master/${vehicle.company_id}/${vehicle.vehicle_stock_id}/${vehicle.vehicle_type}/${mode}`);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Car className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  {vehicle.name || `${vehicle.make} ${vehicle.model}`}
                </SheetTitle>
                <SheetDescription>
                  Stock ID: {vehicle.vehicle_stock_id} • {vehicle.year} • {vehicle.vehicle_type}
                </SheetDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex space-x-2">
              <Button
                variant={vehicle.is_workshop ? "default" : "outline"}
                size="sm"
                onClick={handlePushToWorkshop}
                disabled={vehicle.workshop_progress === 'completed'}
                className={vehicle.is_workshop ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}
              >
                <Wrench className="h-4 w-4 mr-2" />
                {vehicle.is_workshop ? (
                  vehicle.workshop_progress === 'completed' ? 'Workshop Complete' : 'In Workshop'
                ) : 'Push to Workshop'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMasterInspection}
              >
                {vehicle.vehicle_type === 'inspection' ? (
                  <>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Inspection
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Trade-in
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <VehicleOverviewSection vehicle={vehicle} onUpdate={onUpdate} />
           
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <VehicleGeneralInfoSection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleSourceSection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleRegistrationSection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleImportSection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleEngineSection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleSpecificationsSection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleSafetySection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleOdometerSection vehicle={vehicle} onUpdate={onUpdate} />
            <VehicleOwnershipSection vehicle={vehicle} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="attachments">
            <VehicleAttachmentsSection vehicle={vehicle} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Processing Status</h4>
                <Badge variant="outline">{vehicle.status}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Queue Status</h4>
                <Badge variant="outline">{vehicle.queue_status}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Processing Attempts</h4>
                <p className="text-sm">{vehicle.processing_attempts}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Last Updated</h4>
                <p className="text-sm">{new Date(vehicle.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default VehicleDetailSideModal;
