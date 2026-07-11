import { useEffect, useState } from "react";
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

const AttachmentCard = ({
  attachment,
  isUser,
}: {
  attachment: ChatAttachment;
  isUser: boolean;
}) => {
  const { t } = useTranslation();
  const resolvedUrl = resolveAssetUrl(attachment.url);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [resolvedUrl]);

  if (attachment.kind === "image") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-2xl border",
          isUser ? "border-white/20 bg-white/10" : "border-border/60 bg-background/80",
        )}
      >
        {resolvedUrl && !imageLoadFailed ? (
          <img
            src={resolvedUrl}
            alt={attachment.name || t("chatAttachmentImage")}
            className="max-h-72 w-full object-cover"
            loading="lazy"
            onError={() => setImageLoadFailed(true)}
          />
        ) : (
          <div
            className={cn(
              "flex min-h-28 items-center gap-2 p-3 text-sm",
              isUser ? "text-white/80" : "text-muted-foreground",
            )}
          >
            <ImageIcon className="h-4 w-4" />
            <span>{attachment.name || t("chatAttachmentImage")}</span>
          </div>
        )}
        {attachment.description ? (
          <p
            className={cn(
              "border-t p-3 text-xs",
              isUser
                ? "border-white/15 text-white/80"
                : "border-border/60 text-muted-foreground",
            )}
          >
            {attachment.description}
          </p>
        ) : null}
      </div>
    );
  }

  if (attachment.kind === "audio") {
    return (
      <div
        className={cn(
          "rounded-2xl border p-3",
          isUser ? "border-white/20 bg-white/10" : "border-border/60 bg-background/80",
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Music2 className="h-4 w-4" />
          <span>{attachment.name || t("chatAttachmentAudio")}</span>
        </div>
        {resolvedUrl ? <audio controls src={resolvedUrl} className="w-full" /> : null}
        {attachment.description ? (
          <p className={cn("mt-2 text-xs", isUser ? "text-white/80" : "text-muted-foreground")}>
            {attachment.description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 text-sm",
        isUser ? "border-white/20 bg-white/10" : "border-border/60 bg-background/80",
      )}
    >
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
  const { t } = useTranslation();
  const isUser = role === "user";
  const assistantImageUrl = resolveAssetUrl(imageUrl);
  const assistantAudioUrl = resolveAssetUrl(audioUrl);
  const hasContent = content.trim().length > 0;
  const showTypingIndicator = !isUser && isStreaming && !hasContent;
  const renderAttachmentsFirst =
    isUser && attachments.some((attachment) => attachment.kind === "image");

  useEffect(() => {
    if (!import.meta.env.DEV || !isUser) {
      return;
    }

    console.debug("[chat] MessageBubble props", {
      role,
      content,
      attachments,
      imageUrl,
      audioUrl,
    });
  }, [attachments, audioUrl, content, imageUrl, isUser, role]);

  const attachmentsMarkup =
    attachments.length > 0 ? (
      <div className={cn("space-y-3", hasContent && !renderAttachmentsFirst ? "mt-3" : "")}>
        {attachments.map((attachment, index) => (
          <AttachmentCard
            key={`${attachment.kind}-${attachment.name}-${attachment.url ?? "no-url"}-${index}`}
            attachment={attachment}
            isUser={isUser}
          />
        ))}
      </div>
    ) : null;

  const contentMarkup = hasContent ? (
    <div
      className={cn(
        "prose prose-sm max-w-none break-words leading-7",
        isUser
          ? "prose-invert prose-p:text-white prose-strong:text-white prose-headings:text-white prose-a:text-white"
          : "dark:prose-invert",
        renderAttachmentsFirst ? "mt-3" : "",
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-fade-slide-up",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-soft",
          isUser ? "bg-secondary" : "bg-gradient-primary",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-white" />}
      </div>

      <div
        className={cn(
          "max-w-[85%] rounded-3xl border px-4 py-3 shadow-soft sm:max-w-[80%]",
          isUser
            ? "border-primary/20 bg-gradient-primary text-white"
            : "border-border/60 bg-card/95 text-card-foreground backdrop-blur-sm",
        )}
      >
        {renderAttachmentsFirst ? attachmentsMarkup : contentMarkup}
        {renderAttachmentsFirst ? contentMarkup : attachmentsMarkup}

        {!isUser && assistantImageUrl ? (
          <img
            src={assistantImageUrl}
            className="mt-3 max-w-xs rounded-2xl border shadow"
            alt={t("chatAttachmentImage")}
            loading="lazy"
          />
        ) : null}

        {!isUser && assistantAudioUrl ? (
          <audio controls src={assistantAudioUrl} className="mt-3 w-full" />
        ) : null}

        {showTypingIndicator ? (
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MessageBubble;
