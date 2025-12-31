# Payment Test Mode Setup

## Overview
The application now supports **Test Payment Mode** for testing payment flows without real money transactions or Razorpay credentials.

## How It Works

### Automatic Test Mode Activation
Test mode is automatically enabled when:
- `RAZORPAY_TEST_MODE=true` is set in `.env.local`, OR
- Razorpay credentials are missing or invalid

### Features in Test Mode
✅ **Dummy Payment Processing** - Simulates payment without real transactions  
✅ **2-second Payment Delay** - Mimics real payment processing time  
✅ **Visual Test Mode Banner** - Shows when test payments are active  
✅ **Auto-verification** - Test payments are automatically verified  
✅ **Job Completion** - Jobs are marked as complete after test payment  

## Setup Instructions

### Option 1: Explicit Test Mode (Recommended for Testing)
1. Open `.env.local`
2. Set: `RAZORPAY_TEST_MODE=true`
3. Restart your development server

### Option 2: Automatic Test Mode (No Razorpay Credentials)
Simply leave the Razorpay credentials as placeholder values:
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_TEST_MODE=true
```

## Testing the Payment Flow

### As a Customer:
1. Create a booking with a worker
2. Wait for the worker to accept and start the job
3. After the worker completes the work, click **"Complete & Pay"**
4. You'll see a test mode banner appear
5. After 2 seconds, the payment will complete automatically
6. The job status will change to "Completed"

### What You'll See:
- 🟡 Test mode banner: "Test Payment Mode Active"
- 💬 Toast notification: "TEST MODE: Simulating payment..."
- ✅ Success message: "TEST PAYMENT SUCCESSFUL! Job completed."

## Production Mode

To enable real Razorpay payments:

1. Get your Razorpay credentials from https://dashboard.razorpay.com/
2. Update `.env.local`:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_actual_secret
RAZORPAY_TEST_MODE=false
```
3. Restart your development server
4. Real payments will now be processed through Razorpay

## Benefits

✨ **No Razorpay Account Needed** - Test the full flow without signup  
🚀 **Fast Development** - No waiting for real payment gateway  
🔒 **Safe Testing** - No risk of accidental charges  
🎯 **Complete Flow** - Test the entire booking-to-payment journey  

## Technical Details

- Test orders have IDs starting with `test_order_`
- Test payments have IDs starting with `test_pay_`
- Test signatures are auto-generated and always valid
- All payment verification passes in test mode
- Platform fees and worker earnings are still calculated correctly

---

**Note:** Remember to switch to production mode before deploying to production!
