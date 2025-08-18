
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';

const MasterPlans = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    price: 0,
    user_limit: 15,
    features: [],
    is_active: true
  });

  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.get('/api/master/plans');
      return response.data.data;
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await apiClient.put(`/api/master/plans/${editingPlan._id}`, formData);
        toast.success('Plan updated successfully');
      } else {
        await apiClient.post('/api/master/plans', formData);
        toast.success('Plan created successfully');
      }
      setIsDialogOpen(false);
      setEditingPlan(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        price: 0,
        user_limit: 15,
        features: [],
        is_active: true
      });
      refetch();
    } catch (error) {
      toast.error('Failed to save plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description,
      price: plan.price,
      user_limit: plan.user_limit,
      features: plan.features,
      is_active: plan.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId) => {
    try {
      await apiClient.delete(`/api/master/plans/${planId}`);
      toast.success('Plan deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  return (
    <DashboardLayout title="Subscription Plans">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Subscription Plans</h2>
            <p className="text-muted-foreground">Manage pricing plans and features</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPlan(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                <DialogDescription>
                  Configure the plan details and pricing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="basic, intermediate, pro"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                      placeholder="Basic Plan"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Plan description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="user_limit">User Limit</Label>
                    <Input
                      id="user_limit"
                      type="number"
                      value={formData.user_limit}
                      onChange={(e) => setFormData({ ...formData, user_limit: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPlan ? 'Update' : 'Create'} Plan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card key={plan._id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    {plan.display_name}
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(plan._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">${plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Up to {plan.user_limit} users
                    </p>
                    {plan.name === 'intermediate' && (
                      <p className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Customer Support
                      </p>
                    )}
                    {plan.name === 'pro' && (
                      <>
                        <p className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Customer Support
                        </p>
                        <p className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Custom UI Requirements
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Plans</CardTitle>
            <CardDescription>Complete overview of all subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>User Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Companies</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans?.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{plan.display_name}</p>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>${plan.price}/month</TableCell>
                      <TableCell>{plan.user_limit} users</TableCell>
                      <TableCell>
                        <Badge variant={plan.is_active ? "default" : "secondary"}>
                          {plan.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>0</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(plan._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MasterPlans;
