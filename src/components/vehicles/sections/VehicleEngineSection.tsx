
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VehicleEngineSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleEngineSection: React.FC<VehicleEngineSectionProps> = ({ vehicle }) => {
  const engineData = vehicle.vehicle_eng_transmission?.[0];
  if (!engineData) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="engine">
        <AccordionTrigger>Engine & Transmission</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Engine Type</label>
              <p className="text-sm text-muted-foreground">{engineData.engine_type}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Transmission</label>
              <p className="text-sm text-muted-foreground">{engineData.transmission_type}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleEngineSection;
