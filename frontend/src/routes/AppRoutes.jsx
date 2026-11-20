import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';
import { ChatPage } from '../pages/Chat/ChatPage';
import { FriendsPage } from '../pages/Friends/FriendsPage';
import { FriendRequestsPage } from '../pages/FriendRequests/FriendRequestsPage';
import { SearchPage } from '../pages/Search/SearchPage';
import { ProfilePage } from '../pages/Profile/ProfilePage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/requests" element={<FriendRequestsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Default fallback */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
};
