import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterServices, companyServices } from '@/api/services';

const MasterPlans = () => {
  const [perUserCost, setPerUserCost] = useState(0);
  const [moduleCosts, setModuleCosts] = useState<{ module_name: string; cost: number }[]>([]);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCost, setNewModuleCost] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // Fetch existing plan configuration
  const { data: planConfig, isLoading: planLoading } = useQuery({
    queryKey: ['plan-config'],
    queryFn: async () => {
      const response = await masterServices.getPlans();
      return response.data.data;
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await masterServices.createPlan(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['plan-config'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save plan configuration');
    }
  });

  // Load existing configuration
  useEffect(() => {
    if (planConfig) {
      setPerUserCost(planConfig.per_user_cost || 0);
      setModuleCosts(planConfig.module_costs || []);
    }
  }, [planConfig]);

  const handleAddModule = () => {
    if (!newModuleName || newModuleCost < 0) {
      toast.error('Please enter valid module name and cost');
      return;
    }

    const existingIndex = moduleCosts.findIndex(m => m.module_name === newModuleName);
    if (existingIndex >= 0) {
      toast.error('Module already exists');
      return;
    }

    setModuleCosts([...moduleCosts, { module_name: newModuleName, cost: newModuleCost }]);
    setNewModuleName('');
    setNewModuleCost(0);
  };

  const handleEditModule = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, newCost: number) => {
    if (newCost < 0) {
      toast.error('Cost cannot be negative');
      return;
    }

    const updated = [...moduleCosts];
    updated[index].cost = newCost;
    setModuleCosts(updated);
    setEditingIndex(null);
  };

  const handleDeleteModule = (index: number) => {
    const updated = moduleCosts.filter((_, i) => i !== index);
    setModuleCosts(updated);
  };

  const handleSaveConfiguration = async () => {
    if (perUserCost < 0) {
      toast.error('Per user cost cannot be negative');
      return;
    }

    const configData = {
      per_user_cost: perUserCost,
      module_costs: moduleCosts
    };

    updatePlanMutation.mutate(configData);
  };

  if (planLoading) {
    return (
      <DashboardLayout title="Plan Configuration">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
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
          <Button onClick={handleSaveConfiguration} disabled={updatePlanMutation.isPending}>
            {updatePlanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>

        {/* Per User Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Per User Cost</CardTitle>
            <CardDescription>
              Set the daily cost per user for the subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Label htmlFor="per_user_cost" className="w-24">Daily Cost:</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm">$</span>
                <Input
                  id="per_user_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={perUserCost}
                  onChange={(e) => setPerUserCost(parseFloat(e.target.value) || 0)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">per user per day</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Module Costs</CardTitle>
            <CardDescription>
              Configure daily cost for each module
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Module */}
            <div className="flex items-end space-x-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex-1">
                <Label htmlFor="module_select">Module</Label>
                <select
                  id="module_select"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select Module</option>
                  {moduleDropdowns?.map((module: any) => (
                    <option key={module.value} value={module.value}>
                      {module.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <Label htmlFor="module_cost">Daily Cost ($)</Label>
                <Input
                  id="module_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newModuleCost}
                  onChange={(e) => setNewModuleCost(parseFloat(e.target.value) || 0)}
                />
              </div>
              <Button onClick={handleAddModule} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            {/* Existing Modules */}
            {moduleCosts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module Name</TableHead>
                    <TableHead>Daily Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleCosts.map((module, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline">{module.module_name}</Badge>
                      </TableCell>
                      <TableCell>
                        {editingIndex === index ? (
                          <div className="flex items-center space-x-2">
                            <span>$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={module.cost}
                              className="w-24"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const target = e.target as HTMLInputElement;
                                  handleSaveEdit(index, parseFloat(target.value) || 0);
                                }
                              }}
                              onBlur={(e) => {
                                handleSaveEdit(index, parseFloat(e.target.value) || 0);
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <span>${module.cost.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditModule(index)}
                            disabled={editingIndex === index}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModule(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert>
                <AlertDescription>
                  No modules configured yet. Add modules from the dropdown above.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        {(perUserCost > 0 || moduleCosts.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Per User (Daily):</span>
                  <span>${perUserCost.toFixed(2)}</span>
                </div>
                {moduleCosts.map((module, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{module.module_name} (Daily):</span>
                    <span>${module.cost.toFixed(2)}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Example (10 users, 30 days, all modules):</span>
                  <span>
                    ${(
                      (perUserCost * 10 * 30) + 
                      (moduleCosts.reduce((sum, m) => sum + m.cost, 0) * 30)
                    ).toFixed(2)}
                  </span>
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
