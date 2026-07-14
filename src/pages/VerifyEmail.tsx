import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayfulBackground from "@/components/PlayfulBackground";
import OtpInput from "@/components/OtpInput";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { resendOtp, verifyEmail } from "@/lib/auth";
import { useTranslation } from "react-i18next";

const RESEND_SECONDS = 30;
const PENDING_EMAIL_KEY = "pending.verify.email";

const VerifyEmail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const locationEmail =
    (location.state as { email?: string } | null)?.email?.trim().toLowerCase() ?? "";
  const [email] = useState(() => {
    if (locationEmail) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(PENDING_EMAIL_KEY, locationEmail);
      }
      return locationEmail;
    }

    if (typeof window === "undefined") {
      return "";
    }

    return window.sessionStorage.getItem(PENDING_EMAIL_KEY)?.trim().toLowerCase() ?? "";
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  useEffect(() => {
    if (otp.length === 6 && !loading) {
      void handleVerify(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleVerify = async (code: string) => {
    if (!email) {
      setError(t("verifyEmailMissingEmail"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await verifyEmail({
        email,
        otp: code.trim(),
      });

      if (res?.data?.userId) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(PENDING_EMAIL_KEY);
        }

        toast.success(t("verifyEmailSuccessTitle"), {
          description: t("verifyEmailSuccessDescription"),
        });
        navigate("/login");
      }
    } catch (e) {
      const reason = (e as Error).message.toLowerCase();
      const msg = reason.includes("expired")
        ? t("verifyEmailExpired")
        : reason.includes("not found") || reason.includes("pending")
          ? t("verifyEmailPendingMissing")
          : t("verifyEmailInvalid");
      setError(msg);
      setShake((key) => key + 1);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error(t("verifyEmailResendMissingEmail"));
      navigate("/register");
      return;
    }

    setResending(true);
    try {
      await resendOtp({ email });
      setResendIn(RESEND_SECONDS);
      setOtp("");
      setError("");
      toast.success(t("verifyEmailResentTitle"), {
        description: t("verifyEmailResentDescription", { email }),
      });
    } catch (e) {
      const reason = (e as Error).message.toLowerCase();
      const msg = reason.includes("already")
        ? t("verifyEmailAlreadyVerified")
        : reason.includes("not found")
          ? t("verifyEmailPendingMissing")
          : t("verifyEmailResendFailed");
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen playful-bg flex items-center justify-center px-4 py-12 relative">
      <PlayfulBackground />
      <div className="w-full max-w-md relative z-10 animate-fade-slide-up">
        <div
          key={shake}
          className={cn(
            "bg-card rounded-3xl shadow-card p-8 sm:p-10 text-center border border-border/50",
            shake > 0 && "animate-shake",
          )}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-button mx-auto mb-6">
            <Mail
              className="w-10 h-10 text-primary-foreground"
              strokeWidth={2.2}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t("checkEmail")}
          </h1>
          <p className="text-muted-foreground text-sm mb-7">
            {t("weSentCode")}{" "}
            <span className="font-semibold text-foreground break-all">
              {email || t("verifyEmailFallbackAddress")}
            </span>
          </p>

          <OtpInput
            value={otp}
            onChange={setOtp}
            hasError={!!error}
            disabled={loading}
          />

          {error ? (
            <p className="text-sm text-destructive font-medium mt-4 animate-fade-slide-up">
              {error}
            </p>
          ) : null}

          <Button
            variant="hero"
            size="lg"
            className="w-full mt-6"
            onClick={() => void handleVerify(otp)}
            disabled={otp.length !== 6 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("verifyEmailVerifying")}
              </>
            ) : (
              t("verifyEmail")
            )}
          </Button>

          <div className="mt-5 text-sm text-muted-foreground">
            {t("noCode")}{" "}
            {resendIn > 0 ? (
              <span className="text-muted-foreground/70">
                {t("resendIn")} {resendIn}s
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleResend()}
                disabled={resending}
                className="text-primary font-semibold hover:underline underline-offset-4 inline-flex items-center gap-1 disabled:opacity-60 disabled:no-underline"
              >
                <RefreshCw
                  className={cn("w-3.5 h-3.5", resending && "animate-spin")}
                />
                {resending ? t("verifyEmailSending") : t("resendCode")}
              </button>
            )}
          </div>

          <Link
            to="/register"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mt-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToRegister")}
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("verifyTip")} <code className="font-mono">000000</code> for invalid,{" "}
          <code className="font-mono">111111</code> for expired.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
