import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './core/store/store';
import { AuthProvider } from './features/auth/context/AuthContext';
import { SidebarNav } from './shared/components/SidebarNav';
import { PinterestFeedPage } from './features/inspiration/components/PinterestFeedPage';
import { ProviderListPage } from './features/provider/components/ProviderListPage';
import { ProviderProfilePage } from './features/provider/components/ProviderProfilePage';
import { ForumPage } from './features/forum/components/ForumPage';
import { PinterestLoginPage } from './features/auth/components/PinterestLoginPage';
import { PinterestRegisterPage } from './features/auth/components/PinterestRegisterPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { UserProfilePage } from './features/profile/components/UserProfilePage';
import { CollectionsPage } from './features/profile/components/CollectionsPage';
import { PortfolioUploadWizard } from './features/portfolio/components/PortfolioUploadWizard';
import { ProfileStatsPage } from './features/profile/components/ProfileStatsPage';
import { AdminDashboardPage } from './features/admin/components/AdminDashboardPage';
import { SettingsPage } from './features/settings/components/SettingsPage';
import { ThemeProvider } from './shared/context/ThemeContext';
import './i18n/config';

const HomeRedirect = () => {
  return <Navigate to="/inspiration" replace />;
};


const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="min-h-screen bg-white flex items-center justify-center p-8">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600">{description}</p>
    </div>
  </div>
);

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="hidden lg:block">
          <SidebarNav />
        </div>
        <main className="flex-1 lg:ml-72">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/inspiration" element={<PinterestFeedPage />} />
            <Route path="/providers" element={<ProviderListPage />} />
            <Route path="/providers/:id" element={<ProviderProfilePage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/login" element={<PinterestLoginPage />} />
            <Route path="/register" element={<PinterestRegisterPage />} />
            
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <ProtectedRoute allowedRoles={['homeowner']}>
                  <CollectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/demands"
              element={
                <ProtectedRoute allowedRoles={['homeowner']}>
                  <PlaceholderPage title="My Demands" description="Coming Soon" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portfolio/upload"
              element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <PortfolioUploadWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['provider', 'admin']}>
                  <ProfileStatsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <PlaceholderPage title="Messages" description="Coming Soon" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
