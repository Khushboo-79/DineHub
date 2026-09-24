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

### 1.3 Get Profile
Fetches the currently authenticated user's profile details.

- **URL:** `http://localhost:3000/auth/profile`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 1.4 Edit Profile
Update the user's name, email, and base64 profile image.

- **URL:** `http://localhost:3000/auth/profile`
- **Method:** `PATCH`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "ownerName": "Aarav Sharma",
  "email": "aarav@dinehub.in",
  "profileImage": "data:image/png;base64,iVBORw0K..."
}
```

### 1.5 Change Password
Allows the user to set or change their password.

- **URL:** `http://localhost:3000/auth/change-password`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass456"
}
```

### 1.6 Logout
Log out the user. The client should clear the token upon receiving a success response.

- **URL:** `http://localhost:3000/auth/logout`
- **Method:** `POST`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

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

## 3. Menu Management Module

### 3.1 Create Category
Create a new menu category (e.g., "Starters", "Main Course").

- **URL:** `http://localhost:3000/menu/category`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "name": "Starters"
}
```

### 3.2 Add Food Item
Add a new food item to a category, optionally including Add-ons and Variants.

- **URL:** `http://localhost:3000/menu/item`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "categoryId": "<category_uuid_here>",
  "name": "Paneer Tikka",
  "description": "Marinated cottage cheese grilled to perfection.",
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "price": 220,
  "gst": 5,
  "isVeg": true,
  "preparationTime": 15,
  "isAvailable": true,
  "addons": [
    { "name": "Extra Cheese", "price": 40 },
    { "name": "Extra Paneer", "price": 60 }
  ],
  "variants": [
    { "name": "Small", "price": 120 },
    { "name": "Medium", "price": 180 },
    { "name": "Large", "price": 240 }
  ]
}
```
*(Note: `addons` and `variants` are optional arrays).*

### 3.3 Get Menu (List)
Fetches the entire menu, grouped by categories, including all items, addons, and variants.

- **URL:** `http://localhost:3000/menu`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 3.4 Update / Toggle Food Item
Update an item's details or toggle its availability status (e.g., Mark Out of Stock).

- **URL:** `http://localhost:3000/menu/item/:id`
- **Method:** `PATCH`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "isAvailable": false
}
```

### 3.5 Delete Food Item
Permanently remove an item from the menu.

- **URL:** `http://localhost:3000/menu/item/:id`
- **Method:** `DELETE`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

## 4. Orders Management Module

### 4.1 Create Order
Create a new order for the restaurant. The backend auto-generates the `orderNumber`.

- **URL:** `http://localhost:3000/orders`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "source": "DOORIQ",
  "paymentMethod": "UPI",
  "paymentStatus": "PAID",
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "tableNumber": "T-05",
  "guestCount": 2,
  "subtotal": 360,
  "discount": 18,
  "gst": 17,
  "totalAmount": 359,
  "items": [
    {
      "itemName": "Paneer Tikka",
      "addons": ["Mint Chutney"],
      "qty": 1,
      "price": 220,
      "total": 220
    },
    {
      "itemName": "Butter Naan",
      "addons": [],
      "qty": 2,
      "price": 40,
      "total": 80
    }
  ]
}
```

### 4.2 Get Orders (List)
Fetches all orders. You can filter by `status`.

- **URL:** `http://localhost:3000/orders?status=NEW`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`
- **Query Params (Optional):** `status` (NEW, PREPARING, READY, COMPLETED, CANCELLED)

### 4.3 Get Single Order (Details)
Fetches a single order by its UUID, including all `items`.

- **URL:** `http://localhost:3000/orders/:id`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 4.4 Update Order Status
Updates the status of an order (e.g., Marking it as Completed or Cancelled).

