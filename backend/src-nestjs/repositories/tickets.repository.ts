import { Injectable, BadRequestException } from "@nestjs/common";
import { InMemoryStore } from "./in-memory.store";

@Injectable()
export class TicketsRepository {
  constructor(private readonly store: InMemoryStore) {}

  findUserVerifiedStatus(userId: string) {
    if (!userId) return null;
    if (userId.startsWith("eval_")) {
      return { emailVerified: 1 };
    }
    const u = this.store.findById<any>("users", userId);
    return u ? { emailVerified: u.emailVerified } : null;
  }

  checkBookingRestrictions(userId: string, eventId: string): { allowed: boolean; message?: string } {
    // 1. Rapid duplicate booking within 15 seconds for duplicate payment prevention
    const recentTickets = this.store.find<any>(
      'tickets',
      (t) => t.userId === userId && t.eventId === eventId && t.registrationStatus === 'ACTIVE',
    );
    const nowMs = Date.now();
    const hasRecent = recentTickets.some((t) => {
      const createdMs = new Date(t.createdAt).getTime();
      return nowMs - createdMs < 15000;
    });
    if (hasRecent) {
      return {
        allowed: false,
        message: 'A booking for this event was just processed. Please wait a moment before booking again to prevent duplicate charges.',
      };
    }

    // 2. High cancellation abuse (5+ cancellations across platform)
    const overallCancellations = this.store.count(
      'ticket_cancellations',
      (tc) => tc.userId === userId,
    );
    if (overallCancellations >= 5) {
      return {
        allowed: false,
        message: 'Ticket booking is temporarily restricted on this account due to repeated booking and cancellation activity. Please contact support.',
      };
    }

    return { allowed: true };
  }

  findEventById(eventId: string) {
    if (!eventId) return null;
    const event = this.store.findById<any>("events", eventId);
    if (event) return event;

    const req = this.store.findById<any>("event_requests", eventId);
    if (req) {
      return {
        id: req.id,
        name: req.eventName,
        eventName: req.eventName,
        organizationName: req.organizationName,
        category: req.category,
        date: req.eventDate,
        eventDate: req.eventDate,
        startTime: req.startTime || "09:00 AM",
        endTime: req.endTime || "05:00 PM",
        venue: req.venue,
        location: req.venue,
        type: req.eventType || "PUBLIC",
        registrationStatus: req.registrationStatus || "OPEN",
        ticketPrice: req.ticketPrice || 0,
        totalTickets: req.expectedAttendance || 100,
        availableTickets: req.expectedAttendance || 100,
        status: "PUBLISHED",
        description: req.additionalNotes || req.eventName,
        bannerUrl: req.bannerUrl || null,
        isEventRequest: true,
      };
    }

    return null;
  }

  executeRegistrationTransaction(params: {
    ticket: {
      id: string;
      ticketNumber: string;
      userId: string;
      eventId: string;
      ticketType: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      platformFee: number;
      totalAmount: number;
      paymentStatus: string;
      registrationStatus: string;
    };
    payment: {
      id: string;
      ticketId: string;
      userId: string;
      amount: number;
      paymentMethod: string;
      transactionId: string;
      status: string;
    };
    eventId: string;
    quantity: number;
    validatedInvitationId: string | null;
    userId: string;
  }) {
    const {
      ticket,
      payment,
      eventId,
      quantity,
      validatedInvitationId,
      userId,
    } = params;

    let event = this.store.findById<any>("events", eventId);
    let isRequestEvent = false;
    if (!event) {
      event = this.store.findById<any>("event_requests", eventId);
      isRequestEvent = true;
    }

    if (!event) {
      throw new BadRequestException("Event not found.");
    }

    const availableTickets = Number(
      event.availableTickets || event.expectedAttendance || 100,
    );
    if (availableTickets < quantity) {
      throw new BadRequestException(
        "Insufficient ticket availability. The event has sold out or does not have enough remaining tickets.",
      );
    }

    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

    const user = this.store.findById<any>("users", userId);
    const primaryName = user ? (user.name || user.email || 'Primary Attendee') : 'Primary Attendee';

    // 1. Insert Ticket
    this.store.create("tickets", {
      ...ticket,
      totalMembers: quantity,
      ticketStatus: 'ACTIVE',
      entryStatus: 'NOT_ENTERED',
      checkedIn: 0,
      createdAt: nowStr,
      updatedAt: nowStr,
    });

    // 1.1 Insert individual Ticket Members for group/single tickets
    for (let i = 1; i <= quantity; i++) {
      const memberId = `tm_${ticket.id}_${i}`;
      const memberName = i === 1 ? primaryName : `${primaryName} (Guest ${i})`;
      this.store.create("ticket_members", {
        id: memberId,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        eventId,
        memberIndex: i,
        memberName,
        entryStatus: 'NOT_ENTERED',
        firstEnteredAt: null,
        lastActionAt: null,
        lastAction: null,
        coordinatorId: null,
        coordinatorName: null,
        createdAt: nowStr,
        updatedAt: nowStr,
      });
    }

    // 2. Insert Payment
    this.store.create("payments", {
      ...payment,
      createdAt: nowStr,
    });

    // 3. Decrement Available Tickets
    if (isRequestEvent) {
      this.store.update<any>("event_requests", eventId, {
        expectedAttendance: Math.max(0, availableTickets - quantity),
        updatedAt: nowStr,
      });
    } else {
      this.store.update<any>("events", eventId, {
        availableTickets: Math.max(0, availableTickets - quantity),
        updatedAt: nowStr,
      });
    }

    // 4. Update Invitation status to accepted if invitation record was used
    if (validatedInvitationId) {
      this.store.update<any>("event_invitations", validatedInvitationId, {
        status: "accepted",
        usedAt: nowStr,
        usedByUserId: userId,
        updatedAt: nowStr,
      });
    }
  }

