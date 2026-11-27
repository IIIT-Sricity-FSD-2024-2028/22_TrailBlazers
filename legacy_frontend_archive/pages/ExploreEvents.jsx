import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, Tag, MapPin, Sparkles, RefreshCw } from 'lucide-react';
import EventCard from '../components/EventCard';

export default function ExploreEvents({ events = [], onSelectEvent, initialSearchTerm = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    if (initialSearchTerm !== undefined) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);
  const [selectedPrice, setSelectedPrice] = useState('All'); // 'All' | 'Free' | 'Paid'
  const [selectedType, setSelectedType] = useState('All'); // 'All' | 'OPEN' | 'CLOSED'

  const categories = ['All', 'Tech Conference', 'Workshop', 'Academic', 'Business', 'Cultural'];

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Search term
      const matchesSearch = !searchTerm || 
        evt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.organizationName.toLowerCase().includes(searchTerm.toLowerCase());

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
  }, [events, searchTerm, selectedCategory, selectedPrice, selectedType]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPrice('All');
    setSelectedType('All');
  };

  return (
    <div className="space-y-8 pb-16 text-[#26334A]">
      
      {/* Header Banner */}
      <div className="space-y-2 text-center max-w-3xl mx-auto pt-4">
        <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">Event Catalogue</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#26334A] tracking-tight">Explore Upcoming Events</h1>
        <p className="text-sm text-[#64748B] font-medium">
          Discover conferences, academic summits, technical workshops, and exclusive executive roundtables.
        </p>
      </div>

      {/* Control Panel: Search + Filters */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-white/90 via-[#FBE9F9]/40 to-white/90 backdrop-blur-md border border-white shadow-sm space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events by title, keyword, city, or organizer..."
            className="w-full pl-12 pr-4 py-3 glass-input-light rounded-2xl text-sm font-medium focus:border-indigo-400 shadow-inner"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          
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
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold text-[#64748B]">
          Showing <strong className="text-[#26334A]">{filteredEvents.length}</strong> event(s)
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
          <h3 className="text-lg font-bold text-[#26334A]">No matching events found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Try adjusting your search keywords, price filters, or category dropdown to discover more events.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-[#26334A] text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Clear All Filters
          </button>
        </div>
      )}

    </div>
  );
}
