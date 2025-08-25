
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VehicleOwnershipSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleOwnershipSection: React.FC<VehicleOwnershipSectionProps> = ({ vehicle }) => {
  const ownership = vehicle.vehicle_ownership;
  if (!ownership) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="ownership">
        <AccordionTrigger>Ownership</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Origin</label>
              <p className="text-sm text-muted-foreground">{ownership.origin}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Previous Owners</label>
              <p className="text-sm text-muted-foreground">{ownership.no_of_previous_owners}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Comments</label>
              <p className="text-sm text-muted-foreground">{ownership.comments}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleOwnershipSection;
