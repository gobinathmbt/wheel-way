
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Upload, Download, Image, File, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { vehicleServices } from "@/api/services";

interface VehicleAttachmentsSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleAttachmentsSection: React.FC<VehicleAttachmentsSectionProps> = ({
  vehicle,
  onUpdate,
}) => {
  const attachments = vehicle.vehicle_attachments || [];
  
  // Group attachments by category
  const listImages = attachments.filter((att: any) => att.type === 'image' && att.image_category === 'listImage');
  const inspectionImages = attachments.filter((att: any) => att.type === 'image' && att.image_category === 'otherImage');
  const otherImages = attachments.filter((att: any) => att.type === 'image' && !att.image_category);
  const files = attachments.filter((att: any) => att.type === 'file');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await vehicleServices.deleteVehicleAttachment(vehicle._id, attachmentId);
      toast.success("Attachment deleted successfully");
      onUpdate();
    } catch (error) {
      toast.error("Failed to delete attachment");
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
                <Card key={item._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {item.type === 'image' ? (
                      <div className="relative">
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
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
                            onClick={() => handleDeleteAttachment(item._id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 flex items-center space-x-3">
                        <File className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.filename}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                        </div>
                        <div className="flex space-x-1">
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
                            onClick={() => handleDeleteAttachment(item._id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="p-2 border-t">
                      <p className="text-xs text-muted-foreground truncate">{item.filename}</p>
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

  if (attachments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No attachments found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Attachments</h3>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>

      <AttachmentGrid items={listImages} title="Listing Images" />
      <AttachmentGrid items={inspectionImages} title="Inspection Images" />
      <AttachmentGrid items={otherImages} title="Other Images" />
      <AttachmentGrid items={files} title="Files Details" />
    </div>
  );
};

export default VehicleAttachmentsSection;
