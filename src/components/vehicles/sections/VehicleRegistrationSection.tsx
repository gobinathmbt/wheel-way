
import React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface VehicleRegistrationSectionProps {
  vehicle: any;
  onUpdate: () => void;
}

const VehicleRegistrationSection: React.FC<VehicleRegistrationSectionProps> = ({
  vehicle,
  onUpdate,
}) => {
  const registrationData = vehicle.vehicle_registration?.[0];
  
  if (!registrationData) return null;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="registration">
        <AccordionTrigger>Vehicle Registration</AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Registered Locally</label>
              <p className="text-sm text-muted-foreground">{registrationData.registered_in_local ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">First Registered Year</label>
              <p className="text-sm text-muted-foreground">{registrationData.first_registered_year}</p>
            </div>
            <div>
              <label className="text-sm font-medium">License Expiry</label>
              <p className="text-sm text-muted-foreground">
                {registrationData.license_expiry_date ? new Date(registrationData.license_expiry_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Last Registered Country</label>
              <p className="text-sm text-muted-foreground">{registrationData.last_registered_country}</p>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default VehicleRegistrationSection;
