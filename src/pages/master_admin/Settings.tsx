
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, TestTube, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterServices } from '@/api/services';

const MasterSettings = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const queryClient = useQueryClient();

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });

  // SMTP form state
  const [smtpData, setSmtpData] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    from_email: '',
    from_name: ''
  });

  // AWS form state
  const [awsData, setAwsData] = useState({
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1',
    sqs_queue_url: ''
  });

  // Payment settings form state
  const [paymentData, setPaymentData] = useState({
    stripe: {
      public_key: '',
      secret_key: '',
      webhook_secret: ''
    },
    paypal: {
      client_id: '',
      client_secret: '',
      mode: 'sandbox'
    },
    razorpay: {
      key_id: '',
      key_secret: '',
      webhook_secret: ''
    }
  });

  // Fetch payment settings
  const { data: paymentSettings, isLoading: paymentLoading } = useQuery({
    queryKey: ['master-payment-settings'],
    queryFn: async () => {
      const response = await masterServices.getPaymentSettings();
      return response.data.data;
    }
  });

  // Load payment settings when data is available
  React.useEffect(() => {
    if (paymentSettings) {
      setPaymentData({
        stripe: {
          public_key: paymentSettings.stripe?.public_key || '',
          secret_key: paymentSettings.stripe?.secret_key || '',
          webhook_secret: paymentSettings.stripe?.webhook_secret || ''
        },
        paypal: {
          client_id: paymentSettings.paypal?.client_id || '',
          client_secret: paymentSettings.paypal?.client_secret || '',
          mode: paymentSettings.paypal?.mode || 'sandbox'
        },
        razorpay: {
          key_id: paymentSettings.razorpay?.key_id || '',
          key_secret: paymentSettings.razorpay?.key_secret || '',
          webhook_secret: paymentSettings.razorpay?.webhook_secret || ''
        }
      });
    }
  }, [paymentSettings]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await masterServices.updateProfile(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  // Update SMTP mutation
  const updateSmtpMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await masterServices.updateSmtpSettings(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('SMTP settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update SMTP settings');
    }
  });

  // Update payment settings mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await masterServices.updatePaymentSettings(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['master-payment-settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update payment settings');
    }
  });

  // Test SMTP mutation
  const testSmtpMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await masterServices.testSmtp(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('SMTP test successful');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'SMTP test failed');
    }
  });

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleUpdateSmtp = () => {
    updateSmtpMutation.mutate(smtpData);
  };

  const handleUpdatePayment = () => {
    updatePaymentMutation.mutate(paymentData);
  };

  const handleTestSmtp = () => {
    testSmtpMutation.mutate(smtpData);
  };

  return (
    <DashboardLayout title="System Settings">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
            <p className="text-muted-foreground">Manage your account and system settings</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="smtp">SMTP</TabsTrigger>
            <TabsTrigger value="aws">AWS</TabsTrigger>
            <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
                <Button onClick={handleUpdateProfile} disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Profile
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>
                  Configure email server settings for system notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={smtpData.host}
                      onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={smtpData.port}
                      onChange={(e) => setSmtpData({ ...smtpData, port: parseInt(e.target.value) || 587 })}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtp_secure"
                    checked={smtpData.secure}
                    onCheckedChange={(checked) => setSmtpData({ ...smtpData, secure: checked })}
                  />
                  <Label htmlFor="smtp_secure">Use SSL/TLS</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_user">Username</Label>
                    <Input
                      id="smtp_user"
                      value={smtpData.user}
                      onChange={(e) => setSmtpData({ ...smtpData, user: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">Password</Label>
                    <div className="relative">
                      <Input
                        id="smtp_password"
                        type={showPasswords ? 'text' : 'password'}
                        value={smtpData.password}
                        onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="from_email">From Email</Label>
                    <Input
                      id="from_email"
                      type="email"
                      value={smtpData.from_email}
                      onChange={(e) => setSmtpData({ ...smtpData, from_email: e.target.value })}
                      placeholder="noreply@yourcompany.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      value={smtpData.from_name}
                      onChange={(e) => setSmtpData({ ...smtpData, from_name: e.target.value })}
                      placeholder="Your Company"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleUpdateSmtp} disabled={updateSmtpMutation.isPending}>
                    {updateSmtpMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update SMTP
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleTestSmtp} disabled={testSmtpMutation.isPending}>
                    {testSmtpMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="mr-2 h-4 w-4" />
                        Test SMTP
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="aws">
            <Card>
              <CardHeader>
                <CardTitle>AWS Configuration</CardTitle>
                <CardDescription>
                  Configure AWS services for file storage and messaging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    AWS settings functionality will be implemented here
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Configuration</CardTitle>
                <CardDescription>
                  Configure payment gateways for subscription processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentLoading ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Stripe Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Stripe</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stripe_public_key">Publishable Key</Label>
                          <Input
                            id="stripe_public_key"
                            value={paymentData.stripe.public_key}
                            onChange={(e) => setPaymentData({
                              ...paymentData,
                              stripe: { ...paymentData.stripe, public_key: e.target.value }
                            })}
                            placeholder="pk_test_..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stripe_secret_key">Secret Key</Label>
                          <div className="relative">
                            <Input
                              id="stripe_secret_key"
                              type={showPasswords ? 'text' : 'password'}
                              value={paymentData.stripe.secret_key}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                stripe: { ...paymentData.stripe, secret_key: e.target.value }
                              })}
                              placeholder="sk_test_..."
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stripe_webhook_secret">Webhook Secret</Label>
                          <Input
                            id="stripe_webhook_secret"
                            type={showPasswords ? 'text' : 'password'}
                            value={paymentData.stripe.webhook_secret}
                            onChange={(e) => setPaymentData({
                              ...paymentData,
                              stripe: { ...paymentData.stripe, webhook_secret: e.target.value }
                            })}
                            placeholder="whsec_..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      {/* PayPal Configuration */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">PayPal</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="paypal_client_id">Client ID</Label>
                            <Input
                              id="paypal_client_id"
                              value={paymentData.paypal.client_id}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                paypal: { ...paymentData.paypal, client_id: e.target.value }
                              })}
                              placeholder="AXXLWct..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paypal_client_secret">Client Secret</Label>
                            <Input
                              id="paypal_client_secret"
                              type={showPasswords ? 'text' : 'password'}
                              value={paymentData.paypal.client_secret}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                paypal: { ...paymentData.paypal, client_secret: e.target.value }
                              })}
                              placeholder="EHrQ..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paypal_mode">Mode</Label>
                            <Select
                              value={paymentData.paypal.mode}
                              onValueChange={(value: 'sandbox' | 'live') => setPaymentData({
                                ...paymentData,
                                paypal: { ...paymentData.paypal, mode: value }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                                <SelectItem value="live">Live (Production)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      {/* Razorpay Configuration */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Razorpay</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="razorpay_key_id">Key ID</Label>
                            <Input
                              id="razorpay_key_id"
                              value={paymentData.razorpay.key_id}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                razorpay: { ...paymentData.razorpay, key_id: e.target.value }
                              })}
                              placeholder="rzp_test_..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="razorpay_key_secret">Key Secret</Label>
                            <Input
                              id="razorpay_key_secret"
                              type={showPasswords ? 'text' : 'password'}
                              value={paymentData.razorpay.key_secret}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                razorpay: { ...paymentData.razorpay, key_secret: e.target.value }
                              })}
                              placeholder="YOUR_SECRET_KEY"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="razorpay_webhook_secret">Webhook Secret</Label>
                            <Input
                              id="razorpay_webhook_secret"
                              type={showPasswords ? 'text' : 'password'}
                              value={paymentData.razorpay.webhook_secret}
                              onChange={(e) => setPaymentData({
                                ...paymentData,
                                razorpay: { ...paymentData.razorpay, webhook_secret: e.target.value }
                              })}
                              placeholder="WEBHOOK_SECRET"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-6">
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                          {showPasswords ? 'Hide' : 'Show'} Keys
                        </Button>
                      </div>
                      <Button onClick={handleUpdatePayment} disabled={updatePaymentMutation.isPending}>
                        {updatePaymentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Update Payment Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MasterSettings;
