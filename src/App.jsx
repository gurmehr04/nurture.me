
import { useState, useEffect, useContext, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PProfile from './components/Profile';
import PrivateProfile from './components/PrivateProfile'; // Maintaining original import name
import bgHero from './assets/bg-hero4.jpg';
import { userActivities, publicProfileData, privateProfileData } from './constants';
// import ProgressOverview from './components/ProgressiveOverview';
import axios from 'axios';
import "./UnityViewer.css";
import { UserProvider, UserContext } from "./context/UserContext";
import PageWrapper from './components/PageWrapper';
// import Loader from './components/Loader'; // Removed 3D Loader

// Lazy loaded components
const Register = lazy(() => import('./components/Register'));
const Forum = lazy(() => import('./components/Forum'));
const Chat = lazy(() => import('./components/Chat'));
const Admin = lazy(() => import('./components/AdminPage'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const Login = lazy(() => import('./components/Login'));
const BreathingTiles = lazy(() => import('./components/BreathingTiles'));
const EndlessRunner = lazy(() => import('./components/EndlessRunner'));
const WorkoutWheel = lazy(() => import('./components/WorkoutWheel'));
const ShooterGame = lazy(() => import('./components/ShooterGame'));
const MiniGames = lazy(() => import('./components/MiniGames'));
const MentalHealthCheck = lazy(() => import('./components/MentalHealthCheck'));
const WritePredictPage = lazy(() => import('./pages/WritePredictPage'));

const AnimatedRoutes = () => {
  const location = useLocation();

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    const { user } = useContext(UserContext);

    // Retrieve saved route from localStorage
    const savedPath = localStorage.getItem('currentPath');

    useEffect(() => {
      if (location.pathname !== savedPath) {
        localStorage.setItem('currentPath', location.pathname);
      }
    }, [location.pathname]);

    if (!user) {
      return <Navigate to="/login" />;
    }

    return (
      <PageWrapper>
        {children}
      </PageWrapper>
    );
  };

  // Public route wrapper for login
  const PublicRoute = ({ children }) => {
    const { user } = useContext(UserContext);

    // If the user is logged in, navigate to the last visited route
    const savedPath = localStorage.getItem('currentPath');
    if (user) {
      return <Navigate to={savedPath || '/'} />;
    }

    return children;
  };

  // Handle page refresh by restoring the route
  useEffect(() => {
    const savedPath = localStorage.getItem('currentPath');
    if (savedPath && window.location.pathname !== savedPath) {
      window.history.replaceState(null, '', savedPath);
    }
  }, []);

  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-[#fff6d4]">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          <Route path="/predict" element={
            <PageWrapper>
              <MentalHealthCheck />
            </PageWrapper>
          } />
          <Route path="/write-predict" element={
            <PageWrapper>
              <WritePredictPage />
            </PageWrapper>
          } />


          {/* Home page - Hero is not lazy loaded to prevent LCP issues */}
          <Route path="/" element={<Hero />} />

          {/* Register page */}
          <Route path="/register" element={
            <PageWrapper>
              <Register />
            </PageWrapper>
          } />

          {/* Forum - protected */}
          <Route
            path="/forum"
            element={
              <ProtectedRoute>
                <Forum />
              </ProtectedRoute>
            }
          />

          {/* Chat - protected */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* Admin Login - public */}
          <Route path="/admin-login" element={
            <PageWrapper>
              <AdminLogin />
            </PageWrapper>
          } />

          {/* Admin - protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Login - public */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Mini-games - always accessible */}
          <Route path="/mini-games" element={
            <PageWrapper>
              <MiniGames />
            </PageWrapper>
          } />

          {/* Private Profile - protected */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PrivateProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};

function App() {
  const [count, setCount] = useState(0);

  const fetchAPI = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api");
      console.log(response.data.fruits);
    } catch (error) {
      console.error("API fetch error:", error);
    }
  };

  useEffect(() => {
    fetchAPI();
  }, []);

  return (
    <UserProvider>
      <BrowserRouter>
        <Navbar />
        <AnimatedRoutes />
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
