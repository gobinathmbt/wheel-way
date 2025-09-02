
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RazorPayPaymentProps {
  amount: number;
  keyId: string;
  onSuccess: (data: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorPayPayment: React.FC<RazorPayPaymentProps> = ({ amount, keyId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!keyId) {
      setError('Razorpay not configured');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'USD',
        name: 'VehiclePro',
        description: 'Subscription Payment',
        handler: (response: any) => {
          const paymentData = {
            payment_id: response.razorpay_payment_id,
            transaction_id: response.razorpay_payment_id
          };
          onSuccess(paymentData);
          toast.success('Razorpay payment successful!');
          setIsLoading(false);
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com'
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            toast.error('Payment cancelled');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setIsLoading(false);
      toast.error('Razorpay payment failed');
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
        onClick={handleRazorpayPayment} 
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
            Pay ${amount.toFixed(2)} with Razorpay
          </>
        )}
      </Button>
      
      <p className="text-sm text-muted-foreground text-center">
        Your payment is secured by Razorpay
      </p>
    </div>
  );
};

export default RazorPayPayment;
