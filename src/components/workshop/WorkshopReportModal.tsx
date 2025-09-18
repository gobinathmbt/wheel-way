import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Calendar,
  DollarSign,
  User,
  MessageCircle,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  X,
  Wrench,
  TrendingUp,
  Users,
  Timer,
  Video,
  File,
  ZoomIn,
  Play,
} from "lucide-react";
import { workshopServices } from "@/api/services";
import { toast } from "sonner";
import MediaViewer, { MediaItem } from "@/components/common/MediaViewer";

interface WorkshopReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleType: "inspection" | "tradein";
  stageName?: string; // For inspection stages
}

interface WorkshopReport {
  _id: string;
  vehicle_id: string;
  company_id: string;
  vehicle_stock_id: number;
  vehicle_type: string;
  report_type: string;
  stage_name?: string;
  vehicle_details: {
    vin: string;
    plate_no: string;
    make: string;
    model: string;
    year: number;
    chassis_no: string;
    variant: string;
    hero_image: string;
    name: string;
  };
  workshop_summary: {
    total_fields: number;
    total_quotes: number;
    total_work_completed: number;
    total_cost: number;
    total_gst: number;
    grand_total: number;
    start_date: string;
    completion_date: string | null;
    duration_days: number | null;
  };
  quotes_data: QuoteData[];
  communications: Communication[];
  attachments: any[];
  statistics: {
    fields_by_status: {
      completed_jobs: number;
      work_review: number;
      work_in_progress: number;
      quote_approved: number;
      quote_sent: number;
      quote_request: number;
      rework: number;
    };
    avg_completion_time: number;
    cost_breakdown: {
      parts: number;
      labor: number;
      other: number;
    };
    supplier_performance: SupplierPerformance[];
  };
  created_at: string;
  updated_at: string;
}

interface QuoteData {
  field_id: string;
  field_name: string;
  category_name?: string;
  section_name?: string;
  quote_amount: number;
  quote_description: string;
  selected_suppliers: Supplier[];
  approved_supplier: Supplier | null;
  work_details: {
    final_price: number;
    gst_amount: number;
    amount_spent: number;
    total_amount: number;
    invoice_pdf_url: string;
    work_images: { url: string; _id: string }[];
    supplier_comments: string;
    submitted_at: string;
  };
  field_images: string[];
  field_videos: string[];
  quote_responses: QuoteResponse[];
  quote_created_at: string;
  status_history: any[];
}

interface Supplier {
  supplier_id: string;
  supplier_name: string;
  supplier_email: string;
  supplier_shop_name: string;
  approved_at?: string;
}

interface QuoteResponse {
  supplier_id: string;
  estimated_cost: number;
  estimated_time: string;
  comments: string;
  status: string;
  responded_at: string;
  _id: string;
}

interface Communication {
  conversation_id: string;
  supplier_id: string;
  field_id: string;
  field_name: string;
  total_messages: number;
  last_message_at: string;
  messages: Message[];
}

interface Message {
  sender_type: string;
  sender_name: string;
  message_type: string;
  content: string;
  file_url: string | null;
  _id: string;
}

interface SupplierPerformance {
  supplier_id: string;
  supplier_name: string;
  jobs_completed: number;
  avg_cost: number;
  avg_time: number;
  total_earned: number;
}

