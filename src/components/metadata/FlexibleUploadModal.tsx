import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Database,
  Settings,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { vehicleMetadataServices } from "@/api/services";

interface FlexibleUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (result: any) => void;
}

interface FieldMapping {
  [dbField: string]: string;
}

interface DataTypeMapping {
  [field: string]: string;
}

interface CustomField {
  name: string;
  type: string;
  description?: string;
}

const FlexibleUploadModal: React.FC<FlexibleUploadModalProps> = ({
  open,
  onClose,
  onUploadComplete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0); // 0: upload, 1: configure, 2: upload progress

  // File and data states
  const [fileType, setFileType] = useState<"json" | "excel">("json");
  const [parsedData, setParsedData] = useState<any>(null);

  // Mapping states
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [dataTypeMapping, setDataTypeMapping] = useState<DataTypeMapping>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldMapping, setCustomFieldMapping] = useState<FieldMapping>(
    {}
  );

  // Schema and configuration
  const [schemaFields, setSchemaFields] = useState<any>(null);
  const [uploadOptions, setUploadOptions] = useState({
    updateExisting: true,
    validateData: true,
    createTags: true,
  });

  // Progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    message: "",
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isJsonFile = file.name.endsWith(".json");
    const isExcelFile =
      file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (!isJsonFile && !isExcelFile) {
      toast.error("Please select a JSON or Excel file");
      return;
    }

    setFileType(isJsonFile ? "json" : "excel");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result;

        // Replace fetch call with service call
        const result = await vehicleMetadataServices.parseUploadedFile({
          fileType: isJsonFile ? "json" : "excel",
          fileContent: isJsonFile
            ? fileContent
            : Array.from(new Uint8Array(fileContent as ArrayBuffer)),
        });

        if (result.data.success) {
          setParsedData(result.data.data);
          await loadSchemaFields();
          setStep(1);
        } else {
          toast.error(result.data.message || "Failed to parse file");
        }
      } catch (error) {
        toast.error("Error processing file");
        console.error("File processing error:", error);
      }
    };

    if (isJsonFile) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Replace the loadSchemaFields function:
  const loadSchemaFields = async () => {
    try {
      const result = await vehicleMetadataServices.getSchemaFields();
      if (result.data.success) {
        setSchemaFields(result.data.data);
      }
    } catch (error) {
      console.error("Error loading schema fields:", error);
    }
  };

  // Replace the handleUpload function's fetch call:
  const handleUpload = async () => {
    if (!validateConfiguration()) return;

    setStep(2);
    setUploadProgress({
      isUploading: true,
      progress: 0,
      message: "Starting bulk upload...",
    });

    try {
      const uploadData = {
        data: parsedData.records,
        fieldMapping: {
          ...fieldMapping,
          customFields: customFieldMapping,
        },
        dataTypes: dataTypeMapping,
        customFieldTypes: Object.fromEntries(
          customFields.map((cf) => [cf.name, cf.type])
        ),
        options: uploadOptions,
      };

      // Replace fetch call with service call
      const result = await vehicleMetadataServices.bulkUploadMetadata(
        uploadData
      );

      if (result.data.success) {
        setUploadProgress({
          isUploading: false,
          progress: 100,
          message: "Upload completed successfully!",
        });

        toast.success(
          `Upload completed! Created: ${result.data.data.created}, Updated: ${result.data.data.updated}`
        );
        onUploadComplete(result);
        setTimeout(() => {
          onClose();
          resetModal();
        }, 2000);
      } else {
        throw new Error(result.data.message);
      }
    } catch (error) {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        message: "Upload failed",
      });
      toast.error("Upload failed");
      console.error("Upload error:", error);
    }
  };

  const handleFieldMappingChange = (dbField: string, jsonField: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [dbField]: jsonField,
    }));
  };

  const handleDataTypeChange = (field: string, type: string) => {
    setDataTypeMapping((prev) => ({
      ...prev,
      [field]: type,
    }));
  };

  const addCustomField = () => {
    setCustomFields((prev) => [...prev, { name: "", type: "String" }]);
  };

  const updateCustomField = (index: number, field: Partial<CustomField>) => {
    setCustomFields((prev) =>
      prev.map((cf, i) => (i === index ? { ...cf, ...field } : cf))
    );
  };

  const removeCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
    // Also remove from mapping
    const fieldName = customFields[index]?.name;
    if (fieldName) {
      setCustomFieldMapping((prev) => {
        const newMapping = { ...prev };
        delete newMapping[fieldName];
        return newMapping;
      });
    }
  };

  const handleCustomFieldMapping = (
    customFieldName: string,
    jsonField: string
  ) => {
    setCustomFieldMapping((prev) => ({
      ...prev,
      [customFieldName]: jsonField,
    }));
  };

  const validateConfiguration = () => {
    if (!fieldMapping.make || !fieldMapping.model) {
      toast.error("Make and Model fields are required");
      return false;
    }

    // Check for valid custom fields
    const invalidCustomFields = customFields.filter((cf) => !cf.name.trim());
    if (invalidCustomFields.length > 0) {
      toast.error("All custom fields must have names");
      return false;
    }

    return true;
  };

  const resetModal = () => {
    setStep(0);
    setParsedData(null);
    setFieldMapping({});
    setDataTypeMapping({});
    setCustomFields([]);
    setCustomFieldMapping({});
    setUploadProgress({ isUploading: false, progress: 0, message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Upload Vehicle Metadata</h3>
        <p className="text-muted-foreground mb-6">
          Upload JSON or Excel files with flexible field mapping and data type
          conversion
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supported Formats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">JSON Files</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Array of objects</li>
                <li>• Nested objects supported</li>
                <li>• Automatic field detection</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Excel Files</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• .xlsx and .xls formats</li>
                <li>• Header row detection</li>
                <li>• Automatic type inference</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={() => fileInputRef.current?.click()} size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfigurationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Configure Field Mapping</h3>
          <p className="text-muted-foreground">
            Map your data fields to database schema and configure data types
          </p>
        </div>
        <Badge variant="secondary">
          {parsedData?.recordCount.toLocaleString()} records
        </Badge>
      </div>

      <Tabs defaultValue="required" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="required">Required Fields</TabsTrigger>
          <TabsTrigger value="optional">Optional Fields</TabsTrigger>
          <TabsTrigger value="custom">Custom Fields</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
        </TabsList>

        <TabsContent value="required" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Required Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Label className="font-medium">Database Field</Label>
                <Label className="font-medium">Your Data Field</Label>
                <Label className="font-medium">Data Type</Label>

                {schemaFields?.required?.map((field: any) => (
                  <React.Fragment key={field.name}>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">*</span>
                      <span>{field.name}</span>
                    </div>
                    <Select
                      value={fieldMapping[field.name] || ""}
                      onValueChange={(value) =>
                        handleFieldMappingChange(field.name, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {parsedData?.detectedFields?.map(
                          (detectedField: string) => (
                            <SelectItem
                              key={detectedField}
                              value={detectedField}
                            >
                              {detectedField}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Badge variant="outline">{field.type}</Badge>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optional Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Label className="font-medium">Database Field</Label>
                <Label className="font-medium">Your Data Field</Label>
                <Label className="font-medium">Data Type</Label>

                {schemaFields?.optional?.map((field: any) => (
                  <React.Fragment key={field.name}>
                    <div className="flex flex-col">
                      <span>{field.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {field.description}
                      </span>
                    </div>
                    <Select
                      value={fieldMapping[field.name] || ""}
                      onValueChange={(value) =>
                        handleFieldMappingChange(field.name, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Skip field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Skip this field</SelectItem>
                        {parsedData?.detectedFields?.map(
                          (detectedField: string) => (
                            <SelectItem
                              key={detectedField}
                              value={detectedField}
                            >
                              {detectedField}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{field.type}</Badge>
                      {parsedData?.dataTypeAnalysis?.[
                        fieldMapping[field.name]
                      ] && (
                        <Badge variant="secondary" className="text-xs">
                          Detected:{" "}
                          {
                            parsedData.dataTypeAnalysis[
                              fieldMapping[field.name]
                            ].type
                          }
                        </Badge>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Custom Fields
                <Button variant="outline" size="sm" onClick={addCustomField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customFields.map((customField, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 items-end">
                    <div>
                      <Label>Field Name</Label>
                      <Input
                        value={customField.name}
                        onChange={(e) =>
                          updateCustomField(index, { name: e.target.value })
                        }
                        placeholder="Enter field name"
                      />
                    </div>
                    <div>
                      <Label>Data Type</Label>
                      <Select
                        value={customField.type}
                        onValueChange={(value) =>
                          updateCustomField(index, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {schemaFields?.dataTypes?.map((type: string) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Source Field</Label>
                      <Select
                        value={customFieldMapping[customField.name] || ""}
                        onValueChange={(value) =>
                          handleCustomFieldMapping(customField.name, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {parsedData?.detectedFields?.map(
                            (detectedField: string) => (
                              <SelectItem
                                key={detectedField}
                                value={detectedField}
                              >
                                {detectedField}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={customField.description || ""}
                        onChange={(e) =>
                          updateCustomField(index, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Optional description"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomField(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {customFields.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No custom fields defined. Click "Add Field" to create custom
                    fields.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateExisting"
                  checked={uploadOptions.updateExisting}
                  onCheckedChange={(checked) =>
                    setUploadOptions((prev) => ({
                      ...prev,
                      updateExisting: !!checked,
                    }))
                  }
                />
                <Label htmlFor="updateExisting">Update existing records</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validateData"
                  checked={uploadOptions.validateData}
                  onCheckedChange={(checked) =>
                    setUploadOptions((prev) => ({
                      ...prev,
                      validateData: !!checked,
                    }))
                  }
                />
                <Label htmlFor="validateData">Validate data types</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createTags"
                  checked={uploadOptions.createTags}
                  onCheckedChange={(checked) =>
                    setUploadOptions((prev) => ({
                      ...prev,
                      createTags: !!checked,
                    }))
                  }
                />
                <Label htmlFor="createTags">
                  Auto-generate tags for better searchability
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={resetModal}>
          Start Over
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!fieldMapping.make || !fieldMapping.model}
        >
          Start Upload
        </Button>
      </div>
    </div>
  );

  const renderProgressStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Database className="mx-auto h-16 w-16 text-blue-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Processing Upload</h3>
        <p className="text-muted-foreground">{uploadProgress.message}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Upload Progress</span>
              <span>{uploadProgress.progress}%</span>
            </div>
            <Progress value={uploadProgress.progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {!uploadProgress.isUploading && uploadProgress.progress === 100 && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              onClose();
              resetModal();
            }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderConfigurationStep();
      case 2:
        return renderProgressStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Flexible Metadata Upload</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default FlexibleUploadModal;
