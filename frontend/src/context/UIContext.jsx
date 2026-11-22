import React, { createContext, useState } from 'react';

export const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [activeTab, setActiveTab] = useState('landing');
  const [headerSearch, setHeaderSearch] = useState('');
  
  // Shared Auth Modal State
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    mode: 'login',
    notice: '',
    redirect: null,
  });

  // Shared Technical Issue Modal State
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  // Shared Payment Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    event: null,
    inviteCode: '',
  });

  const navigate = (tab) => {
    if (!tab) return;
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openAuth = (mode = 'login', notice = '', redirect = null) => {
    setAuthModal({
      isOpen: true,
      mode,
      notice: notice || '',
      redirect: redirect || null,
    });
  };

  const closeAuth = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  const openTechModal = () => {
    setIsTechModalOpen(true);
  };

  const closeTechModal = () => {
    setIsTechModalOpen(false);
  };

  const openPaymentModal = (event, inviteCode = '') => {
    setPaymentModal({
      isOpen: true,
      event: event || null,
      inviteCode: inviteCode || '',
    });
  };

  const closePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      event: null,
      inviteCode: '',
    });
  };

  const value = {
    activeTab,
    setActiveTab,
    navigate,
    headerSearch,
    setHeaderSearch,
    authModal,
    openAuth,
    closeAuth,
    isTechModalOpen,
    openTechModal,
    closeTechModal,
    paymentModal,
    openPaymentModal,
    closePaymentModal,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export default UIContext;

