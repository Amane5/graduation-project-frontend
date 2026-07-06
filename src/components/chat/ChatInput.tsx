import { useEffect, useRef, useState } from "react";
import { Camera, Mic, SendHorizonal, Loader2, Square } from "lucide-react";
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
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const isDrawingUploadStep = mode === "drawing" && !drawingStarted;
  const isDrawingMessageStep = mode === "drawing" && drawingStarted;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [text]);

  const handleSend = () => {
    if ((tokenBalance ?? 0) <= 0) {
      toast.error("Your balance has expired");
      return;
    }

    if (isDrawingUploadStep) {
      if (files.length === 0) {
        toast.error("Please select a drawing");
        return;
      }

      if (!files[0]?.type.startsWith("image/")) {
        toast.error("Please upload a drawing image to begin");
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

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
    <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/80 pt-3 pb-4 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {isDrawingUploadStep ? (
          <div className="mb-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            Upload your drawing first to start a Drawing Story. Tap the camera
            button, choose your picture, then press send.
            {files[0] ? (
              <span className="block mt-2 text-primary font-medium">
                Ready to start with: {files[0].name}
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            "flex items-end gap-2 bg-card border-2 border-border/60 rounded-3xl p-2 pl-3 shadow-card transition-all duration-200",
            "focus-within:border-primary focus-within:shadow-glow",
          )}
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setFiles((prev) => [...prev, ...selected]);
            }}
          />

          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            hidden
            onChange={(e) => {
              const selected = Array.from(e.target.files || []);
              setFiles((prev) => [...prev, ...selected]);
            }}
          />

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all shrink-0"
            aria-label="Upload image"
          >
            <Camera className="w-5 h-5" />
          </button>

          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => onModeChange?.("normal")}
              className={
                mode === "normal"
                  ? "bg-black text-white px-3 py-1 rounded"
                  : "px-3 py-1"
              }
            >
              ðŸ’¬ Normal
            </button>

            <button
              type="button"
              onClick={() => onModeChange?.("journey")}
              className={
                mode === "journey"
                  ? "bg-black text-white px-3 py-1 rounded"
                  : "px-3 py-1"
              }
            >
              ðŸŒ Journey
            </button>

            <button
              type="button"
              onClick={() => onModeChange?.("drawing")}
              className={
                mode === "drawing"
                  ? "bg-black text-white px-3 py-1 rounded"
                  : "px-3 py-1"
              }
            >
              ðŸŽ¨ Drawing Story
            </button>
          </div>

          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              isDrawingUploadStep
                ? "Upload a drawing to begin your story..."
                : "Ask Sparky anything... ðŸŒŸ"
            }
            rows={1}
            disabled={disabled || isDrawingUploadStep}
            className="flex-1 resize-none bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground/70 py-2.5 max-h-40 leading-relaxed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={isDrawingUploadStep}
            className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all shrink-0 disabled:opacity-40 disabled:hover:scale-100"
            aria-label="Record voice"
          >
            <Mic className="w-5 h-5" />
          </button>

          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={onStop}
              className="rounded-2xl h-11 w-11 shrink-0 hover:scale-105 transition-transform"
              aria-label="Stop"
            >
              <Square className="w-5 h-5 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="hero"
              onClick={handleSend}
              disabled={sendDisabled}
              className="rounded-2xl h-11 w-11 shrink-0"
              aria-label="Send"
            >
              {disabled ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <SendHorizonal className="w-5 h-5" />
              )}
            </Button>
          )}
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-2">
          ðŸ›¡ï¸ Sparky keeps things safe & friendly. Always learning together!
        </p>

        {(tokenBalance ?? 0) <= 0 ? (
          <p className="text-sm text-red-500 text-center mt-2">
            Your token balance is empty. Please recharge.
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default ChatInput;