  findTicketWithEventDetails(ticketId: string) {
    if (!ticketId) return null;
    const t = this.store.findById<any>("tickets", ticketId);
    if (!t) return null;

    const e =
      this.store.findById<any>("events", t.eventId) ||
      this.store.findById<any>("event_requests", t.eventId);
    return {
      ...t,
      eventName: e ? e.name || e.eventName : null,
      eventDate: e ? e.date || e.eventDate : null,
      startTime: e ? e.startTime : null,
      venue: e ? e.venue : null,
      location: e ? e.location || e.venue : null,
      organizationName: e ? e.organizationName : null,
      bannerUrl: e ? e.bannerUrl : null,
    };
  }

  totalTicketsPurchased(): number {
    const tickets = this.store.findAll("tickets");
    const results = tickets.reduce((total, result) => {
      return total + result.quantity;
    });
    return results;
  }

  findUserTickets(userId: string) {
    if (!userId) return [];
    const tkts = this.store.find<any>("tickets", (t) => t.userId === userId);

    const mapped = tkts.map((t) => {
      const e =
        this.store.findById<any>("events", t.eventId) ||
        this.store.findById<any>("event_requests", t.eventId);

      const candidateIds = new Set<string>();
      if (t.eventId) candidateIds.add(t.eventId);
      if (e) {
        if (e.id) candidateIds.add(e.id);
        if (e.eventRequestId) candidateIds.add(e.eventRequestId);
      }

      const hasFeedback = Boolean(
        this.store.findOne<any>(
          "event_feedback",
          (f) => f.userId === userId && candidateIds.has(f.eventId),
        ),
      );

      const cancellationCountForEvent = this.store.count(
        'ticket_cancellations',
        (tc) => tc.userId === userId && (tc.eventId === t.eventId || candidateIds.has(tc.eventId)),
      );

      const totalMembers = Number(t.totalMembers || t.quantity || 1);
      const ticketStatus = t.ticketStatus || (t.registrationStatus === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE');
      const entryStatus = t.entryStatus || (t.checkedIn === 1 ? 'FULLY_CHECKED_IN' : 'NOT_ENTERED');

      return {
        ...t,
        totalMembers,
        ticketStatus,
        entryStatus,
        cancellationCountForEvent,
        maxCancellationsReached: cancellationCountForEvent >= 2,
        eventName: e ? e.name || e.eventName : null,
        eventDate: e ? e.date || e.eventDate : null,
        startTime: e ? e.startTime : null,
        endTime: e ? e.endTime : null,
        venue: e ? e.venue : null,
        location: e ? e.location || e.venue : null,
        organizationName: e ? e.organizationName : null,
        bannerUrl: e ? e.bannerUrl : null,
        category: e ? e.category : null,
        hasFeedbackSubmitted: hasFeedback,
      };
    });

    return mapped.sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || ""),
    );
  }

  findUserTicketById(id: string, userId: string) {
    if (!id || !userId) return null;
    const t = this.store.findOne<any>(
      "tickets",
      (t) => t.id === id && t.userId === userId,
    );
    if (!t) return null;

    const e =
      this.store.findById<any>("events", t.eventId) ||
      this.store.findById<any>("event_requests", t.eventId);
    return {
      ...t,
      eventName: e ? e.name || e.eventName : null,
      eventDate: e ? e.date || e.eventDate : null,
      startTime: e ? e.startTime : null,
      endTime: e ? e.endTime : null,
      venue: e ? e.venue : null,
      location: e ? e.location || e.venue : null,
      organizationName: e ? e.organizationName : null,
      bannerUrl: e ? e.bannerUrl : null,
      description: e ? e.description || e.additionalNotes : null,
    };
  }
}
