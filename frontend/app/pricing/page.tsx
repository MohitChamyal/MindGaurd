'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const features = {
  free: [
    '5 Free Reports',
    'Consultation',
    'Communications from Doctors'
  ],
  patient: [
    'Consultation',
    'Counselling',
    'Health Progress',
    'Tracking',
    'Community Support',
    '24/7 Personal Support'
  ],
  professional: [
    'Complete CRM System',
    'Unlimited Features',
    'List your features'
  ]
};

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('mindguard_token');
    const userId = localStorage.getItem('mindguard_user_id');
    setIsAuthenticated(!!token && !!userId);
  }, []);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
    });
  };

  const getPriceDetails = (basePriceMonthly: number) => {
    if (yearlyBilling) {
      // 20% discount for yearly plans
      const yearlyPrice = basePriceMonthly * 12 * 0.8;
      return {
        display: `₹${Math.round(yearlyPrice / 12)}/month`,
        subtext: `billed annually (₹${yearlyPrice})`,
        amountInPaise: Math.round(yearlyPrice * 100),
        billingCycle: 'yearly'
      };
    } else {
      return {
        display: `₹${basePriceMonthly}/month`,
        subtext: 'billed monthly',
        amountInPaise: basePriceMonthly * 100,
        billingCycle: 'monthly'
      };
    }
  };

  const patientPrice = getPriceDetails(99);
  const professionalPrice = getPriceDetails(1499);

  const handleSubscribe = async (selectedPlan: string, amount: number, billingCycle: string) => {
    try {
      if (!isAuthenticated) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to subscribe',
          variant: 'destructive',
        });
        router.push('/login');
        return;
      }

      setPlan(selectedPlan);
      setLoading(true);

      // Load Razorpay SDK
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Create order
      const token = localStorage.getItem('token') || localStorage.getItem('mindguard_token');
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          amount: amount,
          billingCycle: billingCycle
        })
      });

      const data = await response.json();
      console.log('Order created:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      // Initialize Razorpay payment
      const options = {
        key: data.keyId, // Using the key from the server response
        amount: data.amount,
        currency: data.currency,
        name: 'MindGuard',
        description: `${selectedPlan} Subscription (${billingCycle})`,
        order_id: data.orderId,
        handler: function(response: any) {
          console.log('Payment successful:', response);
          toast({
            title: 'Success',
            description: 'Payment completed successfully!',
          });
          // Redirect to payment success page with details
          router.push(`/payment-success?payment_id=${response.razorpay_payment_id}&plan=${selectedPlan}&billing_cycle=${billingCycle}`);
        },
        prefill: {
          name: localStorage.getItem('username') || '',
          email: localStorage.getItem('email') || '',
        },
        theme: {
          color: '#0F172A'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function(response: any) {
        console.error('Payment failed:', response.error);
        toast({
          title: 'Payment Failed',
          description: response.error.description,
          variant: 'destructive',
        });
      });

      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start payment process',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-white">
            Our Plans
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose the plan that fits your needs
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center mt-8">
            <Label htmlFor="billing-toggle" className={`mr-2 ${!yearlyBilling ? 'font-semibold' : ''}`}>Monthly</Label>
            <Switch
              id="billing-toggle"
              checked={yearlyBilling}
              onCheckedChange={setYearlyBilling}
            />
            <Label htmlFor="billing-toggle" className={`ml-2 ${yearlyBilling ? 'font-semibold' : ''}`}>
              Yearly <span className="text-sm text-green-500 ml-1">(Save 20%)</span>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="p-8 hover:shadow-lg transition-shadow duration-300 bg-black text-white">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">FREE FOR PATIENTS</h2>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹0</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {features.free.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full text-lg h-12 border border-white hover:bg-gray-800 text-white rounded-md" 
              variant="outline"
              onClick={() => router.push('/signup')}
            >
              Get Started
            </Button>
          </Card>

          {/* Patient Subscription Plan */}
          <Card className="p-8 relative hover:shadow-lg transition-shadow duration-300 bg-black text-white">
            <div className="absolute -top-3 right-4 bg-green-500 text-white px-4 py-1 text-sm rounded-full font-medium flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Most Popular
            </div>

            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">SUBSCRIPTION FOR PATIENTS</h2>
              <div className="mt-4">
                <span className="text-4xl font-bold">{patientPrice.display}</span>
                <p className="text-gray-400 text-sm mt-1">{patientPrice.subtext}</p>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {features.patient.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full text-lg h-12 bg-green-500 hover:bg-green-600 text-white rounded-md"
              onClick={() => handleSubscribe('patient', patientPrice.amountInPaise, patientPrice.billingCycle)}
              disabled={loading && plan === 'patient'}
            >
              {loading && plan === 'patient' ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </Button>
          </Card>

          {/* Professional Plan */}
          <Card className="p-8 hover:shadow-lg transition-shadow duration-300 border-blue-300 bg-black text-white">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">SUBSCRIPTION FOR PROFESSIONALS</h2>
              <div className="mt-4">
                <span className="text-4xl font-bold">{professionalPrice.display}</span>
                <p className="text-gray-400 text-sm mt-1">{professionalPrice.subtext}</p>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {features.professional.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full text-lg h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
              onClick={() => handleSubscribe('professional', professionalPrice.amountInPaise, professionalPrice.billingCycle)}
              disabled={loading && plan === 'professional'}
            >
              {loading && plan === 'professional' ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </Button>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto text-left grid gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-white">What happens after I subscribe?</h3>
              <p className="text-gray-400">After subscribing, you'll immediately get access to all features included in your selected plan. Your account will be upgraded instantly after successful payment.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-white">Can I cancel anytime?</h3>
              <p className="text-gray-400">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-white">What's the difference between patient and professional plans?</h3>
              <p className="text-gray-400">The patient plan is designed for individuals seeking mental health support, while the professional plan is for practitioners, therapists, and healthcare providers who need a comprehensive system to manage their practice.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-white">Is there a discount for yearly subscriptions?</h3>
              <p className="text-gray-400">Yes, you save 20% when you choose annual billing compared to paying monthly.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Have questions? Contact our support team at{' '}
            <a href="mailto:support@mindguard.com" className="text-blue-400 hover:underline">
              support@mindguard.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 