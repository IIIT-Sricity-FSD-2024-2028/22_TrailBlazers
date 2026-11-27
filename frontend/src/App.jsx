import React, { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import { getDashboardForUser, isStaffUser } from './shared/utils/roleRoutes';
import { fetchCurrentUser, logoutUser } from './store/auth-actions';
import { authActions } from './store/auth-slice';
import { fetchEventsData } from './store/events-actions';
import { eventsActions } from './store/events-slice';
import { UIContext } from './context/UIContext';

export default function App() {
  const dispatch = useDispatch();
  const ui = useContext(UIContext);

  // Redux state
  const { user, token } = useSelector((state) => state.auth);
  const { events, loading: eventsLoading, error: eventsError, selectedEvent } = useSelector((state) => state.events);

  // UI state from UIContext
  const activeTab = ui?.activeTab || 'landing';
  const setActiveTab = ui?.setActiveTab;
  const navigate = ui?.navigate || ((tab) => {
    if (setActiveTab) setActiveTab(tab);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  useEffect(() => {
    dispatch(fetchEventsData());
    if (token) {
      dispatch(fetchCurrentUser(token));
    }
  }, [dispatch, token]);

  // Enforce role-based route protection and automatic redirection
  useEffect(() => {
    if (user) {
      if (isStaffUser(user)) {
        // Staff and Admin users are never allowed on public landing or client space
        if (activeTab === 'landing' || activeTab === 'dashboard' || activeTab === 'my-space') {
          navigate(getDashboardForUser(user));
        }
      } else {
        // Client / Attendee users skip the landing home page and land directly on explore events
        if (activeTab === 'landing') {
          navigate('explore');
        }
      }
    }
  }, [user, activeTab, navigate]);

  useEffect(() => {
    if (activeTab === 'explore' || activeTab === 'landing') {
      dispatch(fetchEventsData());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (selectedEvent) {
      const updated = events.find((e) => e.id === selectedEvent.id);
      if (updated && (updated.availableTickets !== selectedEvent.availableTickets || updated.updatedAt !== selectedEvent.updatedAt)) {
        dispatch(eventsActions.setSelectedEvent(updated));
      }
    }
  }, [events, selectedEvent, dispatch]);

  const handleOpenAuth = (mode = 'login', noticeMsg = '', targetRedirect = null) => {
    if (ui?.openAuth) {
      ui.openAuth(mode, noticeMsg, targetRedirect);
    }
  };

  const handleAuthSuccess = (userData, authToken) => {
    dispatch(authActions.loginSuccess({ user: userData, token: authToken }));

    const redirect = ui?.authModal?.redirect;
    if (isStaffUser(userData)) {
      navigate(getDashboardForUser(userData));
    } else {
      if (redirect && (redirect === 'my-tickets' || redirect === 'explore')) {
        navigate(redirect);
      } else {
        navigate(getDashboardForUser(userData));
      }
    }
    if (ui?.closeAuth) ui.closeAuth();
  };

  const handleVerifySuccess = (userData, authToken) => {
    dispatch(authActions.loginSuccess({ user: userData, token: authToken }));
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('landing');
    if (ui?.closeAuth) ui.closeAuth();
  };

  const handleSelectEvent = (evt) => {
    dispatch(eventsActions.setSelectedEvent(evt));
    navigate('event-details');
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
    dispatch(eventsActions.setSelectedEvent(evt));
    if (ui?.openPaymentModal) {
      ui.openPaymentModal(evt, options?.inviteCode || '');
    }
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
              onRetryEvents={() => dispatch(fetchEventsData())}
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
                  onUserRefresh={() => dispatch(fetchCurrentUser(token))}
                />
              )}
            </div>
          )}
        </PageTransition>
      </main>

      {/* Auth & Payment Modals */}
      <AuthModal
        isOpen={Boolean(ui?.authModal?.isOpen)}
        onClose={() => ui?.closeAuth && ui.closeAuth()}
        initialMode={ui?.authModal?.mode || 'login'}
        noticeMessage={ui?.authModal?.notice || ''}
        onAuthSuccess={handleAuthSuccess}
        onVerifySuccess={handleVerifySuccess}
      />

      <PaymentModal
        key={selectedEvent?.id || 'no-event'}
        event={selectedEvent}
        isOpen={Boolean(ui?.paymentModal?.isOpen)}
        initialInviteCode={ui?.paymentModal?.inviteCode || ''}
        onClose={() => ui?.closePaymentModal && ui.closePaymentModal()}
        user={user}
        onPaymentComplete={() => {
          dispatch(fetchEventsData()); // Refresh available tickets count
        }}
        onViewMyTickets={() => {
          if (ui?.closePaymentModal) ui.closePaymentModal();
          navigate('my-tickets');
        }}
        onExploreMore={() => {
          if (ui?.closePaymentModal) ui.closePaymentModal();
          navigate('explore');
        }}
      />

      <ReportTechnicalIssueModal
        isOpen={Boolean(ui?.isTechModalOpen)}
        onClose={() => ui?.closeTechModal && ui.closeTechModal()}
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
