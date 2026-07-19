import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import OtpInput from "./OtpInput";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { forgotPassword } from "@/lib/auth";
import { resetPassword } from "@/lib/auth";
import { useTranslation } from "react-i18next";

type Step = "email" | "otp" | "reset" | "success";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESEND_SECONDS = 60;
// Demo OTP — in real app this is sent via email

const ForgotPasswordModal = ({
  open,
  onOpenChange,
}: ForgotPasswordModalProps) => {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [pwdErrors, setPwdErrors] = useState<{ new?: string; repeat?: string }>(
    {},
  );
  const [showPwd, setShowPwd] = useState(false);
  const [showRepeatPwd, setShowRepeatPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const {t} = useTranslation()
  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("email");
      setEmail("");
      setEmailError("");
      setOtp("");
      setOtpError("");
      setNewPassword("");
      setRepeatPassword("");
      setPwdErrors({});
      setLoading(false);
      setSecondsLeft(RESEND_SECONDS);
      setShowPwd(false);
    }
  }, [open]);

  // Countdown timer
  useEffect(() => {
    if (step !== "otp") return;
    if (secondsLeft <= 0) return;
    const t = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [step, secondsLeft]);

  const triggerShake = () => setShake((k) => k + 1);

  // STEP 1 — Send OTP

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();

    if (!trimmed) {
      setEmailError(t("Email is required"));
      triggerShake();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError(t("Invalid email format"));
      triggerShake();
      return;
    }

    setEmailError("");
    setLoading(true);

    try {
      await forgotPassword({ email: trimmed });

      toast.success(t("OTP sent successfully 💌"));

      setStep("otp");
      setSecondsLeft(RESEND_SECONDS);
    } catch (err) {
      setEmailError(t("Failed to send OTP"));
      triggerShake();
    }

    setLoading(false);
  };

  // STEP 2 — Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setOtpError(t("Enter 6 digits"));
      triggerShake();
      return;
    }

    setOtpError("");
    setStep("reset"); // فقط انتقال للخطوة التالية بدون تحقق وهمي
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;

    setLoading(true);

    try {
      await forgotPassword({ email });
      toast.success("OTP resent 💌");
      setSecondsLeft(RESEND_SECONDS);
    } catch {
      toast.error("Failed to resend OTP");
    }

    setLoading(false);
  };

  // STEP 3 — Reset password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: { new?: string; repeat?: string } = {};

    if (newPassword.length < 6) errs.new = t("Minimum 6 chars");
    if (newPassword !== repeatPassword) errs.repeat = t("Passwords don't match");

    setPwdErrors(errs);

    if (Object.keys(errs).length > 0) {
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        email: email.trim(),
        otp: otp,
        newPassword: newPassword,
      });

      setStep("success");
    } catch (err) {
      setOtpError(t("Invalid or expired OTP ❌"));
      setStep("otp");
      triggerShake();
    }

    setLoading(false);
  };

  const handleFinish = () => {
    onOpenChange(false);
    // Already on /login, no redirect needed — but if used elsewhere could navigate
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md rounded-3xl p-0 border-border/50 shadow-card overflow-hidden",
          shake > 0 && "animate-shake",
        )}
        key={`${step}-${shake}`}
      >
        {/* STEP 1 — Email */}
        {step === "email" && (
          <form onSubmit={handleSendOtp} className="p-8 animate-scale-fade-in">
            <DialogHeader className="text-center items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-button mb-3">
                <Mail className="w-7 h-7 text-primary-foreground" />
              </div>
              <DialogTitle className="text-2xl font-bold">
                {t('Forgot Password?')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('No worries! Enter your email and we will send you a code 💌')} 
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="fp-email" className="text-sm font-semibold">
                {t('Email')}
              </Label>
              <Input
                id="fp-email"
                type="email"
                placeholder="parent@example.com"
                value={email}
                disabled={loading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                aria-invalid={!!emailError}
                className={cn(
                  emailError &&
                    "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_4px_hsl(var(--destructive)/0.15)]",
                )}
              />
              {emailError && (
                <p className="text-xs text-destructive font-medium pl-1 animate-fade-slide-up">
                  {emailError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full mt-6"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("Sending...")}
                </>
              ) : (
                t("Send OTP")
              )}
            </Button>
          </form>
        )}

        {/* STEP 2 — OTP */}
        {step === "otp" && (
          <form
            onSubmit={handleVerifyOtp}
            className="p-8 animate-scale-fade-in"
          >
            <DialogHeader className="text-center items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-button mb-3">
                <KeyRound className="w-7 h-7 text-primary-foreground" />
              </div>
              <DialogTitle className="text-2xl font-bold">
                {t('Enter Verification Code')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('We sent a 6-digit code to')}{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="my-6">
              <OtpInput
                value={otp}
                onChange={(v) => {
                  setOtp(v);
                  if (otpError) setOtpError("");
                }}
                hasError={!!otpError}
                disabled={loading}
              />
              {otpError && (
                <p className="text-xs text-destructive font-medium text-center mt-3 animate-fade-slide-up">
                  {otpError}
                </p>
              )}
            </div>

            <div className="text-center text-sm mb-4">
              {secondsLeft > 0 ? (
                <p className="text-muted-foreground">
                  {t('Resend code in')}{" "}
                  <span className="font-semibold text-primary">
                    {secondsLeft}s
                  </span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary font-semibold hover:underline underline-offset-4"
                >
                  {t('Resend code')}
                </button>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('Verifying...')}
                </>
              ) : (
                t("Verify Code")
              )}
            </Button>
          </form>
        )}

        {/* STEP 3 — Reset password */}
        {step === "reset" && (
          <form onSubmit={handleReset} className="p-8 animate-scale-fade-in">
            <DialogHeader className="text-center items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-button mb-3">
                <Lock className="w-7 h-7 text-primary-foreground" />
              </div>
              <DialogTitle className="text-2xl font-bold">
                {t('Create New Password')}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {t('Almost there! Pick a strong, fresh password ✨')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-pwd" className="text-sm font-semibold">
                  {t('New Password')}
                </Label>
                <div className="relative">
                  <Input
                    id="new-pwd"
                    type={showPwd ? "text" : "password"}
                    placeholder={t("At least 6 characters")}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (pwdErrors.new)
                        setPwdErrors((p) => ({ ...p, new: undefined }));
                    }}
                    aria-invalid={!!pwdErrors.new}
                    className={cn(
                      "pr-12",
                      pwdErrors.new &&
                        "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_4px_hsl(var(--destructive)/0.15)]",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPwd ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {pwdErrors.new && (
                  <p className="text-xs text-destructive font-medium pl-1 animate-fade-slide-up">
                    {pwdErrors.new}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="repeat-pwd" className="text-sm font-semibold">
                  {t('Repeat New Password')}
                </Label>
                <div className="relative">
                  <Input
                  id="repeat-pwd"
                  type={showRepeatPwd ? "text" : "password"}
                  placeholder={t("Type your password again")}
                  value={repeatPassword}
                  onChange={(e) => {
                    setRepeatPassword(e.target.value);
                    if (pwdErrors.repeat)
                      setPwdErrors((p) => ({ ...p, repeat: undefined }));
                  }}
                  aria-invalid={!!pwdErrors.repeat}
                  className={cn(
                    "pr-12",
                    pwdErrors.repeat &&
                      "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_4px_hsl(var(--destructive)/0.15)]",
                  )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showRepeatPwd ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {pwdErrors.repeat && (
                  <p className="text-xs text-destructive font-medium pl-1 animate-fade-slide-up">
                    {pwdErrors.repeat}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full mt-6"
              disabled={loading || !newPassword || !repeatPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('Updating...')}
                </>
              ) : (
                t("Reset Password")
              )}
            </Button>
          </form>
        )}

        {/* STEP 4 — Success */}
        {step === "success" && (
          <div className="p-8 text-center animate-scale-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success to-secondary flex items-center justify-center shadow-button mx-auto mb-4">
              <CheckCircle2
                className="w-10 h-10 text-primary-foreground"
                strokeWidth={2.2}
              />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('Password updated! 🎉')}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t('You can now log in with your new password.')}
            </p>
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleFinish}
            >
              {t('Back to Login')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
