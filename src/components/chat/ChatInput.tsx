import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  Loader2,
  Map,
  Mic,
  Palette,
  SendHorizonal,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchWithSession } from "@/lib/auth-session";
import { read } from "fs";

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  tokenBalance?: number;
  mode?: "normal" | "journey" | "drawing";
  onModeChange?: (mode: "normal" | "journey" | "drawing") => void;
  onStartDrawing?: (file: File) => void;
  drawingStarted: boolean;
}

const ChatInput = ({
  onSend,
  disabled,
  readOnly,
  isStreaming,
  onStop,
  tokenBalance,
  mode,
  onModeChange,
  onStartDrawing,
  drawingStarted,
}: ChatInputProps) => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // const audioInputRef = useRef<HTMLInputElement>(null);

  const isDrawingUploadStep = mode === "drawing" && !drawingStarted;
  const isDrawingMessageStep = mode === "drawing" && drawingStarted;


  const mediaRecorderRef =
  useRef<MediaRecorder | null>(null);

  const audioStreamRef =
    useRef<MediaStream | null>(null);

  const audioChunksRef =
    useRef<Blob[]>([]);

  const [isRecording, setIsRecording] =
    useState(false);

  const [isTranscribing, setIsTranscribing] =
    useState(false);


const transcribeAudio = async (audioFile: File) => {
  try {
    setIsTranscribing(true);

    const formData = new FormData();

    formData.append("audio", audioFile);

    const baseUrl =
      import.meta.env.VITE_API_URL ||
      "http://localhost:3000";

    const response = await fetchWithSession(
      `${baseUrl}/ai/speech-to-text`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(
        "Failed to transcribe audio",
      );
    }

    const data = await response.json();

    const transcribedText = data?.data?.text;

    if (
      typeof transcribedText !== "string" ||
      !transcribedText.trim()
    ) {
      toast.error(
        "No text was detected in the recording",
      );
      return;
    }

    setText((prev) => {
      if (!prev.trim()) {
        return transcribedText;
      }

      return `${prev.trim()} ${transcribedText}`;
    });
  } catch (error) {
    console.error(
      "Transcription error:",
      error,
    );

    toast.error(
      "Could not convert voice to text",
    );
  } finally {
    setIsTranscribing(false);
  }
}


const startRecording = async () => {
  try {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

    audioStreamRef.current = stream;

    const recorder =
      new MediaRecorder(stream);

    mediaRecorderRef.current =
      recorder;

    audioChunksRef.current = [];

    recorder.ondataavailable = (
      event,
    ) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(
          event.data,
        );
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(
        audioChunksRef.current,
        {
          type: recorder.mimeType,
        },
      );

      const extension =
        recorder.mimeType.includes('ogg')
          ? 'ogg'
          : 'webm';

      const audioFile = new File(
        [blob],
        `voice-message.${extension}`,
        {
          type: recorder.mimeType,
        },
      );

      audioStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      audioStreamRef.current = null;

      mediaRecorderRef.current = null;

      audioChunksRef.current = [];

      setIsRecording(false);

      await transcribeAudio(
        audioFile,
      );
    };

    recorder.start();

    setIsRecording(true);
  } catch (error) {
    console.error(
      'Failed to start recording:',
      error,
    );

    toast.error(
      'Could not access microphone',
    );
  }
};

const stopRecording = () => {
  const recorder =
    mediaRecorderRef.current;

  if (
    recorder &&
    recorder.state !== 'inactive'
  ) {
    recorder.stop();
  }
};


  const modeOptions = [
    {
      key: "normal" as const,
      label: t("chatModeNormal"),
      icon: Sparkles,
      helper: t("chatModeNormalHelper"),
    },
    {
      key: "journey" as const,
      label: t("chatModeJourney"),
      icon: Map,
      helper: t("chatModeJourneyHelper"),
    },
    {
      key: "drawing" as const,
      label: t("chatModeDrawing"),
      icon: Palette,
      helper: drawingStarted
        ? t("chatModeDrawingHelperContinue")
        : t("chatModeDrawingHelperStart"),
    },
  ] as const;

  useEffect(() => {
    const textarea = taRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [text]);

  const handleSend = () => {
    if (readOnly) {
      return;
    }
    if ((tokenBalance ?? 0) <= 0) {
      toast.error(t("chatBalanceExpired"));
      return;
    }

    if (isDrawingUploadStep) {
      if (files.length === 0) {
        toast.error(t("chatSelectDrawing"));
        return;
      }

      if (!files[0]?.type.startsWith("image/")) {
        toast.error(t("chatUploadDrawingImage"));
        return;
      }

      onStartDrawing?.(files[0]);
      setFiles([]);
      return;
    }

    const nextText = (text ?? "").trim();

    if ((!nextText && files.length === 0) || disabled) return;

    onSend(nextText, files);
    setText("");
    setFiles([]);
  };

  const handleKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };
const safeText = text ?? "";

  const sendDisabled =
    (tokenBalance ?? 0) <= 0 ||
    disabled || readOnly ||
    (isDrawingUploadStep && files.length === 0) ||
    (isDrawingMessageStep && !safeText.trim() && files.length === 0) ||
    (mode !== "drawing" && !safeText.trim() && files.length === 0);

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/80 px-3 pb-4 pt-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {readOnly ? (
          <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {t("chatParentChildConversationReadOnly")}
          </div>
        ) : null}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {modeOptions.map((option) => {
            const Icon = option.icon;
            const active = mode === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onModeChange?.(option.key)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all",
                  active
                    ? "border-primary/30 bg-primary text-primary-foreground shadow-soft"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{option.label}</span>
              </button>
            );
          })}

          <span className="ml-auto rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            {t("chatTokenCount", { count: tokenBalance ?? 0 })}
          </span>
        </div>

        <div className="mb-3 rounded-2xl border border-border/60 bg-card/75 px-4 py-3 text-sm text-foreground shadow-soft">
          <p className="font-semibold">
            {modeOptions.find((option) => option.key === mode)?.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {modeOptions.find((option) => option.key === mode)?.helper}
          </p>
          {isDrawingUploadStep ? (
            <p className="mt-2 text-xs font-medium text-primary">
              {t("chatUploadDrawingHelp")}
            </p>
          ) : null}
        </div>

        {files.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground"
              >
                <span className="max-w-[180px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) =>
                      prev.filter((_, fileIndex) => fileIndex !== index),
                    )
                  }
                  aria-label={t("removeAttachment")}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div
          className={cn(
            "flex items-end gap-2 rounded-3xl border-2 border-border/60 bg-card p-2 pl-3 shadow-card transition-all duration-200",
            "focus-within:border-primary focus-within:shadow-glow",
          )}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const selected = Array.from(event.target.files || []);
              setFiles((prev) => [...prev, ...selected]);
            }}
          />

          {/* <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={(event) => {
              const selected = Array.from(event.target.files || []);
              setFiles((prev) => [...prev, ...selected]);
            }}
          /> */}

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={readOnly}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary"
            aria-label={t("chatUploadImage")}
          >
            <Camera className="h-5 w-5" />
          </button>

          <textarea
            ref={taRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKey}
            placeholder={
              isDrawingUploadStep ? t("chatPlaceholderDrawing") : t("chatPlaceholderDefault")
            }
            rows={1}
            disabled={disabled || readOnly || isDrawingUploadStep}
            className="max-h-40 flex-1 resize-none border-0 bg-transparent py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
          />

          {/* <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={isDrawingUploadStep}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:scale-100"
            aria-label={t("chatUploadAudio")}
          >
            <Mic className="h-5 w-5" />
          </button> */}
          <button
            type="button"
            onClick={
              isRecording
                ? stopRecording
                : startRecording
            }
            disabled={
              isDrawingUploadStep ||
              disabled ||
              readOnly ||
              isStreaming ||
              isTranscribing
            }
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
              isRecording
                ? "bg-red-500 text-white hover:bg-red-600"
                : "text-muted-foreground hover:scale-110 hover:bg-primary/10 hover:text-primary",
              "disabled:opacity-40",
            )}
          >
            {isRecording ? (
              <Square className="h-5 w-5 fill-current" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={onStop}
              className="h-11 w-11 shrink-0 rounded-2xl transition-transform hover:scale-105"
              aria-label={t("chatStop")}
            >
              <Square className="h-5 w-5 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="hero"
              onClick={handleSend}
              disabled={sendDisabled}
              className="h-11 w-11 shrink-0 rounded-2xl"
              aria-label={t("send")}
            >
              {disabled ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
            </Button>
          )}
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("chatFooter")}</p>

        {(tokenBalance ?? 0) <= 0 ? (
          <p className="mt-2 text-center text-sm text-red-500">{t("chatTokenEmpty")}</p>
        ) : null}
      </div>
    </div>
  );
};

export default ChatInput;