const WorkshopReportModal: React.FC<WorkshopReportModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleType,
  stageName,
}) => {
  const [reports, setReports] = useState<WorkshopReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<WorkshopReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("work_details");
  
  // Media viewer states
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen, vehicleId, vehicleType]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await workshopServices.getWorkshopReports(vehicleId, vehicleType);
      if (response.data.success) {
        setReports(response.data.data.reports);
        
        // Auto-select report based on vehicle type and stage
        if (vehicleType === "inspection" && stageName) {
          const stageReport = response.data.data.reports.find(
            (report: WorkshopReport) => report.stage_name === stageName
          );
          if (stageReport) {
            setSelectedReport(stageReport);
          }
        } else if (vehicleType === "tradein" && response.data.data.reports.length > 0) {
          setSelectedReport(response.data.data.reports[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching workshop reports:", error);
      toast.error("Failed to fetch workshop reports");
    } finally {
      setLoading(false);
    }
  };


  // Prepare media items from all quotes for MediaViewer
  const prepareAllMediaItems = (): MediaItem[] => {
    if (!selectedReport) return [];

    const allMedia: MediaItem[] = [];

    selectedReport.quotes_data.forEach((quote, quoteIndex) => {
      // Add work images
      quote.work_details?.work_images?.forEach((img, imgIndex) => {
        allMedia.push({
          id: `work-${quote.field_id}-${img._id}`,
          url: img.url,
          type: "image",
          title: `${quote.field_name} - Work Image ${imgIndex + 1}`,
          description: `Work completed image for ${quote.field_name}`
        });
      });

      // Add field images
      quote.field_images?.forEach((url, imgIndex) => {
        allMedia.push({
          id: `field-${quote.field_id}-${imgIndex}`,
          url: url,
          type: "image",
          title: `${quote.field_name} - Field Image ${imgIndex + 1}`,
          description: `Field image for ${quote.field_name}`
        });
      });

      // Add field videos
      quote.field_videos?.forEach((url, videoIndex) => {
        allMedia.push({
          id: `video-${quote.field_id}-${videoIndex}`,
          url: url,
          type: "video",
          title: `${quote.field_name} - Video ${videoIndex + 1}`,
          description: `Field video for ${quote.field_name}`
        });
      });
    });

    // Add communication images
    selectedReport.communications.forEach((comm) => {
      comm.messages?.forEach((msg, msgIndex) => {
        if (msg.message_type === 'image' && msg.file_url) {
          allMedia.push({
            id: `comm-${comm.conversation_id}-${msgIndex}`,
            url: msg.file_url,
            type: "image",
            title: `${comm.field_name} - Communication Image`,
            description: `Message from ${msg.sender_name}`
          });
        }
      });
    });

    return allMedia;
  };

  // Handle opening media viewer
  const handleOpenMediaViewer = (mediaId: string) => {
    setCurrentMediaId(mediaId);
    setMediaViewerOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed_jobs":
        return "default";
      case "work_in_progress":
        return "secondary";
      case "quote_approved":
        return "outline";
      case "rework":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const groupQuotesBySection = (quotes: QuoteData[]) => {
    const grouped: { [key: string]: { [key: string]: QuoteData[] } } = {};
    
    quotes.forEach((quote) => {
      const category = quote.category_name || "General";
      const section = quote.section_name || "Default";
      
      if (!grouped[category]) {
        grouped[category] = {};
      }
      if (!grouped[category][section]) {
        grouped[category][section] = [];
      }
      grouped[category][section].push(quote);
    });
    
    return grouped;
  };

  const MediaGallery = ({ images, videos, pdfs, fieldId }: { 
    images: string[], 
    videos: string[], 
    pdfs: string[],
    fieldId: string 
  }) => {
    const allMedia = [
      ...images.map((url, idx) => ({ type: 'image' as const, url, id: `${fieldId}-img-${idx}` })),
      ...videos.map((url, idx) => ({ type: 'video' as const, url, id: `${fieldId}-vid-${idx}` })),
      ...pdfs.map((url, idx) => ({ type: 'pdf' as const, url, id: `${fieldId}-pdf-${idx}` }))
    ];

    if (allMedia.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t">
        <span className="text-muted-foreground text-sm">Media Attachments:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {allMedia.slice(0, 6).map((media, idx) => (
            <div key={idx} className="relative group">
              {media.type === 'image' && (
                <div 
                  className="w-16 h-16 bg-gray-100 rounded border cursor-pointer overflow-hidden"
                  onClick={() => handleOpenMediaViewer(media.id)}
                >
                  <img 
                    src={media.url} 
                    alt="Media" 
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = 
                        '<div class="w-full h-full flex items-center justify-center bg-gray-100"><div class="h-6 w-6 text-gray-400">🖼️</div></div>';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              )}
              {media.type === 'video' && (
                <div 
                  className="w-16 h-16 bg-gray-900 rounded border flex items-center justify-center cursor-pointer relative overflow-hidden"
                  onClick={() => handleOpenMediaViewer(media.id)}
                >
                  <video src={media.url} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="h-6 w-6 text-white opacity-80" />
                  </div>
                </div>
              )}
              {media.type === 'pdf' && (
                <a 
                  href={media.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center cursor-pointer"
                >
                  <File className="h-6 w-6 text-gray-600" />
                </a>
              )}
            </div>
          ))}
          {allMedia.length > 6 && (
            <div 
              className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs cursor-pointer"
              onClick={() => {
                const firstImageId = allMedia.find(m => m.type === 'image')?.id;
                if (firstImageId) {
                  handleOpenMediaViewer(firstImageId);
                }
              }}
            >
              +{allMedia.length - 6}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Workshop Report</DialogTitle>
                  <DialogDescription>
                    {selectedReport?.vehicle_details.name || "Vehicle Workshop Report"}
                    {vehicleType === "inspection" && stageName && ` - ${stageName}`}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex h-[calc(90vh-80px)]">
            {/* Report Selection Sidebar */}
            {vehicleType === "inspection" && reports.length > 1 && (
              <div className="w-64 flex-shrink-0 border-r">
                <Card className="h-full rounded-none border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Select Stage Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-0">
                    <ScrollArea className="h-full px-4">
                      {reports.map((report) => (
                        <Button
                          key={report._id}
                          variant={selectedReport?._id === report._id ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start mb-2"
                          onClick={() => setSelectedReport(report)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {report.stage_name}
                        </Button>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Report Content */}
           <div className="flex-1 flex flex-col overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading workshop report...</p>
                  </div>
                </div>
              ) : selectedReport ? (
                <div className="h-full flex flex-col">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-4 gap-4 p-6 pb-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total Jobs</p>
                            <p className="text-lg font-semibold">{selectedReport.workshop_summary.total_work_completed}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Grand Total</p>
                            <p className="text-lg font-semibold">{formatCurrency(selectedReport.workshop_summary.grand_total)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Timer className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-lg font-semibold">
                              {selectedReport.workshop_summary.duration_days ? 
                                `${selectedReport.workshop_summary.duration_days} days` : 
                                "In Progress"
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-muted-foreground">Suppliers</p>
                            <p className="text-lg font-semibold">{selectedReport.statistics.supplier_performance.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Content Tabs */}
                 <Tabs defaultValue="work_details" className="flex-1 flex flex-col overflow-hidden px-6 pb-6" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="work_details">Work Details</TabsTrigger>
                      <TabsTrigger value="communications">Communications</TabsTrigger>
                      <TabsTrigger value="statistics">Statistics</TabsTrigger>
                      <TabsTrigger value="attachments">Attachments</TabsTrigger>
                    </TabsList>
                    
               <div className="flex-1 overflow-hidden mt-4" style={{ height: '400px' }}>
  <ScrollArea className="h-full">
                        {/* Work Details Tab */}
                        <TabsContent value="work_details" className="h-full m-0">
                          {Object.entries(groupQuotesBySection(selectedReport.quotes_data)).map(([category, sections]) => (
                            <div key={category} className="mb-6">
                              <h3 className="text-lg font-semibold mb-3">{category}</h3>
                              {Object.entries(sections).map(([section, quotes]) => (
                                <Accordion key={section} type="multiple" className="mb-4">
                                  <AccordionItem value={section}>
                                    <AccordionTrigger className="text-sm font-medium">
                                      {section} ({quotes.length} items)
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      {quotes.map((quote, idx) => (
                                        <Card key={idx} className="mb-3">
                                          <CardHeader className="py-3">
                                            <div className="flex justify-between items-center">
                                              <CardTitle className="text-sm">{quote.field_name}</CardTitle>
                                              <Badge variant="outline" className="ml-2">
                                                {formatCurrency(quote.work_details?.total_amount || quote.quote_amount)}
                                              </Badge>
                                            </div>
                                          </CardHeader>
                                          <CardContent className="py-3">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div>
                                                <p className="text-muted-foreground">Supplier</p>
                                                <p>{quote.approved_supplier?.supplier_name || "Not assigned"}</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground">Status</p>
                                                <div className="flex items-center">
                                                  {quote.work_details?.submitted_at ? (
                                                    <>
                                                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                                                      <span>Completed</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                                                      <span>Pending</span>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                              {quote.work_details?.supplier_comments && (
                                                <div className="col-span-2">
                                                  <p className="text-muted-foreground">Comments</p>
                                                  <p>{quote.work_details.supplier_comments}</p>
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Media Gallery */}
                                            <MediaGallery 
                                              images={[
                                                ...(quote.work_details?.work_images?.map(img => img.url) || []),
                                                ...quote.field_images
                                              ]}
                                              videos={quote.field_videos}
                                              pdfs={quote.work_details?.invoice_pdf_url ? [quote.work_details.invoice_pdf_url] : []}
                                              fieldId={quote.field_id}
                                            />
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              ))}
                            </div>
                          ))}
                        </TabsContent>
                        
                        {/* Communications Tab */}
                        <TabsContent value="communications" className="h-full m-0">
                          <h3 className="text-lg font-semibold mb-4">Communications</h3>
                          {selectedReport.communications.length > 0 ? (
                            <Accordion type="multiple">
                              {selectedReport.communications.map((comm, idx) => (
                                <AccordionItem key={idx} value={comm.conversation_id}>
                                  <AccordionTrigger>
                                    <div className="flex items-center">
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      <span>{comm.field_name}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {comm.total_messages} messages
                                      </Badge>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="space-y-3">
                                      {comm.messages.map((msg, msgIdx) => (
                                        <div key={msgIdx} className={`flex ${msg.sender_type === 'company' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-xs p-3 rounded-lg ${msg.sender_type === 'company' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                            <div className="text-xs font-medium mb-1">{msg.sender_name}</div>
                                            {msg.message_type === 'text' ? (
                                              <p className="text-sm">{msg.content}</p>
                                            ) : msg.message_type === 'image' ? (
                                              <img 
                                                src={msg.file_url || ''} 
                                                alt="Message attachment" 
                                                className="w-32 h-32 object-cover rounded cursor-pointer"
                                                onClick={() => handleOpenMediaViewer(`comm-${comm.conversation_id}-${msgIdx}`)}
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).style.display = 'none';
                                                  (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                                    '<div class="w-32 h-32 flex items-center justify-center bg-gray-200 rounded"><div class="h-8 w-8 text-gray-400">🖼️</div></div>';
                                                }}
                                              />
                                            ) : (
                                              <div className="flex items-center text-sm">
                                                <File className="h-4 w-4 mr-1" />
                                                <a href={msg.file_url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                  {msg.content}
                                                </a>
                                              </div>
                                            )}
                                            <div className="text-xs text-muted-foreground mt-1">
                                              {formatDate(comm.last_message_at)}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                              <p>No communications found</p>
                            </div>
                          )}
                        </TabsContent>
                        
                        {/* Statistics Tab */}
                        <TabsContent value="statistics" className="h-full m-0">
                          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                          
                          <div className="grid grid-cols-2 gap-6 mb-6">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Job Status</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {Object.entries(selectedReport.statistics.fields_by_status).map(([status, count]) => (
                                    <div key={status} className="flex justify-between items-center">
                                      <span className="text-sm capitalize">
                                        {status.replace(/_/g, ' ')}:
                                      </span>
                                      <Badge variant={getStatusBadgeVariant(status)}>
                                        {count}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Cost Breakdown</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm">Parts:</span>
                                    <span className="font-medium">{formatCurrency(selectedReport.statistics.cost_breakdown.parts)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Labor:</span>
                                    <span className="font-medium">{formatCurrency(selectedReport.statistics.cost_breakdown.labor)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm">Other:</span>
                                    <span className="font-medium">{formatCurrency(selectedReport.statistics.cost_breakdown.other)}</span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between font-semibold">
                                    <span className="text-sm">Total:</span>
                                    <span>{formatCurrency(selectedReport.workshop_summary.grand_total)}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Supplier Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {selectedReport.statistics.supplier_performance.length > 0 ? (
                                <div className="space-y-4">
                                  {selectedReport.statistics.supplier_performance.map((supplier, idx) => (
                                    <div key={idx} className="border rounded-lg p-3">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium">{supplier.supplier_name}</span>
                                        <Badge variant="outline">{supplier.jobs_completed} jobs</Badge>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Avg. Cost:</span>
                                          <p>{formatCurrency(supplier.avg_cost)}</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Avg. Time:</span>
                                          <p>{supplier.avg_time} days</p>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Total Earned:</span>
                                          <p>{formatCurrency(supplier.total_earned)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm">No supplier data available</p>
                              )}
                            </CardContent>
                          </Card>
                        </TabsContent>
                        
                        {/* Attachments Tab */}
                        <TabsContent value="attachments" className="h-full m-0">
                          <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                          
                          {selectedReport.attachments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedReport.attachments.map((attachment, idx) => (
                                <Card key={idx}>
                                  <CardContent className="p-4 flex items-center">
                                    <File className="h-8 w-8 mr-3 text-blue-500" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium truncate">{attachment.name || `Attachment ${idx + 1}`}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(attachment.uploadedAt || Date.now()).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <File className="h-12 w-12 mx-auto mb-2 opacity-30" />
                              <p>No attachments found</p>
                            </div>
                          )}
                        </TabsContent>
                      </ScrollArea>
                    </div>
                  </Tabs>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">No workshop report found</p>
                    <Button onClick={fetchReports}>Try Again</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Media Viewer */}
      <MediaViewer
        media={prepareAllMediaItems()}
        currentMediaId={currentMediaId}
        isOpen={mediaViewerOpen}
        onClose={() => setMediaViewerOpen(false)}
      />
    </>
  );
};

export default WorkshopReportModal;