import { Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import SessionProvider from './components/SessionProvider';
import ErrorBoundary from './components/ErrorBoundary';
import AdminRoute from './components/Auth/AdminRoute';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import SellerRoute from './components/Auth/SellerRoute';
import RenterRoute from './components/Auth/RenterRoute';
import AgentRoute from './components/Auth/AgentRoute';
import HomePage from './pages/HomePage';
import { FavoritesProvider } from './context/FavoritesContext';

// Pages are loaded on demand so the first visit only downloads what it needs
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/Auth/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const SellerDashboard = lazy(() => import('./pages/Seller/SellerDashboard'));
const BuyerDashboard = lazy(() => import('./pages/Buyer/BuyerDashboard'));
const RenterDashboard = lazy(() => import('./pages/Renter/RenterDashboard'));
const AgentDashboard = lazy(() => import('./pages/Agent/AgentDashboard'));
const AgentsPage = lazy(() => import('./pages/Agents/AgentsPage'));
const AgentProfilePage = lazy(() => import('./pages/Agents/AgentProfilePage'));
const PropertyListPage = lazy(() => import('./pages/Properties/PropertyListPage'));
const PropertyDetailPage = lazy(() => import('./pages/Properties/PropertyDetailPage'));
const PropertyFormPage = lazy(() => import('./pages/Properties/PropertyFormPage'));
const RentalPropertiesPage = lazy(() => import('./pages/Properties/RentalPropertiesPage'));
const AboutPage = lazy(() => import('./pages/Info/AboutPage'));
const ContactPage = lazy(() => import('./pages/Info/ContactPage'));
const HelpPage = lazy(() => import('./pages/Info/HelpPage'));
const TermsPage = lazy(() => import('./pages/Info/LegalPages').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/Info/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/Info/LegalPages').then((m) => ({ default: m.ForgotPasswordPage }))
);

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
    <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
  </div>
);

const NotFound = () => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
    <p className="text-sm font-semibold text-green-600">404</p>
    <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
    <p className="mt-2 text-gray-600">The page you are looking for doesn&apos;t exist or was moved.</p>
    <Link to="/" className="mt-6 rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700">
      Back to home
    </Link>
  </div>
);

const protectedPage = (Page) => (
  <ProtectedRoute>
    <Page />
  </ProtectedRoute>
);

function App() {
  return (
    <SessionProvider>
      <FavoritesProvider>
      <Layout>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/dashboard" element={protectedPage(DashboardPage)} />
              <Route path="/profile" element={protectedPage(ProfilePage)} />
              <Route path="/seller" element={protectedPage(SellerDashboard)} />
              <Route path="/buyer" element={protectedPage(BuyerDashboard)} />
              <Route path="/renter" element={protectedPage(RenterDashboard)} />
              <Route
                path="/agent"
                element={
                  <AgentRoute>
                    <AgentDashboard />
                  </AgentRoute>
                }
              />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/:id" element={<AgentProfilePage />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              <Route path="/properties" element={<PropertyListPage />} />
              <Route path="/rentals" element={<RentalPropertiesPage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route
                path="/properties/create"
                element={
                  <SellerRoute>
                    <PropertyFormPage />
                  </SellerRoute>
                }
              />
              <Route
                path="/properties/:id/edit"
                element={
                  <SellerRoute roles={['seller', 'agent', 'admin', 'renter']}>
                    <PropertyFormPage />
                  </SellerRoute>
                }
              />
              <Route
                path="/properties/create-rental"
                element={
                  <RenterRoute>
                    <PropertyFormPage />
                  </RenterRoute>
                }
              />

              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Layout>
      </FavoritesProvider>
    </SessionProvider>
  );
}

export default App;
