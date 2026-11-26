import React, { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Filter, Calendar, Tag, MapPin, Sparkles, RefreshCw, Clock } from 'lucide-react';
import EventCard from '../../../shared/components/EventCard';
import { fetchEventsData } from '../../../store/events-actions';
import { UIContext } from '../../../context/UIContext';

export default function ExploreEvents({ events: propsEvents, onSelectEvent, initialSearchTerm = '' }) {
  const dispatch = useDispatch();
  const ui = useContext(UIContext);
  const reduxEvents = useSelector((state) => state.events.events);
  const events = propsEvents && propsEvents.length > 0 ? propsEvents : reduxEvents;

  useEffect(() => {
    if (!events || events.length === 0) {
      dispatch(fetchEventsData());
    }
  }, [dispatch, events]);

  const activeInitialSearch = ui?.headerSearch || initialSearchTerm || '';
  const [searchTerm, setSearchTerm] = useState(activeInitialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTimeline, setSelectedTimeline] = useState('ALL'); // 'ALL' | 'TODAY' | 'UPCOMING'
  const [selectedPrice, setSelectedPrice] = useState('All'); // 'All' | 'Free' | 'Paid'
  const [selectedType, setSelectedType] = useState('All'); // 'All' | 'OPEN' | 'CLOSED'

  const categories = ['All', 'Tech Conference', 'Workshop', 'Academic', 'Business', 'Cultural'];

  // Current simulated application date: YYYY-MM-DD (calculated inline)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Helper to inspect event date status
  const getEventDateInfo = (evt) => {
    const start = evt.startDate || evt.eventDate || evt.date || '';
    const end = evt.endDate || start || '';
    const isPast = Boolean(end && end < todayStr);
    const isToday = Boolean(start && end && start <= todayStr && end >= todayStr);
    const isUpcoming = Boolean(start && start > todayStr);
    return { start, end, isPast, isToday, isUpcoming };
  };

  // Filter out any past events or cancelled/completed events from the catalogue inline
  let todayCount = 0;
  let upcomingCount = 0;
  const nonPastEvents = (events || []).filter((evt) => {
    if (evt.status === 'CANCELLED' || evt.status === 'COMPLETED') return false;
    
    const { isPast, isToday, isUpcoming } = getEventDateInfo(evt);
    if (isPast) return false;

    if (isToday) todayCount++;
    if (isUpcoming) upcomingCount++;
    return true;
  });

  const effectiveSearch = (searchTerm || ui?.headerSearch || '').toLowerCase().trim();

  // Filter events based on active UI criteria calculated directly during rendering
  const filteredEvents = nonPastEvents.filter((evt) => {
    const { isToday, isUpcoming } = getEventDateInfo(evt);

    // Timeline filter: ALL (Today & Upcoming) vs TODAY only vs UPCOMING only
    if (selectedTimeline === 'TODAY' && !isToday) return false;
    if (selectedTimeline === 'UPCOMING' && !isUpcoming) return false;

    // Search term
    const matchesSearch = !effectiveSearch || 
      (evt.name && evt.name.toLowerCase().includes(effectiveSearch)) ||
      (evt.description && evt.description.toLowerCase().includes(effectiveSearch)) ||
      (evt.location && evt.location.toLowerCase().includes(effectiveSearch)) ||
      (evt.organizationName && evt.organizationName.toLowerCase().includes(effectiveSearch));

    // Category filter
    const matchesCategory = selectedCategory === 'All' || evt.category === selectedCategory;

    // Price filter
    const isFree = Number(evt.ticketPrice) === 0;
    const matchesPrice = selectedPrice === 'All' || 
      (selectedPrice === 'Free' && isFree) || 
      (selectedPrice === 'Paid' && !isFree);

    // Type filter (OPEN vs CLOSED)
    const matchesType = selectedType === 'All' || evt.type === selectedType;

    return matchesSearch && matchesCategory && matchesPrice && matchesType;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPrice('All');
    setSelectedType('All');
    setSelectedTimeline('ALL');
  };

  return (
    <div className="space-y-8 pb-16 text-[#26334A]">
      
      {/* Header Banner */}
      <div className="space-y-2 text-center max-w-3xl mx-auto pt-4">
        <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Active Event Catalogue</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#26334A] tracking-tight">Explore Live & Upcoming Events</h1>
        <p className="text-sm text-[#64748B] font-medium">
          Discover conferences happening today, upcoming summits, technical workshops, and executive roundtables.
        </p>
      </div>

      {/* Control Panel: Search + Timeline + Filters */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-white/90 via-[#FBE9F9]/40 to-white/90 backdrop-blur-md border border-white shadow-sm space-y-4">
        
        {/* Top Controls Row: Search Bar & Timeline Selector */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search active events by title, keyword, city, or organizer..."
              className="w-full pl-12 pr-4 py-3 glass-input-light rounded-2xl text-sm font-medium focus:border-indigo-400 shadow-inner"
            />
          </div>

          {/* Timeline Segmented Filter */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setSelectedTimeline('ALL')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTimeline === 'ALL'
                  ? 'bg-[#26334A] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#26334A] hover:bg-white/60'
              }`}
            >
              <span>All Available</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedTimeline === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {nonPastEvents.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTimeline('TODAY')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTimeline === 'TODAY'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#26334A] hover:bg-white/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>Happening Today</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedTimeline === 'TODAY' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}>
                {todayCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTimeline('UPCOMING')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTimeline === 'UPCOMING'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#26334A] hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming Dates</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                selectedTimeline === 'UPCOMING' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {upcomingCount}
              </span>
            </button>
          </div>

        </div>

        {/* Filters Row: Category, Price, Access, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200/50">
          
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#64748B]">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3.5 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs font-bold text-[#26334A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price Pill Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setSelectedPrice('All')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  selectedPrice === 'All' ? 'bg-white text-[#26334A] shadow-xs' : 'text-[#64748B] hover:text-[#26334A]'
                }`}
              >
                All Prices
              </button>
              <button
                onClick={() => setSelectedPrice('Free')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  selectedPrice === 'Free' ? 'bg-emerald-500 text-white shadow-xs' : 'text-[#64748B] hover:text-[#26334A]'
                }`}
              >
                Free Only
              </button>
              <button
                onClick={() => setSelectedPrice('Paid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  selectedPrice === 'Paid' ? 'bg-[#26334A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#26334A]'
                }`}
              >
                Paid Events
              </button>
            </div>

            {/* Event Type Filter (Open vs Closed) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#64748B]">Access:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3.5 py-2 bg-white/90 border border-slate-200 rounded-xl text-xs font-bold text-[#26334A] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs"
              >
                <option value="All">All Events</option>
                <option value="OPEN">Public Open</option>
                <option value="CLOSED">Invite Only (Closed)</option>
              </select>
            </div>

          </div>

          {/* Reset Filters CTA */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#26334A] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

        </div>

      </div>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#64748B]">
            Showing <strong className="text-[#26334A]">{filteredEvents.length}</strong> {selectedTimeline === 'TODAY' ? 'event(s) taking place today' : selectedTimeline === 'UPCOMING' ? 'upcoming event(s)' : 'active event(s)'}
          </span>
          {selectedTimeline === 'TODAY' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
              Live Today ({todayStr})
            </span>
          )}
        </div>
        <span className="text-xs text-[#94A3B8]">
          (Past expired events are excluded)
        </span>
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {filteredEvents.map((evt) => (
            <EventCard key={evt.id} event={evt} onSelect={onSelectEvent} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl glass-light border border-white space-y-4">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-[#26334A]">
            {selectedTimeline === 'TODAY' ? 'No events scheduled for today' : 'No matching events found'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {selectedTimeline === 'TODAY'
              ? 'There are currently no events taking place today. Browse upcoming events to reserve your tickets in advance!'
              : 'Try adjusting your search keywords, price filters, category, or timeline view to discover events.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {selectedTimeline === 'TODAY' && (
              <button
                onClick={() => setSelectedTimeline('UPCOMING')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                Browse Upcoming Events ({upcomingCount})
              </button>
            )}
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-xl bg-[#26334A] text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
