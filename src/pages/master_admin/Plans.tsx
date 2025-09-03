
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Save, Trash2, Users, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';
import { companyServices, masterServices } from '@/api/services';

const MasterPlans = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [availableModules, setAvailableModules] = useState([]);
  const [planData, setPlanData] = useState({
    per_user_cost: 10,
    modules: []
  });

  console.log(planData)
  // Load current plan configuration
  const { data: currentPlan, isLoading, refetch } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: async () => {
      const response = await apiClient.get('/api/subscription/pricing-config');
      return response.data.data;
    }
  });

  // Load available modules
  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await masterServices.getMasterdropdownvalues({
          dropdown_name: ["company_superadmin_modules"],
        });
        if (response.data.success) {
          setAvailableModules(response.data.data[0].values || []);
        }
      } catch (error) {
        console.error('Failed to load modules:', error);
        toast.error('Failed to load available modules');
      }
    };
    loadModules();
  }, []);

  // Update form when current plan loads
  useEffect(() => {
    if (currentPlan) {
      setPlanData({
        per_user_cost: currentPlan.per_user_cost || 10,
        modules: currentPlan.modules || []
      });
    }
  }, [currentPlan]);
  console.log(currentPlan)

  const handleModuleCostChange = (moduleName, cost) => {
    setPlanData(prev => ({
      ...prev,
      modules: prev.modules.map(module => 
        module.module_name === moduleName 
          ? { ...module, cost_per_module: parseFloat(cost) || 0 }
          : module
      )
    }));
  };

  const addModule = (module) => {
    if (!planData.modules.find(m => m.module_name === module.option_value)) {
      setPlanData(prev => ({
        ...prev,
        modules: [...prev.modules, {
          module_name: module.option_value,
          display_value: module.display_value,
          cost_per_module: 0
        }]
      }));
    }
  };

  const removeModule = (moduleName) => {
    setPlanData(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.module_name !== moduleName)
    }));
  };

  const handleSave = async () => {
    try {
      if (currentPlan) {
        await apiClient.put(`/api/master/plans/${currentPlan._id}`, planData);
      } else {
        await apiClient.post('/api/master/plans', planData);
      }
      toast.success('Plan configuration saved successfully');
      refetch();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save plan configuration');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Plan Configuration">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Plan Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Plan Configuration</h2>
            <p className="text-muted-foreground">Configure pricing for users and modules</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Configure Pricing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configure Plan Pricing</DialogTitle>
                <DialogDescription>
                  Set the cost per user and per module for subscription calculation
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Per User Cost */}
                <div className="space-y-2">
                  <Label htmlFor="per_user_cost">Cost Per User (per day)</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="per_user_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={planData.per_user_cost}
                      onChange={(e) => setPlanData(prev => ({ 
                        ...prev, 
                        per_user_cost: parseFloat(e.target.value) || 0 
                      }))}
                      className="pl-10"
                      placeholder="10.00"
                    />
                  </div>
                </div>

                {/* Module Pricing */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Module Pricing (per day)</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Module
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Module</DialogTitle>
                          <DialogDescription>Select a module to add pricing</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          {availableModules
                            .filter(module => !planData.modules.find(m => m.module_name === module.value))
                            .map((module) => (
                            <Button
                              key={module.value}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => addModule(module)}
                            >
                              {module.display_value}
                            </Button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {planData.modules.map((module, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <Label className="capitalize">{module.module_name}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={module.cost_per_module}
                            onChange={(e) => handleModuleCostChange(module.module_name, e.target.value)}
                            className="w-20"
                            placeholder="0.00"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeModule(module.module_name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Configuration Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold">${currentPlan?.per_user_cost || 0}</div>
                <p className="text-muted-foreground">per user per day</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Module Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentPlan?.modules?.length > 0 ? (
                  currentPlan.modules.map((module, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="capitalize">{module.module_name}</span>
                      <Badge variant="outline">${module.cost_per_module}/day</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center">No modules configured</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Summary */}
        {currentPlan && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
              <CardDescription>Current pricing configuration overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">${currentPlan.per_user_cost}</div>
                  <p className="text-sm text-muted-foreground">Per User Daily</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{currentPlan.modules?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Configured Modules</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    ${(currentPlan.modules?.reduce((sum, m) => sum + m.cost_per_module, 0) || 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Module Cost/Day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MasterPlans;
