import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createChild, getChildById, updateChild } from "@/lib/children";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import PlayfulBackground from "@/components/PlayfulBackground";
import AppNavbar from "@/components/AppNavbar";
import { toast } from "sonner";
import { Child } from "@/lib/children";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/http";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Errors {
  firstName?: string;
  gender?: string;
  lastName?: string;
  birthDate?: string;
  username?: string;
  password?: string;
  repeatPassword?: string;
}

const generatePassword = (length = 10): string => {
  const lowers = "abcdefghijkmnpqrstuvwxyz";
  const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = lowers + uppers + digits;

  const required = [
    lowers[Math.floor(Math.random() * lowers.length)],
    uppers[Math.floor(Math.random() * uppers.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];

  const rest = Array.from(
    { length: length - required.length },
    () => all[Math.floor(Math.random() * all.length)],
  );

  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
};

const parseMultiValueInput = (value: string) =>
  value
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const AddChild = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const editingChild = location.state as Child | null;
  const isEditMode = !!editingChild;
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { accessToken, updateSessionUser, user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  // const [age, setAge] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<keyof Errors, boolean>>({
    firstName: false,
    lastName: false,
    gender: false,
    birthDate: false,
    username: false,
    password: false,
    repeatPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [readingLevel, setReadingLevel] = useState("");
  const [responseLength, setResponseLength] = useState("");
  const [learningStyle, setLearningStyle] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [blockedTopics, setBlockedTopics] = useState<string[]>([]);
  const [interestsDraft, setInterestsDraft] = useState("");
  const [blockedTopicsDraft, setBlockedTopicsDraft] = useState("");

  const validate = (): Errors => {
    const e: Errors = {};

    if (!firstName.trim()) e.firstName = t("firstNameRequired");

    if (!lastName.trim()) e.lastName = t("lastNameRequired");

    if (!birthDate) {
      e.birthDate = t("birthDateRequired");
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
        e.birthDate = t("ageBetween2And17");
      }
    }
    if (!username.trim()) e.username = t("usernameRequired");

    if (!isEditMode) {
      if (!password) e.password = t("passwordRequired");
      else if (password.length < 6) e.password = t("passwordMin6");

      if (password !== repeatPassword)
        e.repeatPassword = t("passwordsDontMatch");
    }

    return e;
  };

  const liveErrors = validate();
  const isValid = Object.keys(liveErrors).length === 0;

  const markTouched = (key: keyof Errors) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const v = validate();
    setErrors(v);

    if (Object.keys(v).length > 0) return;

    setLoading(true);
    setSubmitError("");

    try {
      if (isEditMode && editingChild) {
        const payload = {
          id: editingChild.id,
          firstName,
          lastName,
          gender,
          username,
          birthDate,
          readingLevel,
          responseLength,
          learningStyle,
          interests,
          blockedTopics,
        };
        await updateChild(payload);
        if (user?.id === editingChild.id) {
            updateSessionUser({
              ...user,
              gender,
              readingLevel,
              responseLength,
              learningStyle,
              interests,
              blockedTopics,
            });
        }
        console.log(">>>>>>>>>>>>>>>>", birthDate);
        toast.success(t("updated"));
        navigate("/dashboard");
      } else {
        console.log("STEP 3 CALLING CREATE CHILD");
        console.log("CALLING API WITH TOKEN:", accessToken);
        await createChild({
          firstName,
          lastName,
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

        toast.success(t("childCreatedSuccess"));
        navigate("/dashboard");
      }
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
    } finally {
      setLoading(false);
    }
  };
  // ظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظظ
  const handleSuccessClose = () => {
    setSuccessOpen(false);
    navigate("/dashboard");
  };

  useEffect(() => {
    if (!editingChild) return;

    setFirstName(editingChild.firstName || "");
    setLastName(editingChild.lastName || "");
    setGender(editingChild.gender || "");

    setUsername(editingChild.username || "");
    setBirthDate(editingChild.birthDate.split("T")[0]);
    setPassword("");
    setRepeatPassword("");

    setReadingLevel(editingChild.readingLevel || "");
    setResponseLength(editingChild.responseLength || "");
    setLearningStyle(editingChild.learningStyle || "");
    setInterests(editingChild.interests || []);
    setBlockedTopics(editingChild.blockedTopics || []);
    setInterestsDraft("");
    setBlockedTopicsDraft("");
  }, [editingChild]);
  useEffect(() => {
    if (editId && !editingChild) {
      setLoading(true);
      getChildById(editId)
        .then((res) => {
          const child = res.data;
          setFirstName(child.firstName || "");
          setLastName(child.lastName || "");
          setGender(child.gender || "");
          // setBirthDate(
          //   editingChild.birthDate.split("T")[0]
          // );
          setBirthDate(child.birthDate.split("T")[0]);
          setUsername(child.username || "");
          setReadingLevel(child.readingLevel || "");
          setResponseLength(child.responseLength || "");
          setLearningStyle(child.learningStyle || "");
          setInterests(child.interests || []);
          setBlockedTopics(child.blockedTopics || []);
          setInterestsDraft("");
          setBlockedTopicsDraft("");
        })
        .catch(() => navigate("/dashboard"))
        .finally(() => setLoading(false));
    }
  }, [editId, editingChild, navigate]);
  useEffect(() => {
    if (isEditMode) return;

    setFirstName("");
    setLastName("");
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
  }, [isEditMode, editId]);
  return (
    <div className="min-h-screen relative">
      <PlayfulBackground />

      <main className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("firstName")}</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onBlur={() => markTouched("firstName")}
            />
            {touched.firstName && errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}
          </div>

          <div>
            <Label>{t("lastName")}</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onBlur={() => markTouched("lastName")}
            />
            {touched.lastName && errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>

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
            <Label>{t("birthDate")}</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              onBlur={() => markTouched("birthDate")}
            />
            {touched.birthDate && errors.birthDate && (
              <p className="text-red-500 text-sm">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <Label>{t("username")}</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => markTouched("username")}
            />
            {touched.username && errors.username && (
              <p className="text-red-500 text-sm">{errors.username}</p>
            )}
          </div>

          {!isEditMode && (
            <>
              <div>
                <Label>{t("password")}</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => markTouched("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-2"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {touched.password && errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              <div>
                <Label>{t("repeatPassword")}</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    onBlur={() => markTouched("repeatPassword")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-2"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {touched.repeatPassword && errors.repeatPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.repeatPassword}
                  </p>
                )}
              </div>
            </>
          )}
          {/* ///////////////////////////////////////////////////////////////////////////////////////////////////////////// */}
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

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label>{t("interests")}</Label>
            <MultiValueInput
              values={interests}
              draft={interestsDraft}
              onDraftChange={setInterestsDraft}
              onValuesChange={setInterests}
              placeholder={t("interestsPlaceholder")}
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
            />
          </div>
          {submitError && <p className="text-red-500">{submitError}</p>}

          <Button
            disabled={
              loading ||
              !firstName.trim() ||
              !lastName.trim() ||
              !gender.trim() ||
              !birthDate ||
              !username.trim() ||
              (!isEditMode && (!password || !repeatPassword))
            }
          >
            {loading
              ? t("saving")
              : isEditMode
                ? t("updateChild")
                : t("createChild")}
          </Button>
        </form>
      </main>

      <Dialog
        open={successOpen}
        onOpenChange={(open) => {
          if (!open) handleSuccessClose();
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
}

const MultiValueInput = ({
  values,
  draft,
  onDraftChange,
  onValuesChange,
  placeholder,
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
              aria-label={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => {
            const nextValue = e.target.value;
            if (/[,\n]/.test(nextValue)) {
              addItems(nextValue);
              onDraftChange("");
              return;
            }

            onDraftChange(nextValue);
          }}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : "Add another item"}
          className="min-w-[180px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Type an item, then press Enter, Tab, or comma to add it.
      </p>
    </div>
  );
};

export default AddChild;
