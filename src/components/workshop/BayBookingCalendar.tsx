import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Save,
  HardHat,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bayQuoteServices } from "@/api/services";
import { toast } from "sonner";
import DateTimePicker from "@/components/workshop/CommentSheetTabs/DateTimePicker";
import {
  format,
  parseISO,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Input } from "../ui/input";

// Setup localizer for react-big-calendar
const localizer = momentLocalizer(moment);

interface BayBookingCalendarProps {
  bay: any;
  field: any;
  vehicleType: string;
  vehicleStockId: string;
  onBack: () => void;
  onSuccess: () => void;
}

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

// Calendar Component
const CalendarView: React.FC<{
  events: CalendarEvent[];
  currentDate: Date;
  view: any;
  onViewChange: (view: any) => void;
  onDateChange: (date: Date) => void;
  onSelectSlot: (slot: { start: Date; end: Date }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  isLoading: boolean;
  existingBooking: any;
  onNewBooking: () => void;
  onShowLegend: () => void;
}> = ({
  events,
  currentDate,
  view,
  onViewChange,
  onDateChange,
  onSelectSlot,
  onSelectEvent,
  isLoading,
  existingBooking,
  onNewBooking,
  onShowLegend,
}) => {
  const navigateToPrevious = () => {
    switch (view) {
      case Views.DAY:
        onDateChange(addDays(currentDate, -1));
        break;
      case Views.WEEK:
        onDateChange(addWeeks(currentDate, -1));
        break;
      case Views.MONTH:
        onDateChange(addWeeks(currentDate, -4));
        break;
    }
  };

  const navigateToNext = () => {
    switch (view) {
      case Views.DAY:
        onDateChange(addDays(currentDate, 1));
        break;
      case Views.WEEK:
        onDateChange(addWeeks(currentDate, 1));
        break;
      case Views.MONTH:
        onDateChange(addWeeks(currentDate, 4));
        break;
    }
  };

  const navigateToToday = () => {
    onDateChange(new Date());
  };

  const CustomToolbar = ({ label }: any) => (
    <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
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
          onClick={() => onViewChange(Views.DAY)}
        >
          Day
        </Button>
        <Button
          variant={view === Views.WEEK ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange(Views.WEEK)}
        >
          Week
        </Button>
        <Button
          variant={view === Views.MONTH ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange(Views.MONTH)}
        >
          Month
        </Button>
        <Button variant="outline" size="sm" onClick={onShowLegend}>
          <Info className="h-4 w-4 mr-2" />
          Legend
        </Button>
        {
          existingBooking?null: <Button onClick={onNewBooking} disabled={!!existingBooking}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          New Booking
        </Button>
        }
       
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
    const statusColors: Record<string, { background: string; border: string; text: string }> = {
      booking_request: { background: "#fef3c7", border: "#f59e0b", text: "#92400e" },
      booking_accepted: { background: "#d1fae5", border: "#10b981", text: "#065f46" },
      booking_rejected: { background: "#fee2e2", border: "#ef4444", text: "#991b1b" },
      work_in_progress: { background: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
      work_review: { background: "#e9d5ff", border: "#8b5cf6", text: "#5b21b6" },
      completed_jobs: { background: "#f3f4f6", border: "#6b7280", text: "#374151" },
      rework: { background: "#ffedd5", border: "#f97316", text: "#9a3412" },
    };

    const colorConfig = statusColors[event.status] || statusColors.booking_request;

    return {
      style: {
        borderRadius: "4px",
        opacity: 0.9,
        color: colorConfig.text,
        backgroundColor: colorConfig.background,
        borderLeft: `6px solid ${colorConfig.border}`,
        border: `1px solid ${colorConfig.border}`,
        fontWeight: '600',
        display: 'block',
        height: '100%'
      },
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        date={currentDate}
        onView={onViewChange}
        onNavigate={onDateChange}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        selectable
        step={30}
        timeslots={2}
        defaultView={Views.WEEK}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent,
        }}
        eventPropGetter={getEventStyle}
        dayLayoutAlgorithm="no-overlap"
        min={new Date(0, 0, 0, 8, 0, 0)} // 8:00 AM
        max={new Date(0, 0, 0, 18, 0, 0)} // 6:00 PM
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
  );
};

const BayBookingCalendar: React.FC<BayBookingCalendarProps> = ({
  bay,
  field,
  vehicleType,
  vehicleStockId,
  onBack,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookingStartTime, setBookingStartTime] = useState("");
  const [bookingEndTime, setBookingEndTime] = useState("");
  const [bookingDescription, setBookingDescription] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showLegendDialog, setShowLegendDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [view, setView] = useState(Views.WEEK);
  const [isRebookMode, setIsRebookMode] = useState(false);

  const rebookBookingMutation = useMutation({
  mutationFn: async (data: any) => {
    const response = await bayQuoteServices.rebookBayQuote(selectedBooking?._id, data);
    return response.data;
  },
  onSuccess: () => {
    toast.success("Booking rebooked successfully");
    queryClient.invalidateQueries({ queryKey: ["field-bay-booking"] });
    queryClient.invalidateQueries({ queryKey: ["bay-booking-calendar"] });
    setShowBookingDialog(false);
    setSelectedBooking(null);
    setIsRebookMode(false);
    resetForm();
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || "Failed to rebook booking");
  },
});
  // Fetch existing booking for this field
  const { data: existingBooking } = useQuery({
    queryKey: [
      "field-bay-booking",
      vehicleType,
      vehicleStockId,
      field.field_id,
    ],
    queryFn: async () => {
      const response = await bayQuoteServices.getBayQuoteForField(
        vehicleType,
        vehicleStockId,
        field.field_id
      );
      return response.data.data;
    },
    enabled: !!field,
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
  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: [
      "bay-booking-calendar",
      bay._id,
      format(dateRange.start, "yyyy-MM-dd"),
      format(dateRange.end, "yyyy-MM-dd"),
    ],
    queryFn: async () => {
      const response = await bayQuoteServices.getBayCalendar(
        format(dateRange.start, "yyyy-MM-dd"),
        format(dateRange.end, "yyyy-MM-dd"),
        bay._id
      );
      return response.data.data;
    },
  });

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

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await bayQuoteServices.createBayQuote(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Bay booking created successfully");
      queryClient.invalidateQueries({ queryKey: ["field-bay-booking"] });
      queryClient.invalidateQueries({ queryKey: ["bay-booking-calendar"] });
      setShowBookingDialog(false);
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create booking");
    },
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await bayQuoteServices.updateBayQuote(id, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Booking updated successfully");
      queryClient.invalidateQueries({ queryKey: ["field-bay-booking"] });
      queryClient.invalidateQueries({ queryKey: ["bay-booking-calendar"] });
      setShowBookingDialog(false);
      setSelectedBooking(null);
      setIsEditMode(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update booking");
    },
  });

  const resetForm = () => {
    setBookingStartTime("");
    setBookingEndTime("");
    setBookingDescription("");
    setAllowOverlap(false);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Only allow creating if no existing booking for this field
    if (existingBooking && !isEditMode) {
      toast.error("This field already has a booking. Please edit the existing booking.");
      return;
    }
    
    setBookingStartTime(start.toISOString());
    setBookingEndTime(end.toISOString());
    setShowBookingDialog(true);
    setIsEditMode(false);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.resource);
    
    // Only allow editing if it's the current field's booking
    if (event.fieldId === field.field_id) {
      setShowDetailsDialog(true);
    } else {
      // Show read-only details for other bookings
      setShowDetailsDialog(true);
    }
  };

