
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VehicleSafetySectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleSafetySection: React.FC<VehicleSafetySectionProps> = ({ vehicle }) => {
  const safety = vehicle.vehicle_safety_features?.[0];
  if (!safety) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="safety">
        <AccordionTrigger>Safety Features</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap gap-2">
            {safety.features?.map((feature: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-muted rounded text-sm">{feature}</span>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleSafetySection;
