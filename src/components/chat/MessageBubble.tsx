import { Bot, FileText, ImageIcon, Music2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type ChatAttachment = {
  kind: "image" | "audio" | "file";
  name: string;
  url?: string;
  mimeType?: string;
  description?: string;
};

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
}

const resolveAssetUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http")) {
    return url;
  }
  return `${import.meta.env.VITE_API_URL}${url}`;
};

const AttachmentCard = ({ attachment }: { attachment: ChatAttachment }) => {
  const { t } = useTranslation();
  const resolvedUrl = resolveAssetUrl(attachment.url);

  if (attachment.kind === "image") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/80">
        {resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt={attachment.name || t("chatAttachmentImage")}
            className="max-h-72 w-full object-cover"
          />
        ) : (
          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            <span>{attachment.name || t("chatAttachmentImage")}</span>
          </div>
        )}
        {attachment.description ? (
          <p className="border-t border-border/60 p-3 text-xs text-muted-foreground">
            {attachment.description}
          </p>
        ) : null}
      </div>
    );
  }

  if (attachment.kind === "audio") {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Music2 className="h-4 w-4" />
          <span>{attachment.name || t("chatAttachmentAudio")}</span>
        </div>
        {resolvedUrl ? <audio controls src={resolvedUrl} className="w-full" /> : null}
        {attachment.description ? (
          <p className="mt-2 text-xs text-muted-foreground">{attachment.description}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 p-3 text-sm">
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{attachment.name || t("chatAttachmentFile")}</span>
    </div>
  );
};

const MessageBubble = ({
  role,
  content,
  imageUrl,
  audioUrl,
  attachments = [],
  isStreaming,
}: MessageBubbleProps) => {
  const isUser = role === "user";
  const assistantImageUrl = resolveAssetUrl(imageUrl);
  const assistantAudioUrl = resolveAssetUrl(audioUrl);
  const hasContent = content.trim().length > 0;

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-fade-slide-up",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-secondary" : "bg-gradient-primary",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-white" />}
      </div>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl border px-4 py-3 shadow-soft",
          isUser ? "bg-gradient-primary text-white" : "bg-card text-card-foreground",
        )}
      >
        {hasContent ? <ReactMarkdown>{content}</ReactMarkdown> : null}

        {attachments.length > 0 ? (
          <div className={cn("space-y-3", hasContent ? "mt-3" : "")}>
            {attachments.map((attachment, index) => (
              <AttachmentCard
                key={`${attachment.kind}-${attachment.name}-${attachment.url ?? "no-url"}-${index}`}
                attachment={attachment}
              />
            ))}
          </div>
        ) : null}

        {!isUser && assistantImageUrl ? (
          <img
            src={assistantImageUrl}
            className="mt-3 max-w-xs rounded-xl border shadow"
            alt="assistant attachment"
          />
        ) : null}

        {!isUser && assistantAudioUrl ? (
          <audio controls src={assistantAudioUrl} className="mt-3 w-full" />
        ) : null}

        {isStreaming ? <span className="ml-1 inline-block animate-pulse">...</span> : null}
      </div>
    </div>
  );
};

export default MessageBubble;
