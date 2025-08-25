
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VehicleSpecificationsSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleSpecificationsSection: React.FC<VehicleSpecificationsSectionProps> = ({ vehicle }) => {
  const specs = vehicle.vehicle_specifications?.[0];
  if (!specs) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="specifications">
        <AccordionTrigger>Specifications</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Seats</label>
              <p className="text-sm text-muted-foreground">{specs.number_of_seats}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Doors</label>
              <p className="text-sm text-muted-foreground">{specs.number_of_doors}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Interior Color</label>
              <p className="text-sm text-muted-foreground">{specs.interior_color}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleSpecificationsSection;
