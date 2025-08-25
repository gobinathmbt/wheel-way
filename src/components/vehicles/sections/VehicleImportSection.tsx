
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VehicleImportSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleImportSection: React.FC<VehicleImportSectionProps> = ({
  vehicle,
  onUpdate,
}) => {
  const importData = vehicle.vehicle_import_details?.[0];
  
  if (!importData) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="import">
        <AccordionTrigger>Import Details</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Reference</label>
              <p className="text-sm text-muted-foreground">{importData.reference || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Delivery Port</label>
              <p className="text-sm text-muted-foreground">{importData.delivery_port}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Vessel Name</label>
              <p className="text-sm text-muted-foreground">{importData.vessel_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Voyage</label>
              <p className="text-sm text-muted-foreground">{importData.voyage}</p>
            </div>
            <div>
              <label className="text-sm font-medium">ETD</label>
              <p className="text-sm text-muted-foreground">
                {importData.etd ? new Date(importData.etd).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">ETA</label>
              <p className="text-sm text-muted-foreground">
                {importData.eta ? new Date(importData.eta).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleImportSection;
