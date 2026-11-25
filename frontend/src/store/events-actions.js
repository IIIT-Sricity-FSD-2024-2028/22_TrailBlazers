import { eventsActions } from './events-slice';
export { eventsActions };

export const fetchEventsData = (filters = {}) => {
  return async (dispatch) => {
    dispatch(eventsActions.fetchEventsStarted());
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.priceFilter && filters.priceFilter !== 'all') params.append('priceFilter', filters.priceFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/events${qs}`);
      if (!res.ok) {
        throw new Error('Failed to load events.');
      }
      const data = await res.json();
      dispatch(eventsActions.displayEvents(data.events || []));
      return data.events || [];
    } catch (err) {
      console.error('Error fetching events:', err);
      dispatch(eventsActions.fetchEventsFailed(err.message || 'Network error while loading events.'));
      return [];
    }
  };
};

export const fetchEventById = (eventId) => {
  return async (dispatch) => {
    if (!eventId) return null;
    dispatch(eventsActions.fetchEventsStarted());
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        throw new Error('Event not found.');
      }
      const data = await res.json();
      dispatch(eventsActions.setSelectedEvent(data.event));
      return data.event;
    } catch (err) {
      console.error('Error fetching event by id:', err);
      dispatch(eventsActions.fetchEventsFailed(err.message || 'Error loading event details.'));
      return null;
    }
  };
};
