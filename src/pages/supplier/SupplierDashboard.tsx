import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supplierAuthServices } from "@/api/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  Calendar,
  Eye,
  LogOut,
  User,
  BarChart3,
  Users,
  ClipboardList,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SupplierSidebar from "@/components/supplier/SupplierSidebar";

const SupplierDashboard = () => {
  const [supplierUser, setSupplierUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const user = sessionStorage.getItem("supplier_user");

    if (!token || !user) {
      navigate("/supplier/login");
      return;
    }

    setSupplierUser(JSON.parse(user));
  }, [navigate]);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["supplier-vehicles"],
    queryFn: async () => {
      const response = await supplierAuthServices.getVehicles();
      return response.data?.data || [];
    },
    enabled: !!supplierUser,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("supplier_user");
    navigate("/supplier/login");
  };

  if (!supplierUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SupplierSidebar />

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold">Dashboard Overview</h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{supplierUser.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {supplierUser.name}!
            </h2>
            <p className="text-muted-foreground">
              {supplierUser.supplier_shop_name &&
                `${supplierUser.supplier_shop_name} | `}
              {supplierUser.email}
            </p>
          </div>

          {/* Vehicles Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vehicles && vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle: any) => (
                <Card
                  key={vehicle._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={vehicle.vehicle_hero_image}
                      alt={vehicle.name}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={
                          vehicle.vehicle_type === "inspection"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {vehicle.vehicle_type}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      {vehicle.name ||
                        `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Stock ID: {vehicle.vehicle_stock_id} | {vehicle.plate_no}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </div>

                      <div className="text-sm">
                        <Badge variant="outline">
                          {(() => {
                            // Filter the quotes where vehicle_type matches
                            const filteredQuotes =
                              vehicle.quotes?.filter(
                                (quote) =>
                                  quote.vehicle_type === vehicle.vehicle_type
                              ) || [];

                            return `${filteredQuotes.length} Quote${
                              filteredQuotes.length !== 1 ? "s" : ""
                            } Available`;
                          })()}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        to={`/supplier/vehicle/${vehicle.vehicle_stock_id}/${vehicle.vehicle_type}`}
                      >
                        <Button className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center">
                  <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Vehicles Assigned
                  </h3>
                  <p className="text-muted-foreground">
                    You don't have any vehicles assigned at the moment. Check
                    back later or contact the workshop.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default SupplierDashboard;
