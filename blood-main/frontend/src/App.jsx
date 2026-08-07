import React, { useState } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Homepage Component
import HomePage from './components/home/HomePage';

// Donor Module Pages
import DonorDashboard from './components/donor/DonorDashboard';
import DonorProfile from './components/donor/DonorProfile';
import DonationHistory from './components/donor/DonationHistory';
import EmergencyRequestsView from './components/donor/EmergencyRequestsView';
import LiveTrackingView from './components/donor/LiveTrackingView';
import DonorRewards from './components/donor/DonorRewards';
import NotificationsView from './components/donor/NotificationsView';
import DonorLoginModal from './components/donor/DonorLoginModal';

// Requester / Patient Module Pages (No login required)
import EmergencyBloodRequest from './components/requester/EmergencyBloodRequest';
import RequestStatusTracker from './components/requester/RequestStatusTracker';
import LiveDonorTracker from './components/requester/LiveDonorTracker';
import EmergencyHistory from './components/requester/EmergencyHistory';
import PatientFeedback from './components/requester/PatientFeedback';

// Hospital Module Pages
import HospitalDashboard from './components/hospital/HospitalDashboard';
import BloodInventoryView from './components/hospital/BloodInventoryView';
import HospitalEmergencyView from './components/hospital/HospitalEmergencyView';
import DonorVerificationView from './components/hospital/DonorVerificationView';
import BloodCampView from './components/hospital/BloodCampView';
import HospitalReports from './components/hospital/HospitalReports';

// Admin Module Pages
import AdminDashboard from './components/admin/AdminDashboard';
import ManageUsersView from './components/admin/ManageUsersView';
import ManageDonorsView from './components/admin/ManageDonorsView';
import ManageHospitalsView from './components/admin/ManageHospitalsView';
import ManageRequestsView from './components/admin/ManageRequestsView';
import InventoryMonitorView from './components/admin/InventoryMonitorView';
import AdminAnalyticsView from './components/admin/AdminAnalyticsView';
import NotificationCentreView from './components/admin/NotificationCentreView';

// AI Module Pages
import AIEngineHub from './components/ai/AIEngineHub';
import Chatbot from './components/common/Chatbot';
import VoiceEmergencyAssistant from './components/common/VoiceEmergencyAssistant';

function App() {
  const [currentRole, setCurrentRole] = useState('home'); // Default view: Clean Homepage!
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTargetRole, setAuthTargetRole] = useState('donor');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Protected Module Access Control
  const handleSelectModule = (roleId) => {
    const protectedRoles = ['donor', 'hospital', 'admin'];

    // If attempting to access a protected module without being logged in
    if (protectedRoles.includes(roleId) && !isLoggedIn) {
      setAuthTargetRole(roleId);
      setIsAuthOpen(true);
      return;
    }

    setCurrentRole(roleId);
    if (roleId === 'donor') setActiveTab('dashboard');
    else if (roleId === 'requester') setActiveTab('emergency-form');
    else if (roleId === 'hospital') setActiveTab('dashboard');
    else if (roleId === 'admin') setActiveTab('dashboard');
    else if (roleId === 'ai') setActiveTab('ai-engine');
    else setActiveTab('home');
  };

  const handleOpenAuthWithRole = (targetRole = 'donor') => {
    setAuthTargetRole(targetRole);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (userData, token) => {
    if (token) localStorage.setItem('lifeflow_token', token);
    setIsLoggedIn(true);
    setUser(userData);
    setIsAuthOpen(false);

    // Navigate to authorized module
    const targetRole = userData.role || authTargetRole || 'donor';
    setCurrentRole(targetRole);
    if (targetRole === 'donor') setActiveTab('dashboard');
    else if (targetRole === 'hospital') setActiveTab('dashboard');
    else if (targetRole === 'admin') setActiveTab('dashboard');
    else setActiveTab('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('lifeflow_token');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentRole('home');
    setActiveTab('home');
  };

  const renderModuleContent = () => {
    // DEFAULT: CLEAN HOMEPAGE
    if (currentRole === 'home') {
      return (
        <HomePage
          onSelectModule={handleSelectModule}
          onOpenAuth={() => handleOpenAuthWithRole('donor')}
        />
      );
    }

    // 1. DONOR MODULE PAGES (Requires Login)
    if (currentRole === 'donor') {
      switch (activeTab) {
        case 'my-profile': return <DonorProfile user={user} />;
        case 'donation-history': return <DonationHistory user={user} />;
        case 'emergency-requests': return <EmergencyRequestsView user={user} onAcceptRequest={(reqId) => { setSelectedRequestId(reqId); setActiveTab('live-tracking'); }} />;
        case 'live-tracking': return <LiveTrackingView requestId={selectedRequestId} user={user} />;
        case 'rewards': return <DonorRewards user={user} />;
        case 'notifications': return <NotificationsView user={user} />;
        default: return <DonorDashboard user={user} onNavigate={(tab) => setActiveTab(tab)} onAcceptRequest={(reqId) => { setSelectedRequestId(reqId); setActiveTab('live-tracking'); }} />;
      }
    }

    // 2. REQUESTER / PATIENT MODULE PAGES (No Login Required!)
    if (currentRole === 'requester') {
      switch (activeTab) {
        case 'request-status': return <RequestStatusTracker requestId={selectedRequestId} onNavigateTracker={() => setActiveTab('live-tracker')} />;
        case 'live-tracker': return <LiveDonorTracker requestId={selectedRequestId} onNavigateFeedback={() => setActiveTab('feedback')} />;
        case 'emergency-history': return <EmergencyHistory onLeaveFeedback={() => setActiveTab('feedback')} />;
        case 'feedback': return <PatientFeedback requestId={selectedRequestId} onSubmitted={() => setActiveTab('emergency-history')} />;
        default: return <EmergencyBloodRequest onRequestSubmitted={(data) => { localStorage.setItem(`lifeflow_request_${data?.request_id}`, data?.requester_access_token || ''); setSelectedRequestId(data?.request_id); setActiveTab('request-status'); }} />;
      }
    }

    // 3. HOSPITAL MODULE PAGES (Requires Login)
    if (currentRole === 'hospital') {
      switch (activeTab) {
        case 'inventory': return <BloodInventoryView user={user} />;
        case 'create-request': return <HospitalEmergencyView user={user} />;
        case 'donor-verify': return <DonorVerificationView user={user} />;
        case 'notifications': return <NotificationsView user={user} apiBase="hospital" />;
        case 'camps': return <BloodCampView user={user} />;
        case 'reports': return <HospitalReports user={user} />;
        default: return <HospitalDashboard user={user} onNavigate={(tab) => setActiveTab(tab)} />;
      }
    }

    // 4. ADMIN MODULE PAGES (Requires Login)
    if (currentRole === 'admin') {
      switch (activeTab) {
        case 'manage-users': return <ManageUsersView user={user} />;
        case 'manage-donors': return <ManageDonorsView user={user} />;
        case 'manage-hospitals': return <ManageHospitalsView user={user} />;
        case 'manage-requests': return <ManageRequestsView user={user} />;
        case 'inventory-monitor': return <InventoryMonitorView user={user} />;
        case 'analytics': return <AdminAnalyticsView user={user} />;
        case 'broadcast': return <NotificationCentreView user={user} />;
        default: return <AdminDashboard user={user} onNavigate={(tab) => setActiveTab(tab)} />;
      }
    }

    // 5. AI MODULE PAGES (Public Workbench)
    if (currentRole === 'ai') {
      return <AIEngineHub />;
    }

    return <HomePage onSelectModule={handleSelectModule} onOpenAuth={() => handleOpenAuthWithRole('donor')} />;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
        onOpenAuthWithRole={handleOpenAuthWithRole}
      />

      <Chatbot user={user} isLoggedIn={isLoggedIn} />
      <VoiceEmergencyAssistant />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {renderModuleContent()}
      </main>

      <Footer />

      <DonorLoginModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        targetRole={authTargetRole}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;
