import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Settings, Play, Pause, Trash2, Eye, Edit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { workflowServices } from '@/api/services';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WorkflowBuilder from '@/components/workflows/WorkflowBuilder';
import WorkflowStatsCards from '@/components/workflows/WorkflowStatsCards';

const WorkflowManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [page, setPage] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get workflows
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    queryKey: ['workflows', page, searchTerm, statusFilter, typeFilter],
    queryFn: () => workflowServices.getWorkflows({ 
      page, 
      search: searchTerm, 
      status: statusFilter, 
      type: typeFilter 
    }),
  });

  // Get workflow statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['workflow-stats'],
    queryFn: () => workflowServices.getWorkflowStats(),
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => workflowServices.deleteWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete workflow",
        variant: "destructive",
      });
    },
  });

  // Toggle workflow status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ workflowId, status }: { workflowId: string; status: string }) => 
      workflowServices.toggleWorkflowStatus(workflowId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
      toast({
        title: "Success", 
        description: "Workflow status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update workflow status",
        variant: "destructive",
      });
    },
  });

  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setIsBuilderOpen(true);
    setIsCreateDialogOpen(false);
  };

  const handleEditWorkflow = (workflow: any) => {
    setSelectedWorkflow(workflow);
    setIsBuilderOpen(true);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflowMutation.mutate(workflowId);
    }
  };

  const handleToggleStatus = (workflowId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    toggleStatusMutation.mutate({ workflowId, status: newStatus });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getWorkflowTypeLabel = (type: string) => {
    switch (type) {
      case 'vehicle_inbound':
        return 'Vehicle Inbound';
      case 'vehicle_property_trigger':
        return 'Property Trigger';
      case 'email_automation':
        return 'Email Automation';
      default:
        return type;
    }
  };

  return (
    <DashboardLayout title="Workflow Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Workflow Management</h1>
            <p className="text-muted-foreground">
              Create and manage automated workflows for your business processes
            </p>
          </div>
          <Button 
            onClick={handleCreateWorkflow}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </div>

        {/* Statistics Cards */}
        <WorkflowStatsCards stats={statsData?.data.data} isLoading={statsLoading} />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="vehicle_inbound">Vehicle Inbound</SelectItem>
                  <SelectItem value="vehicle_property_trigger">Property Trigger</SelectItem>
                  <SelectItem value="email_automation">Email Automation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Workflows List */}
        <div className="grid gap-4">
          {workflowsLoading ? (
            <div className="text-center py-8">Loading workflows...</div>
          ) : !workflowsData?.data?.data?.workflows?.length ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No workflows found</p>
                <Button 
                  onClick={handleCreateWorkflow}
                  className="mt-4"
                >
                  Create your first workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            workflowsData.data.data?.workflows.map((workflow: any) => (
              <Card key={workflow._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{workflow.name}</CardTitle>
                        <Badge variant={getStatusBadgeVariant(workflow.status)}>
                          {workflow.status}
                        </Badge>
                        <Badge variant="outline">
                          {getWorkflowTypeLabel(workflow.workflow_type)}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <CardDescription>{workflow.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(workflow._id, workflow.status)}
                        disabled={toggleStatusMutation.isPending}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow._id)}
                        disabled={deleteWorkflowMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Executions:</span>
                      <p>{workflow.execution_stats?.total_executions || 0}</p>
                    </div>
                    <div>
                      <span className="font-medium">Success Rate:</span>
                      <p>
                        {workflow.execution_stats?.total_executions > 0
                          ? Math.round(
                              ((workflow.execution_stats?.successful_executions || 0) /
                                workflow.execution_stats.total_executions) *
                                100
                            )
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <p>{new Date(workflow.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="font-medium">Last Modified:</span>
                      <p>{new Date(workflow.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {workflow.custom_endpoint && (
                    <div className="mt-4">
                      <Alert>
                        <AlertDescription>
                          <strong>Custom Endpoint:</strong> /api/workflow-execute/{workflow.custom_endpoint}
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Workflow Builder Modal */}
      <Dialog open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>
              {selectedWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
            </DialogTitle>
            <DialogDescription>
              Use the visual workflow builder to create and configure your automation
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <WorkflowBuilder 
              workflow={selectedWorkflow}
              onSave={() => {
                setIsBuilderOpen(false);
                queryClient.invalidateQueries({ queryKey: ['workflows'] });
                queryClient.invalidateQueries({ queryKey: ['workflow-stats'] });
              }}
              onCancel={() => setIsBuilderOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default WorkflowManagement;