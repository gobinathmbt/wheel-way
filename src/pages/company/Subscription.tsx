
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, Users, Package, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionServices, companyServices } from '@/api/services';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// Payment components
import StripePayment from '@/components/subscription/StripePayment';
import PayPalPayment from '@/components/subscription/PayPalPayment';
import RazorPayPayment from '@/components/subscription/RazorPayPayment';

const CompanySubscription = () => {
  const [subscriptionDays, setSubscriptionDays] = useState(30);
  const [userCount, setUserCount] = useState(15);
  const [selectedModules, setSelectedModules] = useState<string[]>(['dashboard', 'users', 'permissions', 'dropdownmaster', 'settings']);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'razorpay' | ''>('');
  const [totalCost, setTotalCost] = useState(0);
  const [activeTab, setActiveTab] = useState('configure');
  const [showPayment, setShowPayment] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState('');

  const queryClient = useQueryClient();

  // Fetch modules from dropdown
  const { data: moduleDropdowns } = useQuery({
    queryKey: ['modules-dropdown'],
    queryFn: async () => {
      const response = await companyServices.getMasterdropdownvalues({
        dropdown_name: ["modules"],
      });
      return response.data.data?.modules || [];
    }
  });

  // Fetch plan configuration
  const { data: planConfig } = useQuery({
    queryKey: ['plan-config'],
    queryFn: async () => {
      const response = await subscriptionServices.getPlanConfig();
      return response.data.data;
    }
  });

  // Fetch subscription status
  const { data: subscriptionStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await subscriptionServices.getSubscriptionStatus();
      return response.data.data;
    }
  });

  // Fetch subscription history
  const { data: subscriptionHistory } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      const response = await subscriptionServices.getSubscriptionHistory();
      return response.data.data;
    }
  });

  // Fetch payment settings
  const { data: paymentSettings } = useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const response = await subscriptionServices.getPaymentSettings();
      return response.data.data;
    }
  });

  // Calculate cost mutation
  const calculateCostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await subscriptionServices.calculateCost(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setTotalCost(data.total_cost);
    }
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await subscriptionServices.createSubscription(data);
      return response.data.data;
    },
    onSuccess: (data) => {
      setCurrentSubscriptionId(data.subscription_id);
      setShowPayment(true);
      toast.success('Subscription created successfully. Please complete payment.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    }
  });

  // Complete subscription mutation
  const completeSubscriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await subscriptionServices.completeSubscription(currentSubscriptionId, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment completed successfully! Your subscription is now active.');
      setShowPayment(false);
      setActiveTab('status');
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-history'] });
      // Refresh the page to update subscription status
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete payment');
    }
  });

  // Calculate cost when parameters change
  useEffect(() => {
    if (subscriptionDays > 0 && userCount > 0 && selectedModules.length > 0) {
      calculateCostMutation.mutate({
        subscription_days: subscriptionDays,
        user_count: userCount,
        selected_modules: selectedModules
      });
    }
  }, [subscriptionDays, userCount, selectedModules]);

  const handleModuleToggle = (moduleValue: string) => {
    // Default modules cannot be unchecked
    const defaultModules = ['dashboard', 'users', 'permissions', 'dropdownmaster', 'settings'];
    if (defaultModules.includes(moduleValue)) {
      return;
    }

    setSelectedModules(prev =>
      prev.includes(moduleValue)
        ? prev.filter(m => m !== moduleValue)
        : [...prev, moduleValue]
    );
  };

  const handleCreateSubscription = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    createSubscriptionMutation.mutate({
      subscription_days: subscriptionDays,
      user_count: userCount,
      selected_modules: selectedModules,
      payment_method: paymentMethod
    });
  };

  const handlePaymentSuccess = (paymentData: any) => {
    completeSubscriptionMutation.mutate(paymentData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'grace_period': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <XCircle className="h-4 w-4" />;
      case 'grace_period': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  // If subscription is active, show management interface
  if (subscriptionStatus?.subscription_status === 'active' && !showPayment) {
    return (
      <DashboardLayout title="Subscription Management">
        <div className="space-y-6">
          {/* Subscription Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getStatusColor(subscriptionStatus.subscription_status)}>
                      {getStatusIcon(subscriptionStatus.subscription_status)}
                      Active Subscription
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Your subscription is currently active and running
                  </CardDescription>
                </div>
                <Button onClick={() => setActiveTab('configure')}>
                  Renew Subscription
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{subscriptionStatus.user_limit}</div>
                  <div className="text-sm text-muted-foreground">User Limit</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{subscriptionStatus.selected_modules?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Modules</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">
                    {subscriptionStatus.subscription_end_date 
                      ? new Date(subscriptionStatus.subscription_end_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Expires On</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">${subscriptionStatus.subscription_amount || 0}</div>
                  <div className="text-sm text-muted-foreground">Amount Paid</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Modules */}
          <Card>
            <CardHeader>
              <CardTitle>Active Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {subscriptionStatus.selected_modules?.map((module: string) => (
                  <Badge key={module} variant="secondary">
                    {module}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subscription History */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptionHistory?.map((subscription: any) => (
                  <div key={subscription._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {subscription.subscription_days} days subscription
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(subscription.start_date).toLocaleDateString()} - 
                        {new Date(subscription.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${subscription.amount}</div>
                      <Badge className={getStatusColor(subscription.payment_status)}>
                        {subscription.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Subscription Configuration">
      <div className="space-y-6">
        {/* Grace Period Warning */}
        {subscriptionStatus?.in_grace_period && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your subscription has expired. You have {subscriptionStatus.grace_period_days} days remaining in your grace period. 
              Please renew your subscription to continue using all features.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure">Configure Subscription</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            {/* Configuration Form */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Configuration</CardTitle>
                <CardDescription>
                  Configure your subscription plan based on your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Subscription Duration (Days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={subscriptionDays}
                    onChange={(e) => setSubscriptionDays(parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* User Count */}
                <div className="space-y-2">
                  <Label htmlFor="users">Number of Users</Label>
                  <Input
                    id="users"
                    type="number"
                    min="1"
                    value={userCount}
                    onChange={(e) => setUserCount(parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* Module Selection */}
                <div className="space-y-4">
                  <Label>Select Modules</Label>
                  <div className="space-y-2">
                    <Alert>
                      <AlertDescription>
                        Dashboard, Users, Permissions, Dropdown Master, and Settings are included by default for company super admins.
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-4">
                      {moduleDropdowns?.map((module: any) => {
                        const isDefault = ['dashboard', 'users', 'permissions', 'dropdownmaster', 'settings'].includes(module.value);
                        const isSelected = selectedModules.includes(module.value);
                        
                        return (
                          <div key={module.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={module.value}
                              checked={isSelected}
                              onCheckedChange={() => handleModuleToggle(module.value)}
                              disabled={isDefault}
                            />
                            <Label htmlFor={module.value} className={isDefault ? 'text-muted-foreground' : ''}>
                              {module.label}
                              {isDefault && <span className="ml-1 text-xs">(Default)</span>}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                {planConfig && totalCost > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Users ({userCount} × {subscriptionDays} days × ${planConfig.per_user_cost}):</span>
                          <span>${(userCount * subscriptionDays * planConfig.per_user_cost).toFixed(2)}</span>
                        </div>
                        {planConfig.module_costs?.map((moduleCost: any) => {
                          if (selectedModules.includes(moduleCost.module_name)) {
                            return (
                              <div key={moduleCost.module_name} className="flex justify-between">
                                <span>{moduleCost.module_name} ({subscriptionDays} days × ${moduleCost.cost}):</span>
                                <span>${(subscriptionDays * moduleCost.cost).toFixed(2)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total Cost:</span>
                          <span>${totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <Label>Select Payment Method</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {paymentSettings?.stripe?.enabled && (
                      <Button
                        variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('stripe')}
                        className="h-20 flex flex-col"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        Stripe
                      </Button>
                    )}
                    {paymentSettings?.paypal?.enabled && (
                      <Button
                        variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('paypal')}
                        className="h-20 flex flex-col"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        PayPal
                      </Button>
                    )}
                    {paymentSettings?.razorpay?.enabled && (
                      <Button
                        variant={paymentMethod === 'razorpay' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('razorpay')}
                        className="h-20 flex flex-col"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        Razorpay
                      </Button>
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleCreateSubscription} 
                  className="w-full"
                  disabled={!paymentMethod || totalCost <= 0 || createSubscriptionMutation.isPending}
                >
                  {createSubscriptionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Subscription...
                    </>
                  ) : (
                    `Create Subscription - $${totalCost.toFixed(2)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            {showPayment && currentSubscriptionId && (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Payment</CardTitle>
                  <CardDescription>
                    Complete your subscription payment using {paymentMethod}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Amount:</span>
                      <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>

                  {paymentMethod === 'stripe' && paymentSettings?.stripe && (
                    <StripePayment
                      amount={totalCost}
                      publicKey={paymentSettings.stripe.public_key}
                      onSuccess={handlePaymentSuccess}
                    />
                  )}

                  {paymentMethod === 'paypal' && paymentSettings?.paypal && (
                    <PayPalPayment
                      amount={totalCost}
                      clientId={paymentSettings.paypal.client_id}
                      mode={paymentSettings.paypal.mode}
                      onSuccess={handlePaymentSuccess}
                    />
                  )}

                  {paymentMethod === 'razorpay' && paymentSettings?.razorpay && (
                    <RazorPayPayment
                      amount={totalCost}
                      keyId={paymentSettings.razorpay.key_id}
                      onSuccess={handlePaymentSuccess}
                    />
                  )}
                </CardContent>
              </Card>
            )}
            
            {!showPayment && (
              <Alert>
                <AlertDescription>
                  No pending payment. Please configure your subscription first.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Subscription History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subscriptionHistory?.map((subscription: any) => (
                    <div key={subscription._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">
                          {subscription.subscription_days} days subscription
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(subscription.start_date).toLocaleDateString()} - 
                          {new Date(subscription.end_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Payment Method: {subscription.payment_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${subscription.amount}</div>
                        <Badge className={getStatusColor(subscription.payment_status)}>
                          {subscription.payment_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  {!subscriptionHistory?.length && (
                    <Alert>
                      <AlertDescription>
                        No subscription history found.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CompanySubscription;
