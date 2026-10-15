import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Home, 
  Compass, 
  Ticket, 
  PlusCircle, 
  LogOut, 
  AlertTriangle, 
  ChevronDown, 
  Bell, 
  Search, 
  Menu, 
  X,
  Radio,
  DollarSign,
  CheckSquare,
  QrCode,
  Mic,
  BarChart3
} from 'lucide-react';
import WaveventsLogo from './WaveventsLogo';
import NotificationPanel from './NotificationPanel';
import { getDashboardForUser } from '../utils/roleRoutes';

export default function Navbar({ 
  user, 
  activeTab, 
  setActiveTab, 
  onOpenAuth, 
  onLogout, 
  onVerifyEmailPrompt,
  searchQuery = '',
  onSearchChange = () => {},
  onOpenTechModal = () => {}
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotif, setToastNotif] = useState(null);
  const [toastSeenIds, setToastSeenIds] = useState(new Set());
  const notifRef = useRef(null);

  const firstName = user?.name ? user.name.split(' ')[0] : '';

  useEffect(() => {
    if (user) {
      fetchNotificationsData();
      const interval = setInterval(fetchNotificationsData, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  const fetchNotificationsData = async () => {
    try {
      const token = localStorage.getItem('ffsd_token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const notifs = data.notifications || [];
        setUnreadCount(data.unreadCount || 0);

        // Check for newly arrived unread notification to trigger temporary Toast
        const newUnread = notifs.find(n => n.isRead === 0 && !toastSeenIds.has(n.id));
        if (newUnread) {
          setToastNotif(newUnread);
          setToastSeenIds(prev => new Set(prev).add(newUnread.id));

          // Auto-dismiss toast after 4.5 seconds without deleting notification
          setTimeout(() => {
            setToastNotif(null);
          }, 4500);
        }
      }
    } catch (err) {
      console.error('Error fetching notification updates:', err);
    }
  };

  const getUserSpaceTab = () => {
    return getDashboardForUser(user);
  };

  const isUserSpaceActive = activeTab === 'dashboard' || activeTab === 'my-space' || activeTab === 'super-admin-space' || activeTab === 'department-manager-space' || activeTab === 'it-support-space' || activeTab === 'revenue-space' || activeTab === 'event-manager-space' || activeTab === 'onsite-coordinator-space';

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setShowNotifications(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className={`${activeTab === 'landing' ? 'absolute top-4 sm:top-5 left-0 right-0' : 'sticky top-3'} z-50 w-full max-w-7xl mx-auto px-3 sm:px-6 transition-all duration-300`}>
      
      {/* Unverified Email Alert Banner */}
      {user && !user.emailVerified && (
        <div className="mb-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 rounded-2xl shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-100 animate-pulse shrink-0" />
          <span>Your email <strong>({user.email})</strong> is unverified. Verify to unlock instant tickets.</span>
          <button
            onClick={onVerifyEmailPrompt}
            className="ml-1 bg-white text-amber-900 hover:bg-amber-50 px-2.5 py-0.5 rounded-full font-bold text-xs transition shadow-2xs"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Floating Translucent Glass Navbar Container */}
      <div className="relative w-full rounded-full bg-white/85 backdrop-blur-[18px] border border-white/80 shadow-md shadow-slate-900/5 px-3.5 sm:px-5 py-2 flex items-center justify-between transition-all duration-300 text-[#0F172A] overflow-visible">
        
        {/* Left Section: Wavevents Brand Logo */}
        <div 
          onClick={() => handleNavClick(user ? (user.role === 'REVENUE' || user.role === 'EVENT_MANAGER' || user.role === 'ONSITE_COORDINATOR' || user.role === 'SUPER_ADMIN' ? getUserSpaceTab() : 'explore') : 'landing')}
          className="cursor-pointer group flex items-center gap-2.5 shrink-0"
        >
          <WaveventsLogo size="md" />
        </div>

        {/* Center Section: Navigation Links with Icons & Active Pastel Pill */}
        <nav className="hidden md:flex items-center gap-1 bg-white/60 p-1 rounded-full border border-white/90 backdrop-blur-md shadow-2xs">
          
          {!user && (
            <button
              onClick={() => handleNavClick('landing')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                activeTab === 'landing'
                  ? 'bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] text-[#0F172A] font-extrabold shadow-2xs border border-white/90'
                  : 'text-[#475569] font-bold hover:text-[#0F172A] hover:bg-white/70 hover:-translate-y-0.5'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}

          {/* Regular Attendee / Client Links */}
          {(!user || user.role === 'ATTENDEE' || user.role === 'CLIENT') && (
            <>
              <button
                onClick={() => handleNavClick('explore')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                  activeTab === 'explore' || activeTab === 'event-details'
                    ? 'bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] text-[#0F172A] font-extrabold shadow-2xs border border-white/90'
                    : 'text-[#475569] font-bold hover:text-[#0F172A] hover:bg-white/70 hover:-translate-y-0.5'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Events</span>
              </button>

              {user && (
                <>
                  <button
                    onClick={() => handleNavClick(getUserSpaceTab())}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                      isUserSpaceActive
                        ? 'bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] text-[#0F172A] font-extrabold shadow-2xs border border-white/90'
                        : 'text-[#475569] font-bold hover:text-[#0F172A] hover:bg-white/70 hover:-translate-y-0.5'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Your Space</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('my-tickets')}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                      activeTab === 'my-tickets'
                        ? 'bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] text-[#0F172A] font-extrabold shadow-2xs border border-white/90'
                        : 'text-[#475569] font-bold hover:text-[#0F172A] hover:bg-white/70 hover:-translate-y-0.5'
                    }`}
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>My Tickets</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('create-event')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold text-[#0F172A] bg-gradient-to-r from-[#FBE9F9] via-[#E9E1FA] to-[#DAF0FB] hover:scale-105 shadow-2xs border border-white transition-all duration-200"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-purple-700" />
                    <span>Create Event</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* Hierarchy & Operational Role Space Pills */}
          {user && user.role !== 'ATTENDEE' && (
            <>
              {user.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => handleNavClick('super-admin-space')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    activeTab === 'super-admin-space'
                      ? 'bg-indigo-600 text-white font-extrabold shadow-2xs'
                      : 'text-indigo-700 font-extrabold hover:bg-indigo-50 hover:-translate-y-0.5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Super Admin Space</span>
                </button>
              )}

              {user.role === 'DEPARTMENT_MANAGER' && (
                <button
                  onClick={() => handleNavClick('department-manager-space')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    activeTab === 'department-manager-space'
                      ? 'bg-teal-600 text-white font-extrabold shadow-2xs'
                      : 'text-teal-700 font-extrabold hover:bg-teal-50 hover:-translate-y-0.5'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Manager Space</span>
                </button>
              )}

              {user.role === 'IT_SUPPORT' && (
                <button
                  onClick={() => handleNavClick('it-support-space')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    activeTab === 'it-support-space'
                      ? 'bg-sky-600 text-white font-extrabold shadow-2xs'
                      : 'text-sky-700 font-extrabold hover:bg-sky-50 hover:-translate-y-0.5'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>IT Support Desk</span>
                </button>
              )}

              {user.role === 'REVENUE' && (
                <button
                  onClick={() => handleNavClick('revenue-space')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    activeTab === 'revenue-space'
                      ? 'bg-gradient-to-r from-[#FBE9F9] via-[#E9E1FA] to-[#DAF0FB] text-[#0F172A] font-extrabold shadow-2xs border border-white/90'
                      : 'text-purple-700 font-extrabold hover:bg-purple-50 hover:-translate-y-0.5'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-purple-700" />
                  <span>Revenue Space</span>
                </button>
              )}

              {user.role === 'EVENT_MANAGER' && (
                <button
                  onClick={() => handleNavClick('event-manager-space')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    activeTab === 'event-manager-space'
                      ? 'bg-purple-100/80 text-purple-900 font-extrabold shadow-2xs border border-purple-200/90'
                      : 'text-indigo-700 font-extrabold hover:bg-indigo-50 hover:-translate-y-0.5'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-purple-700" />
                  <span>Event Space</span>
                </button>
              )}

              {user.role === 'ONSITE_COORDINATOR' && (
                <button
                  onClick={() => handleNavClick('onsite-coordinator-space')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    activeTab === 'onsite-coordinator-space'
                      ? 'bg-gradient-to-r from-[#DAF0FB] via-[#E8F9F5] to-[#FBE9F9] text-[#0F172A] font-extrabold shadow-2xs border border-white/90'
                      : 'text-teal-700 font-extrabold hover:bg-teal-50 hover:-translate-y-0.5'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-700" />
                  <span>Onsite Space</span>
                </button>
              )}

              {/* Analytics / Measure space link for authorized roles */}
              {(user.role === 'EVENT_MANAGER' || user.role === 'SUPER_ADMIN' || user.role === 'ATTENDEE') && (
                <button
                  onClick={() => handleNavClick('analytics-space')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 ${
                    activeTab === 'analytics-space'
                      ? 'bg-purple-700 text-white font-extrabold shadow-2xs border border-purple-800'
                      : 'text-purple-800 font-extrabold hover:bg-purple-50 hover:-translate-y-0.5'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Analytics</span>
                </button>
              )}
            </>
          )}

        </nav>

        {/* Right Section: Search Pill, Live Indicator & User/Auth Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          
          {/* Compact Discover / Search Pill */}
          <div className="relative hidden xl:flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (activeTab !== 'explore' && e.target.value.trim().length > 0) {
                  setActiveTab('explore');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNavClick('explore');
              }}
              placeholder="Search events, clients..."
              className="w-36 2xl:w-48 pl-7 pr-2.5 py-1 rounded-full bg-white/70 border border-white text-xs font-semibold text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#DAF0FB] focus:border-[#B5E1F7] focus:bg-white transition-all duration-200 shadow-inner"
            />
          </div>

          {/* Tasteful Live Event Indicator */}
          <div className="hidden 2xl:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-100 text-[10px] font-bold text-emerald-800 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>12 Live</span>
          </div>

          {/* User Auth or Profile Section */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
              {/* Report Technical Issue Quick Button */}
              <button
                onClick={onOpenTechModal}
                title="Report Technical / System Issue"
                className="px-2.5 py-1 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                <span className="hidden lg:inline">Report Tech Issue</span>
              </button>

              {/* Interactive Notification Bell */}
              <div ref={notifRef} className="relative shrink-0">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                  className="relative p-1.5 rounded-full bg-white/80 hover:bg-white border border-white shadow-2xs text-[#0F172A] hidden sm:flex items-center justify-center cursor-pointer transition"
                >
                  <Bell className="w-3.5 h-3.5 text-[#64748B]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white font-extrabold text-[8px] flex items-center justify-center shadow-xs animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Popover */}
                {showNotifications && (
                  <NotificationPanel
                    user={user}
                    onNavigate={(tab) => handleNavClick(tab)}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>

              {/* Profile Pill ("Welcome back, Vipul!") */}
              <div 
                onClick={() => {
                  handleNavClick(getDashboardForUser(user));
                }}
                title={user?.name ? `Signed in as ${user.name} (${user.role})` : ''}
                className="flex items-center gap-1.5 bg-white/90 border border-white px-2.5 sm:px-3 py-1 rounded-full cursor-pointer hover:bg-white transition shadow-2xs backdrop-blur-md text-[#0F172A] min-w-0 max-w-[130px] sm:max-w-[160px] md:max-w-[180px] shrink"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-teal-500 flex items-center justify-center font-extrabold text-[10px] text-white border border-white shadow-2xs shrink-0">
                  {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left truncate min-w-0">
                  <span className="text-[11px] font-extrabold text-[#0F172A] truncate leading-tight">
                    {firstName || 'User'}
                  </span>
                  {user?.role && user.role !== 'ATTENDEE' && (
                    <span className="text-[8px] font-extrabold uppercase tracking-wider text-purple-700 leading-tight truncate">
                      {user.role.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 text-[#64748B] shrink-0" />
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-bold text-[#0F172A] hover:bg-white/70 rounded-full transition-all duration-200"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 text-xs font-extrabold text-[#0F172A] bg-gradient-to-r from-[#DAF0FB] via-[#FBE9F9] to-[#E8F9F5] hover:scale-[1.03] hover:shadow-glow-pink transition-all duration-200 rounded-full shadow-2xs border border-white"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#0F172A] bg-white/80 border border-white shadow-2xs hover:bg-white transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-white shadow-xl space-y-3 animate-fadeIn">
          
          {/* Mobile Search Bar */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNavClick('explore');
              }}
              placeholder="Search events..."
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#DAF0FB]"
            />
          </div>

          {/* Mobile Navigation Links */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            {!user && (
              <button
                onClick={() => handleNavClick('landing')}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold ${
                  activeTab === 'landing' ? 'bg-[#DAF0FB] text-[#0F172A]' : 'text-[#475569] hover:bg-slate-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
            )}

            <button
              onClick={() => handleNavClick('explore')}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold ${
                activeTab === 'explore' || activeTab === 'event-details' ? 'bg-[#DAF0FB] text-[#0F172A]' : 'text-[#475569] hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore Events</span>
            </button>

            {user && (
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold ${
                    activeTab === 'dashboard' ? 'bg-[#DAF0FB] text-[#0F172A]' : 'text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Your Space</span>
                </button>

                <button
                  onClick={() => handleNavClick('my-tickets')}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold ${
                    activeTab === 'my-tickets' ? 'bg-[#DAF0FB] text-[#0F172A]' : 'text-[#475569] hover:bg-slate-50'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>My Tickets</span>
                </button>

                <button
                  onClick={() => handleNavClick('create-event')}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold text-[#0F172A] bg-gradient-to-r from-[#FBE9F9] via-[#E9E1FA] to-[#DAF0FB]"
                >
                  <PlusCircle className="w-4 h-4 text-purple-700" />
                  <span>Create Event</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Live Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-50 text-xs font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>12 Events Currently Live</span>
          </div>

        </div>
      )}

      {/* Temporary Notification Toast Popup Banner */}
      {toastNotif && (
        <div className="fixed top-20 right-4 sm:right-6 max-w-sm w-full bg-slate-900/95 text-white backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-purple-500/40 z-50 animate-in slide-in-from-top-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-purple-300 font-extrabold text-[10px] uppercase tracking-wider">
                  <span>🔔 New Notification</span>
                </div>
                {toastNotif.senderRole === 'Revenue Team' && (!user?.role || user?.role === 'ATTENDEE' || user?.role === 'CLIENT') ? (
                  <div className="font-extrabold text-white text-xs">Revenue Team</div>
                ) : toastNotif.senderName ? (
                  <div className="font-extrabold text-white text-xs">
                    {toastNotif.senderName} {toastNotif.senderRole ? `(${toastNotif.senderRole})` : ''}
                  </div>
                ) : null}
                <div className="font-bold text-slate-200">{toastNotif.title}</div>
                <p className="text-[11px] text-slate-300 font-medium line-clamp-2 leading-relaxed">{toastNotif.message}</p>
                {toastNotif.eventName && (
                  <span className="inline-block mt-1 text-[9px] font-bold text-purple-200 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800">
                    {toastNotif.eventName}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setToastNotif(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
