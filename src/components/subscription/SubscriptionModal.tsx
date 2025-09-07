import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar, Users, CreditCard, Package, Calculator, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  mode?: 'new' | 'upgrade' | 'renewal';
  onSuccess?: () => void;
  canClose?: boolean;
  refetchSubscription?: () => void;
  currentSubscription?: any;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  isOpen, 
  onClose, 
  mode = 'new', 
  onSuccess,
  canClose = true,
  refetchSubscription,
  currentSubscription 
}) => {
  const [subscriptionData, setSubscriptionData] = useState({
    number_of_days: 30,
    number_of_users: 1,
    selected_modules: []
  });
  const [pricing, setPricing] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load pricing config
  const { data: pricingConfig } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: async () => {
      const response = await apiClient.get('/api/subscription/pricing-config');
      return response.data.data;
    },
    enabled: isOpen
  });

  // Set default values based on mode and current subscription
  useEffect(() => {
    if (currentSubscription && (mode === 'upgrade' || mode === 'renewal')) {
      setSubscriptionData({
        number_of_days: mode === 'renewal' ? 30 : currentSubscription.number_of_days,
        number_of_users: currentSubscription.number_of_users,
        selected_modules: currentSubscription.module_access || []
      });
    }
  }, [currentSubscription, mode]);

  // Calculate pricing when inputs change
  useEffect(() => {
    if (pricingConfig && subscriptionData.number_of_days > 0 && subscriptionData.number_of_users > 0) {
      calculatePricing();
    }
  }, [subscriptionData, pricingConfig, mode]);

  const calculatePricing = async () => {
    setIsCalculating(true);
    try {
      const payload = {
        ...subscriptionData,
        is_upgrade: mode === 'upgrade',
        is_renewal: mode === 'renewal'
      };
      const response = await apiClient.post('/api/subscription/calculate-price', payload);
      setPricing(response.data.data);
    } catch (error) {
      console.error('Pricing calculation error:', error);
      toast.error('Failed to calculate pricing');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleModuleToggle = (moduleValue, checked) => {
    if (mode === 'upgrade' && currentSubscription?.module_access?.includes(moduleValue)) {
      // Don't allow disabling already purchased modules in upgrade mode
      return;
    }

    setSubscriptionData(prev => ({
      ...prev,
      selected_modules: checked
        ? [...prev.selected_modules, moduleValue]
        : prev.selected_modules.filter(m => m !== moduleValue)
    }));
  };

  const createSubscription = async (paymentMethod) => {
    try {
      const response = await apiClient.post('/api/subscription/create', {
        ...subscriptionData,
        total_amount: pricing.total_amount,
        payment_method: paymentMethod,
        is_upgrade: mode === 'upgrade',
        is_renewal: mode === 'renewal'
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  const handlePayment = async (paymentMethod) => {
    setIsProcessing(true);
    try {
      const subscription = await createSubscription(paymentMethod);

      setTimeout(async () => {
        try {
          await apiClient.patch(`/api/subscription/${subscription._id}/payment-status`, {
            payment_status: 'completed',
            payment_transaction_id: `${paymentMethod}_${Date.now()}`
          });
          toast.success('Payment successful! Your subscription is now active.');
          refetchSubscription?.();
          onSuccess?.();
          if (canClose && onClose) {
            onClose();
          } else {
            window.location.reload();
          }
        } catch (error) {
          toast.error('Payment verification failed');
        }
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'upgrade': return 'Upgrade Subscription';
      case 'renewal': return 'Renew Subscription';
      default: return 'Set Up Your Subscription';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getModalTitle()}</DialogTitle>
            {canClose && onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Configuration</CardTitle>
              <CardDescription>
                {mode === 'upgrade' ? 'Upgrade your current plan' : 
                 mode === 'renewal' ? 'Renew your subscription' : 
                 'Configure your subscription requirements'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="days"
                      type="number"
                      min="1"
                      max="365"
                      value={subscriptionData.number_of_days}
                      onChange={(e) => setSubscriptionData(prev => ({
                        ...prev,
                        number_of_days: parseInt(e.target.value) || 1
                      }))}
                      className="pl-10"
                      disabled={mode === 'upgrade'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="users">Number of Users</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="users"
                      type="number"
                      min="1"
                      max="1000"
                      value={subscriptionData.number_of_users}
                      onChange={(e) => setSubscriptionData(prev => ({
                        ...prev,
                        number_of_users: parseInt(e.target.value) || 1
                      }))}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Select Modules</Label>
                <div className="space-y-3">
                  {pricingConfig?.modules?.map((module) => {
                    const isSelected = subscriptionData.selected_modules.includes(module.module_name);
                    const isAlreadyPurchased = mode === 'upgrade' && currentSubscription?.module_access?.includes(module.module_name);

                    return (
                      <div key={module.module_name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                        <div className="flex items-center space-x-3">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Label className="font-medium">{module.display_value}</Label>
                            {isAlreadyPurchased && (
                              <Badge variant="outline" className="ml-2">Already Purchased</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">${module.cost_per_module}/day</Badge>
                          <Switch
                            checked={isSelected}
                            onCheckedChange={(checked) => handleModuleToggle(module.module_name, checked)}
                            disabled={isAlreadyPurchased}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Pricing Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCalculating ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : pricing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {mode !== 'upgrade' && (
                        <>
                          <div className="flex justify-between">
                            <span>Per User Cost:</span>
                            <span>${pricing.per_user_cost}/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Users ({subscriptionData.number_of_users}):</span>
                            <span>${pricing.user_cost}/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Modules:</span>
                            <span>${pricing.module_cost}/day</span>
                          </div>
                        </>
                      )}
                      {pricing.discount_amount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-${pricing.discount_amount}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total{mode === 'upgrade' ? ' (Remaining Days)' : ` (${subscriptionData.number_of_days} days)`}:</span>
                          <span>${pricing.total_amount}</span>
                        </div>
                      </div>
                    </div>

                    {pricing.module_details?.length > 0 && (
                      <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Selected Modules:</h4>
                        <div className="space-y-1">
                          {pricing.module_details.map((module, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{module.display_value}</span>
                              <span>${module.cost}/day</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Configure your subscription to see pricing
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Section */}
            {pricing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="stripe">Stripe</TabsTrigger>
                      <TabsTrigger value="paypal">PayPal</TabsTrigger>
                      <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stripe" className="space-y-4">
                      <Button
                        onClick={() => handlePayment('stripe')}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay $${pricing.total_amount} with Stripe`
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="paypal" className="space-y-4">
                      <Button
                        onClick={() => handlePayment('paypal')}
                        disabled={isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay $${pricing.total_amount} with PayPal`
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="razorpay" className="space-y-4">
                      <Button
                        onClick={() => handlePayment('razorpay')}
                        disabled={isProcessing}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Pay $${pricing.total_amount} with Razorpay`
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;