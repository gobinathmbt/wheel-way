import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { dealershipServices, notificationConfigServices } from "@/api/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Info,
  Users,
  CheckCircle,
  Copy,
  Variable,
  Filter,
  Check,
} from "lucide-react";

interface EnhancedNotificationConfigFormProps {
  schemas: Record<string, any>;
  users: any[];
  dealerships?: any[];
  editData?: any;
  onSuccess: () => void;
}

interface FieldCondition {
  field_name: string;
  operator: string;
  value: any;
  condition: "and" | "or";
}

interface TargetUsers {
  type:
    | "all"
    | "specific_users"
    | "role_based"
    | "department_based"
    | "dealership_based";
  user_ids: string[];
  roles: string[];
  departments: string[];
  dealership_ids: string[];
  exclude_user_ids: string[];
}

interface MessageTemplate {
  title: string;
  body: string;
  action_url?: string;
  variables: Array<{
    variable_name: string;
    field_path: string;
  }>;
}

interface AvailableVariable {
  name: string;
  variable: string;
  description: string;
  category: 'data' | 'user' | 'system';
}

const EnhancedNotificationConfigForm: React.FC<
  EnhancedNotificationConfigFormProps
> = ({ schemas, users, dealerships = [], editData, onSuccess }) => {

  console.log("Schemas:", schemas); // Debugging line
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "create",
    target_schema: "",
    target_fields: [] as FieldCondition[],
    target_users: {
      type: "all",
      user_ids: [],
      roles: [],
      departments: [],
      dealership_ids: [],
      exclude_user_ids: [],
    } as TargetUsers,
    message_template: {
      title: "",
      body: "",
      action_url: "",
      variables: [],
    } as MessageTemplate,
    notification_channels: {
      in_app: true,
    },
    priority: "medium",
    is_active: true,
  });

  const [selectedSchemaFields, setSelectedSchemaFields] = useState<any[]>([]);
  const [availableVariables, setAvailableVariables] = useState<AvailableVariable[]>([]);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  const [titleInputRef, setTitleInputRef] = useState<HTMLInputElement | null>(null);
  const [bodyTextareaRef, setBodyTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // Initialize form with edit data
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        description: editData.description || "",
        trigger_type: editData.trigger_type || "create",
        target_schema: editData.target_schema || "",
        target_fields: editData.target_fields || [],
        target_users: editData.target_users || {
          type: "all",
          user_ids: [],
          roles: [],
          departments: [],
          dealership_ids: [],
          exclude_user_ids: [],
        },
        message_template: editData.message_template || {
          title: "",
          body: "",
          action_url: "",
          variables: [],
        },
        notification_channels: editData.notification_channels || {
          in_app: true,
        },
        priority: editData.priority || "medium",
        is_active: editData.is_active !== undefined ? editData.is_active : true,
      });
    }
  }, [editData]);

  // Get dealerships data
  const { data: dealershipsData } = useQuery({
    queryKey: ["company-dealerships"],
    queryFn: () => dealershipServices.getDealerships(),
    enabled: !dealerships.length,
  });

  const availableDealerships =
    dealerships.length > 0 ? dealerships : dealershipsData?.data?.data || [];

  // Update schema fields when target schema changes
  useEffect(() => {
    if (formData.target_schema && schemas[formData.target_schema]) {
      const schemaInfo = schemas[formData.target_schema];
      setSelectedSchemaFields(schemaInfo.fields || []);

      // Generate available variables for message templates
      const dataVariables: AvailableVariable[] = (schemaInfo.fields || []).map(
        (field: any) => ({
          name: field.field,
          variable: `{data.${field.field}}`,
          description: `${field.field} (${field.type})`,
          category: 'data' as const,
        })
      );

      const systemVariables: AvailableVariable[] = [
        {
          name: 'User First Name',
          variable: '{user.first_name}',
          description: 'First name of the notification recipient',
          category: 'user',
        },
        {
          name: 'User Last Name',
          variable: '{user.last_name}',
          description: 'Last name of the notification recipient',
          category: 'user',
        },
        {
          name: 'User Email',
          variable: '{user.email}',
          description: 'Email address of the notification recipient',
          category: 'user',
        },
        {
          name: 'Timestamp',
          variable: '{timestamp}',
          description: 'Current date and time when notification is sent',
          category: 'system',
        },
        {
          name: 'Date',
          variable: '{date}',
          description: 'Current date when notification is sent',
          category: 'system',
        },
        {
          name: 'Time',
          variable: '{time}',
          description: 'Current time when notification is sent',
          category: 'system',
        },
      ];

      setAvailableVariables([...dataVariables, ...systemVariables]);
    } else {
      setSelectedSchemaFields([]);
      setAvailableVariables([]);
    }
  }, [formData.target_schema, schemas]);

  // Copy to clipboard functionality
  const copyToClipboard = useCallback(async (text: string, variableName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVariable(variableName);
      toast({
        title: "Copied!",
        description: `Variable "${text}" copied to clipboard`,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedVariable(null);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedVariable(variableName);
        toast({
          title: "Copied!",
          description: `Variable "${text}" copied to clipboard`,
        });
        setTimeout(() => {
          setCopiedVariable(null);
        }, 2000);
      } catch (fallbackErr) {
        toast({
          title: "Copy failed",
          description: "Unable to copy to clipboard",
          variant: "destructive",
        });
      }
      document.body.removeChild(textArea);
    }
  }, [toast]);


  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => {
      if (editData) {
        return notificationConfigServices.updateNotificationConfiguration(
          editData._id,
          data
        );
      }
      return notificationConfigServices.createNotificationConfiguration(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Notification configuration ${
          editData ? "updated" : "created"
        } successfully`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          `Failed to ${editData ? "update" : "create"} configuration`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.target_schema) {
      toast({
        title: "Error",
        description: "Target schema is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.message_template.title.trim()) {
      toast({
        title: "Error",
        description: "Message title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.message_template.body.trim()) {
      toast({
        title: "Error",
        description: "Message body is required",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const addFieldCondition = () => {
    setFormData((prev) => ({
      ...prev,
      target_fields: [
        ...prev.target_fields,
        { field_name: "", operator: "equals", value: "", condition: "and" },
      ],
    }));
  };

  const updateFieldCondition = (
    index: number,
    updates: Partial<FieldCondition>
  ) => {
    setFormData((prev) => ({
      ...prev,
      target_fields: prev.target_fields.map((field, i) =>
        i === index ? { ...field, ...updates } : field
      ),
    }));
  };

  const removeFieldCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      target_fields: prev.target_fields.filter((_, i) => i !== index),
    }));
  };


  const getFieldEnumOptions = (fieldName: string) => {
    const field = selectedSchemaFields.find((f) => f.field === fieldName);
    return field?.enums || [];
  };

  const getOperatorOptions = () => [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does Not Contain" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "in", label: "In" },
    { value: "not_in", label: "Not In" },
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'data':
        return 'Schema Data';
      case 'user':
        return 'User Info';
      case 'system':
        return 'System';
      default:
        return 'Other';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'data':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'system':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {editData
            ? "Edit Notification Configuration"
            : "Create Notification Configuration"}
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="targets">Target Users</TabsTrigger>
          <TabsTrigger value="message">Message</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Basic Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter configuration name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe what this notification does"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger_type">Trigger Type *</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, trigger_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_schema">Target Schema *</Label>
                  <Select
                    value={formData.target_schema}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, target_schema: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schema" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(schemas).map((schemaName) => (
                        <SelectItem key={schemaName} value={schemaName}>
                          {schemaName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Field Conditions
              </CardTitle>
              <CardDescription>
                Define conditions that must be met for the notification to
                trigger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.target_fields.map((condition, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Condition {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFieldCondition(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-2">
                      <Label>Field</Label>
                      <Select
                        value={condition.field_name}
                        onValueChange={(value) =>
                          updateFieldCondition(index, { field_name: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedSchemaFields.map((field) => (
                            <SelectItem key={field.field} value={field.field}>
                              {field.field} ({field.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Operator</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateFieldCondition(index, { operator: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getOperatorOptions().map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Value</Label>
                      {getFieldEnumOptions(condition.field_name).length > 0 ? (
                        <Select
                          value={condition.value}
                          onValueChange={(value) =>
                            updateFieldCondition(index, { value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent>
                            {getFieldEnumOptions(condition.field_name).map(
                              (enumValue) => (
                                <SelectItem key={enumValue} value={enumValue}>
                                  {enumValue}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={condition.value}
                          onChange={(e) =>
                            updateFieldCondition(index, {
                              value: e.target.value,
                            })
                          }
                          placeholder="Enter value"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select
                        value={condition.condition}
                        onValueChange={(value: "and" | "or") =>
                          updateFieldCondition(index, { condition: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="and">AND</SelectItem>
                          <SelectItem value="or">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addFieldCondition}
                disabled={!formData.target_schema}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Target Users Tab */}
        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Target Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select
                  value={formData.target_users.type}
                  onValueChange={(value: any) =>
                    setFormData((prev) => ({
                      ...prev,
                      target_users: { ...prev.target_users, type: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific_users">
                      Specific Users
                    </SelectItem>
                    <SelectItem value="role_based">Role Based</SelectItem>
                    <SelectItem value="dealership_based">
                      Dealership Based
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.target_users.type === "specific_users" && (
                <div className="space-y-2">
                  <Label>Select Users</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <Checkbox
                          checked={formData.target_users.user_ids.includes(
                            user._id
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData((prev) => ({
                                ...prev,
                                target_users: {
                                  ...prev.target_users,
                                  user_ids: [
                                    ...prev.target_users.user_ids,
                                    user._id,
                                  ],
                                },
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                target_users: {
                                  ...prev.target_users,
                                  user_ids: prev.target_users.user_ids.filter(
                                    (id) => id !== user._id
                                  ),
                                },
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">
                          {user.first_name} {user.last_name} ({user.email})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.target_users.type === "role_based" && (
                <div className="space-y-2">
                  <Label>Select Roles</Label>
                  {["company_super_admin", "company_admin"].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.target_users.roles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData((prev) => ({
                              ...prev,
                              target_users: {
                                ...prev.target_users,
                                roles: [...prev.target_users.roles, role],
                              },
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              target_users: {
                                ...prev.target_users,
                                roles: prev.target_users.roles.filter(
                                  (r) => r !== role
                                ),
                              },
                            }));
                          }
                        }}
                      />
                      <span className="text-sm capitalize">
                        {role.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {formData.target_users.type === "dealership_based" && (
                <div className="space-y-2">
                  <Label>Select Dealerships</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {availableDealerships.map((dealership) => (
                      <div
                        key={dealership._id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <Checkbox
                          checked={formData.target_users.dealership_ids.includes(
                            dealership._id
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData((prev) => ({
                                ...prev,
                                target_users: {
                                  ...prev.target_users,
                                  dealership_ids: [
                                    ...prev.target_users.dealership_ids,
                                    dealership._id,
                                  ],
                                },
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                target_users: {
                                  ...prev.target_users,
                                  dealership_ids:
                                    prev.target_users.dealership_ids.filter(
                                      (id) => id !== dealership._id
                                    ),
                                },
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">
                          {dealership.dealership_name}{" "}
                          {dealership.dealership_address &&
                            `(${dealership.dealership_address})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Template Tab */}
        <TabsContent value="message" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Variable className="h-5 w-5" />
                Message Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <div className="flex gap-2">
                  <Input
                    id="title"
                    ref={setTitleInputRef}
                    value={formData.message_template.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message_template: {
                          ...prev.message_template,
                          title: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter notification title"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message Body *</Label>
                <Textarea
                  id="body"
                  ref={setBodyTextareaRef}
                  value={formData.message_template.body}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message_template: {
                        ...prev.message_template,
                        body: e.target.value,
                      },
                    }))
                  }
                  placeholder="Enter notification message"
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="action_url">Action URL (Optional)</Label>
                <Input
                  id="action_url"
                  value={formData.message_template.action_url}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message_template: {
                        ...prev.message_template,
                        action_url: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://example.com/action"
                />
              </div>

              {/* Available Variables */}
              {availableVariables.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Available Variables
                    </CardTitle>
                    <CardDescription>
                      Click to copy variables to clipboard, then paste them into your message template at the desired position
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Group variables by category */}
                      {['data', 'user', 'system'].map((category) => {
                        const categoryVariables = availableVariables.filter(v => v.category === category);
                        if (categoryVariables.length === 0) return null;
                        
                        return (
                          <div key={category} className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              {getCategoryLabel(category)}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {categoryVariables.map((variable) => (
                                <div key={variable.variable} className="relative">
                                  <Badge
                                    variant="outline"
                                    className={`cursor-pointer hover:bg-muted transition-all duration-200 ${getCategoryColor(category)} ${
                                      copiedVariable === variable.variable ? 'ring-2 ring-green-500' : ''
                                    }`}
                                    onClick={() => copyToClipboard(variable.variable, variable.variable)}
                                    title={variable.description}
                                  >
                                    {copiedVariable === variable.variable ? (
                                      <Check className="h-3 w-3 mr-1 text-green-600" />
                                    ) : (
                                      <Copy className="h-3 w-3 mr-1" />
                                    )}
                                    {variable.name}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <Separator className="my-4" />
                    
                  </CardContent>
                </Card>
              )}

              {/* Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Message Preview</CardTitle>
                  <CardDescription>
                    Preview how your notification will look (variables shown as placeholders)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <div className="font-medium text-sm mb-2">
                      {formData.message_template.title || "Notification Title"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formData.message_template.body || "Notification message body will appear here..."}
                    </div>
                    {formData.message_template.action_url && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" disabled>
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="min-w-32"
        >
          {createMutation.isPending ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
              {editData ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {editData ? "Update Configuration" : "Create Configuration"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default EnhancedNotificationConfigForm;