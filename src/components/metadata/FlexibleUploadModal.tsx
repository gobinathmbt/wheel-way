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
  Clock,
  Loader2,
  Info,
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

interface ParsedData {
  records: any[];
  detectedFields: string[];
  recordCount: number;
  dataTypeAnalysis: any;
  sampleData: any[];
  processingInfo: {
    estimatedBatches: number;
    estimatedTime: string;
    batchSize: number;
    isLargeDataset: boolean;
  };
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
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Mapping states
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [dataTypeMapping, setDataTypeMapping] = useState<DataTypeMapping>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customFieldMapping, setCustomFieldMapping] = useState<FieldMapping>({});

  // Schema and configuration
  const [schemaFields, setSchemaFields] = useState<any>(null);
  const [uploadOptions, setUploadOptions] = useState({
    updateExisting: true,
    validateData: true,
    createTags: true,
  });

  // Progress tracking with batch support
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    progress: 0,
    currentBatch: 0,
    totalBatches: 0,
    message: "",
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isJsonFile = file.name.endsWith(".json");
    const isExcelFile = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (!isJsonFile && !isExcelFile) {
      toast.error("Please select a JSON or Excel file");
      return;
    }

    setFileType(isJsonFile ? "json" : "excel");
    setIsParsingFile(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileContent = e.target?.result;
        
        // Show loading state for large files
        toast.loading("Parsing file...", { id: "file-parse" });

        const result = await vehicleMetadataServices.parseUploadedFile({
          fileType: isJsonFile ? "json" : "excel",
          fileContent: isJsonFile
            ? fileContent
            : Array.from(new Uint8Array(fileContent as ArrayBuffer)),
        });

        toast.dismiss("file-parse");

        if (result.data.success) {
          setParsedData(result.data.data);
          await loadSchemaFields();
          setStep(1);
          
          // Show file info
          const data = result.data.data;
          toast.success(
            `File parsed successfully! ${data.recordCount.toLocaleString()} records found. ${
              data.processingInfo.isLargeDataset 
                ? `Estimated processing time: ${data.processingInfo.estimatedTime}`
                : ''
            }`
          );
        } else {
          toast.error(result.data.message || "Failed to parse file");
        }
      } catch (error) {
        toast.dismiss("file-parse");
        toast.error("Error processing file");
        console.error("File processing error:", error);
      } finally {
        setIsParsingFile(false);
      }
    };

    if (isJsonFile) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

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

  const handleUpload = async () => {
    if (!validateConfiguration()) return;

    setStep(2);
    
    // Initialize progress with batch information
    const totalBatches = parsedData?.processingInfo.estimatedBatches || 1;
    setUploadProgress({
      isUploading: true,
      progress: 0,
      currentBatch: 0,
      totalBatches,
      message: "Starting bulk upload...",
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    });

    try {
      // Split data into chunks for batch processing
      const FRONTEND_BATCH_SIZE = 100;
      const totalRecords = parsedData?.records.length || 0;
      let allResults = {
        processed: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      // Process data in frontend batches of 1000 records
      for (let i = 0; i < totalRecords; i += FRONTEND_BATCH_SIZE) {
        const batch = parsedData?.records.slice(i, i + FRONTEND_BATCH_SIZE) || [];
        const batchNumber = Math.floor(i / FRONTEND_BATCH_SIZE) + 1;
        const totalFrontendBatches = Math.ceil(totalRecords / FRONTEND_BATCH_SIZE);

        setUploadProgress(prev => ({
          ...prev,
          currentBatch: batchNumber,
          totalBatches: totalFrontendBatches,
          message: `Processing batch ${batchNumber} of ${totalFrontendBatches}...`,
        }));

        const uploadData = {
          data: batch,
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

        const result = await vehicleMetadataServices.bulkUploadMetadata(uploadData);

        if (result.data.success) {
          const batchResults = result.data.data;
          allResults.processed += batchResults.processed;
          allResults.created += batchResults.created;
          allResults.updated += batchResults.updated;
          allResults.skipped += batchResults.skipped;
          allResults.errors.push(...(batchResults.errors || []));

          // Update progress
          const progress = Math.round((batchNumber / totalFrontendBatches) * 100);
          setUploadProgress(prev => ({
            ...prev,
            progress,
            processed: allResults.processed,
            created: allResults.created,
            updated: allResults.updated,
            skipped: allResults.skipped,
            errors: allResults.errors.length,
            message: `Completed batch ${batchNumber} of ${totalFrontendBatches}`,
          }));

          // Small delay to prevent overwhelming the server
          if (batchNumber < totalFrontendBatches) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } else {
          throw new Error(result.data.message);
        }
      }

      // Final success state
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        message: "Upload completed successfully!",
      }));

      toast.success(
        `Upload completed! Created: ${allResults.created}, Updated: ${allResults.updated}, Skipped: ${allResults.skipped}${
          allResults.errors.length > 0 ? `, Errors: ${allResults.errors.length}` : ''
        }`
      );
      
      onUploadComplete(allResults);
      setTimeout(() => {
        onClose();
        resetModal();
      }, 3000);

    } catch (error) {
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        message: "Upload failed",
      }));
      toast.error("Upload failed: " + (error instanceof Error ? error.message : 'Unknown error'));
      console.error("Upload error:", error);
    }
  };

  const handleFieldMappingChange = (dbField: string, jsonField: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [dbField]: jsonField === "all" ? "" : jsonField,
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
    const fieldName = customFields[index]?.name;
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
    
    // Remove from mapping
    if (fieldName) {
      setCustomFieldMapping((prev) => {
        const newMapping = { ...prev };
        delete newMapping[fieldName];
        return newMapping;
      });
    }
  };

  const handleCustomFieldMapping = (customFieldName: string, jsonField: string) => {
    setCustomFieldMapping((prev) => ({
      ...prev,
      [customFieldName]: jsonField === "all" ? "" : jsonField,
    }));
  };

  const validateConfiguration = () => {
    if (!fieldMapping.make || !fieldMapping.model) {
      toast.error("Make and Model fields are required");
      return false;
    }

    // Check for valid custom fields
    const invalidCustomFields = customFields.filter(
      (cf) => cf.name.trim() === ""
    );
    if (invalidCustomFields.length > 0) {
      toast.error("All custom fields must have names");
      return false;
    }

    // Check for duplicate custom field names
    const fieldNames = customFields.map(cf => cf.name.trim().toLowerCase());
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      toast.error("Custom field names must be unique");
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
    setUploadProgress({
      isUploading: false,
      progress: 0,
      currentBatch: 0,
      totalBatches: 0,
      message: "",
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    });
    setIsParsingFile(false);
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
          Upload JSON or Excel files with flexible field mapping and data type conversion
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supported Formats & Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">JSON Files</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Array of objects format</li>
                <li>• Nested objects supported</li>
                <li>• Automatic field detection</li>
                <li>• Custom field mapping</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Excel Files</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• .xlsx and .xls formats</li>
                <li>• Header row auto-detection</li>
                <li>• Data type inference</li>
                <li>• Large file support</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Batch Processing
              </span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Large datasets are automatically processed in batches of 100 records to ensure optimal performance and prevent timeouts.
            </p>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              size="lg"
              disabled={isParsingFile}
            >
              {isParsingFile ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isParsingFile ? "Parsing File..." : "Select File"}
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
            Map your data fields to database schema and configure processing options
          </p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="mb-1">
            {parsedData?.recordCount.toLocaleString()} records
          </Badge>
          {parsedData?.processingInfo.isLargeDataset && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Est. time: {parsedData.processingInfo.estimatedTime}
            </div>
          )}
        </div>
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
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Label className="font-medium">Database Field</Label>
                <Label className="font-medium">Your Data Field</Label>
                <Label className="font-medium">Data Type</Label>
                <Label className="font-medium">Sample Values</Label>
              </div>

              {schemaFields?.required?.map((field: any) => (
                <div key={field.name} className="grid grid-cols-4 gap-4 items-center py-2 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">*</span>
                    <div>
                      <span className="font-medium">{field.name}</span>
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    </div>
                  </div>
                  <Select
                    value={fieldMapping[field.name] || ""}
                    onValueChange={(value) => handleFieldMappingChange(field.name, value)}
                  >
                    <SelectTrigger className={!fieldMapping[field.name] ? "border-red-300" : ""}>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedData?.detectedFields?.map((detectedField: string) => (
                        <SelectItem key={detectedField} value={detectedField}>
                          {detectedField}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline">{field.type}</Badge>
                  <div className="text-sm text-muted-foreground">
                    {fieldMapping[field.name] && parsedData?.dataTypeAnalysis?.[fieldMapping[field.name]]?.sampleValues ? (
                      <div>
                        {parsedData.dataTypeAnalysis[fieldMapping[field.name]].sampleValues
                          .slice(0, 2)
                          .map((val: any, idx: number) => (
                            <div key={idx} className="truncate">"{val}"</div>
                          ))}
                      </div>
                    ) : (
                      "Select field to see samples"
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optional Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <Label className="font-medium">Database Field</Label>
                <Label className="font-medium">Your Data Field</Label>
                <Label className="font-medium">Data Type</Label>
                <Label className="font-medium">Detected Type</Label>
              </div>

              {schemaFields?.optional?.map((field: any) => (
                <div key={field.name} className="grid grid-cols-4 gap-4 items-start py-3 border-b">
                  <div>
                    <span className="font-medium">{field.name}</span>
                    <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                  </div>
                  <Select
                    value={fieldMapping[field.name] || ""}
                    onValueChange={(value) => handleFieldMappingChange(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Skip field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Skip this field</SelectItem>
                      {parsedData?.detectedFields?.map((detectedField: string) => (
                        <SelectItem key={detectedField} value={detectedField}>
                          {detectedField}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Badge variant="outline">{field.type}</Badge>
                  <div>
                    {fieldMapping[field.name] && parsedData?.dataTypeAnalysis?.[fieldMapping[field.name]] && (
                      <div className="space-y-1">
                        <Badge variant="secondary" className="text-xs">
                          {parsedData.dataTypeAnalysis[fieldMapping[field.name]].type}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(parsedData.dataTypeAnalysis[fieldMapping[field.name]].confidence * 100)}% confidence
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
                  <div key={index} className="grid grid-cols-6 gap-4 items-end p-3 border rounded-lg">
                    <div>
                      <Label>Field Name *</Label>
                      <Input
                        value={customField.name}
                        onChange={(e) =>
                          updateCustomField(index, { name: e.target.value })
                        }
                        placeholder="e.g., warranty_years"
                        className={!customField.name.trim() ? "border-red-300" : ""}
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
                          <SelectItem value="all">Skip this field</SelectItem>
                          {parsedData?.detectedFields?.map((detectedField: string) => (
                            <SelectItem key={detectedField} value={detectedField}>
                              {detectedField}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={customField.description || ""}
                        onChange={(e) =>
                          updateCustomField(index, { description: e.target.value })
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
                    <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No custom fields defined</p>
                    <p className="text-sm">Click "Add Field" to create custom fields that will be stored in the customFields object</p>
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
            <CardContent className="space-y-6">
              <div className="space-y-4">
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
                  <div>
                    <Label htmlFor="updateExisting" className="font-medium">Update existing records</Label>
                    <p className="text-sm text-muted-foreground">
                      Update records that already exist (based on make, model, body, year combination)
                    </p>
                  </div>
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
                  <div>
                    <Label htmlFor="validateData" className="font-medium">Validate data types</Label>
                    <p className="text-sm text-muted-foreground">
                      Perform data type validation and conversion during upload
                    </p>
                  </div>
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
                  <div>
                    <Label htmlFor="createTags" className="font-medium">Auto-generate search tags</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create searchable tags from make, model, fuel type, etc.
                    </p>
                  </div>
                </div>
              </div>

              {parsedData?.processingInfo.isLargeDataset && (
                <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-900 dark:text-orange-100">
                      Large Dataset Detected
                    </span>
                  </div>
                  <div className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
                    <p>• Records: {parsedData.recordCount.toLocaleString()}</p>
                    <p>• Estimated batches: {parsedData.processingInfo.estimatedBatches}</p>
                    <p>• Estimated processing time: {parsedData.processingInfo.estimatedTime}</p>
                    <p>• Please keep this window open during upload</p>
                  </div>
                </div>
              )}
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
          size="lg"
        >
          Start Upload ({parsedData?.recordCount.toLocaleString()} records)
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
          <div className="space-y-6">
            {/* Main Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{uploadProgress.progress}%</span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full h-3" />
            </div>

            {/* Batch Progress */}
            {uploadProgress.totalBatches > 1 && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Batch Progress</span>
                  <span>{uploadProgress.currentBatch} / {uploadProgress.totalBatches}</span>
                </div>
                <Progress 
                  value={(uploadProgress.currentBatch / uploadProgress.totalBatches) * 100} 
                  className="w-full h-2" 
                />
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadProgress.created}</div>
                <div className="text-sm text-green-800 dark:text-green-200">Created</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadProgress.updated}</div>
                <div className="text-sm text-blue-800 dark:text-blue-200">Updated</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{uploadProgress.skipped}</div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">Skipped</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadProgress.errors}</div>
                <div className="text-sm text-red-800 dark:text-red-200">Errors</div>
              </div>
            </div>

            {uploadProgress.isUploading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing... Please keep this window open
              </div>
            )}
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