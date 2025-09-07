import React, { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import SubscriptionModal from '@/components/subscription/SubscriptionModal'; // Add this import

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false); // Add this state
  const [forceSubscription, setForceSubscription] = useState(false); // Add this state

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful');

      // Get user data from auth context after successful login
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      console.log('User data after login:', userData);

      // Check if subscription modal is forced
      if (userData.subscription_modal_force) {
        setForceSubscription(true);
        setShowSubscriptionModal(true);
        return; // Stop further navigation
      }


      // Navigate based on user role
      if (from) {
        // If there was a specific page they were trying to access, go there
        navigate(from);
      } else {
        // Navigate based on role
        switch (userData.role) {
          case 'master_admin':
            navigate('/master/dashboard');
            break;
          case 'company_super_admin':
          case 'company_admin':
            navigate('/company/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      toast.error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to handle subscription completion
  const handleSubscriptionComplete = () => {
    setShowSubscriptionModal(false);
    // After subscription, navigate to appropriate dashboard
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    
    if (from) {
      navigate(from);
    } else {
      switch (userData.role) {
        case 'master_admin':
          navigate('/master/dashboard');
          break;
        case 'company_super_admin':
        case 'company_admin':
          navigate('/company/dashboard');
          break;
        default:
          navigate('/');
      }
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Car className="h-10 w-10 text-primary" />
              <span className="text-3xl font-bold">VehiclePro</span>
            </div>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          <Card className="automotive-shadow">
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-muted-foreground">
                  Don't have a company account?{' '}
                  <Link to="/register-company" className="text-primary hover:underline">
                    Register your company
                  </Link>
                </p>
              </div>

            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link to="/" className="text-primary hover:underline text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

{showSubscriptionModal && (
  <SubscriptionModal
    isOpen={showSubscriptionModal}
    onClose={forceSubscription ? undefined : () => setShowSubscriptionModal(false)}
    mode="new"
    canClose={!forceSubscription}
    refetchSubscription={handleSubscriptionComplete}
    fullScreen={forceSubscription} // Add this line
  />
)}
    </>
  );
};

export default Login;