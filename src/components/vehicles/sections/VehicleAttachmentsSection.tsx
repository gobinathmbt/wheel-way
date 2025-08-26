
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileUpload, FilePreview } from "@/components/ui/file-upload";
import { Upload, Download, Image, File, Trash2, Eye, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vehicleServices, companyServices } from "@/api/services";
import { S3Uploader, S3Config } from "@/lib/s3-client";

interface VehicleAttachmentsSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleAttachmentsSection: React.FC<VehicleAttachmentsSectionProps> = ({
  vehicle,
  onUpdate,
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'images' | 'files'>('images');
  const [uploadCategory, setUploadCategory] = useState<string>('listImage');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [s3Config, setS3Config] = useState<S3Config | null>(null);
  const [s3Uploader, setS3Uploader] = useState<S3Uploader | null>(null);

  const attachments = vehicle.vehicle_attachments || [];
  
  // Group attachments by category
  const listImages = attachments.filter((att: any) => att.type === 'image' && att.image_category === 'listImage');
  const inspectionImages = attachments.filter((att: any) => att.type === 'image' && att.image_category === 'inspectionImage');
  const otherImages = attachments.filter((att: any) => att.type === 'image' && (att.image_category === 'otherImage' || !att.image_category));
  const documents = attachments.filter((att: any) => att.type === 'file');

  useEffect(() => {
    loadS3Config();
  }, []);

  const loadS3Config = async () => {
    try {
      const response = await companyServices.getS3Config();
      console.log('S3 config response:', response);
      const config = response.data.data;
      
     if (config && config.bucket && config.access_key) {
        // Map the API response to our S3Config interface
        const s3ConfigMapped: S3Config = {
          region: config.region,
          bucket: config.bucket,
          access_key: config.access_key,
          secret_key: config.secret_key,
          url: config.url
        };
        
        setS3Config(s3ConfigMapped);
        setS3Uploader(new S3Uploader(s3ConfigMapped));
      } else {
        toast.error("S3 configuration not found. Please configure S3 settings first.");
      }
    } catch (error) {
      toast.error("Failed to load S3 configuration");
      console.error('S3 config error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToS3AndSave = async () => {
    if (!s3Uploader || selectedFiles.length === 0) return;

    setUploading(true);
    const uploadedAttachments = [];

    try {
      for (const [index, file] of selectedFiles.entries()) {
        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Determine category folder for S3
      const s3Category = uploadType === 'images' ? uploadCategory : 'document';
        
        // Upload to S3
        const uploadResult = await s3Uploader.uploadFile(file, s3Category);
        
        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        // Prepare attachment data
        const attachmentData = {
          vehicle_stock_id: vehicle.vehicle_stock_id,
          type: uploadType === 'images' ? 'image' : 'file',
          url: uploadResult.url,
          s3_key: uploadResult.key,
          s3_bucket: s3Config?.bucket,
          size: uploadResult.size,
          mime_type: file.type,
          filename: file.name,
          original_filename: file.name,
          position: attachments.length + index,
          ...(uploadType === 'images' 
            ? { image_category: uploadCategory }
            : { file_category: 'document' }
          )
        };

        uploadedAttachments.push(attachmentData);
      }

      // Save all attachments to backend
      for (const attachmentData of uploadedAttachments) {
        await vehicleServices.uploadVehicleAttachment(vehicle._id, attachmentData);
      }

      toast.success(`Successfully uploaded ${selectedFiles.length} ${uploadType}`);
      setSelectedFiles([]);
      setUploadDialogOpen(false);
      setUploadProgress({});
      onUpdate();
    } catch (error) {
      toast.error("Failed to upload files");
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachment: any) => {
    try {
      // Delete from S3 if s3_key exists
      if (s3Uploader && attachment.s3_key) {
        await s3Uploader.deleteFile(attachment.s3_key);
      }

      // Delete from backend
      await vehicleServices.deleteVehicleAttachment(vehicle._id, attachment._id);
      
      toast.success("Attachment deleted successfully");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete attachment");
      console.error('Delete error:', error);
    }
  };

  const handleViewAttachment = (url: string) => {
    window.open(url, '_blank');
  };

  const AttachmentGrid = ({ items, title }: { items: any[]; title: string }) => {
    if (items.length === 0) return null;

    return (
      <Accordion type="single" collapsible>
        <AccordionItem value={title.toLowerCase().replace(' ', '-')}>
          <AccordionTrigger>
            <div className="flex items-center justify-between w-full mr-4">
              <span>{title}</span>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item: any) => (
                <Card key={item._id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    {item.type === 'image' ? (
                      <div className="relative">
                        <img
                          src={item.url}
                          alt={item.original_filename || item.filename}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAttachment(item.url)}
                            className="text-white hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(item)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 flex items-center space-x-3">
                        <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.original_filename || item.filename}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                        </div>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAttachment(item.url)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAttachment(item)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="p-2 border-t bg-muted/50">
                      <p className="text-xs text-muted-foreground truncate">
                        {item.original_filename || item.filename}
                      </p>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  if (attachments.length === 0 && !s3Config) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No attachments found</p>
          <p className="text-sm text-muted-foreground">Configure S3 settings to enable file uploads</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attachments</h3>
        {s3Config && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Upload Attachments</DialogTitle>
              </DialogHeader>
              
              <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as 'images' | 'files')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="files">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="images" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="listImage">Listing Images</option>
                      <option value="inspectionImage">Inspection Images</option>
                      <option value="otherImage">Other Images</option>
                    </select>
                  </div>
                  
                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    accept="images"
                    multiple={true}
                    maxSize={10 * 1024 * 1024} // 10MB
                  />
                </TabsContent>
                
                <TabsContent value="files" className="space-y-4">
                  <FileUpload
                    onFilesSelected={handleFilesSelected}
                    accept="files"
                    multiple={true}
                    maxSize={25 * 1024 * 1024} // 25MB for documents
                  />
                </TabsContent>
              </Tabs>

              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                    <Button
                      onClick={uploadToS3AndSave}
                      disabled={uploading}
                      size="sm"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload All
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <FilePreview
                    files={selectedFiles}
                    onRemove={handleRemoveFile}
                    progress={uploadProgress}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {attachments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No attachments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AttachmentGrid items={listImages} title="Listing Images" />
          <AttachmentGrid items={inspectionImages} title="Inspection Images" />
          <AttachmentGrid items={otherImages} title="Other Images" />
          <AttachmentGrid items={documents} title="Documents" />
        </div>
      )}
    </div>
  );
};

export default VehicleAttachmentsSection;
