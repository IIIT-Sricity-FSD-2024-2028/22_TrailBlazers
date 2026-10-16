import React, { useState, useEffect, useRef } from 'react';
import Navbar from './shared/components/Navbar';
import Footer from './shared/components/Footer';
import AuthModal from './auth/AuthModal';
import PaymentModal from './actors/attendee/components/PaymentModal';
import LandingPage from './shared/pages/LandingPage';
import Dashboard from './actors/client/pages/Dashboard';
import ExploreEvents from './actors/attendee/pages/ExploreEvents';
import EventDetails from './actors/attendee/pages/EventDetails';
import MyTickets from './actors/attendee/pages/MyTickets';
import CreateEvent from './actors/client/pages/CreateEvent';
import RevenueSpace from './actors/revenue/pages/RevenueSpace';
import EventManagerSpace from './actors/event-manager/pages/EventManagerSpace';
import OnsiteCoordinatorSpace from './actors/onsite-coordinator/pages/OnsiteCoordinatorSpace';
import AnalyticsSpace from './shared/pages/AnalyticsSpace';
import SuperAdminSpace from './actors/admin/pages/SuperAdminSpace';
import DepartmentManagerSpace from './actors/event-management/pages/DepartmentManagerSpace';
import ITSupportSpace from './actors/admin/pages/ITSupportSpace';
import ReportTechnicalIssueModal from './shared/components/ReportTechnicalIssueModal';
import PageTransition from './shared/components/PageTransition';
import NotificationToastContainer from './shared/components/NotificationToastContainer';
import { getDashboardForUser, isProtectedRoute, isStaffUser } from './shared/utils/roleRoutes';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ffsd_token') || null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [headerSearch, setHeaderSearch] = useState('');
  const isFetchingEventsRef = useRef(false);

  // Modal & Auth Notice Controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');
  const [authNotice, setAuthNotice] = useState('');
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [initialInviteCode, setInitialInviteCode] = useState('');
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
    if (token) {
      fetchCurrentUser(token);
    }
  }, []);

  // Enforce role-based route protection and automatic redirection
  useEffect(() => {
    if (user) {
      if (isStaffUser(user)) {
        // Staff and Admin users are never allowed on public landing or client space
        if (activeTab === 'landing' || activeTab === 'dashboard' || activeTab === 'my-space') {
          setActiveTab(getDashboardForUser(user));
        }
      } else {
        // Client / Attendee users skip the landing home page and land directly on explore events
        if (activeTab === 'landing') {
          setActiveTab('explore');
        }
      }
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (activeTab === 'explore' || activeTab === 'landing') {
      fetchEvents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedEvent) {
      const updated = events.find((e) => e.id === selectedEvent.id);
      if (updated && (updated.availableTickets !== selectedEvent.availableTickets || updated.updatedAt !== selectedEvent.updatedAt)) {
        setSelectedEvent(updated);
      }
    }
  }, [events]);

  const fetchEvents = async () => {
    if (isFetchingEventsRef.current) return;
    isFetchingEventsRef.current = true;
    setEventsLoading((prev) => (events.length === 0 ? true : prev));
    setEventsError(null);
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setEventsError(null);
      } else {
        setEventsError('Failed to load events. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setEventsError('Network error while loading events.');
    } finally {
      setEventsLoading(false);
      isFetchingEventsRef.current = false;
    }
  };

  const fetchCurrentUser = async (authToken) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (isStaffUser(data.user)) {
          if (activeTab === 'landing' || activeTab === 'dashboard' || activeTab === 'my-space') {
            setActiveTab(getDashboardForUser(data.user));
          }
        }
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error verifying user token:', err);
      handleLogout();
    }
  };

  const handleOpenAuth = (mode = 'login', noticeMsg = '', targetRedirect = null) => {
    setAuthInitialMode(mode);
    setAuthNotice(noticeMsg || '');
    if (targetRedirect) setPendingRedirect(targetRedirect);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('ffsd_token', authToken);

    if (isStaffUser(userData)) {
      setActiveTab(getDashboardForUser(userData));
    } else {
      if (pendingRedirect && (pendingRedirect === 'my-tickets' || pendingRedirect === 'explore')) {
        setActiveTab(pendingRedirect);
      } else {
        setActiveTab(getDashboardForUser(userData));
      }
    }
    setPendingRedirect(null);
    setAuthNotice('');
  };

  const handleVerifySuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('ffsd_token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ffsd_token');
    setActiveTab('landing');
    setPendingRedirect(null);
    setAuthNotice('');
  };

  const handleSelectEvent = (evt) => {
    setSelectedEvent(evt);
    setActiveTab('event-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAttendClick = (evt, options = {}) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    if (!user.emailVerified) {
      handleOpenAuth('verify');
      return;
    }
    setSelectedEvent(evt);
    setInitialInviteCode(options?.inviteCode || '');
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#DAF0FB] text-[#26334A] selection:bg-[#B5E1F7] selection:text-[#26334A]">
      
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onVerifyEmailPrompt={() => handleOpenAuth('verify')}
        searchQuery={headerSearch}
        onSearchChange={setHeaderSearch}
        onOpenTechModal={() => setIsTechModalOpen(true)}
      />

      {/* Main Content Router View */}
      <main className="flex-1 w-full overflow-hidden">
        <PageTransition pageKey={activeTab}>
          {activeTab === 'landing' && (
            <LandingPage
              events={events}
              eventsLoading={eventsLoading}
              eventsError={eventsError}
              onRetryEvents={fetchEvents}
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectEvent={handleSelectEvent}
              onOpenAuth={handleOpenAuth}
              user={user}
            />
          )}

          {activeTab !== 'landing' && (
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              {activeTab === 'super-admin-space' && (
                <SuperAdminSpace
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'department-manager-space' && (
                <DepartmentManagerSpace
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'it-support-space' && (
                <ITSupportSpace
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'onsite-coordinator-space' && (
                <OnsiteCoordinatorSpace
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'event-manager-space' && (
                <EventManagerSpace
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'revenue-space' && (
                <RevenueSpace
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'analytics-space' && (
                <AnalyticsSpace
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {(activeTab === 'dashboard' || activeTab === 'my-space') && (
                <Dashboard
                  user={user}
                  events={events}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectEvent={handleSelectEvent}
                  onVerifyEmailPrompt={() => handleOpenAuth('verify')}
                />
              )}

              {activeTab === 'explore' && (
                <ExploreEvents
                  events={events}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectEvent={handleSelectEvent}
                  onAttendClick={handleAttendClick}
                />
              )}

              {activeTab === 'event-details' && (
                <EventDetails
                  key={selectedEvent?.id}
                  event={selectedEvent}
                  user={user}
                  onBack={() => setActiveTab('explore')}
                  onAttend={handleAttendClick}
                  onAttendClick={handleAttendClick}
                  onOpenAuth={handleOpenAuth}
                  onVerifyEmailPrompt={() => handleOpenAuth('verify')}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'my-tickets' && (
                <MyTickets
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {activeTab === 'create-event' && (
                <CreateEvent
                  user={user}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenAuth={handleOpenAuth}
                  onVerifyEmailPrompt={() => handleOpenAuth('verify')}
                />
              )}
            </div>
          )}
        </PageTransition>
      </main>

      {/* Auth & Payment Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authInitialMode}
        noticeMessage={authNotice}
        onAuthSuccess={handleAuthSuccess}
        onVerifySuccess={handleVerifySuccess}
      />

      <PaymentModal
        key={selectedEvent?.id || 'no-event'}
        event={selectedEvent}
        isOpen={isPaymentModalOpen}
        initialInviteCode={initialInviteCode}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setInitialInviteCode('');
        }}
        user={user}
        onPaymentComplete={() => {
          fetchEvents(); // Refresh available tickets count
        }}
        onViewMyTickets={() => {
          setIsPaymentModalOpen(false);
          setInitialInviteCode('');
          setActiveTab('my-tickets');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onExploreMore={() => {
          setIsPaymentModalOpen(false);
          setInitialInviteCode('');
          setActiveTab('explore');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <ReportTechnicalIssueModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        onSubmitted={() => {
          alert('Technical issue logged! Routed to IT Support Team Queue.');
        }}
      />

      <NotificationToastContainer
        user={user}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Footer */}
      <Footer
        user={user}
        onOpenAuth={handleOpenAuth}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
}
