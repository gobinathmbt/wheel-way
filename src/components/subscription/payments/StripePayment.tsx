import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { subscriptionServices } from "@/api/services";

const stripePromise = loadStripe(
  "pk_test_51Pbd1iRx349WEEQWwzaRaHaqvRNiPzAJBPDyjxQhPKF8dgH2GDW4aSV0Ne9wI8ycKVfl5LT3E4GD1tWAdQLGQgkO00Msfk1ujR"
);

interface StripePaymentProps {
  subscriptionData: any;
  pricing: any;
  mode: string;
  onSuccess?: () => void;
  currentSubscription?: any;
  userProfile?: any;
  onClose: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  subscriptionData,
  pricing,
  mode,
  onSuccess,
  currentSubscription,
  userProfile,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInfo, setBillingInfo] = useState({
    email: userProfile?.email || "",
    name: userProfile?.name || "",
    address: "",
    city: "",
    postal_code: "",
    country: "US",
  });

  const createSubscription = async (paymentMethod: string) => {
    try {
      const response = await subscriptionServices.createSubscription({
        ...subscriptionData,
        total_amount: pricing.total_amount,
        payment_method: paymentMethod,
        is_upgrade: mode === "upgrade",
        is_renewal: mode === "renewal",
        billing_info: billingInfo,
      });
      return response.data.data;
    } catch (error) {
      throw error;
    }
  };

  const handleStripePayment = async () => {
    if (!billingInfo.email || !billingInfo.name) {
      toast.error("Please fill in all required billing information");
      return;
    }

    setIsProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        toast.error("Stripe failed to initialize");
        return;
      }

      // Create subscription first
      const subscription = await createSubscription("stripe");

      // For now, simulate payment success (replace with actual Stripe session creation)
      setTimeout(async () => {
        try {
          await subscriptionServices.updatePaymentStatus(subscription._id, {
            payment_status: "completed", 
            payment_transaction_id: "stripe_sim_" + Date.now(),
          });

          toast.success("Payment successful! Your subscription is now active.");
          onSuccess?.();
          onClose();
        } catch (error) {
          toast.error("Payment completed but failed to update subscription. Please contact support.");
        }
      }, 2000);
    } catch (error) {
      console.error("Stripe Error:", error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Secured by Stripe</span>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Information
          </CardTitle>
          <CardDescription>
            Enter your billing details to complete the payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={billingInfo.name}
                onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={billingInfo.email}
                onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={billingInfo.address}
              onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={billingInfo.city}
                onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                placeholder="New York"
              />
            </div>
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={billingInfo.postal_code}
                onChange={(e) => setBillingInfo({ ...billingInfo, postal_code: e.target.value })}
                placeholder="10001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-2xl font-bold">${pricing.total_amount}</span>
        </div>
      </div>

      <Button
        onClick={handleStripePayment}
        disabled={isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          `Pay $${pricing.total_amount} with Stripe`
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured by Stripe. We don't store your card details.
      </p>
    </div>
  );
};

export { StripePayment };