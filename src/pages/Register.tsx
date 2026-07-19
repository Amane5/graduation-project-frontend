import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AsyncFeedback } from "@/components/ui/async-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotificationHandler } from "@/hooks/useFirebaseNotifications";
import { register } from "@/lib/auth";
import { ApiError } from "@/lib/http";
import { cn } from "@/lib/utils";
import { registerSchema } from "@/lib/validation";
import PlayfulBackground from "@/components/PlayfulBackground";

type Errors = Partial<Record<keyof FormState, string>>;

interface FormState {
  email: string;
  password: string;
  repeatPassword: string;
  username: string;
  firstName: string;
  lastName: string;
}

const initial: FormState = {
  email: "",
  password: "",
  repeatPassword: "",
  username: "",
  firstName: "",
  lastName: "",
};

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPwd, setShowPwd] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [submitError, setSubmitError] = useState("");

  useNotificationHandler({
    type: "register",
    handler: (payload) => {
      console.log(payload);
    },
  });

  const validate = (data: FormState): Errors => {
    const result = registerSchema.safeParse(data);
    if (result.success) return {};

    const fieldErrors: Errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof FormState;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }

    return fieldErrors;
  };

  const liveErrors = validate(form);
  const isValid = Object.keys(liveErrors).length === 0;

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (touched[key]) {
      setErrors(validate({ ...form, [key]: value }));
    }
  };

  const handleBlur = (key: keyof FormState) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors(validate(form));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate(form);
    setErrors(nextErrors);
    setTouched({
      email: true,
      password: true,
      repeatPassword: true,
      username: true,
      firstName: true,
      lastName: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setShakeKey((current) => current + 1);
      return;
    }

    setSubmitError("");
    setLoading(true);

    try {
      await register({
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.repeatPassword,
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });

      navigate("/verify-email", {
        state: {
          email: form.email,
          username: form.username.trim(),
        },
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : t("registerCreateFailedMessage");

      setSubmitError(message);
      setShakeKey((current) => current + 1);
    } finally {
      setLoading(false);
    }
  };

  const showError = (key: keyof FormState) => touched[key] && errors[key] ? t(errors[key]!) : false;

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 playful-bg">
      <PlayfulBackground />

      <div className="relative z-10 w-full max-w-md animate-fade-slide-up">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-button">
            <Sparkles className="h-8 w-8 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">Little Minds</h2>
        </div>

        <div
          key={shakeKey}
          className={cn(
            "rounded-3xl border border-border/50 bg-card p-8 shadow-card sm:p-10",
            shakeKey > 0 && "animate-shake",
          )}
        >
          <div className="mb-7 text-center">
            <h1 className="mb-2 text-3xl font-bold text-foreground">{t("createParentAccount")}</h1>
            <p className="text-sm text-muted-foreground">{t("startJourney")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {loading ? (
              <AsyncFeedback
                tone="loading"
                title={t("createAccount")}
                message={t("registerCreatingMessage")}
              />
            ) : null}

            {submitError ? (
              <AsyncFeedback tone="error" title={t("registerCreateFailedTitle")} message={submitError} />
            ) : null}

            <Field
              id="email"
              label={t("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
              value={form.email}
              onChange={(value) => update("email", value)}
              onBlur={() => handleBlur("email")}
              error={showError("email")}
              autoComplete="email"
              disabled={loading}
            />

            <Field
              id="password"
              label={t("password")}
              type={showPwd ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              value={form.password}
              onChange={(value) => update("password", value)}
              onBlur={() => handleBlur("password")}
              error={showError("password")}
              autoComplete="new-password"
              disabled={loading}
              rightIcon={
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPwd((current) => !current)}
                  className="text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPwd ? <EyeOff /> : <Eye />}
                </button>
              }
            />
            <Field
              id="repeatPassword"
              label={t("repeatPassword")}
              type={showRepeat ? "text" : "password"}
              placeholder={t("repeatPasswordPlaceholder")}
              value={form.repeatPassword}
              onChange={(value) => update("repeatPassword", value)}
              onBlur={() => handleBlur("repeatPassword")}
              error={showError("repeatPassword")}
              autoComplete="new-password"
              disabled={loading}
              rightIcon={
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowRepeat((current) => !current)}
                  className="text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showRepeat ? <EyeOff /> : <Eye />}
                </button>
              }
            />

            <Field
              id="username"
              label={t("username")}
              type="text"
              placeholder={t("usernamePlaceholder")}
              value={form.username}
              onChange={(value) => update("username", value)}
              onBlur={() => handleBlur("username")}
              error={showError("username")}
              autoComplete="username"
              disabled={loading}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                id="firstName"
                label={t("firstName")}
                type="text"
                placeholder={t("firstNamePlaceholder")}
                value={form.firstName}
                onChange={(value) => update("firstName", value)}
                onBlur={() => handleBlur("firstName")}
                error={showError("firstName")}
                disabled={loading}
              />
              <Field
                id="lastName"
                label={t("lastName")}
                type="text"
                placeholder={t("lastNamePlaceholder")}
                value={form.lastName}
                onChange={(value) => update("lastName", value)}
                onBlur={() => handleBlur("lastName")}
                error={showError("lastName")}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="mt-6 w-full"
              disabled={!isValid || loading}
              loading={loading}
              loadingText={t("creatingAccount")}
            >
              {t("createAccount")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("alreadyHaveAccount")}{" "}
            <Link to="/login" className="font-semibold text-primary">
              {t("login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

interface FieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string | false;
  autoComplete?: string;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
}

const Field = ({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  rightIcon,
  disabled,
}: FieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        // className={cn(error && "border-red-500")}
        disabled={disabled}
        className={cn(
          rightIcon && "pr-10 rtl:pr-3 rtl:pl-10",
          error && "border-red-500"
        )}
      />
      {/* {rightIcon ? <div className="absolute right-3 top-2">{rightIcon}</div> : null} */}
      {rightIcon ? (
      <div className="absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3">
        {rightIcon}
      </div>
) : null}
    </div>
    {error ? <p className="text-xs text-red-500">{error}</p> : null}
  </div>
);

export default Register;
