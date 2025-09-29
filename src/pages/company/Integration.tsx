import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Plug } from "lucide-react";
import { toast } from "sonner";
import { companyServices, integrationServices, masterServices } from "@/api/services";
import { useAuth } from "@/auth/AuthContext";
import S3ConfigDialog from "@/components/integrations/S3ConfigDialog";
import SendGridConfigDialog from "@/components/integrations/SendGridConfigDialog";
import RedBookConfigDialog from "@/components/integrations/RedBookConfigDialog";

interface Integration {
  _id: string;
  integration_type: string;
  display_name: string;
  configuration: any;
  is_active: boolean;
  created_at: string;
}

const Integration = () => {
  const { completeUser } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Fetch company integration modules
  const { data: modulesData } = useQuery({
    queryKey: ["company-integration-modules"],
    queryFn: async () => {
      const response = await companyServices.getMasterdropdownvalues({
        dropdown_name: ["company_integration_modules"],
      });
      return response.data;
    },
  });

  // Fetch existing integrations
  const { data: integrationsData, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await integrationServices.getIntegrations();
      return response.data;
    },
  });

  // Filter available modules based on company access
  const availableModules = React.useMemo(() => {
    if (!modulesData || !completeUser?.company_id?.module_access) return [];

    const integrationModules = modulesData.data?.find(
      (dropdown: any) => dropdown.dropdown_name === "company_integration_modules"
    );
    console.log("integrationModules", integrationModules);
    if (!integrationModules) return [];
    console.log("integrationModules", integrationModules);

    // Filter modules that exist in company's module_access
    return integrationModules.values.filter((module: any) =>
      completeUser.company_id.module_access.includes(module.option_value)
    );
  }, [modulesData, completeUser]);

  // Get existing integration for a module
  const getExistingIntegration = (moduleType: string) => {
    return integrationsData?.data?.find(
      (integration: Integration) => integration.integration_type === moduleType
    );
  };

  const handleConfigureModule = (moduleType: string) => {
    const existing = getExistingIntegration(moduleType);
    setSelectedIntegration(existing || null);
    setSelectedModule(moduleType);
  };

  const handleCloseDialog = () => {
    setSelectedModule(null);
    setSelectedIntegration(null);
    refetch();
  };

  const getModuleIcon = (moduleType: string) => {
    const icons: Record<string, any> = {
      s3_config: Plug,
      sendgrid: Plug,
      smtp: Plug,
      payment_gateway: Plug,
      api_integration: Plug,
      redbook_vehicle_pricing_integration: Plug,
    };
    const Icon = icons[moduleType] || Plug;
    return <Icon className="h-6 w-6" />;
  };

  const getModuleColor = (moduleType: string) => {
    const colors: Record<string, string> = {
      s3_config: "bg-blue-100 text-blue-800",
      sendgrid: "bg-green-100 text-green-800",
      smtp: "bg-purple-100 text-purple-800",
      payment_gateway: "bg-orange-100 text-orange-800",
      api_integration: "bg-pink-100 text-pink-800",
      redbook_vehicle_pricing_integration: "bg-red-100 text-red-800",
    };
    return colors[moduleType] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout title="Integrations">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
          <p className="text-muted-foreground">
            Configure and manage your system integrations
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {availableModules.map((module: any) => {
            const existingIntegration = getExistingIntegration(module.option_value);

            return (
              <Card key={module.option_value} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${getModuleColor(module.option_value)}`}>
                        {getModuleIcon(module.option_value)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{module.display_value}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {module.description || module.option_value}
                        </CardDescription>
                      </div>
                    </div>
                    {existingIntegration && (
                      <Badge
                        variant={existingIntegration.is_active ? "default" : "secondary"}
                        className={
                          existingIntegration.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {existingIntegration.is_active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant={existingIntegration ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    onClick={() => handleConfigureModule(module.option_value)}
                  >
                    {existingIntegration ? (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Set Up
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {availableModules.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plug className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No integrations available
              </p>
              <p className="text-sm text-muted-foreground">
                Contact your administrator to enable integration modules
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Configuration Dialogs */}
      {selectedModule === "s3_config" && (
        <S3ConfigDialog
          isOpen={true}
          onClose={handleCloseDialog}
          integration={selectedIntegration}
        />
      )}

      {selectedModule === "sendgrid" && (
        <SendGridConfigDialog
          isOpen={true}
          onClose={handleCloseDialog}
          integration={selectedIntegration}
        />
      )}

      {selectedModule === "redbook_vehicle_pricing_integration" && (
        <RedBookConfigDialog
          isOpen={true}
          onClose={handleCloseDialog}
          integration={selectedIntegration}
        />
      )}
    </DashboardLayout>
  );
};

export default Integration;