import React, { lazy, Suspense, useMemo, useState } from "react";
import "./css/App.css";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { TxProvider } from "./components/TxOverlay";
import { OceanProvider } from "./features/ocean/OceanContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastContainer } from './lib/toast';
import { HelmetProvider } from './lib/helmet';
import AlphaGate from "./components/AlphaGate";

import Footer from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { Fallback } from "./components/Fallback";

const StartGamePage = lazy(() => import("./pages/StartGamePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const MyFishPage = lazy(() => import("./pages/MyFishPage"));
const FishPage = lazy(() => import("./pages/FishPage"));
const FishEventsPage = lazy(() => import("./pages/FishEventsPage"));
const OceanEventsPage = lazy(() => import("./pages/OceanEventsPage"));
const TopFishPage = lazy(() => import("./pages/TopFishPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const RoutedHeader: React.FC = () => {
  const location = useLocation();
  const showOceanStatus = location.pathname !== "/";
  const isLanding = location.pathname === "/";
  return <Header showOceanStatus={showOceanStatus} isLanding={isLanding} />;
};

const App: React.FC = () => {
  const [gateOk, setGateOk] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('alpha_gate_ok_v1') === 'ok';
  });

  const GateScreen: React.FC = () => {
    const { language } = useLanguage();
    const lang = useMemo(() => (language === 'ru' ? 'ru' : 'en'), [language]);
    return <AlphaGate language={lang} onSuccess={() => setGateOk(true)} />;
  };

  return (
    <HelmetProvider>
      <LanguageProvider>
        {gateOk ? (
          <Router>
            <TxProvider>
              <OceanProvider>
                <ErrorBoundary>
                  <div className="min-h-screen bg-[#101014]">
                    <RoutedHeader />
                    <Suspense
                      fallback={<Fallback />}
                    >
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route
                          path="/my-fish"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <MyFishPage />
                            </main>
                          }
                        />
                        <Route
                          path="/fish/:id"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <FishPage />
                            </main>
                          }
                        />
                        <Route
                          path="/fish/:id/events"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <FishEventsPage />
                            </main>
                          }
                        />
                        <Route
                          path="/start-game"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <StartGamePage />
                            </main>
                          }
                        />
                        <Route
                          path="/about-game"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <AboutPage />
                            </main>
                          }
                        />
                        <Route
                          path="/ocean/events"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <OceanEventsPage />
                            </main>
                          }
                        />
                        <Route
                          path="/top-fish"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <TopFishPage />
                            </main>
                          }
                        />
                        <Route
                          path="/terms-of-service"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <TermsPage />
                            </main>
                          }
                        />
                        <Route
                          path="/privacy-policy"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <PrivacyPage />
                            </main>
                          }
                        />
                        <Route
                          path="/contacts"
                          element={
                            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                              <ContactsPage />
                            </main>
                          }
                        />
                        <Route
                          path="*"
                          element={<NotFoundPage />}
                        />
                      </Routes>
                    </Suspense>
                    <ToastContainer position="bottom-right" theme="dark" closeOnClick newestOnTop limit={4} />
                    <Footer />
                  </div>
                </ErrorBoundary>
              </OceanProvider>
            </TxProvider>
          </Router>
        ) : (
          <GateScreen />
        )}
      </LanguageProvider>
    </HelmetProvider>
  );
};

export default App;
