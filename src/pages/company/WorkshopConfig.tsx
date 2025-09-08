import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  workshopServices,
  vehicleServices,
  dropdownServices,
  configServices,
} from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Car,
  DollarSign,
  MessageSquare,
  FileText,
  ArrowLeft,
  Settings2,
  Eye,
  CheckCircle,
  Save,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { toast } from "sonner";
import QuoteModal from "@/components/workshop/QuoteModal";
import ReceivedQuotesModal from "@/components/workshop/ReceivedQuotesModal";
import ChatModal from "@/components/workshop/ChatModal";
import CombinedWorkModal from "@/components/workshop/CombinedWorkModal";
import DraggableWorkshopCategoriesList from "@/components/workshop/DraggableWorkshopCategoriesList";
import InsertWorkshopFieldModal from "@/components/workshop/InsertWorkshopFieldModal";
import { useAuth } from "@/auth/AuthContext";
import { Input } from "@/components/ui/input";

const WorkshopConfig = () => {
  const { vehicleId, vehicleType } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { completeUser } = useAuth();

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [editFieldModalOpen, setEditFieldModalOpen] = useState(false);
  const [selectedEditField, setSelectedEditField] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<any>(null);
  const [receivedQuotesModalOpen, setReceivedQuotesModalOpen] = useState(false);
  const [messagingModalOpen, setMessagingModalOpen] = useState(false);
  const [finalWorkModalOpen, setFinalWorkModalOpen] = useState(false);
  const [viewWorkModalOpen, setViewWorkModalOpen] = useState(false);
  const [rearrangeModalOpen, setRearrangeModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [inspectionOrder, setInspectionOrder] = useState([]);
  const [colorPaletteModalOpen, setColorPaletteModalOpen] = useState(false);
  const [insertFieldModalOpen, setInsertFieldModalOpen] = useState(false);
  const [selectedCategoryForField, setSelectedCategoryForField] = useState<
    string | null
  >(null);
  const [completeWorkshopModalOpen, setCompleteWorkshopModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [canCompleteWorkshop, setCanCompleteWorkshop] = useState(false);

  const { data: vehicleData, isLoading: vehicleLoading } = useQuery({
    queryKey: ["workshop-vehicle-details", vehicleId],
    queryFn: async () => {
      const response = await workshopServices.getWorkshopVehicleDetails(
        vehicleId!,
        vehicleType!
      );
      return response.data;
    },
    enabled: !!vehicleId,
  });

  const vehicle = vehicleData?.data?.vehicle;
  const vehicle_quotes = vehicleData?.data?.quotes;

  // Fetch dropdowns for workshop field creation
  const { data: dropdowns } = useQuery({
    queryKey: ["dropdowns-for-workshop"],
    queryFn: async () => {
      const response = await dropdownServices.getDropdowns();
      return response.data.data;
    },
  });

  // Fetch company settings for S3 config
  const { data: s3Config } = useQuery({
    queryKey: ["s3-config"],
    queryFn: async () => {
      const response = await configServices.getS3Config();
      return response.data.data;
    },
  });


  const deleteWorkshopFieldMutation = useMutation({
    mutationFn: async (fieldData: any) => {
      const currentResults =
        vehicleType === "inspection"
          ? vehicle?.inspection_result
          : vehicle?.trade_in_result;

      if (!currentResults) {
        throw new Error("No vehicle results found");
      }

      let updatedResults = [...currentResults];

      if (vehicleType === "inspection") {
        const categoryIndex = updatedResults.findIndex(
          (cat) => cat.category_id === fieldData.categoryId
        );

        if (categoryIndex !== -1) {
          const sectionIndex = updatedResults[
            categoryIndex
          ].sections?.findIndex(
            (section: any) => section.section_id === fieldData.sectionId
          );

          if (sectionIndex !== -1) {
            updatedResults[categoryIndex].sections[sectionIndex].fields =
              updatedResults[categoryIndex].sections[
                sectionIndex
              ].fields.filter((f: any) => f.field_id !== fieldData.field_id);
          }
        }
      } else {
        // For trade_in, handle both category-based and direct sections
        if (fieldData.categoryId) {
          // Handle category-based structure
          const categoryIndex = updatedResults.findIndex(
            (cat) => cat.category_id === fieldData.categoryId
          );

          if (categoryIndex !== -1) {
            const sectionIndex = updatedResults[
              categoryIndex
            ].sections?.findIndex(
              (section: any) => section.section_id === fieldData.sectionId
            );

            if (sectionIndex !== -1) {
              updatedResults[categoryIndex].sections[sectionIndex].fields =
                updatedResults[categoryIndex].sections[
                  sectionIndex
                ].fields.filter((f: any) => f.field_id !== fieldData.field_id);
            }
          }
        } else {
          // Handle direct section structure
          const sectionIndex = updatedResults.findIndex(
            (section: any) => section.section_id === fieldData.sectionId
          );

          if (sectionIndex !== -1) {
            updatedResults[sectionIndex].fields = updatedResults[
              sectionIndex
            ].fields.filter((f: any) => f.field_id !== fieldData.field_id);
          }
        }
      }

      const updateField =
        vehicleType === "inspection"
          ? { inspection_result: updatedResults }
          : { trade_in_result: updatedResults };

      await vehicleServices.updateVehicle(vehicle._id, updateField);
      return updatedResults;
    },
    onSuccess: () => {
      toast.success("Workshop field deleted successfully");
      setDeleteConfirmOpen(false);
      setFieldToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["workshop-vehicle-details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete workshop field");
    },
  });

  // Update field mutation
  const updateWorkshopFieldMutation = useMutation({
    mutationFn: async (fieldData: any) => {
      const currentResults =
        vehicleType === "inspection"
          ? vehicle?.inspection_result
          : vehicle?.trade_in_result;

      if (!currentResults) {
        throw new Error("No vehicle results found");
      }

      let updatedResults = [...currentResults];

      if (vehicleType === "inspection") {
        const categoryIndex = updatedResults.findIndex(
          (cat) => cat.category_id === fieldData.categoryId
        );

        if (categoryIndex !== -1) {
          const sectionIndex = updatedResults[
            categoryIndex
          ].sections?.findIndex(
            (section: any) => section.section_id === fieldData.sectionId
          );

          if (sectionIndex !== -1) {
            const fieldIndex = updatedResults[categoryIndex].sections[
              sectionIndex
            ].fields.findIndex((f: any) => f.field_id === fieldData.field_id);

            if (fieldIndex !== -1) {
              updatedResults[categoryIndex].sections[sectionIndex].fields[
                fieldIndex
              ] = fieldData;
            }
          }
        }
      } else {
        // For trade_in, handle both category-based and direct sections
        if (fieldData.categoryId) {
          // Handle category-based structure
          const categoryIndex = updatedResults.findIndex(
            (cat) => cat.category_id === fieldData.categoryId
          );

          if (categoryIndex !== -1) {
            const sectionIndex = updatedResults[
              categoryIndex
            ].sections?.findIndex(
              (section: any) => section.section_id === fieldData.sectionId
            );

            if (sectionIndex !== -1) {
              const fieldIndex = updatedResults[categoryIndex].sections[
                sectionIndex
              ].fields.findIndex((f: any) => f.field_id === fieldData.field_id);

              if (fieldIndex !== -1) {
                updatedResults[categoryIndex].sections[sectionIndex].fields[
                  fieldIndex
                ] = fieldData;
              }
            }
          }
        } else {
          // Handle direct section structure
          const sectionIndex = updatedResults.findIndex(
            (section: any) => section.section_id === fieldData.sectionId
          );

          if (sectionIndex !== -1) {
            const fieldIndex = updatedResults[sectionIndex].fields.findIndex(
              (f: any) => f.field_id === fieldData.field_id
            );

            if (fieldIndex !== -1) {
              updatedResults[sectionIndex].fields[fieldIndex] = fieldData;
            }
          }
        }
      }

      const updateField =
        vehicleType === "inspection"
          ? { inspection_result: updatedResults }
          : { trade_in_result: updatedResults };

      await vehicleServices.updateVehicle(vehicle._id, updateField);
      return updatedResults;
    },
    onSuccess: () => {
      toast.success("Workshop field updated successfully");
      setEditFieldModalOpen(false);
      setSelectedEditField(null);
      queryClient.invalidateQueries({ queryKey: ["workshop-vehicle-details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update workshop field");
    },
  });

  // Update vehicle inspection order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (newOrder: any) => {
      const updateField =
        vehicleType === "inspection"
          ? { inspection_result: newOrder }
          : { trade_in_result: newOrder };

      await vehicleServices.updateVehicle(vehicle._id, updateField);
    },
    onSuccess: () => {
      toast.success(`${vehicleType} order updated successfully`);
      queryClient.invalidateQueries({ queryKey: ["workshop-vehicle-details"] });
      setRearrangeModalOpen(false);
      // Update the local state as well
      setInspectionOrder([]);
    },
    onError: (error: any) => {
      toast.error(`Failed to update ${vehicleType} order`);
      console.error("Update order error:", error);
    },
  });

  // Complete workshop mutation
  const completeWorkshopMutation = useMutation({
    mutationFn: async (confirmation: string) => {
      return await workshopServices.completeWorkshop(vehicleId!, vehicleType!, { confirmation });
    },
    onSuccess: (response) => {
      toast.success(response.data.message);
      setCompleteWorkshopModalOpen(false);
      setConfirmText("");
      queryClient.invalidateQueries({ queryKey: ["workshop-vehicle-details"] });
      queryClient.invalidateQueries({ queryKey: ["workshop-completion"] });
      // Navigate back to workshop list
      setTimeout(() => navigate("/company/workshop"), 2000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete workshop');
    },
  });

  const handleSendQuote = (
    field: any,
    categoryId: string,
    sectionId: string
  ) => {
    setSelectedField({
      ...field,
      categoryId,
      sectionId,
      vehicle_type: vehicle?.vehicle_type,
      vehicle_stock_id: vehicle?.vehicle_stock_id,
      images: field.images || [],
      videos: field.videos || [],
    });
    setQuoteModalOpen(true);
  };
  const handleReceivedQuotes = (
    field: any,
    categoryId: string,
    sectionId: string
  ) => {
    setSelectedField({
      ...field,
      categoryId,
      sectionId,
      vehicle_type: vehicle?.vehicle_type,
      vehicle_stock_id: vehicle?.vehicle_stock_id,
    });
    setReceivedQuotesModalOpen(true);
  };

  const handleMessaging = (
    field: any,
    categoryId: string,
    sectionId: string
  ) => {
    setSelectedField({
      ...field,
      categoryId,
      sectionId,
      quote: getQuote(field.field_id),
      vehicle_type: vehicle?.vehicle_type,
      vehicle_stock_id: vehicle?.vehicle_stock_id,
    });
    setMessagingModalOpen(true);
  };

  const handleFinalWork = (
    field: any,
    categoryId: string,
    sectionId: string
  ) => {
    setSelectedField({
      ...field,
      categoryId,
      sectionId,
      vehicle_type: vehicle?.vehicle_type,
      vehicle_stock_id: vehicle?.vehicle_stock_id,
    });
    setFinalWorkModalOpen(true);
  };

  const handleViewWork = (
    field: any,
    categoryId: string,
    sectionId: string
  ) => {
    setSelectedField({
      ...field,
      categoryId,
      sectionId,
      vehicle_type: vehicle?.vehicle_type,
      vehicle_stock_id: vehicle?.vehicle_stock_id,
    });
    setViewWorkModalOpen(true);
  };
  const handleRearrange = () => {
    // Determine which result set to use based on vehicle type
    const resultData =
      vehicleType === "inspection"
        ? vehicle?.inspection_result
        : vehicle?.trade_in_result;

    if (resultData) {
      setInspectionOrder([...resultData]);
      setRearrangeModalOpen(true);
    }
  };

  // Drag and Drop Handlers
  const handleUpdateCategoriesOrder = (categories: any[]) => {
    setInspectionOrder(categories);
  };

  const handleUpdateSectionsOrder = (
    categoryIndex: number,
    sections: any[]
  ) => {
    const newOrder = [...inspectionOrder];
    newOrder[categoryIndex] = {
      ...newOrder[categoryIndex],
      sections: sections,
    };
    setInspectionOrder(newOrder);
  };

  const handleUpdateFieldsOrder = (
    categoryIndex: number,
    sectionIndex: number,
    fields: any[]
  ) => {
    const newOrder = [...inspectionOrder];
    newOrder[categoryIndex].sections[sectionIndex] = {
      ...newOrder[categoryIndex].sections[sectionIndex],
      fields: fields,
    };
    setInspectionOrder(newOrder);
  };

  const handleSaveOrder = () => {
    if (inspectionOrder.length > 0) {
      updateOrderMutation.mutate(inspectionOrder);
    } else {
      toast.error("No changes to save");
    }
  };

  // Workshop field creation
  const handleInsertField = (categoryId?: string) => {
    setSelectedCategoryForField(categoryId || null);
    setInsertFieldModalOpen(true);
  };

  // Add workshop field mutation
  const addWorkshopFieldMutation = useMutation({
    mutationFn: async (fieldData: any) => {
      const currentResults =
        vehicleType === "inspection"
          ? vehicle?.inspection_result
          : vehicle?.trade_in_result;

      if (!currentResults) {
        throw new Error("No vehicle results found");
      }

      let updatedResults = [...currentResults];

      if (vehicleType === "inspection") {
        // Find the category to add field to
        const categoryIndex = updatedResults.findIndex(
          (cat) => cat.category_id === selectedCategoryForField
        );

        if (categoryIndex === -1) {
          throw new Error("Category not found");
        }

        // Find or create "at_workshop" section
        let workshopSectionIndex = updatedResults[
          categoryIndex
        ].sections?.findIndex(
          (section: any) => section.section_name === "at_workshop"
        );

        if (workshopSectionIndex === -1) {
          // Create new workshop section
          const newWorkshopSection = {
            section_id: `workshop_section_${Date.now()}`,
            section_name: "At Workshop - Add On",
            section_display_name: "at_workshop_onstaging",
            display_order: updatedResults[categoryIndex].sections?.length || 0,
            fields: [],
          };

          if (!updatedResults[categoryIndex].sections) {
            updatedResults[categoryIndex].sections = [];
          }

          updatedResults[categoryIndex].sections.push(newWorkshopSection);
          workshopSectionIndex =
            updatedResults[categoryIndex].sections.length - 1;
        }

        // Add field to workshop section
        updatedResults[categoryIndex].sections[
          workshopSectionIndex
        ].fields.push(fieldData);
      } else {
        // For trade_in, find or create workshop section as direct section
        let workshopSectionIndex = updatedResults.findIndex(
          (item: any) =>
            item.section_id &&
            (item.section_name === "at_workshop" ||
              item.section_name.includes("workshop"))
        );

        if (workshopSectionIndex === -1) {
          // Create new workshop section as direct section
          const newWorkshopSection = {
            section_id: `workshop_section_${Date.now()}`,
            section_name: "At Workshop - Add On",
            section_display_name: "at_workshop_onstaging",
            display_order: updatedResults.length,
            fields: [fieldData],
          };

          updatedResults.push(newWorkshopSection);
        } else {
          // Add field to existing workshop section
          if (!updatedResults[workshopSectionIndex].fields) {
            updatedResults[workshopSectionIndex].fields = [];
          }
          updatedResults[workshopSectionIndex].fields.push(fieldData);
        }
      }

      // Update vehicle with new results
      const updateField =
        vehicleType === "inspection"
          ? { inspection_result: updatedResults }
          : { trade_in_result: updatedResults };

      await vehicleServices.updateVehicle(vehicle._id, updateField);
      return updatedResults;
    },
    onSuccess: () => {
      toast.success("Workshop field added successfully");
      setInsertFieldModalOpen(false);
      setSelectedCategoryForField(null);
      queryClient.invalidateQueries({ queryKey: ["workshop-vehicle-details"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add workshop field");
      console.error("Add workshop field error:", error);
    },
  });

  const handleDiscardChanges = () => {
    setInspectionOrder([]);
    setRearrangeModalOpen(false);
  };

  const getStatus = (field_id: string) => {
    if (!vehicle_quotes) return null; // handle undefined

    const quote = vehicle_quotes.find((q) => q.field_id === field_id);
    return quote ? quote.status : null; // return status or null if not found
  };

  const getQuote = (field_id: string) => {
    if (!vehicle_quotes) return null;
    return vehicle_quotes.find((q) => q.field_id === field_id);
  };
  const getFieldBorderColor = (field: any) => {
    const status = getStatus(field.field_id);

    const statusToBorder: Record<string, string> = {
      quote_request: "border-yellow-500 border-2",
      quote_sent: "border-orange-500 border-2",
      quote_approved: "border-blue-500 border-2",
      work_in_progress: "border-purple-500 border-2",
      work_review: "border-indigo-500 border-2",
      completed_jobs: "border-green-500 border-2",
      rework: "border-red-500 border-2",
    };

    return statusToBorder[status] || "border-yellow-500 border-2";
  };
  const getBadgeColor = (status: string | undefined) => {
    const statusToBadge: Record<string, string> = {
      quote_request: "bg-yellow-500 text-white",
      quote_sent: "bg-orange-500 text-white",
      quote_approved: "bg-blue-500 text-white",
      work_in_progress: "bg-purple-500 text-white",
      work_review: "bg-indigo-500 text-white",
      completed_jobs: "bg-green-500 text-white",
      rework: "bg-red-500 text-white",
    };

    return `px-2 py-1 rounded-md text-xs font-semibold ${
      statusToBadge[status || ""] || "bg-gray-500 text-white"
    }`;
  };

  const handleEditField = (
    field: any,
    categoryId: string | null,
    sectionId: string
  ) => {
    setSelectedEditField({
      ...field,
      categoryId,
      sectionId,
    });
    setEditFieldModalOpen(true);
  };

  const handleDeleteField = (
    field: any,
    categoryId: string | null,
    sectionId: string
  ) => {
    setFieldToDelete({
      ...field,
      categoryId,
      sectionId,
    });
    setDeleteConfirmOpen(true);
  };

  const handleCompleteWorkshop = () => {
    if (canCompleteWorkshop) {
      setCompleteWorkshopModalOpen(true);
    } else {
      toast.error("All workshop jobs must be completed before finishing workshop");
    }
  };

  const handleConfirmCompleteWorkshop = () => {
    if (confirmText === "CONFIRM") {
      completeWorkshopMutation.mutate(confirmText);
    } else {
      toast.error("Please type CONFIRM to complete workshop");
    }
  };

  if (vehicleLoading) {
    return (
      <DashboardLayout title="Workshop Configuration">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout title="Workshop Configuration">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Vehicle not found</p>
        </div>
      </DashboardLayout>
    );
  }

  const renderResults = (vehicleType: string) => {
    const resultData =
      vehicleType === "inspection"
        ? vehicle.inspection_result
        : vehicle.trade_in_result;

    console.log("Result Data:", resultData);

    if (!resultData || resultData.length === 0) {
      return (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No {vehicleType} results available
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/company/workshop")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {/* Fixed Header Section */}
        <div className="sticky top-0 z-10 bg-background py-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {vehicleType
                ? vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)
                : ""}{" "}
              Results
            </h3>

            <div className="flex gap-2">
              {/* Insert Field button for tradein (no categories) */}
              {vehicleType === "tradein" && (
                <Button
                  variant="default"
                  onClick={() => handleInsertField()}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Insert Field
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleRearrange}
                className="flex items-center gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Rearrange
              </Button>

              <Button
                variant="outline"
                onClick={() => setColorPaletteModalOpen(true)}
                className="flex items-center gap-2"
              >
                🎨 Stage Legend
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate("/company/workshop")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>

              {/* Complete Workshop Button */}
              <Button
                variant="default"
                onClick={() => handleCompleteWorkshop()}
                disabled={!canCompleteWorkshop || completeWorkshopMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {completeWorkshopMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Workshop
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="pt-4">
          {vehicleType === "inspection"
            ? // Render inspection results (categories with sections)
              resultData.map((category: any, categoryIndex: number) => (
                <Card key={categoryIndex} className="mb-4">
                  {category.sections?.length > 0 && (
                    <>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{category.category_name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {category.sections?.length || 0} Sections
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleInsertField(category.category_id)
                              }
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Insert Field
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="w-full">
                          {category.sections?.map(
                            (section: any, sectionIndex: number) => (
                              <AccordionItem
                                key={sectionIndex}
                                value={`section-${categoryIndex}-${sectionIndex}`}
                              >
                                {section.fields?.length > 0 && (
                                  <>
                                    <AccordionTrigger>
                                      <div className="flex items-center justify-between w-full mr-4">
                                        <span>{section.section_name}</span>
                                        <Badge variant="outline">
                                          {section.fields?.length || 0} Fields
                                        </Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="space-y-4">
                                        {section.fields?.map(
                                          (field: any, fieldIndex: number) => (
                                            <div
                                              key={fieldIndex}
                                              className={`rounded-lg p-4 ${getFieldBorderColor(
                                                field
                                              )}`}
                                            >
                                              {renderFieldContent(
                                                field,
                                                category.category_id,
                                                section.section_id
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </>
                                )}
                              </AccordionItem>
                            )
                          )}
                        </Accordion>
                      </CardContent>
                    </>
                  )}
                </Card>
              ))
            : // Render trade-in results (mixed structure - both categories and direct sections)
              resultData.map((item: any, itemIndex: number) => {
                // Check if this is a category (has category_id and sections) or a direct section
                const isCategory = item.category_id && item.sections;
                const isDirectSection = item.section_id && item.fields;

                if (isCategory) {
                  // Render as category with sections
                  return (
                    <Card key={itemIndex} className="mb-4">
                      {item.sections?.length > 0 && (
                        <>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>{item.category_name}</span>
                              <Badge variant="secondary">
                                {item.sections?.length || 0} Sections
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Accordion type="multiple" className="w-full">
                              {item.sections?.map(
                                (section: any, sectionIndex: number) => (
                                  <AccordionItem
                                    key={sectionIndex}
                                    value={`section-${itemIndex}-${sectionIndex}`}
                                  >
                                    {section.fields?.length > 0 && (
                                      <>
                                        <AccordionTrigger>
                                          <div className="flex items-center justify-between w-full mr-4">
                                            <span>{section.section_name}</span>
                                            <Badge variant="outline">
                                              {section.fields?.length || 0}{" "}
                                              Fields
                                            </Badge>
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                          <div className="space-y-4">
                                            {section.fields?.map(
                                              (
                                                field: any,
                                                fieldIndex: number
                                              ) => (
                                                <div
                                                  key={fieldIndex}
                                                  className={`rounded-lg p-4 ${getFieldBorderColor(
                                                    field
                                                  )}`}
                                                >
                                                  {renderFieldContent(
                                                    field,
                                                    item.category_id,
                                                    section.section_id
                                                  )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </AccordionContent>
                                      </>
                                    )}
                                  </AccordionItem>
                                )
                              )}
                            </Accordion>
                          </CardContent>
                        </>
                      )}
                    </Card>
                  );
                } else if (isDirectSection) {
                  // Render as direct section
                  return (
                    <Card key={itemIndex} className="mb-4">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{item.section_name}</span>
                          <Badge variant="secondary">
                            {item.fields?.length || 0} Fields
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {item.fields?.length > 0 && (
                          <div className="space-y-4">
                            {item.fields?.map(
                              (field: any, fieldIndex: number) => (
                                <div
                                  key={fieldIndex}
                                  className={`rounded-lg p-4 ${getFieldBorderColor(
                                    field
                                  )}`}
                                >
                                  {renderFieldContent(
                                    field,
                                    null, // No category for direct sections
                                    item.section_id
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }

                return null; // Skip unknown structures
              })}
        </div>
      </div>
    );
  };

  const renderFieldContent = (
    field: any,
    categoryId: string | null, // Allow null for direct sections
    sectionId: string
  ) => {
    const isWorkshopField =
      field.section_display_name === "at_workshop_onstaging" ||
      sectionId.includes("workshop_section");

    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{field.field_name}</h4>
          <div className="flex items-center gap-2">
            <Badge className={getBadgeColor(getStatus(field.field_id))}>
              {getStatus(field.field_id) || "Not Progressed"}
            </Badge>

            {/* Workshop field edit/delete buttons */}
            {isWorkshopField && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditField(field, categoryId, sectionId)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    handleDeleteField(field, categoryId, sectionId)
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Rest of the existing button logic remains the same */}
            {(() => {
              const quote = getQuote(field.field_id);
              const hasQuote = !!quote;
              const quoteApproved = getQuote(
                field.field_id
              )?.supplier_responses.some((q) => q.status === "approved");

              if (!quoteApproved) {
                return (
                  <Button
                    size="sm"
                    onClick={() =>
                      handleSendQuote(field, categoryId, sectionId)
                    }
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    {hasQuote ? "Update Quote" : "Request For Quote"}
                  </Button>
                );
              }
            })()}

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReceivedQuotes(field, categoryId, sectionId)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Received Quotes
            </Button>

            {(() => {
              const quote = getQuote(field.field_id);
              const hasWorkSubmitted = quote?.status === "work_review";

              if (hasWorkSubmitted) {
                return (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewWork(field, categoryId, sectionId)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Work
                  </Button>
                );
              }
              return null;
            })()}

            {(() => {
              const quote = getQuote(field.field_id);
              const hasWorkSubmitted = quote?.status === "completed_jobs";

              if (hasWorkSubmitted) {
                return (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleFinalWork(field, categoryId, sectionId)
                    }
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Final Work
                  </Button>
                );
              }
              return null;
            })()}

            {getQuote(field.field_id)?.supplier_responses.some(
              (q) => q.status === "approved"
            ) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMessaging(field, categoryId, sectionId)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Message
              </Button>
            )}
          </div>
        </div>

        {/* Rest of the field content rendering remains the same */}
        {field.field_value && (
          <div className="text-sm text-muted-foreground mb-2">
            Value:{" "}
            {typeof field.field_value === "object"
              ? JSON.stringify(field.field_value)
              : field.field_value}
          </div>
        )}

        {field.images && field.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {field.images.map((image: string, imgIndex: number) => (
              <img
                key={imgIndex}
                src={image}
                alt={`${field.field_name} image ${imgIndex + 1}`}
                className="w-full h-20 object-cover rounded"
              />
            ))}
          </div>
        )}
        {field.videos && field.videos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {field.videos.map((video: string, vidIndex: number) => (
              <video
                key={vidIndex}
                src={video}
                controls
                className="w-full h-20 object-cover rounded"
              >
                Your browser does not support the video tag.
              </video>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <DashboardLayout title="Workshop Configuration">
      <div className="flex flex-col h-full">
        {/* Scrollable Content Area */}
        <div className="flex-1 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-10 h-full gap-6">
            {/* Left Panel - 70% - Inspection Results with Scroll */}
            <div className="lg:col-span-7 h-full overflow-hidden">
              <div className="h-full overflow-y-auto pr-2">
                {renderResults(vehicleType)}
              </div>
            </div>

            {/* Right Panel - 30% - Vehicle Details with Scroll */}
            <div className="lg:col-span-3 h-full overflow-hidden">
              <div className="h-full overflow-y-auto">
                <Card className="h-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hero Image */}
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src={vehicle.vehicle_hero_image}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        {vehicle.name ||
                          `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Stock ID:
                          </span>
                          <p className="font-medium">
                            {vehicle.vehicle_stock_id}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium capitalize">
                            {vehicle.vehicle_type}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">VIN:</span>
                          <p className="font-medium">{vehicle.vin}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Plate:</span>
                          <p className="font-medium">{vehicle.plate_no}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Specs */}
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Specifications</h4>
                      <div className="space-y-1 text-sm">
                        {vehicle.variant && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Variant:
                            </span>
                            <span>{vehicle.variant}</span>
                          </div>
                        )}
                        {vehicle.body_style && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Body Style:
                            </span>
                            <span>{vehicle.body_style}</span>
                          </div>
                        )}
                        {vehicle.chassis_no && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Chassis:
                            </span>
                            <span>{vehicle.chassis_no}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant={
                            vehicle.status === "completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {vehicle.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {selectedField && (
          <>
            <QuoteModal
              open={quoteModalOpen}
              onOpenChange={setQuoteModalOpen}
              field={selectedField}
              existingQuote={getQuote(selectedField.field_id)}
              onSuccess={() => {
                setQuoteModalOpen(false);
                setSelectedField(null);
                queryClient.invalidateQueries({
                  queryKey: ["workshop-vehicle-details"],
                });
              }}
            />

            <ReceivedQuotesModal
              open={receivedQuotesModalOpen}
              onOpenChange={setReceivedQuotesModalOpen}
              field={selectedField}
              onSuccess={() => {
                setReceivedQuotesModalOpen(false);
                setSelectedField(null);
                queryClient.invalidateQueries({
                  queryKey: ["workshop-vehicle-details"],
                });
              }}
            />

            <ChatModal
              open={messagingModalOpen}
              onOpenChange={setMessagingModalOpen}
              quote={selectedField.quote}
            />

            <CombinedWorkModal
              open={finalWorkModalOpen}
              onOpenChange={setFinalWorkModalOpen}
              field={selectedField}
              onSuccess={() => {
                setFinalWorkModalOpen(false);
                setSelectedField(null);
                queryClient.invalidateQueries({
                  queryKey: ["workshop-vehicle-details"],
                });
              }}
              mode="final"
            />

            <CombinedWorkModal
              open={viewWorkModalOpen}
              onOpenChange={setViewWorkModalOpen}
              field={selectedField}
              onSuccess={() => {
                setViewWorkModalOpen(false);
                setSelectedField(null);
                queryClient.invalidateQueries({
                  queryKey: ["workshop-vehicle-details"],
                });
              }}
              mode="view"
            />
          </>
        )}

        {/* Insert Workshop Field Modal */}
        <InsertWorkshopFieldModal
          open={insertFieldModalOpen}
          onOpenChange={setInsertFieldModalOpen}
          onFieldCreated={addWorkshopFieldMutation.mutate}
          vehicleType={vehicleType!}
          categoryId={selectedCategoryForField}
          dropdowns={dropdowns}
          s3Config={completeUser.company_id.s3_config} // Will be implemented with S3 config
        />

        {/* Rearrange Modal */}
        <Dialog open={rearrangeModalOpen} onOpenChange={setRearrangeModalOpen}>
          <DialogContent className="max-w-7xl max-h-[90vh] w-[95vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Rearrange{" "}
                {vehicleType
                  ? vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)
                  : ""}{" "}
                Results
              </DialogTitle>
              <DialogDescription>
                Drag and drop to reorder categories, sections, and fields. All
                changes are live-updated.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                {inspectionOrder.length > 0 ? (
                  <DraggableWorkshopCategoriesList
                    categories={inspectionOrder}
                    onUpdateCategoriesOrder={handleUpdateCategoriesOrder}
                    onUpdateSectionsOrder={handleUpdateSectionsOrder}
                    onUpdateFieldsOrder={handleUpdateFieldsOrder}
                    getFieldBorderColor={getFieldBorderColor}
                  />
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        No inspection data available for rearranging
                      </p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Changes are automatically tracked</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleDiscardChanges}
                  disabled={updateOrderMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveOrder}
                  disabled={
                    updateOrderMutation.isPending ||
                    inspectionOrder.length === 0
                  }
                  className="flex items-center gap-2"
                >
                  {updateOrderMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
  <Dialog open={completeWorkshopModalOpen} onOpenChange={setCompleteWorkshopModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Workshop</DialogTitle>
              <DialogDescription>
                Are you sure you want to complete the workshop for this vehicle? 
                This action will generate the final workshop report and cannot be undone.
                <br />
                <br />
                Type <strong>CONFIRM</strong> to proceed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Type CONFIRM"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompleteWorkshopModalOpen(false);
                    setConfirmText("");
                  }}
                  disabled={completeWorkshopMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmCompleteWorkshop}
                  disabled={confirmText !== "CONFIRM" || completeWorkshopMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {completeWorkshopMutation.isPending ? "Processing..." : "Complete Workshop"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Color Palette Modal */}
        <Dialog
          open={colorPaletteModalOpen}
          onOpenChange={setColorPaletteModalOpen}
        >
          <DialogContent className="max-w-lg w-[90vw]">
            <DialogHeader>
              <DialogTitle>Stage Legend Reference</DialogTitle>
              <DialogDescription>
                Status colors for inspection fields
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-2 mt-4">
              {[
                {
                  label: "Quote Request - Quote Is sent To Supplier's",
                  className: "bg-yellow-500",
                },
                {
                  label: "Quote Approved - Quote Accepted From The Supplier",
                  className: "bg-blue-500",
                },
                {
                  label:
                    "Work in Progress - Supplier Started Working On the Vehicle",
                  className: "bg-purple-500",
                },
                {
                  label:
                    "Work Review - Supplier Submitted the Work And Processing For Preview",
                  className: "bg-indigo-500",
                },
                {
                  label:
                    "Completed Job - The Work From the Supplier Got Accepted ",
                  className: "bg-green-500",
                },
                {
                  label: "Rework - Company Will Send the Vehicle For Reworks",
                  className: "bg-red-500",
                },
                {
                  label: "Quote Rejected - Supplier Rejects the Quote",
                  className: "bg-gray-500",
                },
              ].map((status) => (
                <div key={status.label} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full border ${status.className}`}
                  ></div>
                  <span>{status.label}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setColorPaletteModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Workshop Field</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{fieldToDelete?.field_name}"?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteWorkshopFieldMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteWorkshopFieldMutation.mutate(fieldToDelete)}
                disabled={deleteWorkshopFieldMutation.isPending}
              >
                {deleteWorkshopFieldMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Workshop Field Modal */}
        {selectedEditField && (
          <InsertWorkshopFieldModal
            open={editFieldModalOpen}
            onOpenChange={setEditFieldModalOpen}
            onFieldCreated={updateWorkshopFieldMutation.mutate}
            vehicleType={vehicleType!}
            categoryId={selectedEditField.categoryId}
            dropdowns={dropdowns}
            s3Config={completeUser.company_id.s3_config}
            editMode={true}
            existingField={selectedEditField}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkshopConfig;