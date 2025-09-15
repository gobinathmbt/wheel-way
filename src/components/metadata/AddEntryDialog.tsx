import React, { useState } from "react";
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
    year: "",
    bodyType: "",
    fuelType: "",
    transmission: "",
  });

  const resetAddForm = () => {
    setAddFormData({
      displayName: "",
      year: "",
      makeId: "",
      bodyType: "",
      fuelType: "",
      transmission: "",
    });
  };

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

    let data: any = {};

    if (addDialogType === "make") {
      data = { displayName: addFormData.displayName };
    } else if (addDialogType === "model") {
      data = {
        displayName: addFormData.displayName,
        makeId: addFormData.makeId,
      };
    } else if (addDialogType === "body") {
      data = { displayName: addFormData.displayName };
    } else if (addDialogType === "year") {
      data = {
        year: parseInt(addFormData.year),
        displayName: addFormData.year,
      };
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
      <DialogContent>
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
            <div>
              <Label>Year</Label>
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