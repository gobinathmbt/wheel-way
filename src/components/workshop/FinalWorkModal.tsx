import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { workshopServices } from '@/api/services';
import { CheckCircle, XCircle, DollarSign, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FinalWorkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: any;
  onSuccess: () => void;
}

const FinalWorkModal: React.FC<FinalWorkModalProps> = ({
  open,
  onOpenChange,
  field,
  onSuccess
}) => {
  const [reworkReason, setReworkReason] = useState('');

  // Fetch final work details for the field
  const { data: workData, isLoading } = useQuery({
    queryKey: ['field-final-work', field?.vehicle_type, field?.vehicle_stock_id, field?.field_id],
    queryFn: async () => {
      if (!field) return null;
      // This would be a new API endpoint to get final work details
      // For now, return mock data
      return {
        supplier_name: 'ABC Auto Parts',
        estimated_price: 450.00,
        gst: 67.50,
        total_price: 517.50,
        invoice_pdf_url: 'https://example.com/invoice.pdf',
        work_images: [
          'https://example.com/work1.jpg',
          'https://example.com/work2.jpg'
        ],
        comments: 'Work completed as per specifications. All parts have been replaced and tested.',
        completed_at: new Date().toISOString(),
        status: 'pending_approval'
      };
    },
    enabled: open && !!field
  });

  // Approve work mutation
  const approveWorkMutation = useMutation({
    mutationFn: async () => {
      // This would be a new API endpoint to approve final work
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Work approved successfully');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Failed to approve work');
    }
  });

  // Request rework mutation
  const requestReworkMutation = useMutation({
    mutationFn: async (reason: string) => {
      // This would be a new API endpoint to request rework
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Rework request sent to supplier');
      setReworkReason('');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Failed to request rework');
    }
  });

  const handleApproveWork = () => {
    approveWorkMutation.mutate();
  };

  const handleRequestRework = () => {
    if (!reworkReason.trim()) {
      toast.error('Please provide a reason for rework');
      return;
    }
    requestReworkMutation.mutate(reworkReason);
  };

  const work = workData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Final Work Review - {field?.field_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : work ? (
            <div className="space-y-4">
              {/* Work Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Work Completed by {work.supplier_name}</span>
                    <Badge variant={
                      work.status === 'approved' ? 'default' :
                      work.status === 'rework_requested' ? 'destructive' :
                      'secondary'
                    }>
                      {work.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Estimated Price</p>
                        <p className="font-bold">${work.estimated_price}</p>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                        GST
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">GST (15%)</p>
                        <p className="font-bold">${work.gst}</p>
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                      <div className="h-8 w-8 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Price</p>
                        <p className="font-bold text-lg text-primary">${work.total_price}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Comments */}
                    <div>
                      <h4 className="font-medium mb-2">Supplier Comments</h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">{work.comments}</p>
                      </div>
                    </div>

                    {/* Invoice */}
                    {work.invoice_pdf_url && (
                      <div>
                        <h4 className="font-medium mb-2">Invoice</h4>
                        <Button variant="outline" asChild>
                          <a href={work.invoice_pdf_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-2" />
                            View Invoice PDF
                          </a>
                        </Button>
                      </div>
                    )}

                    {/* Work Images */}
                    {work.work_images && work.work_images.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Work Images</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {work.work_images.map((image: string, index: number) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                              <img
                                src={image}
                                alt={`Work image ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                onClick={() => window.open(image, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completion Date */}
                    <div className="text-sm text-muted-foreground">
                      Work completed on: {new Date(work.completed_at).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {work.status === 'pending_approval' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Review Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={handleApproveWork}
                        disabled={approveWorkMutation.isPending}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {approveWorkMutation.isPending ? 'Approving...' : 'Approve Work'}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Request Rework</h4>
                      <Textarea
                        placeholder="Provide detailed reason for rework request..."
                        value={reworkReason}
                        onChange={(e) => setReworkReason(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button
                        variant="outline"
                        onClick={handleRequestRework}
                        disabled={!reworkReason.trim() || requestReworkMutation.isPending}
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {requestReworkMutation.isPending ? 'Requesting...' : 'Request Rework'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <p className="text-muted-foreground">No final work data available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinalWorkModal;