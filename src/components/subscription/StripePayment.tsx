
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StripePaymentProps {
  amount: number;
  publicKey: string;
  onSuccess: (data: any) => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({ amount, publicKey, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStripePayment = async () => {
    if (!publicKey) {
      setError('Stripe not configured');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const stripe = await loadStripe(publicKey);
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }

      // Simulate Stripe payment for demo
      // In real implementation, you would create a payment intent on your server
      setTimeout(() => {
        const paymentData = {
          payment_id: `stripe_${Date.now()}`,
          transaction_id: `txn_${Math.random().toString(36).substr(2, 9)}`
        };
        onSuccess(paymentData);
        setIsLoading(false);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setIsLoading(false);
      toast.error('Stripe payment failed');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handleStripePayment} 
        className="w-full h-12"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay ${amount.toFixed(2)} with Stripe
          </>
        )}
      </Button>
      
      <p className="text-sm text-muted-foreground text-center">
        Your payment is secured by Stripe
      </p>
    </div>
  );
};

export default StripePayment;
