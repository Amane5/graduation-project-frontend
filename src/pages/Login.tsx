import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { AsyncFeedback } from "@/components/ui/async-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PlayfulBackground from "@/components/PlayfulBackground";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { login as apiLogin } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { requestNotificationPermission } from "@/lib/firebaseNotifications";
import type { AuthRedirectState } from "@/lib/auth-session";
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, resolveRedirectTarget } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"parent" | "child" | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

  const isValid =
    username.trim().length > 0 && password.length > 0 && userType !== null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!username.trim() || !password) {
      setError(t("fillAllFields"));
      return;
    }

    if (!userType) {
      setError(t("selectRole"));
      return;
    }

    setLoading(true);
    setError("");
    setStatusMessage("loginStatusSigningIn");


    try {
      const res = await apiLogin({
        username: username.trim(),
        password: password,
        selectedRole: userType,
      });

      console.log("LOGIN RESPONSE:", res);

      const token = res.data.accessToken;
      const user = res.data.user;
      console.log("USER DATA:", res.data.user);
      signIn({
        accessToken: token,
        user,
      });

      await requestNotificationPermission(token);

      const redirectState = location.state as AuthRedirectState | null;
      navigate(resolveRedirectTarget(redirectState?.from, user.type), {
        replace: true,
      });
    } catch (err) {
      setStatusMessage("");
      if (err instanceof ApiError) {
        toast.error(err.message);
        setError(err.message);
      } else {
        toast.error(t("unexpectedError"));
        setError(t("unexpectedError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <PlayfulBackground />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md z-10">
        <div className={cn("bg-card p-8 rounded-2xl")}>
          <div className="flex items-center justify-center mb-4">
            <Sparkles />
            <h1 className="ml-2 font-bold">{t("login")}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {statusMessage && !error ? (
              <AsyncFeedback tone="loading" title={t("login")} message={t(statusMessage)} />
            ) : null}

            <div>
              <Label>{t("username")}</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <Label>{t("password")}</Label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn("pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">{t("loginAs")}</Label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("parent")}
                  disabled={loading}
                  className={cn(
                    "flex-1 py-2 rounded-xl border transition flex items-center justify-center gap-2",
                    userType === "parent"
                      ? "bg-primary text-white"
                      : "bg-transparent hover:bg-muted",
                  )}
                >
                  {t("parent")}
                </button>

                <button
                  type="button"
                  onClick={() => setUserType("child")}
                  disabled={loading}
                  className={cn(
                    "flex-1 py-2 rounded-xl border transition flex items-center justify-center gap-2",
                    userType === "child"
                      ? "bg-primary text-white"
                      : "bg-transparent hover:bg-muted",
                  )}
                >
                  {t("child")}
                </button>
              </div>
            </div>
            {error && (
              <AsyncFeedback tone="error" title={t("loginErrorTitle")} message={error} />
            )}

            <Button
              type="submit"
              disabled={loading || !isValid}
              className="w-full"
              loading={loading}
              loadingText={t("login")}
            >
              {t("login")}
            </Button>
          </form>

          <p className="text-center mt-4 text-sm  text-muted-foreground ">
            <button onClick={() => setForgotOpen(true)}>
              {t("forgotPassword")}
            </button>
          </p>

          <p className="text-center mt-2 text-sm text-primary font-semibold">
            <Link to="/register">{t("createAccount")}</Link>
          </p>
        </div>
      </div>

      <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
    </div>
  );
};

export default Login;
