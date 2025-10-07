import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bayQuoteServices, serviceBayServices } from "@/api/services";
import {
  format,
  parseISO,
  addWeeks,
  subWeeks,
  addDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  Play,
  Send,
  MessageSquare,
  Eye,
  DollarSign,
  Edit,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CommentSheetModal from "@/components/workshop/CommentSheetModal";
import ChatModal from "@/components/workshop/ChatModal";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
  status: string;
  fieldName: string;
  stockId: number;
  fieldId: string;
}

const BayCalendar = () => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [selectedBay, setSelectedBay] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [commentSheetOpen, setCommentSheetOpen] = useState(false);
  const [commentViewSheetOpen, setCommentViewSheetOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [showLegendDialog, setShowLegendDialog] = useState(false);
  const [workMode, setWorkMode] = useState<"submit" | "edit">("submit");
  const [mode, setMode] = useState<"company_view" | "supplier_submit">(
    "supplier_submit"
  );

  // Fetch user's bays
  const { data: baysData } = useQuery({
    queryKey: ["user-bays-dropdown"],
    queryFn: async () => {
      const response = await serviceBayServices.getBaysDropdown();
      return response.data.data;
    },
  });

  // Calculate date range for calendar data
  const getDateRange = () => {
    switch (view) {
      case Views.DAY:
        return {
          start: currentDate,
          end: currentDate,
        };
      case Views.WEEK:
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
      case Views.MONTH:
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(addDays(currentDate, 35), { weekStartsOn: 1 }),
        };
      default:
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
    }
  };

  const dateRange = getDateRange();

  // Fetch calendar data
  const { data: calendarData, isLoading } = useQuery({
    queryKey: [
      "bay-calendar",
      format(dateRange.start, "yyyy-MM-dd"),
      format(dateRange.end, "yyyy-MM-dd"),
      selectedBay,
    ],
    queryFn: async () => {
      const response = await bayQuoteServices.getBayCalendar(
        format(dateRange.start, "yyyy-MM-dd"),
        format(dateRange.end, "yyyy-MM-dd"),
        selectedBay || undefined
      );
      return response.data.data;
    },
    enabled: !!baysData && baysData.length > 0,
  });

  // Set first bay as selected by default
  React.useEffect(() => {
    if (baysData && baysData.length > 0 && !selectedBay) {
      setSelectedBay(baysData[0]._id);
    }
  }, [baysData, selectedBay]);

  // Convert bookings to calendar events
  const events: CalendarEvent[] = React.useMemo(() => {
    if (!calendarData?.bookings) return [];

    return calendarData.bookings.map((booking: any) => {
      const startDate = parseISO(booking.booking_date);
      const [startHours, startMinutes] = booking.booking_start_time
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = booking.booking_end_time
        .split(":")
        .map(Number);

      const start = new Date(startDate);
      start.setHours(startHours, startMinutes, 0, 0);

      const end = new Date(startDate);
      end.setHours(endHours, endMinutes, 0, 0);

      return {
        id: booking._id,
        title: `${booking.field_name} (Stock: ${booking.vehicle_stock_id})`,
        start,
        end,
        resource: booking,
        status: booking.status,
        fieldName: booking.field_name,
        stockId: booking.vehicle_stock_id,
        fieldId: booking.field_id,
      };
    });
  }, [calendarData]);

  // Accept booking mutation
  const acceptMutation = useMutation({
    mutationFn: (bookingId: string) =>
      bayQuoteServices.acceptBayQuote(bookingId),
    onSuccess: () => {
      toast.success("Booking accepted successfully");
      queryClient.invalidateQueries({ queryKey: ["bay-calendar"] });
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to accept booking");
    },
  });

  // Reject booking mutation
  const rejectMutation = useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: string;
      reason: string;
    }) => bayQuoteServices.rejectBayQuote(bookingId, reason),
    onSuccess: () => {
      toast.success("Booking rejected");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedBooking(null);
      queryClient.invalidateQueries({ queryKey: ["bay-calendar"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reject booking");
    },
  });

  // Start work mutation
  const startWorkMutation = useMutation({
    mutationFn: (bookingId: string) => bayQuoteServices.startBayWork(bookingId),
    onSuccess: () => {
      toast.success("Work started successfully");
      queryClient.invalidateQueries({ queryKey: ["bay-calendar"] });
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to start work");
    },
  });

  // Submit work mutation
  const submitWorkMutation = useMutation({
    mutationFn: async ({
      bookingId,
      data,
    }: {
      bookingId: string;
      data: any;
    }) => {
      const response = await bayQuoteServices.submitBayWork(bookingId, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Work submitted for review");
      queryClient.invalidateQueries({ queryKey: ["bay-calendar"] });
      setCommentSheetOpen(false);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit work");
    },
  });

  const handleAccept = (booking: any) => {
    acceptMutation.mutate(booking._id);
  };

  const handleRejectClick = (booking: any) => {
    setSelectedBooking(booking);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    rejectMutation.mutate({
      bookingId: selectedBooking._id,
      reason: rejectReason,
    });
  };

  const handleStartWork = (booking: any) => {
    startWorkMutation.mutate(booking._id);
  };

  const handleSubmitWork = (booking: any) => {
    setSelectedBooking(booking);
    setWorkMode("submit");
    setCommentSheetOpen(true);
  };

  const handleEditWork = (booking: any) => {
    setSelectedBooking(booking);
    setWorkMode("edit");
    setCommentSheetOpen(true);
  };

  const handleWorkSubmission = (data: any) => {
    if (selectedBooking) {
      submitWorkMutation.mutate({
        bookingId: selectedBooking._id,
        data,
      });
    }
  };

  const handleChat = (booking: any) => {
    setSelectedBooking(booking);
    setChatModalOpen(true);
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      booking_request: "bg-yellow-100 text-yellow-800 border-yellow-200",
      booking_accepted: "bg-green-100 text-green-800 border-green-200",
      booking_rejected: "bg-red-100 text-red-800 border-red-200",
      work_in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      work_review: "bg-purple-100 text-purple-800 border-purple-200",
      completed_jobs: "bg-gray-100 text-gray-800 border-gray-200",
      rework: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const navigateToPrevious = () => {
    switch (view) {
      case Views.DAY:
        setCurrentDate(addDays(currentDate, -1));
        break;
      case Views.WEEK:
        setCurrentDate(addWeeks(currentDate, -1));
        break;
      case Views.MONTH:
        setCurrentDate(addWeeks(currentDate, -4));
        break;
    }
  };

  const navigateToNext = () => {
    switch (view) {
      case Views.DAY:
        setCurrentDate(addDays(currentDate, 1));
        break;
      case Views.WEEK:
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case Views.MONTH:
        setCurrentDate(addWeeks(currentDate, 4));
        break;
    }
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.resource);
  };

  const CustomToolbar = ({ label }: any) => (
    <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={navigateToPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={navigateToToday}>
          Today
        </Button>
        <Button variant="outline" size="sm" onClick={navigateToNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold ml-4">{label}</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant={view === Views.DAY ? "default" : "outline"}
          size="sm"
          onClick={() => setView(Views.DAY)}
        >
          Day
        </Button>
        <Button
          variant={view === Views.WEEK ? "default" : "outline"}
          size="sm"
          onClick={() => setView(Views.WEEK)}
        >
          Week
        </Button>
        <Button
          variant={view === Views.MONTH ? "default" : "outline"}
          size="sm"
          onClick={() => setView(Views.MONTH)}
        >
          Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLegendDialog(true)}
        >
          <Info className="h-4 w-4 mr-2" />
          Legend
        </Button>
        <Select value={selectedBay} onValueChange={setSelectedBay}>
          <SelectTrigger>
            <SelectValue placeholder="Select bay" />
          </SelectTrigger>
          <SelectContent>
            {baysData?.map((bay: any) => (
              <SelectItem key={bay._id} value={bay._id}>
                {bay.bay_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="p-1 text-xs h-full">
      <div className="font-medium truncate">{event.fieldName}</div>
      <div className="truncate">Stock: {event.stockId}</div>
      <div className="truncate">
        {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
      </div>
      <Badge variant="secondary" className="mt-1 text-xs capitalize">
        {event.status.replace(/_/g, " ")}
      </Badge>
    </div>
  );

  const getEventStyle = (event: CalendarEvent) => {
    const statusColors: Record<
      string,
      { background: string; border: string; text: string }
    > = {
      booking_request: {
        background: "#fef3c7",
        border: "#f59e0b",
        text: "#92400e",
      },
      booking_accepted: {
        background: "#d1fae5",
        border: "#10b981",
        text: "#065f46",
      },
      booking_rejected: {
        background: "#fee2e2",
        border: "#ef4444",
        text: "#991b1b",
      },
      work_in_progress: {
        background: "#dbeafe",
        border: "#3b82f6",
        text: "#1e40af",
      },
      work_review: {
        background: "#e9d5ff",
        border: "#8b5cf6",
        text: "#5b21b6",
      },
      completed_jobs: {
        background: "#f3f4f6",
        border: "#6b7280",
        text: "#374151",
      },
      rework: { background: "#ffedd5", border: "#f97316", text: "#9a3412" },
    };

    const colorConfig =
      statusColors[event.status] || statusColors.booking_request;

    return {
      style: {
        borderRadius: "4px",
        opacity: 0.9,
        color: colorConfig.text,
        backgroundColor: colorConfig.background,
        borderLeft: `6px solid ${colorConfig.border}`,
        border: `1px solid ${colorConfig.border}`,
        fontWeight: "600",
        display: "block",
        height: "100%",
      },
    };
  };

  if (!baysData || baysData.length === 0) {
    return (
      <DashboardLayout title="Bay Calendar">
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Bays Assigned</h3>
              <p className="text-muted-foreground">
                You are not assigned to any service bays. Please contact your
                administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bay Calendar">
      <div className="space-y-4">
        {/* Calendar */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="h-[700px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  date={currentDate}
                  onView={setView}
                  onNavigate={setCurrentDate}
                  onSelectEvent={handleSelectEvent}
                  step={30}
                  timeslots={2}
                  defaultView={Views.WEEK}
                  components={{
                    toolbar: CustomToolbar,
                    event: CustomEvent,
                  }}
                  eventPropGetter={getEventStyle}
                  dayLayoutAlgorithm="no-overlap"
                  min={new Date(0, 0, 0, 8, 0, 0)}
                  max={new Date(0, 0, 0, 18, 0, 0)}
                  formats={{
                    timeGutterFormat: "HH:mm",
                    eventTimeRangeFormat: ({ start, end }) =>
                      `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
                  }}
                  messages={{
                    next: "Next",
                    previous: "Previous",
                    today: "Today",
                    month: "Month",
                    week: "Week",
                    day: "Day",
                    agenda: "Agenda",
                    date: "Date",
                    time: "Time",
                    event: "Event",
                    noEventsInRange: "No bookings in this range",
                    showMore: (total) => `+${total} more`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Booking Details - {selectedBooking?.field_name}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Bay Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarIcon className="h-4 w-4" />
                    Bay Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Bay Name</Label>
                      <p className="font-medium">
                        {selectedBooking.bay_id?.bay_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Booking Date
                      </Label>
                      <p className="font-medium">
                        {format(
                          parseISO(selectedBooking.booking_date),
                          "MMM dd, yyyy"
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Time Slot</Label>
                      <p className="font-medium">
                        {selectedBooking.booking_start_time} -{" "}
                        {selectedBooking.booking_end_time}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge
                          className={getStatusColor(selectedBooking.status)}
                        >
                          {selectedBooking.status?.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quote Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quote Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">
                        Field Name
                      </Label>
                      <p className="font-medium">
                        {selectedBooking.field_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Field ID</Label>
                      <p className="font-medium">{selectedBooking.field_id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Vehicle Stock ID
                      </Label>
                      <p className="font-medium">
                        {selectedBooking.vehicle_stock_id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Quote Amount
                      </Label>
                      <p className="font-medium">
                        ${selectedBooking.quote_amount}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Vehicle Type
                      </Label>
                      <p className="font-medium capitalize">
                        {selectedBooking.vehicle_type}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Created By
                      </Label>
                      <p className="font-medium">
                        {selectedBooking.created_by?.first_name}{" "}
                        {selectedBooking.created_by?.last_name}
                      </p>
                    </div>
                  </div>

                  {selectedBooking.booking_description && (
                    <div className="mt-4">
                      <Label className="text-muted-foreground">
                        Description
                      </Label>
                      <div className="bg-muted/50 p-3 rounded-lg mt-1">
                        <p className="text-sm">
                          {selectedBooking.booking_description}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedBooking.images &&
                    selectedBooking.images.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">
                          Field Images
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {selectedBooking.images.map(
                            (image: string, index: number) => (
                              <div
                                key={index}
                                className="aspect-square rounded-lg overflow-hidden border"
                              >
                                <img
                                  src={image}
                                  alt={`Field image ${index + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onClick={() => window.open(image, "_blank")}
                                />
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {selectedBooking.videos &&
                    selectedBooking.videos.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-muted-foreground">
                          Field Videos
                        </Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {selectedBooking.videos.map(
                            (video: string, index: number) => (
                              <video
                                key={index}
                                src={video}
                                controls
                                className="w-full rounded-lg border"
                              >
                                Your browser does not support the video tag.
                              </video>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Show rework feedback */}
              {selectedBooking.status === "rework" &&
                selectedBooking.comment_sheet?.company_feedback && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Rework Required
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                        <h4 className="font-medium mb-2 text-orange-800">
                          Company Feedback
                        </h4>
                        <p className="text-sm text-orange-700">
                          {selectedBooking.comment_sheet.company_feedback}
                        </p>
                      </div>

                      {/* Show previous submission details for rework */}
                      {selectedBooking.comment_sheet.final_price && (
                        <div className="mt-4">
                          <Label className="text-muted-foreground mb-2 block">
                            Previous Submission
                          </Label>
                          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Final Price:
                                </span>
                                <p className="font-medium">
                                  ${selectedBooking.comment_sheet.final_price}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  GST:
                                </span>
                                <p className="font-medium">
                                  ${selectedBooking.comment_sheet.gst_amount}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Total:
                                </span>
                                <p className="font-medium">
                                  ${selectedBooking.comment_sheet.total_amount}
                                </p>
                              </div>
                            </div>

                            {selectedBooking.comment_sheet
                              .supplier_comments && (
                              <div>
                                <span className="text-muted-foreground text-sm">
                                  Comments:
                                </span>
                                <p className="text-sm mt-1">
                                  {
                                    selectedBooking.comment_sheet
                                      .supplier_comments
                                  }
                                </p>
                              </div>
                            )}

                            {selectedBooking.comment_sheet.work_images &&
                              selectedBooking.comment_sheet.work_images.length >
                                0 && (
                                <div>
                                  <span className="text-muted-foreground text-sm">
                                    Work Images:
                                  </span>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                    {selectedBooking.comment_sheet.work_images.map(
                                      (image: any, index: number) => (
                                        <div
                                          key={index}
                                          className="aspect-square rounded overflow-hidden border"
                                        >
                                          <img
                                            src={image.url}
                                            alt={`Work image ${index + 1}`}
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() =>
                                              window.open(image.url, "_blank")
                                            }
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Actions based on status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedBooking.status === "booking_request" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(selectedBooking)}
                          disabled={acceptMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {acceptMutation.isPending
                            ? "Accepting..."
                            : "Accept Booking"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClick(selectedBooking)}
                          disabled={rejectMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChat(selectedBooking)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </>
                    )}

                    {selectedBooking.status === "booking_accepted" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStartWork(selectedBooking)}
                          disabled={startWorkMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {startWorkMutation.isPending
                            ? "Starting..."
                            : "Start Work"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChat(selectedBooking)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </>
                    )}

                    {selectedBooking.status === "work_in_progress" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitWork(selectedBooking)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Submit Work
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChat(selectedBooking)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </>
                    )}

                    {selectedBooking.status === "work_review" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditWork(selectedBooking)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Submission
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChat(selectedBooking)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </>
                    )}

                    {selectedBooking.status === "rework" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleEditWork(selectedBooking)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update & Resubmit Work
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChat(selectedBooking)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </>
                    )}

                    {selectedBooking.status === "completed_jobs" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMode("company_view");
                            setCommentViewSheetOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Work Details
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason for Rejection</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this booking..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason("");
                  setSelectedBooking(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend Dialog */}
      <Dialog open={showLegendDialog} onOpenChange={setShowLegendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Status Legend</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-yellow-100 border-2 border-yellow-500"></div>
              <div>
                <p className="font-medium text-sm">Booking Request</p>
                <p className="text-xs text-muted-foreground">
                  Waiting for approval
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-green-100 border-2 border-green-500"></div>
              <div>
                <p className="font-medium text-sm">Booking Accepted</p>
                <p className="text-xs text-muted-foreground">
                  Approved and scheduled
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-blue-100 border-2 border-blue-500"></div>
              <div>
                <p className="font-medium text-sm">Work in Progress</p>
                <p className="text-xs text-muted-foreground">
                  Currently being worked on
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-purple-100 border-2 border-purple-500"></div>
              <div>
                <p className="font-medium text-sm">Work Review</p>
                <p className="text-xs text-muted-foreground">
                  Submitted for review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-gray-100 border-2 border-gray-500"></div>
              <div>
                <p className="font-medium text-sm">Completed Jobs</p>
                <p className="text-xs text-muted-foreground">
                  Work finished and approved
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-orange-100 border-2 border-orange-500"></div>
              <div>
                <p className="font-medium text-sm">Rework</p>
                <p className="text-xs text-muted-foreground">
                  Needs additional work
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-8 rounded bg-red-100 border-2 border-red-500"></div>
              <div>
                <p className="font-medium text-sm">Booking Rejected</p>
                <p className="text-xs text-muted-foreground">
                  Booking was declined
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => setShowLegendDialog(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Sheet Modal - Using unified CommentSheetModal for bay quotes */}
      {commentSheetOpen && selectedBooking && (
        <CommentSheetModal
          open={commentSheetOpen}
          onOpenChange={setCommentSheetOpen}
          quote={selectedBooking}
          mode={mode}
          workMode={workMode}
          onSubmit={handleWorkSubmission}
          loading={submitWorkMutation.isPending}
        />
      )}
      {commentViewSheetOpen && selectedBooking && (
        <CommentSheetModal
          open={commentViewSheetOpen}
          onOpenChange={setCommentViewSheetOpen}
          field={selectedBooking}
          mode={mode}
        />
      )}

      {/* Chat Modal - Using unified ChatModal for bay quotes */}
      {chatModalOpen && selectedBooking && (
        <ChatModal
          open={chatModalOpen}
          onOpenChange={setChatModalOpen}
          quote={selectedBooking}
        />
      )}
    </DashboardLayout>
  );
};

export default BayCalendar;
