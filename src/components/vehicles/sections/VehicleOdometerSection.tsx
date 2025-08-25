
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VehicleOdometerSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleOdometerSection: React.FC<VehicleOdometerSectionProps> = ({ vehicle }) => {
  const odometer = vehicle.vehicle_odometer?.[0];
  if (!odometer) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="odometer">
        <AccordionTrigger>Odometer</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Reading</label>
              <p className="text-sm text-muted-foreground">{odometer.reading?.toLocaleString()} km</p>
            </div>
            <div>
              <label className="text-sm font-medium">Reading Date</label>
              <p className="text-sm text-muted-foreground">
                {odometer.reading_date ? new Date(odometer.reading_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleOdometerSection;
