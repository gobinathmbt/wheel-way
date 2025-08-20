
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Camera, Calendar, DollarSign, FileVideo, Hash, Type, ToggleLeft } from 'lucide-react';

interface ConfigPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  configData: any;
}

const ConfigPreviewModal: React.FC<ConfigPreviewModalProps> = ({
  isOpen,
  onClose,
  configData
}) => {
  const [formData, setFormData] = useState<any>({});

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text': return <Type className="h-4 w-4" />;
      case 'number': return <Hash className="h-4 w-4" />;
      case 'currency': return <DollarSign className="h-4 w-4" />;
      case 'date': return <Calendar className="h-4 w-4" />;
      case 'boolean': return <ToggleLeft className="h-4 w-4" />;
      case 'image': return <Camera className="h-4 w-4" />;
      case 'video': return <FileVideo className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  const renderField = (field: any, sectionId: string) => {
    const fieldKey = `${sectionId}-${field.field_id || field.field_name}`;
    
    switch (field.field_type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder || `Enter ${field.field_name}`}
            value={formData[fieldKey] || ''}
            onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            className="mt-1"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || `Enter ${field.field_name}`}
            value={formData[fieldKey] || ''}
            onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            className="mt-1"
          />
        );

      case 'currency':
        return (
          <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder={field.placeholder || "0.00"}
              value={formData[fieldKey] || ''}
              onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
              className="pl-10"
            />
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={formData[fieldKey] || ''}
            onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            className="mt-1"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id={fieldKey}
              checked={formData[fieldKey] === 'yes'}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, [fieldKey]: checked ? 'yes' : 'no' })
              }
            />
            <Label htmlFor={fieldKey}>Yes</Label>
          </div>
        );

      case 'dropdown':
        return (
          <Select
            value={formData[fieldKey] || ''}
            onValueChange={(value) => setFormData({ ...formData, [fieldKey]: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={field.placeholder || `Select ${field.field_name}`} />
            </SelectTrigger>
            <SelectContent>
              {field.dropdown_config?.custom_options?.map((option: string, index: number) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              )) || (
                <>
                  <SelectItem value="option1">Sample Option 1</SelectItem>
                  <SelectItem value="option2">Sample Option 2</SelectItem>
                  <SelectItem value="option3">Sample Option 3</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        );

      case 'image':
        return (
          <div className="mt-1">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to capture image</p>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="mt-1">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <FileVideo className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to record video</p>
            </div>
          </div>
        );

      default:
        return (
          <Input
            placeholder={field.placeholder || `Enter ${field.field_name}`}
            value={formData[fieldKey] || ''}
            onChange={(e) => setFormData({ ...formData, [fieldKey]: e.target.value })}
            className="mt-1"
          />
        );
    }
  };

  if (!configData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Preview: {configData.config_name}
            <Badge variant="outline">v{configData.version}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Configuration Info</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Name:</strong> {configData.config_name}</p>
              <p><strong>Description:</strong> {configData.description || 'No description'}</p>
              <p><strong>Status:</strong> 
                <Badge className={`ml-2 ${configData.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {configData.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </p>
            </div>
          </div>

          {configData.categories && configData.categories.length > 0 ? (
            <Accordion type="multiple" className="space-y-4">
              {configData.categories.map((category: any) => (
                <AccordionItem key={category.category_id} value={category.category_id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center justify-between w-full mr-4">
                      <div>
                        <h3 className="font-semibold">{category.category_name}</h3>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <Badge variant="outline">{category.sections?.length || 0} sections</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pl-4">
                      {category.sections?.map((section: any) => (
                        <div key={section.section_id} className="border rounded-lg p-4 bg-background">
                          <div className="mb-4">
                            <h4 className="font-medium flex items-center gap-2">
                              {section.section_name}
                              <Badge variant="outline" className="text-xs">
                                {section.fields?.length || 0} fields
                              </Badge>
                            </h4>
                            {section.description && (
                              <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                            )}
                          </div>

                          {section.fields && section.fields.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {section.fields.map((field: any, fieldIndex: number) => (
                                <div key={fieldIndex} className="space-y-2">
                                  <Label className="flex items-center gap-2">
                                    {getFieldIcon(field.field_type)}
                                    {field.field_name}
                                    {field.is_required && <span className="text-red-500">*</span>}
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {field.field_type}
                                    </Badge>
                                  </Label>
                                  
                                  {renderField(field, section.section_id)}
                                  
                                  {field.help_text && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {field.help_text}
                                    </p>
                                  )}
                                  
                                  {field.has_image && field.field_type !== 'image' && (
                                    <div className="mt-2">
                                      <div className="border border-dashed border-muted-foreground/25 rounded p-2 text-center">
                                        <Camera className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                                        <p className="text-xs text-muted-foreground">Add photo</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              No fields configured for this section
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No categories configured yet</p>
              <p className="text-sm">Add categories and sections to see the preview</p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Close Preview</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigPreviewModal;