- **URL:** `http://localhost:3000/orders/:id/status`
- **Method:** `PATCH`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "status": "COMPLETED",
  "paymentStatus": "PAID"
}
```

---

## 5. Inventory Management Module

### 5.1 Create Inventory Item
Add a new item to track in your inventory.

- **URL:** `http://localhost:3000/inventory`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "name": "Paneer",
  "category": "Dairy",
  "unit": "KG",
  "currentStock": 10,
  "reorderLevel": 5,
  "purchasePrice": 250,
  "supplier": "Local Dairy Farm",
  "isAvailable": true
}
```

### 5.2 Get Inventory (List & Dashboard Metrics)
Fetches all inventory items and automatically calculates the Total Items, Low Stock items, Out of Stock items, and total Inventory Value.

- **URL:** `http://localhost:3000/inventory`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 5.3 Update Inventory Item
Update stock levels, price, or details of an inventory item.

- **URL:** `http://localhost:3000/inventory/:id`
- **Method:** `PATCH`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "currentStock": 8
}
```

### 5.4 Delete Inventory Item
Remove an item from inventory tracking completely.

- **URL:** `http://localhost:3000/inventory/:id`
- **Method:** `DELETE`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

---

## 6. Subscription Management Module

### 6.1 Get Current Subscription
Fetches the restaurant's active SaaS subscription plan, payment history, and a list of all available plans for upgrade.

- **URL:** `http://localhost:3000/billing/subscription`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 6.2 Change Plan
Upgrades or downgrades the current subscription plan.

- **URL:** `http://localhost:3000/billing/subscription/change-plan`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "plan": "PRO"
}
```

### 6.3 Cancel Subscription
Cancels the active SaaS subscription.

- **URL:** `http://localhost:3000/billing/subscription/cancel`
- **Method:** `POST`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

---

## 7. Staff Management Module

### 7.1 Create Staff
Adds a new staff member to the restaurant.

- **URL:** `http://localhost:3000/staff`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "ownerName": "Aarav Sharma",
  "mobileNumber": "+919876543210",
  "email": "aarav@example.com",
  "role": "OWNER",
  "salary": 50000,
  "joiningDate": "2025-10-10"
}
```

### 7.2 Get All Staff
Fetches all staff members belonging to the restaurant. You can optionally filter by role.

- **URL:** `http://localhost:3000/staff?role=MANAGER`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 7.3 Get Staff by ID
Fetches details of a specific staff member.

- **URL:** `http://localhost:3000/staff/:id`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 7.4 Update Staff
Updates a staff member's details or status.

- **URL:** `http://localhost:3000/staff/:id`
- **Method:** `PATCH`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "status": "INACTIVE"
}
```

### 7.5 Delete Staff
Removes a staff member entirely.

- **URL:** `http://localhost:3000/staff/:id`
- **Method:** `DELETE`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

---

## 8. Supplier Management Module (Inventory Service)

### 8.1 Create Supplier
Adds a new supplier for inventory tracking.

- **URL:** `http://localhost:3000/inventory/suppliers`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "name": "Fresh Foods Co.",
  "category": "Groceries & Vegetables",
  "mobile": "+919876543210",
  "email": "freshfoods@gmail.com",
  "address": "#12, Green Park, Bangalore - 560001",
  "gstNumber": "29ABCDE1234F1Z5",
  "totalPurchase": 45280,
  "pendingAmount": 2500
}
```

### 8.2 Get All Suppliers
Fetches all suppliers belonging to the restaurant.

- **URL:** `http://localhost:3000/inventory/suppliers`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 8.3 Get Supplier by ID
Fetches details of a specific supplier.

- **URL:** `http://localhost:3000/inventory/suppliers/:id`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 8.4 Update Supplier
Updates a supplier's details.

- **URL:** `http://localhost:3000/inventory/suppliers/:id`
- **Method:** `PATCH`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "pendingAmount": 0
}
```

### 8.5 Delete Supplier
Removes a supplier entirely.

- **URL:** `http://localhost:3000/inventory/suppliers/:id`
- **Method:** `DELETE`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

---

## 9. Purchases Management Module (Inventory Service)

