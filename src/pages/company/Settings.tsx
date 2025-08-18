
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Cloud, Link, CreditCard, Save, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/api/axios';

const CompanySettings = () => {
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

  const [planInfo] = useState({
    current_plan: 'Basic Plan',
    user_limit: 15,
    current_users: 8,
    billing_cycle: 'Monthly',
    next_billing: '2024-12-01',
    amount: 99
  });

  const handleS3Save = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put('/api/company/settings/s3', s3Config);
      toast.success('S3 configuration saved successfully');
    } catch (error) {
      toast.error('Failed to save S3 configuration');
    }
  };

  const handleCallbackSave = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put('/api/company/settings/callback', callbackConfig);
      toast.success('Callback URLs saved successfully');
    } catch (error) {
      toast.error('Failed to save callback URLs');
    }
  };

  const testS3Connection = async () => {
    try {
      await apiClient.post('/api/company/settings/test-s3', s3Config);
      toast.success('S3 connection test successful');
    } catch (error) {
      toast.error('S3 connection test failed');
    }
  };

  const testWebhook = async (type) => {
    try {
      const url = type === 'inspection' ? callbackConfig.inspection_callback_url : callbackConfig.tradein_callback_url;
      await apiClient.post('/api/company/settings/test-webhook', { url, type });
      toast.success(`${type} webhook test successful`);
    } catch (error) {
      toast.error(`${type} webhook test failed`);
    }
  };

  return (
    <DashboardLayout title="Company Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Company Settings</h2>
          <p className="text-muted-foreground">Configure your company's integrations and billing</p>
        </div>

        <Tabs defaultValue="storage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Cloud Storage
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing & Plan
            </TabsTrigger>
          </TabsList>

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
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Configuration
                    </Button>
                    <Button type="button" variant="outline" onClick={testS3Connection}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook Configuration */}
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
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save Webhooks
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => testWebhook('inspection')}
                    >
                      Test Inspection
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => testWebhook('tradein')}
                    >
                      Test Trade-in
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing & Plan */}
          <TabsContent value="billing">
            <div className="space-y-6">
              {/* Current Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Your subscription details and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Plan</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold">{planInfo.current_plan}</span>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Billing</Label>
                        <p className="text-2xl font-bold">${planInfo.amount}/{planInfo.billing_cycle.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">User Usage</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{planInfo.current_users}/{planInfo.user_limit}</span>
                          <span className="text-sm text-muted-foreground">users</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 mt-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{width: `${(planInfo.current_users / planInfo.user_limit) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Next Billing Date</Label>
                        <p className="text-lg font-medium">{new Date(planInfo.next_billing).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plan Upgrade */}
              <Card>
                <CardHeader>
                  <CardTitle>Upgrade Plan</CardTitle>
                  <CardDescription>Get more users and features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold">Basic</h3>
                      <p className="text-2xl font-bold">$99<span className="text-sm font-normal">/month</span></p>
                      <p className="text-sm text-muted-foreground">Up to 15 users</p>
                      <Badge variant="default" className="mt-2">Current</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold">Intermediate</h3>
                      <p className="text-2xl font-bold">$199<span className="text-sm font-normal">/month</span></p>
                      <p className="text-sm text-muted-foreground">Up to 30 users + Support</p>
                      <Button className="mt-2 w-full" variant="outline">Upgrade</Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold">Pro</h3>
                      <p className="text-2xl font-bold">$299<span className="text-sm font-normal">/month</span></p>
                      <p className="text-sm text-muted-foreground">Up to 50 users + Custom UI</p>
                      <Button className="mt-2 w-full" variant="outline">Upgrade</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>Your recent payments and invoices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: '2024-11-01', amount: 99, status: 'Paid', invoice: 'INV-001' },
                      { date: '2024-10-01', amount: 99, status: 'Paid', invoice: 'INV-002' },
                      { date: '2024-09-01', amount: 99, status: 'Paid', invoice: 'INV-003' }
                    ].map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{payment.invoice}</p>
                          <p className="text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${payment.amount}</p>
                          <Badge variant="default">{payment.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CompanySettings;
