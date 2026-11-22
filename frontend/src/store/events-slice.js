import { createSlice } from '@reduxjs/toolkit';

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    selectedEvent: null,
    loading: false,
    error: null,
  },
  reducers: {
    fetchEventsStarted(state) {
      state.loading = true;
      state.error = null;
    },
    displayEvents(state, action) {
      state.events = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setSelectedEvent(state, action) {
      state.selectedEvent = action.payload;
      state.loading = false;
    },
    updateEventInList(state, action) {
      const updated = action.payload;
      if (!updated || !updated.id) return;
      state.events = state.events.map((evt) => (evt.id === updated.id ? { ...evt, ...updated } : evt));
      if (state.selectedEvent && state.selectedEvent.id === updated.id) {
        state.selectedEvent = { ...state.selectedEvent, ...updated };
      }
    },
    fetchEventsFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const eventsActions = eventsSlice.actions;

export default eventsSlice;

