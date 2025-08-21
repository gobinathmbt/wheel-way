
import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { configServices } from '@/api/services';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SortableFieldProps {
  field: any;
  configId: string;
  sectionId: string;
  onEditField: (field: any) => void;
  onDeleteField: (fieldId: string, sectionId: string) => void;
  dropdowns?: any[];
}

function SortableField({ field, configId, sectionId, onEditField, onDeleteField, dropdowns }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.field_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getDropdownName = (field: any) => {
    if (field.field_type === 'dropdown' && field.dropdown_config?.dropdown_name) {
      const dropdown = dropdowns?.find((d: any) => d.dropdown_name === field.dropdown_config.dropdown_name);
      return dropdown?.display_name || field.dropdown_config.dropdown_name;
    }
    return null;
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-3">
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <span className="font-medium">{field.field_name}</span>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{field.field_type}</Badge>
            {field.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
            {field.has_image && <Badge variant="outline" className="text-xs">Image</Badge>}
            {getDropdownName(field) && (
              <Badge variant="outline" className="text-xs">
                {getDropdownName(field)}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => onEditField(field)}>
          <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the field "{field.field_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteField(field.field_id, sectionId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

interface DraggableTradeinFieldsListProps {
  fields: any[];
  sectionId: string;
  configId: string;
  onEditField: (field: any) => void;
  onDeleteField: (fieldId: string, sectionId: string) => void;
  dropdowns?: any[];
}

const DraggableTradeinFieldsList: React.FC<DraggableTradeinFieldsListProps> = ({
  fields,
  sectionId,
  configId,
  onEditField,
  onDeleteField,
  dropdowns
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const queryClient = useQueryClient();

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((field) => field.field_id === active.id);
      const newIndex = fields.findIndex((field) => field.field_id === over.id);

      const newFields = arrayMove(fields, oldIndex, newIndex);
      
      // Update display_order for all fields
      const fieldsWithOrder = newFields.map((field, index) => ({
        field_id: field.field_id,
        display_order: index
      }));

      try {
        await configServices.updateTradeinFieldsOrder(configId, sectionId, { fields: fieldsWithOrder });
        toast.success('Field order updated');
        queryClient.invalidateQueries({ queryKey: ['tradein-config-details', configId] });
      } catch (error) {
        console.error('Reorder fields error:', error);
        toast.error('Failed to update field order');
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={fields.map(f => f.field_id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {fields.map((field) => (
            <SortableField
              key={field.field_id}
              field={field}
              configId={configId}
              sectionId={sectionId}
              onEditField={onEditField}
              onDeleteField={onDeleteField}
              dropdowns={dropdowns}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default DraggableTradeinFieldsList;
