import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Edit3, Save, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { adPublishingServices, vehicleServices } from "@/api/services";
import MediaViewer, { MediaItem } from "@/components/common/MediaViewer";
import VehicleMetadataSelector from "@/components/common/VehicleMetadataSelector";

interface VehicleOverviewSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleOverviewSection: React.FC<VehicleOverviewSectionProps> = ({
  vehicle,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    make: vehicle.make || "",
    model: vehicle.model || "",
    variant: vehicle.variant || "",
    year: vehicle.year || "",
    vin: vehicle.vin || "",
    plate_no: vehicle.plate_no || "",
    chassis_no: vehicle.chassis_no || "",
    body_style: vehicle.body_style || "",
    vehicle_category: vehicle.vehicle_category || "",
  });

  // Add state for image upload
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string>(vehicle.vehicle_hero_image || "");
  const [isUploading, setIsUploading] = useState(false);

  // Media viewer state
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState<string>("");

  // Handler functions for VehicleMetadataSelector
  const handleMakeChange = (displayName: string) => {
    setFormData({ ...formData, make: displayName });
  };

  const handleModelChange = (displayName: string) => {
    setFormData({ ...formData, model: displayName });
  };

  const handleVariantChange = (displayName: string) => {
    setFormData({ ...formData, variant: displayName });
  };

  const handleYearChange = (displayName: string) => {
    setFormData({ ...formData, year: displayName });
  };

  const handleBodyChange = (displayName: string) => {
    setFormData({ ...formData, body_style: displayName });
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }
      
      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setHeroImage(file);
      const previewUrl = URL.createObjectURL(file);
      setHeroImagePreview(previewUrl);
    }
  };

  const handleSave = async () => {
  try {
    setIsUploading(true);
    
    // First update vehicle overview data
    const adVehicleData = {
      ...formData,
      vehicle_type: vehicle.vehicle_type
    };
    
    // Update vehicle data
    const updateResponse = await adPublishingServices.updateAdVehicle(vehicle._id, adVehicleData);
    
    // Then upload image if there's a new one
    // if (heroImage) {
    //   const imageFormData = new FormData();
    //   imageFormData.append('hero_image', heroImage);
      
    //   const uploadResponse = await adPublishingServices.uploadVehicleHeroImage(vehicle._id, imageFormData);
      
    //   // Update the local state with the new image URL from response
    //   if (uploadResponse.data && uploadResponse.data.data.vehicle_hero_image) {
    //     setHeroImagePreview(uploadResponse.data.data.vehicle_hero_image);
    //   }
    // }
    
    toast.success("Vehicle overview updated successfully");
    setIsEditing(false);
    
    // Call onUpdate to refresh parent component data with the latest data
    if (onUpdate) {
      onUpdate();
    }
    
  } catch (error) {
    console.error("Error updating vehicle overview:", error);
    toast.error("Failed to update vehicle overview");
  } finally {
    setIsUploading(false);
  }
};

  const handleCancel = () => {
    setFormData({
      make: vehicle.make || "",
      model: vehicle.model || "",
      variant: vehicle.variant || "",
      year: vehicle.year || "",
      vin: vehicle.vin || "",
      plate_no: vehicle.plate_no || "",
      chassis_no: vehicle.chassis_no || "",
      body_style: vehicle.body_style || "",
      vehicle_category: vehicle.vehicle_category || "",
    });
    setHeroImage(null);
    setHeroImagePreview(vehicle.vehicle_hero_image || "");
    setIsEditing(false);
  };

  // Prepare media items for the MediaViewer
  const mediaItems: MediaItem[] = heroImagePreview ? [
    {
      id: "hero-image",
      url: heroImagePreview,
      type: "image",
      title: `${formData.make} ${formData.model} ${formData.year}`,
      description: "Vehicle hero image"
    }
  ] : [];

  // Function to open media viewer
  const openMediaViewer = () => {
    if (heroImagePreview) {
      setCurrentMediaId("hero-image");
      setIsMediaViewerOpen(true);
    }
  };

  return (
    <>
      <Accordion type="single" collapsible defaultValue="overview">
        <AccordionItem value="overview">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center justify-between w-full mr-4">
              <span>Vehicle Overview</span>
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
                {/* Hero Image */}
                {heroImagePreview && (
                  <div className="mb-6 cursor-pointer" onClick={openMediaViewer}>
                    <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                      <img
                        src={heroImagePreview}
                        alt="Vehicle"
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-4">
                    {/* Image Upload Section */}
                    <div className="mb-4">
                      <Label htmlFor="hero-image-upload">Vehicle Hero Image</Label>
                      <div className="mt-2 flex items-center gap-4">
                        <Input
                          id="hero-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="max-w-sm"
                        />
                        {heroImagePreview && (
                          <div className="w-16 h-16 rounded border overflow-hidden">
                            <img
                              src={heroImagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: JPEG, PNG, WebP. Max size: 5MB
                      </p>
                    </div>

                    {/* Vehicle Metadata Selector */}
                    <div className="mb-4">
                      <VehicleMetadataSelector
                        selectedMake={formData.make}
                        selectedModel={formData.model}
                        selectedVariant={formData.variant}
                        selectedYear={formData.year}
                        selectedBody={formData.body_style}
                        onMakeChange={handleMakeChange}
                        onModelChange={handleModelChange}
                        onVariantChange={handleVariantChange}
                        onYearChange={handleYearChange}
                        onBodyChange={handleBodyChange}
                        showLabels={true}
                        layout="grid-3"
                        isEdit={true}
                        editableFields={{
                          make: false,
                          model: false,
                          variant: true,
                          year: true,
                          body: true,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vin">VIN</Label>
                        <Input
                          id="vin"
                          value={formData.vin}
                          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="plate_no">Plate Number</Label>
                        <Input
                          id="plate_no"
                          value={formData.plate_no}
                          onChange={(e) => setFormData({ ...formData, plate_no: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="chassis_no">Chassis Number</Label>
                        <Input
                          id="chassis_no"
                          value={formData.chassis_no}
                          onChange={(e) => setFormData({ ...formData, chassis_no: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_category">Category</Label>
                        <Input
                          id="vehicle_category"
                          value={formData.vehicle_category}
                          onChange={(e) => setFormData({ ...formData, vehicle_category: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave} disabled={isUploading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isUploading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Make</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.make}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Model</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.model}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Variant</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.variant}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Year</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.year}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Body Style</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.body_style}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">VIN</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.vin}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Plate Number</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.plate_no}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Chassis Number</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.chassis_no}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Category</Label>
                      <p className="text-sm text-muted-foreground">{vehicle.vehicle_category}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Media Viewer */}
      <MediaViewer
        media={mediaItems}
        currentMediaId={currentMediaId}
        isOpen={isMediaViewerOpen}
        onClose={() => setIsMediaViewerOpen(false)}
      />
    </>
  );
};

export default VehicleOverviewSection;