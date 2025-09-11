import React, { useState, useRef, useEffect } from "react";
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
  Pause,
  Play,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";
import { vehicleMetadataServices } from "@/api/services";
import { metaSocketService, UploadProgress, BatchProgress, UploadResults } from "@/lib/metaSocket";

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

  // Socket connection state
  const [socketConnected, setSocketConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

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

  // Enhanced progress tracking with socket support
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
    batchId: "",
    estimatedTimeRemaining: 0,
    canCancel: false,
  });

  // Batch-level progress
  const [batchProgress, setBatchProgress] = useState({
    currentBatchNumber: 0,
    recordsInBatch: 0,
    recordsProcessedInBatch: 0,
    batchProgressPercent: 0,
  });

  // Initialize socket connection when modal opens
  useEffect(() => {
    if (open && !socketConnected && !connecting) {
      connectToMetaSocket();
    }
  }, [open, socketConnected, connecting]);

  // Clean up socket listeners when modal closes
  useEffect(() => {
    return () => {
      cleanupSocketListeners();
    };
  }, []);

  const connectToMetaSocket = async () => {
    setConnecting(true);
    try {
      await metaSocketService.ensureConnection();
      setSocketConnected(true);
      setupSocketListeners();
      toast.success("Connected to upload service");
    } catch (error) {
      console.error("Failed to connect to meta socket:", error);
      toast.error("Failed to connect to upload service. Using fallback mode.");
    } finally {
      setConnecting(false);
    }
  };

  const setupSocketListeners = () => {
    // Connection events
    metaSocketService.on("connected", (data) => {
      console.log("Meta socket connected:", data);
      setSocketConnected(true);
    });

    metaSocketService.on("disconnected", (data) => {
      console.log("Meta socket disconnected:", data);
      setSocketConnected(false);
      if (uploadProgress.isUploading) {
        toast.error("Connection lost during upload. Please check your connection.");
      }
    });

    // Upload events
    metaSocketService.on("uploadStarted", (data) => {
      setUploadProgress(prev => ({
        ...prev,
        isUploading: true,
        batchId: data.batchId,
        totalBatches: data.totalBatches,
        message: `Upload started - Processing ${data.totalRecords.toLocaleString()} records in ${data.totalBatches} batches`,
        canCancel: true,
      }));
    });

    metaSocketService.on("batchStart", (data) => {
      setBatchProgress({
        currentBatchNumber: data.batchNumber,
        recordsInBatch: data.recordsInBatch,
        recordsProcessedInBatch: 0,
        batchProgressPercent: 0,
      });
      setUploadProgress(prev => ({
        ...prev,
        message: `Processing batch ${data.batchNumber} of ${data.totalBatches} (${data.recordsInBatch} records)`,
      }));
    });

    metaSocketService.on("batchProgress", (data: BatchProgress) => {
      setBatchProgress({
        currentBatchNumber: data.batchNumber,
        recordsInBatch: data.totalRecordsInBatch,
        recordsProcessedInBatch: data.recordsProcessed,
        batchProgressPercent: data.progressInBatch,
      });
    });

    metaSocketService.on("batchComplete", (data) => {
      console.log("Batch completed:", data);
    });

    metaSocketService.on("uploadProgress", (data: UploadProgress) => {
      setUploadProgress(prev => ({
        ...prev,
        progress: data.progress,
        currentBatch: data.currentBatch,
        totalBatches: data.totalBatches,
        processed: data.results.processed,
        created: data.results.created,
        updated: data.results.updated,
        skipped: data.results.skipped,
        errors: data.results.errors,
        estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
        message: `Batch ${data.currentBatch} of ${data.totalBatches} - ${data.progress}% complete`,
      }));
    });

    metaSocketService.on("uploadCompleted", (data: { success: boolean; data: UploadResults; duration?: number }) => {
      const results = data.data;
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        message: `Upload completed successfully! (${data.duration ? Math.round(data.duration / 1000) : 'Unknown'} seconds)`,
        canCancel: false,
      }));

      toast.success(
        `Upload completed! Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}${
          results.errors.length > 0 ? `, Errors: ${results.errors.length}` : ''
        }`
      );
      
      onUploadComplete(results);
      setTimeout(() => {
        onClose();
        resetModal();
      }, 3000);
    });

    metaSocketService.on("uploadError", (data) => {
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        message: `Upload failed: ${data.error}`,
        canCancel: false,
      }));
      toast.error("Upload failed: " + data.error);
    });

    metaSocketService.on("uploadCancelled", (data) => {
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        message: "Upload cancelled by user",
        canCancel: false,
      }));
      toast.info("Upload cancelled");
    });

    metaSocketService.on("error", (error) => {
      console.error("Meta socket error:", error);
      toast.error("Upload service error: " + (error.message || "Unknown error"));
    });
  };

  const cleanupSocketListeners = () => {
    const events = [
      "connected", "disconnected", "uploadStarted", "batchStart", 
      "batchProgress", "batchComplete", "uploadProgress", 
      "uploadCompleted", "uploadError", "uploadCancelled", "error"
    ];
    
    events.forEach(event => {
      metaSocketService.off(event);
    });
  };

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

    // Check socket connection first
    if (!socketConnected) {
      toast.error("Not connected to upload service. Please wait for connection...");
      try {
        await connectToMetaSocket();
      } catch (error) {
        toast.error("Failed to connect to upload service. Upload aborted.");
        return;
      }
    }

    setStep(2);
    
    // Initialize progress
    setUploadProgress({
      isUploading: true,
      progress: 0,
      currentBatch: 0,
      totalBatches: parsedData?.processingInfo.estimatedBatches || 1,
      message: "Initializing upload...",
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      batchId: "",
      estimatedTimeRemaining: 0,
      canCancel: true,
    });

    setBatchProgress({
      currentBatchNumber: 0,
      recordsInBatch: 0,
      recordsProcessedInBatch: 0,
      batchProgressPercent: 0,
    });

    try {
      const uploadData = {
        data: parsedData?.records || [],
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
console.log("hi")
      // Start socket-based upload
      metaSocketService.startBulkUpload(uploadData);
      
    } catch (error) {
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        message: "Upload failed to start",
        canCancel: false,
      }));
      toast.error("Upload failed to start: " + (error instanceof Error ? error.message : 'Unknown error'));
      console.error("Upload error:", error);
    }
  };

  const handleCancelUpload = () => {
    if (uploadProgress.batchId && uploadProgress.canCancel) {
      metaSocketService.cancelUpload(uploadProgress.batchId);
      setUploadProgress(prev => ({
        ...prev,
        message: "Cancelling upload...",
        canCancel: false,
      }));
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

    const invalidCustomFields = customFields.filter(
      (cf) => cf.name.trim() === ""
    );
    if (invalidCustomFields.length > 0) {
      toast.error("All custom fields must have names");
      return false;
    }

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
      batchId: "",
      estimatedTimeRemaining: 0,
      canCancel: false,
    });
    setBatchProgress({
      currentBatchNumber: 0,
      recordsInBatch: 0,
      recordsProcessedInBatch: 0,
      batchProgressPercent: 0,
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
          Upload JSON or Excel files with real-time progress tracking via WebSocket connection
        </p>
        
        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {socketConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Connected to upload service</span>
            </>
          ) : connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
              <span className="text-sm text-yellow-600">Connecting to upload service...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Disconnected - Will reconnect automatically</span>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Real-time Upload Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Enhanced Processing</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Real-time batch progress</li>
                <li>• WebSocket connection</li>
                <li>• Live status updates</li>
                <li>• Cancel capability</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Batch Control</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 100 records per batch</li>
                <li>• Automatic retry logic</li>
                <li>• Connection monitoring</li>
                <li>• Progress persistence</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Real-time Socket Processing
              </span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your upload will be processed in real-time with live progress updates. Each batch of 100 records is processed individually with detailed feedback on creation, updates, and any errors.
            </p>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              size="lg"
              disabled={isParsingFile || connecting}
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
            Map your data fields to database schema with real-time socket processing
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
          <div className="flex items-center gap-1 text-xs mt-1">
            {socketConnected ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-green-600">Socket Ready</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Disconnected</span>
              </>
            )}
          </div>
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