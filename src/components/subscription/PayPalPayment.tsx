
import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface PayPalPaymentProps {
  amount: number;
  clientId: string;
  mode: 'sandbox' | 'live';
  onSuccess: (data: any) => void;
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({ amount, clientId, mode, onSuccess }) => {
  const [error, setError] = useState('');

  const initialOptions = {
    'client-id': clientId,
    currency: 'USD',
    intent: 'capture',
    'data-client-token': undefined,
    environment: mode
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: amount.toFixed(2),
                    currency_code: 'USD'
                  },
                  description: 'VehiclePro Subscription'
                }
              ]
            });
          }}
          onApprove={(data, actions) => {
            return actions.order!.capture().then((details) => {
              const paymentData = {
                payment_id: details.id,
                transaction_id: details.purchase_units[0].payments?.captures?.[0].id
              };
              onSuccess(paymentData);
              toast.success('PayPal payment successful!');
            });
          }}
          onError={(err) => {
            setError('PayPal payment failed');
            toast.error('PayPal payment failed');
            console.error('PayPal error:', err);
          }}
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
          }}
        />
      </PayPalScriptProvider>

      <p className="text-sm text-muted-foreground text-center">
        Your payment is secured by PayPal
      </p>
    </div>
  );
};

export default PayPalPayment;
