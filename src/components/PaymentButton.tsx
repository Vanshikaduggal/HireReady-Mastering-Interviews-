import React from 'react';
import { createPayment } from '../utils/razorpay';

interface PaymentButtonProps {
  amount: number;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  onSuccess,
  onError,
}) => {
  const handlePayment = async () => {
    try {
      // First, create an order on the server
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const order = await response.json();

      // Initialize Razorpay payment
      await createPayment(amount, order.id);

      // The success handler is already set up in the createPayment function
      // You can customize it by passing a custom handler
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error);
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
    >
      Pay ₹{amount}
    </button>
  );
};

export default PaymentButton; 