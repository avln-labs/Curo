# CURO Design System

## Product Identity

**CURO** is a consultation workflow platform for independent doctors and small clinics.

It is not:

- Hospital ERP
- Clinic management software
- CRM
- Generic SaaS dashboard

It is:

> A doctor's private memory system.

Every interaction should reinforce:

- Trust
- Continuity
- Clinical professionalism
- Operational simplicity
- Long-term patient context

---

# Product Philosophy

Inspired by:

- Claude
- Linear
- Raycast
- Notion
- Mercury
- Modern health-tech products

Avoid:

- Generic SaaS dashboards
- Bright startup gradients
- KPI-card overload
- Corporate enterprise aesthetics
- Visual clutter
- Heavy glassmorphism

---

# Core Design Principles

## 1. Information First

Doctors spend most of their time reading.

The product should prioritize:

```text
Information
→ Actions
→ Decoration
```

Never reverse this hierarchy.

### Examples

Good:

- Patient summary visible immediately
- Consultation history prominent
- Prescription information prioritized

Bad:

- Large hero graphics
- Decorative illustrations
- Analytics dominating the screen

---

## 2. Reduce Cognitive Load

Every screen should answer:

```text
Who?
Why?
What next?
```

within 3 seconds.

A doctor should immediately understand:

- Who the patient is
- Why they booked
- What action needs to happen next

---

## 3. One Primary Action

Every screen should contain:

```text
1 Primary Action
≤ 2 Secondary Actions
```

### Example: Pre-Consult Screen

Primary:

- Start Consultation

Secondary:

- View History
- Edit AI Summary

### Example: Prescription Screen

Primary:

- Send Prescription

Secondary:

- Save Draft

Avoid multiple competing CTAs.

---

## 4. Longitudinal Memory

The most valuable asset in CURO is:

```text
Patient History
```

Not:

- Appointments
- Billing
- Analytics

The UI should make history feel:

- Persistent
- Connected
- Accumulative
- Intelligent

Think:

**Claude conversation thread**

instead of

**CRM database record**

---

# Visual Style

## Style Name

**Clinical Minimalism**

### Keywords

- Calm
- Professional
- Editorial
- Intelligent
- Human
- Focused
- Trustworthy

---

# Visual Density

Target density:

```text
Claude
+
Linear
+
Notion
```

Avoid extremes.

Not:

```text
Apple marketing page
```

Too sparse.

Not:

```text
Hospital ERP
```

Too dense.

---

# Color System

## Primary

```css
--primary: #0F766E;
```

Deep teal.

Represents:

- Trust
- Healthcare
- Stability

---

## Text

```css
--text-primary: #111827;
--text-secondary: #6B7280;
```

---

## Background

```css
--bg: #FAFAF9;
--surface: #FFFFFF;
```

---

## Borders

```css
--border: #E7E5E4;
```

---

## Status Colors

### Success

```css
--success: #15803D;
```

### Warning

```css
--warning: #D97706;
```

### Error

```css
--error: #DC2626;
```

---

# Dark Mode

Dark mode is mandatory.

Use:

```css
--bg: #0B0F14;
--surface: #111827;
--text-primary: #F9FAFB;
--text-secondary: #94A3B8;
```

Guidelines:

- Softer contrast
- No pure black
- No pure white
- Claude-style readability

---

# Typography

## Primary Font

```text
Inter
```

Used for:

- UI
- Headings
- Forms
- Body content

### Heading Weight

```text
600
```

### Body Weight

```text
400
```

---

## Data Font

```text
JetBrains Mono
```

Used for:

- Consultation IDs
- Registration numbers
- Prescription references
- Audit logs

---

# Spacing System

Base unit:

```text
8px
```

Scale:

```text
8
12
16
24
32
48
64
```

Avoid arbitrary values.

---

# Layout System

## Doctor Workspace

```css
max-width: 1440px;
```

---

## Reading Width

For summaries and notes:

```css
max-width: 70ch;
```

---

## Forms

```css
max-width: 640px;
```

Never stretch forms edge-to-edge.

---

# Dashboard Philosophy

## Remove KPI Card Syndrome

Avoid:

