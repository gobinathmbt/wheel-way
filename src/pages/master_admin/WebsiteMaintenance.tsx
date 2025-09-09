import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { masterServices } from "@/api/services";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Clock,
  Settings,
  Globe,
  Wrench,
  CalendarDays,
} from "lucide-react";

interface MaintenanceModule {
  module_name: string;
  is_enabled: boolean;
  message?: string;
  end_time?: string;
}

interface MaintenanceSettings {
  is_enabled: boolean;
  message: string;
  end_time?: string;
  modules: MaintenanceModule[];
}

interface ModuleOption {
  option_value: string;
  display_value: string;
  is_default: boolean;
  is_active: boolean;
  display_order: number;
  created_by: string;
  _id: string;
  created_at: string;
  updated_at: string;
}

const WebsiteMaintenance = () => {
  const { toast } = useToast();
  const [availableModules, setAvailableModules] = useState<ModuleOption[]>([]);
  const [modulesList, setModulesList] = useState<{value: string, label: string}[]>([]);

  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<MaintenanceSettings>({
    is_enabled: false,
    message:
      "We are currently performing maintenance on our website. Please check back later.",
    end_time: "",
    modules: [],
  });

  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await masterServices.getMasterdropdownvalues({
          dropdown_name: ["company_superadmin_modules"],
        });
        if (response.data.success) {
          const modules = response.data.data[0].values || [];
          setAvailableModules(modules);
          
          // Transform the modules data into the format needed for the UI
          const formattedModules = modules.map((module: ModuleOption) => ({
            value: module.option_value,
            label: module.display_value
          }));
          
          setModulesList(formattedModules);
        }
      } catch (error) {
        console.error("Failed to load modules:", error);
        toast({
          title: "Error",
          description: "Failed to load available modules",
          variant: "destructive",
        });
      }
    };
    loadModules();
  }, []);

  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ["maintenance-settings"],
    queryFn: async () => {
      const response = await masterServices.getMaintenanceSettings();
      return response.data.data;
    },
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: (data: MaintenanceSettings) =>
      masterServices.updateMaintenanceSettings(data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance settings updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["maintenance-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update maintenance settings",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (maintenanceData) {
      setSettings({
        ...maintenanceData,
        end_time: maintenanceData.end_time
          ? new Date(maintenanceData.end_time).toISOString().slice(0, 16)
          : "",
        modules: maintenanceData.modules || [],
      });
    }
  }, [maintenanceData]);

  const handleGlobalMaintenanceToggle = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      is_enabled: enabled,
    }));
  };

  const handleModuleMaintenanceToggle = (
    moduleName: string,
    enabled: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      modules: enabled
        ? [
            ...prev.modules.filter((m) => m.module_name !== moduleName),
            {
              module_name: moduleName,
              is_enabled: true,
              message: `The ${
                modulesList.find((m) => m.value === moduleName)?.label
              } module is currently under maintenance.`,
              end_time: "",
            },
          ]
        : prev.modules.filter((m) => m.module_name !== moduleName),
    }));
  };

  const handleModuleSettingChange = (
    moduleName: string,
    field: "message" | "end_time",
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.module_name === moduleName
          ? { ...module, [field]: value }
          : module
      ),
    }));
  };

  const handleSave = () => {
    const formattedSettings = {
      ...settings,
      end_time: settings.end_time
        ? new Date(settings.end_time).toISOString()
        : undefined,
      modules: settings.modules.map((module) => ({
        ...module,
        end_time: module.end_time
          ? new Date(module.end_time).toISOString()
          : undefined,
      })),
    };
    updateMaintenanceMutation.mutate(formattedSettings);
  };

  const getActiveMaintenanceCount = () => {
    let count = 0;
    if (settings.is_enabled) count++;
    count += settings.modules.filter((m) => m.is_enabled).length;
    return count;
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return "Not set";
    return new Date(dateTime).toLocaleString();
  };

  const getTimeRemaining = (endTime: string) => {
    if (!endTime) return null;
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Website Maintenance">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Website Maintenance">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Website Maintenance</h1>
            <p className="text-muted-foreground">
              Manage website and module maintenance settings
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge
              variant={
                getActiveMaintenanceCount() > 0 ? "destructive" : "secondary"
              }
            >
              {getActiveMaintenanceCount()} Active
            </Badge>
            <Button
              onClick={handleSave}
              disabled={updateMaintenanceMutation.isPending}
            >
              {updateMaintenanceMutation.isPending
                ? "Saving..."
                : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Global Website Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Global Website Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="global-maintenance">
                  Enable Global Maintenance
                </Label>
                <p className="text-sm text-muted-foreground">
                  This will put the entire website under maintenance
                </p>
              </div>
              <Switch
                id="global-maintenance"
                checked={settings.is_enabled}
                onCheckedChange={handleGlobalMaintenanceToggle}
              />
            </div>

            {settings.is_enabled && (
              <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">
                    Global maintenance is active
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="global-message">Maintenance Message</Label>
                  <Textarea
                    id="global-message"
                    value={settings.message}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Enter maintenance message..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="global-end-time">End Time (Optional)</Label>
                  <Input
                    id="global-end-time"
                    type="datetime-local"
                    value={settings.end_time}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        end_time: e.target.value,
                      }))
                    }
                  />
                  {settings.end_time && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeRemaining(settings.end_time)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Module-Specific Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Module-Specific Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modulesList.map((module, index) => {
                const moduleSettings = settings.modules.find(
                  (m) => m.module_name === module.value
                );
                const isEnabled = !!moduleSettings?.is_enabled;

                return (
                  <div key={module.value}>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            <span className="font-medium">{module.label}</span>
                          </div>
                          {isEnabled && (
                            <Badge variant="destructive">Maintenance</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Module: {module.value}
                        </p>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          handleModuleMaintenanceToggle(module.value, checked)
                        }
                      />
                    </div>

                    {isEnabled && moduleSettings && (
                      <div className="ml-4 mt-2 p-4 bg-destructive/5 rounded-lg border border-destructive/10 space-y-4">
                        <div className="space-y-2">
                          <Label>Module Maintenance Message</Label>
                          <Textarea
                            value={moduleSettings.message || ""}
                            onChange={(e) =>
                              handleModuleSettingChange(
                                module.value,
                                "message",
                                e.target.value
                              )
                            }
                            placeholder="Enter module-specific maintenance message..."
                            rows={2}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>End Time (Optional)</Label>
                          <Input
                            type="datetime-local"
                            value={
                              moduleSettings.end_time
                                ? new Date(moduleSettings.end_time)
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            }
                            onChange={(e) =>
                              handleModuleSettingChange(
                                module.value,
                                "end_time",
                                e.target.value
                              )
                            }
                          />
                          {moduleSettings.end_time && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                {getTimeRemaining(moduleSettings.end_time)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {index < modulesList.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {getActiveMaintenanceCount() > 0 && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Active Maintenance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {settings.is_enabled && (
                  <div className="flex items-center justify-between">
                    <span>Global Website Maintenance</span>
                    <Badge variant="destructive">Active</Badge>
                  </div>
                )}
                {settings.modules
                  .filter((m) => m.is_enabled)
                  .map((module) => (
                    <div
                      key={module.module_name}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {
                          modulesList.find(
                            (m) => m.value === module.module_name
                          )?.label
                        }
                      </span>
                      <Badge variant="destructive">Active</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WebsiteMaintenance;