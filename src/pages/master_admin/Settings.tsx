
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/AuthContext';
import apiClient from '@/api/axios';

const MasterSettings = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [smtpSettings, setSmtpSettings] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth_user: '',
    auth_pass: '',
    from_name: 'VehiclePro Platform',
    from_email: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email
      };

      if (profileData.new_password) {
        if (profileData.new_password !== profileData.confirm_password) {
          toast.error('New passwords do not match');
          return;
        }
        updateData.current_password = profileData.current_password;
        updateData.new_password = profileData.new_password;
      }

      await apiClient.put('/api/master/profile', updateData);
      toast.success('Profile updated successfully');
      
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSmtpUpdate = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put('/api/master/smtp-settings', smtpSettings);
      toast.success('SMTP settings updated successfully');
    } catch (error) {
      toast.error('Failed to update SMTP settings');
    }
  };

  const testSmtpConnection = async () => {
    try {
      await apiClient.post('/api/master/test-smtp', smtpSettings);
      toast.success('SMTP connection test successful');
    } catch (error) {
      toast.error('SMTP connection test failed');
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account and system settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="smtp" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Settings
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      required
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <div>
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={profileData.current_password}
                        onChange={(e) => setProfileData({ ...profileData, current_password: e.target.value })}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          type="password"
                          value={profileData.new_password}
                          onChange={(e) => setProfileData({ ...profileData, new_password: e.target.value })}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm_password">Confirm Password</Label>
                        <Input
                          id="confirm_password"
                          type="password"
                          value={profileData.confirm_password}
                          onChange={(e) => setProfileData({ ...profileData, confirm_password: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMTP Settings */}
          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>Configure SMTP settings for sending emails to companies and users</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSmtpUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        value={smtpSettings.host}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp_port">SMTP Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={smtpSettings.port}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="auth_user">Email Address</Label>
                      <Input
                        id="auth_user"
                        type="email"
                        value={smtpSettings.auth_user}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, auth_user: e.target.value })}
                        placeholder="your-email@gmail.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="auth_pass">App Password</Label>
                      <Input
                        id="auth_pass"
                        type="password"
                        value={smtpSettings.auth_pass}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, auth_pass: e.target.value })}
                        placeholder="Your Gmail app password"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from_name">From Name</Label>
                      <Input
                        id="from_name"
                        value={smtpSettings.from_name}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, from_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="from_email">From Email</Label>
                      <Input
                        id="from_email"
                        type="email"
                        value={smtpSettings.from_email}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, from_email: e.target.value })}
                        placeholder="noreply@vehiclepro.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Save SMTP Settings
                    </Button>
                    <Button type="button" variant="outline" onClick={testSmtpConnection}>
                      Test Connection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>Manage system-wide settings and configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Platform Status</h4>
                      <p className="text-sm text-muted-foreground">Current system status and uptime</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Online</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Database Status</h4>
                      <p className="text-sm text-muted-foreground">MongoDB connection status</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Service</h4>
                      <p className="text-sm text-muted-foreground">SMTP service status</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MasterSettings;
