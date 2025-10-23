import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/auth/AuthContext";
import { dealershipServices, commonVehicleServices } from "@/api/services";
import { toast } from "sonner";
import { Building, Loader2 } from "lucide-react";

interface DealershipManagerButtonProps {
  vehicleData: {
    vehicleType: "inspection" | "tradein" | "advertisement" | "master";
    vehicleIds: string[];
    currentDealership?: string;
    stockNumber?: string;
  };
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onSuccess?: () => void;
  className?: string;
}

interface Dealership {
  _id: string;
  dealership_name: string;
  dealership_code?: string;
}

export const DealershipManagerButton: React.FC<DealershipManagerButtonProps> = ({
  vehicleData,
  variant = "outline",
  size = "icon",
  onSuccess,
  className = "",
}) => {
  const { completeUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDealership, setSelectedDealership] = useState("");
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentDealershipName, setCurrentDealershipName] = useState("Assign Dealership");

  // Fetch dealerships on component mount and when vehicleData changes
  useEffect(() => {
    fetchDealerships();
  }, [vehicleData.currentDealership]);

  // Also fetch when dialog opens to ensure fresh data
  useEffect(() => {
    if (isDialogOpen) {
      fetchDealerships();
    }
  }, [isDialogOpen]);

  // Update selected dealership when vehicle data changes
  useEffect(() => {
    if (vehicleData.currentDealership) {
      setSelectedDealership(vehicleData.currentDealership);
    }
  }, [vehicleData.currentDealership]);

  const fetchDealerships = async () => {
    setIsLoading(true);
    try {
      const response = await dealershipServices.getDealershipsDropdown();
      let dealershipsData = response.data.data || [];

      // Filter dealerships based on user permissions
      if (!completeUser?.is_primary_admin && completeUser?.dealership_ids) {
        const userDealershipIds = completeUser.dealership_ids.map((d: any) =>
          typeof d === "object" ? d._id : d
        );
        dealershipsData = dealershipsData.filter((dealership: Dealership) =>
          userDealershipIds.includes(dealership._id)
        );
      }

      setDealerships(dealershipsData);

      // Update current dealership name if a dealership is assigned
      if (vehicleData.currentDealership) {
        const currentDealership = dealershipsData.find(
          (dealer: Dealership) => dealer._id === vehicleData.currentDealership
        );
        if (currentDealership) {
          setCurrentDealershipName(
            `${currentDealership.dealership_name}${
              currentDealership.dealership_code ? ` (${currentDealership.dealership_code})` : ''
            }`
          );
        } else {
          setCurrentDealershipName("Assign Dealership");
        }
      } else {
        setCurrentDealershipName("Assign Dealership");
      }
    } catch (error) {
      console.error("Error fetching dealerships:", error);
      toast.error("Failed to load dealerships");
      setCurrentDealershipName("Assign Dealership");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDealershipUpdate = async () => {
    if (!selectedDealership) {
      toast.error("Please select a dealership");
      return;
    }

    if (vehicleData.vehicleIds.length === 0) {
      toast.error("No vehicles selected");
      return;
    }

    setIsUpdating(true);
    try {
      await commonVehicleServices.updateVehicleDealership({
        vehicleIds: vehicleData.vehicleIds,
        dealershipId: selectedDealership,
        vehicleType: vehicleData.vehicleType,
      });

      toast.success("Dealership updated successfully");
      setIsDialogOpen(false);
      
      // Update the current dealership name after successful update
      const updatedDealership = dealerships.find(
        (dealer) => dealer._id === selectedDealership
      );
      if (updatedDealership) {
        setCurrentDealershipName(
          `${updatedDealership.dealership_name}${
            updatedDealership.dealership_code ? ` (${updatedDealership.dealership_code})` : ''
          }`
        );
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Update dealership error:", error);
      toast.error(
        error.response?.data?.message || "Failed to update dealership"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={() => setIsDialogOpen(true)}
              className={`flex items-center gap-2 ${className}`}
              disabled={isLoading}
            >
              <Building className="h-4 w-4" />
              {size !== "icon" && (
                isLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  currentDealershipName
                )
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{currentDealershipName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Update Dealership
            </DialogTitle>
            <DialogDescription>
              {vehicleData.stockNumber && (
                <span className="block mb-2">
                  Stock ID: <strong>{vehicleData.stockNumber}</strong>
                </span>
              )}
              Select a dealership for {vehicleData.vehicleIds.length} vehicle(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dealership</label>
              <Select value={selectedDealership} onValueChange={setSelectedDealership}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dealership" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading dealerships...
                    </div>
                  ) : dealerships.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No dealerships available
                    </div>
                  ) : (
                    dealerships.map((dealership) => (
                      <SelectItem key={dealership._id} value={dealership._id}>
                        {dealership.dealership_name}
                        {dealership.dealership_code && ` (${dealership.dealership_code})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDealershipUpdate}
                disabled={isUpdating || !selectedDealership || isLoading}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Dealership"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Hook version for more complex use cases
export const useDealershipManager = () => {
  const { completeUser } = useAuth();
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDealerships = async () => {
    setIsLoading(true);
    try {
      const response = await dealershipServices.getDealershipsDropdown();
      let dealershipsData = response.data.data || [];

      // Filter dealerships based on user permissions
      if (!completeUser?.is_primary_admin && completeUser?.dealership_ids) {
        const userDealershipIds = completeUser.dealership_ids.map((d: any) =>
          typeof d === "object" ? d._id : d
        );
        dealershipsData = dealershipsData.filter((dealership: Dealership) =>
          userDealershipIds.includes(dealership._id)
        );
      }

      setDealerships(dealershipsData);
      return dealershipsData;
    } catch (error) {
      console.error("Error fetching dealerships:", error);
      toast.error("Failed to load dealerships");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dealerships,
    isLoading,
    fetchDealerships,
  };
};

export default DealershipManagerButton;