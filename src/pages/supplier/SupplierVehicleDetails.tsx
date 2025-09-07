import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierAuthServices } from '@/api/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Car, DollarSign, Clock, MessageSquare, FileText, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const SupplierVehicleDetails = () => {
  const { vehicleStockId,vehicleType } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [supplierUser, setSupplierUser] = useState<any>(null);
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [formData, setFormData] = useState({
    estimated_cost: '',
    estimated_time: '',
    comments: '',
    quote_pdf_url: '',
    quote_pdf_key: ''
  });

  useEffect(() => {
    const token = sessionStorage.getItem('supplier_token');
    const user = sessionStorage.getItem('supplier_user');
    
    if (!token || !user) {
      navigate('/supplier/login');
      return;
    }
    
    setSupplierUser(JSON.parse(user));
  }, [navigate]);

  const { data: vehicleData, isLoading } = useQuery({
    queryKey: ['supplier-vehicle-details', vehicleStockId],
    queryFn: async () => {
      const response = await supplierAuthServices.getVehicleDetails(vehicleStockId! ,vehicleType!);
      return response.data?.data;
    },
    enabled: !!vehicleStockId && !!supplierUser
  });

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await supplierAuthServices.submitResponse(selectedQuote._id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Response submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['supplier-vehicle-details'] });
      setResponseModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    }
  });

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.estimated_cost || !formData.estimated_time) {
      toast.error('Please enter estimated cost and time');
      return;
    }

    submitResponseMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      estimated_cost: '',
      estimated_time: '',
      comments: '',
      quote_pdf_url: '',
      quote_pdf_key: ''
    });
    setSelectedQuote(null);
  };

  const openResponseModal = (quote: any) => {
    setSelectedQuote(quote);
    
    // If supplier already responded, populate the form
    const existingResponse = quote.supplier_responses?.find(
      (response: any) => response.supplier_id === supplierUser.id
    );
    
    if (existingResponse) {
      setFormData({
        estimated_cost: existingResponse.estimated_cost?.toString() || '',
        estimated_time: existingResponse.estimated_time || '',
        comments: existingResponse.comments || '',
        quote_pdf_url: existingResponse.quote_pdf_url || '',
        quote_pdf_key: existingResponse.quote_pdf_key || ''
      });
    }
    
    setResponseModalOpen(true);
  };

  const getSupplierResponse = (quote: any) => {
    return quote.supplier_responses?.find(
      (response: any) => response.supplier_id === supplierUser.id
    );
  };

  if (!supplierUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const vehicle = vehicleData?.vehicle;
  const quotes = vehicleData?.quotes || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => navigate('/supplier/dashboard')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">Vehicle Details</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - 70% - Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Quote Requests</h2>
              
              {quotes.length > 0 ? (
                <div className="space-y-4">
                  {quotes.map((quote: any, index: number) => {
                    const supplierResponse = getSupplierResponse(quote);
                    
                    return (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{quote.field_name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                ${quote.quote_amount}
                              </Badge>
                              {supplierResponse && (
                                <Badge 
                                  variant={
                                    supplierResponse.status === 'approved' ? 'default' :
                                    supplierResponse.status === 'rejected' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {supplierResponse.status}
                                </Badge>
                              )}
                            </div>
                          </CardTitle>
                          {quote.quote_description && (
                            <p className="text-sm text-muted-foreground">
                              {quote.quote_description}
                            </p>
                          )}
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Field ID:</span>
                                <p className="font-medium">{quote.field_id}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Quote Amount:</span>
                                <p className="font-medium">${quote.quote_amount}</p>
                              </div>
                            </div>
                            
                            {supplierResponse ? (
                              <div className="bg-muted/50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  {supplierResponse.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  {supplierResponse.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                                  Your Response
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Estimated Cost:</span>
                                    <p className="font-medium">${supplierResponse.estimated_cost}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Estimated Time:</span>
                                    <p className="font-medium">{supplierResponse.estimated_time}</p>
                                  </div>
                                </div>
                                {supplierResponse.comments && (
                                  <div className="mt-2">
                                    <span className="text-muted-foreground">Comments:</span>
                                    <p className="text-sm">{supplierResponse.comments}</p>
                                  </div>
                                )}
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openResponseModal(quote)}
                                  >
                                    Update Response
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <Button onClick={() => openResponseModal(quote)}>
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Submit Quote
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Quote Requests</h3> 
                      <p className="text-muted-foreground">
                        No quote requests available for this vehicle.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Panel - 30% - Vehicle Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicle && (
                  <>
                    {/* Hero Image */}
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src={vehicle.vehicle_hero_image}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {vehicle.name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stock ID:</span>
                          <p className="font-medium">{vehicle.vehicle_stock_id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium capitalize">{vehicle.vehicle_type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">VIN:</span>
                          <p className="font-medium">{vehicle.vin}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Plate:</span>
                          <p className="font-medium">{vehicle.plate_no}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Specs */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Specifications</h4>
                      <div className="space-y-1 text-sm">
                        {vehicle.variant && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Variant:</span>
                            <span>{vehicle.variant}</span>
                          </div>
                        )}
                        {vehicle.body_style && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Body Style:</span>
                            <span>{vehicle.body_style}</span>
                          </div>
                        )}
                        {vehicle.chassis_no && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Chassis:</span>
                            <span>{vehicle.chassis_no}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Response Modal */}
      <Dialog open={responseModalOpen} onOpenChange={setResponseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Submit Quote for {selectedQuote?.field_name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitResponse} className="space-y-4">
            {/* Quote Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Company's Quote Request</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-medium">${selectedQuote?.quote_amount}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Field:</span>
                  <p className="font-medium">{selectedQuote?.field_name}</p>
                </div>
              </div>
              {selectedQuote?.quote_description && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Description:</span>
                  <p className="text-sm">{selectedQuote.quote_description}</p>
                </div>
              )}
            </div>

            {/* Response Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_cost">Estimated Cost *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimated_cost"
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_cost: e.target.value }))}
                    placeholder="Enter your cost estimate"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="estimated_time">Estimated Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="estimated_time"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_time: e.target.value }))}
                    placeholder="e.g., 2-3 days, 1 week"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Any additional information or notes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setResponseModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitResponseMutation.isPending}
              >
                {submitResponseMutation.isPending ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierVehicleDetails;