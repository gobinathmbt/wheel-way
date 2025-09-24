import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, TrendingUp, Shield, FileText, MessageSquare } from "lucide-react";

import ProgressSummaryTab from "./CommentSheetTabs/Tabs/ProgressSummaryTab";
import WorkEntriesTab from "./CommentSheetTabs/Tabs/WorkEntriesTab";
import QualityWarrantyTab from "./CommentSheetTabs/Tabs/QualityWarrantyTab";
import DocumentationTab from "./CommentSheetTabs/Tabs/DocumentationTab";
import CommentsTab from "./CommentSheetTabs/Tabs/CommentsTab";

interface WorkEntry {
  id: string;
  description: string;
  parts_cost: string;
  labor_cost: string;
  gst: string;
  parts_used: string;
  labor_hours: string;
  technician: string;
  completed: boolean;
  entry_date: string;
  entry_time: string;
  estimated_time: string;
  invoices: Array<{ url: string; key: string; description: string }>;
  pdfs: Array<{ url: string; key: string; description: string }>;
  videos: Array<{ url: string; key: string; description: string }>;
  warranties: Array<{ part: string; months: string; supplier: string; document?: { url: string; key: string; description: string } }>;
  documents: Array<{ url: string; key: string; description: string }>;
  images: Array<{ url: string; key: string; description: string }>;
  persons: Array<{ name: string; role: string; contact: string }>;
  quality_check: {
    visual_inspection: boolean;
    functional_test: boolean;
    road_test: boolean;
    safety_check: boolean;
    notes: string;
  };
  comments: string;
}

export interface FormData {
  work_entries: WorkEntry[];
  warranty_months: string;
  maintenance_recommendations: string;
  next_service_due: string;
  supplier_comments: string;
  company_feedback: string;
  customer_satisfaction: string;
  workMode: any;
  technician_assigned: string;
  work_completion_date: string;
}

interface CommentSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  workMode: any;
  mode: "supplier_submit" | "company_review";
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const CommentSheetModal: React.FC<CommentSheetModalProps> = ({
  open,
  onOpenChange,
  quote,
  workMode,
  mode,
  onSubmit,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState("summary");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    work_entries: [],
    warranty_months: "12",
    maintenance_recommendations: "",
    next_service_due: "",
    supplier_comments: "",
    company_feedback: "",
    customer_satisfaction: "",
    workMode: workMode,
    technician_assigned: "",
    work_completion_date: "",
  });

  useEffect(() => {
    if (quote?.comment_sheet) {
      const sheet = quote.comment_sheet;
      setFormData({
        work_entries: sheet.work_entries || [],
        warranty_months: sheet.warranty_months || "12",
        maintenance_recommendations: sheet.maintenance_recommendations || "",
        next_service_due: sheet.next_service_due || "",
        supplier_comments: sheet.supplier_comments || "",
        company_feedback: sheet.company_feedback || "",
        customer_satisfaction: sheet.customer_satisfaction || "",
        workMode: sheet.workMode || workMode,
        technician_assigned: sheet.technician_assigned || "",
        work_completion_date: sheet.work_completion_date || "",
      });
    }
  }, [quote, workMode]);

  const calculateEntryTotal = (entry: WorkEntry) => {
    const parts = parseFloat(entry.parts_cost) || 0;
    const labor = parseFloat(entry.labor_cost) || 0;
    const gst = parseFloat(entry.gst) || 0;
    return parts + labor + gst;
  };

  const calculateGrandTotal = () => {
    return formData.work_entries.reduce((total, entry) => {
      return total + calculateEntryTotal(entry);
    }, 0);
  };

  const getQuoteDifference = () => {
    const total = calculateGrandTotal();
    const quoteAmount = quote?.quote_amount || 0;
    return total - quoteAmount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "supplier_submit") {
      if (formData.work_entries.length === 0) {
        alert("Please add at least one work entry");
        return;
      }
    }

    const submitData = {
      ...formData,
      total_amount: calculateGrandTotal(),
      quote_difference: getQuoteDifference(),
      workMode: workMode,
    };

    onSubmit(submitData);
  };

  const isReadOnly = mode === "company_review";

  const commonProps = {
    formData,
    setFormData,
    quote,
    mode,
    isReadOnly,
    uploading,
    setUploading,
    expandedEntry,
    setExpandedEntry,
    calculateEntryTotal,
    calculateGrandTotal,
    getQuoteDifference,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <DialogHeader className="pb-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 -m-6 px-4 py-3 mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold">
                {mode === "supplier_submit"
                  ? `${workMode === "submit" ? "Submit Work Details" : "Update Work Details"}`
                  : "Review Work Submission"}
              </div>
              <div className="text-xs text-muted-foreground font-normal">
                {quote?.field_name} • Stock ID: {quote?.vehicle_stock_id}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-0.5 rounded-lg mb-3 h-12">
              <TabsTrigger value="summary" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs px-2">
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
              <TabsTrigger value="work-entries" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs px-2">
                <Wrench className="h-3 w-3" />
                <span className="hidden sm:inline">Work</span>
              </TabsTrigger>
              <TabsTrigger value="quality-warranty" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs px-2">
                <Shield className="h-3 w-3" />
                <span className="hidden sm:inline">Quality</span>
              </TabsTrigger>
              <TabsTrigger value="documentation" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs px-2">
                <FileText className="h-3 w-3" />
                <span className="hidden sm:inline">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs px-2">
                <MessageSquare className="h-3 w-3" />
                <span className="hidden sm:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4 pb-16">
                <TabsContent value="summary" className="space-y-4 mt-0">
                  <ProgressSummaryTab {...commonProps} />
                </TabsContent>

                <TabsContent value="work-entries" className="space-y-3 mt-0">
                  <WorkEntriesTab {...commonProps} />
                </TabsContent>

                <TabsContent value="quality-warranty" className="space-y-3 mt-0">
                  <QualityWarrantyTab {...commonProps} />
                </TabsContent>

                <TabsContent value="documentation" className="space-y-3 mt-0">
                  <DocumentationTab {...commonProps} />
                </TabsContent>

                <TabsContent value="comments" className="space-y-3 mt-0">
                  <CommentsTab {...commonProps} workMode={workMode} />
                </TabsContent>
              </form>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 pt-3 border-t mt-3">
          <div className="text-xs text-muted-foreground flex items-center gap-4">
            {uploading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span>Uploading...</span>
              </div>
            )}
            <div className="hidden md:block">
              Total: <span className="font-bold text-green-600">${calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="min-w-[80px] h-9 text-sm"
            >
              {mode === "company_review" ? "Close" : "Cancel"}
            </Button>

            {!isReadOnly && (
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={loading || uploading}
                className="min-w-[120px] h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : (
                  `${mode === "supplier_submit"
                    ? `${workMode === "submit" ? "Submit Work" : "Update Work"}`
                    : "Save Review"}`
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommentSheetModal;