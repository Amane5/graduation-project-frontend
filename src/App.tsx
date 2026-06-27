import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import NotFound from "./pages/NotFound.tsx";
import Register from "./pages/Register.tsx";
import Login from "@/pages/Login";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import AddChild from "./pages/AddChild.tsx";
import Chat from "./pages/Chat.tsx";
import Accounts from "./pages/Accounts.tsx";
import History from "./pages/History.tsx";
import Profile from "./pages/profile.tsx";
import StoryForm from "./pages/StoryForm";
import MyStories from "./pages/MyStories";
import AppNavbar from "@/components/AppNavbar";
import { useAuth } from "@/contexts/AuthContext";
import MyFiles from "./pages/MyFiles";
import ChildrenStories from "./pages/ChildrenStories";
import { useFirebaseNotifications } from "./hooks/useFirebaseNotifications.ts";
import { getToken } from "firebase/messaging";
import { messaging } from "./lib/firebase.ts";
import { useEffect } from "react";
import i18n from "./i18n/i18n.ts";
import Reports from "./pages/Reports.tsx";
import StoryReport from "./pages/StoryReport.tsx";
import Challenges from "./pages/Challenges.tsx";
import CreateChallenge from "./pages/CreateChallenge.tsx";
import ChallengeDetails from "./pages/ChallengeDetails.tsx";
import EditChallenge from "./pages/EditChallenge.tsx";
import ActiveChallenges from "./pages/ActiveChallenges.tsx";
import PlayChallenge from "./pages/PlayChallenge.tsx";
import ChallengeResults from "./pages/ChallengeResults.tsx";
const queryClient = new QueryClient();

const NavbarController = () => {
  const { userType, isLoading } = useAuth();

  if (isLoading) return null;

  if (userType !== "parent") return null;

  return <AppNavbar />;
};

const App = () => {
  useFirebaseNotifications();

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "en";

    i18n.changeLanguage(savedLang);

    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <NavbarController />
              <Routes>
                {/* Public */}
                <Route
                  path="/"
                  element={
                    localStorage.getItem("accessToken") ? (
                      <Navigate
                        to={
                          localStorage.getItem("userType") === "parent"
                            ? "/dashboard"
                            : "/chat"
                        }
                        replace
                      />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <Register />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <Login />
                    </PublicOnlyRoute>
                  }
                />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Parent-only */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-child"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <AddChild />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-child/:id"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <AddChild />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <History />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <Accounts />
                    </ProtectedRoute>
                  }
                />

                {/* Chat — accessible to BOTH parent and child */}
                <Route
                  path="/chat/:id?"
                  element={
                    <ProtectedRoute allow={["parent", "child"]}>
                      <Chat />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/story-generator"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <StoryForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-stories/:childId?"
                  element={
                    <ProtectedRoute allow={["parent", "child"]}>
                      <MyStories />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-files"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <MyFiles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/children-stories"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <ChildrenStories />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports/:childId"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/reports/story/:storyId"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <StoryReport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/challenges"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <Challenges />
                    </ProtectedRoute>
                  }
                />

                 <Route
                  path="/challenges/create"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <CreateChallenge />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/challenge/:id"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <ChallengeDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/challenge/:id/edit"
                  element={
                    <ProtectedRoute allow={["parent"]}>
                      <EditChallenge />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/my-challenges"
                  element={
                    <ProtectedRoute allow={["child"]}>
                      <ActiveChallenges />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/challenge/:id/play"
                  element={
                    <ProtectedRoute allow={["child"]}>
                      <PlayChallenge />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/challenge/:id/results"
                  element={
                    <ProtectedRoute allow={["child"]}>
                      <ChallengeResults />
                    </ProtectedRoute>
                  }
                />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
