import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, X, FileText, Car, Calendar, Save } from "lucide-react";
import jsPDF from "jspdf";
import { S3Uploader } from "@/lib/s3-client";
import { toast } from "sonner";

interface PdfReportData {
  category: string;
  link: string;
}

interface PdfReportGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  vehicle: any;
  config: any;
  vehicleType: string;
  s3Uploader: S3Uploader | null;
  onPdfUploaded: (pdfData: PdfReportData[]) => void;
  inspectorId: string;
  currentCategory: string;
  onPdfGeneratorReady?: (generatePdfFn: () => Promise<void>) => void;
}

interface SelectedCategories {
  [categoryId: string]: boolean;
}

const PdfReportGenerator: React.FC<PdfReportGeneratorProps> = ({
  isOpen,
  onClose,
  data,
  vehicle,
  config,
  vehicleType,
  s3Uploader,
  onPdfUploaded,
  inspectorId,
  currentCategory,
  onPdfGeneratorReady,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedCategories, setSelectedCategories] =
    useState<SelectedCategories>({});

  // Initialize selected categories based on current category

  React.useEffect(() => {
    if (onPdfGeneratorReady && config && data) {
      onPdfGeneratorReady(generatePdf);
    }
  }, [onPdfGeneratorReady, config, data, vehicle, currentCategory]);
  React.useEffect(() => {
    if (config?.categories) {
      const targetCategory = config.categories.find(
        (category: any) => category.category_id === currentCategory
      );

      if (targetCategory) {
        setSelectedCategories({ [targetCategory.category_id]: true });
      } else if (config.categories.length > 0) {
        // fallback
        setSelectedCategories({ [config.categories[0].category_id]: true });
      }
    }
  }, [config?.categories, currentCategory]);

  const getSelectedCategories = () => {
    return config.categories
      .filter((category: any) => selectedCategories[category.category_id])
      .sort(
        (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
      );
  };

  const getSelectedCategoryName = () => {
    const selected = getSelectedCategories();
    if (selected.length > 0) {
      return selected[0].category_name;
    }

    // Fallback: try to find category by ID
    if (currentCategory && config?.categories) {
      const category = config.categories.find(
        (cat) => cat.category_id === currentCategory
      );
      return category?.category_name || "Unknown Category";
    }

    return "Unknown Category";
  };

  const generatePdf = async () => {
    setGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = 25;

      // Add header function
      const addHeader = (pageNum: number) => {
        pdf.setFillColor(245, 247, 250);
        pdf.rect(0, 0, pageWidth, 25, "F");

        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text("Vehicle ERP", pageWidth / 2, 15, { align: "center" });

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          `Generated on: ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          pageWidth / 2,
          22,
          { align: "center" }
        );

        // Draw header line
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, 25, pageWidth - margin, 25);
      };

      // Add footer function
      const addFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 15;
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);

        // Footer line
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        pdf.text(
          `© ${new Date().getFullYear()} Vehicle Inspection System`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        );
        pdf.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth - margin,
          footerY,
          { align: "right" }
        );
      };

      // Check if new page is needed
      const checkPageBreak = (requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - 30) {
          pdf.addPage();
          addHeader(pdf.getNumberOfPages());
          currentY = 35;
        }
      };

      // Add text with word wrap
      const addWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        fontSize: number = 10,
        fontStyle: string = "normal",
        lineHeight: number = 0.4
      ) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", fontStyle);
        const lines = pdf.splitTextToSize(text, maxWidth);
        const calculatedLineHeight = fontSize * lineHeight;

        lines.forEach((line: string, index: number) => {
          checkPageBreak(calculatedLineHeight);
          pdf.text(line, x, currentY);
          currentY += calculatedLineHeight;
        });
        return currentY;
      };

      // Add section with title and background
      const addSection = (title: string, y: number, bgColor: number[]) => {
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(margin, y - 3, contentWidth, 12, "F");
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(255, 255, 255);
        pdf.text(title, margin + 5, y + 5);
        return y + 15;
      };

      // Start first page
      addHeader(1);
      currentY = 35;

      // Vehicle Information Header
      if (vehicle) {
        pdf.setFillColor(239, 246, 255);
        pdf.rect(margin, currentY - 5, contentWidth, 30, "F");

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 64, 175);
        pdf.text("Vehicle Information", margin + 5, currentY + 5);

        pdf.setFontSize(10);
        pdf.setTextColor(51, 65, 85);

        const vehicleInfo = [
          { label: "Stock ID:", value: vehicle.vehicle_stock_id },
          { label: "Make/Model:", value: `${vehicle.make} ${vehicle.model}` },
          { label: "Year:", value: vehicle.year },
          { label: "VIN:", value: vehicle.vin || "N/A" },
        ];

        vehicleInfo.forEach((info, index) => {
          const xPos = margin + 5 + (index % 2) * (contentWidth / 2);
          const yPos = currentY + 15 + Math.floor(index / 2) * 6;

          // Label in bold
          pdf.setFont("helvetica", "bold");
          pdf.text(info.label, xPos, yPos);

          // Value in normal font (right after label)
          const labelWidth = pdf.getTextWidth(info.label) + 2;
          pdf.setFont("helvetica", "normal");
          pdf.text(String(info.value), xPos + labelWidth, yPos);
        });

        currentY += 35;
      }

      // Process data based on vehicle type - ONLY SELECTED CATEGORIES
      if (vehicleType === "inspection") {
        const selectedCats = getSelectedCategories();

        for (const category of selectedCats) {
          checkPageBreak(20);

          // Category Header
          currentY = addSection(
            category.category_name,
            currentY,
            [59, 130, 246]
          );

          if (category.description) {
            pdf.setFontSize(9);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(71, 85, 105);
            currentY = addWrappedText(
              category.description,
              margin + 5,
              currentY,
              contentWidth - 10,
              9,
              "italic"
            );
            currentY += 5;
          }

          // Process sections
          const sortedSections = category.sections.sort(
            (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
          );

          for (const section of sortedSections) {
            checkPageBreak(15);

            // Section Header
            currentY = addSection(
              section.section_name,
              currentY,
              [100, 116, 139]
            );

            // Process fields
            const sortedFields = section.fields.sort(
              (a: any, b: any) =>
                (a.display_order || 0) - (b.display_order || 0)
            );

            for (const field of sortedFields) {
              const value = data.formData[field.field_id];
              const notes = data.formNotes[field.field_id];
              const images = data.formImages[field.field_id] || [];
              const videos = data.formVideos[field.field_id] || [];

              checkPageBreak(20);

              // Field header
              pdf.setDrawColor(226, 232, 240);
              pdf.setFillColor(248, 250, 252);
              pdf.rect(margin, currentY - 2, contentWidth, 8, "F");

              // Field name
              pdf.setFontSize(10);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(30, 41, 59);
              pdf.text(field.field_name, margin + 5, currentY + 3);

              // Field type badge
              pdf.setFontSize(7);
              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(100, 116, 139);
              pdf.text(
                `[${field.field_type}]`,
                pageWidth - margin - 30,
                currentY + 3
              );

              currentY += 10;

              // Field value
              const formattedValue = formatValue(field, value);
              pdf.setFontSize(9);
              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(71, 85, 105);
              currentY = addWrappedText(
                `Value: ${formattedValue}`,
                margin + 5,
                currentY,
                contentWidth - 10,
                9
              );

              // Notes
              if (notes) {
                checkPageBreak(10);
                pdf.setFontSize(8);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(161, 98, 7);
                const label = "Notes:";
                pdf.text(label, margin + 8, currentY + 4);
                const labelWidth = pdf.getTextWidth(label + " ");
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(71, 85, 105);
                pdf.text(notes, margin + 8 + labelWidth, currentY + 4);
                currentY += 10;
              }

              currentY += 5; // Add spacing between fields
            }
          }
        }
      }

      // Update all footers with correct page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        addFooter(i, totalPages);
      }

      // Save or upload PDF
      if (s3Uploader) {
        setUploading(true);
        const pdfBlob = pdf.output("blob");
        const pdfFile = new File(
          [pdfBlob],
          `report-${vehicle?.vehicle_stock_id || "unknown"}-${Date.now()}.pdf`,
          {
            type: "application/pdf",
          }
        );

        const uploadResult = await s3Uploader.uploadFile(pdfFile, "reports");

        // Get the selected category name and create PDF data object
        const selectedCategory = getSelectedCategories()[0];
        const pdfData: PdfReportData[] = [
          {
            category: selectedCategory.category_name,
            link: uploadResult.url,
          },
        ];

        onPdfUploaded(pdfData);
        toast.success("Report PDF uploaded successfully");
      } else {
        pdf.save(
          `inspection-report-${vehicle?.vehicle_stock_id || "unknown"}.pdf`
        );
        toast.success("Report PDF generated successfully");
      }

      onClose();
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
      setUploading(false);
    }
  };

  const formatValue = (field: any, value: any) => {
    if (!value && value !== 0 && value !== false) return "N/A";

    switch (field.field_type) {
      case "boolean":
        return value === true || value === "true" ? "Yes" : "No";

      case "dropdown":
        if (field.dropdown_config?.allow_multiple && Array.isArray(value)) {
          const dropdown = getDropdownById(field.dropdown_config?.dropdown_id);
          if (dropdown) {
            return value
              .map((v: string) => {
                const option = dropdown.values.find(
                  (opt: any) => opt.option_value === v
                );
                return option?.display_value || v;
              })
              .join(", ");
          }
          return value.join(", ");
        }
        return value;

      case "multiplier":
        if (typeof value === "object" && value !== null) {
          return `Quantity: ${value.quantity || 0}, Price: $${
            value.price || 0
          }, Total: $${value.total || 0}`;
        }
        return typeof value === "object" ? JSON.stringify(value) : value;

      case "currency":
        return `$${parseFloat(value || 0).toFixed(2)}`;

      default:
        return typeof value === "object" ? JSON.stringify(value) : value;
    }
  };

  const getDropdownById = (dropdownId: any) => {
    if (!config?.dropdowns) return null;
    const id =
      typeof dropdownId === "object"
        ? dropdownId._id || dropdownId.$oid
        : dropdownId;
    return config.dropdowns.find((d: any) => d._id === id);
  };

  const handleSavePdf = () => {
    generatePdf();
  };

  const selectedCategoryName = getSelectedCategoryName();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full p-0 overflow-hidden max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-blue-50">
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-primary">
              Report Preview - {selectedCategoryName}
            </span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={generating || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="h-full overflow-auto">
          <div className="p-4 sm:p-6 bg-muted/20">
            <div
              ref={reportRef}
              className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm border w-full max-w-full mx-auto"
              style={{ maxWidth: "100%" }}
            >
              {/* Report Header */}
              <div className="text-center mb-8 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Vehicle ERP
                </h1>
                <h2 className="text-lg sm:text-xl text-primary mt-2">
                  {config?.config_name}
                </h2>

                {vehicle && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 font-medium">
                        Stock ID
                      </div>
                      <div className="font-semibold">
                        {vehicle.vehicle_stock_id}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 font-medium">
                        Make/Model
                      </div>
                      <div className="font-semibold">
                        {vehicle.make} {vehicle.model}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 font-medium">
                        Year
                      </div>
                      <div className="font-semibold">{vehicle.year}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500 font-medium">
                        VIN
                      </div>
                      <div className="font-semibold">
                        {vehicle.vin || "N/A"}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Generated on:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* Report Content - ONLY SELECTED CATEGORY */}
              {vehicleType === "inspection" ? (
                getSelectedCategories().map((category: any) => (
                  <div key={category.category_id} className="mb-10">
                    <div className="flex items-center mb-6">
                      <div className="w-3 h-8 bg-primary rounded-full mr-3"></div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {category.category_name}
                      </h2>
                    </div>

                    {category.description && (
                      <p className="text-gray-600 mb-6 px-4 py-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                        {category.description}
                      </p>
                    )}

                    {category.sections
                      .sort(
                        (a: any, b: any) =>
                          (a.display_order || 0) - (b.display_order || 0)
                      )
                      .map((section: any) => (
                        <div key={section.section_id} className="mb-8">
                          <h3 className="text-lg sm:text-xl font-medium mb-4 text-gray-800 border-b pb-2">
                            {section.section_name}
                          </h3>

                          <div className="grid grid-cols-1 gap-4">
                            {section.fields
                              .sort(
                                (a: any, b: any) =>
                                  (a.display_order || 0) -
                                  (b.display_order || 0)
                              )
                              .map((field: any) => {
                                const value = data.formData[field.field_id];
                                const notes = data.formNotes[field.field_id];
                                const images =
                                  data.formImages[field.field_id] || [];
                                const videos =
                                  data.formVideos[field.field_id] || [];

                                return (
                                  <div
                                    key={field.field_id}
                                    className="p-4 sm:p-5 border rounded-lg hover:shadow-sm transition-shadow"
                                  >
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                        {field.field_name}
                                      </h4>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize">
                                        {field.field_type}
                                      </span>
                                    </div>

                                    <div className="mb-3">
                                      <span className="text-sm text-gray-600 font-medium">
                                        Value:{" "}
                                      </span>
                                      <span className="font-semibold text-sm sm:text-base">
                                        {formatValue(field, value)}
                                      </span>
                                    </div>

                                    {notes && (
                                      <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-200 rounded-r">
                                        <span className="text-sm text-gray-600 font-medium">
                                          Notes:{" "}
                                        </span>
                                        <p className="text-gray-700 text-sm">
                                          {notes}
                                        </p>
                                      </div>
                                    )}

                                    {images.length > 0 && (
                                      <div className="mb-3">
                                        <span className="text-sm text-gray-600 font-medium block mb-2">
                                          Images:
                                        </span>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {images.map(
                                            (image: string, index: number) => (
                                              <li
                                                key={index}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                              >
                                                <a
                                                  href={image}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="truncate block"
                                                >
                                                  Image {index + 1}
                                                </a>
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                    {videos.length > 0 && (
                                      <div>
                                        <span className="text-sm text-gray-600 font-medium block mb-1">
                                          Videos:
                                        </span>
                                        <ul className="list-disc pl-5 space-y-1">
                                          {videos.map(
                                            (video: string, index: number) => (
                                              <li
                                                key={index}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                              >
                                                <a
                                                  href={video}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="truncate block"
                                                >
                                                  Video {index + 1}
                                                </a>
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                ))
              ) : (
                <div>Non-inspection report content</div>
              )}

              {/* Report Footer */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                <p>
                  This report was generated automatically by the Vehicle
                  Inspection System
                </p>
                <p className="mt-1">
                  © {new Date().getFullYear()} All rights reserved
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 p-4 sm:p-6 bg-white border-t">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={generating || uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePdf}
                disabled={generating || uploading}
                className="flex-1"
              >
                {generating || uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploading ? "Uploading..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save PDF ({selectedCategoryName})
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfReportGenerator;
