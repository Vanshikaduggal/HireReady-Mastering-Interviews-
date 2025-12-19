import { RAZORPAY_CONFIG } from '../config/razorpay';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const initializeRazorpay = (): Promise<void> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};

export const createPayment = async (amount: number, orderId: string) => {
  try {
    await initializeRazorpay();

    const options = {
      ...RAZORPAY_CONFIG,
      amount: amount * 100, // Razorpay expects amount in paise
      order_id: orderId,
      handler: function (response: any) {
        // Handle successful payment
        console.log('Payment successful:', response);
        // You can implement your success logic here
      },
      modal: {
        ondismiss: function() {
          // Handle modal dismissal
          console.log('Payment modal dismissed');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error initializing Razorpay:', error);
    throw error;
  }
};

export const verifyPayment = async (
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string
) => {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}; 