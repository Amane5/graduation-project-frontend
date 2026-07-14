import type { TFunction } from "i18next";

import i18n from "@/i18n/i18n";

export type FeedbackTone = "loading" | "success" | "error" | "info";

export interface LocalizedText {
  key: string;
  values?: Record<string, string | number>;
}

export interface LocalizedFeedbackState {
  tone: FeedbackTone;
  title?: LocalizedText;
  message: LocalizedText;
}

const LEGACY_I18N_KEY_MAP: Record<string, string> = {
  "AI started writing the story...": "progress_writing_story",
  "✍️ Writing story...": "progress_writing_story",
  "✍️ Writing story scenes...": "progress_writing_scenes",
  "🎨 Creating illustrations...": "progress_generating_images",
  "🎙️ Generating audio...": "progress_generating_audio",
  "🎤 Generating narration...": "progress_generating_audio",
  "✅ Story completed!": "progress_story_completed",
  "AI Response Ready": "notification_ai_response_ready_title",
  "Your Answer Is Ready": "notification_ai_response_ready_body",
};

export const resolveI18nKey = (key?: string | null) => {
  if (!key) {
    return "";
  }

  return LEGACY_I18N_KEY_MAP[key] ?? key;
};

export const translateI18nKey = (
  key?: string | null,
  t: TFunction = i18n.t.bind(i18n),
) => {
  const resolvedKey = resolveI18nKey(key);

  if (!resolvedKey) {
    return "";
  }

  return t(resolvedKey);
};

export const translateLocalizedText = (
  text: LocalizedText | undefined,
  t: TFunction = i18n.t.bind(i18n),
) => {
  if (!text) {
    return "";
  }

  return t(resolveI18nKey(text.key), text.values);
};
