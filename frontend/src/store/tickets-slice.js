import { createSlice } from '@reduxjs/toolkit';

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState: {
    tickets: [],
    refunds: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchTicketsStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayTickets(state, action) {
      state.tickets = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    displayRefunds(state, action) {
      state.refunds = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    addBookedTicket(state, action) {
      if (action.payload) {
        state.tickets.unshift(action.payload);
      }
      state.loading = false;
    },
    updateTicketStatus(state, action) {
      const { id, status } = action.payload;
      state.tickets = state.tickets.map((tkt) => (tkt.id === id ? { ...tkt, ticketStatus: status, status } : tkt));
    },
    ticketsActionFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const ticketsActions = ticketsSlice.actions;

export default ticketsSlice;

