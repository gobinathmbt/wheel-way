import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { companyServices } from "@/api/services";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface DropdownItem {
  _id: string;
  displayName: string;
  displayValue?: string;
  isActive?: boolean;
  year?: number;
  make?: DropdownItem;
  model?: DropdownItem;
  variant?: DropdownItem;
  models?: DropdownItem[];
}

interface VehicleMetadataSelectorProps {
  // Selected values (display names)
  selectedMake?: string;
  selectedModel?: string;
  selectedVariant?: string;
  selectedYear?: string;
  selectedBody?: string;

  // Change handlers (return displayName only)
  onMakeChange: (displayName: string) => void;
  onModelChange: (displayName: string) => void;
  onVariantChange: (displayName: string) => void;
  onYearChange: (displayName: string) => void;
  onBodyChange: (displayName: string) => void;

  // Optional props
  className?: string;
  showLabels?: boolean;
  disabled?: boolean;
  isAdd?: boolean; // New prop to control AddEntryDialog visibility
  onAddEntry?: (type: string, data: any) => void; // Handler for adding new entries
  addEntryLoading?: boolean; // Loading state for add entry
}

const VehicleMetadataSelector: React.FC<VehicleMetadataSelectorProps> = ({
  selectedMake,
  selectedModel,
  selectedVariant,
  selectedYear,
  selectedBody,
  onMakeChange,
  onModelChange,
  onVariantChange,
  onYearChange,
  onBodyChange,
  className = "",
  showLabels = true,
  disabled = false,
  isAdd = false, // Default to false
  onAddEntry, // Optional handler for adding entries
  addEntryLoading = false, // Default to false,
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState({
    make: "",
    model: "",
    variant: "",
    year: "",
    body: "",
  });

  // AddEntryDialog state and handlers
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
  const [isAddingEntry, setIsAddingEntry] = useState(false); // Local loading state

  // Reset dependent fields when parent field changes
  useEffect(() => {
    if (!selectedMake) {
      onModelChange("");
      onVariantChange("");
      onYearChange("");
      setSelectedIds((prev) => ({
        ...prev,
        model: "",
        variant: "",
        year: "",
      }));
    }
  }, [selectedMake, onModelChange, onVariantChange, onYearChange]);

  useEffect(() => {
    if (!selectedModel) {
      onVariantChange("");
      onYearChange("");
      setSelectedIds((prev) => ({ ...prev, variant: "", year: "" }));
    }
  }, [selectedModel, onVariantChange, onYearChange]);

  useEffect(() => {
    if (!selectedVariant) {
      onYearChange("");
      setSelectedIds((prev) => ({ ...prev, year: "" }));
    }
  }, [selectedVariant, onYearChange]);

  // Common query options
  const queryOptions = {
    retry: 1,
    retryDelay: 1000,
    onError: (error: any) => {
      if (error.response?.status === 403) {
        setApiError("Authentication required. Please check your credentials.");
      } else {
        setApiError("Failed to load data. Please try again later.");
      }
    },
  };

  // Fetch all makes with error handling
  const {
    data: allMakes,
    isLoading: allMakesLoading,
    error: makesError,
    refetch: refetchMakes,
  } = useQuery({
    queryKey: ["dropdown-makes-global"],
    queryFn: () => companyServices.getCompanyMetaData("makes"),
    ...queryOptions,
  });

  // Fetch models based on selected make with error handling
  const {
    data: allModels,
    isLoading: allModelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useQuery({
    queryKey: ["dropdown-models-global", selectedIds.make],
    queryFn: () =>
      companyServices.getCompanyMetaData("models", {
        makeId: selectedIds.make || undefined,
      }),
    enabled: !!selectedIds.make,
    ...queryOptions,
  });

  // Fetch variants based on selected model with error handling
  const {
    data: allVariants,
    isLoading: allVariantsLoading,
    error: variantsError,
    refetch: refetchVariants,
  } = useQuery({
    queryKey: ["dropdown-variants-global", selectedIds.model],
    queryFn: () =>
      companyServices.getCompanyMetaData("variants", {
        modelId: selectedIds.model || undefined,
      }),
    enabled: !!selectedIds.model,
    ...queryOptions,
  });

  // Fetch years based on selected model and variant with error handling
  const {
    data: allYears,
    isLoading: allYearsLoading,
    error: yearsError,
    refetch: refetchYears,
  } = useQuery({
    queryKey: ["dropdown-years-global", selectedIds.model, selectedIds.variant],
    queryFn: () =>
      companyServices.getCompanyMetaData("years", {
        modelId: selectedIds.model || undefined,
        variantId: selectedIds.variant || undefined,
      }),
    enabled: !!(selectedIds.model || selectedIds.variant),
    ...queryOptions,
  });

  // Fetch all body types with error handling
  const {
    data: allBodies,
    isLoading: allBodiesLoading,
    error: bodiesError,
    refetch: refetchBodies,
  } = useQuery({
    queryKey: ["dropdown-bodies-global"],
    queryFn: () => companyServices.getCompanyMetaData("bodies"),
    ...queryOptions,
  });

  // Find the ID for a display name when component mounts or values change
  useEffect(() => {
    if (allMakes?.data?.data && selectedMake) {
      const make = allMakes.data.data.find(
        (item: DropdownItem) => item.displayName === selectedMake
      );
      if (make) {
        setSelectedIds((prev) => ({ ...prev, make: make._id }));
      }
    } else if (!selectedMake) {
      setSelectedIds((prev) => ({ ...prev, make: "" }));
    }
  }, [allMakes, selectedMake]);

  useEffect(() => {
    if (allModels?.data?.data && selectedModel) {
      const model = allModels.data.data.find(
        (item: DropdownItem) => item.displayName === selectedModel
      );
      if (model) {
        setSelectedIds((prev) => ({ ...prev, model: model._id }));
      }
    } else if (!selectedModel) {
      setSelectedIds((prev) => ({ ...prev, model: "" }));
    }
  }, [allModels, selectedModel]);

  useEffect(() => {
    if (allVariants?.data?.data && selectedVariant) {
      const variant = allVariants.data.data.find(
        (item: DropdownItem) => item.displayName === selectedVariant
      );
      if (variant) {
        setSelectedIds((prev) => ({ ...prev, variant: variant._id }));
      }
    } else if (!selectedVariant) {
      setSelectedIds((prev) => ({ ...prev, variant: "" }));
    }
  }, [allVariants, selectedVariant]);

  useEffect(() => {
    if (allYears?.data?.data && selectedYear) {
      const year = allYears.data.data.find(
        (item: DropdownItem) =>
          item.year?.toString() === selectedYear || item.displayName === selectedYear
      );
      if (year) {
        setSelectedIds((prev) => ({ ...prev, year: year._id }));
      }
    } else if (!selectedYear) {
      setSelectedIds((prev) => ({ ...prev, year: "" }));
    }
  }, [allYears, selectedYear]);

  useEffect(() => {
    if (allBodies?.data?.data && selectedBody) {
      const body = allBodies.data.data.find(
        (item: DropdownItem) => item.displayName === selectedBody
      );
      if (body) {
        setSelectedIds((prev) => ({ ...prev, body: body._id }));
      }
    } else if (!selectedBody) {
      setSelectedIds((prev) => ({ ...prev, body: "" }));
    }
  }, [allBodies, selectedBody]);

  // AddEntryDialog functions
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
      import("@/api/services").then(({ companyServices }) => {
        companyServices.getCompanyMetaData("models", { makeId: addFormData.makeId })
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
      import("@/api/services").then(({ companyServices }) => {
        companyServices.getCompanyMetaData("variants", { modelId: addFormData.modelId })
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

  const handleAddEntry = async () => {
    // Validation
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

    setIsAddingEntry(true);

    try {
      let data: any = {};
      let apiEndpoint = "";

      // Prepare data based on type
      switch (addDialogType) {
        case "make":
          data = { 
            displayName: addFormData.displayName.trim(),
            isActive: true 
          };
          apiEndpoint = "makes";
          break;

        case "model":
          data = {
            displayName: addFormData.displayName.trim(),
            makeId: addFormData.makeId,
            isActive: true
          };
          apiEndpoint = "models";
          break;

        case "variant":
          data = {
            displayName: addFormData.displayName.trim(),
            models: addFormData.modelIds,
            isActive: true
          };
          apiEndpoint = "variants";
          break;

        case "body":
          data = { 
            displayName: addFormData.displayName.trim(),
            isActive: true 
          };
          apiEndpoint = "bodies";
          break;

        case "year":
          data = {
            year: parseInt(addFormData.year),
            displayName: addFormData.year,
            isActive: true
          };
          
          // Add model if selected
          if (addFormData.modelId && addFormData.modelId !== "all") {
            data.modelId = addFormData.modelId;
          }
          
          // Add variant if selected
          if (addFormData.variantId && addFormData.variantId !== "all") {
            data.variantId = addFormData.variantId;
          }
          
          apiEndpoint = "years";
          break;

        case "metadata":
          data = {
            displayName: addFormData.displayName.trim(),
            makeId: addFormData.makeId,
            bodyType: addFormData.bodyType || undefined,
            year: addFormData.year ? parseInt(addFormData.year) : undefined,
            fuelType: addFormData.fuelType || undefined,
            transmission: addFormData.transmission || undefined,
            isActive: true
          };
          apiEndpoint = "metadata";
          break;
      }

      console.log("Sending data to API:", { type: addDialogType, endpoint: apiEndpoint, data });

      // Call the API to add the entry
      let response;
      if (onAddEntry) {
        // Use the parent's add handler if provided
        await onAddEntry(addDialogType, data);
      } else {
        // Direct API call if no parent handler
        // response = await companyServices.addCompanyMetaData(apiEndpoint, data);
        // console.log("API Response:", response);
      }

      toast.success(`${addDialogType.charAt(0).toUpperCase() + addDialogType.slice(1)} added successfully!`);
      
      // Refetch the relevant data after adding a new entry
      setTimeout(async () => {
        try {
          switch (addDialogType) {
            case "make":
              await refetchMakes();
              break;
            case "model":
              await refetchModels();
              break;
            case "variant":
              await refetchVariants();
              break;
            case "year":
              await refetchYears();
              break;
            case "body":
              await refetchBodies();
              break;
            default:
              break;
          }
        } catch (error) {
          console.error("Error refetching data:", error);
        }
      }, 1000); // Increased delay to allow backend processing

      setShowAddDialog(false);
      resetAddForm();
      
    } catch (error: any) {
      console.error("Error adding entry:", error);
      
      let errorMessage = "Failed to add entry. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsAddingEntry(false);
    }
  };

  const renderSelect = (
    label: string,
    value: string | undefined,
    onChange: (displayName: string) => void,
    options: DropdownItem[] | undefined,
    isLoading: boolean,
    placeholder: string,
    disabledCondition: boolean = false,
    error?: any
  ) => (
    <div className="space-y-2">
      {showLabels && (
        <Label htmlFor={label.toLowerCase().replace(" ", "-")}>{label}</Label>
      )}
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : error ? (
        <div className="h-10 w-full border border-red-300 rounded-md flex items-center px-3 bg-red-50">
          <span className="text-sm text-red-600">
            Error loading {label.toLowerCase()}
          </span>
        </div>
      ) : (
        <Select
          value={value || ""}
          onValueChange={(selectedDisplayName) => {
            // Only call onChange if it's not the placeholder value
            if (selectedDisplayName !== "placeholder") {
              // Call the onChange with display name only
              onChange(selectedDisplayName);
            }
          }}
          disabled={disabled || disabledCondition}
        >
          <SelectTrigger
            id={label.toLowerCase().replace(" ", "-")}
            className="w-full"
          >
            <SelectValue placeholder={placeholder}>
              {value || placeholder}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="placeholder" disabled>
              {placeholder}
            </SelectItem>
            {options?.map((item: DropdownItem) => {
              // For year options, use the year value if available, otherwise fall back to displayName
              const itemDisplay =
                label === "Year"
                  ? item.year
                    ? item.year.toString()
                    : item.displayName
                  : item.displayName;

              return (
                <SelectItem key={item._id} value={itemDisplay}>
                  {itemDisplay}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  return (
    <div className={className}>
      {apiError && (
        <Alert variant="destructive">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Make Selector */}
        {renderSelect(
          "Make",
          selectedMake,
          (displayName) => {
            onMakeChange(displayName);
            onModelChange("");
            onVariantChange("");
            onYearChange("");
          },
          allMakes?.data?.data,
          allMakesLoading,
          "Select Make",
          false,
          makesError
        )}

        {/* Model Selector */}
        {renderSelect(
          "Model",
          selectedModel,
          (displayName) => {
            onModelChange(displayName);
            onVariantChange("");
            onYearChange("");
          },
          allModels?.data?.data,
          allModelsLoading,
          "Select Model",
          !selectedMake,
          modelsError
        )}

        {/* Variant Selector */}
        {renderSelect(
          "Variant",
          selectedVariant,
          onVariantChange,
          allVariants?.data?.data,
          allVariantsLoading,
          "Select Variant",
          !selectedModel,
          variantsError
        )}

        {/* Year Selector */}
        {renderSelect(
          "Year",
          selectedYear,
          onYearChange,
          allYears?.data?.data,
          allYearsLoading,
          "Select Year",
          !(selectedModel || selectedVariant),
          yearsError
        )}

        {/* Body Type Selector */}
        {renderSelect(
          "Body Type",
          selectedBody,
          onBodyChange,
          allBodies?.data?.data,
          allBodiesLoading,
          "Select Body Type",
          false,
          bodiesError
        )}
      </div>

      {/* Add Entry Dialog - Only show if isAdd prop is true */}
      {isAdd && (
        <div className="mt-4">
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
                    <Label>Make Name *</Label>
                    <Input
                      value={addFormData.displayName}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          displayName: e.target.value,
                        })
                      }
                      placeholder="e.g., Toyota"
                      required
                    />
                  </div>
                )}

                {addDialogType === "model" && (
                  <>
                    <div>
                      <Label>Make *</Label>
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
                          {allMakes?.data?.data?.map((make: any) => (
                            <SelectItem key={make._id} value={make._id}>
                              {make.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Model Name *</Label>
                      <Input
                        value={addFormData.displayName}
                        onChange={(e) =>
                          setAddFormData({
                            ...addFormData,
                            displayName: e.target.value,
                          })
                        }
                        placeholder="e.g., Camry"
                        required
                      />
                    </div>
                  </>
                )}

                {addDialogType === "variant" && (
                  <>
                    <div>
                      <Label>Make (for filtering models) *</Label>
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
                          {allMakes?.data?.data?.map((make: any) => (
                            <SelectItem key={make._id} value={make._id}>
                              {make.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Variant Name *</Label>
                      <Input
                        value={addFormData.displayName}
                        onChange={(e) =>
                          setAddFormData({
                            ...addFormData,
                            displayName: e.target.value,
                          })
                        }
                        placeholder="e.g., 1.8 G, 2.0 Turbo"
                        required
                      />
                    </div>
                    <div>
                      <Label>Select Models (Multiple) *</Label>
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
                    <Label>Body Type Name *</Label>
                    <Input
                      value={addFormData.displayName}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          displayName: e.target.value,
                        })
                      }
                      placeholder="e.g., Sedan"
                      required
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
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Make (Optional - for filtering)</Label>
                        <Select
                          value={addFormData.makeId}
                          onValueChange={(value) =>
                            setAddFormData({ ...addFormData, makeId: value === "all" ? "" : value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Make" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">No Make</SelectItem>
                            {allMakes?.data?.data?.map((make: any) => (
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
                            setAddFormData({ ...addFormData, modelId: value === "all" ? "" : value })
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
                            setAddFormData({ ...addFormData, variantId: value === "all" ? "" : value })
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
                        <Label>Make *</Label>
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
                            {allMakes?.data?.data?.map((make: any) => (
                              <SelectItem key={make._id} value={make._id}>
                                {make.displayName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Model *</Label>
                        <Input
                          value={addFormData.displayName}
                          onChange={(e) =>
                            setAddFormData({
                              ...addFormData,
                              displayName: e.target.value,
                            })
                          }
                          placeholder="Model name"
                          required
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
                  <Button 
                    onClick={handleAddEntry} 
                    disabled={isAddingEntry || addEntryLoading}
                  >
                    {isAddingEntry || addEntryLoading ? "Adding..." : "Add"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default VehicleMetadataSelector;