- Revenue cards
- Conversion cards
- Growth cards
- Retention cards
- Vanity metrics

Doctors care about today's work.

---

## Daily Overview

Display:

```text
Today's Appointments
Revenue Collected
Pending Payments
```

As a single summary strip.

Example:

```text
8 Appointments
₹5,600 Collected
2 Pending Payments
```

---

# Signature Component

## Patient Timeline

This should become the visual identity of CURO.

Structure:

```text
Patient
│
├─ Consultation
│
├─ Prescription
│
├─ Lab Report
│
├─ Follow-Up
│
└─ Consultation
```

Design goals:

- Continuous
- Chronological
- Easy to scan
- Feels alive

Reference:

- Claude conversation history
- Notion timeline views

Avoid:

- Spreadsheet tables
- CRM-style records

---

# AI Summary Component

Most important AI feature.

Structure:

```text
AI Summary

Patient reports recurrent gastritis.
Previously prescribed Pantoprazole.
Current symptoms ongoing for 5 days.

Sources:
• Consultation Apr 12
• Prescription Apr 14
• Intake Form Today
```

Rules:

- Maximum 200 words
- Highly readable
- Source attribution mandatory
- Fully editable
- Regeneration available

---

# Booking Experience

The patient booking flow should feel like:

```text
Calendly
+
Stripe Checkout
```

Not hospital software.

---

## Flow Structure

### Step 1

Patient Details

### Step 2

Symptoms

### Step 3

Select Slot

### Step 4

Payment

One task per screen.

Never combine all steps into a single page.

---

# Mobile-First Design

Primary viewport:

```text
375px
```

Design mobile first.

Desktop is a secondary adaptation.

---

## Touch Targets

Minimum:

```text
44 × 44 px
```

---

## Sticky CTA

Every booking step should include:

```text
Continue
Book Slot
Pay Now
```

Fixed at the bottom.

---

# Accessibility

Required:

- WCAG AA compliance
- 4.5:1 contrast ratio
- Keyboard navigation
- Screen-reader labels
- Visible focus states

Never rely on color alone.

---

# Motion Design

Inspired by:

- Claude
- Linear

Duration:

```text
150–250ms
```

Use:

- Opacity
- Transform
- Scale (subtle)

Avoid:

- Bounce effects
- Dramatic animations
- Decorative motion

Every animation must communicate state.

---

# Components

## Buttons

### Primary

Filled teal.

Purpose:

- Start Consultation
- Send Prescription
- Pay Now

### Secondary

Neutral gray.

Purpose:

- Edit
- View Details
- Save Draft

### Danger

Red.

Purpose:

- Cancel Appointment
- Delete
- Revoke Access

---

## Cards

Radius:

```css
16px
```

Shadow:

```css
0 1px 3px rgba(0,0,0,.06);
```

Very subtle.

No floating dashboard cards.

---

## Inputs

Height:

```css
48px
```

Rules:

- Labels always visible
- Placeholder is supplementary
- Inline validation
- Mobile-friendly keyboard types

---

# Consultation Workspace

The consultation screen is the most important screen in CURO.

Layout:

```text
┌───────────────────────────────┐
│ Patient Snapshot              │
├───────────────────────────────┤
│ AI Summary                    │
├───────────────────────────────┤
│ Consultation Notes            │
├───────────────────────────────┤
│ Prescription Builder          │
└───────────────────────────────┘
```

Optional side panel:

```text
Patient History
Previous Prescriptions
Uploaded Reports
```

The doctor should never lose context.

---

# Design Anti-Patterns

Never use:

- Neon gradients
- Glassmorphism-heavy interfaces
- Enterprise blue dashboards
- Dashboard KPI overload
- Emoji-based navigation
- Decorative illustrations during workflow
- Multiple competing CTAs
- Tables as the primary patient-history interface

---

# Success Criteria

The design system is successful when doctors describe CURO as:

> "This remembers my patients."

instead of:

> "This helps me manage appointments."

The platform's strongest visual narrative should always be:

**Memory → Context → Continuity**

not

**Scheduling → Billing → Administration**

Every screen should reinforce:

> "This doctor remembers this patient."