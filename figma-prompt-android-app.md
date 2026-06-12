# Figma Design Prompt – Batla Medicos Android App

---

## 🎯 Project Overview

Design a **native Android mobile app** for **"Batla Medicos – Chemist & Cosmetics"**, a trusted neighbourhood pharmacy in New Delhi (since 2005). The app is a full-featured online pharmacy + health services platform. Convert the existing web experience into a polished Material Design 3 Android app with smooth animations, intuitive navigation, and a premium yet approachable feel.

**Tagline:** "Your Trusted Neighbourhood Pharmacy Since 2005"  
**Store:** F 41/2 Nafees Road, Batla House, Jamia Nagar, New Delhi – 110025  
**Hours:** 9 AM – 11:45 PM, 7 days a week

---

## 🎨 Brand & Design System

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| **Primary** | `#C0392B` | CTA buttons, app bar accent, badges, highlights |
| **Primary Variant** | `#A93226` | Pressed states, dark mode primary |
| **Secondary** | `#1B8843` | Trust badges, verified/success indicators, stock available |
| **Tertiary** | `#2563EB` | Secondary CTAs, links, info states |
| **Background** | `#FFFFFF` | Main background |
| **Surface** | `#F9FAFB` | Cards, containers, sections |
| **On Primary** | `#FFFFFF` | Text/icons on primary color |
| **Error** | `#E74C3C` | Error states, out-of-stock, cancelled orders |
| **Warning** | `#F39C12` | Low stock, pending status |

### Typography
- **Font Family:** Google Sans or Inter (clean, medical/professional feel)
- **Headline Large:** 28sp Bold — screen titles
- **Headline Medium:** 22sp SemiBold — section headers
- **Title Medium:** 16sp SemiBold — card titles, product names
- **Body Large:** 16sp Regular — body text
- **Body Medium:** 14sp Regular — descriptions, secondary text
- **Label Large:** 14sp Medium — buttons, tabs
- **Label Small:** 11sp Medium — badges, tags, captions

### Corner Radius
- Cards: 16dp
- Buttons: 12dp (full-width CTAs: 28dp pill shape)
- Input fields: 12dp
- Bottom sheet: 24dp top corners
- Chips/tags: 8dp

### Elevation & Shadows
- Cards: 2dp elevation
- Bottom nav: 8dp elevation
- FAB: 6dp elevation
- Modals/Bottom sheets: 16dp elevation

### Iconography
- Use **Material Symbols Rounded** (filled variant for active states, outlined for inactive)
- Custom pharmacy icons for: medicine, prescription, lab test, delivery

---

## 📱 Screen Specifications (Design ALL of these)

---

