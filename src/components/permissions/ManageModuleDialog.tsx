import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { companyServices } from "@/api/services";

interface ModuleAccess {
  module_name: string;
  display_name: string;
  enabled: boolean;
}

interface User {
  _id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  module_access?: string[];
}

interface ManageModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const ManageModuleDialog: React.FC<ManageModuleDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const queryClient = useQueryClient();
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([]);

  // Move the dropdownsData query inside the component
  const { data: dropdownsData } = useQuery({
    queryKey: ["master-modules-for-permissions"],
    queryFn: () =>
      companyServices
        .getMasterdropdownvalues({
          dropdown_name: ["company_superadmin_modules"],
        })
        .then((res) => res.data),
    enabled: open, // Only fetch when dialog is open
  });

  const { data: userModules } = useQuery({
    queryKey: ["user-modules", user?._id],
    queryFn: () => 
      user ? companyServices.getUserModules(user._id).then((res) => res.data.data) : Promise.resolve([]),
    enabled: !!user && open,
  });

  const updateModulesMutation = useMutation({
    mutationFn: ({ userId, modules }: { userId: string; modules: string[] }) =>
      companyServices.updateUserModules(userId, { modules }),
    onSuccess: () => {
      toast.success("User module access updated successfully");
      queryClient.invalidateQueries({ queryKey: ["company-users-permissions"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update module access");
    },
  });

  // Get available modules from dropdown data
  const availableModules =
    dropdownsData?.data?.find(
      (dropdown) => dropdown.dropdown_name === "company_superadmin_modules"
    )?.values || [];

  // Initialize module access when data is loaded
  useEffect(() => {
    if (availableModules.length > 0) {
      const initialModules = availableModules.map((module: any) => ({
        module_name: module.option_value,
        display_name: module.display_value,
        enabled: userModules?.includes(module.option_value) || false,
      }));
      setModuleAccess(initialModules);
    }
  }, [availableModules, userModules]);

  const handleModuleToggle = (moduleName: string, enabled: boolean) => {
    setModuleAccess(prev =>
      prev.map(module =>
        module.module_name === moduleName
          ? { ...module, enabled }
          : module
      )
    );
  };

  const handleSaveModules = () => {
    if (!user) return;

    const enabledModules = moduleAccess
      .filter(module => module.enabled)
      .map(module => module.module_name);

    updateModulesMutation.mutate({
      userId: user._id,
      modules: enabledModules,
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Manage Module Access - {user.first_name} {user.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4">
              {moduleAccess.map((module) => (
                <div 
                  key={module.module_name}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <Label className="font-medium text-sm">
                      {module.display_name}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {module.module_name}
                    </p>
                  </div>
                  <Switch
                    checked={module.enabled}
                    onCheckedChange={(checked) =>
                      handleModuleToggle(module.module_name, checked)
                    }
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveModules}
            disabled={updateModulesMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateModulesMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageModuleDialog;