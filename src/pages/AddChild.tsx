import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, ImagePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";

import PlayfulBackground from "@/components/PlayfulBackground";
import { AsyncFeedback } from "@/components/ui/async-feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { type Child, cartoonizeChildImage, createChild, getChildById, updateChild } from "@/lib/children";
import { ApiError } from "@/lib/http";
import { cn, resolveAssetUrl } from "@/lib/utils";

interface Errors {
  firstName?: string;
  gender?: string;
  birthDate?: string;
  username?: string;
  password?: string;
  repeatPassword?: string;
}

const parseMultiValueInput = (value: string) =>
  value
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const AddChild = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const editingChild = (location.state as Child | null) ?? null;
  const isEditMode = Boolean(editingChild || editId);
  const { updateSessionUser, user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<keyof Errors, boolean>>({
    firstName: false,
    gender: false,
    birthDate: false,
    username: false,
    password: false,
    repeatPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "loading" | "success" | "error" | "info";
    title?: string;
    message: string;
  } | null>(null);

  const [readingLevel, setReadingLevel] = useState("");
  const [responseLength, setResponseLength] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [blockedTopics, setBlockedTopics] = useState<string[]>([]);
  const [interestsDraft, setInterestsDraft] = useState("");
  const [blockedTopicsDraft, setBlockedTopicsDraft] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [childData, setChildData] = useState<Child | null>(editingChild);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const targetChildId = editingChild?.id ?? childData?.id ?? editId ?? null;
  const currentAvatarUrl = childData?.avatarUrl ?? null;
  const displayAvatarUrl = avatarPreview ?? resolveAssetUrl(currentAvatarUrl) ?? null;
  const hasExistingAvatar = Boolean(currentAvatarUrl);
  const hasReplacementAvatar = Boolean(avatarFile && avatarPreview);

  const validate = (): Errors => {
    const nextErrors: Errors = {};

    if (!firstName.trim()) {
      nextErrors.firstName = t("firstNameRequired");
    }

    if (!birthDate) {
      nextErrors.birthDate = t("birthDateRequired");
    } else {
      const today = new Date();
      const birth = new Date(birthDate);

      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
      ) {
        age--;
      }

      if (age < 2 || age > 17) {
        nextErrors.birthDate = t("ageBetween2And17");
      }
    }

    if (!username.trim()) {
      nextErrors.username = t("usernameRequired");
    }

    if (!isEditMode) {
      if (!password) {
        nextErrors.password = t("passwordRequired");
      } else if (password.length < 6) {
        nextErrors.password = t("passwordMin6");
      }

      if (password !== repeatPassword) {
        nextErrors.repeatPassword = t("passwordsDontMatch");
      }
    }

    return nextErrors;
  };

  const markTouched = (key: keyof Errors) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors(validate());
  };

  const resetAvatarSelection = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(null);
    setAvatarPreview(null);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    setSubmitError("");
    setFeedback({
      tone: "loading",
      title: isEditMode ? t("updateChild") : t("createChild"),
      message: isEditMode
        ? t("addChildSavingChanges")
        : t("addChildCreatingProfile"),
    });

    try {
      if (isEditMode) {
        if (!targetChildId) {
          throw new Error("Missing child id");
        }

        await updateChild({
          id: targetChildId,
          firstName,
          gender,
          username,
          birthDate,
          readingLevel,
          responseLength,
          learningStyle,
          interests,
          blockedTopics,
        });

        let nextAvatarUrl = childData?.avatarUrl ?? null;

        if (avatarFile) {
          setAvatarLoading(true);
          try {
            const avatarResponse = await cartoonizeChildImage(targetChildId, avatarFile);
            nextAvatarUrl = avatarResponse.data.data.avatarUrl;
          } finally {
            setAvatarLoading(false);
          }
        }

        if (user?.id && String(user.id) === String(targetChildId)) {
          updateSessionUser({
            ...user,
            gender,
            readingLevel,
            responseLength,
            learningStyle,
            interests,
            blockedTopics,
            avatarUrl: nextAvatarUrl,
          });
        }

        toast.success(t("updated"));
        setFeedback({
          tone: "success",
          title: t("updated"),
          message: t("addChildUpdatedMessage"),
        });
        navigate("/dashboard");
        return;
      }

      const response = await createChild({
        firstName,
        gender,
        username,
        password,
        birthDate,
        readingLevel,
        responseLength,
        learningStyle,
        interests,
        blockedTopics,
      });

      if (avatarFile) {
        setAvatarLoading(true);
        try {
          await cartoonizeChildImage(response.data.data.id, avatarFile);
        } finally {
          setAvatarLoading(false);
        }
      }

      toast.success(t("childCreatedSuccess"));
      setFeedback({
        tone: "success",
        title: t("success"),
        message: t("childCreatedSuccess"),
      });
      navigate("/dashboard");
    } catch (err) {
      const error = err as ApiError;

      if (error.status === 409) {
        setSubmitError(t("usernameExists"));
      } else if (error.status === 401) {
        setSubmitError(t("loginAgain"));
      } else if (error.status === 404) {
        setSubmitError(t("childNotFound"));
      } else {
        setSubmitError(error.message);
      }

      setFeedback({
        tone: "error",
        title: isEditMode
          ? t("addChildUpdateFailedTitle")
          : t("addChildCreateFailedTitle"),
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    navigate("/dashboard");
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    const loadChild = async () => {
      const applyChild = (child: Child) => {
        setChildData(child);
        setFirstName(child.firstName || "");
        setGender(child.gender || "");
        setUsername(child.username || "");
        setBirthDate(child.birthDate?.split("T")[0] || "");
        setReadingLevel(child.readingLevel || "");
        setResponseLength(child.responseLength || "");
        setLearningStyle(child.learningStyle || "");
        setInterests(child.interests || []);
        setBlockedTopics(child.blockedTopics || []);
        setInterestsDraft("");
        setBlockedTopicsDraft("");
        setAvatarFile(null);
        setAvatarPreview((current) => {
          if (current?.startsWith("blob:")) {
            URL.revokeObjectURL(current);
          }

          return null;
        });

        if (avatarInputRef.current) {
          avatarInputRef.current.value = "";
        }
      };

      if (editingChild) {
        applyChild(editingChild);
      }

      if (!editId) {
        return;
      }

      try {
        setPageLoading(true);
        const child = await getChildById(editId);
        applyChild(child);
      } catch {
        navigate("/dashboard");
      } finally {
        setPageLoading(false);
      }
    };

    void loadChild();
  }, [editId, editingChild, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    setFirstName("");
    setGender("");
    setBirthDate("");
    setUsername("");
    setPassword("");
    setRepeatPassword("");
    setReadingLevel("");
    setResponseLength("");
    setLearningStyle("");
    setInterests([]);
    setBlockedTopics([]);
    setInterestsDraft("");
    setBlockedTopicsDraft("");
    setAvatarFile(null);
    setAvatarPreview((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }

      return null;
    });

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  }, [editId, isEditMode]);

  return (
    <div className="relative min-h-screen">
      <PlayfulBackground />

      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-6 rounded-[2rem] border border-border/50 bg-card/85 p-6 shadow-card backdrop-blur-sm">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? t("updateChild") : t("createChild")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("addChildIntro")}
            </p>
          </div>
        </div>

        {feedback ? (
          <div className="mb-6">
            <AsyncFeedback
              tone={feedback.tone}
              title={feedback.title}
              message={feedback.message}
            />
          </div>
        ) : null}

        {pageLoading ? (
          <div className="mb-6">
            <AsyncFeedback
              tone="loading"
              title={t("addChildLoadingProfileTitle")}
              message={t("addChildLoadingProfileMessage")}
            />
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-soft backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {t("addChildBasicDetailsTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("addChildBasicDetailsDescription")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">{t("firstName")}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  onBlur={() => markTouched("firstName")}
                  aria-invalid={touched.firstName && !!errors.firstName}
                />
                {touched.firstName && errors.firstName ? (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                ) : null}
              </div>

              {/* <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="avatar">{t("childAvatar")}</Label>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {t("optional")}
                  </span>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-sm">
                        {displayAvatarUrl ? (
                          <img
                            src={displayAvatarUrl}
                            alt={
                              hasReplacementAvatar
                                ? t("childAvatarNewPreviewAlt")
                                : t("childAvatarCurrentPreviewAlt")
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                            <ImagePlus className="h-6 w-6" />
                            <span className="text-2xl leading-none">
                              {childData?.avatarEmoji || "🧒"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {hasReplacementAvatar
                            ? t("childAvatarReplacementReady")
                            : hasExistingAvatar
                              ? t("childAvatarCurrentSaved")
                              : t("childAvatarEmptyTitle")}
                        </p>
                        <p className="text-xs leading-5 text-muted-foreground">
                          {hasReplacementAvatar
                            ? hasExistingAvatar
                              ? t("childAvatarReplacementHint")
                              : t("childAvatarSelectedHint")
                            : hasExistingAvatar
                              ? t("childAvatarKeepHint")
                              : t("childAvatarHint")}
                        </p>
                      </div>
                    </div>

                    <div className="sm:ml-auto sm:w-[240px]">
                      <Input
                        ref={avatarInputRef}
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 sm:flex-none"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {hasExistingAvatar
                            ? t("childAvatarReplaceAction")
                            : t("childAvatarUploadAction")}
                        </Button>

                        {hasReplacementAvatar ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="px-3"
                            onClick={resetAvatarSelection}
                            aria-label={t("childAvatarRemoveSelected")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>

                      {avatarFile ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {avatarFile.name}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div> */}
              <div className="-mt-3 space-y-3">
  <div className="flex items-center justify-between gap-3">
    <Label htmlFor="avatar">{t("childAvatar")}</Label>

    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {t("optional")}
    </span>
  </div>

  <div className="flex h-12 items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-3">
    {/* Avatar Preview */}
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
      {displayAvatarUrl ? (
        <img
          src={displayAvatarUrl}
          alt={
            hasReplacementAvatar
              ? t("childAvatarNewPreviewAlt")
              : t("childAvatarCurrentPreviewAlt")
          }
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xl leading-none">
          {childData?.avatarEmoji || "🧒"}
        </span>
      )}
    </div>

    {/* Avatar Status */}
    <div className="min-w-0 flex-1">
      <p className="truncate text-xs font-medium text-foreground">
        {hasReplacementAvatar
          ? t("childAvatarReplacementReady")
          : hasExistingAvatar
            ? t("childAvatarCurrentSaved")
            : t("childAvatarEmptyTitle")}
      </p>

      {avatarFile ? (
        <p className="truncate text-xs text-muted-foreground">
          {avatarFile.name}
        </p>
      ) : null}
    </div>

    {/* Upload */}
    <Input
      ref={avatarInputRef}
      id="avatar"
      type="file"
      accept="image/*"
      onChange={handleAvatarChange}
      className="hidden"
    />

    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => avatarInputRef.current?.click()}
      className="shrink-0"
    >
      <Upload className="h-4 w-4" />

      {hasExistingAvatar
        ? t("childAvatarReplaceAction")
        : t("childAvatarUploadAction")}
    </Button>

    {/* Remove Selected */}
    {hasReplacementAvatar ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 shrink-0 p-0"
        onClick={resetAvatarSelection}
        aria-label={t("childAvatarRemoveSelected")}
      >
        <X className="h-4 w-4" />
      </Button>
    ) : null}
  </div>
</div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("gender")}</Label>

                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectGender")} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="male">{t("male")}</SelectItem>
                      <SelectItem value="female">{t("female")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birthDate">{t("birthDate")}</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  onBlur={() => markTouched("birthDate")}
                  aria-invalid={touched.birthDate && !!errors.birthDate}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("addChildBirthDateHint")}
                </p>
                {touched.birthDate && errors.birthDate ? (
                  <p className="text-sm text-red-500">{errors.birthDate}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <Label htmlFor="username">{t("username")}</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                onBlur={() => markTouched("username")}
                aria-invalid={touched.username && !!errors.username}
              />
              {touched.username && errors.username ? (
                <p className="text-sm text-red-500">{errors.username}</p>
              ) : null}
            </div>

            {!isEditMode ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="password">{t("password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => markTouched("password")}
                      aria-invalid={touched.password && !!errors.password}
                      className={cn("pr-12")}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-2"
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {touched.password && errors.password ? (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="repeatPassword">{t("repeatPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="repeatPassword"
                      name="repeatPassword"
                      autoComplete="new-password"
                      type={showRepeatPassword ? "text" : "password"}
                      value={repeatPassword}
                      onChange={(event) => setRepeatPassword(event.target.value)}
                      onBlur={() => markTouched("repeatPassword")}
                      aria-invalid={touched.repeatPassword && !!errors.repeatPassword}
                      className={cn("pr-12")}
                    />

                    <button
                      type="button"
                      onClick={() => setShowRepeatPassword((value) => !value)}
                      className="absolute right-2 top-2"
                      aria-label={
                        showRepeatPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {touched.repeatPassword && errors.repeatPassword ? (
                    <p className="text-sm text-red-500">{errors.repeatPassword}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-soft backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {t("addChildLearningPreferencesTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("addChildLearningPreferencesDescription")}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("readingLevel")}</Label>

                <Select value={readingLevel} onValueChange={setReadingLevel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectReadingLevel")} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="beginner">{t("beginner")}</SelectItem>
                      <SelectItem value="intermediate">
                        {t("intermediate")}
                      </SelectItem>
                      <SelectItem value="advanced">{t("advanced")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("responseLength")}</Label>

                <Select value={responseLength} onValueChange={setResponseLength}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectResponseLength")} />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="short">{t("short")}</SelectItem>
                      <SelectItem value="medium">{t("medium")}</SelectItem>
                      <SelectItem value="detailed">{t("detailed")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label>{t("learningStyle")}</Label>

              <Select value={learningStyle} onValueChange={setLearningStyle}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectLearningStyle")} />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="story">{t("story")}</SelectItem>
                    <SelectItem value="logical">{t("logical")}</SelectItem>
                    <SelectItem value="playful">{t("playful")}</SelectItem>
                    <SelectItem value="visual">{t("visual")}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-soft backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {t("addChildContentPreferencesTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("addChildContentPreferencesDescription")}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("interests")}</Label>
                <MultiValueInput
                  values={interests}
                  draft={interestsDraft}
                  onDraftChange={setInterestsDraft}
                  onValuesChange={setInterests}
                  placeholder={t("interestsPlaceholder")}
                  t={t}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("blockedTopics")}</Label>
                <MultiValueInput
                  values={blockedTopics}
                  draft={blockedTopicsDraft}
                  onDraftChange={setBlockedTopicsDraft}
                  onValuesChange={setBlockedTopics}
                  placeholder={t("blockedTopicsPlaceholder")}
                  t={t}
                />
              </div>
            </div>
          </section>

          {submitError ? (
            <p className="text-sm text-red-500">{submitError}</p>
          ) : null}

          <div className="flex flex-col gap-3 rounded-[2rem] border border-border/50 bg-card/90 p-5 shadow-soft backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t("addChildSaveHint")}
            </p>
            <Button
              disabled={
                loading ||
                avatarLoading ||
                pageLoading ||
                !firstName.trim() ||
                !gender.trim() ||
                !birthDate ||
                !username.trim() ||
                (!isEditMode && (!password || !repeatPassword))
              }
              className="sm:min-w-[180px]"
              loading={loading || avatarLoading}
              loadingText={t("saving")}
            >
              {isEditMode ? t("updateChild") : t("createChild")}
            </Button>
          </div>
        </form>
      </main>

      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleSuccessClose();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("success")}</DialogTitle>
            <DialogDescription>{t("childCreatedSuccess")}</DialogDescription>
          </DialogHeader>

          <Button onClick={handleSuccessClose}>{t("ok")}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface MultiValueInputProps {
  values: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onValuesChange: (values: string[]) => void;
  placeholder: string;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const MultiValueInput = ({
  values,
  draft,
  onDraftChange,
  onValuesChange,
  placeholder,
  t,
}: MultiValueInputProps) => {
  const addItems = (rawValue: string) => {
    const parsed = parseMultiValueInput(rawValue);

    if (parsed.length === 0) {
      return false;
    }

    const seen = new Set(values.map((item) => item.toLowerCase()));
    const nextValues = [...values];

    for (const item of parsed) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        nextValues.push(item);
        seen.add(key);
      }
    }

    onValuesChange(nextValues);
    return true;
  };

  const commitDraft = () => {
    if (addItems(draft)) {
      onDraftChange("");
    } else {
      onDraftChange(draft.trim());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      if (draft.trim()) {
        event.preventDefault();
        commitDraft();
      }
      return;
    }

    if (event.key === "Backspace" && !draft && values.length > 0) {
      event.preventDefault();
      onValuesChange(values.slice(0, -1));
    }
  };

  return (
    <div className="rounded-xl border border-input bg-background px-3 py-3">
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
          >
            {value}
            <button
              type="button"
              onClick={() =>
                onValuesChange(values.filter((item) => item !== value))
              }
              className="text-primary/70 hover:text-primary"
              aria-label={t("removeItemLabel", { item: value })}
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(event) => {
            const nextValue = event.target.value;

            if (/[,\n]/.test(nextValue)) {
              addItems(nextValue);
              onDraftChange("");
              return;
            }

            onDraftChange(nextValue);
          }}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : t("addAnotherItem")}
          className="min-w-[180px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("multiValueHelper")}
      </p>
    </div>
  );
};

export default AddChild;