### 1. SPLASH SCREEN
- Batla Medicos logo centered with subtle pulse animation
- Red (#C0392B) gradient background fading to white
- "Since 2005" subtitle below logo
- Transition: fade-out into Home or Login

---

### 2. ONBOARDING (3 slides — first-time users only)
- **Slide 1:** "Order Medicines Online" — illustration of medicine delivery
- **Slide 2:** "Upload Prescriptions" — illustration of camera/upload
- **Slide 3:** "Book Lab Tests at Home" — illustration of lab collection
- Skip button (top-right), dot indicators, "Get Started" CTA on last slide

---

### 3. LOGIN SCREEN
- App logo at top (compact)
- Email text field with leading mail icon
- Password field with show/hide toggle
- "Forgot Password?" link (right-aligned, blue)
- **"Log In"** full-width primary red button (pill shape)
- Divider: "— or continue with —"
- **Google Sign-In** button (outlined, Google logo + "Sign in with Google")
- Bottom text: "Don't have an account? **Register**" (link to register)

---

### 4. REGISTER SCREEN
- Fields: Full Name, Email, Phone (+91 prefix), Password (with strength indicator)
- Full-width **"Create Account"** red CTA
- Google Sign-In option
- Bottom: "Already have an account? **Log In**"

---

### 5. FORGOT PASSWORD SCREEN
- Illustration of email/lock
- Email input field
- "Send Reset Link" CTA button
- Back to Login link

---

### 6. EMAIL VERIFICATION SCREEN
- Illustration of email with checkmark
- "We sent a verification code to your email"
- 6-digit OTP input (6 separate boxes)
- "Resend Code" timer link
- "Verify" CTA

---

### 7. HOME SCREEN (Main Hub)
**Top Section:**
- Custom app bar: Logo (left), Search bar (center, tappable → opens search overlay), Notification bell (with red dot badge), Cart icon (with item count badge)
- Announcement strip below app bar: "Free Delivery above ₹499 🚛" scrolling ticker

**Hero Section:**
- Auto-sliding promotional banner carousel (rounded corners, dot indicators)
- Each banner: offer image, discount text overlay, CTA button

**Category Row:**
- Horizontally scrollable chips/icons row: Medicines 💊, Ayurveda 🌿, Skincare ✨, Haircare, Baby Care 👶, Vitamins, Fitness 💪, Dental, Diabetes, Homeopathy, Sexual Wellness, Supports & Braces
- Each category = circular icon + label below

**Quick Actions Grid (2x2):**
- "Upload Prescription" (camera icon, green accent)
- "Book Lab Test" (microscope icon, blue accent)
- "My Orders" (package icon)
- "Medicine Reminders" (alarm icon)

**Featured Products Section:**
- Section header: "Featured Products" + "View All →"
- Horizontal scrollable product cards (see Product Card spec below)

**New Arrivals Section:**
- Same layout as Featured, different data

**Lab Tests Showcase:**
- Section header: "Popular Lab Tests" + "View All →"
- Horizontal cards: test name, price, "Book Now" chip

**Brand Promotions:**
- Grid of brand logos (e.g., Himalaya, Mamaearth, Biotique, etc.)
- Tappable → filtered product catalog

**Trust Section:**
- 3 horizontal chips: "100% Genuine", "Licensed Pharmacy", "Since 2005"
- Each with icon + text

**Store Info Card:**
- Map thumbnail (static Google Maps image)
- Address, hours, "Get Directions" button, phone/WhatsApp icons

---

### 8. SEARCH OVERLAY (Full Screen)
- Auto-focus search input with back arrow
- Recent searches (chips, clearable)
- Autocomplete dropdown: product image thumbnail + name + price (max 6 results)
- "View all results for '[query]'" link at bottom
- Empty state: "Search medicines, health products, lab tests..."

---

### 9. PRODUCT CATALOG SCREEN
**Top:** Back arrow + "Products" title + filter icon + sort icon
**Filter Bottom Sheet (on filter tap):**
- Category checkboxes (20+ categories, scrollable)
- Brand checkboxes
- Price range slider
- "Apply Filters" + "Clear All" buttons

**Sort Bottom Sheet:**
- Radio options: Newest, Price: Low to High, Price: High to Low, Name A-Z, Category

**Body:**
- Active filter chips row (below header, horizontally scrollable, dismissible)
- Product count label: "Showing 142 products"
- 2-column grid of Product Cards
- Infinite scroll / "Load More" button

**Empty State:**
- Illustration + "No products found" + "Try different filters" + Clear filters button

---

### 10. PRODUCT CARD (Reusable Component)
- Product image (square, rounded top corners)
- Wishlist heart icon (top-right overlay, toggleable red/outline)
- Prescription required badge "Rx" (top-left, red pill shape) — if applicable
- Product name (2-line max, ellipsis)
- Star rating (small, yellow stars + count)
- Price row: ~~₹MRP~~ (strikethrough gray) + **₹Sale Price** (bold red) + "X% OFF" green badge
- "Add to Cart" button (outlined red, changes to quantity stepper ─ + when item in cart)
- Out-of-stock state: grayed image, "Out of Stock" overlay, "Request Availability" link

---

### 11. PRODUCT DETAIL SCREEN
**Image Section:**
- Full-width image carousel with swipe + dot indicators
- Back arrow (top-left, semi-transparent circle), Share icon (top-right), Wishlist heart (top-right)

**Product Info:**
- Product name (large title)
- Brand name (tappable, blue link → filtered catalog)
- Star rating bar: ★ 4.2 (128 reviews) — tappable to scroll to reviews
- Price block: ~~₹MRP~~ **₹Price** | "Save ₹XX (X% off)" green text

**Badges Row (horizontal chips):**
- "Rx Required" (red) — if prescription needed
- "In Stock" (green) / "Limited Stock" (orange) / "Out of Stock" (red)
- "Free Delivery" (if applicable)

**Quantity + CTA:**
- Quantity stepper (─ [1] +)
- Full-width "Add to Cart" red CTA (or "Go to Cart" if already added)
- "Buy Now" secondary outlined CTA

**Description Tabs (Segmented/Tab bar):**
- **Description** — product description text
- **Uses & Conditions** — bullet list of conditions
- **Side Effects** — bullet list
- **Reviews** — user reviews list (star + name + date + text), "Write a Review" FAB

**Related Products:**
- "You May Also Like" horizontal scroll of Product Cards
- "More from [Brand]" horizontal scroll

---

### 12. CART DRAWER / SCREEN (Bottom Sheet or Full Screen)
**Header:** "My Cart" + item count + Close (X)

**Cart Items List:**
- Product thumbnail (small square), name, price
- Quantity stepper (─ [qty] +)
- Remove button (trash icon)
- Item subtotal (right-aligned)

**Cart Summary (sticky bottom):**
- Subtotal: ₹XXX
- Delivery: ₹29 (or "FREE" in green if > ₹499)
- **Total: ₹XXX** (bold, large)
- "Proceed to Checkout →" full-width primary red CTA

**Empty Cart State:**
- Empty cart illustration
- "Your cart is empty"
- "Browse Products" CTA

---

### 13. CHECKOUT SCREEN
**Step 1 — Delivery Type:**
- Toggle card selector: "🏠 Home Delivery" | "🏪 Store Pickup"
- If Home Delivery: address form (Name, Phone, Address, Landmark, Pincode)
  - "📍 Use Current Location" GPS button (auto-fills address)
  - "📱 Share on WhatsApp" location share
  - Saved addresses dropdown (if any)
- If Store Pickup: store address shown + pickup time slot picker (6 slots, 9 AM – 11:45 PM)

**Step 2 — Payment Method:**
- Radio card selectors with icons:
  - Razorpay (UPI, Card, NetBanking) — Razorpay logo
  - Cash on Delivery — cash icon
  - Paytm — Paytm logo (if enabled)

**Step 3 — Coupon Code:**
- Input field + "Apply" button
- Applied coupon chip (green, dismissible, shows discount amount)

**Step 4 — Prescription Alert (if Rx items in cart):**
- Warning card: "Your cart has prescription medicines. Please upload a valid prescription."
- "Upload Prescription" CTA → prescription upload flow

**Order Summary Card:**
- Collapsed by default, expandable
- Item list with qty × price
- Subtotal, Delivery, Coupon Discount, **Grand Total**

**Bottom CTA:**
- "Place Order – ₹XXX" full-width primary red button
- Terms text: "By placing this order, you agree to our Terms & Conditions"

---

### 14. ORDER SUCCESS SCREEN
- Green checkmark animation (Lottie)
- "Order Placed Successfully! 🎉"
- Order ID display
- ETA card: "Expected delivery in 30-60 mins"
- 3 action buttons: "View Order", "Continue Shopping", "Share Receipt"

---

### 15. ORDERS LIST SCREEN
**Top:** "My Orders" title
**Filter Row:** Horizontally scrollable status chips: All, Placed, Confirmed, Dispatched, Delivered, Cancelled (active chip highlighted red)

**Order Cards:**
- Order #INV-XXXX | Date
- Status badge (color-coded): Placed (blue), Confirmed (orange), Dispatched (purple), Delivered (green), Cancelled (red)
- Product thumbnails row (3 max + "+X more" chip)
- Total amount (bold)
- "View Details" → Order Detail
- "Reorder" button (outlined)

**Empty State:**
- "No orders yet" illustration
- "Start Shopping" CTA

---

### 16. ORDER DETAIL SCREEN
**Status Timeline:**
- Vertical stepper: Placed ✓ → Confirmed ✓ → Dispatched → Delivered
- Active step highlighted, completed steps green with checkmark, future steps gray

**Delivery Info Card (if dispatched):**
- Delivery person: name, photo placeholder
- "📞 Call" and "💬 WhatsApp" action buttons
- "🔑 Delivery OTP: XXXX" (prominent display)
- "📍 Share Live Location" button

**Order Items Table:**
- Product name | Qty | Price | Subtotal (per row)

**Price Breakdown:**
- Subtotal, Delivery Charge, Coupon Discount, **Total Paid**
- Payment method label

**Prescription Link (if applicable):**
- "View Prescription" card with preview thumbnail

**Actions Row:**
- "📄 Download Receipt" | "📧 Email Receipt" | "🖨 Print"
- "🔄 Reorder" button

---

### 17. PRESCRIPTION UPLOAD SCREEN
**My Prescriptions List (top section):**
- Cards showing: thumbnail, upload date, status badge (Pending/Approved/Rejected)
- Pharmacist notes (if any)
- Tap to preview full image/PDF

**Upload FAB / CTA:**
- "Upload New Prescription" button

**Upload Flow (Bottom Sheet or new screen, multi-step):**
- **Step 1 — File Upload:**
  - Large dashed upload area: "Tap to upload or take a photo"
  - Camera icon + Gallery icon
  - File type note: JPG, PNG, WebP, PDF (max 5 MB)
  - Preview thumbnail after selection

- **Step 2 — Patient Details (optional):**
  - Patient name dropdown (self + family members)
  - Doctor name field

- **Step 3 — Delivery Address:**
  - "📍 Use Current Location" auto-fill
  - Saved address toggle
  - Manual address fields

- **Step 4 — Notes:**
  - Special instructions textarea
  - "Submit Prescription" CTA

---

### 18. LAB TESTS SCREEN
**Top:** "Lab Tests" title + search bar

**Category Tabs (horizontal scroll):**
Blood Tests, Urine Tests, Stool Tests, Imaging, Cardiac, Hormones, Vitamins, Other

**Test Cards (vertical list):**
- Test name (bold)
- Category chip
- Price: **₹XXX**
- "NABL Certified 🏅" badge
- "Reports in 24-48 hrs" label
- "Add" chip button (toggleable, shows ✓ when added)

**Sticky Bottom Cart Bar (when tests selected):**
- "X tests selected | ₹XXX"
- "Book Now →" CTA

---

### 19. LAB BOOKING WIZARD (3 Steps)
**Step 1 — Patient Info:**
- Patient name, phone, age, gender (radio: M/F/Other)
- Form validation with inline errors

**Step 2 — Collection Details:**
- Toggle: "🏠 Home Collection (Free)" | "🏥 Walk-in"
- If home: address fields + GPS auto-fill + date picker + time slot picker (6 AM – 6 PM, 2-hour slots)
- If walk-in: lab address shown + date picker

**Step 3 — Confirm & Book:**
- Summary card: patient details, collection type, address, date/time
- Tests list with prices
- **Total: ₹XXX**
- "Confirm Booking" CTA

**Success State:**
- Checkmark animation
- "Booking Confirmed!"
- Booking ID, expected date
- "View My Bookings" CTA

---

### 20. LAB BOOKINGS (History)
**Booking Cards:**
- Booking ID | Date
- Tests list (chips)
- Status badge: Pending, Sample Collected, Report Ready, Completed
- Collection type label
- "Download Report" button (if ready)
- "Reschedule" / "Cancel" options

---

### 21. WISHLIST SCREEN
- Grid or list of wishlisted Product Cards
- Heart icon filled (red) on each
- "Add to Cart" per item
- "Remove" swipe action or icon
- Empty state: "Your wishlist is empty" + "Explore Products" CTA

---

### 22. NOTIFICATIONS SCREEN
**Notification Cards (vertical list):**
- Icon (order 📦, prescription 💊, promo 🎁, reminder ⏰)
- Title (bold if unread), message preview, timestamp
- Unread indicator: blue dot (left edge)
- Tap → deep link to relevant screen (order, prescription, etc.)
- Swipe to dismiss/mark-read

---

### 23. MEDICATION REMINDERS SCREEN
**Active Reminders List:**
- Medicine name, dosage, frequency (Daily, Weekly, etc.)
- Next reminder time
- Toggle switch (active/paused)
- Edit / Delete actions

**Add Reminder FAB:**
- Medicine name (search/autocomplete from products)
- Dosage (text field)
- Frequency: Daily, Twice Daily, Weekly, Custom
- Time picker(s)
- Start/End date
- "Save Reminder" CTA

---

### 24. ACCOUNT / PROFILE SCREEN
**Tab 1 — Profile:**
- Avatar (initials or photo)
- Name (editable)
- Email (read-only, grayed)
- Phone (editable)
- "Save Changes" CTA

**Tab 2 — Family Members:**
- Cards: Name, Relation, DOB, Blood Group, Allergies (red warning chips)
- "Edit" / "Delete" per card
- "Add Family Member" CTA → form bottom sheet

**Quick Links Section:**
- My Orders, My Prescriptions, Lab Bookings, Wishlist, Reminders, Notifications
- Each with right chevron →

**Bottom:**
- "Log Out" button (outlined red)
- App version label

---

### 25. DISEASES / HEALTH CONDITIONS SCREEN
- Alphabetical or category-based list of conditions
- Tappable cards → filtered products for that condition
- Search bar at top

---

### 26. DELIVERY PARTNER PANEL (Separate role)
**Assigned Orders List:**
- Customer name, address, order total
- Status actions: "Accept", "Picked Up", "Out for Delivery"

**Order Detail for Delivery:**
- Customer contact (call/WhatsApp)
- Address with "Navigate" (opens Google Maps)
- OTP verification input (4-digit)
- "Mark Delivered" CTA (requires correct OTP)

---

### 27. CHATBOT (MedBot)
- **Floating Action Button** (bottom-right, above bottom nav): chat bubble icon with unread badge
- **Chat Panel (Bottom Sheet expanding to full screen):**
  - Header: "MedBot 🤖" + minimize/close
  - Welcome message: "Hi! I'm MedBot, your pharmacy assistant. How can I help you?"
  - 6 quick reply chips: "Store Hours", "Track Order", "Lab Tests", "Upload Prescription", "Delivery Info", "Talk to Pharmacist"
  - Message bubbles: user (right, red bg) vs bot (left, gray bg)
  - Typing indicator (3 animated dots)
  - Text input + send button

---

### 28. LEGAL / INFO PAGES
- Privacy Policy, Terms & Conditions, Refund Policy
- Simple scrollable text with section headers
- Back arrow navigation

---

## 🧭 Navigation Structure

### Bottom Navigation Bar (5 tabs)
| Tab | Icon | Label | Screen |
|-----|------|-------|--------|
| 1 | 🏠 Home | Home | Home Screen |
| 2 | 🔍 Browse | Products | Product Catalog |
| 3 | 💊 Rx Upload | Prescriptions | Prescription Upload |
| 4 | 📦 Orders | My Orders | Orders List |
| 5 | 👤 Account | Profile | Account Screen |

### Additional Navigation
- **Cart:** Accessed via top-right cart icon (badge with count) → Cart Bottom Sheet
- **Notifications:** Bell icon in app bar → Notifications screen
- **Wishlist:** Heart icon in app bar → Wishlist screen
- **Lab Tests:** From Home quick actions or Account links
- **Reminders:** From Account quick links
- **ChatBot:** Floating action button (always visible, above bottom nav)
- **Search:** Tappable search bar in Home app bar → full-screen search overlay

---

## ✨ Animations & Micro-interactions

1. **Add to Cart:** Product image flies to cart icon with scale animation; cart icon bounces/jiggles
2. **Wishlist Toggle:** Heart fills with red with a pop/scale effect
3. **Pull to Refresh:** Custom pharmacy-themed loading animation
4. **Page Transitions:** Shared element transitions for product image (catalog → detail)
5. **Bottom Sheet:** Smooth spring-based slide-up
6. **Skeleton Loading:** Gray shimmer placeholders while content loads
7. **Order Placed:** Confetti or checkmark Lottie animation
8. **Quantity Stepper:** Number changes with a subtle scale bounce
9. **Tab Switching:** Crossfade with indicator slide animation
10. **Notification Badge:** Pop-in animation when count changes
11. **Offer Banner:** Auto-slide with parallax + 3D card flip between banners
12. **Chat Typing:** 3 bouncing dots animation

---

## 📐 Component Library to Build

Create reusable components in Figma:
1. Product Card (default, out-of-stock, in-cart states)
2. Primary Button (default, loading, disabled)
3. Secondary/Outlined Button
4. Text Input (default, focused, error, disabled)
5. Quantity Stepper (compact, expanded)
6. Status Badge (6 color variants)
7. Category Chip (active, inactive)
8. Filter Chip (selected, unselected)
9. Order Card
10. Notification Card (read, unread)
11. Lab Test Card
12. Prescription Card (pending, approved, rejected)
13. Booking Card
14. Address Card (with GPS auto-fill button)
15. Cart Item Row
16. Rating Stars (display + interactive input)
17. Bottom Sheet (half, full-screen)
18. Search Bar (collapsed, expanded)
19. App Bar (with/without search, with/without announcement strip)
20. Bottom Navigation Bar (5 tabs + FAB overlay)
21. Quick Reply Chip (chatbot)
22. Chat Bubble (sent, received)
23. Empty State (illustration + text + CTA)
24. Skeleton Loader (card, list, detail)
25. Toast/Snackbar (success, error, info)

---

## 📏 Layout Specifications

- **Design for:** 360 x 800dp (standard Android), also provide 412 x 915dp (large phone)
- **Safe areas:** Respect status bar (24dp top) and navigation bar (48dp bottom)
- **Grid:** 16dp horizontal margins, 8dp gutter between columns
- **Touch targets:** Minimum 48 x 48dp for all interactive elements
- **Bottom nav height:** 80dp (with labels)
- **App bar height:** 56dp (compact) / 112dp (with search)
- **Card spacing:** 16dp between cards, 12dp internal padding
- **Scroll behavior:** App bar collapses on scroll (home screen), bottom nav hides on scroll-down / shows on scroll-up

---

## 🌙 Dark Mode

Design a complete dark mode variant:
- Background: `#121212`
- Surface: `#1E1E1E`
- Cards: `#2C2C2C`
- Primary Red: `#E74C3C` (slightly brighter for dark bg)
- Text primary: `#FFFFFF`
- Text secondary: `#B0B0B0`
- Dividers: `#333333`
- Status bar: transparent with light icons

---

## 📁 Figma File Structure

Organize the Figma file as:
```
📁 Batla Medicos Android App
├── 📄 Cover Page (app mockup, brand colors, project info)
├── 📁 Design System
│   ├── Colors & Tokens
│   ├── Typography Scale
│   ├── Icons & Illustrations
│   ├── Component Library (all 25 components above)
│   └── Elevation & Shadow Styles
├── 📁 Screens — Light Mode
│   ├── 01 Splash
│   ├── 02 Onboarding
│   ├── 03 Auth (Login, Register, Forgot, Verify)
│   ├── 04 Home
│   ├── 05 Search
│   ├── 06 Product Catalog
│   ├── 07 Product Detail
│   ├── 08 Cart
│   ├── 09 Checkout
│   ├── 10 Order Success
│   ├── 11 Orders & Order Detail
│   ├── 12 Prescriptions
│   ├── 13 Lab Tests & Booking
│   ├── 14 Lab Bookings History
│   ├── 15 Wishlist
│   ├── 16 Notifications
│   ├── 17 Reminders
│   ├── 18 Account & Profile
│   ├── 19 Diseases
│   ├── 20 ChatBot
│   ├── 21 Delivery Panel
│   └── 22 Legal Pages
├── 📁 Screens — Dark Mode (mirror of Light Mode)
├── 📁 User Flows (connected prototypes)
│   ├── Auth Flow
│   ├── Shopping Flow (browse → cart → checkout → success)
│   ├── Prescription Flow
│   ├── Lab Booking Flow
│   └── Order Tracking Flow
└── 📁 Handoff & Specs
    ├── Spacing & Layout Guide
    ├── Animation Specs
    └── Asset Export Guide
```

---

## 🧪 States to Design for Each Screen

For completeness, design these states per screen:
- **Default/Loaded** — normal data
- **Loading** — skeleton/shimmer
- **Empty** — no data illustration + CTA
- **Error** — network error / server error with retry
- **Offline** — cached data notice or offline illustration

---

## 📝 Additional Notes for Designer

1. **Indian context:** All prices in ₹ (INR), phone numbers in +91 format, addresses in Indian format (with Pincode)
2. **Accessibility:** Minimum contrast ratio 4.5:1, support dynamic text sizing, label all icons
3. **RTL support:** Not required (English + Hindi is LTR)
4. **Hindi:** Consider bilingual support for key labels (optional future scope)
5. **Competitive references:** 1mg, PharmEasy, Netmeds, Apollo 247 — but with a warmer, local pharmacy personality
6. **Brand personality:** Trustworthy, warm, professional, local, not overly corporate
7. **Key differentiators to highlight in design:** Since 2005 trust legacy, local delivery in 30-60 mins, personal pharmacist chat (MedBot), family health profiles, prescription management
