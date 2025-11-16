import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

// Secret for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export async function POST(req: Request) {
  try {
    // Get authorization header
    const headersList = headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token to get user data
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const userId = decodedToken.id || decodedToken.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { paymentId, plan, billingCycle = 'monthly' } = body;

    if (!paymentId || !plan) {
      return NextResponse.json(
        { error: 'Payment ID and plan are required' },
        { status: 400 }
      );
    }

    // Calculate subscription details based on plan and billing cycle
    const currentDate = new Date();
    const isMonthly = billingCycle === 'monthly';
    let amount, renewalDate, endDate;
    
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    
    if (plan === 'patient') {
      amount = isMonthly ? 99 : (99 * 12 * 0.8); // 20% discount for annual
      renewalDate = new Date(currentDate.getTime() + (isMonthly ? thirtyDaysInMs : oneYearInMs));
      endDate = new Date(renewalDate);
    } else if (plan === 'professional') {
      amount = isMonthly ? 1499 : (1499 * 12 * 0.8); // 20% discount for annual
      renewalDate = new Date(currentDate.getTime() + (isMonthly ? thirtyDaysInMs : oneYearInMs));
      endDate = new Date(renewalDate);
    } else {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // Call backend API to update user subscription
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const response = await fetch(`${backendUrl}/api/users/subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        subscription: {
          plan,
          status: 'active',
          startDate: currentDate,
          renewalDate,
          endDate,
          billingCycle,
          paymentMethod: 'Razorpay',
          transactionIds: [paymentId]
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update subscription' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: data.subscription
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 