### 9.1 Create Purchase
Records a new purchase from a supplier. Automatically updates the supplier's financial stats and the stock levels of the purchased inventory items.

- **URL:** `http://localhost:3000/inventory/purchases`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "supplierId": "SUPPLIER_ID_HERE",
  "invoiceNumber": "INV-2026-001",
  "totalAmount": 1470,
  "status": "Paid",
  "items": [
    {
      "inventoryItemId": "ITEM_ID_HERE",
      "quantity": 10,
      "rate": 40,
      "tax": 5,
      "total": 420
    }
  ]
}
```

### 9.2 Get All Purchases
Fetches all purchases made by the restaurant, including supplier details.

- **URL:** `http://localhost:3000/inventory/purchases`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

### 9.3 Get Purchase by ID
Fetches details of a specific purchase, including all purchased items and their inventory details.

- **URL:** `http://localhost:3000/inventory/purchases/:id`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`

---

## 10. Recipe Management Module (Inventory Service)

### 10.1 Create or Update Recipe
Links an inventory items to a specific menu item. This allows the system to auto-deduct raw materials when an order is placed. If a recipe already exists for the given `menuItemId`, it will be completely overwritten.

- **URL:** `http://localhost:3000/inventory/recipes`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "menuItemId": "MENU_ITEM_ID_HERE",
  "items": [
    {
      "inventoryItemId": "INVENTORY_ITEM_ID_HERE",
      "quantity": 0.5
    },
    {
      "inventoryItemId": "ANOTHER_INVENTORY_ITEM_ID_HERE",
      "quantity": 2
    }
  ]
}
```

### 10.2 Get Recipe by Menu Item ID
Fetches the recipe components for a specific menu item.

- **URL:** `http://localhost:3000/inventory/recipes/:menuItemId`
- **Method:** `GET`
- **Headers:** 
  - `Authorization: Bearer <your_access_token_here>`
  - `Authorization: Bearer <your_access_token_here>`

---

## 11. Analytics & Dashboard

### 11.1 Get Analytics Overview (Cards & Chart)
Fetches the top 4 cards data and the sales chart points.

- **URL:** `http://localhost:3000/analytics/overview`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `timeframe` (optional, default='today'): Can be `today`, `week`, or `month`.

### 11.2 Get Recent Orders
Fetches the 5 most recent orders for the dashboard list.

- **URL:** `http://localhost:3000/analytics/recent-orders`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 11.3 Get Top Selling Items
Fetches the top 4 selling menu items based on order volume.

- **URL:** `http://localhost:3000/analytics/top-items`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 11.4 Get Low Stock Alerts
Fetches inventory items that are running out of stock or have hit zero.

- **URL:** `http://localhost:3000/analytics/low-stock`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

---

## 12. Inventory Analytics

### 12.1 Get Inventory Overview Analytics
Fetches the top 4 cards for the Inventory screen.

- **URL:** `http://localhost:3000/inventory-analytics/overview`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

**Sample Response:**
```json
{
  "totalItems": 120,
  "lowStock": 8,
  "outOfStock": 4,
  "inventoryValue": 48320
}
```

---

## 13. Reports

### 13.1 Get Sales Report
Fetches the detailed Sales Report metrics including trends (% vs last period) and graph data.

- **URL:** `http://localhost:3000/reports/sales`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:** `timeframe` (optional, default='today'): Can be `today`, `week`, or `month`.

**Sample Response:**
```json
{
  "summary": {
    "revenue": { "value": 48320, "trend": 12, "trendDirection": "up" },
    "orders": { "value": 62, "trend": 8, "trendDirection": "up" },
    "averageOrderValue": { "value": 780, "trend": 5, "trendDirection": "up" },
    "discount": { "value": 2400, "trend": 15, "trendDirection": "up" },
    "tax": { "value": 3120, "trend": 10, "trendDirection": "up" }
  },
  "salesGraph": [
    { "time": "12 AM", "revenue": 12000 }
  ],
  "orderGraph": [
    { "time": "12 AM", "orders": 10 }
  ]
}
```

