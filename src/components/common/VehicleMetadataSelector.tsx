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

type LayoutVariant = 
  | "horizontal" // All fields in one row
  | "stacked" // All fields stacked vertically
  | "grid-2" // 2 columns grid
  | "grid-3" // 3 columns grid
  | "grid-5" // 5 columns grid (default)
  | "custom"; // Use custom containerClassName

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

  // Layout customization props
  layout?: LayoutVariant;
  containerClassName?: string; // Custom container classes
  fieldClassName?: string; // Classes for each field wrapper
  
  // Field visibility
  showMake?: boolean;
  showModel?: boolean;
  showVariant?: boolean;
  showYear?: boolean;
  showBody?: boolean;
  
  // Field ordering
  fieldOrder?: Array<'make' | 'model' | 'variant' | 'year' | 'body'>;
  
  // Optional props
  className?: string;
  showLabels?: boolean;
  disabled?: boolean;
  
  // Individual field props
  makeProps?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
  };
  modelProps?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
  };
  variantProps?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
  };
  yearProps?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
  };
  bodyProps?: {
    label?: string;
    placeholder?: string;
    required?: boolean;
  };
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
  layout = "grid-5",
  containerClassName,
  fieldClassName = "",
  showMake = true,
  showModel = true,
  showVariant = true,
  showYear = true,
  showBody = true,
  fieldOrder = ['make', 'model', 'variant', 'year', 'body'],
  className = "",
  showLabels = true,
  disabled = false,
  makeProps = {},
  modelProps = {},
  variantProps = {},
  yearProps = {},
  bodyProps = {},
}) => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState({
    make: "",
    model: "",
    variant: "",
    year: "",
    body: "",
  });

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

  // Get container classes based on layout
  const getContainerClasses = () => {
    if (containerClassName) return containerClassName;
    
    switch (layout) {
      case "horizontal":
        return "flex flex-wrap gap-4";
      case "stacked":
        return "space-y-4";
      case "grid-2":
        return "grid grid-cols-1 md:grid-cols-2 gap-4";
      case "grid-3":
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
      case "grid-5":
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4";
      case "custom":
        return ""; // No default classes, rely on containerClassName
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4";
    }
  };

  const renderSelect = (
    fieldKey: string,
    label: string,
    value: string | undefined,
    onChange: (displayName: string) => void,
    options: DropdownItem[] | undefined,
    isLoading: boolean,
    placeholder: string,
    disabledCondition: boolean = false,
    error?: any,
    fieldProps?: {
      label?: string;
      placeholder?: string;
      required?: boolean;
    }
  ) => {
    const finalLabel = fieldProps?.label || label;
    const finalPlaceholder = fieldProps?.placeholder || placeholder;
    const isRequired = fieldProps?.required || false;

    return (
      <div className={`space-y-2 ${fieldClassName} ${layout === 'horizontal' ? 'flex-1 min-w-0' : ''}`}>
        {showLabels && (
          <Label htmlFor={fieldKey} className={isRequired ? "required" : ""}>
            {finalLabel}{isRequired && " *"}
          </Label>
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
              if (selectedDisplayName !== "placeholder") {
                onChange(selectedDisplayName);
              }
            }}
            disabled={disabled || disabledCondition}
            required={isRequired}
          >
            <SelectTrigger id={fieldKey} className="w-full">
              <SelectValue placeholder={finalPlaceholder}>
                {value || finalPlaceholder}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder" disabled>
                {finalPlaceholder}
              </SelectItem>
              {options?.map((item: DropdownItem) => {
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
  };

  // Field configuration mapping
  const fieldConfigs = {
    make: {
      key: "make",
      label: "Make",
      value: selectedMake,
      onChange: (displayName: string) => {
        onMakeChange(displayName);
        onModelChange("");
        onVariantChange("");
        onYearChange("");
      },
      options: allMakes?.data?.data,
      isLoading: allMakesLoading,
      placeholder: "Select Make",
      disabledCondition: false,
      error: makesError,
      fieldProps: makeProps,
      show: showMake,
    },
    model: {
      key: "model",
      label: "Model",
      value: selectedModel,
      onChange: (displayName: string) => {
        onModelChange(displayName);
        onVariantChange("");
        onYearChange("");
      },
      options: allModels?.data?.data,
      isLoading: allModelsLoading,
      placeholder: "Select Model",
      disabledCondition: !selectedMake,
      error: modelsError,
      fieldProps: modelProps,
      show: showModel,
    },
    variant: {
      key: "variant",
      label: "Variant",
      value: selectedVariant,
      onChange: onVariantChange,
      options: allVariants?.data?.data,
      isLoading: allVariantsLoading,
      placeholder: "Select Variant",
      disabledCondition: !selectedModel,
      error: variantsError,
      fieldProps: variantProps,
      show: showVariant,
    },
    year: {
      key: "year",
      label: "Year",
      value: selectedYear,
      onChange: onYearChange,
      options: allYears?.data?.data,
      isLoading: allYearsLoading,
      placeholder: "Select Year",
      disabledCondition: !(selectedModel || selectedVariant),
      error: yearsError,
      fieldProps: yearProps,
      show: showYear,
    },
    body: {
      key: "body",
      label: "Body Type",
      value: selectedBody,
      onChange: onBodyChange,
      options: allBodies?.data?.data,
      isLoading: allBodiesLoading,
      placeholder: "Select Body Type",
      disabledCondition: false,
      error: bodiesError,
      fieldProps: bodyProps,
      show: showBody,
    },
  };

  // Render fields in specified order
  const renderFields = () => {
    return fieldOrder
      .filter(fieldKey => fieldConfigs[fieldKey].show)
      .map(fieldKey => {
        const config = fieldConfigs[fieldKey];
        return renderSelect(
          config.key,
          config.label,
          config.value,
          config.onChange,
          config.options,
          config.isLoading,
          config.placeholder,
          config.disabledCondition,
          config.error,
          config.fieldProps
        );
      });
  };

  return (
    <div className={className}>
      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{apiError}</AlertDescription>
        </Alert>
      )}
      <div className={getContainerClasses()}>
        {renderFields()}
      </div>
    </div>
  );
};

export default VehicleMetadataSelector;