// import { Bot, User } from "lucide-react";
// import ReactMarkdown from "react-markdown";
// import { cn } from "@/lib/utils";

// interface MessageBubbleProps {
//   role: "user" | "assistant";
//   content: string;
//   isStreaming?: boolean;
//   audioUrl?: string;
//   imageUrl?: string;
// }

// const MessageBubble = ({ role, content, isStreaming }: MessageBubbleProps) => {
//   const isUser = role === "user";
//   return (
//     <div
//       className={cn(
//         "flex items-end gap-2 animate-fade-slide-up",
//         isUser ? "flex-row-reverse" : "flex-row",
//       )}
//     >
//       <div
//         className={cn(
//           "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-button",
//           isUser ? "bg-secondary" : "bg-gradient-primary",
//         )}
//       >
//         {isUser ? (
//           <User className="w-4 h-4 text-secondary-foreground" strokeWidth={2.5} />
//         ) : (
//           <Bot className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
//         )}
//       </div>
//       <div
//         className={cn(
//           "max-w-[80%] sm:max-w-[75%] px-4 py-3 shadow-soft border",
//           isUser
//             ? "bg-gradient-primary text-primary-foreground border-transparent rounded-2xl rounded-br-sm"
//             : "bg-card text-card-foreground border-border/50 rounded-2xl rounded-bl-sm",
//         )}
//       >
// {isUser ? (
//   <p className="text-sm leading-relaxed whitespace-pre-wrap">
//     {content}
//   </p>
// ) : (
//   <div className="space-y-3">

//     {/* MARKDOWN ONLY */}
//     <div className="prose prose-sm max-w-none prose-p:my-2 prose-p:leading-relaxed prose-strong:text-primary prose-ul:my-2 prose-li:my-0.5">
      
//       <ReactMarkdown>{content || "…"}</ReactMarkdown>

//       {isStreaming && (
//         <span className="inline-block w-1.5 h-4 bg-primary/70 ml-0.5 align-middle animate-pulse rounded-sm" />
//       )}
//     </div>

//     {/* IMAGE */}
//     {imageUrl && (
//       <img
//         src={`${import.meta.env.VITE_API_URL}${imageUrl}`}
//         alt="AI generated"
//         className="rounded-2xl w-full max-w-xs border"
//       />
//     )}

//     {/* AUDIO */}
//     {audioUrl && (
//       <audio controls className="w-full">
//         <source
//           src={`${import.meta.env.VITE_API_URL}${audioUrl}`}
//           type="audio/mpeg"
//         />
//       </audio>
//     )}

//   </div>
// )}
//       </div>
//     </div>
//   );
// };

// export default MessageBubble;



import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  isStreaming?: boolean;
}

const MessageBubble = ({
  role,
  content,
  imageUrl,
  audioUrl,
  isStreaming,
}: MessageBubbleProps) => {
  const isUser = role === "user";
console.log({
  role,
  content,
  imageUrl,
});
  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-fade-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-secondary" : "bg-gradient-primary"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* bubble */}
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl border shadow-soft",
          isUser
            ? "bg-gradient-primary text-white"
            : "bg-card text-card-foreground"
        )}
      >
        <ReactMarkdown>{content || "🖼️"}</ReactMarkdown>

        {/* {imageUrl && (
          <img
            src={`${import.meta.env.VITE_API_URL}${imageUrl}`}
            className="rounded-xl mt-2"
          />
        )} */}
        {imageUrl && (
  <img
    src={
      imageUrl.startsWith("blob:") ||
      imageUrl.startsWith("data:") ||
      imageUrl.startsWith("http")
        ? imageUrl
        : `${import.meta.env.VITE_API_URL}${imageUrl}`
    }
    className="rounded-xl mt-2 max-w-xs border shadow"
    alt="uploaded"
  />
)}

        {audioUrl && (
          <audio
            controls
            src={`${import.meta.env.VITE_API_URL}${audioUrl}`}
            className="mt-2 w-full"
          />
        )}

        {isStreaming && (
          <span className="inline-block animate-pulse ml-1">...</span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;