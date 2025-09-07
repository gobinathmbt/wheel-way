import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  DollarSign, 
  FileText, 
  Upload, 
  X, 
  Download,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { S3Uploader } from '@/lib/s3-client';

interface CommentSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any;
  workMode: any;
  mode: 'supplier_submit' | 'company_review';
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
  loading = false
}) => {
  const [formData, setFormData] = useState({
    final_price: '',
    gst_amount: '',
    amount_spent: '',
    supplier_comments: '',
    company_feedback: '',
    invoice_pdf_url: '',
    invoice_pdf_key: '',
    workMode:workMode,
    work_images: [] as Array<{ url: string; key: string }>
  });
  
  const [uploading, setUploading] = useState(false);
  const [s3Uploader, setS3Uploader] = useState<S3Uploader | null>(null);

  useEffect(() => {
    // Initialize S3 uploader with company config
    // This would typically come from your settings/config
    const initializeS3 = async () => {
      try {
        // Get S3 config from your settings API
        const config = {
          region: 'us-east-1',
          bucket: 'your-bucket-name',
          access_key: 'your-access-key',
          secret_key: 'your-secret-key'
        };
        
        setS3Uploader(new S3Uploader(config));
      } catch (error) {
        console.error('Failed to initialize S3:', error);
      }
    };

    initializeS3();
  }, []);

  useEffect(() => {
    if (quote?.comment_sheet) {
      const sheet = quote.comment_sheet;
      setFormData({
        final_price: sheet.final_price?.toString() || '',
        gst_amount: sheet.gst_amount?.toString() || '',
        amount_spent: sheet.amount_spent?.toString() || '',
        supplier_comments: sheet.supplier_comments || '',
        company_feedback: sheet.company_feedback || '',
        invoice_pdf_url: sheet.invoice_pdf_url || '',
        invoice_pdf_key: sheet.invoice_pdf_key || '',
        workMode: sheet.workMode || '',
        work_images: sheet.work_images || []
      });
    }
  }, [quote]);

  const handleFileUpload = async (file: File, type: 'pdf' | 'image') => {
    if (!s3Uploader) {
      toast.error('S3 uploader not initialized');
      return;
    }

    setUploading(true);
    try {
      const category = type === 'pdf' ? 'document' : 'otherImage';
      const result = await s3Uploader.uploadFile(file, category);
      
      if (type === 'pdf') {
        setFormData(prev => ({
          ...prev,
          invoice_pdf_url: result.url,
          invoice_pdf_key: result.key
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          work_images: [...prev.work_images, { url: result.url, key: result.key }]
        }));
      }
      
      toast.success(`${type.toUpperCase()} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      work_images: prev.work_images.filter((_, i) => i !== index)
    }));
  };

  const removePDF = () => {
    setFormData(prev => ({
      ...prev,
      invoice_pdf_url: '',
      invoice_pdf_key: ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'supplier_submit') {
      if (!formData.final_price) {
        toast.error('Please enter the final price');
        return;
      }
    }

    const submitData = {
      ...formData,
      final_price: parseFloat(formData.final_price) || 0,
      gst_amount: parseFloat(formData.gst_amount) || 0,
      amount_spent: parseFloat(formData.amount_spent) || 0,
      total_amount: (parseFloat(formData.final_price) || 0) + (parseFloat(formData.gst_amount) || 0),
      workMode: workMode
    };

    onSubmit(submitData);
  };

  const isReadOnly = mode === 'company_review';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'supplier_submit' ? `${workMode === "submit"?"Submit Work Details":"Update Work Details" }` : 'Review Work Submission'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quote Information */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Quote Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Field Name</Label>
                  <p className="font-medium">{quote?.field_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Original Quote Amount</Label>
                  <p className="font-medium">${quote?.quote_amount}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">Stock ID: {quote?.vehicle_stock_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="outline">{quote?.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="final_price">Final Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="final_price"
                      type="number"
                      step="0.01"
                      value={formData.final_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, final_price: e.target.value }))}
                      placeholder="0.00"
                      className="pl-10"
                      readOnly={isReadOnly}
                      required={mode === 'supplier_submit'}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="gst_amount">GST Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="gst_amount"
                      type="number"
                      step="0.01"
                      value={formData.gst_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, gst_amount: e.target.value }))}
                      placeholder="0.00"
                      className="pl-10"
                      readOnly={isReadOnly}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="amount_spent">Amount Spent</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount_spent"
                      type="number"
                      step="0.01"
                      value={formData.amount_spent}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount_spent: e.target.value }))}
                      placeholder="0.00"
                      className="pl-10"
                      readOnly={isReadOnly}
                    />
                  </div>
                </div>
              </div>
              
              {(formData.final_price || formData.gst_amount) && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Amount:</span>
                    <span>${((parseFloat(formData.final_price) || 0) + (parseFloat(formData.gst_amount) || 0)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice PDF */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Invoice Document</h3>
              
              {formData.invoice_pdf_url ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">Invoice PDF uploaded</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(formData.invoice_pdf_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removePDF}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                !isReadOnly && (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    <input
                      type="file"
                      id="pdf-upload"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, 'pdf');
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload invoice PDF
                      </span>
                    </label>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Work Images */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Work Images</h3>
              
              {formData.work_images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {formData.work_images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={`Work image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {!isReadOnly && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => handleFileUpload(file, 'image'));
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload work images
                    </span>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {mode === 'supplier_submit' ? (
                  <div>
                    <Label htmlFor="supplier_comments">Work Description & Comments *</Label>
                    <Textarea
                      id="supplier_comments"
                      value={formData.supplier_comments}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_comments: e.target.value }))}
                      placeholder="Describe the work completed, any issues encountered, etc."
                      rows={4}
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Supplier Comments</Label>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        {formData.supplier_comments || 'No comments provided'}
                      </div>
                    </div>
                    
                    {quote?.status === 'work_review' && (
                      <div>
                        <Label htmlFor="company_feedback">Company Feedback</Label>
                        <Textarea
                          id="company_feedback"
                          value={formData.company_feedback}
                          onChange={(e) => setFormData(prev => ({ ...prev, company_feedback: e.target.value }))}
                          placeholder="Provide feedback on the completed work"
                          rows={3}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {mode === 'company_review' ? 'Close' : 'Cancel'}
            </Button>
            
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={loading || uploading}
              >
                {loading ? 'Processing...' : mode === 'supplier_submit' ? `${workMode === "submit"?"Submit Work":"Update Work" }` : 'Save Feedback'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommentSheetModal;