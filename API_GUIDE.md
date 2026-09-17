# DineHub API Testing Guide

This document outlines all available API endpoints for your project. You can use tools like **Postman**, **ThunderClient**, or **cURL** to test these locally.

> [!TIP]
> Make sure your server is running (`npm run start:dev` inside the `backend` folder) before running these tests. The server should be running on `http://localhost:3000`.

---

## 1. Authentication Module (Mobile First)

### 1.1 Send OTP (Login/Register)
This API generates a 6-digit OTP and sends it to the user's mobile number.

- **URL:** `http://localhost:3000/auth/send-otp`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "mobileNumber": "9876543210"
}
```
- **Expected Success Response (200 OK):**
```json
{
  "message": "OTP sent successfully (Development Mode).",
  "dev_otp": "492810"
}
```
*Note: Since we are in development, the OTP is returned directly in the response so your frontend team can easily test the flow in Postman!*

### 1.2 Verify OTP
This API validates the OTP. If the user doesn't exist yet, it creates their account instantly. It returns the JWT token.

- **URL:** `http://localhost:3000/auth/verify-otp`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "mobileNumber": "9876543210",
  "otp": "123456" 
}
```
- **Expected Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "abc-123",
    "mobileNumber": "9876543210",
    "role": "MANAGER",
    "isNewUser": true 
  }
}
```

> [!IMPORTANT]
> Save the `access_token` you receive when you login or register. In future API modules (like updating the Restaurant Profile or managing Staff), you will need to pass this token in the `Authorization` header as a Bearer token!

---

## 2. Restaurant Module

### 2.1 Complete Restaurant Setup (Onboarding)
This single API endpoint captures all the data from the 3 Onboarding screens (Restaurant Details, Outlet Details, Tax & Billing).

- **URL:** `http://localhost:3000/restaurants/setup`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "restaurantName": "The Spicy Spoon",
  "ownerName": "John Doe",
  "logo": "data:image/png;base64,iVBORw0KGgo...", 
  "phone": "9876543210",
  "email": "contact@spicyspoon.com",
  "address": "123 Food Street, City",
  "outletName": "Main Branch",
  "openingTime": "09:00 AM",
  "closingTime": "11:00 PM",
  "services": ["DINE_IN", "TAKEAWAY", "DELIVERY"],
  "cuisines": ["Indian", "Chinese"],
  "hasGST": true,
  "gstin": "27ABCDE1234F1Z5",
  "fssaiNumber": "10018022008325",
  "serviceCharge": 5,
  "invoicePrefix": "INV"
}
```
- **Expected Success Response (201 Created):**
```json
{
  "message": "Restaurant setup complete!",
  "restaurant": { ... },
  "outlet": { ... }
}
```

---

*Note: This document will be continually updated as we build more features.*
