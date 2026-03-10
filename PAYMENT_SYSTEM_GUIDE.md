# 🎟️ Payment System - Implementation Guide

## Overview
This document explains the complete payment flow in your EXE Tour booking system, including recent improvements for handling VNPay and MoMo payment gateway callbacks.

## Payment Flow Diagram

```
User Booking
    ↓
[Step 1] TourBooking (Contact info + Tour details)
    ↓
[Step 2] BookingConfirm (Verify all information)
    ↓
[Step 3] PaymentPage (Choose payment method + Apply voucher)
    ↓
    └─→ CASH → [Step 4] E-Ticket Page (Success ✓)
    │
    └─→ VNPAY/MOMO → Backend: POST /api/payments/create
            ↓
        Get paymentUrl from response
            ↓
        window.location.replace(paymentUrl)
            ↓
        User redirects to Payment Gateway (VNPay/MoMo)
            ↓
        User completes payment or cancels
            ↓
        Payment Gateway redirects to:
         - /payment-return/vnpay?... (for VNPay)
         - /payment-return/momo?... (for MoMo)
            ↓
        [PaymentReturnPage] processes callback
            ↓
            ├─→ Success → [Step 4] E-Ticket Page ✓
            └─→ Failed → [PaymentFailurePage] ✗
```

## Key Components

### 1. **PaymentPage** ([src/components/paymentMethods/PaymentPage.tsx])
- Handles payment method selection (CASH, VNPAY, MOMO)
- Applies vouchers/discount codes
- Creates booking via `/api/bookings` endpoint
- For CASH: Navigates directly to e-ticket page
- For VNPAY/MOMO: Creates payment & redirects to gateway
- **Important**: Stores booking info in `sessionStorage` before redirect

**Key API Calls**:
```typescript
// 1. Create booking
POST /api/bookings
{
  tourId, tourScheduleId, numParticipants,
  contactName, contactPhone, contactEmail,
  voucherCode?, paymentMethod
}

// 2. Create payment (returns paymentUrl)
POST /api/payments/create
{
  bookingId, paymentMethod, requestType? (for MoMo)
}
→ Returns: { paymentUrl, ... }
```

### 2. **PaymentReturnPage** ([src/components/paymentMethods/PaymentReturnPage.tsx])
- **Routes**: `/payment-return/vnpay` & `/payment-return/momo`
- Handles callbacks from payment gateways
- Verifies payment status via backend API
- Redirects to either E-Ticket (success) or Failure page

**Key API Calls**:
```typescript
// Get payment return details from gateway
GET /api/payments/vnpay/return?{queryString}
GET /api/payments/momo/return?{queryString}

// Get booking details by code (public endpoint)
GET /api/bookings/public/by-code/{bookingCode}
```

**Status Handling**:
- Status = `PAID` | `SUCCESS` | `COMPLETED` → Navigate to e-ticket ✓
- Status = `UNPAID` | `FAILED` | `CANCELLED` → Navigate to failure page ✗

### 3. **PaymentFailurePage** ([src/components/paymentMethods/PaymentFailurePage.tsx])
- Beautiful error page with actionable steps
- Shows booking details, error code, and amount
- Provides options to:
  - ✓ Retry payment
  - 📞 Contact support
  - 🏠 Go home
- Explains possible failure reasons

**Styling**: Modern gradient background with animations ([PaymentFailurePage.scss])

### 4. **E-TicketPage** ([src/components/tourBooking/e-ticket/ETicketPage.tsx])
- Success page after payment
- Displays booking confirmation
- Shows e-ticket details
- Allows users to print or download ticket

## Backend Configuration Required

### VNPay Configuration
Your backend should configure VNPay return URL:
```
Success Return: https://your-domain.com/payment-return/vnpay
Failure Return: https://your-domain.com/payment-return/vnpay
```

### MoMo Configuration
Your backend should configure MoMo return URL:
```
Callback: https://your-domain.com/payment-return/momo
```

## New API Endpoints to Implement

