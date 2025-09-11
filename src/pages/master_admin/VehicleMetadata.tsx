import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Upload,
  Plus,
  Search,
  Filter,
  FileText,
  Database,
  Car,
  Calendar,
  Settings,
  Trash2,
  Edit,
  RefreshCw,
} from "lucide-react";
import { vehicleMetadataServices } from "@/api/services";
import FlexibleUploadModal from "@/components/metadata/FlexibleUploadModal";

interface FieldMapping {
  [key: string]: string;
}

interface UploadProgress {
  isUploading: boolean;
  progress: number;
  currentItem: number;
  totalItems: number;
  message: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const VehicleMetadata = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to transform display names to display values
  const transformToDisplayValue = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/\s+/g, '_')        // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, '')  // Remove special characters
      .trim();
  };

  // State management
  const [currentTab, setCurrentTab] = useState("metadata");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    make: "",
    model: "",
    body: "",
    year: "",
    fuelType: "",
    transmission: "",
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Upload states
  const [uploadStep, setUploadStep] = useState(0);
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    currentItem: 0,
    totalItems: 0,
    message: "",
  });

  // Dialog states
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFlexibleUpload, setShowFlexibleUpload] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState("make");
  const [editItem, setEditItem] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch queries - Get ALL models and makes for filters
  const { data: allMakes, isLoading: allMakesLoading } = useQuery({
    queryKey: ["all-vehicle-makes"],
    queryFn: () => vehicleMetadataServices.getMakes(),
  });

  const { data: allModels, isLoading: allModelsLoading } = useQuery({
    queryKey: ["all-vehicle-models"],
    queryFn: () => vehicleMetadataServices.getMakes(),
  });

  const { data: makes, isLoading: makesLoading } = useQuery({
    queryKey: ["vehicle-metadata-makes"],
    queryFn: () => vehicleMetadataServices.getMakes(),
  });

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["vehicle-metadata-models", filters.make],
    queryFn: () => vehicleMetadataServices.getModelsByMake(filters.make),
    enabled: !!filters.make,
  });

  const { data: bodies, isLoading: bodiesLoading } = useQuery({
    queryKey: ["vehicle-metadata-bodies"],
    queryFn: () => vehicleMetadataServices.getBodies(),
  });

  const { data: years, isLoading: yearsLoading } = useQuery({
    queryKey: ["vehicle-metadata-years"],
    queryFn: () => vehicleMetadataServices.getVariantYears(),
  });

  // Metadata query
  const { data: metadata, isLoading: metadataLoading } = useQuery({
    queryKey: ["vehicle-metadata", filters, pagination.page, pagination.limit, searchTerm],
    queryFn: () =>
      vehicleMetadataServices.getVehicleMetadata({
        ...filters,
        search: searchTerm,
        page: pagination.page,
        limit: pagination.limit,
      }),
  });

  // Add useEffect to handle the success case
  useEffect(() => {
    if (metadata?.data?.pagination) {
      setPagination((prev) => ({
        ...prev,
        total: metadata.data.pagination.total,
        pages: metadata.data.pagination.pages,
      }));
    }
  }, [metadata]);

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: vehicleMetadataServices.uploadJsonMetadata,
    onSuccess: (response) => {
      toast.success(
        `Upload completed! Processed: ${response.data.processed}, Created: ${response.data.created}, Updated: ${response.data.updated}`
      );
      queryClient.invalidateQueries({ queryKey: ["vehicle-metadata"] });
      setShowUploadDialog(false);
      setUploadStep(0);
      setJsonData([]);
      setFieldMapping({});
    },
    onError: (error) => {
      toast.error("Upload failed");
      console.error("Upload error:", error);
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => {
      switch (addDialogType) {
        case "make":
          return vehicleMetadataServices.addMake(data);
        case "model":
          return vehicleMetadataServices.addModel(data);
        case "body":
          return vehicleMetadataServices.addBody(data);
        case "year":
          return vehicleMetadataServices.addVariantYear(data);
        default:
          throw new Error("Invalid type");
      }
    },
    onSuccess: () => {
      toast.success(`${addDialogType} added successfully`);
      queryClient.invalidateQueries({ queryKey: ["vehicle-metadata"] });
      setShowAddDialog(false);
    },
    onError: () => {
      toast.error(`Failed to add ${addDialogType}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      vehicleMetadataServices.deleteVehicleMetadata(id),
    onSuccess: () => {
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["vehicle-metadata"] });
      setShowDeleteDialog(false);
      setDeleteItem(null);
    },
    onError: () => {
      toast.error("Failed to delete item");
      setShowDeleteDialog(false);
      setDeleteItem(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      vehicleMetadataServices.updateVehicleMetadata(editItem._id, data),
    onSuccess: (response) => {
      console.log('Update successful:', response);
      toast.success("Item updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vehicle-metadata"] });
      setEditItem(null);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error("Failed to update item");
    },
  });

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) {
          toast.error("JSON must contain an array of objects");
          return;
        }
        setJsonData(data);
        setUploadStep(1);
      } catch (error) {
        toast.error("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleFieldMappingChange = (dbField: string, jsonField: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [dbField]: jsonField,
    }));
  };

  const handleUpload = async () => {
    if (!jsonData.length || !fieldMapping.make || !fieldMapping.model) {
      toast.error("Please map at least Make and Model fields");
      return;
    }

    setUploadStep(2);
    setUploadProgress({
      isUploading: true,
      progress: 0,
      currentItem: 0,
      totalItems: jsonData.length,
      message: "Starting upload...",
    });

    try {
      await uploadMutation.mutateAsync({
        jsonData,
        fieldMapping,
      });
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const resetUpload = () => {
    setUploadStep(0);
    setJsonData([]);
    setFieldMapping({});
    setUploadProgress({
      isUploading: false,
      progress: 0,
      currentItem: 0,
      totalItems: 0,
      message: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getJsonFields = () => {
    if (!jsonData.length) return [];
    return Object.keys(jsonData[0]);
  };

  const handleDeleteItem = (item: any) => {
    setDeleteItem(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteItem) {
      deleteMutation.mutate(deleteItem._id);
    }
  };

  const handleSaveEdit = () => {
    // Transform display names to display values
    const updatedData = {
      ...editData,
      make: editData.make ? {
        ...editData.make,
        displayValue: transformToDisplayValue(editData.make.displayName)
      } : undefined,
      model: editData.model ? {
        ...editData.model,
        displayValue: transformToDisplayValue(editData.model.displayName)
      } : undefined,
      body: editData.body ? {
        ...editData.body,
        displayValue: transformToDisplayValue(editData.body.displayName)
      } : undefined,
      variantYear: editData.variantYear ? {
        ...editData.variantYear,
        displayValue: transformToDisplayValue(editData.variantYear.year?.toString())
      } : undefined
    };

    updateMutation.mutate(updatedData);
  };

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
        {pagination.total} entries
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
          }
          disabled={pagination.page === 1}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
          }
          disabled={pagination.page === pagination.pages}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderUploadStep = () => {
    switch (uploadStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Upload Vehicle Metadata
              </h3>
              <p className="text-muted-foreground mb-4">
                Select a JSON file containing vehicle metadata to upload
              </p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Select JSON File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Configure Field Mapping</h3>
              <Badge variant="secondary">{jsonData.length} records</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Database Field</Label>
              </div>
              <div>
                <Label>JSON Field</Label>
              </div>

              <Label className="font-semibold text-red-600">Make *</Label>
              <Select
                value={fieldMapping.make || ""}
                onValueChange={(value) =>
                  handleFieldMappingChange("make", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field" />
                </SelectTrigger>
                <SelectContent>
                  {getJsonFields().map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label className="font-semibold text-red-600">Model *</Label>
              <Select
                value={fieldMapping.model || ""}
                onValueChange={(value) =>
                  handleFieldMappingChange("model", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field" />
                </SelectTrigger>
                <SelectContent>
                  {getJsonFields().map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Body Type</Label>
              <Select
                value={fieldMapping.body || ""}
                onValueChange={(value) =>
                  handleFieldMappingChange("body", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Year</Label>
              <Select
                value={fieldMapping.year || ""}
                onValueChange={(value) =>
                  handleFieldMappingChange("year", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Fuel Type</Label>
              <Select
                value={fieldMapping.fuelType || ""}
                onValueChange={(value) =>
                  handleFieldMappingChange("fuelType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Label>Transmission</Label>
              <Select
                value={fieldMapping.transmission || ""}
                onValueChange={(value) =>
                  handleFieldMappingChange("transmission", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select JSON field (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">None</SelectItem>
                  {getJsonFields().map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetUpload}>
                Back
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!fieldMapping.make || !fieldMapping.model}
              >
                Upload Data
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Uploading Data</h3>
              <p className="text-muted-foreground mb-4">
                {uploadProgress.message}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {uploadProgress.currentItem} / {uploadProgress.totalItems}
                </span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
            </div>

            {!uploadProgress.isUploading && (
              <div className="flex justify-center">
                <Button onClick={() => setShowUploadDialog(false)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderMetadataTable = () => (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Make</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Body</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Fuel Type</TableHead>
            <TableHead>Transmission</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metadata?.data?.data?.map((item: any) => (
            <TableRow key={item._id}>
              <TableCell>{item.make?.displayName}</TableCell>
              <TableCell>{item.model?.displayName}</TableCell>
              <TableCell>{item.body?.displayName || "-"}</TableCell>
              <TableCell>{item.variantYear?.year || "-"}</TableCell>
              <TableCell>{item.fuelType || "-"}</TableCell>
              <TableCell>{item.transmission || "-"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditItem(item);
                      setEditData(item);
                    }}
                    className="h-8 w-8"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteItem(item)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationControls />
    </>
  );

  const renderBasicTable = (data: any[], type: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Display Name</TableHead>
          <TableHead>Display Value</TableHead>
          {type === "year" && <TableHead>Year</TableHead>}
          <TableHead>Status</TableHead>
          <TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((item: any) => (
          <TableRow key={item._id}>
            <TableCell>{item.displayName}</TableCell>
            <TableCell>{item.displayValue}</TableCell>
            {type === "year" && <TableCell>{item.year}</TableCell>}
            <TableCell>
              <Badge variant={item.isActive ? "default" : "secondary"}>
                {item.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditItem(item);
                    setEditData(item);
                  }}
                  className="h-8 w-8"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteItem(item)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <DashboardLayout title="Vehicle MetaData">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Vehicle MetaData</h1>
            <p className="text-muted-foreground">
              Manage vehicle makes, models, body types, and metadata
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowFlexibleUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>

            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Simple JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Vehicle Metadata (Legacy)</DialogTitle>
                </DialogHeader>
                {renderUploadStep()}
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
                    <Select
                      value={addDialogType}
                      onValueChange={setAddDialogType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="make">Make</SelectItem>
                        <SelectItem value="model">Model</SelectItem>
                        <SelectItem value="body">Body Type</SelectItem>
                        <SelectItem value="year">Variant Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button>Add</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label>Make</Label>
                <Select
                  value={filters.make}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, make: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {allMakes?.data?.data?.map((make: any) => (
                      <SelectItem key={make._id} value={make._id}>
                        {make.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model</Label>
                <Select
                  value={filters.model}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, model: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {allModels?.data?.data?.map((model: any) => (
                      <SelectItem key={model._id} value={model._id}>
                        {model.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Body Type</Label>
                <Select
                  value={filters.body}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, body: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Bodies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bodies</SelectItem>
                    {bodies?.data?.data?.map((body: any) => (
                      <SelectItem key={body._id} value={body._id}>
                        {body.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Select
                  value={filters.year}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, year: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years?.data?.data?.map((year: any) => (
                      <SelectItem key={year._id} value={year._id}>
                        {year.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() =>
                    setFilters({
                      make: "",
                      model: "",
                      body: "",
                      year: "",
                      fuelType: "",
                      transmission: "",
                    })
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <CardHeader>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger
                    value="metadata"
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Metadata
                  </TabsTrigger>
                  <TabsTrigger
                    value="makes"
                    className="flex items-center gap-2"
                  >
                    <Car className="h-4 w-4" />
                    Makes
                  </TabsTrigger>
                  <TabsTrigger
                    value="models"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Models
                  </TabsTrigger>
                  <TabsTrigger
                    value="bodies"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Bodies
                  </TabsTrigger>
                  <TabsTrigger
                    value="years"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Years
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <div className="p-6">
                <TabsContent value="metadata" className="mt-0">
                  {metadataLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderMetadataTable()
                  )}
                </TabsContent>

                <TabsContent value="makes" className="mt-0">
                  {makesLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(makes?.data?.data || [], "make")
                  )}
                </TabsContent>

                <TabsContent value="models" className="mt-0">
                  {modelsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(models?.data?.data || [], "model")
                  )}
                </TabsContent>

                <TabsContent value="bodies" className="mt-0">
                  {bodiesLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(bodies?.data?.data || [], "body")
                  )}
                </TabsContent>

                <TabsContent value="years" className="mt-0">
                  {yearsLoading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    renderBasicTable(years?.data?.data || [], "year")
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Flexible Upload Modal */}
        <FlexibleUploadModal
          open={showFlexibleUpload}
          onClose={() => setShowFlexibleUpload(false)}
          onUploadComplete={(result) => {
            queryClient.invalidateQueries({ queryKey: ["vehicle-metadata"] });
            console.log("Upload completed:", result);
          }}
        />

        {/* Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Vehicle Metadata</DialogTitle>
              <DialogDescription>
                Make changes to the vehicle metadata here. Display values will be automatically generated from display names.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make Display Name</Label>
                  <Input
                    value={editData.make?.displayName || ""}
                    onChange={(e) => {
                      const displayName = e.target.value;
                      const displayValue = transformToDisplayValue(displayName);
                      setEditData({
                        ...editData,
                        make: {
                          ...editData.make,
                          displayName,
                          displayValue
                        }
                      });
                    }}
                  />
                  {editData.make?.displayValue && (
                    <p className="text-xs text-muted-foreground">
                      Display Value: {editData.make.displayValue}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Model Display Name</Label>
                  <Input
                    value={editData.model?.displayName || ""}
                    onChange={(e) => {
                      const displayName = e.target.value;
                      const displayValue = transformToDisplayValue(displayName);
                      setEditData({
                        ...editData,
                        model: {
                          ...editData.model,
                          displayName,
                          displayValue
                        }
                      });
                    }}
                  />
                  {editData.model?.displayValue && (
                    <p className="text-xs text-muted-foreground">
                      Display Value: {editData.model.displayValue}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Body Type Display Name</Label>
                  <Input
                    value={editData.body?.displayName || ""}
                    onChange={(e) => {
                      const displayName = e.target.value;
                      const displayValue = transformToDisplayValue(displayName);
                      setEditData({
                        ...editData,
                        body: {
                          ...editData.body,
                          displayName,
                          displayValue
                        }
                      });
                    }}
                  />
                  {editData.body?.displayValue && (
                    <p className="text-xs text-muted-foreground">
                      Display Value: {editData.body.displayValue}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={editData.variantYear?.year || ""}
                    onChange={(e) => {
                      const year = e.target.value;
                      const displayValue = transformToDisplayValue(year);
                      setEditData({
                        ...editData,
                        variantYear: {
                          ...editData.variantYear,
                          year,
                          displayValue
                        }
                      });
                    }}
                  />
                  {editData.variantYear?.displayValue && (
                    <p className="text-xs text-muted-foreground">
                      Display Value: {editData.variantYear.displayValue}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Fuel Type</Label>
                  <Input
                    value={editData.fuelType || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, fuelType: e.target.value })
                    }
                  />
                </div>
                
                <div>
                  <Label>Transmission</Label>
                  <Input
                    value={editData.transmission || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, transmission: e.target.value })
                    }
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditItem(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {deleteItem && (
                <div className="space-y-2">
                  <p className="font-medium">
                    {deleteItem.make?.displayName || deleteItem.displayName}{" "}
                    {deleteItem.model?.displayName && `- ${deleteItem.model.displayName}`}
                  </p>
                  {deleteItem.body?.displayName && (
                    <p>Body: {deleteItem.body.displayName}</p>
                  )}
                  {deleteItem.variantYear?.year && (
                    <p>Year: {deleteItem.variantYear.year}</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default VehicleMetadata;