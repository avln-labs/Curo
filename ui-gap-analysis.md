# UI Gap Analysis for CURO

## 1. Completed UI coverage

- Login flow
  - OTP-style role selection for Doctor/Patient
  - Input field, request OTP, verify OTP states
- Home & navigation
  - App shell with sticky top navigation
  - Landing page with workflow cards and status metrics
- Doctor workspace
  - Onboarding form for doctor profile creation
  - Doctor dashboard with appointment cards
  - Schedule view with daily slot blocks
- Patient booking
  - Stepper-driven booking journey
  - Doctor selection, slot selection, patient details, confirmation
  - Proceed-to-payment CTA
- Consultation workspace
  - Session list with selection state
  - Patient snapshot and AI summary panel
  - Notes feed and prescription preview
- Payments
  - Razorpay mock payment flow with success/failure buttons
- Admin, records, prescriptions, health threads
  - Expanded from placeholders to content-rich pages
  - Admin queue cards and analytics stats
  - Records share panel and recent record cards
  - Prescription library and action buttons
  - Health timeline events for patient history

## 2. UI/UX expansion completed

- Dark mode design applied across the app
- Clinical minimalist look with card surfaces, muted text, and primary CTA styling
- Responsive mobile-first layouts for grids, cards, and stepper flow
- Improved interaction affordances for buttons, links, and step state
- Consistent spacing, rounded cards, and elevated surface treatment

## 3. Remaining UI gaps and product-grade work

- Backend integration
  - All screens remain mock/data-driven and do not persist real backend state
  - Prescriptions, records, admin actions, and health threads require API/data wiring
- Consultation workspace
  - Prescription builder and edit workflow is not implemented
  - Real patient history / timeline integration is not available
- Booking flow
  - No payment state or transaction persistence beyond the mock page
  - Patient profile / saved details not stored
- Admin console
  - Approval actions are UI-only and do not execute workflows
  - No audit log or role-based access enforcement
- Records & prescriptions
  - Files, PDF previews, sharing policy, and verification flows remain conceptual

## 4. Navigation and flow coverage

- Core routes now accessible from the home page
- Login remains a separate entry point, with main app navigation exposed after entry
- Public patient booking, doctor dashboard, consultation review, and admin landing are reachable in one prototype
- Secondary route coverage includes records, prescriptions, and health thread review

## 5. Next UI priorities

1. Connect existing screens to backend APIs and actual data models
2. Implement persistence for bookings, payments, records, prescriptions, and consultation notes
3. Add a prescription compose screen and dosage/resupply capabilities
4. Add patient profile / patient portal view for saved history and records
5. Harden admin and health thread flows for realistic approval and care coordination
