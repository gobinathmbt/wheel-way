
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
import { Plus, Settings, Trash2, GripVertical, Eye, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';

const TradeinConfig = () => {
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  const [configFormData, setConfigFormData] = useState({
    config_name: '',
    description: '',
    is_default: false,
    use_market_data: true,
    depreciation_model: 'linear'
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
    help_text: ''
  });

  const { data: configs, isLoading, refetch } = useQuery({
    queryKey: ['tradein-configs'],
    queryFn: async () => {
      const response = await apiClient.get('/api/config/tradein');
      return response.data.data;
    }
  });

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

  const depreciationModels = [
    { value: 'linear', label: 'Linear Depreciation' },
    { value: 'exponential', label: 'Exponential Depreciation' },
    { value: 'custom', label: 'Custom Model' }
  ];

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/config/tradein', configFormData);
      toast.success('Trade-in configuration created successfully');
      setIsConfigDialogOpen(false);
      setConfigFormData({
        config_name: '',
        description: '',
        is_default: false,
        use_market_data: true,
        depreciation_model: 'linear'
      });
      refetch();
    } catch (error) {
      toast.error('Failed to create configuration');
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/api/config/tradein/${selectedConfig._id}/sections`, sectionFormData);
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
      await apiClient.post(`/api/config/tradein/${selectedConfig._id}/sections/${selectedSection._id}/fields`, fieldFormData);
      toast.success('Field added successfully');
      setIsFieldDialogOpen(false);
      setFieldFormData({
        field_name: '',
        field_type: 'text',
        is_required: false,
        has_image: false,
        placeholder: '',
        help_text: ''
      });
      refetch();
    } catch (error) {
      toast.error('Failed to add field');
    }
  };

  return (
    <DashboardLayout title="Trade-in Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Trade-in Configuration</h2>
            <p className="text-muted-foreground">Configure dynamic forms for vehicle trade-in evaluations</p>
          </div>
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
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
                  Create a new configuration template for vehicle trade-in evaluations
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateConfig} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="config_name">Configuration Name</Label>
                    <Input
                      id="config_name"
                      value={configFormData.config_name}
                      onChange={(e) => setConfigFormData({ ...configFormData, config_name: e.target.value })}
                      placeholder="Standard Trade-in v1.0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="depreciation_model">Depreciation Model</Label>
                    <Select 
                      value={configFormData.depreciation_model} 
                      onValueChange={(value) => setConfigFormData({ ...configFormData, depreciation_model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {depreciationModels.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={configFormData.description}
                    onChange={(e) => setConfigFormData({ ...configFormData, description: e.target.value })}
                    placeholder="Standard vehicle trade-in evaluation configuration"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use_market_data"
                      checked={configFormData.use_market_data}
                      onCheckedChange={(checked) => setConfigFormData({ ...configFormData, use_market_data: checked })}
                    />
                    <Label htmlFor="use_market_data">Use market data for valuation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_default"
                      checked={configFormData.is_default}
                      onCheckedChange={(checked) => setConfigFormData({ ...configFormData, is_default: checked })}
                    />
                    <Label htmlFor="is_default">Make this the default configuration</Label>
                  </div>
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
                    <div className="flex gap-1">
                      {config.is_default && <Badge>Default</Badge>}
                      {config.valuation_settings?.use_market_data && (
                        <Badge variant="outline" className="text-xs">
                          <DollarSign className="w-3 h-3 mr-1" />
                          Market
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{config.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>v{config.version}</span>
                    <span>•</span>
                    <span>{config.sections?.length || 0} sections</span>
                    <span>•</span>
                    <span>{config.valuation_settings?.depreciation_model}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Editor */}
        {selectedConfig && (
          <div className="space-y-6">
            {/* Valuation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Valuation Settings
                </CardTitle>
                <CardDescription>Configure how trade-in values are calculated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Excellent Condition</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {selectedConfig.valuation_settings?.condition_multipliers?.excellent || 1.0}x
                      </span>
                      <span className="text-sm text-muted-foreground">multiplier</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Good Condition</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {selectedConfig.valuation_settings?.condition_multipliers?.good || 0.9}x
                      </span>
                      <span className="text-sm text-muted-foreground">multiplier</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Fair Condition</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {selectedConfig.valuation_settings?.condition_multipliers?.fair || 0.8}x
                      </span>
                      <span className="text-sm text-muted-foreground">multiplier</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Poor Condition</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">
                        {selectedConfig.valuation_settings?.condition_multipliers?.poor || 0.6}x
                      </span>
                      <span className="text-sm text-muted-foreground">multiplier</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Mileage Threshold</Label>
                      <p className="text-lg font-semibold">
                        {selectedConfig.valuation_settings?.mileage_adjustment?.threshold?.toLocaleString() || '15,000'} miles/year
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Excess Mileage Penalty</Label>
                      <p className="text-lg font-semibold">
                        ${selectedConfig.valuation_settings?.mileage_adjustment?.penalty_per_mile || '0.10'} per mile
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sections Configuration */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Evaluation Sections: {selectedConfig.config_name}</CardTitle>
                    <CardDescription>Configure sections and fields for trade-in evaluation</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
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
                              onChange={(e) => setSectionFormData({ ...sectionFormData, section_name: e.target.value })}
                              placeholder="Vehicle Condition"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="section_description">Description</Label>
                            <Input
                              id="section_description"
                              value={sectionFormData.description}
                              onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                              placeholder="Assess overall vehicle condition"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is_collapsible"
                              checked={sectionFormData.is_collapsible}
                              onCheckedChange={(checked) => setSectionFormData({ ...sectionFormData, is_collapsible: checked })}
                            />
                            <Label htmlFor="is_collapsible">Collapsible section</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="is_expanded"
                              checked={sectionFormData.is_expanded_by_default}
                              onCheckedChange={(checked) => setSectionFormData({ ...sectionFormData, is_expanded_by_default: checked })}
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
                  {selectedConfig.sections?.map((section) => (
                    <AccordionItem key={section.section_id} value={section.section_id}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div>
                            <h3 className="font-semibold">{section.section_name}</h3>
                            <p className="text-sm text-muted-foreground">{section.description}</p>
                          </div>
                          <Badge variant="outline">{section.fields?.length || 0} fields</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pl-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Fields</h4>
                            <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedSection(section)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Field
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
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
                                      placeholder="Overall Condition"
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
                                  <div>
                                    <Label htmlFor="placeholder">Placeholder Text</Label>
                                    <Input
                                      id="placeholder"
                                      value={fieldFormData.placeholder}
                                      onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                                      placeholder="Select condition"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="help_text">Help Text</Label>
                                    <Input
                                      id="help_text"
                                      value={fieldFormData.help_text}
                                      onChange={(e) => setFieldFormData({ ...fieldFormData, help_text: e.target.value })}
                                      placeholder="Rate the overall condition of the vehicle"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="is_required"
                                      checked={fieldFormData.is_required}
                                      onCheckedChange={(checked) => setFieldFormData({ ...fieldFormData, is_required: checked })}
                                    />
                                    <Label htmlFor="is_required">Required field</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="has_image"
                                      checked={fieldFormData.has_image}
                                      onCheckedChange={(checked) => setFieldFormData({ ...fieldFormData, has_image: checked })}
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
                          </div>

                          {/* Fields List */}
                          {section.fields?.length > 0 && (
                            <div className="space-y-2">
                              {section.fields.map((field, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <span className="font-medium">{field.field_name}</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
                                        {field.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
                                        {field.has_image && <Badge variant="outline" className="text-xs">Image</Badge>}
                                      </div>
                                    </div>
                                  </div>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TradeinConfig;
