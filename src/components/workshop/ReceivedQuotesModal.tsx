import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { workshopServices } from '@/api/services';
import { CheckCircle, XCircle, DollarSign, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ReceivedQuotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: any;
  onSuccess: () => void;
}

const ReceivedQuotesModal: React.FC<ReceivedQuotesModalProps> = ({
  open,
  onOpenChange,
  field,
  onSuccess
}) => {
  const queryClient = useQueryClient();

  // Fetch quotes for the field
  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['field-quotes', field?.vehicle_type, field?.vehicle_stock_id, field?.field_id],
    queryFn: async () => {
      if (!field) return null;
      const response = await workshopServices.getQuotesForField(
        field.vehicle_type,
        field.vehicle_stock_id,
        field.field_id
      );
      return response.data;
    },
    enabled: open && !!field
  });

  // Approve quote mutation
  const approveQuoteMutation = useMutation({
    mutationFn: async ({ quoteId, supplierId }: { quoteId: string; supplierId: string }) => {
      const response = await workshopServices.approveSupplierQuote(quoteId, supplierId);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Quote approved successfully');
      queryClient.invalidateQueries({ queryKey: ['field-quotes'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve quote');
    }
  });

  const handleApproveQuote = (quoteId: string, supplierId: string) => {
    approveQuoteMutation.mutate({ quoteId, supplierId });
  };

  const quote = quotesData?.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Received Quotes for {field?.field_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : quote ? (
            <div className="space-y-4">
              {/* Quote Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Company Quote Request</span>
                    <Badge variant="outline">${quote.quote_amount}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{quote.quote_description}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(quote.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Responses */}
              {quote.supplier_responses && quote.supplier_responses.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Supplier Responses</h3>
                  {quote.supplier_responses.map((response: any, index: number) => (
                
                    <Card key={index} className={`${
                      response.status === 'approved' ? 'border-green-500 bg-green-50' :
                      response.status === 'rejected' ? 'border-red-500 bg-red-50' :
                      'border-blue-500'
                    }`}>
                      <CardHeader>   
                        <CardTitle className="flex items-center justify-between"> 
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{response.supplier_id?.name || 'Unknown Supplier'}</span> |
                            <span className="text-sm">{response.supplier_id?.email || 'Unknown Supplier'}</span> |
                            <span className="text-sm">{response.supplier_id?.supplier_shop_name || 'Unknown Supplier'}</span> 
                            {response.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {response.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                          </div>
                          <Badge variant={
                            response.status === 'approved' ? 'default' :
                            response.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }>
                            {response.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Estimated Cost</p>
                              <p className="font-medium">${response.estimated_cost}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Estimated Time</p>
                              <p className="font-medium">{response.estimated_time}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Response Date</p>
                              <p className="font-medium text-xs">
                                {new Date(response.responded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {response.comments && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground mb-1">Comments:</p>
                            <p className="text-sm bg-muted/50 p-2 rounded">{response.comments}</p>
                          </div>
                        )}

                        {response.quote_pdf_url && (
                          <div className="mb-4">
                            <Button variant="outline" size="sm" asChild>
                              <a href={response.quote_pdf_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="h-4 w-4 mr-2" />
                                View Quote PDF
                              </a>
                            </Button>
                          </div>
                        )}

                        {response.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveQuote(quote._id, response.supplier_id._id)}
                              disabled={approveQuoteMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Quote
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center">
                      <p className="text-muted-foreground">No supplier responses yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Suppliers will be notified and their responses will appear here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <p className="text-muted-foreground">No quotes found for this field</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceivedQuotesModal;