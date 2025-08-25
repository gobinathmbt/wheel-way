
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
import { Car, X } from "lucide-react";

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
  if (!vehicle) return null;

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
            <VehicleGeneralInfoSection vehicle={vehicle} onUpdate={onUpdate} />
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
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
