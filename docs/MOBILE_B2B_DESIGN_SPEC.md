# B2B Mobile App Design Spec — Hotel Supplies (OS&E + FF&E)

This is the design specification for the INVO/HotelsVendors mobile app for hotel supplies procurement.
Pasted from user on 2026-08-08.

## 1. User Roles & Architecture
- **Hotel Users**: Requester (builds carts), Approver/Buyer (approves POs), Finance (manages payments/credit terms)
- **Supplier Users**: Sales reps, dispatchers, account managers
- **Super Admin**: Platform owner managing users, catalogs, operations

## 2. Core App Structure

### A. Onboarding & Authentication
- Email/Password, SSO for large hotel chains
- Company onboarding: upload business licenses, Tax IDs, credit applications (Net-30/60/90)
- User invitation: primary account holder invites staff, assigns roles

### B. Dashboard (Home Screen)
- Quick Reorder Widget (80% of orders are recurring — one-tap reorder)
- Pending Approvals (for managers)
- Order Status/Tracking (real-time logistics)
- Spend Analytics (monthly spend vs budget by department)

### C. Product Catalog & Discovery
- Categories: Bed & Bath, Amenities, Cleaning & Janitorial, F&B Supplies
- Smart Search: voice search, SKU/Part Number search
- Barcode/QR Scanner: walk through supply closet, scan empty boxes
- Custom Catalogs: hotels only see approved products at negotiated rates

### D. Product Details Page
- Tiered Pricing: "Buy 1-10: $50/ea | Buy 11-50: $45/ea"
- MOQ indicators
- Documentation: SDS for chemicals, spec sheets for appliances
- Real-time inventory levels at supplier warehouse

### E. Cart & Checkout
- Cost Center Allocation (assign line items to departments)
- RFQ (Request for Quote) for bulk orders
- Upload PO (attach PDF of hotel's official PO)
- Payment Methods: Invoicing/Net Terms, Corporate CC, ACH
- Multi-location Shipping (split order across hotel properties)

### F. Order Management & History
- Digital Invoices (downloadable PDF)
- Returns & Claims (damaged goods with photo uploads)
- Backorder Management (out-of-stock visibility)

### G. Account & Settings
- Workflow Rules (e.g., "orders under $500 auto-approved, over $500 requires GM PIN")
- Budget Limits (monthly caps per department)
- Address Book (delivery instructions, loading docks)
- Integrations (QuickBooks, SAP, Oracle)

## 3. Key Differentiators
- **Room Kits/Bundles**: "Standard King Room Refresh Kit" with exact ratios
- **Par Level Management**: input minimum stock levels, push notifications when low
- **Offline Mode**: barcode scanning + cart building offline, syncs in lobby

## 4. Technical Architecture
- Frontend: React Native + Expo + Tamagui (locked stack)
- Backend/API: Node.js/Express or Python FastAPI
- Database: PostgreSQL (relational for complex pricing tables + roles)
- B2B E-commerce: headless approach
- ERP Middleware: sync with supplier ERPs (NetSuite, SAP)

## P0 Features to Implement
1. Barcode/QR scanner for quick reorder
2. Cost center allocation per line item
3. Custom catalogs with negotiated pricing
4. Workflow rules (auto-approve thresholds)
5. Par level tracking with low-stock alerts
6. Offline cart building with sync
