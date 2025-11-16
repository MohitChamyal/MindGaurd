'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState('');

  const paymentId = searchParams.get('payment_id');
  const plan = searchParams.get('plan');
  const billingCycle = searchParams.get('billing_cycle') || 'monthly';

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!paymentId || !plan) {
          setError('Missing payment information');
          setIsLoading(false);
          return;
        }

        // Call API to verify payment and activate subscription
        const token = localStorage.getItem('token') || localStorage.getItem('mindguard_token');
        const response = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            paymentId,
            plan,
            billingCycle
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment');
        }

        setSubscription(data.subscription);
        toast({
          title: 'Subscription Activated',
          description: `Your ${plan} subscription has been successfully activated!`,
        });
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setError(error.message || 'An error occurred while verifying your payment');
        toast({
          title: 'Verification Error',
          description: error.message || 'Failed to verify your payment',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, plan, billingCycle, toast]);

  const handleContinue = () => {
    if (plan === 'patient') {
      router.push('/patient/dashboard');
    } else if (plan === 'professional') {
      router.push('/doctor/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Card className="max-w-md w-full bg-black text-white border border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Payment Successful</CardTitle>
          <CardDescription className="text-gray-400">
            Thank you for your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
              <p className="mt-4 text-gray-400">Verifying your payment...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="rounded-full bg-red-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-red-400 mb-2">Payment Verification Failed</h3>
              <p className="text-gray-400">{error}</p>
              <p className="mt-4 text-gray-400">
                Please contact support if you were charged but your subscription is not active.
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="rounded-full bg-green-100 p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-medium text-green-400 mb-2">Payment Completed</h3>
              <p className="text-gray-400">
                Your {plan} subscription has been successfully activated.
              </p>
              {subscription && (
                <div className="mt-6 bg-gray-900 rounded-lg p-4 text-left">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-400">Plan</p>
                      <p className="font-medium">{subscription.plan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className="font-medium text-green-400">{subscription.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Billing Cycle</p>
                      <p className="font-medium">{subscription.billingCycle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Next Billing</p>
                      <p className="font-medium">
                        {subscription.renewalDate ? new Date(subscription.renewalDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleContinue}
            className="w-full bg-white text-black hover:bg-gray-200"
            disabled={isLoading}
          >
            {error ? 'Go to Home' : 'Continue to Dashboard'} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 