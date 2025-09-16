import React, { useState, useEffect } from "react";
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
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import {
  Car,
  X,
  Wrench,
  ClipboardList,
  Calculator,
  FileText,
} from "lucide-react";
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
import WorkshopReportModal from "@/components/workshop/WorkshopReportModal";

interface VehicleDetailSideModalProps {
  vehicle: any;
  vehicleType: "inspection" | "tradein" | "advertisement" | "master";
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const VehicleDetailSideModal: React.FC<VehicleDetailSideModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onUpdate,
  vehicleType,
}) => {
  const navigate = useNavigate();
  const [workshopReportModalOpen, setWorkshopReportModalOpen] = useState(false);
  const [workshopStageSelectionOpen, setWorkshopStageSelectionOpen] =
    useState(false);
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [stageSelectionOpen, setStageSelectionOpen] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);

  // Move all hooks before any conditional returns
  useEffect(() => {
    if (
      vehicle &&
      vehicle.vehicle_type === "inspection" &&
      vehicle.inspection_result
    ) {
      const stages = vehicle.inspection_result
        .map((item: any) => item.category_name)
        .filter(Boolean);
      setAvailableStages(stages);
    }
  }, [vehicle]);

  // Now check if vehicle exists and return early if needed
  if (!vehicle) return null;

  const isStageInWorkshop = (stageName: string) => {
    if (!Array.isArray(vehicle.is_workshop)) return false;
    const stageInfo = vehicle.is_workshop.find(
      (item: any) => item.stage_name === stageName
    );
    return stageInfo?.in_workshop || false;
  };

  // Helper function to get stage progress
  const getStageProgress = (stageName: string) => {
    if (!Array.isArray(vehicle.workshop_progress)) return "not_processed_yet";
    const progressInfo = vehicle.workshop_progress.find(
      (item: any) => item.stage_name === stageName
    );
    return progressInfo?.progress || "not_processed_yet";
  };

  const handlePushToWorkshop = async () => {
    try {
      if (vehicle.vehicle_type === "inspection") {
        // Open stage selection modal
        setStageSelectionOpen(true);
      } else {
        // Direct push for tradein
        await vehicleServices.updateVehicleWorkshopStatus(
          vehicle._id,
          vehicleType,
          {
            is_workshop: true,
            workshop_progress: "in_progress",
          }
        );
        toast.success("Vehicle pushed to workshop successfully");
        onUpdate();
      }
    } catch (error) {
      toast.error("Failed to push vehicle to workshop");
    }
  };

  // New function to handle stage workshop push
  const handleStagePush = async () => {
    if (selectedStages.length === 0) {
      toast.error("Please select at least one stage");
      return;
    }

    try {
      await vehicleServices.updateVehicleWorkshopStatus(
        vehicle._id,
        vehicleType,
        {
          stages: selectedStages,
          workshop_action: "push",
        }
      );

      toast.success(`Selected stages pushed to workshop successfully`);
      setStageSelectionOpen(false);
      setSelectedStages([]);
      onUpdate();
    } catch (error) {
      toast.error("Failed to push stages to workshop");
    }
  };

  // Function to get workshop status display for inspection
  const getWorkshopStatusDisplay = () => {
    if (vehicle.vehicle_type !== "inspection") {
      return vehicle.is_workshop ? "In Workshop" : "Push to Workshop";
    }

    // For inspection, check if any stages are in workshop
    if (Array.isArray(vehicle.is_workshop)) {
      const inWorkshopStages = vehicle.is_workshop.filter(
        (item: any) => item.in_workshop
      );
      if (inWorkshopStages.length > 0) {
        return `${inWorkshopStages.length} Stage(s) in Workshop`;
      }
    }
    return "Push Stages to Workshop";
  };

  const handleOpenMasterInspection = () => {
    // Navigate to master inspection/tradein page
    const mode = "edit"; // Can be 'view' or 'edit'
    navigate(
      `/vehicle/master/${vehicle.company_id}/${vehicle.vehicle_stock_id}/${vehicle.vehicle_type}/${mode}`
    );
    onClose();
  };

  const handleWorkshopReport = () => {
    if (vehicle.vehicle_type === "inspection") {
      // Show stage selection for inspection
      setWorkshopStageSelectionOpen(true);
    } else {
      // Direct modal open for tradein
      setWorkshopReportModalOpen(true);
    }
  };

  const handleStageSelection = (stageName: string) => {
    setSelectedStage(stageName);
    setWorkshopStageSelectionOpen(false);
    setWorkshopReportModalOpen(true);
  };

  return (
    <>
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
                    Stock ID: {vehicle.vehicle_stock_id} • {vehicle.year} •{" "}
                    {vehicle.vehicle_type}
                  </SheetDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            {vehicleType !== "advertisement" && (
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex space-x-2">
                  <Button
                    variant={
                      vehicle.vehicle_type === "inspection"
                        ? Array.isArray(vehicle.is_workshop) &&
                          vehicle.is_workshop.some(
                            (item: any) => item.in_workshop
                          )
                          ? "default"
                          : "outline"
                        : vehicle.is_workshop
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={handlePushToWorkshop}
                    disabled={
                      vehicle.vehicle_type === "inspection"
                        ? false // Allow multiple stage pushes for inspection
                        : vehicle.workshop_progress === "completed"
                    }
                    className={
                      (
                        vehicle.vehicle_type === "inspection"
                          ? Array.isArray(vehicle.is_workshop) &&
                            vehicle.is_workshop.some(
                              (item: any) => item.in_workshop
                            )
                          : vehicle.is_workshop
                      )
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : ""
                    }
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    {getWorkshopStatusDisplay()}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenMasterInspection}
                  >
                    {vehicle.vehicle_type === "inspection" ? (
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

                  {/* Workshop Report Button */}
                  {vehicle.workshop_progress === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleWorkshopReport}
                      disabled={vehicle.workshop_report_preparing}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {vehicle.workshop_report_preparing
                        ? "Preparing Report..."
                        : "Workshop Report"}
                    </Button>
                  )}
                </div>
              </div>
            )}
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
              <VehicleGeneralInfoSection
                vehicle={vehicle}
                onUpdate={onUpdate}
              />
              <VehicleSourceSection vehicle={vehicle} onUpdate={onUpdate} />
              <VehicleRegistrationSection
                vehicle={vehicle}
                onUpdate={onUpdate}
              />
              <VehicleImportSection vehicle={vehicle} onUpdate={onUpdate} />
              <VehicleEngineSection vehicle={vehicle} onUpdate={onUpdate} />
              <VehicleSpecificationsSection
                vehicle={vehicle}
                onUpdate={onUpdate}
              />
              <VehicleSafetySection vehicle={vehicle} onUpdate={onUpdate} />
              <VehicleOdometerSection vehicle={vehicle} onUpdate={onUpdate} />
              <VehicleOwnershipSection vehicle={vehicle} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="attachments">
              <VehicleAttachmentsSection
                vehicle={vehicle}
                onUpdate={onUpdate}
                vehicleType={vehicleType}
              />
            </TabsContent>

            <TabsContent value="status" className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Processing Status
                  </h4>
                  <Badge variant="outline">{vehicle.status}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Queue Status</h4>
                  <Badge variant="outline">{vehicle.queue_status}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Processing Attempts
                  </h4>
                  <p className="text-sm">{vehicle.processing_attempts}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Last Updated</h4>
                  <p className="text-sm">
                    {new Date(vehicle.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Workshop Report Stage Selection Modal (for inspection vehicles) */}
      <Dialog
        open={workshopStageSelectionOpen}
        onOpenChange={setWorkshopStageSelectionOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <SheetTitle>Select Inspection Stage</SheetTitle>
            <SheetDescription>
              Choose which inspection stage report you want to view
            </SheetDescription>
          </DialogHeader>
          <div className="space-y-3">
            {Array.isArray(vehicle.workshop_report_ready) &&
              vehicle.workshop_report_ready.map((stage: any) => (
                <Button
                  key={stage.stage_name}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleStageSelection(stage.stage_name)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {stage.stage_name}
                  <Badge
                    className="ml-auto"
                    variant={stage.ready ? "default" : "secondary"}
                  >
                    {stage.ready ? "Ready" : "Preparing"}
                  </Badge>
                </Button>
              ))}
            {(!vehicle.workshop_report_ready ||
              vehicle.workshop_report_ready.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                No inspection stage reports available yet
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Stage Selection Modal */}
      <Dialog open={stageSelectionOpen} onOpenChange={setStageSelectionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <SheetTitle>Select Stages for Workshop</SheetTitle>
            <SheetDescription>
              Choose which inspection stages to push to workshop
            </SheetDescription>
          </DialogHeader>
          <div className="space-y-3">
            {availableStages.map((stageName) => {
              const inWorkshop = isStageInWorkshop(stageName);
              const progress = getStageProgress(stageName);

              return (
                <div
                  key={stageName}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedStages.includes(stageName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStages((prev) => [...prev, stageName]);
                        } else {
                          setSelectedStages((prev) =>
                            prev.filter((s) => s !== stageName)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="font-medium">{stageName}</span>
                  </div>
                  <div className="flex space-x-1">
                    {inWorkshop && (
                      <Badge variant="default" className="text-xs">
                        In Workshop
                      </Badge>
                    )}
                    <Badge
                      variant={
                        progress === "completed" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {progress.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setStageSelectionOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStagePush}>Push Selected Stages</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workshop Report Modal */}
      <WorkshopReportModal
        isOpen={workshopReportModalOpen}
        onClose={() => {
          setWorkshopReportModalOpen(false);
          setSelectedStage("");
        }}
        vehicleId={vehicle._id}
        vehicleType={vehicle.vehicle_type}
        stageName={selectedStage}
      />
    </>
  );
};

export default VehicleDetailSideModal;