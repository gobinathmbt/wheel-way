import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Settings,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Search,
  Edit,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configServices, dropdownServices } from "@/api/services";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";
import ConfigPreviewModal from "@/components/inspection/ConfigPreviewModal";
import FieldEditDialog from "@/components/inspection/FieldEditDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const InspectionConfig = () => {
  const queryClient = useQueryClient();
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFieldEditDialogOpen, setIsFieldEditDialogOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState(null);
  const [fieldToDelete, setFieldToDelete] = useState(null);
  const [isFieldDeleteDialogOpen, setIsFieldDeleteDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [configToEdit, setConfigToEdit] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [configFormData, setConfigFormData] = useState({
    config_name: "",
    description: "",
    is_active: false,
  });

  const [editFormData, setEditFormData] = useState({
    config_name: "",
    description: "",
    is_active: false,
  });

  const [sectionFormData, setSectionFormData] = useState({
    section_name: "",
    description: "",
    is_collapsible: true,
    is_expanded_by_default: false,
  });

  const [fieldFormData, setFieldFormData] = useState({
    field_name: "",
    field_type: "text",
    is_required: false,
    has_image: false,
    placeholder: "",
    help_text: "",
    dropdown_config: {
      dropdown_name: "",
      allow_multiple: false,
    },
  });

  // Queries
  const {
    data: configsData,
    isLoading: configsLoading,
    refetch,
  } = useQuery({
    queryKey: ["inspection-configs", currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const params = {
        page: currentPage,
        limit: 6,
        search: searchTerm,
        status: statusFilter,
      };
      const response = await configServices.getInspectionConfigs(params);
      return response.data;
    },
  });

  const { data: selectedConfigDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["inspection-config-details", selectedConfig?._id],
    queryFn: async () => {
      if (!selectedConfig) return null;
      const response = await configServices.getInspectionConfigDetails(
        selectedConfig._id
      );
      return response.data.data;
    },
    enabled: !!selectedConfig,
  });

  const { data: dropdowns } = useQuery({
    queryKey: ["dropdowns-for-config"],
    queryFn: async () => {
      const response = await dropdownServices.getDropdowns();
      return response.data.data;
    },
  });

  // Mutations
  const createConfigMutation = useMutation({
    mutationFn: configServices.createInspectionConfig,
    onSuccess: () => {
      toast.success("Configuration created successfully");
      setIsConfigDialogOpen(false);
      setConfigFormData({ config_name: "", description: "", is_active: false });
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create configuration"
      );
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      configServices.updateInspectionConfig(id, data),
    onSuccess: () => {
      toast.success("Configuration updated successfully");
      setIsEditDialogOpen(false);
      setConfigToEdit(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update configuration"
      );
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: ({ configId, fieldId }: { configId: string; fieldId: string }) =>
      configServices.deleteInspectionField(configId, fieldId),
    onSuccess: () => {
      toast.success("Field deleted successfully");
      setIsFieldDeleteDialogOpen(false);
      setFieldToDelete(null);
      queryClient.invalidateQueries({
        queryKey: ["inspection-config-details"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete field");
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      configServices.updateInspectionConfig(id, data),
    onSuccess: () => {
      toast.success("Configuration saved successfully");
      queryClient.invalidateQueries({ queryKey: ["inspection-configs"] });
      queryClient.invalidateQueries({
        queryKey: ["inspection-config-details"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to save configuration"
      );
    },
  });

  const handleSaveChanges = async () => {
    if (!selectedConfig || !selectedConfigDetails) {
      toast.error("No configuration selected");
      return;
    }

    try {
      await saveConfigMutation.mutateAsync({
        id: selectedConfig._id,
        data: {
          config_name: selectedConfig.config_name,
          description: selectedConfig.description,
          is_active: selectedConfig.is_active,
          categories: selectedConfigDetails.categories,
          settings: selectedConfigDetails.settings,
        },
      });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const deleteConfigMutation = useMutation({
    mutationFn: configServices.deleteInspectionConfig,
    onSuccess: () => {
      toast.success("Configuration deleted successfully");
      setIsDeleteDialogOpen(false);
      setConfigToDelete(null);
      if (selectedConfig && selectedConfig._id === configToDelete?._id) {
        setSelectedConfig(null);
      }
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete configuration"
      );
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: ({
      configId,
      categoryId,
      data,
    }: {
      configId: string;
      categoryId: string;
      data: any;
    }) => configServices.addInspectionSection(configId, categoryId, data),
    onSuccess: () => {
      toast.success("Section added successfully");
      setIsSectionDialogOpen(false);
      setSectionFormData({
        section_name: "",
        description: "",
        is_collapsible: true,
        is_expanded_by_default: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["inspection-config-details"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add section");
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: ({
      configId,
      sectionId,
      data,
    }: {
      configId: string;
      sectionId: string;
      data: any;
    }) => configServices.addInspectionField(configId, sectionId, data),
    onSuccess: () => {
      toast.success("Field added successfully");
      setIsFieldDialogOpen(false);
      setFieldFormData({
        field_name: "",
        field_type: "text",
        is_required: false,
        has_image: false,
        placeholder: "",
        help_text: "",
        dropdown_config: {
          dropdown_name: "",
          allow_multiple: false,
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["inspection-config-details"],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add field");
    },
  });

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    createConfigMutation.mutate(configFormData);
  };

  const handleEditField = (field: any) => {
    setFieldToEdit(field);
    setIsFieldEditDialogOpen(true);
  };

  const handleDeleteField = (field: any) => {
    setFieldToDelete(field);
    setIsFieldDeleteDialogOpen(true);
  };

  const confirmFieldDelete = () => {
    if (!fieldToDelete || !selectedConfig) return;
    deleteFieldMutation.mutate({
      configId: selectedConfig._id,
      fieldId: fieldToDelete.field_id,
    });
  };
  
  const handleEditConfig = (config: any) => {
    setConfigToEdit(config);
    setEditFormData({
      config_name: config.config_name,
      description: config.description || "",
      is_active: config.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configToEdit) return;
    updateConfigMutation.mutate({
      id: configToEdit._id,
      data: editFormData,
    });
  };

  const handleDeleteConfig = (config: any) => {
    setConfigToDelete(config);
    setIsDeleteDialogOpen(true);
  };

  const handlePreview = () => {
    if (!selectedConfigDetails) {
      toast.error("No configuration selected to preview");
      return;
    }
    setIsPreviewOpen(true);
  };

  const confirmDelete = () => {
    if (!configToDelete) return;
    deleteConfigMutation.mutate(configToDelete._id);
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig || !selectedCategory) return;

    addSectionMutation.mutate({
      configId: selectedConfig._id,
      categoryId: selectedCategory,
      data: sectionFormData,
    });
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig || !selectedSection) return;

    const fieldData = {
      field_name: fieldFormData.field_name,
      field_type: fieldFormData.field_type,
      is_required: fieldFormData.is_required,
      has_image: fieldFormData.has_image,
      placeholder: fieldFormData.placeholder,
      help_text: fieldFormData.help_text,
      dropdown_config:
        fieldFormData.field_type === "dropdown"
          ? fieldFormData.dropdown_config
          : undefined,
    };

    addFieldMutation.mutate({
      configId: selectedConfig._id,
      sectionId: selectedSection.section_id,
      data: fieldData,
    });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "number", label: "Number" },
    { value: "currency", label: "Currency" },
    { value: "video", label: "Video" },
    { value: "dropdown", label: "Dropdown" },
    { value: "image", label: "Image" },
    { value: "date", label: "Date" },
    { value: "boolean", label: "Yes/No" },
  ];

  const configs = configsData?.data || [];
  const pagination = configsData?.pagination;

  return (
    <DashboardLayout title="Inspection Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Inspection Configuration
            </h2>
            <p className="text-muted-foreground">
              Configure dynamic forms for mobile inspections
            </p>
          </div>
          <Dialog
            open={isConfigDialogOpen}
            onOpenChange={setIsConfigDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Inspection Configuration</DialogTitle>
                <DialogDescription>
                  Create a new configuration template for vehicle inspections
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateConfig} className="space-y-4">
                <div>
                  <Label htmlFor="config_name">Configuration Name</Label>
                  <Input
                    id="config_name"
                    value={configFormData.config_name}
                    onChange={(e) =>
                      setConfigFormData({
                        ...configFormData,
                        config_name: e.target.value,
                      })
                    }
                    placeholder="Standard Inspection v1.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={configFormData.description}
                    onChange={(e) =>
                      setConfigFormData({
                        ...configFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Standard vehicle inspection configuration"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={configFormData.is_active}
                    onCheckedChange={(checked) =>
                      setConfigFormData({
                        ...configFormData,
                        is_active: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="is_active">Set as active configuration</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfigDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createConfigMutation.isPending}
                  >
                    {createConfigMutation.isPending
                      ? "Creating..."
                      : "Create Configuration"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search configurations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={configsLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration List */}
        <Card>
          <CardHeader>
            <CardTitle>Configurations</CardTitle>
            <CardDescription>
              Select a configuration to edit or manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configsLoading ? (
              <div className="text-center py-8">Loading configurations...</div>
            ) : configs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No configurations found
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {configs.map((config: any) => (
                    <div
                      key={config._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedConfig?._id === config._id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedConfig(config)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold truncate">
                          {config.config_name}
                        </h3>
                        <div className="flex gap-1 ml-2">
                          {config.is_active && (
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          )}
                          {!config.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {config.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>v{config.version}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditConfig(config);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfig(config);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {Array.from(
                        { length: pagination.total_pages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={page === currentPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage(
                              Math.min(pagination.total_pages, currentPage + 1)
                            )
                          }
                          className={
                            currentPage === pagination.total_pages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Configuration Editor */}
        {selectedConfig && selectedConfigDetails && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    Edit Configuration: {selectedConfig.config_name}
                  </CardTitle>
                  <CardDescription>
                    Configure categories, sections, and fields for this
                    inspection
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={saveConfigMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {detailsLoading ? (
                <div className="text-center py-8">
                  Loading configuration details...
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {selectedConfigDetails.categories?.map((category: any) => (
                    <AccordionItem
                      key={category.category_id}
                      value={category.category_id}
                    >
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div>
                            <h3 className="font-semibold">
                              {category.category_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {category.sections?.length || 0} sections
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Sections</h4>
                            <Dialog
                              open={isSectionDialogOpen}
                              onOpenChange={setIsSectionDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSelectedCategory(category.category_id)
                                  }
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Section
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Add Section to {category.category_name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Create a new section within this category
                                  </DialogDescription>
                                </DialogHeader>
                                <form
                                  onSubmit={handleAddSection}
                                  className="space-y-4"
                                >
                                  <div>
                                    <Label htmlFor="section_name">
                                      Section Name
                                    </Label>
                                    <Input
                                      id="section_name"
                                      value={sectionFormData.section_name}
                                      onChange={(e) =>
                                        setSectionFormData({
                                          ...sectionFormData,
                                          section_name: e.target.value,
                                        })
                                      }
                                      placeholder="Engine Inspection"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="section_description">
                                      Description
                                    </Label>
                                    <Input
                                      id="section_description"
                                      value={sectionFormData.description}
                                      onChange={(e) =>
                                        setSectionFormData({
                                          ...sectionFormData,
                                          description: e.target.value,
                                        })
                                      }
                                      placeholder="Check engine components and performance"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="is_collapsible"
                                      checked={sectionFormData.is_collapsible}
                                      onCheckedChange={(checked) =>
                                        setSectionFormData({
                                          ...sectionFormData,
                                          is_collapsible: checked === true,
                                        })
                                      }
                                    />
                                    <Label htmlFor="is_collapsible">
                                      Collapsible section
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="is_expanded"
                                      checked={
                                        sectionFormData.is_expanded_by_default
                                      }
                                      onCheckedChange={(checked) =>
                                        setSectionFormData({
                                          ...sectionFormData,
                                          is_expanded_by_default:
                                            checked === true,
                                        })
                                      }
                                    />
                                    <Label htmlFor="is_expanded">
                                      Expanded by default
                                    </Label>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        setIsSectionDialogOpen(false)
                                      }
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={addSectionMutation.isPending}
                                    >
                                      {addSectionMutation.isPending
                                        ? "Adding..."
                                        : "Add Section"}
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>

                          {category.sections?.map((section: any) => (
                            <div
                              key={section.section_id}
                              className="border rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <h5 className="font-medium">
                                    {section.section_name}
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    {section.description}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">
                                    {section.fields?.length || 0} fields
                                  </Badge>
                                  <Dialog
                                    open={isFieldDialogOpen}
                                    onOpenChange={setIsFieldDialogOpen}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          setSelectedSection(section)
                                        }
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>
                                          Add Field to {section.section_name}
                                        </DialogTitle>
                                        <DialogDescription>
                                          Create a new field within this section
                                        </DialogDescription>
                                      </DialogHeader>
                                      <form
                                        onSubmit={handleAddField}
                                        className="space-y-4"
                                      >
                                        <div>
                                          <Label htmlFor="field_name">
                                            Field Name
                                          </Label>
                                          <Input
                                            id="field_name"
                                            value={fieldFormData.field_name}
                                            onChange={(e) =>
                                              setFieldFormData({
                                                ...fieldFormData,
                                                field_name: e.target.value,
                                              })
                                            }
                                            placeholder="Oil Level"
                                            required
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="field_type">
                                            Field Type
                                          </Label>
                                          <Select
                                            value={fieldFormData.field_type}
                                            onValueChange={(value) =>
                                              setFieldFormData({
                                                ...fieldFormData,
                                                field_type: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {fieldTypes.map((type) => (
                                                <SelectItem
                                                  key={type.value}
                                                  value={type.value}
                                                >
                                                  {type.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Dropdown Configuration */}
                                        {fieldFormData.field_type ===
                                          "dropdown" && (
                                          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                            <h4 className="font-medium">
                                              Dropdown Configuration
                                            </h4>
                                            <div>
                                              <Label htmlFor="dropdown_name">
                                                Select Dropdown
                                              </Label>
                                              <Select
                                                value={
                                                  fieldFormData.dropdown_config
                                                    .dropdown_name
                                                }
                                                onValueChange={(value) =>
                                                  setFieldFormData({
                                                    ...fieldFormData,
                                                    dropdown_config: {
                                                      ...fieldFormData.dropdown_config,
                                                      dropdown_name: value,
                                                    },
                                                  })
                                                }
                                              >
                                                <SelectTrigger>
                                                  <SelectValue placeholder="Choose a dropdown" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {dropdowns?.map(
                                                    (dropdown: any) => (
                                                      <SelectItem
                                                        key={dropdown._id}
                                                        value={
                                                          dropdown.dropdown_name
                                                        }
                                                      >
                                                        {dropdown.display_name}{" "}
                                                        (
                                                        {dropdown.dropdown_name}
                                                        )
                                                      </SelectItem>
                                                    )
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox
                                                id="allow_multiple_dropdown"
                                                checked={
                                                  fieldFormData.dropdown_config
                                                    .allow_multiple
                                                }
                                                onCheckedChange={(checked) =>
                                                  setFieldFormData({
                                                    ...fieldFormData,
                                                    dropdown_config: {
                                                      ...fieldFormData.dropdown_config,
                                                      allow_multiple:
                                                        checked === true,
                                                    },
                                                  })
                                                }
                                              />
                                              <Label htmlFor="allow_multiple_dropdown">
                                                Allow multiple selections
                                              </Label>
                                            </div>
                                          </div>
                                        )}

                                        <div>
                                          <Label htmlFor="placeholder">
                                            Placeholder Text
                                          </Label>
                                          <Input
                                            id="placeholder"
                                            value={fieldFormData.placeholder}
                                            onChange={(e) =>
                                              setFieldFormData({
                                                ...fieldFormData,
                                                placeholder: e.target.value,
                                              })
                                            }
                                            placeholder="Enter oil level status"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="help_text">
                                            Help Text
                                          </Label>
                                          <Input
                                            id="help_text"
                                            value={fieldFormData.help_text}
                                            onChange={(e) =>
                                              setFieldFormData({
                                                ...fieldFormData,
                                                help_text: e.target.value,
                                              })
                                            }
                                            placeholder="Check dipstick for oil level"
                                          />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id="is_required"
                                            checked={fieldFormData.is_required}
                                            onCheckedChange={(checked) =>
                                              setFieldFormData({
                                                ...fieldFormData,
                                                is_required: checked === true,
                                              })
                                            }
                                          />
                                          <Label htmlFor="is_required">
                                            Required field
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            id="has_image"
                                            checked={fieldFormData.has_image}
                                            onCheckedChange={(checked) =>
                                              setFieldFormData({
                                                ...fieldFormData,
                                                has_image: checked === true,
                                              })
                                            }
                                          />
                                          <Label htmlFor="has_image">
                                            Include image capture
                                          </Label>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                              setIsFieldDialogOpen(false)
                                            }
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            type="submit"
                                            disabled={
                                              addFieldMutation.isPending
                                            }
                                          >
                                            {addFieldMutation.isPending
                                              ? "Adding..."
                                              : "Add Field"}
                                          </Button>
                                        </div>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Fields List */}
                              {section.fields?.length > 0 && (
                                <div className="space-y-2 mt-4">
                                  {section.fields.map(
                                    (field: any, index: number) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">
                                            {field.field_name}
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {field.field_type}
                                          </Badge>
                                          {field.is_required && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Required
                                            </Badge>
                                          )}
                                          {field.has_image && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Image
                                            </Badge>
                                          )}
                                          {field.field_type === "dropdown" &&
                                            field.dropdown_config
                                              ?.dropdown_name && (
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                {
                                                  field.dropdown_config
                                                    .dropdown_name
                                                }
                                              </Badge>
                                            )}
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => handleEditField(field)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            onClick={() => handleDeleteField(field)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Configuration Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Configuration</DialogTitle>
              <DialogDescription>
                Update configuration details and status
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateConfig} className="space-y-4">
              <div>
                <Label htmlFor="edit_config_name">Configuration Name</Label>
                <Input
                  id="edit_config_name"
                  value={editFormData.config_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      config_name: e.target.value,
                    })
                  }
                  placeholder="Configuration name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Configuration description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_active"
                  checked={editFormData.is_active}
                  onCheckedChange={(checked) =>
                    setEditFormData({
                      ...editFormData,
                      is_active: checked === true,
                    })
                  }
                />
                <Label htmlFor="edit_is_active">Active configuration</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateConfigMutation.isPending}>
                  {updateConfigMutation.isPending
                    ? "Updating..."
                    : "Update Configuration"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <ConfigPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          configData={selectedConfigDetails}
        />

        <FieldEditDialog
          isOpen={isFieldEditDialogOpen}
          onClose={() => {
            setIsFieldEditDialogOpen(false);
            setFieldToEdit(null);
          }}
          configId={selectedConfig?._id || ""}
          field={fieldToEdit}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setConfigToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete Configuration"
          description={`Are you sure you want to delete "${configToDelete?.config_name}"? This action cannot be undone.`}
          isLoading={deleteConfigMutation.isPending}
        />

        <DeleteConfirmationDialog
          isOpen={isFieldDeleteDialogOpen}
          onClose={() => {
            setIsFieldDeleteDialogOpen(false);
            setFieldToDelete(null);
          }}
          onConfirm={confirmFieldDelete}
          title="Delete Field"
          description={`Are you sure you want to delete "${fieldToDelete?.field_name}"? This action cannot be undone.`}
          isLoading={deleteFieldMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default InspectionConfig;
