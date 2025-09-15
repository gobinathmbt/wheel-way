import React, { useState, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddEntryDialogProps {
  makes: any[];
  onAddEntry: (type: string, data: any) => void;
  isLoading?: boolean;
}

const AddEntryDialog: React.FC<AddEntryDialogProps> = ({
  makes,
  onAddEntry,
  isLoading = false,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState("make");
  const [addFormData, setAddFormData] = useState({
    displayName: "",
    makeId: "",
    modelId: "",
    modelIds: [] as string[],
    variantId: "",
    year: "",
    bodyType: "",
    fuelType: "",
    transmission: "",
  });

  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);

  const resetAddForm = () => {
    setAddFormData({
      displayName: "",
      year: "",
      makeId: "",
      modelId: "",
      modelIds: [],
      variantId: "",
      bodyType: "",
      fuelType: "",
      transmission: "",
    });
    setAvailableModels([]);
    setAvailableVariants([]);
  };

  // Fetch models when make is selected for variant or year
  useEffect(() => {
    if ((addDialogType === "variant" || addDialogType === "year") && addFormData.makeId) {
      import("@/api/services").then(({ vehicleMetadataServices }) => {
        vehicleMetadataServices.getDropdownData("models", { makeId: addFormData.makeId })
          .then(response => {
            setAvailableModels(response.data?.data || []);
            // Reset dependent fields when make changes
            if (addDialogType === "year") {
              setAddFormData(prev => ({ ...prev, modelId: "", variantId: "" }));
              setAvailableVariants([]);
            }
          })
          .catch(console.error);
      });
    } else {
      setAvailableModels([]);
      setAvailableVariants([]);
    }
  }, [addDialogType, addFormData.makeId]);

  // Fetch variants when model is selected for year
  useEffect(() => {
    if (addDialogType === "year" && addFormData.modelId) {
      import("@/api/services").then(({ vehicleMetadataServices }) => {
        vehicleMetadataServices.getDropdownData("variants", { modelId: addFormData.modelId })
          .then(response => {
            setAvailableVariants(response.data?.data || []);
            // Reset variant when model changes
            setAddFormData(prev => ({ ...prev, variantId: "" }));
          })
          .catch(console.error);
      });
    } else if (addDialogType === "year" && !addFormData.modelId) {
      setAvailableVariants([]);
      setAddFormData(prev => ({ ...prev, variantId: "" }));
    }
  }, [addDialogType, addFormData.modelId]);

  const handleAddEntry = () => {
    if (addDialogType === "year" && !addFormData.year) {
      toast.error("Year is required");
      return;
    }

    if (!addFormData.displayName && addDialogType !== "year") {
      toast.error("Display name is required");
      return;
    }

    if (addDialogType === "model" && !addFormData.makeId) {
      toast.error("Make is required for models");
      return;
    }

    if (addDialogType === "variant" && (!addFormData.displayName || addFormData.modelIds.length === 0)) {
      toast.error("Variant name and at least one model are required");
      return;
    }

    if (addDialogType === "year" && !addFormData.modelId && !addFormData.variantId) {
      toast.error("Either model or variant must be selected for the year");
      return;
    }

    let data: any = {};

    if (addDialogType === "make") {
      data = { displayName: addFormData.displayName };
    } else if (addDialogType === "model") {
      data = {
        displayName: addFormData.displayName,
        makeId: addFormData.makeId,
      };
    } else if (addDialogType === "variant") {
      data = {
        displayName: addFormData.displayName,
        models: addFormData.modelIds,
      };
    } else if (addDialogType === "body") {
      data = { displayName: addFormData.displayName };
    } else if (addDialogType === "year") {
      data = {
        year: parseInt(addFormData.year),
        displayName: addFormData.year,
      };
      
      // Add model if selected
      if (addFormData.modelId) {
        data.modelId = addFormData.modelId;
      }
      
      // Add variant if selected
      if (addFormData.variantId) {
        data.variantId = addFormData.variantId;
      }
    } else if (addDialogType === "metadata") {
      data = {
        ...addFormData,
      };
    }

    onAddEntry(addDialogType, { ...data, isActive: true });
    setShowAddDialog(false);
    resetAddForm();
  };

  return (
    <Dialog
      open={showAddDialog}
      onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetAddForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={addDialogType} onValueChange={setAddDialogType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="make">Make</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="variant">Variant</SelectItem>
                <SelectItem value="body">Body Type</SelectItem>
                <SelectItem value="year">Variant Year</SelectItem>
                <SelectItem value="metadata">Vehicle Metadata</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Form fields based on selected type */}
          {addDialogType === "make" && (
            <div>
              <Label>Make Name</Label>
              <Input
                value={addFormData.displayName}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    displayName: e.target.value,
                  })
                }
                placeholder="e.g., Toyota"
              />
            </div>
          )}

          {addDialogType === "model" && (
            <>
              <div>
                <Label>Make</Label>
                <Select
                  value={addFormData.makeId}
                  onValueChange={(value) =>
                    setAddFormData({ ...addFormData, makeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes?.map((make: any) => (
                      <SelectItem key={make._id} value={make._id}>
                        {make.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model Name</Label>
                <Input
                  value={addFormData.displayName}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      displayName: e.target.value,
                    })
                  }
                  placeholder="e.g., Camry"
                />
              </div>
            </>
          )}

          {addDialogType === "variant" && (
            <>
              <div>
                <Label>Make (for filtering models)</Label>
                <Select
                  value={addFormData.makeId}
                  onValueChange={(value) =>
                    setAddFormData({ ...addFormData, makeId: value, modelIds: [] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {makes?.map((make: any) => (
                      <SelectItem key={make._id} value={make._id}>
                        {make.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Variant Name</Label>
                <Input
                  value={addFormData.displayName}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      displayName: e.target.value,
                    })
                  }
                  placeholder="e.g., 1.8 G, 2.0 Turbo"
                />
              </div>
              <div>
                <Label>Select Models (Multiple)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {availableModels.map((model: any) => (
                    <div key={model._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={model._id}
                        checked={addFormData.modelIds.includes(model._id)}
                        onChange={(e) => {
                          const modelIds = e.target.checked
                            ? [...addFormData.modelIds, model._id]
                            : addFormData.modelIds.filter(id => id !== model._id);
                          setAddFormData({ ...addFormData, modelIds });
                        }}
                        className="rounded"
                      />
                      <label htmlFor={model._id} className="text-sm">
                        {model.displayName}
                      </label>
                    </div>
                  ))}
                  {availableModels.length === 0 && addFormData.makeId && (
                    <p className="text-sm text-muted-foreground">No models found for selected make</p>
                  )}
                  {!addFormData.makeId && (
                    <p className="text-sm text-muted-foreground">Select a make first to see models</p>
                  )}
                </div>
              </div>
            </>
          )}

          {addDialogType === "body" && (
            <div>
              <Label>Body Type Name</Label>
              <Input
                value={addFormData.displayName}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    displayName: e.target.value,
                  })
                }
                placeholder="e.g., Sedan"
              />
            </div>
          )}

          {addDialogType === "year" && (
            <div className="space-y-4">
              <div>
                <Label>Year *</Label>
                <Input
                  type="number"
                  value={addFormData.year}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      year: e.target.value,
                    })
                  }
                  placeholder="e.g., 2023"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Make (Optional - for filtering)</Label>
                  <Select
                    value={addFormData.makeId}
                    onValueChange={(value) =>
                      setAddFormData({ ...addFormData, makeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Make" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">No Make</SelectItem>
                      {makes?.map((make: any) => (
                        <SelectItem key={make._id} value={make._id}>
                          {make.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Model (Either model OR variant required)</Label>
                  <Select
                    value={addFormData.modelId}
                    onValueChange={(value) =>
                      setAddFormData({ ...addFormData, modelId: value })
                    }
                    disabled={!addFormData.makeId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">No Model</SelectItem>
                      {availableModels.map((model: any) => (
                        <SelectItem key={model._id} value={model._id}>
                          {model.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!addFormData.makeId && (
                    <p className="text-xs text-muted-foreground mt-1">Select a make first to see models</p>
                  )}
                </div>
                
                <div>
                  <Label>Variant (Either model OR variant required)</Label>
                  <Select
                    value={addFormData.variantId}
                    onValueChange={(value) =>
                      setAddFormData({ ...addFormData, variantId: value })
                    }
                    disabled={!addFormData.modelId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Variant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">No Variant</SelectItem>
                      {availableVariants.map((variant: any) => (
                        <SelectItem key={variant._id} value={variant._id}>
                          {variant.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!addFormData.modelId && (
                    <p className="text-xs text-muted-foreground mt-1">Select a model first to see variants</p>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> You must select either a Model OR a Variant (or both). 
                  This helps organize years by specific vehicle configurations.
                </p>
              </div>
            </div>
          )}

          {addDialogType === "metadata" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Make</Label>
                  <Select
                    value={addFormData.makeId}
                    onValueChange={(value) =>
                      setAddFormData({ ...addFormData, makeId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Make" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes?.map((make: any) => (
                        <SelectItem key={make._id} value={make._id}>
                          {make.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    value={addFormData.displayName}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        displayName: e.target.value,
                      })
                    }
                    placeholder="Model name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Body Type (Optional)</Label>
                  <Input
                    value={addFormData.bodyType || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        bodyType: e.target.value,
                      })
                    }
                    placeholder="e.g., Sedan"
                  />
                </div>
                <div>
                  <Label>Year (Optional)</Label>
                  <Input
                    type="number"
                    value={addFormData.year}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        year: e.target.value,
                      })
                    }
                    placeholder="e.g., 2023"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fuel Type (Optional)</Label>
                  <Input
                    value={addFormData.fuelType || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        fuelType: e.target.value,
                      })
                    }
                    placeholder="e.g., Petrol"
                  />
                </div>
                <div>
                  <Label>Transmission (Optional)</Label>
                  <Input
                    value={addFormData.transmission || ""}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        transmission: e.target.value,
                      })
                    }
                    placeholder="e.g., Manual"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddEntryDialog;