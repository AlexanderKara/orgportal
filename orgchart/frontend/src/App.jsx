import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
import Landing from './pages/Landing';
import PublicLanding from './components/PublicLanding';
import Structure from './pages/Structure';
import Products from './pages/Products';
import Competencies from './pages/Competencies';
import Vacations from './pages/Vacations';
import Profile from './pages/Profile';
import EmployeeProfile from './pages/EmployeeProfile';
import ProductDetail from './pages/ProductDetail';
import CompetencyDetail from './pages/CompetencyDetail';
import KioskMode from './pages/KioskMode';
import Auth from './pages/Auth';
import RoleProvider from './components/RoleProvider';
import AuthProvider from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AccessDenied from './pages/errors/AccessDenied';
import NotFound from './pages/errors/NotFound';
import ServerError from './pages/errors/ServerError';
import TelegramMiniApp from './pages/TelegramMiniApp';
import TelegramBinding from './pages/TelegramBinding';
import ErrorBoundaryWrapper from './components/ErrorBoundary';

// Динамические импорты для больших компонентов
const Admin = lazy(() => import('./pages/Admin'));
const Employees = lazy(() => import('./pages/admin/Employees'));
const Skills = lazy(() => import('./pages/admin/Skills'));
const SkillGroups = lazy(() => import('./pages/admin/SkillGroups'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const Departments = lazy(() => import('./pages/admin/Departments'));
const AdminVacations = lazy(() => import('./pages/admin/Vacations'));
const Roles = lazy(() => import('./pages/admin/Roles'));
const UserRoles = lazy(() => import('./pages/admin/UserRoles'));
const Notifications = lazy(() => import('./pages/admin/Notifications'));
const Templates = lazy(() => import('./pages/admin/Templates'));
const NotificationSettings = lazy(() => import('./pages/admin/NotificationSettings'));
const NotificationService = lazy(() => import('./pages/admin/NotificationService'));
const RatingSystem = lazy(() => import('./pages/admin/RatingSystem'));
const SendToken = lazy(() => import('./pages/SendToken'));
const TopRating = lazy(() => import('./pages/TopRating'));
const Rating = lazy(() => import('./pages/Rating'));
const ConfirmToken = lazy(() => import('./pages/ConfirmToken'));
const ReceiveToken = lazy(() => import('./pages/ReceiveToken'));
const TokenDistributionService = lazy(() => import('./pages/admin/TokenDistributionService'));
const DistributionSettings = lazy(() => import('./pages/admin/DistributionSettings'));
const Achievements = lazy(() => import('./pages/admin/Achievements'));
const AppSettings = lazy(() => import('./pages/admin/Settings'));
const MeetingRooms = lazy(() => import('./pages/MeetingRooms'));
const AdminMeetingRooms = lazy(() => import('./pages/admin/MeetingRooms'));
const MeetingRoomService = lazy(() => import('./pages/admin/MeetingRoomService'));

// Компонент загрузки
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <RoleProvider>
          <BrowserRouter>
            <ErrorBoundaryWrapper>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/auth" element={
              <ProtectedRoute requireAuth={false}>
                <Auth />
              </ProtectedRoute>
            } />
            
            {/* Публичный лендинг для неавторизованных пользователей */}
            <Route path="/" element={
              <ProtectedRoute requireAuth={false}>
                <PublicLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PublicLanding />} />
              <Route path="hello" element={<PublicLanding />} />
              <Route path="team-a" element={<PublicLanding />} />
              <Route path="timeline" element={<PublicLanding />} />
            </Route>
            
            {/* Отдельные публичные роуты */}
            <Route path="/timeline" element={
              <ProtectedRoute requireAuth={false}>
                <PublicLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PublicLanding />} />
            </Route>
            
            <Route path="/team-a" element={
              <ProtectedRoute requireAuth={false}>
                <PublicLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PublicLanding />} />
            </Route>
            
            {/* Главная страница дашборда */}
            <Route path="/home" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="hello" element={<Landing />} />
              <Route path="team-a" element={<Landing />} />
              <Route path="timeline" element={<Landing />} />
            </Route>
            
            {/* Публичные роуты /home для неавторизованных пользователей */}
            <Route path="/home" element={
              <ProtectedRoute requireAuth={false}>
                <PublicLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PublicLanding />} />
              <Route path="hello" element={<PublicLanding />} />
              <Route path="team-a" element={<PublicLanding />} />
              <Route path="timeline" element={<PublicLanding />} />
            </Route>
            
            {/* Личный кабинет */}
            <Route path="/account" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route path="profile" element={<Profile />} />
              <Route path="vacations" element={<Profile />} />
              <Route path="rating" element={<Profile />} />
              <Route path="settings" element={<Profile />} />
            </Route>
            
            {/* Защищенные маршруты без /dashboard */}
            <Route path="/structure" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Structure />} />
              <Route path="alphabet" element={<Structure />} />
              <Route path="tree" element={<Structure />} />
              <Route path="list" element={<Structure />} />
              <Route path="birthdays" element={<Structure />} />
              <Route path="vacations" element={<Structure />} />
              <Route path="joined" element={<Structure />} />
              <Route path="rating" element={<Structure />} />
            </Route>
            
            <Route path="/products" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Products />} />
              <Route path="list" element={<Products />} />
              <Route path="grid" element={<Products />} />
            </Route>
            
            <Route path="/competencies" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Competencies />} />
              <Route path=":view" element={<Competencies />} />
            </Route>
            
            <Route path="/vacations" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Vacations />} />
            </Route>
            
            <Route path="/meeting-rooms" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<MeetingRooms />} />
            </Route>
            
            <Route path="/send-token" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <SendToken />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/top-rating" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <TopRating />
                </Suspense>
              </ProtectedRoute>
            } />
            
            <Route path="/rating" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <Rating />
                </Suspense>
              </ProtectedRoute>
            } />
            
            {/* Административные маршруты */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              </ProtectedRoute>
            }>
              <Route index element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Admin />
                </Suspense>
              } />
              <Route path="employees" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Employees />
                </Suspense>
              } />
              <Route path="skills" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Skills />
                </Suspense>
              } />
              <Route path="skill-groups" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <SkillGroups />
                </Suspense>
              } />
              <Route path="products" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminProducts />
                </Suspense>
              } />
              <Route path="departments" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Departments />
                </Suspense>
              } />
              <Route path="vacations" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminVacations />
                </Suspense>
              } />
              <Route path="roles" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Roles />
                </Suspense>
              } />
              <Route path="user-roles" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <UserRoles />
                </Suspense>
              } />
              <Route path="notifications" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Notifications />
                </Suspense>
              } />
              <Route path="templates" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Templates />
                </Suspense>
              } />
              <Route path="notification-settings" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <NotificationSettings />
                </Suspense>
              } />
              <Route path="notification-service" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <NotificationService />
                </Suspense>
              } />
              <Route path="rating-system" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <RatingSystem />
                </Suspense>
              } />
              <Route path="ratings" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <RatingSystem />
                </Suspense>
              } />
              <Route path="rating-settings" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <RatingSystem />
                </Suspense>
              } />
              <Route path="send-token" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <SendToken />
                </Suspense>
              } />
              <Route path="top-rating" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <TopRating />
                </Suspense>
              } />
              <Route path="token-distribution-service" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <TokenDistributionService />
                </Suspense>
              } />
              <Route path="distribution-settings" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <DistributionSettings />
                </Suspense>
              } />
              <Route path="settings" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AppSettings />
                </Suspense>
              } />
              <Route path="achievements" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Achievements defaultView="types" />
                </Suspense>
              } />
              <Route path="achievements/types" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Achievements defaultView="types" />
                </Suspense>
              } />
              <Route path="achievements/employees" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Achievements defaultView="employees" />
                </Suspense>
              } />
              <Route path="meeting-rooms" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <AdminMeetingRooms />
                </Suspense>
              } />
              <Route path="meeting-room-service" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <MeetingRoomService />
                </Suspense>
              } />

            </Route>
            
            {/* Отдельные защищенные маршруты */}
            <Route path="/employee/:id" element={
              <ProtectedRoute>
                <EmployeeProfile />
              </ProtectedRoute>
            } />
            <Route path="/product/:id" element={
              <ProtectedRoute>
                <ProductDetail />
              </ProtectedRoute>
            } />
            <Route path="/competency/:id" element={
              <ProtectedRoute>
                <CompetencyDetail />
              </ProtectedRoute>
            } />
            
            {/* Публичный маршрут для киоск-режима */}
            <Route path="kiosk" element={<KioskMode />} />
            
            {/* Маршрут для подтверждения токена */}
            <Route path="/confirm-token/:tokenId" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ConfirmToken />
              </Suspense>
            } />
            
            {/* Маршрут для приема токена по QR-коду */}
            <Route path="/receive-token/:tokenHash" element={
              <Suspense fallback={<LoadingSpinner />}>
                <ReceiveToken />
              </Suspense>
            } />
            
            {/* Telegram мини-апп */}
            <Route path="/telegram-miniapp" element={<TelegramMiniApp />} />
            
            {/* Telegram Binding страница */}
            <Route path="/telegram-binding" element={
              <ProtectedRoute>
                <AdminRoute>
                  <MainLayout />
                </AdminRoute>
              </ProtectedRoute>
            }>
              <Route index element={
                <Suspense fallback={<LoadingSpinner />}>
                  <TelegramBinding />
                </Suspense>
              } />
            </Route>
            
            {/* Страницы ошибок */}
            <Route path="/error/access-denied" element={<AccessDenied />} />
            <Route path="/error/not-found" element={<NotFound />} />
            <Route path="/error/server-error" element={<ServerError />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundaryWrapper>
        </BrowserRouter>
          </RoleProvider>
        </SettingsProvider>
      </AuthProvider>
    );
  } 