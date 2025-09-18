import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { vehicleServices } from "@/api/services";
import VehicleMetadataSelector from "../../common/VehicleMetadataSelector";

interface CreateVehicleInspectTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicleType: "inspection" | "tradein" | "advertisement" | "master";
}

const CreateVehicleInspectTradeModal = ({
  isOpen,
  onClose,
  onSuccess,
  vehicleType,
}: CreateVehicleInspectTradeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<Date>();

  // State for vehicle metadata (display names instead of IDs)
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedBody, setSelectedBody] = useState("");

  const [formData, setFormData] = useState({
    dealership: "",
    status: "",
    purchase_type: "",
    manufacture: "",
    make: "",
    year: "",
    model: "",
    variant: "",
    body_style: "",
    vin: "",
    vehicle_type: vehicleType,
    plate_no: "",
    supplier: "",
    purchase_notes: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      make: selectedMake,
      model: selectedModel,
      variant: selectedVariant,
      year: selectedYear,
      body_style: selectedBody,
    }));
  }, [selectedMake, selectedModel, selectedVariant, selectedYear, selectedBody]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.make || !formData.model || !formData.year || !formData.vin || !formData.plate_no) {
        toast.error("Please fill in all required fields");
        return;
      }

      const submitData = {
        ...formData,
        year: parseInt(formData.year),
        purchase_date: purchaseDate ? purchaseDate.toISOString() : null,
        chassis_no: formData.vin,
        vehicle_hero_image: "https://via.placeholder.com/400x300",
        vehicle_type: vehicleType,
      };

      await vehicleServices.createVehicleStock(submitData);
      toast.success(`Vehicle stock created successfully for ${vehicleType}`);
      onSuccess();
      onClose();

      setFormData({
        dealership: "",
        status: "",
        purchase_type: "",
        manufacture: "",
        make: "",
        year: "",
        model: "",
        variant: "",
        body_style: "",
        vin: "",
        vehicle_type: vehicleType,
        plate_no: "",
        supplier: "",
        purchase_notes: "",
      });

      setSelectedMake("");
      setSelectedModel("");
      setSelectedVariant("");
      setSelectedYear("");
      setSelectedBody("");
      setPurchaseDate(undefined);
    } catch (error) {
      console.error("Create vehicle stock error:", error);
      toast.error("Failed to create vehicle stock");
    } finally {
      setIsLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (vehicleType) {
      case "inspection":
        return "Create Inspection Vehicle Stock";
      case "tradein":
        return "Create Trade-in Vehicle Stock";
      case "advertisement":
        return "Create Advertisement Vehicle Stock";
      case "master":
        return "Create Master Vehicle Stock";
      default:
        return "Create Vehicle Stock";
    }
  };

  const getModalDescription = () => {
    return vehicleType === "inspection"
      ? "Add a new vehicle to the inspection inventory"
      : "Add a new vehicle to the trade-in inventory";
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{getModalTitle()}</SheetTitle>
          <SheetDescription>{getModalDescription()}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Dealership */}
          <div className="space-y-2">
            <Label htmlFor="dealership">Dealership</Label>
            <Input
              id="dealership"
              value={formData.dealership}
              onChange={(e) => handleInputChange("dealership", e.target.value)}
              placeholder="Enter dealership name"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Purchase Type */}
          <div className="space-y-2">
            <Label htmlFor="purchase_type">Purchase Type</Label>
            <Select
              value={formData.purchase_type}
              onValueChange={(value) => handleInputChange("purchase_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select purchase type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trade_in">Trade In</SelectItem>
                <SelectItem value="direct_purchase">Direct Purchase</SelectItem>
                <SelectItem value="auction">Auction</SelectItem>
                <SelectItem value="dealer">Dealer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manufacture */}
          <div className="space-y-2">
            <Label htmlFor="manufacture">Manufacture</Label>
            <Input
              id="manufacture"
              value={formData.manufacture}
              onChange={(e) => handleInputChange("manufacture", e.target.value)}
              placeholder="Enter manufacturer"
            />
          </div>

          {/* Vehicle Metadata */}
          <div className="space-y-2">
            <VehicleMetadataSelector
              selectedMake={selectedMake}
              selectedModel={selectedModel}
              selectedVariant={selectedVariant}
              selectedYear={selectedYear}
              selectedBody={selectedBody}
              onMakeChange={setSelectedMake}
              onModelChange={setSelectedModel}
              onVariantChange={setSelectedVariant}
              onYearChange={setSelectedYear}
              onBodyChange={setSelectedBody}
              showLabels={true}
            />
          </div>

          {/* VIN */}
          <div className="space-y-2">
            <Label htmlFor="vin" className="required">VIN *</Label>
            <Input
              id="vin"
              value={formData.vin}
              onChange={(e) => handleInputChange("vin", e.target.value)}
              placeholder="Enter VIN number"
              required
            />
          </div>

          {/* Vehicle Type (disabled) */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_type">Vehicle Type</Label>
            <Select value={vehicleType} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="tradein">Trade-in</SelectItem>
                <SelectItem value="advertisement">Advertisement</SelectItem>
                <SelectItem value="master">Master</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Registration No */}
          <div className="space-y-2">
            <Label htmlFor="plate_no" className="required">Registration No *</Label>
            <Input
              id="plate_no"
              value={formData.plate_no}
              onChange={(e) => handleInputChange("plate_no", e.target.value)}
              placeholder="Enter registration number"
              required
            />
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleInputChange("supplier", e.target.value)}
              placeholder="Enter supplier name"
            />
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={setPurchaseDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Purchase Notes */}
          <div className="space-y-2">
            <Label htmlFor="purchase_notes">Purchase Notes</Label>
            <Textarea
              id="purchase_notes"
              value={formData.purchase_notes}
              onChange={(e) => handleInputChange("purchase_notes", e.target.value)}
              placeholder="Enter any additional notes"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create Vehicle Stock"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateVehicleInspectTradeModal;
