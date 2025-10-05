import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './core/store/store';
import { AuthProvider } from './features/auth/context/AuthContext';
import { SidebarNav } from './shared/components/SidebarNav';
import { PinterestFeedPage } from './features/inspiration/components/PinterestFeedPage';
import { ProviderProfilePage } from './features/provider/components/ProviderProfilePage';
import { ForumPage } from './features/forum/components/ForumPage';
import { PinterestLoginPage } from './features/auth/components/PinterestLoginPage';
import { PinterestRegisterPage } from './features/auth/components/PinterestRegisterPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { ThemeProvider } from './shared/context/ThemeContext';
import './i18n/config';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <div className="flex min-h-screen bg-white">
              <SidebarNav />
              <main className="flex-1 lg:ml-72">
                <Routes>
                  <Route path="/" element={<Navigate to="/inspiration" replace />} />
                  <Route path="/inspiration" element={<PinterestFeedPage />} />
                  <Route path="/providers" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">Providers List (Coming Soon)</h1><p className="text-gray-600 mt-2">Browse renovation service providers</p></div>} />
                  <Route path="/providers/:id" element={<ProviderProfilePage />} />
                  <Route path="/forum" element={<ForumPage />} />
                  <Route path="/login" element={<PinterestLoginPage />} />
                  <Route path="/register" element={<PinterestRegisterPage />} />
                  <Route
                    path="/profile/:id"
                    element={
                      <ProtectedRoute>
                        <div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">Profile Page (Coming Soon)</h1></div>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
            </div>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </Provider>
  );
}

export default App;
