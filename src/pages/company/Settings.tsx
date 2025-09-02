
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, TestTube, Eye, EyeOff, Loader2, CreditCard, Calendar, Users, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyServices, subscriptionServices } from '@/api/services';
import { useAuth } from '@/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const CompanySettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPasswords, setShowPasswords] = useState(false);
  const queryClient = useQueryClient();

  // S3 Configuration State
  const [s3Data, setS3Data] = useState({
    bucket: '',
    access_key: '',
    secret_key: '',
    region: '',
    url: ''
  });

  // Callback Configuration State
  const [callbackData, setCallbackData] = useState({
    callback_url: '',
    webhook_url: '',
    api_key: '',
    auth_token: ''
  });

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery({
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

  // Fetch S3 config
  const { data: s3Config } = useQuery({
    queryKey: ['s3-config'],
    queryFn: async () => {
      const response = await companyServices.getS3Config();
      return response.data.data;
    }
  });

  // Fetch callback config
  const { data: callbackConfig } = useQuery({
    queryKey: ['callback-config'],
    queryFn: async () => {
      const response = await companyServices.getCallbackConfig();
      return response.data.data;
    }
  });

  // Load configurations when data is available
  React.useEffect(() => {
    if (s3Config) {
      setS3Data(s3Config);
    }
  }, [s3Config]);

  React.useEffect(() => {
    if (callbackConfig) {
      setCallbackData(callbackConfig);
    }
  }, [callbackConfig]);

  // Update S3 config mutation
  const updateS3Mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await companyServices.updateS3Config(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('S3 configuration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['s3-config'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update S3 configuration');
    }
  });

  // Update callback config mutation
  const updateCallbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await companyServices.updateCallbackConfig(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Callback configuration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['callback-config'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update callback configuration');
    }
  });

  // Test S3 connection mutation
  const testS3Mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await companyServices.testS3Connection(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('S3 connection test successful');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'S3 connection test failed');
    }
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await companyServices.testWebhook(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Webhook test successful');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Webhook test failed');
    }
  });

  const handleUpdateS3 = () => {
    updateS3Mutation.mutate(s3Data);
  };

  const handleUpdateCallback = () => {
    updateCallbackMutation.mutate(callbackData);
  };

  const handleTestS3 = () => {
    testS3Mutation.mutate(s3Data);
  };

  const handleTestWebhook = () => {
    testWebhookMutation.mutate(callbackData);
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

  return (
    <DashboardLayout title="Company Settings">
      <div className="space-y-6">
        <Tabs defaultValue="subscription" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="s3">S3 Storage</TabsTrigger>
            <TabsTrigger value="callback">Integration</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            <div className="space-y-6">
              {/* Current Subscription Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Subscription</CardTitle>
                      <CardDescription>
                        Your current subscription plan and status
                      </CardDescription>
                    </div>
                    {user?.role === 'company_super_admin' && (
                      <Button onClick={() => navigate('/subscription')}>
                        {subscriptionStatus?.subscription_status === 'active' ? 'Manage Subscription' : 'Configure Subscription'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {subscriptionStatus ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 border rounded-lg">
                          <div className="flex items-center justify-center mb-2">
                            <Badge className={getStatusColor(subscriptionStatus.subscription_status)}>
                              {subscriptionStatus.subscription_status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">Status</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <div className="text-lg font-bold">{subscriptionStatus.user_limit || 0}</div>
                          <div className="text-sm text-muted-foreground">User Limit</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <Package className="h-6 w-6 mx-auto mb-2 text-green-500" />
                          <div className="text-lg font-bold">{subscriptionStatus.selected_modules?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Active Modules</div>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <Calendar className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                          <div className="text-lg font-bold">
                            {subscriptionStatus.subscription_end_date 
                              ? new Date(subscriptionStatus.subscription_end_date).toLocaleDateString()
                              : 'N/A'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">Expires On</div>
                        </div>
                      </div>

                      {/* Grace Period Warning */}
                      {subscriptionStatus.in_grace_period && (
                        <Alert variant="destructive">
                          <AlertDescription>
                            Your subscription has expired. You have {subscriptionStatus.grace_period_days} days remaining in your grace period.
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Active Modules */}
                      {subscriptionStatus.selected_modules && subscriptionStatus.selected_modules.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Active Modules</h4>
                          <div className="flex flex-wrap gap-2">
                            {subscriptionStatus.selected_modules.map((module: string) => (
                              <Badge key={module} variant="secondary">
                                {module}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        No subscription information available. Please configure your subscription.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Subscription History */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription History</CardTitle>
                  <CardDescription>
                    View your past subscription payments and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subscriptionHistory && subscriptionHistory.length > 0 ? (
                      subscriptionHistory.map((subscription: any) => (
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
                      ))
                    ) : (
                      <Alert>
                        <AlertDescription>
                          No subscription history found.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="s3">
            <Card>
              <CardHeader>
                <CardTitle>S3 Storage Configuration</CardTitle>
                <CardDescription>
                  Configure AWS S3 settings for file storage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bucket">S3 Bucket Name</Label>
                    <Input
                      id="bucket"
                      value={s3Data.bucket}
                      onChange={(e) => setS3Data({ ...s3Data, bucket: e.target.value })}
                      placeholder="your-bucket-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={s3Data.region}
                      onChange={(e) => setS3Data({ ...s3Data, region: e.target.value })}
                      placeholder="us-east-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="access_key">Access Key</Label>
                    <Input
                      id="access_key"
                      value={s3Data.access_key}
                      onChange={(e) => setS3Data({ ...s3Data, access_key: e.target.value })}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret_key">Secret Key</Label>
                    <div className="relative">
                      <Input
                        id="secret_key"
                        type={showPasswords ? 'text' : 'password'}
                        value={s3Data.secret_key}
                        onChange={(e) => setS3Data({ ...s3Data, secret_key: e.target.value })}
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s3_url">S3 URL (Optional)</Label>
                  <Input
                    id="s3_url"
                    value={s3Data.url}
                    onChange={(e) => setS3Data({ ...s3Data, url: e.target.value })}
                    placeholder="https://your-bucket.s3.amazonaws.com"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateS3} disabled={updateS3Mutation.isPending}>
                    {updateS3Mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update S3 Config
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleTestS3} disabled={testS3Mutation.isPending}>
                    {testS3Mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="callback">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>
                  Configure webhook and API integration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="callback_url">Callback URL</Label>
                  <Input
                    id="callback_url"
                    value={callbackData.callback_url}
                    onChange={(e) => setCallbackData({ ...callbackData, callback_url: e.target.value })}
                    placeholder="https://your-domain.com/callback"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    value={callbackData.webhook_url}
                    onChange={(e) => setCallbackData({ ...callbackData, webhook_url: e.target.value })}
                    placeholder="https://your-domain.com/webhook"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type={showPasswords ? 'text' : 'password'}
                      value={callbackData.api_key}
                      onChange={(e) => setCallbackData({ ...callbackData, api_key: e.target.value })}
                      placeholder="your-api-key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth_token">Auth Token</Label>
                    <Input
                      id="auth_token"
                      type={showPasswords ? 'text' : 'password'}
                      value={callbackData.auth_token}
                      onChange={(e) => setCallbackData({ ...callbackData, auth_token: e.target.value })}
                      placeholder="your-auth-token"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateCallback} disabled={updateCallbackMutation.isPending}>
                    {updateCallbackMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Integration
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleTestWebhook} disabled={testWebhookMutation.isPending}>
                    {testWebhookMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test Webhook
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  View your current billing information and subscription details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionStatus?.subscription_status === 'active' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Current Plan Amount</Label>
                        <div className="text-2xl font-bold">${subscriptionStatus.subscription_amount || 0}</div>
                      </div>
                      <div className="space-y-2">
                        <Label>Next Billing Date</Label>
                        <div className="text-lg">
                          {subscriptionStatus.subscription_end_date 
                            ? new Date(subscriptionStatus.subscription_end_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {user?.role === 'company_super_admin' && (
                      <div className="pt-4 border-t">
                        <Button onClick={() => navigate('/subscription')}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Manage Subscription
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No active subscription found. Please configure your subscription to view billing information.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CompanySettings;
