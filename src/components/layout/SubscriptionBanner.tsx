
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role === 'master_admin') {
    return null;
  }

  // Show banner for inactive subscription or grace period
  if (user.subscription_inactive) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>
            Your subscription is inactive. Please configure your subscription to continue using the platform.
          </span>
          {user.role === 'company_super_admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="ml-4 bg-white text-red-600 border-red-200 hover:bg-red-50"
            >
              Configure Subscription
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Show banner for grace period
  if (user.in_grace_period && user.grace_period_days > 0) {
    return (
      <Alert variant="destructive" className="mb-4">
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between w-full">
          <span>
            Your subscription has expired. You have {user.grace_period_days} days remaining in your grace period.
          </span>
          {user.role === 'company_super_admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="ml-4 bg-white text-red-600 border-red-200 hover:bg-red-50"
            >
              Renew Subscription
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default SubscriptionBanner;
