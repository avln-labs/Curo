import { env } from '../shared/env';

export const GoogleCalendarService = {
  getAuthUrl(doctorId: string) {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events',
      access_type: 'offline',
      prompt: 'consent',
      state: doctorId,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async exchangeCodeForTokens(code: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to exchange code: ${err}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  },

  async getAccessToken(refreshToken: string) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to refresh token: ${err}`);
    }

    const data = await res.json();
    return data.access_token as string;
  },

  async createMeetEvent(
    refreshToken: string,
    appointment: {
      id: string;
      doctorName: string;
      patientName: string;
      slotDate: string;
      slotTime: string;
      chiefComplaint: string;
    }
  ) {
    const accessToken = await this.getAccessToken(refreshToken);

    // Combine date and time to ISO string
    const startTimeStr = `${appointment.slotDate}T${appointment.slotTime.slice(0, 5)}:00`;
    const startObj = new Date(startTimeStr);
    const endObj = new Date(startObj.getTime() + 15 * 60 * 1000); // default 15 mins

    const eventBody = {
      summary: `Online Consultation: Dr. ${appointment.doctorName} & ${appointment.patientName}`,
      description: `Chief Complaint: ${appointment.chiefComplaint}\nAppointment ID: ${appointment.id}`,
      start: { dateTime: startObj.toISOString() },
      end: { dateTime: endObj.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: `curo-meet-${appointment.id}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create calendar event: ${err}`);
    }

    const data = await res.json();
    const meetLink = data.hangoutLink ?? null;
    return {
      calendarEventId: data.id as string,
      meetLink: meetLink as string | null,
    };
  },

  async updateEvent(
    refreshToken: string,
    calendarEventId: string,
    appointment: {
      slotDate: string;
      slotTime: string;
    }
  ) {
    const accessToken = await this.getAccessToken(refreshToken);

    // Combine date and time to ISO string
    const startTimeStr = `${appointment.slotDate}T${appointment.slotTime.slice(0, 5)}:00`;
    const startObj = new Date(startTimeStr);
    const endObj = new Date(startObj.getTime() + 15 * 60 * 1000); // default 15 mins

    const eventBody = {
      start: { dateTime: startObj.toISOString() },
      end: { dateTime: endObj.toISOString() },
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to update calendar event: ${err}`);
    }
  },

  async deleteEvent(refreshToken: string, calendarEventId: string) {
    const accessToken = await this.getAccessToken(refreshToken);
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      // Ignore 404s if it's already deleted or not found
      if (res.status !== 404 && res.status !== 410) {
        throw new Error(`Failed to delete calendar event: ${err}`);
      }
    }
  },

  async revokeToken(refreshToken: string) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (err) {
      console.error('[REVOKE_TOKEN_ERROR]', err);
    }
  },
};
