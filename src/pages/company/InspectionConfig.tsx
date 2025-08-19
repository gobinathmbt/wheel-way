
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings, Trash2, GripVertical, Eye, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';

const InspectionConfig = () => {
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const [configFormData, setConfigFormData] = useState({
    config_name: '',
    description: '',
    is_default: false
  });

  const [sectionFormData, setSectionFormData] = useState({
    section_name: '',
    description: '',
    is_collapsible: true,
    is_expanded_by_default: false
  });

  const [fieldFormData, setFieldFormData] = useState({
    field_name: '',
    field_type: 'text',
    is_required: false,
    has_image: false,
    placeholder: '',
    help_text: '',
    dropdown_config: {
      dropdown_name: '',
      allow_multiple: false
    }
  });

  // ... keep existing code (queries)
  const { data: configs, isLoading, refetch } = useQuery({
    queryKey: ['inspection-configs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/config/inspection');
      return response.data.data;
    }
  });

  const { data: dropdowns } = useQuery({
    queryKey: ['dropdowns-for-config'],
    queryFn: async () => {
      const response = await apiClient.get('/api/dropdown');
      return response.data.data;
    }
  });

  const { data: masterCategories } = useQuery({
    queryKey: ['master-categories'],
    queryFn: async () => {
      const response = await apiClient.get('/api/dropdown/master_inspection');
      return response.data.data;
    }
  });

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/config/inspection', configFormData);
      toast.success('Inspection configuration created successfully');
      setIsConfigDialogOpen(false);
      setConfigFormData({ config_name: '', description: '', is_default: false });
      refetch();
    } catch (error) {
      toast.error('Failed to create configuration');
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/config/inspection/${selectedConfig._id}/categories/${selectedCategory}/sections`, sectionFormData);
      toast.success('Section added successfully');
      setIsSectionDialogOpen(false);
      setSectionFormData({
        section_name: '',
        description: '',
        is_collapsible: true,
        is_expanded_by_default: false
      });
      refetch();
    } catch (error) {
      toast.error('Failed to add section');
    }
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    try {
      console.log('Adding field to section:', selectedSection);
      console.log('Selected section section_id:', selectedSection.section_id);
      
      // Prepare field data
      const fieldData = {
        field_name: fieldFormData.field_name,
        field_type: fieldFormData.field_type,
        is_required: fieldFormData.is_required,
        has_image: fieldFormData.has_image,
        placeholder: fieldFormData.placeholder,
        help_text: fieldFormData.help_text,
        dropdown_config: fieldFormData.field_type === 'dropdown' ? fieldFormData.dropdown_config : undefined
      };

      // Add dropdown config if field type is dropdown
      if (fieldFormData.field_type === 'dropdown') {
        fieldData.dropdown_config = {
          dropdown_name: fieldFormData.dropdown_config.dropdown_name,
          allow_multiple: fieldFormData.dropdown_config.allow_multiple
        };
      }
      
      // Use section_id instead of _id for the API call
      await apiClient.post(`/api/config/inspection/${selectedConfig._id}/sections/${selectedSection.section_id}/fields`, fieldData);
      toast.success('Field added successfully');
      setIsFieldDialogOpen(false);
      setFieldFormData({
        field_name: '',
        field_type: 'text',
        is_required: false,
        has_image: false,
        placeholder: '',
        help_text: '',
        dropdown_config: {
          dropdown_name: '',
          allow_multiple: false
        }
      });
      refetch();
    } catch (error) {
      console.error('Failed to add field:', error);
      toast.error(error.response?.data?.message || 'Failed to add field');
    }
  };

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'currency', label: 'Currency' },
    { value: 'video', label: 'Video' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'image', label: 'Image' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Yes/No' }
  ];

  return (
    <DashboardLayout title="Inspection Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inspection Configuration</h2>
            <p className="text-muted-foreground">Configure dynamic forms for mobile inspections</p>
          </div>
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
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
                    onChange={(e) => setConfigFormData({ ...configFormData, config_name: e.target.value })}
                    placeholder="Standard Inspection v1.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={configFormData.description}
                    onChange={(e) => setConfigFormData({ ...configFormData, description: e.target.value })}
                    placeholder="Standard vehicle inspection configuration"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default"
                    checked={configFormData.is_default}
                    onCheckedChange={(checked) => setConfigFormData({ ...configFormData, is_default: checked === true })}
                  />
                  <Label htmlFor="is_default">Make this the default configuration</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Configuration</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Configuration Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Configuration</CardTitle>
            <CardDescription>Choose a configuration to edit or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {configs?.map((config) => (
                <div
                  key={config._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedConfig?._id === config._id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedConfig(config)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{config.config_name}</h3>
                    {config.is_default && <Badge>Default</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>v{config.version}</span>
                    <span>•</span>
                    <span>{config.categories?.length || 0} categories</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Editor */}
        {selectedConfig && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Edit Configuration: {selectedConfig.config_name}</CardTitle>
                  <CardDescription>Configure categories, sections, and fields for this inspection</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-4">
                {selectedConfig.categories?.map((category) => (
                  <AccordionItem key={category.category_id} value={category.category_id}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div>
                          <h3 className="font-semibold">{category.category_name}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <Badge variant="outline">{category.sections?.length || 0} sections</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pl-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Sections</h4>
                          <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedCategory(category.category_id)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Section
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Section to {category.category_name}</DialogTitle>
                                <DialogDescription>
                                  Create a new section within this category
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleAddSection} className="space-y-4">
                                <div>
                                  <Label htmlFor="section_name">Section Name</Label>
                                  <Input
                                    id="section_name"
                                    value={sectionFormData.section_name}
                                    onChange={(e) => setSectionFormData({ ...sectionFormData, section_name: e.target.value })}
                                    placeholder="Engine Inspection"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="section_description">Description</Label>
                                  <Input
                                    id="section_description"
                                    value={sectionFormData.description}
                                    onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                                    placeholder="Check engine components and performance"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="is_collapsible"
                                    checked={sectionFormData.is_collapsible}
                                    onCheckedChange={(checked) => setSectionFormData({ ...sectionFormData, is_collapsible: checked === true })}
                                  />
                                  <Label htmlFor="is_collapsible">Collapsible section</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="is_expanded"
                                    checked={sectionFormData.is_expanded_by_default}
                                    onCheckedChange={(checked) => setSectionFormData({ ...sectionFormData, is_expanded_by_default: checked === true })}
                                  />
                                  <Label htmlFor="is_expanded">Expanded by default</Label>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button type="button" variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit">Add Section</Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>

                        {category.sections?.map((section) => (
                          <div key={section.section_id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <h5 className="font-medium">{section.section_name}</h5>
                                <p className="text-sm text-muted-foreground">{section.description}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">{section.fields?.length || 0} fields</Badge>
                                <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        console.log('Setting selected section:', section);
                                        setSelectedSection(section);
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Add Field to {section.section_name}</DialogTitle>
                                      <DialogDescription>
                                        Create a new field within this section
                                      </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddField} className="space-y-4">
                                      <div>
                                        <Label htmlFor="field_name">Field Name</Label>
                                        <Input
                                          id="field_name"
                                          value={fieldFormData.field_name}
                                          onChange={(e) => setFieldFormData({ ...fieldFormData, field_name: e.target.value })}
                                          placeholder="Oil Level"
                                          required
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="field_type">Field Type</Label>
                                        <Select 
                                          value={fieldFormData.field_type} 
                                          onValueChange={(value) => setFieldFormData({ ...fieldFormData, field_type: value })}
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

                                      {/* Dropdown Configuration - Show only when field type is dropdown */}
                                      {fieldFormData.field_type === 'dropdown' && (
                                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                          <h4 className="font-medium">Dropdown Configuration</h4>
                                          <div>
                                            <Label htmlFor="dropdown_name">Select Dropdown</Label>
                                            <Select 
                                              value={fieldFormData.dropdown_config.dropdown_name} 
                                              onValueChange={(value) => setFieldFormData({ 
                                                ...fieldFormData, 
                                                dropdown_config: { 
                                                  ...fieldFormData.dropdown_config, 
                                                  dropdown_name: value 
                                                } 
                                              })}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder="Choose a dropdown" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {dropdowns?.map((dropdown) => (
                                                  <SelectItem key={dropdown._id} value={dropdown.dropdown_name}>
                                                    {dropdown.display_name} ({dropdown.dropdown_name})
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Checkbox
                                              id="allow_multiple_dropdown"
                                              checked={fieldFormData.dropdown_config.allow_multiple}
                                              onCheckedChange={(checked) => setFieldFormData({ 
                                                ...fieldFormData, 
                                                dropdown_config: { 
                                                  ...fieldFormData.dropdown_config, 
                                                  allow_multiple: checked === true 
                                                } 
                                              })}
                                            />
                                            <Label htmlFor="allow_multiple_dropdown">Allow multiple selections</Label>
                                          </div>
                                        </div>
                                      )}

                                      <div>
                                        <Label htmlFor="placeholder">Placeholder Text</Label>
                                        <Input
                                          id="placeholder"
                                          value={fieldFormData.placeholder}
                                          onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                                          placeholder="Enter oil level status"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="help_text">Help Text</Label>
                                        <Input
                                          id="help_text"
                                          value={fieldFormData.help_text}
                                          onChange={(e) => setFieldFormData({ ...fieldFormData, help_text: e.target.value })}
                                          placeholder="Check dipstick for oil level"
                                        />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="is_required"
                                          checked={fieldFormData.is_required}
                                          onCheckedChange={(checked) => setFieldFormData({ ...fieldFormData, is_required: checked === true })}
                                        />
                                        <Label htmlFor="is_required">Required field</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="has_image"
                                          checked={fieldFormData.has_image}
                                          onCheckedChange={(checked) => setFieldFormData({ ...fieldFormData, has_image: checked === true })}
                                        />
                                        <Label htmlFor="has_image">Include image capture</Label>
                                      </div>
                                      <div className="flex justify-end space-x-2">
                                        <Button type="button" variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                                          Cancel
                                        </Button>
                                        <Button type="submit">Add Field</Button>
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
                                {section.fields.map((field, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                    <div className="flex items-center space-x-2">
                                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{field.field_name}</span>
                                      <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                                      {field.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
                                      {field.has_image && <Badge variant="outline" className="text-xs">Image</Badge>}
                                      {field.field_type === 'dropdown' && field.dropdown_config?.dropdown_name && (
                                        <Badge variant="outline" className="text-xs">
                                          {field.dropdown_config.dropdown_name}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button size="sm" variant="ghost">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InspectionConfig;