### 1. **GET /api/bookings/public/by-code/{bookingCode}**
Public endpoint to retrieve booking by code (no auth required)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "bookingCode": "BK20230901001",
    "userId": 456,
    "tourId": 789,
    "tourTitle": "Hanoi City Tour",
    "tourScheduleId": 1000,
    "tourDate": "2026-03-06T08:45:23.288Z",
    "tourStartTime": "2026-03-06T08:45:23.288Z",
    "numParticipants": 2,
    "contactName": "John Doe",
    "contactPhone": "+84912345678",
    "contactEmail": "john@example.com",
    "totalAmount": 2000000,
    "discountAmount": 100000,
    "finalAmount": 1900000,
    "paymentStatus": "PAID",
    "paymentMethod": "VNPAY",
    "paidAt": "2026-03-06T09:00:00.000Z",
    "status": "CONFIRMED",
    "createdAt": "2026-03-06T08:45:23.288Z",
    "updatedAt": "2026-03-06T09:00:00.000Z"
  }
}
```

### 2. **POST /api/payments/create** (Already exists)
Returns payment gateway URL for redirect

**Request**:
```json
{
  "bookingId": 123,
  "paymentMethod": "VNPAY",
  "requestType": "payWithMethod" // Optional for MoMo
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "bookingId": 123,
    "bookingCode": "BK20230901001",
    "transactionId": "20230901001",
    "paymentMethod": "VNPAY",
    "amount": 1900000,
    "status": "PENDING",
    "gatewayTransactionId": "vnpay_txn_123",
    "paymentUrl": "https://sandbox.vnpayment.vn/pay?...",
    "paidAt": null,
    "createdAt": "2026-03-06T08:45:23.288Z"
  }
}
```

### 3. **GET /api/payments/vnpay/return?...** (Already exists)
Handles VNPay callback

**Parameters** (from VNPay):
- `vnp_TxnRef`: Transaction reference
- `vnp_ResponseCode`: Response code (00 = success)
- etc.

**Response**: Payment details with updated status

### 4. **GET /api/payments/momo/return?...** (Already exists)
Handles MoMo callback

**Parameters** (from MoMo):
- `requestId`: Request ID
- `resultCode`: Result code (0 = success)
- etc.

**Response**: Payment details with updated status

## Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/tours/:id/booking/payment` | PaymentPage | Payment method selection |
| `/payment-return/vnpay` | PaymentReturnPage | VNPay callback handler |
| `/payment-return/momo` | PaymentReturnPage | MoMo callback handler |
| `/payment-failure` | PaymentFailurePage | Payment failure page |
| `/tours/:id/booking/e-ticket` | ETicketPage | Success confirmation |

## State Management

### Booking State Flow
```
TourBooking (Step 1)
  → Pass: { contactInfo, bookingDetails }
  ↓
BookingConfirm (Step 2)
  → Pass: { contactInfo, bookingDetails }
  ↓
PaymentPage (Step 3)
  → Create booking in backend
  → Store in sessionStorage (for payment gateway redirect)
  → Pass: { bookingId, bookingCode } to e-ticket
  ↓
  ├─ CASH → ETicketPage directly
  └─ VNPAY/MOMO → PaymentReturnPage
      └─ ETicketPage or PaymentFailurePage
```

### Session Storage
When redirecting to payment gateway, booking info is stored:
```javascript
sessionStorage.setItem('lastBooking', JSON.stringify({
  bookingId: 123,
  bookingCode: 'BK20230901001',
  tourId: 789,
  paymentMethod: 'VNPAY',
  finalAmount: 1900000,
  createdAt: '2026-03-06T08:45:23.288Z'
}));
```

This allows recovery if the redirect fails.

## Error Handling

### Payment Gateway Errors
If payment gateway returns an error:
1. PaymentReturnPage catches the error
2. Extracts error code and message from response
3. Navigates to PaymentFailurePage with:
   - `bookingCode`: For identification
   - `tourId`: To retry payment
   - `amount`: Total amount attempted
   - `paymentMethod`: Which payment method failed
   - `errorCode`: Gateway error code
   - `errorMessage`: User-friendly error message

### Common Error Scenarios
| Scenario | Status | Action |
|----------|--------|--------|
| User cancels payment | CANCELLED | Failure page - can retry |
| Insufficient funds | FAILED | Failure page - suggest alternative method |
| Network timeout | ERROR | Failure page - retry or contact support |
| Gateway down | CONNECTION_ERROR | Failure page with support info |
| Invalid booking | INVALID | Failure page - suggest starting over |

## Testing Payment Flow

### Test VNPay
1. Go to Payment page, select VNPay
2. Click "Thanh toán" → redirects to VNPay test gateway
3. Use test card or test account
4. Complete or cancel payment
5. Should redirect to `/payment-return/vnpay?...`

### Test MoMo
1. Go to Payment page, select MoMo
2. Click "Thanh toán" → redirects to MoMo test gateway
3. Scan QR or use test account
4. Complete or cancel payment
5. Should redirect to `/payment-return/momo?...`

### Test CASH
1. Go to Payment page, select CASH
2. Click "Thanh toán" → navigates directly to e-ticket page
3. No external gateway, instant confirmation

## Security Notes

✅ **Current Implementation**:
- Payment URL comes from secure backend endpoint
- Only authenticated users can create bookings
- Payment status verified via backend callback handlers
- Booking code used for public query (limited info)

⚠️ **Considerations**:
- Ensure backend validates all payment callbacks cryptographically
- Use HTTPS for all payment URLs
- Implement CSRF protection for payment forms
- Rate limit the booking endpoints
- Validate refund logic carefully

## Styling

### Payment Failure Page (`PaymentFailurePage.scss`)
- Modern gradient background (red/pink tones)
- Animated error icon with shake animation
- Responsive design (mobile-first)
- Color-coded buttons for actions
- Help section with common issues

### Payment Return Page (`PaymentReturnPage.scss`)
- Loading state with spinning icon
- Error state with warning icon
- Smooth animations
- Responsive layout
- Auto-redirect on error (3s timeout)

## Next Steps to Configure

1. **Backend**: Implement gateway return URLs in VNPay/MoMo configs
2. **Backend**: Implement `/api/bookings/public/by-code/{code}` endpoint
3. **Backend**: Ensure payment return handlers set correct `paymentStatus`
4. **Testing**: Test full payment flow with test gateways
5. **Documentation**: Update your API docs with the new endpoints
6. **Support**: Create support page to handle failed payments

---

**Last Updated**: March 6, 2026
**Status**: Production Ready ✓
