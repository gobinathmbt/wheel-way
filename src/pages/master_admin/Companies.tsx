
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Users, Search, Plus, Eye, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/axios';
import { Switch } from "@/components/ui/switch";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { CompanyDetailsDialog, Company } from "./CompanyDetailsDialog";
import { CompanyEditDialog } from "./CompanyEditDialog";

const MasterCompanies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [deletePlanId, setDeletePlanId] = useState(null);
  const [page, setPage] = useState(1);
  const [editCompany, setEditCompany] = useState(null);


  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await apiClient.get('/api/master/companies');
      return response.data.data.companies;
    }
  });
console.log("companies", companies);
  const filteredCompanies = companies?.filter(company =>
    company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleDeleteCompany = async (companyId) => {
    if (!deletePlanId) return;
    try {
      await apiClient.delete(`/api/master/companies/${companyId}`);
      toast.success('Company deleted successfully');
      setDeletePlanId(null);
      refetch();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const handleViewDetails = (company) => {
  setSelectedCompany(company);
};

  const handleToggleStatus = async (companyId, currentStatus) => {
    try {
      await apiClient.patch(`/api/master/companies/${companyId}/status`, {
        is_active: !currentStatus
      });
      toast.success('Company status updated successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to update company status');
    }
  };

  return (
    <DashboardLayout title="Companies Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
            <p className="text-muted-foreground">Manage registered companies and their subscriptions</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{companies?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies?.filter(c => c.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {companies?.reduce((sum, c) => sum + c.current_user_count, 0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+3</div>
              <p className="text-xs text-muted-foreground">New registrations</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registered Companies</CardTitle>
            <CardDescription>View and manage all registered companies</CardDescription>
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
                    <TableHead>S.No</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company ,index: number) => (
                    <TableRow key={company._id}>
                      <TableCell>{(page - 1) * 10 + index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{company.company_name}</p>
                          <p className="text-sm text-muted-foreground">{company.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{company.contact_person}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.plan_id?.display_name}</Badge>
                      </TableCell>
                      <TableCell>
                        {company.current_user_count}/{company.user_limit}
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.is_active ? "default" : "secondary"}>
                          {company.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(company.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(company)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditCompany(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={company.is_active}
                            onCheckedChange={() => handleToggleStatus(company._id, company.is_active)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setDeletePlanId(company._id)}>
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
      <CompanyDetailsDialog
        open={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        company={selectedCompany}
      />
      <CompanyEditDialog
        open={!!editCompany}
        onClose={() => setEditCompany(null)}
        company={editCompany}
        onUpdated={refetch}
      />
      <ConfirmDeleteDialog
        open={!!deletePlanId}
        onClose={() => setDeletePlanId(null)}
        onConfirm={handleDeleteCompany}
      />
    </DashboardLayout>
  );
};

export default MasterCompanies;
