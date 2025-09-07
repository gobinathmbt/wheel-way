import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { workshopServices } from "@/api/services";
import {
  CheckCircle,
  RefreshCw,
  FileText,
  DollarSign,
  Eye,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CombinedWorkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: any;
  onSuccess: () => void;
  mode: "view" | "final"; // 'view' for work review, 'final' for completed work
}

const CombinedWorkModal: React.FC<CombinedWorkModalProps> = ({
  open,
  onOpenChange,
  field,
  onSuccess,
  mode,
}) => {
  const [reworkReason, setReworkReason] = useState("");

  // Fetch work details
  const { data: quoteData, isLoading } = useQuery({
    queryKey: [
      "field-work-details",
      field?.vehicle_type,
      field?.vehicle_stock_id,
      field?.field_id,
    ],
    queryFn: async () => {
      if (!field) return null;
      const response = await workshopServices.getQuotesForField(
        field.vehicle_type,
        field.vehicle_stock_id,
        field.field_id
      );
      return response.data.data;
    },
    enabled: open && !!field,
  });

  // Accept work mutation (for view mode)
  const acceptWorkMutation = useMutation({
    mutationFn: async () => {
      const response = await workshopServices.acceptWork(quoteData._id);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Work accepted successfully");
      onSuccess();
    },
    onError: () => toast.error("Failed to accept work"),
  });

  // Request rework mutation (for view mode)
  const requestReworkMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await workshopServices.requestRework(
        quoteData._id,
        reason
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Rework request sent to supplier");
      setReworkReason("");
      onSuccess();
    },
    onError: () => toast.error("Failed to request rework"),
  });

  const handleAcceptWork = () => {
    acceptWorkMutation.mutate();
  };

  const handleRequestRework = () => {
    if (!reworkReason.trim()) {
      toast.error("Please provide a reason for rework");
      return;
    }
    requestReworkMutation.mutate(reworkReason);
  };

  const quote = quoteData;
  const commentSheet = quote?.comment_sheet;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "view" ? (
              <Eye className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            {mode === "view" ? "Work Submission Review" : "Final Work Details"} -{" "}
            {field?.field_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : commentSheet ? (
            <>
              {/* Work Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      Work {mode === "final" ? "Completed" : "Submitted"} by{" "}
                      {quote?.approved_supplier?.name}
                    </span>
                    <Badge
                      variant={
                        mode === "final"
                          ? "default"
                          : quote?.status === "work_review"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {mode === "final"
                        ? "Completed"
                        : quote?.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Final Price
                      </p>
                      <p className="font-bold">${commentSheet.final_price}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                        GST
                      </div>
                      <p className="text-sm text-muted-foreground">
                        GST Amount
                      </p>
                      <p className="font-bold">${commentSheet.gst_amount}</p>
                    </div>
                    <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary">
                      <div className="h-8 w-8 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total Amount
                      </p>
                      <p className="font-bold text-lg text-primary">
                        ${commentSheet.total_amount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Comments */}
                    <div>
                      <h4 className="font-medium mb-2">Supplier Comments</h4>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm">
                          {commentSheet.supplier_comments}
                        </p>
                      </div>
                    </div>

                    {/* Invoice */}
                    {commentSheet.invoice_pdf_url && (
                      <div>
                        <h4 className="font-medium mb-2">Invoice</h4>
                        <Button variant="outline" asChild>
                          <a
                            href={commentSheet.invoice_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Invoice PDF
                          </a>
                        </Button>
                      </div>
                    )}

                    {/* Work Images */}
                    {commentSheet.work_images?.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Work Images</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {commentSheet.work_images.map(
                            (image: any, idx: number) => (
                              <div
                                key={idx}
                                className="aspect-square rounded-lg overflow-hidden border"
                              >
                                <img
                                  src={image.url}
                                  alt={`Work ${idx + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
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

                    {/* Dates */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      {commentSheet.submitted_at && (
                        <div>
                          Work submitted on:{" "}
                          {new Date(
                            commentSheet.submitted_at
                          ).toLocaleString()}
                        </div>
                      )}
                      {quote?.work_started_at && (
                        <div>
                          Work started on:{" "}
                          {new Date(quote.work_started_at).toLocaleString()}
                        </div>
                      )}
                      {quote?.work_submitted_at && (
                        <div>
                          Work completed on:{" "}
                          {new Date(
                            quote.work_submitted_at
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rework Reason (only in view mode) */}
              {mode === "view" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rework Request</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Textarea
                      placeholder="Provide detailed reason for rework request..."
                      value={reworkReason}
                      onChange={(e) => setReworkReason(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-muted-foreground">
                  No work {mode === "view" ? "submission" : "details"} found
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer with Actions */}
        <DialogFooter className="flex justify-between gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {commentSheet && mode === "view" && (
            <div className="flex gap-2">
              <Button
                onClick={handleRequestRework}
                disabled={
                  !reworkReason.trim() || requestReworkMutation.isPending
                }
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {requestReworkMutation.isPending
                  ? "Requesting..."
                  : "Request Rework"}
              </Button>
              <Button
                onClick={handleAcceptWork}
                disabled={acceptWorkMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {acceptWorkMutation.isPending ? "Accepting..." : "Accept Work"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CombinedWorkModal;