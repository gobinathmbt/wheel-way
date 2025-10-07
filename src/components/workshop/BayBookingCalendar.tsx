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
  Menu,
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
  isSameDay,
  isBefore,
  isAfter
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
  bayTimings: any[];
  bay: any;
  onBack: () => void;
  onShowMenu: () => void;
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
  bayTimings,
  bay,
  onBack,
  onShowMenu,
}) => {
  const calendarRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force calendar resize after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (calendarRef.current) {
        window.dispatchEvent(new Event('resize'));
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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

  // Helper function to get day name from date
  const getDayName = (date: Date): string => {
    return format(date, 'eeee').toLowerCase(); // returns 'monday', 'tuesday', etc.
  };

  const CustomToolbar = ({ label }: any) => (
    <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10 flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isMobile ? (
          <Button variant="outline" size="sm" onClick={onShowMenu}>
            <Menu className="h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={navigateToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Bay Information */}
        <div className="ml-2 flex items-center gap-2">
          <HardHat className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium truncate">Bay: {bay.bay_name}</span>
          {existingBooking && (
            <Badge variant="secondary" className="text-xs">
              Existing Booking
            </Badge>
          )}
        </div>

        {isMobile && (
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onShowLegend}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Desktop Controls */}
      {!isMobile && (
        <div className="flex gap-2 flex-wrap justify-end flex-1 min-w-0">
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
          
          {/* ADDED: Legend button for desktop */}
          <Button variant="outline" size="sm" onClick={onShowLegend}>
            <Info className="h-4 w-4 mr-2" />
            Legend
          </Button>
          
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {existingBooking ? null : (
            <Button onClick={onNewBooking} disabled={!!existingBooking}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          )}
        </div>
      )}
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
      rework: { background: "#ffedd5", border: "#f97316ff", text: "#9a3412" },
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

  // Function to style time slots based on availability
const slotPropGetter = (date: Date) => {
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if the date is in the past (before today)
  const isPastDate = date < today;
  
  // Check bay timings for the specific day
  const dayName = getDayName(date);
  const dayTiming = bayTimings.find((timing: any) => timing.day_of_week === dayName);

  // Condition 1: Past dates - Light brown color (same as non-working days)
  if (isPastDate) {
    return {
      className: 'rbc-slot-past',
      style: {
        backgroundColor: '#c39522ff',
        cursor: 'not-allowed',
        opacity: 0.6,
        border: 'none'
      }
    };
  }

  // Condition 2: Not a working day - Light brown color
  if (!dayTiming || !dayTiming.is_working_day) {
    return {
      className: 'rbc-slot-non-working',
      style: {
        backgroundColor: '#ecc38eff',
        cursor: 'not-allowed',
        pointerEvents: 'none',
        border: 'none'
      }
    };
  }

  // Parse bay timing hours
  const [bayStartHour, bayStartMinute] = dayTiming.start_time.split(':').map(Number);
  const [bayEndHour, bayEndMinute] = dayTiming.end_time.split(':').map(Number);

  // Get current slot hour and minute
  const slotHour = date.getHours();
  const slotMinute = date.getMinutes();

  // Condition 3: Outside operating hours - Light brown color
  const isBeforeStart = 
    slotHour < bayStartHour || 
    (slotHour === bayStartHour && slotMinute < bayStartMinute);
  
  const isAfterEnd = 
    slotHour > bayEndHour || 
    (slotHour === bayEndHour && slotMinute >= bayEndMinute);

  if (isBeforeStart || isAfterEnd) {
    return {
      className: 'rbc-slot-outside-hours',
      style: {
        backgroundColor: '#ecc38eff',
        cursor: 'not-allowed',
        pointerEvents: 'none',
        border: 'none'
      }
    };
  }

  // Available slots - default styling with no borders
  return {
    style: {
      border: 'none'
    }
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
    <div className="h-full flex flex-col" style={{ minHeight: '500px' }}>
      <Calendar
        ref={calendarRef}
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
        slotPropGetter={slotPropGetter}
        dayLayoutAlgorithm="no-overlap"
        min={new Date(0, 0, 0, 0, 0, 0)} // 12:00 AM - 24 hour format
        max={new Date(0, 0, 0, 23, 59, 0)} // 11:59 PM - 24 hour format
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
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [view, setView] = useState(Views.WEEK);
  const [isRebookMode, setIsRebookMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Force resize after component mounts to fix calendar layout
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);

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

  // Helper function to validate booking time against bay timings
  const validateBookingTime = (start: Date, end: Date): { isValid: boolean; message?: string } => {
    const now = new Date();
    
    // Check if booking is in the past
    if (isBefore(start, now)) {
      return { isValid: false, message: "Cannot book in the past" };
    }

    // Check bay timings for the specific day
    const dayName = format(start, 'eeee').toLowerCase();
    const dayTiming = bay.bay_timings.find((timing: any) => timing.day_of_week === dayName);

    // If no timing found or not a working day
    if (!dayTiming) {
      return { isValid: false, message: "No timing configuration found for this day" };
    }

    if (!dayTiming.is_working_day) {
      return { isValid: false, message: "Bay is not operational on this day" };
    }

    // Parse bay timing hours
    const [bayStartHour, bayStartMinute] = dayTiming.start_time.split(':').map(Number);
    const [bayEndHour, bayEndMinute] = dayTiming.end_time.split(':').map(Number);

    // Create date objects for bay timing boundaries
    const bayStartTime = new Date(start);
    bayStartTime.setHours(bayStartHour, bayStartMinute, 0, 0);

    const bayEndTime = new Date(start);
    bayEndTime.setHours(bayEndHour, bayEndMinute, 0, 0);

    // Check if booking is within bay operating hours
    const isStartWithinHours = isAfter(start, bayStartTime) || isSameDay(start, bayStartTime);
    const isEndWithinHours = isBefore(end, bayEndTime) || isSameDay(end, bayEndTime);

    if (!isStartWithinHours || !isEndWithinHours) {
      return { 
        isValid: false, 
        message: `Booking must be within bay operating hours: ${dayTiming.start_time} - ${dayTiming.end_time}` 
      };
    }

    return { isValid: true };
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Only allow creating if no existing booking for this field
    if (existingBooking && !isEditMode) {
      toast.error("This field already has a booking. Please edit the existing booking.");
      return;
    }
    
    const now = new Date();
    
    // Check if booking is in the past
    if (isBefore(start, now)) {
      toast.error("Cannot book in the past");
      return;
    }

    // Check bay timings for the specific day
    const dayName = format(start, 'eeee').toLowerCase();
    const dayTiming = bay.bay_timings.find((timing: any) => timing.day_of_week === dayName);

    // If no timing found or not a working day
    if (!dayTiming) {
      toast.error("No timing configuration found for this day");
      return;
    }

    if (!dayTiming.is_working_day) {
      toast.error("Bay is closed on this day");
      return;
    }

    // Parse bay timing hours
    const [bayStartHour, bayStartMinute] = dayTiming.start_time.split(':').map(Number);
    const [bayEndHour, bayEndMinute] = dayTiming.end_time.split(':').map(Number);

    // Create date objects for bay timing boundaries
    const bayStartTime = new Date(start);
    bayStartTime.setHours(bayStartHour, bayStartMinute, 0, 0);

    const bayEndTime = new Date(start);
    bayEndTime.setHours(bayEndHour, bayEndMinute, 0, 0);

    // Get current slot hour and minute
    const slotHour = start.getHours();
    const slotMinute = start.getMinutes();

    // Check if slot is before bay opening time
    const isBeforeStart = 
      slotHour < bayStartHour || 
      (slotHour === bayStartHour && slotMinute < bayStartMinute);
    
    // Check if slot is after bay closing time
    const isAfterEnd = 
      slotHour > bayEndHour || 
      (slotHour === bayEndHour && slotMinute >= bayEndMinute);

    if (isBeforeStart) {
      toast.error(`Bay opens at ${dayTiming.start_time}. Please select a time after opening.`);
      return;
    }

    if (isAfterEnd) {
      toast.error(`Bay closes at ${dayTiming.end_time}. Please select a time before closing.`);
      return;
    }

    // Check if booking is within bay operating hours
    const isStartWithinHours = isAfter(start, bayStartTime) || isSameDay(start, bayStartTime);
    const isEndWithinHours = isBefore(end, bayEndTime) || isSameDay(end, bayEndTime);

    if (!isStartWithinHours || !isEndWithinHours) {
      toast.error(`Booking must be within bay operating hours: ${dayTiming.start_time} - ${dayTiming.end_time}`);
      return;
    }

    // New condition: Check if booking end time exceeds bay closing time
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    const exceedsEndTime = 
      endHour > bayEndHour || 
      (endHour === bayEndHour && endMinute > bayEndMinute);

    if (exceedsEndTime) {
      toast.error(`Booking end time exceeds bay closing time of ${dayTiming.end_time}`);
      return;
    }

    // If all validations pass, proceed with booking
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

    // Validate booking time against bay timings
    const validation = validateBookingTime(startDate, endDate);
    if (!validation.isValid) {
      toast.error(validation.message);
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

  // Navigation functions for mobile
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">

      {/* Scrollable Calendar Content */}
      <div className="flex-1 min-h-0">
        <Card className="h-full border-0 rounded-none">
          <CardContent className="p-4 md:p-10 h-full">
            <CalendarView
              bay={bay}
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
              bayTimings={bay.bay_timings || []}
              onBack={onBack}
              onShowMenu={() => setShowMenuDialog(true)}
            />
          </CardContent>
        </Card>
      </div>

            {/* Desktop Footer - Only show on desktop */}
      {!isMobile && (
        <div className="flex-shrink-0 border-t bg-background p-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-100 border border-purple-500"></div>
                <span>Work Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-500"></div>
                <span>Rejected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-100 border border-gray-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-100 border border-orange-500"></div>
                <span>Rework</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#c39522] border border-[#c39522]"></div>
                <span>Past Days</span>
              </div>
            </div>
            
            {existingBooking && (
              <div className="text-sm text-amber-600 font-medium whitespace-nowrap">
                This field has an existing booking. Click on it to edit.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Dialog */}
      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Calendar Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Navigation Controls */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={navigateToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* View Controls */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={view === Views.DAY ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setView(Views.DAY);
                  setShowMenuDialog(false);
                }}
              >
                Day
              </Button>
              <Button
                variant={view === Views.WEEK ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setView(Views.WEEK);
                  setShowMenuDialog(false);
                }}
              >
                Week
              </Button>
              <Button
                variant={view === Views.MONTH ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setView(Views.MONTH);
                  setShowMenuDialog(false);
                }}
              >
                Month
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {existingBooking ? null : (
                <Button 
                  onClick={() => {
                    handleNewBooking();
                    setShowMenuDialog(false);
                  }} 
                  className="w-full"
                  disabled={!!existingBooking}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => {
                  onBack();
                  setShowMenuDialog(false);
                }} 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                minDate={new Date()}
              />

              <DateTimePicker
                label="End Date & Time"
                value={bookingEndTime}
                onChange={setBookingEndTime}
                placeholder="Select end time"
                required
                minDate={new Date(bookingStartTime) || new Date()}
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

            {/* Bay Timing Information */}
            {bookingStartTime && (
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <Label className="text-sm font-medium text-blue-800">Bay Availability</Label>
                <div className="text-xs text-blue-600 mt-1">
                  {(() => {
                    const startDate = new Date(bookingStartTime);
                    const dayName = format(startDate, 'eeee');
                    const dayTiming = bay.bay_timings.find((timing: any) => 
                      timing.day_of_week === dayName.toLowerCase()
                    );
                    
                    if (dayTiming && dayTiming.is_working_day) {
                      return `Bay operates from ${dayTiming.start_time} to ${dayTiming.end_time} on ${dayName}`;
                    } else {
                      return `Bay is closed on ${dayName}`;
                    }
                  })()}
                </div>
              </div>
            )}

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
                  <p className="text-sm mt-1 text-red-600">{selectedBooking.rejected_reason}</p>
                </div>
              )}
              
              {selectedBooking?.booking_description && (
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">
                    {selectedBooking.booking_description}
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
              
              {/* Show Edit button only if it's the current field's booking and status allows editing */}
              {isCurrentFieldBooking && 
              selectedBooking?.status !== "completed_jobs" &&
              selectedBooking?.status !== "work_in_progress" && (
                <Button onClick={handleEditBooking} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {selectedBooking?.status === "booking_rejected" ? "Rebook" : "Edit"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend Dialog */}
      <Dialog open={showLegendDialog} onOpenChange={setShowLegendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Status Legend</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {[
              {
                status: "booking_request",
                label: "Booking Request",
                description: "Booking has been requested and waiting for approval",
              },
              {
                status: "booking_accepted",
                label: "Booking Accepted",
                description: "Booking has been accepted by the bay owner",
              },
              {
                status: "booking_rejected",
                label: "Booking Rejected",
                description: "Booking has been rejected by the bay owner",
              },
              {
                status: "work_in_progress",
                label: "Work In Progress",
                description: "Work has started on the vehicle",
              },
              {
                status: "work_review",
                label: "Work Review",
                description: "Work completed and under review",
              },
              {
                status: "completed_jobs",
                label: "Completed Jobs",
                description: "Work has been completed successfully",
              },
              {
                status: "rework",
                label: "Rework",
                description: "Vehicle needs rework",
              },
              {
                status: "Holiday",
                label: "Holiday / Closed",
                description: "The Shop is Closed or declared Holiday",
              },
              {
                status: "Past",
                label: "Past Days",
                description: "These are the past days",
              },
            ].map((item) => (
              <div key={item.status} className="flex items-start gap-3">
                <div
                  className="w-4 h-4 rounded border mt-1 flex-shrink-0"
                  style={{
                    backgroundColor: getStatusColor(item.status, true),
                    borderColor: getStatusColor(item.status),
                  }}
                ></div>
                <div>
                  <p className="font-medium text-sm capitalize">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to get status color
const getStatusColor = (status: string, isBackground = false) => {
  const colors: Record<string, string> = {
    booking_request: isBackground ? "#fef3c7" : "#f59e0b",
    booking_accepted: isBackground ? "#d1fae5" : "#10b981",
    booking_rejected: isBackground ? "#fee2e2" : "#ef4444",
    work_in_progress: isBackground ? "#dbeafe" : "#3b82f6",
    work_review: isBackground ? "#e9d5ff" : "#8b5cf6",
    completed_jobs: isBackground ? "#f3f4f6" : "#6b7280",
    rework: isBackground ? "#ffedd5" : "#f97316",
    Holiday: isBackground ? "#ecc38eff" : "#f97316",
    Past: isBackground ? "#c39522ff" : "#f97316",
  };

  return colors[status] || (isBackground ? "#f3f4f6" : "#6b7280");
};

export default BayBookingCalendar;