---

## 14. Shift & Cash Management (Billing Service)

### 14.1 Open Shift
Starts a new shift with an opening cash float.

- **URL:** `http://localhost:3000/shifts/open`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "restaurantId": "RESTAURANT_ID_HERE",
  "openingFloat": 5000
}
```

### 14.2 Cash Drop / Payout
Records cash being added to or removed from the cash drawer during the shift.

- **URL:** `http://localhost:3000/shifts/cash-drop`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "shiftId": "SHIFT_ID_HERE",
  "amount": 2000,
  "reason": "Paid vendor for ice",
  "type": "PAYOUT" 
}
```
*(Note: `type` can be `DROP`, `PAYIN`, or `PAYOUT`)*

### 14.3 Close Shift
Ends the shift, calculating the expected cash versus the actual physical cash counted.

- **URL:** `http://localhost:3000/shifts/close`
- **Method:** `POST`
- **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_access_token_here>`
- **Request Body:**
```json
{
  "shiftId": "SHIFT_ID_HERE",
  "actualCash": 12500
}
```

### 14.4 Get Shifts List
Fetches the history of cash shifts for a restaurant.

- **URL:** `http://localhost:3000/shifts?restaurantId=YOUR_RESTAURANT_ID`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 14.5 Get Shift Report
Fetches the detailed breakdown of a single shift (including all cash drops/payouts and total sales).

- **URL:** `http://localhost:3000/shifts/:id/report`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

---

## 15. Table & Floor Plan Management (Restaurant Service)

### 15.1 Create Zone
Creates a new seating zone (e.g., Indoor, Patio, VIP).

- **URL:** `http://localhost:3000/tables/zones`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "outletId": "OUTLET_ID_HERE",
  "name": "Indoor Seating",
  "description": "Main dining hall"
}
```

### 15.2 Create Table
Creates a table inside a specific zone.

- **URL:** `http://localhost:3000/tables`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "zoneId": "ZONE_ID_HERE",
  "name": "T-01",
  "capacity": 4
}
```

### 15.3 Get Live Table Status
Fetches all zones and their nested tables with their current occupancy status (`AVAILABLE`, `OCCUPIED`, `RESERVED`).

- **URL:** `http://localhost:3000/tables/live-status?outletId=OUTLET_ID_HERE`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 15.4 Assign/Update Table Status
Manually updates the status of a table (e.g., when a walk-in guest is seated).

- **URL:** `http://localhost:3000/tables/:id/assign`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "status": "OCCUPIED" 
}
```

### 15.5 Create Reservation
Books a table in advance for a customer.

- **URL:** `http://localhost:3000/reservations`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "outletId": "OUTLET_ID_HERE",
  "customerName": "Rahul Sharma",
  "customerPhone": "9876543210",
  "guestsCount": 4,
  "reservationTime": "2026-09-25T19:30:00.000Z",
  "specialRequests": "Window seat preferred"
}
```

---

## 16. Advanced Kitchen Display System (KDS)

### 16.1 Get Active Kitchen Tickets
Fetches a live stream of all active orders (`NEW` or `PREPARING`) and their nested items for the Kitchen Screen.

- **URL:** `http://localhost:3000/kds/active-tickets?outletId=OUTLET_ID_HERE`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 16.2 Update Item Cooking Status
Allows the chef to mark a specific plate/item within an order as `PREPARING`, `READY`, or `SERVED`.
*Note: If all items in an order are marked `READY`, the system automatically changes the entire parent order's status to `READY`!*

- **URL:** `http://localhost:3000/kds/items/:id/status`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "status": "READY" 
}
```

### 16.3 Get Expediter View (Waitstaff)
Fetches a list of items that are marked as `READY` in the kitchen, but belong to orders that are not yet completely served. Waiters use this screen to know what dishes to physically pick up from the kitchen counter right now.

- **URL:** `http://localhost:3000/kds/expediter?outletId=OUTLET_ID_HERE`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

