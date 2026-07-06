import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Mic, SendHorizonal, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputProps {
  onSend: (text: string, files: File[]) => void;
  disabled?: boolean;
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
  const audioInputRef = useRef<HTMLInputElement>(null);

  const isDrawingUploadStep = mode === "drawing" && !drawingStarted;
  const isDrawingMessageStep = mode === "drawing" && drawingStarted;

  useEffect(() => {
    const textarea = taRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [text]);

  const handleSend = () => {
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

    const nextText = text.trim();

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

  const sendDisabled =
    (tokenBalance ?? 0) <= 0 ||
    disabled ||
    (isDrawingUploadStep && files.length === 0) ||
    (isDrawingMessageStep && !text.trim()) ||
    (mode !== "drawing" && !text.trim() && files.length === 0);

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/80 px-3 pb-4 pt-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {isDrawingUploadStep ? (
          <div className="mb-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {t("chatUploadDrawingHelp")}
            {files[0] ? (
              <span className="mt-2 block font-medium text-primary">
                {t("chatReadyToStart", { name: files[0].name })}
              </span>
            ) : null}
          </div>
        ) : null}

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

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={(event) => {
              const selected = Array.from(event.target.files || []);
              setFiles((prev) => [...prev, ...selected]);
            }}
          />

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary"
            aria-label={t("chatUploadImage")}
          >
            <Camera className="h-5 w-5" />
          </button>

          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => onModeChange?.("normal")}
              className={mode === "normal" ? "rounded bg-black px-3 py-1 text-white" : "px-3 py-1"}
            >
              {t("chatModeNormal")}
            </button>

            <button
              type="button"
              onClick={() => onModeChange?.("journey")}
              className={mode === "journey" ? "rounded bg-black px-3 py-1 text-white" : "px-3 py-1"}
            >
              {t("chatModeJourney")}
            </button>

            <button
              type="button"
              onClick={() => onModeChange?.("drawing")}
              className={mode === "drawing" ? "rounded bg-black px-3 py-1 text-white" : "px-3 py-1"}
            >
              {t("chatModeDrawing")}
            </button>
          </div>

          <textarea
            ref={taRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKey}
            placeholder={
              isDrawingUploadStep ? t("chatPlaceholderDrawing") : t("chatPlaceholderDefault")
            }
            rows={1}
            disabled={disabled || isDrawingUploadStep}
            className="max-h-40 flex-1 resize-none border-0 bg-transparent py-2.5 text-base leading-relaxed outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={isDrawingUploadStep}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:scale-110 hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:scale-100"
            aria-label={t("chatUploadAudio")}
          >
            <Mic className="h-5 w-5" />
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
