import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { workshopServices, vehicleServices } from "@/api/services";
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
} from "lucide-react";
import { toast } from "sonner";
import QuoteModal from "@/components/workshop/QuoteModal";
import ReceivedQuotesModal from "@/components/workshop/ReceivedQuotesModal";
import MessagingModal from "@/components/workshop/MessagingModal";
import FinalWorkModal from "@/components/workshop/FinalWorkModal";
import DraggableWorkshopCategoriesList from "@/components/workshop/DraggableWorkshopCategoriesList";

const WorkshopConfig = () => {
  const { vehicleId, vehicleType } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [receivedQuotesModalOpen, setReceivedQuotesModalOpen] = useState(false);
  const [messagingModalOpen, setMessagingModalOpen] = useState(false);
  const [finalWorkModalOpen, setFinalWorkModalOpen] = useState(false);
  const [rearrangeModalOpen, setRearrangeModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [inspectionOrder, setInspectionOrder] = useState([]);

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

  const vehicle = vehicleData?.data;

  // Update vehicle inspection order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (newOrder: any) => {
      await vehicleServices.updateVehicle(vehicle._id, {
        inspection_result: newOrder,
      });
    },
    onSuccess: () => {
      toast.success("Inspection order updated successfully");
      queryClient.invalidateQueries({ queryKey: ["workshop-vehicle-details"] });
      setRearrangeModalOpen(false);
      // Update the local state as well
      setInspectionOrder([]);
    },
    onError: (error: any) => {
      toast.error("Failed to update inspection order");
      console.error("Update order error:", error);
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

  const handleRearrange = () => {
    if (vehicle?.inspection_result) {
      setInspectionOrder([...vehicle.inspection_result]);
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

  const handleDiscardChanges = () => {
    setInspectionOrder([]);
    setRearrangeModalOpen(false);
  };

  const getFieldBorderColor = (field: any) => {
    // Check if field has quotes
    const hasQuotes = field.quotes && field.quotes.length > 0;
    const approvedQuote = field.quotes?.find((q) => q.status === "approved");

    if (approvedQuote) return "border-yellow-500 border-2";
    if (hasQuotes) return "border-blue-500 border-2";
    return "border-orange-500 border-2";
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

  const renderInspectionResults = () => {
    if (!vehicle.inspection_result || vehicle.inspection_result.length === 0) {
      return (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <p className="text-muted-foreground">
                No inspection results available
              </p>
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
                onClick={() => navigate("/company/workshop")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="pt-4">
          {vehicle.inspection_result.map(
            (category: any, categoryIndex: number) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.category_name}</span>
                    <Badge variant="secondary">
                      {category.sections?.length || 0} Sections
                    </Badge>
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
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-medium">
                                        {field.field_name}
                                      </h4>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">
                                          {field.field_type}
                                        </Badge>

                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleSendQuote(
                                              field,
                                              category.category_id,
                                              section.section_id
                                            )
                                          }
                                        >
                                          <DollarSign className="h-3 w-3 mr-1" />
                                          Send Quote
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            handleReceivedQuotes(
                                              field,
                                              category.category_id,
                                              section.section_id
                                            )
                                          }
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          Received Quotes
                                        </Button>

                                        {field.quotes?.some(
                                          (q) => q.status === "approved"
                                        ) && (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                handleMessaging(
                                                  field,
                                                  category.category_id,
                                                  section.section_id
                                                )
                                              }
                                            >
                                              <MessageSquare className="h-3 w-3 mr-1" />
                                              Message
                                            </Button>

                                            {field.quotes?.some(
                                              (q) => q.status === "completed"
                                            ) && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                  handleFinalWork(
                                                    field,
                                                    category.category_id,
                                                    section.section_id
                                                  )
                                                }
                                              >
                                                <FileText className="h-3 w-3 mr-1" />
                                                Final Work
                                              </Button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {field.field_value && (
                                      <div className="text-sm text-muted-foreground mb-2">
                                        Value:{" "}
                                        {typeof field.field_value === "object"
                                          ? JSON.stringify(field.field_value)
                                          : field.field_value}
                                      </div>
                                    )}

                                    {field.images &&
                                      field.images.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                          {field.images.map(
                                            (
                                              image: string,
                                              imgIndex: number
                                            ) => (
                                              <img
                                                key={imgIndex}
                                                src={image}
                                                alt={`${
                                                  field.field_name
                                                } image ${imgIndex + 1}`}
                                                className="w-full h-20 object-cover rounded"
                                              />
                                            )
                                          )}
                                        </div>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
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
                {renderInspectionResults()}
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

            <MessagingModal
              open={messagingModalOpen}
              onOpenChange={setMessagingModalOpen}
              field={selectedField}
            />

            <FinalWorkModal
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
            />
          </>
        )}

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
      </div>
    </DashboardLayout>
  );
};

export default WorkshopConfig;
