export const RAZORPAY_CONFIG = {
  key: process.env.VITE_RAZORPAY_KEY_ID || '',
  currency: 'INR',
  name: 'HireReady',
  description: 'Payment for HireReady Service',
  image: 'https://your-logo-url.com/logo.png', // Replace with your logo URL
  prefill: {
    name: '',
    email: '',
    contact: ''
  },
  theme: {
    color: '#2563eb' // You can customize this color
  }
}; 