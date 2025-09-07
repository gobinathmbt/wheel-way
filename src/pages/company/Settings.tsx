
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cloud, Link, CreditCard, Save, TestTube, Loader2, Package, Calendar, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { companyServices, subscriptionServices } from '@/api/services';
import { useQuery } from '@tanstack/react-query';
import SubscriptionModal from '@/components/subscription/SubscriptionModal';
import apiClient from '@/api/axios';

const CompanySettings = () => {
  const [loading, setLoading] = useState(false);
  const [s3Config, setS3Config] = useState({
    bucket: '',
    access_key: '',
    secret_key: '',
    region: 'us-east-1',
    url: ''
  });

  const [callbackConfig, setCallbackConfig] = useState({
    inspection_callback_url: '',
    tradein_callback_url: '',
    webhook_secret: ''
  });

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalMode, setSubscriptionModalMode] = useState<'upgrade' | 'renewal'>('upgrade');

  // Load company subscription info
  const { data: companySubscription, refetch: refetchSubscription } = useQuery({
    queryKey: ['company-subscription-info'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/subscription/company-info');
        return response.data.data;
      } catch (error) {
        return null;
      }
    }
  });

  // Load subscription history
  const { data: subscriptionHistory } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: async () => {
      try {
        const response = await subscriptionServices.getSubscriptionHistory();
        return response.data.data;
      } catch (error) {
        return [];
      }
    }
  });

  // Load configurations on mount
  useEffect(() => {
   
    const loadConfigurations = async () => {
      setLoading(true);
      try {
        const [s3Response, callbackResponse] = await Promise.all([
          companyServices.getS3Config(),
          companyServices.getCallbackConfig()
        ]);

        if (s3Response.data.success) {
          setS3Config(s3Response.data.data || s3Config);
        }
        
        if (callbackResponse.data.success) {
          setCallbackConfig(callbackResponse.data.data || callbackConfig);
        }
      } catch (error) {
        console.error('Failed to load configurations:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
refetchSubscription()
    loadConfigurations();
  }, []);

  const handleUpgradeClick = () => {
    setSubscriptionModalMode('upgrade');
    setShowSubscriptionModal(true);
  };

  const handleRenewClick = () => {
    setSubscriptionModalMode('renewal');
    setShowSubscriptionModal(true);
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'grace_period': return 'destructive';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleS3Save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await companyServices.updateS3Config(s3Config);
      if (response.data.success) {
        toast.success('S3 configuration saved successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save S3 configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCallbackSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await companyServices.updateCallbackConfig(callbackConfig);
      if (response.data.success) {
        toast.success('Callback URLs saved successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save callback URLs');
    } finally {
      setLoading(false);
    }
  };

  const testS3Connection = async () => {
    setLoading(true);
    try {
      const response = await companyServices.testS3Connection(s3Config);
      if (response.data.success) {
        toast.success('S3 connection test successful');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'S3 connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (type) => {
    setLoading(true);
    try {
      const url = type === 'inspection' ? callbackConfig.inspection_callback_url : callbackConfig.tradein_callback_url;
      const response = await companyServices.testWebhook({ url, type });
      if (response.data.success) {
        toast.success(`${type} webhook test successful`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `${type} webhook test failed`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !s3Config.bucket && !companySubscription) {
    return (
      <DashboardLayout title="Company Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Company Settings">
      <div className="space-y-6">

        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Subscription
              {companySubscription?.subscription_status === 'grace_period' && (
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Cloud Storage
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <div className="space-y-6">
              {/* Current Subscription Status */}
              {companySubscription && companySubscription.subscription_status !== 'inactive' ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Current Subscription
                      <Badge variant={getSubscriptionStatusColor(companySubscription?.subscription_status || 'inactive')}>
                        {companySubscription?.subscription_status || 'inactive'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companySubscription?.subscription_status === 'grace_period' && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Your subscription has expired. You have {companySubscription?.days_remaining || 0} days remaining in the grace period.
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="ml-4" 
                            onClick={handleRenewClick}
                          >
                            Renew Now
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{companySubscription?.number_of_users || 1}</div>
                        <p className="text-sm text-muted-foreground">Users</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{companySubscription?.days_remaining || 0}</div>
                        <p className="text-sm text-muted-foreground">Days Left</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{companySubscription?.module_access?.length || 0}</div>
                        <p className="text-sm text-muted-foreground">Modules</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{companySubscription?.number_of_days || 0}</div>
                        <p className="text-sm text-muted-foreground">Total Days</p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Start Date</Label>
                        <p className="text-lg">
                          {companySubscription?.subscription_start_date 
                            ? new Date(companySubscription.subscription_start_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">End Date</Label>
                        <p className="text-lg">
                          {companySubscription?.subscription_end_date 
                            ? new Date(companySubscription.subscription_end_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label className="text-sm font-medium">Active Modules</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {companySubscription?.module_access?.map((module, index) => (
                          <Badge key={index} variant="outline" className="capitalize">
                            {module.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-4">
                      <Button onClick={handleUpgradeClick} variant="outline">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Upgrade Plan
                      </Button>
                      {companySubscription?.can_renew && (
                        <Button onClick={handleRenewClick}>
                          Renew Subscription
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      No Active Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You don't have an active subscription. Please set up your subscription to access all features.
                      </AlertDescription>
                    </Alert>
                    <div className="mt-4">
                      <Button onClick={() => setShowSubscriptionModal(true)}>
                        Set Up Subscription
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subscription History */}
              {subscriptionHistory && subscriptionHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Subscription History</CardTitle>
                    <CardDescription>Your past subscriptions and payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subscriptionHistory.map((subscription, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {subscription.number_of_users} Users × {subscription.number_of_days} Days
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(subscription.subscription_start_date).toLocaleDateString()} - 
                              {new Date(subscription.subscription_end_date).toLocaleDateString()}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {subscription.selected_modules?.slice(0, 3).map((module, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs capitalize">
                                  {module.module_name}
                                </Badge>
                              ))}
                              {subscription.selected_modules?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{subscription.selected_modules.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${subscription.total_amount}</p>
                            <Badge variant={subscription.payment_status === 'completed' ? 'default' : 'secondary'}>
                              {subscription.payment_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* S3 Configuration */}
          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle>AWS S3 Configuration</CardTitle>
                <CardDescription>Configure your cloud storage for vehicle images and documents</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleS3Save} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bucket">S3 Bucket Name</Label>
                      <Input
                        id="bucket"
                        value={s3Config.bucket}
                        onChange={(e) => setS3Config({ ...s3Config, bucket: e.target.value })}
                        placeholder="your-bucket-name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={s3Config.region}
                        onChange={(e) => setS3Config({ ...s3Config, region: e.target.value })}
                        placeholder="us-east-1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="access_key">Access Key ID</Label>
                    <Input
                      id="access_key"
                      value={s3Config.access_key}
                      onChange={(e) => setS3Config({ ...s3Config, access_key: e.target.value })}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="secret_key">Secret Access Key</Label>
                    <Input
                      id="secret_key"
                      type="password"
                      value={s3Config.secret_key}
                      onChange={(e) => setS3Config({ ...s3Config, secret_key: e.target.value })}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="url">S3 URL (Optional)</Label>
                    <Input
                      id="url"
                      value={s3Config.url}
                      onChange={(e) => setS3Config({ ...s3Config, url: e.target.value })}
                      placeholder="https://your-bucket.s3.us-east-1.amazonaws.com"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Configuration
                    </Button>
                    <Button type="button" variant="outline" onClick={testS3Connection} disabled={loading}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks */}
          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>Set up callback URLs to receive inspection and trade-in data</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCallbackSave} className="space-y-6">
                  <div>
                    <Label htmlFor="inspection_callback">Inspection Callback URL</Label>
                    <Input
                      id="inspection_callback"
                      type="url"
                      value={callbackConfig.inspection_callback_url}
                      onChange={(e) => setCallbackConfig({ ...callbackConfig, inspection_callback_url: e.target.value })}
                      placeholder="https://your-domain.com/api/inspection-webhook"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll POST inspection data to this URL when completed
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tradein_callback">Trade-in Callback URL</Label>
                    <Input
                      id="tradein_callback"
                      type="url"
                      value={callbackConfig.tradein_callback_url}
                      onChange={(e) => setCallbackConfig({ ...callbackConfig, tradein_callback_url: e.target.value })}
                      placeholder="https://your-domain.com/api/tradein-webhook"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll POST appraisal data to this URL when completed
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="webhook_secret">Webhook Secret Key</Label>
                    <Input
                      id="webhook_secret"
                      value={callbackConfig.webhook_secret}
                      onChange={(e) => setCallbackConfig({ ...callbackConfig, webhook_secret: e.target.value })}
                      placeholder="your-secret-key-for-verification"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Used to verify webhook authenticity via HMAC signature
                    </p>
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Webhooks
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => testWebhook('inspection')}
                      disabled={loading}
                    >
                      Test Inspection
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => testWebhook('tradein')}
                      disabled={loading}
                    >
                      Test Trade-in
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Subscription Modal */}
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          mode={companySubscription?.subscription_status === 'inactive' ? 'new' : subscriptionModalMode}
          canClose={true}
          refetchSubscription={refetchSubscription}
          currentSubscription={companySubscription}
          onSuccess={() => {
            setShowSubscriptionModal(false);
            refetchSubscription();
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default CompanySettings;
