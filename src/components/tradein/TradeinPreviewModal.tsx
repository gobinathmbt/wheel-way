
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Video } from 'lucide-react';

interface TradeinPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: any;
  dropdowns?: any[];
}

export const TradeinPreviewModal: React.FC<TradeinPreviewModalProps> = ({
  isOpen,
  onClose,
  config,
  dropdowns
}) => {
  if (!config) return null;

  const getDropdownOptions = (field: any) => {
    if (field.dropdown_config?.dropdown_name) {
      const dropdown = dropdowns?.find(d => d.dropdown_name === field.dropdown_config.dropdown_name);
      return dropdown?.values || [];
    }
    return [];
  };

  const renderField = (field: any) => {
    const fieldId = `preview-${field.field_id}`;
    
    switch (field.field_type) {
      case 'text':
        return (
          <Input 
            id={fieldId}
            placeholder={field.placeholder || `Enter ${field.field_name}`}
            disabled
          />
        );
      
      case 'number':
        return (
          <Input 
            id={fieldId}
            type="number" 
            placeholder={field.placeholder || `Enter ${field.field_name}`}
            disabled
          />
        );
      
      case 'currency':
        return (
          <Input 
            id={fieldId}
            type="number" 
            placeholder={field.placeholder || "0.00"}
            disabled
          />
        );
      
      case 'date':
        return (
          <Input 
            id={fieldId}
            type="date" 
            disabled
          />
        );
      
      case 'dropdown':
        const options = getDropdownOptions(field);
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.field_name}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: any, index: number) => (
                <SelectItem key={index} value={option.option_value}>
                  {option.option_value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={fieldId} disabled />
            <Label htmlFor={fieldId}>Yes</Label>
          </div>
        );
      
      case 'image':
        return (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Click to upload image</p>
          </div>
        );
      
      case 'video':
        return (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Click to upload video</p>
          </div>
        );
      
      default:
        return (
          <Textarea 
            id={fieldId}
            placeholder={field.placeholder || `Enter ${field.field_name}`}
            disabled
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trade-in Configuration Preview</DialogTitle>
          <DialogDescription>
            Preview of "{config.config_name}" - This is how the form will appear to users
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {config.sections && config.sections.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {config.sections
                .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                .map((section: any) => (
                  <AccordionItem key={section.section_id} value={section.section_id}>
                    <AccordionTrigger className={section.is_collapsible ? '' : 'pointer-events-none'}>
                      <div className="text-left">
                        <h3 className="font-semibold">{section.section_name}</h3>
                        {section.description && (
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {section.fields && section.fields.length > 0 ? (
                          section.fields
                            .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                            .map((field: any) => (
                              <div key={field.field_id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`preview-${field.field_id}`} className="font-medium">
                                    {field.field_name}
                                  </Label>
                                  {field.is_required && (
                                    <Badge variant="destructive" className="text-xs">Required</Badge>
                                  )}
                                  {field.has_image && (
                                    <Badge variant="outline" className="text-xs">Photo Required</Badge>
                                  )}
                                </div>
                                {field.help_text && (
                                  <p className="text-sm text-muted-foreground">{field.help_text}</p>
                                )}
                                {renderField(field)}
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No fields in this section</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sections configured yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