---

## 17. Advanced CRM & Loyalty

### 17.1 Create Customer
Creates a new customer profile in the restaurant's CRM.

- **URL:** `http://localhost:3000/crm/customers`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "9876543211",
  "email": "jane@example.com",
  "loyaltyPoints": 100
}
```

### 17.2 Get All Customers
Fetches the CRM directory, sorted by visit frequency.

- **URL:** `http://localhost:3000/crm/customers`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 17.3 Lookup Customer by Phone
Quickly finds a customer by phone number (useful during POS checkout).

- **URL:** `http://localhost:3000/crm/customers/:phone`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 17.4 Add/Deduct Loyalty Points
Updates the customer's loyalty points balance.

- **URL:** `http://localhost:3000/crm/customers/:id/points`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "points": 50 
}
```
*(Note: Use negative values to deduct points when redeemed)*

---

## 18. Automated Taxes & Discounts Management

### 18.1 Create Tax Setting
Defines a tax rule that will be automatically applied to invoices (e.g., GST, VAT).

- **URL:** `http://localhost:3000/taxes`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "name": "CGST",
  "rate": 2.5,
  "type": "PERCENTAGE"
}
```

### 18.2 Get Active Taxes
Fetches all active tax rules for the restaurant.

- **URL:** `http://localhost:3000/taxes`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 18.3 Create Discount Rule
Creates a reusable discount that staff can apply to orders.

- **URL:** `http://localhost:3000/discounts`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "name": "Happy Hour 10%",
  "value": 10,
  "type": "PERCENTAGE",
  "minOrderValue": 500
}
```

### 18.4 Get Active Discounts
Fetches all active discount rules for the restaurant.

- **URL:** `http://localhost:3000/discounts`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

---

## 19. Multi-Outlet & HQ Operations

### 19.1 Add New Outlet (Branch)
Allows the owner (HQ) to open a new branch of their restaurant brand.

- **URL:** `http://localhost:3000/restaurants/outlets`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "name": "DineHub Downtown",
  "openingTime": "11:00",
  "closingTime": "23:00",
  "services": ["DINE_IN", "TAKEAWAY", "DELIVERY"],
  "cuisines": ["Italian", "Continental"],
  "hasGST": true,
  "gstin": "27AADCB2230M1Z2",
  "fssaiNumber": "11519036000213",
  "serviceCharge": 10,
  "invoicePrefix": "DH-DT"
}
```

### 19.2 Get All Outlets
Fetches a list of all outlets owned by the restaurant brand. Useful for HQ dashboards.

- **URL:** `http://localhost:3000/restaurants/outlets`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <token>`

### 19.3 Update Outlet Details
Updates the configuration of a specific branch.

- **URL:** `http://localhost:3000/restaurants/outlets/:id`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "closingTime": "23:30"
}
```

---

## 20. Third-Party Delivery Integrations

### 20.1 Sync Menu to Aggregator
Pushes the restaurant's latest menu to a third-party aggregator like Zomato or Swiggy.

- **URL:** `http://localhost:3000/integrations/menu/sync`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "aggregator": "ZOMATO"
}
```

### 20.2 Receive Aggregator Order (Webhook)
An open endpoint designed to receive incoming orders directly from third-party aggregators.

- **URL:** `http://localhost:3000/integrations/orders/webhook`
- **Method:** `POST`
- **Request Body:** *(Simulated Aggregator Payload)*
```json
{
  "source": "SWIGGY",
  "orderNumber": "SW-998877",
  "outletId": "OUTLET_ID_HERE",
  "customer": {
    "name": "John Doe",
    "phone": "9988776655"
  },
  "subtotal": 450,
  "totalAmount": 500,
  "items": [
    {
      "name": "Paneer Tikka",
      "quantity": 2,
      "price": 225
    }
  ]
}
```

---

*Note: This document will be continually updated as we build more features.*
