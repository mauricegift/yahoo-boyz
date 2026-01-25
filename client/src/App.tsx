import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { lazy, Suspense } from "react";
import { ScrollToTopOnNavigate, ScrollToTopButton } from "@/components/ScrollToTop";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const Home = lazy(() => import("@/pages/Home"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const Verify = lazy(() => import("@/pages/auth/Verify"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const Savings = lazy(() => import("@/pages/Savings"));
const Contributions = lazy(() => import("@/pages/Contributions"));
const Loans = lazy(() => import("@/pages/Loans"));
const LoanApply = lazy(() => import("@/pages/LoanApply"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const NotFound = lazy(() => import("@/pages/notFound"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Calculate isAdmin locally since it's not in auth context
  const isAdmin =
    !!user && (user.role === "admin" || user.role === "superadmin");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />

        {/* Auth Routes - redirect if already logged in */}
        <Route path="/login">
          <AuthRoute>
            <Login />
          </AuthRoute>
        </Route>
        <Route path="/signup">
          <AuthRoute>
            <Signup />
          </AuthRoute>
        </Route>
        <Route path="/verify" component={Verify} />
        <Route path="/forgot-password">
          <AuthRoute>
            <ForgotPassword />
          </AuthRoute>
        </Route>
        <Route path="/reset-password" component={ResetPassword} />

        {/* Protected Routes */}
        <Route path="/dashboard">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        <Route path="/contributions">
          <ProtectedRoute>
            <Contributions />
          </ProtectedRoute>
        </Route>
        <Route path="/savings">
          <ProtectedRoute>
            <Savings />
          </ProtectedRoute>
        </Route>
        <Route path="/loans">
          <ProtectedRoute>
            <Loans />
          </ProtectedRoute>
        </Route>
        <Route path="/loans/apply">
          <ProtectedRoute>
            <LoanApply />
          </ProtectedRoute>
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        </Route>

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <ScrollToTopOnNavigate />
            <Router />
            <ScrollToTopButton />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              closeButton={true}
            />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