const handleSubmitBooking = () => {
  if (!bookingStartTime || !bookingEndTime) {
    toast.error("Please select start and end time");
    return;
  }

  const startDate = new Date(bookingStartTime);
  const endDate = new Date(bookingEndTime);

  if (startDate >= endDate) {
    toast.error("End time must be after start time");
    return;
  }

  if (isRebookMode && selectedBooking) {
    const rebookData = {
      booking_date: format(startDate, "yyyy-MM-dd"),
      booking_start_time: format(startDate, "HH:mm"),
      booking_end_time: format(endDate, "HH:mm"),
      booking_description: bookingDescription,
      quote_amount: parseFloat(quoteAmount) || 0,
      allow_overlap: allowOverlap,
    };

    rebookBookingMutation.mutate(rebookData);
  } else if (isEditMode && selectedBooking) {
    const updateData = {
      booking_date: format(startDate, "yyyy-MM-dd"),
      booking_start_time: format(startDate, "HH:mm"),
      booking_end_time: format(endDate, "HH:mm"),
      booking_description: bookingDescription,
      quote_amount: parseFloat(quoteAmount) || 0,
      allow_overlap: allowOverlap,
    };

    updateBookingMutation.mutate({
      id: selectedBooking._id,
      data: updateData,
    });
  } else {
    const bookingData = {
      vehicle_type: vehicleType,
      vehicle_stock_id: vehicleStockId,
      field_id: field.field_id,
      field_name: field.field_name,
      bay_id: bay._id,
      quote_amount: parseFloat(quoteAmount) || 0,
      booking_date: format(startDate, "yyyy-MM-dd"),
      booking_start_time: format(startDate, "HH:mm"),
      booking_end_time: format(endDate, "HH:mm"),
      booking_description: bookingDescription,
      images: field.images || [],
      videos: field.videos || [],
      allow_overlap: allowOverlap,
    };

    createBookingMutation.mutate(bookingData);
  }
};
const handleEditBooking = () => {
  if (!selectedBooking) return;

  const bookingDate = parseISO(selectedBooking.booking_date);
  const [startHours, startMinutes] = selectedBooking.booking_start_time
    .split(":")
    .map(Number);
  const [endHours, endMinutes] = selectedBooking.booking_end_time
    .split(":")
    .map(Number);

  const startDateTime = new Date(bookingDate);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(bookingDate);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  setBookingStartTime(startDateTime.toISOString());
  setBookingEndTime(endDateTime.toISOString());
  setBookingDescription(selectedBooking.booking_description || "");
  setQuoteAmount(selectedBooking.quote_amount?.toString() || "");
  setAllowOverlap(selectedBooking.allow_overlap || false);
  
  setIsEditMode(true);
  setIsRebookMode(selectedBooking.status === "booking_rejected");
  setShowDetailsDialog(false);
  setShowBookingDialog(true);
};

  const handleNewBooking = () => {
    if (existingBooking) {
      toast.error("This field already has a booking. Please edit the existing booking.");
      return;
    }
    setShowBookingDialog(true);
    setIsEditMode(false);
    resetForm();
  };

  const isCurrentFieldBooking = selectedBooking?.field_id === field.field_id;

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Book Bay: {bay.bay_name}</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Field: {field?.field_name} • Stock ID: {vehicleStockId}
              {existingBooking && (
                <Badge variant="secondary" className="ml-2">
                  Existing Booking
                </Badge>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Scrollable Calendar Content */}
      <div className="flex-1 overflow-hidden">
        <Card className="h-full border-0 rounded-none">
          <CardContent className="p-0 h-full">
            <CalendarView
              events={events}
              currentDate={currentDate}
              view={view}
              onViewChange={setView}
              onDateChange={setCurrentDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              isLoading={calendarLoading}
              existingBooking={existingBooking}
              onNewBooking={handleNewBooking}
              onShowLegend={() => setShowLegendDialog(true)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Fixed Footer */}
      <div className="border-t bg-background p-4 sticky bottom-0 z-20">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-500"></div>
              <span>Booking Request</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-500"></div>
              <span>Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-500"></div>
              <span>In Progress</span>
            </div>
          </div>
          
          {existingBooking && (
            <div className="text-sm text-amber-600 font-medium">
              This field has an existing booking. Click on it to edit.
            </div>
          )}
        </div>
      </div>

      {/* Booking Form Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
         <DialogHeader>
  <DialogTitle>
    {isRebookMode ? "Rebook Booking" : isEditMode ? "Edit Booking" : "Create New Booking"}
  </DialogTitle>
</DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <DateTimePicker
                label="Start Date & Time"
                value={bookingStartTime}
                onChange={setBookingStartTime}
                placeholder="Select start time"
                required
              />

              <DateTimePicker
                label="End Date & Time"
                value={bookingEndTime}
                onChange={setBookingEndTime}
                placeholder="Select end time"
                required
              />
            </div>

              <div>
                            <Label htmlFor="quoteAmount">Expected Estimation *</Label>
                            <Input
                              id="quoteAmount"
                              type="number"
                              step="0.01"
                              value={quoteAmount}
                              onChange={(e) => setQuoteAmount(e.target.value)}
                              placeholder="Enter estimation amount"
                              required
                            />
                          </div>

            <div>
              <Label htmlFor="description">Work Description</Label>
              <Textarea
                id="description"
                value={bookingDescription}
                onChange={(e) => setBookingDescription(e.target.value)}
                placeholder="Describe the work to be done..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow_overlap"
                checked={allowOverlap}
                onCheckedChange={(checked) =>
                  setAllowOverlap(checked as boolean)
                }
              />
              <Label
                htmlFor="allow_overlap"
                className="text-sm font-normal cursor-pointer"
              >
                Allow overlapping bookings (multiple works at same time)
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBookingDialog(false);
                  setIsEditMode(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
           <Button
  onClick={handleSubmitBooking}
  disabled={
    createBookingMutation.isPending ||
    updateBookingMutation.isPending ||
    rebookBookingMutation.isPending ||
    !bookingStartTime ||
    !bookingEndTime
  }
  className="flex-1"
>
  <Save className="h-4 w-4 mr-2" />
  {rebookBookingMutation.isPending
    ? "Rebooking..."
    : createBookingMutation.isPending || updateBookingMutation.isPending
    ? "Saving..."
    : isRebookMode
    ? "Rebook"
    : isEditMode
    ? "Update Booking"
    : "Create Booking"}
</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
  <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Booking Details</DialogTitle>
    </DialogHeader>

    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Field Name</Label>
          <p className="text-sm mt-1">{selectedBooking?.field_name}</p>
        </div>
        <div>
          <Label className="text-sm font-medium">Stock ID</Label>
          <p className="text-sm mt-1">
            {selectedBooking?.vehicle_stock_id}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Bay</Label>
          <p className="text-sm mt-1">
            {selectedBooking?.bay_id?.bay_name || bay.bay_name}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Booking Date</Label>
          <p className="text-sm mt-1">
            {selectedBooking &&
              format(
                parseISO(selectedBooking.booking_date),
                "MMM dd, yyyy"
              )}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">Start Time</Label>
          <p className="text-sm mt-1">
            {selectedBooking?.booking_start_time}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium">End Time</Label>
          <p className="text-sm mt-1">
            {selectedBooking?.booking_end_time}
          </p>
        </div>
        <div className="col-span-2">
          <Label className="text-sm font-medium">Status</Label>
          <div className="mt-1">
            <Badge className={getStatusColor(selectedBooking?.status)}>
              {selectedBooking?.status?.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>
        
        {/* Show rejection reason if booking is rejected */}
        {selectedBooking?.status === "booking_rejected" && selectedBooking?.rejected_reason && (
          <div className="col-span-2">
            <Label className="text-sm font-medium text-red-600">Rejection Reason</Label>
            <p className="text-sm mt-1 bg-red-50 p-2 rounded border border-red-200">
              {selectedBooking.rejected_reason}
            </p>
          </div>
        )}

        {selectedBooking?.booking_description && (
          <div className="col-span-2">
            <Label className="text-sm font-medium">Description</Label>
            <p className="text-sm mt-1 bg-muted p-2 rounded">
              {selectedBooking.booking_description}
            </p>
          </div>
        )}
        {selectedBooking?.created_by && (
          <div className="col-span-2">
            <Label className="text-sm font-medium">Created By</Label>
            <p className="text-sm mt-1">
              {selectedBooking.created_by.first_name}{" "}
              {selectedBooking.created_by.last_name}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => setShowDetailsDialog(false)}
          className="flex-1"
        >
          Close
        </Button>
        {isCurrentFieldBooking && (
          <Button onClick={handleEditBooking} className="flex-1">
            <Clock className="h-4 w-4 mr-2" />
            {selectedBooking?.status === "booking_rejected" ? "Rebook" : "Edit Timing"}
          </Button>
        )}
      </div>
      
      {!isCurrentFieldBooking && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
          This booking belongs to another field. You can only view details.
        </div>
      )}
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

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Calendar Features:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Click and drag to create new bookings</li>
                <li>• Click on existing booking to view details</li>
                <li>• Use Day/Week/Month view buttons to change perspective</li>
                <li>• Multiple bookings can overlap if enabled</li>
                <li>• Only your field's booking can be edited</li>
              </ul>
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
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    booking_request:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
    booking_accepted:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
    booking_rejected: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
    work_in_progress:
      "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
    work_review:
      "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
    completed_jobs:
      "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
    rework:
      "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export default BayBookingCalendar;