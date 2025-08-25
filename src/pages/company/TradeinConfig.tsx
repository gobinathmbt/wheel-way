import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  Eye,
  Save,
  Search,
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { configServices, dropdownServices } from "@/api/services";
import DraggableTradeinSectionsList from "@/components/tradein/DraggableTradeinSectionsList";
import { TradeinPreviewModal } from "@/components/tradein/TradeinPreviewModal";
import ConfigurationSearch from "@/components/inspection/ConfigurationSearch";
import ConfigurationList from "@/components/inspection/ConfigurationList";

const TradeinConfig = () => {
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isEditConfigDialogOpen, setIsEditConfigDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [editingField, setEditingField] = useState<any>(null);

  // Search and pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [configFormData, setConfigFormData] = useState({
    config_name: "",
    description: "",
    is_active: false,
  });

  const [editConfigFormData, setEditConfigFormData] = useState({
    config_name: "",
    description: "",
    is_active: false,
  });

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    refetch();
  };
  
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
    refetch();
  };

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

  const queryClient = useQueryClient();

  const {
    data: configsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tradein-configs", currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await configServices.getTradeinConfigs({
        page: currentPage,
        limit: 6,
        search: searchTerm,
        status: statusFilter,
      });
      return response.data;
    },
  });

  const { data: configDetails } = useQuery({
    queryKey: ["tradein-config-details", selectedConfig?._id],
    queryFn: async () => {
      if (!selectedConfig?._id) return null;
      const response = await configServices.getTradeinConfigDetails(
        selectedConfig._id
      );
      return response.data.data;
    },
    enabled: !!selectedConfig?._id,
  });

  // Fetch available dropdowns
  const { data: dropdowns } = useQuery({
    queryKey: ["dropdowns-for-config"],
    queryFn: async () => {
      const response = await dropdownServices.getDropdowns();
      return response.data.data;
    },
  });

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

  const deleteConfigMutation = useMutation({
    mutationFn: async ({ configId }: { configId: string }) => {
      return await configServices.deleteTradeinConfig(configId);
    },
    onSuccess: (_, { configId }) => {
      toast.success("Configuration deleted successfully");
      if (selectedConfig?._id === configId) {
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

  const confirmDeleteConfig = () => {
    if (configToDelete) {
      deleteConfigMutation.mutate({ configId: configToDelete._id });
      setIsDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configServices.createTradeinConfig(configFormData);
      toast.success("Trade-in configuration created successfully");
      setIsConfigDialogOpen(false);
      setConfigFormData({
        config_name: "",
        description: "",
        is_active: false,
      });
      refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create configuration"
      );
    }
  };

  const handleEditConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(selectedConfig);
    try {
      await configServices.updateTradeinConfig(
        selectedConfig._id,
        editConfigFormData
      );
      toast.success("Configuration updated successfully");
      setIsEditConfigDialogOpen(false);
      refetch();
      // Update selected config data
      setSelectedConfig({ ...selectedConfig, ...editConfigFormData });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update configuration"
      );
      console.log(error);
    }
  };

  const handleDeleteConfig = async (configId: any) => {
    try {
      await configServices.deleteTradeinConfig(configId._id);
      toast.success("Configuration deleted successfully");
      if (selectedConfig?._id === configId) {
        setSelectedConfig(null);
      }
      setIsDeleteDialogOpen(false);
      setConfigToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to delete configuration"
      );
    }
  };

  const openDeleteDialog = (config: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfigToDelete(config);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configServices.addTradeinSection(
        selectedConfig._id,
        sectionFormData
      );
      toast.success("Section added successfully");
      setIsSectionDialogOpen(false);
      setSectionFormData({
        section_name: "",
        description: "",
        is_collapsible: true,
        is_expanded_by_default: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["tradein-config-details", selectedConfig._id],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add section");
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configServices.addTradeinField(
        selectedConfig._id,
        selectedSection.section_id,
        fieldFormData
      );
      toast.success("Field added successfully");
      setIsFieldDialogOpen(false);
      resetFieldForm();
      queryClient.invalidateQueries({
        queryKey: ["tradein-config-details", selectedConfig._id],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add field");
    }
  };

  const handleEditField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await configServices.updateTradeinField(
        selectedConfig._id,
        editingField.field_id,
        fieldFormData
      );
      toast.success("Field updated successfully");
      setIsFieldDialogOpen(false);
      setEditingField(null);
      queryClient.invalidateQueries({
        queryKey: ["tradein-config-details", selectedConfig._id],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update field");
    }
  };

  const handleDeleteField = async (fieldId: string, sectionId: string) => {
    try {
      await configServices.deleteTradeinField(selectedConfig._id, fieldId);
      toast.success("Field deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["tradein-config-details", selectedConfig._id],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete field");
    }
  };

  const resetFieldForm = () => {
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
  };

  const openEditFieldDialog = (field: any, section: any) => {
    console.log("Field data from server:", field);
    let dropdownName = "";
    if (field.dropdown_config?.dropdown_id && dropdowns) {
      const dropdown = dropdowns.find(
        (d) => d._id === field.dropdown_config.dropdown_id
      );
      dropdownName = dropdown?.dropdown_name || "";
    }
    setEditingField(field);
    setSelectedSection(section);
    setFieldFormData({
      field_name: field.field_name,
      field_type: field.field_type,
      is_required: field.is_required,
      has_image: field.has_image,
      placeholder: field.placeholder || "",
      help_text: field.help_text || "",
      dropdown_config: {
        dropdown_name: dropdownName || "",
        allow_multiple: field.dropdown_config?.allow_multiple || false,
      },
    });
    setIsFieldDialogOpen(true);
  };

  const openEditConfigDialog = (config: any) => {
    setEditConfigFormData({
      config_name: config.config_name,
      description: config.description,
      is_active: config.is_active,
    });
    setIsEditConfigDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    try {
      await configServices.saveTradeinConfig(selectedConfig._id, configDetails);
      toast.success("Configuration saved successfully");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save configuration"
      );
    }
  };

  const totalPages = Math.ceil((configsData?.pagination?.total_items || 0) / 6);

  return (
    <DashboardLayout title="Trade-in Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Trade-in Configuration
            </h2>
            <p className="text-muted-foreground">
              Configure dynamic forms for vehicle trade-in evaluations
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Trade-in Configuration</DialogTitle>
                <DialogDescription>
                  Create a new configuration template for vehicle trade-in
                  evaluations
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateConfig} className="space-y-6">
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
                    placeholder="Standard Trade-in v1.0"
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
                    placeholder="Standard vehicle trade-in evaluation configuration"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={configFormData.is_active}
                    onCheckedChange={(checked) =>
                      setConfigFormData({
                        ...configFormData,
                        is_active: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="is_active">
                    Make this configuration active
                  </Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfigDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Configuration</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <ConfigurationSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onFilterChange={handleFilterChange}
          onSearch={handleClearSearch}
          isLoading={isLoading}
        />

        <Card>
          <CardHeader>
            <CardTitle>Configurations</CardTitle>
            <CardDescription>
              Select a configuration to edit or manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConfigurationList
              configs={configsData?.data || []}
              selectedConfig={selectedConfig}
              onSelectConfig={setSelectedConfig}
              onEditConfig={(config) => {
                setSelectedConfig(config);
                setConfigFormData({
                  config_name: config.config_name,
                  description: config.description,
                  is_active: config.is_active,
                });
              }}
              onDeleteConfig={handleDeleteConfig}
              pagination={configsData?.pagination}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Configuration Editor */}
        {selectedConfig && configDetails && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    Edit Configuration: {selectedConfig.config_name}
                  </CardTitle>
                  <CardDescription>
                    Configure sections and fields for trade-in evaluation
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Dialog
                    open={isSectionDialogOpen}
                    onOpenChange={setIsSectionDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Evaluation Section</DialogTitle>
                        <DialogDescription>
                          Create a new section for the trade-in evaluation form
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddSection} className="space-y-4">
                        <div>
                          <Label htmlFor="section_name">Section Name</Label>
                          <Input
                            id="section_name"
                            value={sectionFormData.section_name}
                            onChange={(e) =>
                              setSectionFormData({
                                ...sectionFormData,
                                section_name: e.target.value,
                              })
                            }
                            placeholder="Vehicle Condition"
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
                            placeholder="Assess overall vehicle condition"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="is_collapsible"
                            checked={sectionFormData.is_collapsible}
                            onCheckedChange={(checked) =>
                              setSectionFormData({
                                ...sectionFormData,
                                is_collapsible: checked as boolean,
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
                            checked={sectionFormData.is_expanded_by_default}
                            onCheckedChange={(checked) =>
                              setSectionFormData({
                                ...sectionFormData,
                                is_expanded_by_default: checked as boolean,
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
                            onClick={() => setIsSectionDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Add Section</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    onClick={() => setIsPreviewOpen(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={handleSaveChanges}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {configDetails.sections?.length > 0 ? (
                <DraggableTradeinSectionsList
                  sections={configDetails.sections.sort(
                    (a: any, b: any) =>
                      (a.display_order || 0) - (b.display_order || 0)
                  )}
                  selectedConfig={selectedConfig}
                  onAddField={(section) => {
                    setSelectedSection(section);
                    setEditingField(null);
                    resetFieldForm();
                    setIsFieldDialogOpen(true);
                  }}
                  onEditField={openEditFieldDialog}
                  onDeleteField={handleDeleteField}
                  dropdowns={dropdowns}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No sections configured yet. Add your first section to get
                    started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Configuration Dialog */}
        <Dialog
          open={isEditConfigDialogOpen}
          onOpenChange={setIsEditConfigDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Configuration</DialogTitle>
              <DialogDescription>
                Update the configuration details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditConfig} className="space-y-4">
              <div>
                <Label htmlFor="edit_config_name">Configuration Name</Label>
                <Input
                  id="edit_config_name"
                  value={editConfigFormData.config_name}
                  onChange={(e) =>
                    setEditConfigFormData({
                      ...editConfigFormData,
                      config_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_description">Description</Label>
                <Input
                  id="edit_description"
                  value={editConfigFormData.description}
                  onChange={(e) =>
                    setEditConfigFormData({
                      ...editConfigFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_is_active"
                  checked={editConfigFormData.is_active}
                  onCheckedChange={(checked) =>
                    setEditConfigFormData({
                      ...editConfigFormData,
                      is_active: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="edit_is_active">Active Configuration</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditConfigDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Field Dialog */}
        <Dialog
          open={isFieldDialogOpen}
          onOpenChange={(open) => {
            setIsFieldDialogOpen(open);
            if (!open) {
              setEditingField(null);
              resetFieldForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingField
                  ? "Edit Field"
                  : `Add Field to ${selectedSection?.section_name}`}
              </DialogTitle>
              <DialogDescription>
                {editingField
                  ? "Update the field details"
                  : "Create a new field within this section"}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editingField ? handleEditField : handleAddField}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="field_name">Field Name</Label>
                <Input
                  id="field_name"
                  value={fieldFormData.field_name}
                  onChange={(e) =>
                    setFieldFormData({
                      ...fieldFormData,
                      field_name: e.target.value,
                    })
                  }
                  placeholder="Overall Condition"
                  required
                />
              </div>
              <div>
                <Label htmlFor="field_type">Field Type</Label>
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
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dropdown Configuration */}
              {fieldFormData.field_type === "dropdown" && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium">Dropdown Configuration</h4>
                  <div>
                    <Label htmlFor="dropdown_name">Select Dropdown</Label>
                    <Select
                      value={fieldFormData.dropdown_config.dropdown_name}
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
                        {dropdowns?.map((dropdown: any) => (
                          <SelectItem
                            key={dropdown._id}
                            value={dropdown.dropdown_name}
                          >
                            {dropdown.display_name} ({dropdown.dropdown_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allow_multiple"
                      checked={fieldFormData.dropdown_config.allow_multiple}
                      onCheckedChange={(checked) =>
                        setFieldFormData({
                          ...fieldFormData,
                          dropdown_config: {
                            ...fieldFormData.dropdown_config,
                            allow_multiple: checked as boolean,
                          },
                        })
                      }
                    />
                    <Label htmlFor="allow_multiple">
                      Allow multiple selection
                    </Label>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="placeholder">Placeholder Text</Label>
                <Input
                  id="placeholder"
                  value={fieldFormData.placeholder}
                  onChange={(e) =>
                    setFieldFormData({
                      ...fieldFormData,
                      placeholder: e.target.value,
                    })
                  }
                  placeholder="Select condition"
                />
              </div>
              <div>
                <Label htmlFor="help_text">Help Text</Label>
                <Input
                  id="help_text"
                  value={fieldFormData.help_text}
                  onChange={(e) =>
                    setFieldFormData({
                      ...fieldFormData,
                      help_text: e.target.value,
                    })
                  }
                  placeholder="Rate the overall condition of the vehicle"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_required"
                  checked={fieldFormData.is_required}
                  onCheckedChange={(checked) =>
                    setFieldFormData({
                      ...fieldFormData,
                      is_required: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="is_required">Required field</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_image"
                  checked={fieldFormData.has_image}
                  onCheckedChange={(checked) =>
                    setFieldFormData({
                      ...fieldFormData,
                      has_image: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="has_image">Include image capture</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFieldDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingField ? "Update Field" : "Add Field"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <TradeinPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          config={configDetails}
          dropdowns={dropdowns}
        />

        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setConfigToDelete(null);
          }}
          onConfirm={confirmDeleteConfig}
          title="Delete Configuration"
          description={`Are you sure you want to delete "${configToDelete?.config_name}"? This action cannot be undone.`}
          isLoading={deleteConfigMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
};

export default TradeinConfig;
