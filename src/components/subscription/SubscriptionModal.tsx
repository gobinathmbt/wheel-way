import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Users,
  CreditCard,
  Package,
  Calculator,
  Loader2,
  X,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import apiClient from "@/api/axios";
import { subscriptionServices } from "@/api/services";

// Payment Gateway SDKs
import { loadStripe } from "@stripe/stripe-js";

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Initialize Stripe
const stripePromise = loadStripe(
  "AdmdZhVfn9jAuMfulR8ILafs_d1rpHI5ZU_Rm7H1L7MUH_vXYW9flVDc-dDGbIX4ndjvURjkMRsvdTAa"
);

// Razorpay script loader
const loadRazorpay = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(window.Razorpay);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose?: () => void;
  refetchSubscription?: () => void;
  mode: "new" | "upgrade" | "renewal";
  canClose?: boolean;
  currentSubscription?: any;
  fullScreen?: boolean;
  onSuccess?: () => void;
  userProfile?: any;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  refetchSubscription,
  mode,
  onSuccess,
  canClose = true,
  currentSubscription,
  fullScreen = false,
  userProfile,
}) => {
  const [subscriptionData, setSubscriptionData] = useState({
    number_of_days: 30,
    number_of_users: 1,
    selected_modules: [],
  });
  const [pricing, setPricing] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Load pricing config using subscriptionServices from code 1
  const { isLoading: isLoadingPricing } = useQuery({
    queryKey: ["pricing-config"],
    queryFn: async () => {
      const response = await subscriptionServices.getPricingConfig();
      setPricingConfig(response.data.data);
      return response.data.data;
    },
    enabled: isOpen,
  });

  // Pre-populate data for renewal/upgrade
  useEffect(() => {
    if (currentSubscription && (mode === "renewal" || mode === "upgrade")) {
      setSubscriptionData({
        number_of_days:
          mode === "renewal"
            ? currentSubscription.number_of_days || 30
            : currentSubscription.number_of_days,
        number_of_users: currentSubscription.number_of_users || 1,
        selected_modules: currentSubscription.module_access || [],
      });
    }
  }, [currentSubscription, mode]);

  // Calculate pricing using subscriptionServices from code 1
  const calculatePricing = async () => {
    setIsCalculating(true);
    try {
      const response = await subscriptionServices.calculatePrice({
        ...subscriptionData,
        is_upgrade: mode === "upgrade",
        is_renewal: mode === "renewal",
      });
      setPricing(response.data.data);
    } catch (error) {
      console.error("Pricing calculation error:", error);
      toast.error("Failed to calculate pricing");
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate pricing when inputs change
  useEffect(() => {
    if (
      pricingConfig &&
      subscriptionData.number_of_days > 0 &&
      subscriptionData.number_of_users > 0
    ) {
      calculatePricing();
    }
  }, [subscriptionData, pricingConfig, mode]);

  const handleModuleToggle = (moduleValue, checked) => {
    // For upgrade mode, don't allow deselecting already active modules
    if (
      mode === "upgrade" &&
      currentSubscription?.module_access?.includes(moduleValue) &&
      !checked
    ) {
      return;
    }

    setSubscriptionData((prev) => ({
      ...prev,
      selected_modules: checked
        ? [...prev.selected_modules, moduleValue]
        : prev.selected_modules.filter((m) => m !== moduleValue),
    }));
  };

  // Create subscription using subscriptionServices from code 1
  const createSubscription = async (paymentMethod) => {
    try {
      const response = await subscriptionServices.createSubscription({
        ...subscriptionData,
        total_amount: pricing.total_amount,
        payment_method: paymentMethod,
        is_upgrade: mode === "upgrade",
        is_renewal: mode === "renewal",
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  // Function to close modal with a slight delay for better UX
  const closeModalWithDelay = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    redirectTimerRef.current = setTimeout(() => {
      if (onClose) onClose();
      setIsRedirecting(false);
    }, 500); // Small delay to allow the UI to update
  };

  const handleStripePayment = async () => {
    if (!pricing) return;

    setIsProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("Stripe failed to initialize");
        setIsProcessing(false);
        return;
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [
          {
            price: "price_12345", // Replace with your Stripe Price ID
            quantity: 1,
          },
        ],
        mode: "payment",
        successUrl: window.location.origin + "/payment-success",
        cancelUrl: window.location.origin + "/payment-cancel",
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Stripe Error:", error);
      toast.error("Failed to start Stripe Checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  // Razorpay Payment Handler - Complete implementation
  const handleRazorpayPayment = async () => {
    if (!pricing) return;

    setIsProcessing(true);
    try {
      // First create the subscription on your backend
      const subscription = await createSubscription("razorpay");

      // Load Razorpay script
      const RazorpayInstance = await loadRazorpay();
      if (!RazorpayInstance) {
        toast.error("Failed to load Razorpay");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: "rzp_test_z6CO9LKvjNQKsS", // Your Razorpay key
        amount: pricing.total_amount * 100, // Convert to paise
        currency: "INR",
        name: "Secure Gateway",
        description: `${
          mode === "upgrade" ? "Upgrade" : mode === "renewal" ? "Renew" : "New"
        } Subscription`,
        order_id: subscription.razorpay_order_id, // Get this from your backend
        handler: async function (response) {
          console.log(response)
        },
        prefill: {
          name: userProfile?.name || "Customer",
          email: userProfile?.email || "customer@example.com",
          contact: userProfile?.phone || "9000000000",
        },
        notes: {
          subscription_id: subscription.id,
          mode: mode,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new (RazorpayInstance as any)(options);
      razorpay.open();

      // Close our modal since Razorpay opens its own modal
      if (onClose) onClose();
    } catch (error) {
      console.error("Error with Razorpay payment:", error);
      toast.error("Failed to initialize Razorpay payment");
      setIsProcessing(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case "upgrade":
        return "Upgrade Subscription";
      case "renewal":
        return "Renew Subscription";
      default:
        return "Set Up Your Subscription";
    }
  };

  const getModalDescription = () => {
    switch (mode) {
      case "upgrade":
        return "Add more users or modules to your current subscription";
      case "renewal":
        return "Renew your subscription to continue accessing all features";
      default:
        return "Configure your subscription plan and payment";
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={canClose && !isRedirecting ? onClose : undefined}
    >
      <DialogContent
        className={
          fullScreen
            ? "max-w-none w-screen h-screen max-h-screen rounded-none p-0 flex flex-col"
            : "max-w-6xl max-h-[95vh] p-0 flex flex-col"
        }
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b">
          {!canClose && (
            <div className="absolute top-2 right-2 text-xs text-muted-foreground">
              Complete subscription to continue
            </div>
          )}
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl sm:text-2xl">
                  {getModalTitle()}
                </DialogTitle>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {getModalDescription()}
                </p>
              </div>
              {canClose && !isRedirecting && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Alert for grace period */}
          {mode === "renewal" &&
            currentSubscription?.subscription_status === "grace_period" && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your subscription has expired. You have{" "}
                  {currentSubscription.days_remaining || 0} days remaining in
                  the grace period.
                </AlertDescription>
              </Alert>
            )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Configuration and Pricing Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Configuration Panel */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">
                    Subscription Configuration
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Configure your subscription requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="days" className="text-sm font-medium">
                        Number of Days
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="days"
                          type="number"
                          min="1"
                          max="365"
                          value={subscriptionData.number_of_days}
                          onChange={(e) =>
                            setSubscriptionData((prev) => ({
                              ...prev,
                              number_of_days: parseInt(e.target.value) || 1,
                            }))
                          }
                          className="pl-10"
                          disabled={mode === "upgrade"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="users" className="text-sm font-medium">
                        Number of Users
                      </Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="users"
                          type="number"
                          min={
                            mode === "upgrade"
                              ? currentSubscription?.number_of_users || 1
                              : 1
                          }
                          max="1000"
                          value={subscriptionData.number_of_users}
                          onChange={(e) =>
                            setSubscriptionData((prev) => ({
                              ...prev,
                              number_of_users: parseInt(e.target.value) || 1,
                            }))
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">
                      Select Modules
                    </Label>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {pricingConfig?.modules?.map((module) => {
                        const isSelected =
                          subscriptionData.selected_modules.includes(
                            module.module_name
                          );
                        const isCurrentlyActive =
                          currentSubscription?.module_access?.includes(
                            module.module_name
                          );
                        const isDisabled =
                          mode === "upgrade" && isCurrentlyActive;

                        return (
                          <div
                            key={module.module_name}
                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                              isDisabled
                                ? "bg-muted/50 opacity-60"
                                : "hover:bg-muted/20"
                            }`}
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <Label className="font-medium text-sm truncate block">
                                  {module.display_value}
                                </Label>
                                {isCurrentlyActive && (
                                  <Badge
                                    variant="outline"
                                    className="mt-1 text-xs"
                                  >
                                    Current
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <Badge variant="outline" className="text-xs">
                                ${module.cost_per_module}/day
                              </Badge>
                              <Switch
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleModuleToggle(
                                    module.module_name,
                                    checked
                                  )
                                }
                                disabled={isDisabled}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Panel */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Calculator className="h-5 w-5" />
                    Pricing Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isCalculating ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : pricing ? (
                    <div className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Per User Cost:</span>
                          <span>${pricing.per_user_cost}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            Users ({subscriptionData.number_of_users}):
                          </span>
                          <span>${pricing.user_cost}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modules:</span>
                          <span>${pricing.module_cost}/day</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Daily Rate:</span>
                          <span>${pricing.daily_rate}</span>
                        </div>
                        {pricing.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Credit (Remaining Days):</span>
                            <span>-${pricing.discount_amount}</span>
                          </div>
                        )}
                        <div className="border-t pt-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span>
                              Total (
                              {pricing.effective_days ||
                                subscriptionData.number_of_days}{" "}
                              days):
                            </span>
                            <span>${pricing.total_amount}</span>
                          </div>
                        </div>
                      </div>

                      {pricing.module_details &&
                        pricing.module_details.length > 0 && (
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2 text-sm">
                              Selected Modules:
                            </h4>
                            <div className="space-y-1">
                              {pricing.module_details.map((module, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="truncate mr-2">
                                    {module.display_value}
                                  </span>
                                  <span className="flex-shrink-0">
                                    ${module.cost}/day
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      Configure your subscription to see pricing
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Section */}
            {pricing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <CreditCard className="h-5 w-5" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={selectedPaymentMethod}
                    onValueChange={setSelectedPaymentMethod}
                  >
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1">
                      <TabsTrigger value="stripe" className="text-sm">
                        Stripe
                      </TabsTrigger>
                      <TabsTrigger value="paypal" className="text-sm">
                        PayPal
                      </TabsTrigger>
                      <TabsTrigger value="razorpay" className="text-sm">
                        Razorpay
                      </TabsTrigger>
                    </TabsList>

                    <div className="mt-4">
                      <TabsContent value="stripe" className="space-y-4 mt-0">
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <h4 className="font-semibold mb-2 text-sm">
                            Stripe Checkout
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            You will be redirected to Stripe's secure payment
                            page to complete your transaction.
                          </p>
                        </div>
                        <div className="text-center space-y-4">
                          <Button
                            onClick={handleStripePayment}
                            disabled={isProcessing || isRedirecting}
                            className="w-full"
                            size="lg"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redirecting to Stripe...
                              </>
                            ) : (
                              <>
                                Proceed to Stripe Checkout
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="paypal" className="space-y-4 mt-0">
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <h4 className="font-semibold mb-2 text-sm">
                            PayPal Checkout
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            You will be redirected to PayPal's secure payment
                            page to complete your transaction.
                          </p>
                        </div>
                        <div className="text-center space-y-4">
                          <Button
                            onClick={handleStripePayment}
                            disabled={isProcessing || isRedirecting}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            size="lg"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redirecting to PayPal...
                              </>
                            ) : (
                              <>
                                Proceed to PayPal Checkout
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="razorpay" className="space-y-4 mt-0">
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <h4 className="font-semibold mb-2 text-sm">
                            Razorpay Checkout
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Complete your payment securely using Razorpay.
                          </p>
                        </div>
                        <div className="text-center space-y-4">
                          <Button
                            onClick={handleRazorpayPayment}
                            disabled={isProcessing || isRedirecting}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Opening Razorpay...
                              </>
                            ) : (
                              <>
                                Proceed to Razorpay Checkout
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionModal;
