import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"; // Added DialogDescription
import { S3Uploader, S3Config } from "@/lib/s3-client";
import { toast } from "sonner";
import axios from "axios";
import {
  Car,
  Save,
  Eye,
  Upload,
  Camera,
  Video,
  FileText,
  Calculator,
  Loader2,
  ArrowLeft,
  Plus,
  X,
  Image as ImageIcon,
  VideoIcon,
  NotepadText,
  Info,
  Check,
  Maximize,
  Play,
  Settings,
} from "lucide-react";
import PdfReportGenerator from "./PdfReportGenerator";
import { configServices } from '@/api/services';

interface MasterInspectionProps {}

interface Configuration {
  _id: string;
  config_name: string;
  description: string;
  version: string;
  created_at: string;
}

const MasterInspection: React.FC<MasterInspectionProps> = () => {
  const { company_id, vehicle_stock_id, vehicle_type, mode } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [dropdowns, setDropdowns] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [formNotes, setFormNotes] = useState<any>({});
  const [formImages, setFormImages] = useState<any>({});
  const [formVideos, setFormVideos] = useState<any>({});
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportPdfUrl, setReportPdfUrl] = useState("");
  const [s3Config, setS3Config] = useState<S3Config | null>(null);
  const [s3Uploader, setS3Uploader] = useState<S3Uploader | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [calculations, setCalculations] = useState<any>({});
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [imageModal, setImageModal] = useState<{
    open: boolean;
    images: string[];
    title: string;
  }>({
    open: false,
    images: [],
    title: "",
  });
  const [videoModal, setVideoModal] = useState<{
    open: boolean;
    videoUrl: string;
    title: string;
  }>({
    open: false,
    videoUrl: "",
    title: "",
  });
  const [inspectorId] = useState<string>("68a405a06c25cd6de3e5619b"); // This should come from authentication
  const handlePdfUploaded = (pdfUrl: string) => {
    setReportPdfUrl(pdfUrl);
    // You might want to save this URL to your database
  };

  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";

  useEffect(() => {
    loadConfiguration();
    if (vehicle_stock_id) {
      loadVehicleData();
    }
  }, [company_id, vehicle_type]);

  const loadConfiguration = async () => {
    try {
      const response = await axios.get(
        `/api/master-inspection/config/${company_id}/${vehicle_type}`
      );
      const data = response.data.data;
      setConfig(data.config);
      setDropdowns(data.dropdowns);
      setS3Config(data.s3Config);

      if (data.s3Config) {
        setS3Uploader(new S3Uploader(data.s3Config));
      }

      // Set first category as default for inspection
      if (vehicle_type === "inspection" && data.config.categories?.length > 0) {
        const sortedCategories = [...data.config.categories].sort(
          (a, b) => a.display_order - b.display_order
        );
        setSelectedCategory(sortedCategories[0].category_id);
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Load configuration error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load configuration"
      );
      setLoading(false);
    }
  };

  const loadVehicleData = async () => {
    try {
      const response = await axios.get(
        `/api/master-inspection/view/${company_id}/${vehicle_stock_id}/${vehicle_type}`
      );
      const data = response.data.data;

      setVehicle(data.vehicle);

      // Check if we have the new complete structure or old flat structure
      if (data.result && data.result.length > 0) {
        if (
          Array.isArray(data.result) &&
          data.result[0] &&
          data.result[0].category_id
        ) {
          // Process the new complete structure
          const completeFormData: any = {};
          const completeFormNotes: any = {};
          const completeFormImages: any = {};
          const completeFormVideos: any = {};

          data.result.forEach((category: any) => {
            category.sections?.forEach((section: any) => {
              section.fields?.forEach((field: any) => {
                completeFormData[field.field_id] = field.field_value;
                if (field.notes)
                  completeFormNotes[field.field_id] = field.notes;
                if (field.images)
                  completeFormImages[field.field_id] = field.images;
                if (field.videos)
                  completeFormVideos[field.field_id] = field.videos;
              });
            });
          });

          setFormData(completeFormData);
          setFormNotes(completeFormNotes);
          setFormImages(completeFormImages);
          setFormVideos(completeFormVideos);
        } else {
          // Process old flat structure
          const resultObj: any = {};
          const notesObj: any = {};
          const imagesObj: any = {};
          const videosObj: any = {};

          data.result.forEach((item: any) => {
            resultObj[item.field_id] = item.value;
            if (item.notes) notesObj[item.field_id] = item.notes;
            if (item.images) imagesObj[item.field_id] = item.images;
            if (item.videos) videosObj[item.field_id] = item.videos;
          });

          setFormData(resultObj);
          setFormNotes(notesObj);
          setFormImages(imagesObj);
          setFormVideos(videosObj);
        }
      }
    } catch (error) {
      console.error("Load vehicle data error:", error);
      toast.error("Failed to load vehicle data");
    }
  };

  const handleFieldChange = (
    fieldId: string,
    value: any,
    isRequired: boolean = false
  ) => {
    if (isViewMode) return;

    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear validation error if field is filled
    if (isRequired && value) {
      setValidationErrors((prev) => ({
        ...prev,
        [fieldId]: false,
      }));
    }
  };

  const handleNotesChange = (fieldId: string, notes: string) => {
    if (isViewMode) return;

    setFormNotes((prev) => ({
      ...prev,
      [fieldId]: notes,
    }));
  };

  const handleMultiSelectChange = (
    fieldId: string,
    value: string,
    checked: boolean,
    isRequired: boolean = false
  ) => {
    if (isViewMode) return;

    setFormData((prev) => {
      const currentValues = prev[fieldId]
        ? Array.isArray(prev[fieldId])
          ? prev[fieldId]
          : prev[fieldId].split(",")
        : [];

      let newValues;
      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter((v: string) => v !== value);
      }

      // Clear validation error if field is filled
      if (isRequired && newValues.length > 0) {
        setValidationErrors((prev) => ({
          ...prev,
          [fieldId]: false,
        }));
      }

      return {
        ...prev,
        [fieldId]: newValues,
      };
    });
  };

  const handleMultiplierChange = (
    fieldId: string,
    type: "quantity" | "price",
    value: string
  ) => {
    if (isViewMode) return;

    setFormData((prev) => {
      const currentData = prev[fieldId] || {
        quantity: "",
        price: "",
        total: 0,
      };
      const newData = { ...currentData, [type]: value };

      // Calculate total if both quantity and price are provided
      if (newData.quantity && newData.price) {
        const quantity = parseFloat(newData.quantity);
        const price = parseFloat(newData.price);
        newData.total = (quantity * price).toFixed(2);
      } else {
        newData.total = 0;
      }

      return {
        ...prev,
        [fieldId]: newData,
      };
    });
  };

  const handleFileUpload = async (
    fieldId: string,
    file: File,
    isImage: boolean = true
  ) => {
    if (!s3Uploader || isViewMode) return;

    setUploading((prev) => ({ ...prev, [fieldId]: true }));

    try {
      const uploadResult = await s3Uploader.uploadFile(file, "inspection");

      if (isImage) {
        setFormImages((prev) => ({
          ...prev,
          [fieldId]: [...(prev[fieldId] || []), uploadResult.url],
        }));
      } else {
        setFormVideos((prev) => ({
          ...prev,
          [fieldId]: [...(prev[fieldId] || []), uploadResult.url],
        }));
      }

      toast.success(`${isImage ? "Image" : "Video"} uploaded successfully`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(`Failed to upload ${isImage ? "image" : "video"}`);
    } finally {
      setUploading((prev) => ({ ...prev, [fieldId]: false }));
    }
  };

  const removeImage = (fieldId: string, imageUrl: string) => {
    if (isViewMode) return;

    setFormImages((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter(
        (url: string) => url !== imageUrl
      ),
    }));
  };

  const removeVideo = (fieldId: string, videoUrl: string) => {
    if (isViewMode) return;

    setFormVideos((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter(
        (url: string) => url !== videoUrl
      ),
    }));
  };

  const calculateFormulas = () => {
    if (!config) return;

    const newCalculations: any = {};

    if (vehicle_type === "inspection") {
      config.categories.forEach((category: any) => {
        category.calculations?.forEach((calc: any) => {
          if (!calc.is_active) return;

          let result = 0;
          calc.formula.forEach((item: any, index: number) => {
            if (item.field_id) {
              let value = 0;

              // Handle multiplier fields differently
              if (
                formData[item.field_id] &&
                typeof formData[item.field_id] === "object"
              ) {
                value = parseFloat(formData[item.field_id].total || 0);
              } else {
                value = parseFloat(formData[item.field_id] || 0);
              }

              if (index === 0) {
                result = value;
              } else {
                const prevOp = calc.formula[index - 1];
                switch (prevOp.operation) {
                  case "+":
                    result += value;
                    break;
                  case "-":
                    result -= value;
                    break;
                  case "*":
                    result *= value;
                    break;
                  case "/":
                    result = value !== 0 ? result / value : result;
                    break;
                }
              }
            }
          });
          newCalculations[calc.calculation_id] = result;
        });
      });
    } else {
      config.calculations?.forEach((calc: any) => {
        if (!calc.is_active) return;

        let result = 0;
        calc.formula.forEach((item: any, index: number) => {
          if (item.field_id) {
            let value = 0;

            // Handle multiplier fields differently
            if (
              formData[item.field_id] &&
              typeof formData[item.field_id] === "object"
            ) {
              value = parseFloat(formData[item.field_id].total || 0);
            } else {
              value = parseFloat(formData[item.field_id] || 0);
            }

            if (index === 0) {
              result = value;
            } else {
              const prevOp = calc.formula[index - 1];
              switch (prevOp.operation) {
                case "+":
                  result += value;
                  break;
                case "-":
                  result -= value;
                  break;
                case "*":
                  result *= value;
                  break;
                case "/":
                  result = value !== 0 ? result / value : result;
                  break;
              }
            }
          }
        });
        newCalculations[calc.calculation_id] = result;
      });
    }

    setCalculations(newCalculations);
  };

  useEffect(() => {
    calculateFormulas();
  }, [formData, config]);

  const validateForm = () => {
    const errors: { [key: string]: boolean } = {};
    let isValid = true;

    if (vehicle_type === "inspection") {
      config.categories.forEach((category: any) => {
        category.sections?.forEach((section: any) => {
          section.fields?.forEach((field: any) => {
            if (field.is_required && !formData[field.field_id]) {
              errors[field.field_id] = true;
              isValid = false;
            }
          });
        });
      });
    } else {
      config.sections?.forEach((section: any) => {
        section.fields?.forEach((field: any) => {
          if (field.is_required && !formData[field.field_id]) {
            errors[field.field_id] = true;
            isValid = false;
          }
        });
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  const saveData = async () => {
    if (isViewMode) return;

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      let inspectionResult;

      if (vehicle_type === "inspection") {
        // For inspection type, use the category-based structure
        inspectionResult = config.categories.map((category: any) => ({
          category_id: category.category_id,
          category_name: category.category_name,
          description: category.description || "",
          display_order: category.display_order || 0,
          is_active: category.is_active,
          sections: category.sections.map((section: any) => ({
            section_id: section.section_id,
            section_name: section.section_name,
            description: section.description || "",
            display_order: section.display_order || 0,
            is_collapsible: section.is_collapsible,
            is_expanded_by_default: section.is_expanded_by_default,
            fields: section.fields.map((field: any) => ({
              field_id: field.field_id,
              field_name: field.field_name,
              field_type: field.field_type,
              is_required: field.is_required,
              has_image: field.has_image,
              display_order: field.display_order || 0,
              placeholder: field.placeholder || "",
              help_text: field.help_text || "",
              field_value: formData[field.field_id] || "",
              dropdown_config: field.dropdown_config || null,
              images: formImages[field.field_id] || [],
              videos: formVideos[field.field_id] || [],
              notes: formNotes[field.field_id] || "",
              inspector_id: inspectorId,
              inspection_date: new Date().toISOString(),
            })),
          })),
        }));
      } else {
        // For other vehicle types, use a simplified structure
        inspectionResult = [
          {
            category_id: vehicle_type,
            category_name: config.config_name,
            description: config.description || "",
            display_order: 0,
            is_active: true,
            sections: config.sections.map((section: any) => ({
              section_id: section.section_id,
              section_name: section.section_name,
              description: section.description || "",
              display_order: section.display_order || 0,
              is_collapsible: section.is_collapsible,
              is_expanded_by_default: section.is_expanded_by_default,
              fields: section.fields.map((field: any) => ({
                field_id: field.field_id,
                field_name: field.field_name,
                field_type: field.field_type,
                is_required: field.is_required,
                has_image: field.has_image,
                display_order: field.display_order || 0,
                placeholder: field.placeholder || "",
                help_text: field.help_text || "",
                field_value: formData[field.field_id] || "",
                dropdown_config: field.dropdown_config || null,
                images: formImages[field.field_id] || [],
                videos: formVideos[field.field_id] || [],
                notes: formNotes[field.field_id] || "",
                inspector_id: inspectorId,
                inspection_date: new Date().toISOString(),
              })),
            })),
          },
        ];
      }

      await axios.post(
        `/api/master-inspection/save/${company_id}/${vehicle_stock_id}/${vehicle_type}`,
        {
          inspection_result: inspectionResult,
          reportPdfUrl,
        }
      );

      toast.success(`${vehicle_type} data saved successfully`);
    } catch (error) {
      console.error("Save data error:", error);
      toast.error("Failed to save data");
    } finally {
      setSaving(false);
    }
  };

  // Get dropdown by ID with proper mapping
  const getDropdownById = (dropdownId: any) => {
    if (!dropdowns) return null;

    const id =
      typeof dropdownId === "object"
        ? dropdownId._id || dropdownId.$oid
        : dropdownId;
    return dropdowns.find((d: any) => d._id === id);
  };

  const renderField = (field: any) => {
    const fieldId = field.field_id;
    const value = formData[fieldId] || "";
    const notes = formNotes[fieldId] || "";
    const images = formImages[fieldId] || [];
    const videos = formVideos[fieldId] || [];
    const disabled = isViewMode;
    const hasError = validationErrors[fieldId];

    return (
      <div
        className={`space-y-4 p-4 md:p-6 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow ${
          hasError ? "border-red-500" : "border-border"
        }`}
      >
        {/* Field Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Label className="text-base font-medium">
                {field.field_name}
                {field.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>
              {field.help_text && (
                <div className="group relative">
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 whitespace-nowrap shadow-md border">
                      {field.help_text}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {field.help_text && (
              <p className="text-xs text-muted-foreground mt-1">
                {field.help_text}
              </p>
            )}
          </div>

          {/* Field Type Badge */}
          <Badge variant="secondary" className="text-xs hidden sm:flex">
            {field.field_type}
          </Badge>
        </div>

        {/* Main Field Input */}
        <div className="space-y-4">
          {(() => {
            switch (field.field_type) {
              case "text":
                return (
                  <Input
                    value={value}
                    onChange={(e) =>
                      handleFieldChange(
                        fieldId,
                        e.target.value,
                        field.is_required
                      )
                    }
                    placeholder={field.placeholder}
                    disabled={disabled}
                    className="h-10"
                  />
                );

              case "number":
              case "currency":
                return (
                  <div className="relative">
                    {field.field_type === "currency" && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        $
                      </span>
                    )}
                    <Input
                      type="number"
                      step={field.field_type === "currency" ? "0.01" : "1"}
                      value={value}
                      onChange={(e) =>
                        handleFieldChange(
                          fieldId,
                          e.target.value,
                          field.is_required
                        )
                      }
                      placeholder={field.placeholder}
                      disabled={disabled}
                      className={`h-10 ${
                        field.field_type === "currency" ? "pl-8" : ""
                      }`}
                    />
                  </div>
                );

              case "mutiplier":
                const multiplierValue =
                  typeof value === "object"
                    ? value
                    : { quantity: "", price: "", total: 0 };
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          value={multiplierValue.quantity}
                          onChange={(e) =>
                            handleMultiplierChange(
                              fieldId,
                              "quantity",
                              e.target.value
                            )
                          }
                          placeholder="Quantity"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Price</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                            $
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            value={multiplierValue.price}
                            onChange={(e) =>
                              handleMultiplierChange(
                                fieldId,
                                "price",
                                e.target.value
                              )
                            }
                            placeholder="Price"
                            disabled={disabled}
                            className="h-9 pl-8"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Total</Label>
                      <div className="p-3 bg-muted/30 rounded-lg font-medium">
                        ${multiplierValue.total || "0.00"}
                      </div>
                    </div>
                  </div>
                );

              case "date":
                return (
                  <Input
                    type="date"
                    value={value}
                    onChange={(e) =>
                      handleFieldChange(
                        fieldId,
                        e.target.value,
                        field.is_required
                      )
                    }
                    disabled={disabled}
                    className="h-10"
                  />
                );

              case "boolean":
                return (
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                      id={fieldId}
                      checked={value === true || value === "true"}
                      onCheckedChange={(checked) =>
                        handleFieldChange(fieldId, checked, field.is_required)
                      }
                      disabled={disabled}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor={fieldId}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {field.placeholder || "Check if applicable"}
                    </Label>
                  </div>
                );

              case "dropdown":
                const dropdown = getDropdownById(
                  field.dropdown_config?.dropdown_id
                );
                const allowMultiple = field.dropdown_config?.allow_multiple;

                if (!dropdown) {
                  return (
                    <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                      Dropdown configuration not found
                    </div>
                  );
                }

                // Sort dropdown values by display_order
                const sortedValues = [...(dropdown.values || [])].sort(
                  (a, b) => (a.display_order || 0) - (b.display_order || 0)
                );

                if (allowMultiple) {
                  const selectedValues = Array.isArray(value)
                    ? value
                    : value
                    ? value.split(",")
                    : [];

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        {sortedValues
                          .filter((opt: any) => opt.is_active)
                          .map((opt: any) => {
                            const isSelected = selectedValues.includes(
                              opt.option_value
                            );
                            return (
                              <div
                                key={opt._id}
                                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                                  isSelected
                                    ? "bg-primary/10 border-primary"
                                    : "bg-background border-border"
                                }`}
                                onClick={() =>
                                  !disabled &&
                                  handleMultiSelectChange(
                                    fieldId,
                                    opt.option_value,
                                    !isSelected,
                                    field.is_required
                                  )
                                }
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onChange={() => {}}
                                  disabled={disabled}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <Label className="flex-1 cursor-pointer font-normal">
                                  {opt.display_value || opt.option_value}
                                </Label>
                              </div>
                            );
                          })}
                      </div>
                      {selectedValues.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {selectedValues.map((val: string) => {
                            const option = sortedValues.find(
                              (opt: any) => opt.option_value === val
                            );
                            return (
                              <Badge
                                key={val}
                                variant="default"
                                className="flex items-center space-x-1"
                              >
                                <span>{option?.display_value || val}</span>
                                {!disabled && (
                                  <X
                                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                                    onClick={() =>
                                      handleMultiSelectChange(
                                        fieldId,
                                        val,
                                        false,
                                        field.is_required
                                      )
                                    }
                                  />
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <Select
                      value={value}
                      onValueChange={(val) =>
                        handleFieldChange(fieldId, val, field.is_required)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue
                          placeholder={
                            field.placeholder || `Select ${field.field_name}`
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedValues
                          .filter((opt: any) => opt.is_active)
                          .map((opt: any) => (
                            <SelectItem key={opt._id} value={opt.option_value}>
                              <div className="flex items-center space-x-2">
                                <span>
                                  {opt.display_value || opt.option_value}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  );
                }

              case "video":
                return (
                  <div className="space-y-4">
                    {videos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {videos.map((videoUrl: string, index: number) => (
                          <div
                            key={index}
                            className="relative group rounded-lg overflow-hidden border"
                          >
                            <div className="aspect-video bg-muted flex items-center justify-center">
                              <div className="relative w-full h-full flex items-center justify-center">
                                <video
                                  src={videoUrl}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="rounded-full h-10 w-10"
                                    onClick={() =>
                                      setVideoModal({
                                        open: true,
                                        videoUrl,
                                        title: `${field.field_name} Video ${
                                          index + 1
                                        }`,
                                      })
                                    }
                                  >
                                    <Play className="h-5 w-5 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {!disabled && (
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeVideo(fieldId, videoUrl)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center transition-colors ${
                          !disabled
                            ? "cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30"
                            : ""
                        }`}
                        onClick={
                          !disabled
                            ? () =>
                                document
                                  .getElementById(`video-${fieldId}`)
                                  ?.click()
                            : undefined
                        }
                      >
                        <Video className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Click to upload video
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {field.placeholder || "Upload video files"}
                        </p>
                      </div>
                    )}
                    {!disabled && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById(`video-${fieldId}`)?.click()
                          }
                          disabled={uploading[fieldId]}
                        >
                          {uploading[fieldId] ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Video className="h-4 w-4 mr-2" />
                          )}
                          {videos.length > 0
                            ? "Add More Videos"
                            : "Upload Videos"}
                        </Button>
                      </div>
                    )}
                    {!disabled && (
                      <input
                        id={`video-${fieldId}`}
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach((file) =>
                            handleFileUpload(fieldId, file, false)
                          );
                        }}
                        className="hidden"
                      />
                    )}
                  </div>
                );

              default:
                return (
                  <Textarea
                    value={value}
                    onChange={(e) =>
                      handleFieldChange(
                        fieldId,
                        e.target.value,
                        field.is_required
                      )
                    }
                    placeholder={field.placeholder}
                    disabled={disabled}
                    className="min-h-[80px] resize-y"
                  />
                );
            }
          })()}

          {/* Image Capture Section */}
          {field.has_image && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Images</Label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.slice(0, 6).map((imageUrl: string, index: number) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={imageUrl}
                        alt={`${field.field_name} ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() =>
                          setImageModal({
                            open: true,
                            images,
                            title: `${field.field_name} Images`,
                          })
                        }
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="rounded-full h-8 w-8"
                          onClick={() =>
                            setImageModal({
                              open: true,
                              images,
                              title: `${field.field_name} Images`,
                            })
                          }
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                      {!disabled && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(fieldId, imageUrl)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {images.length > 6 && (
                    <div
                      className="border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors aspect-square"
                      onClick={() =>
                        setImageModal({
                          open: true,
                          images,
                          title: `${field.field_name} Images`,
                        })
                      }
                    >
                      <div className="text-center p-4">
                        <Plus className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs text-muted-foreground">
                          +{images.length - 6} more
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!disabled && (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    document.getElementById(`image-${fieldId}`)?.click()
                  }
                >
                  {uploading[fieldId] ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload images
                      </p>
                    </>
                  )}
                </div>
              )}

              <input
                id={`image-${fieldId}`}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach((file) =>
                    handleFileUpload(fieldId, file, true)
                  );
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Notes Section */}
          {field.has_notes && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <NotepadText className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Notes</Label>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(fieldId, e.target.value)}
                placeholder="Add notes or observations..."
                disabled={disabled}
                className="min-h-[60px] resize-y"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading configuration...</p>
          <p className="text-sm text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto text-center shadow-lg">
          <CardContent className="pt-8 pb-6">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">
              Configuration Not Found
            </h3>
            <p className="text-muted-foreground mb-6">
              No active {vehicle_type} configuration found. Please set up
              configuration or make one active.
            </p>
            <Button onClick={() => window.history.back()} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort categories and sections by display_order
  const sortedCategories = config.categories
    ? [...config.categories]
        .filter((cat: any) => cat.is_active)
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    : [];
  const sortedSections = config.sections
    ? [...config.sections].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      )
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header - Fixed */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Back</span>
              </Button>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {vehicle
                      ? `${vehicle.make} ${vehicle.model}`
                      : "Vehicle Inspection"}
                  </h1>
                  <div className="flex items-center flex-wrap gap-1 mt-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {vehicle
                        ? `Stock ID: ${vehicle.vehicle_stock_id} • ${vehicle.year}`
                        : config.config_name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {vehicle_type}
                    </Badge>
                    <Badge
                      variant={isViewMode ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {isViewMode ? "View Mode" : "Edit Mode"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {!isViewMode && (
              <>
                <Button
                  onClick={() => setReportDialogOpen(true)}
                  variant="outline"
                  className="shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <a
                  href={reportPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="shadow-sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Pdf
                  </Button>
                </a>
                <Button
                  onClick={saveData}
                  disabled={saving}
                  size="lg"
                  className="shadow-sm w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="container mx-auto px-3 sm:px-4 py-6">
        {vehicle_type === "inspection" ? (
          // Inspection with categories
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="space-y-6"
          >
            <TabsList className="w-full justify-start h-auto bg-transparent p-0 overflow-x-auto">
              <div className="flex space-x-1 pb-2">
                {sortedCategories.map((category: any) => (
                  <TabsTrigger
                    key={category.category_id}
                    value={category.category_id}
                    className="px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground whitespace-nowrap"
                  >
                    {category.category_name}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>

            {sortedCategories.map((category: any) => (
              <TabsContent
                key={category.category_id}
                value={category.category_id}
                className="space-y-6 mt-0"
              >
                {/* Category Sections */}
                <Accordion type="multiple" className="space-y-4">
                  {category.sections
                    // ?.filter((section: any) => section.is_active)
                    .sort(
                      (a: any, b: any) =>
                        (a.display_order || 0) - (b.display_order || 0)
                    )
                    .map((section: any) => (
                      <AccordionItem
                        key={section.section_id}
                        value={section.section_id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {section.display_order + 1 || "?"}
                              </span>
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold">
                                {section.section_name}
                              </h3>
                              {section.help_text && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {section.help_text}
                                </p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0">
                          <div className="space-y-4 px-4 pb-4">
                            {section.fields
                              // ?.filter((field: any) => field.is_active)
                              .sort(
                                (a: any, b: any) =>
                                  (a.display_order || 0) -
                                  (b.display_order || 0)
                              )
                              .map((field: any) => (
                                <div key={field.field_id}>
                                  {renderField(field)}
                                </div>
                              ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>

                {/* Category Calculations */}
                {category.calculations &&
                  category.calculations.filter((calc: any) => calc.is_active)
                    .length > 0 && (
                    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50 shadow-sm">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Calculator className="h-5 w-5 text-primary" />
                          <span>Calculations</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {category.calculations
                          .filter((calc: any) => calc.is_active)
                          .map((calc: any) => (
                            <div
                              key={calc.calculation_id}
                              className="flex items-center justify-between p-3 bg-background rounded-lg border"
                            >
                              <span className="font-medium">
                                {calc.display_name}
                              </span>
                              <span className="text-lg font-bold text-primary">
                                {typeof calculations[calc.calculation_id] ===
                                "number"
                                  ? calculations[calc.calculation_id].toFixed(2)
                                  : "0.00"}
                              </span>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // Other vehicle types (valuation, condition report)
          <div className="space-y-6">
            {/* Global Calculations */}
            {config.calculations &&
              config.calculations.filter((calc: any) => calc.is_active).length >
                0 && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      <span>Calculations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {config.calculations
                      .filter((calc: any) => calc.is_active)
                      .map((calc: any) => (
                        <div
                          key={calc.calculation_id}
                          className="flex items-center justify-between p-3 bg-background rounded-lg border"
                        >
                          <span className="font-medium">
                            {calc.calculation_name}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {typeof calculations[calc.calculation_id] ===
                            "number"
                              ? calculations[calc.calculation_id].toFixed(2)
                              : "0.00"}
                          </span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}

            {/* Sections */}
            <Accordion type="multiple" className="space-y-4">
              {sortedSections
                // .filter((section: any) => section.is_active)
                .map((section: any) => (
                  <AccordionItem
                    key={section.section_id}
                    value={section.section_id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {section.display_order + 1 || "?"}
                          </span>
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">
                            {section.section_name}
                          </h3>
                          {section.help_text && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.help_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-0">
                      <div className="space-y-4 px-4 pb-4">
                        {section.fields
                          // ?.filter((field: any) => field.is_active)
                          .sort(
                            (a: any, b: any) =>
                              (a.display_order || 0) - (b.display_order || 0)
                          )
                          .map((field: any) => (
                            <div key={field.field_id}>{renderField(field)}</div>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Dialog
        open={imageModal.open}
        onOpenChange={(open) => setImageModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>{imageModal.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {imageModal.images.map((image: string, index: number) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-lg overflow-hidden border"
                >
                  <img
                    src={image}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog
        open={videoModal.open}
        onOpenChange={(open) => setVideoModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center space-x-2">
              <VideoIcon className="h-5 w-5" />
              <span>{videoModal.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto p-6">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={videoModal.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <PdfReportGenerator
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        data={{ formData, formNotes, formImages, formVideos, calculations }}
        vehicle={vehicle}
        config={config}
        vehicleType={vehicle_type}
        s3Uploader={s3Uploader}
        onPdfUploaded={handlePdfUploaded}
        inspectorId={inspectorId}
      />
    </div>
  );
};

export default MasterInspection;
