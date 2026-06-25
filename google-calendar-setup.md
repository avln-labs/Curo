# Google Calendar & Google Meet Integration Setup Guide

This guide explains how to configure Google OAuth 2.0 credentials in the Google Cloud Console to enable automatic Google Calendar event creation and Google Meet link generation in CURO.

## 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Google Calendar API**:
   - In the left sidebar, navigate to **APIs & Services > Library**.
   - Search for "Google Calendar API" and click **Enable**.

## 2. Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**.
2. Select **User Type: External** (or Internal if restricted to your Google Workspace organization).
3. Fill in the required details (App name, User support email, Developer contact information).
4. Click **Save and Continue**.
5. Under **Scopes**, add the following scope:
   - `https://www.googleapis.com/auth/calendar.events` (Manage events on your calendars)
6. Add test users if your app is in Publishing Status: Testing.

## 3. Create OAuth Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Application type: Web application**.
4. Set a name (e.g., `CURO Backend`).
5. Under **Authorized redirect URIs**, add your backend callback URI:
   - Local Development: `http://localhost:4000/api/v1/doctors/google/callback`
   - Production: `https://your-backend-domain.com/api/v1/doctors/google/callback`
6. Click **Create**.
7. Note down your **Client ID** and **Client Secret**.

## 4. Environment Variables

Add the following environment variables to your backend `.env` file (located in `backend/.env`):

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/v1/doctors/google/callback"
```

## 5. Testing the Flow

1. Log in to the CURO app as a Doctor and navigate to **Dashboard > Google Calendar**.
2. Click **Connect Google Account**.
3. Log in with your Google Account and grant permission.
4. You will be redirected back to the dashboard with a success confirmation.
5. Once a patient books and completes payment for an `online` consultation, a Google Calendar event with a Google Meet link will be automatically generated and attached to the appointment.
