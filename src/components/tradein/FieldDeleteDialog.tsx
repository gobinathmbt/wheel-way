import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface FieldDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fieldName: string;
  isLoading?: boolean;
}

export const FieldDeleteDialog: React.FC<FieldDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fieldName,
  isLoading = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">Delete Field</DialogTitle>
              <DialogDescription className="text-left mt-1">
                Are you sure you want to delete the field "{fieldName}"?  
                <span className="font-semibold text-red-600">This action cannot be undone.</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-row justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};