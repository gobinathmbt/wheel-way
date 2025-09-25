import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface InspectionCalculationsProps {
  config: any;
  calculations: any;
}

const InspectionCalculations: React.FC<InspectionCalculationsProps> = ({
  config,
  calculations,
}) => {
  if (
    !config.calculations ||
    config.calculations.filter((calc: any) => calc.is_active).length === 0
  ) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Calculator className="h-5 w-5 text-primary" />
          <span>Calculations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {config.calculations
          .filter((calc: any) => calc.is_active)
          .map((calc: any) => (
            <div
              key={calc.calculation_id}
              className="flex items-center justify-between p-3 bg-background rounded-lg border"
            >
              <span className="font-medium">{calc.calculation_name}</span>
              <span className="text-lg font-bold text-primary">
                {typeof calculations[calc.calculation_id] === "number"
                  ? calculations[calc.calculation_id].toFixed(2)
                  : "0.00"}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
};

export default InspectionCalculations;