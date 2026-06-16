import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import Index, { HomeRedirect } from "./pages/Index.tsx";
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
const queryClient = new QueryClient();

const NavbarController = () => {
  const { userType, isLoading } = useAuth();

  if (isLoading) return null;

  if (userType !== "parent") return null;

  return <AppNavbar />;
};
// async function requestNotificationPermission(){
//   const permission= await Notification.requestPermission()
//   const authToken = localStorage.getItem("accessToken")
//   if(permission !== 'granted') return
//   const token = await getToken (messaging , {
//     vapidKey:import.meta.env.VITE_FIREBASE_VAPID_KEY,
//   })
//   localStorage.setItem("fcmToken",token)
//   console.log("AUTH TOKEN:", authToken);
//   await fetch(
//   `${import.meta.env.VITE_API_URL}/ai/fcm-token`,
//   {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${authToken}`,
//     },
//     body: JSON.stringify({
//       token,
//     }),
//   }
// );
//     console.log("FCM Token:", token);
// }
const App = () => {
  useFirebaseNotifications();
  //  useEffect(() => {
  //   requestNotificationPermission();
  // }, []);
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
          <BrowserRouter basename="/graduation-project-frontend">
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
                  path="/reports"
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
                {/* <Route
                path="/conversation/:id?"
                element={
                  <ProtectedRoute allow={["parent", "child"]}>
                    <Chat />
                  </ProtectedRoute>
                }
              /> */}

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
