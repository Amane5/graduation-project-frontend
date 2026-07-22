type Props = {
  content: string;
  audioUrl?: string;
  imageUrl?: string;
};

function extractSection(
  text: string,
  start: string,
  end?: string,
) {
  const startIndex = text.indexOf(start);

  if (startIndex === -1) return "";

  const contentStart = startIndex + start.length;

  const endIndex = end
    ? text.indexOf(end, contentStart)
    : text.length;

  return text
    .substring(contentStart, endIndex)
    .trim();
}

function isArabic(text: string) {
  const arabicChars = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latinChars = text.match(/[A-Za-z]/g)?.length ?? 0;

  return arabicChars > latinChars;
}

export default function JourneyMessage({
  content,audioUrl,
  imageUrl,
}: Props) {

  const title = extractSection(
    content,
    "[[TITLE]]",
    "[[INTRODUCTION]]"
  );

  const intro = extractSection(
    content,
    "[[INTRODUCTION]]",
    "[[STORY]]"
  );

  const story = extractSection(
    content,
    "[[STORY]]",
    "[[EXPLANATION]]"
  );

  const explanation = extractSection(
    content,
    "[[EXPLANATION]]",
    "[[FACTS]]"
  );

  const facts = extractSection(
    content,
    "[[FACTS]]",
    "[[CHALLENGE]]"
  );

  const challenge = extractSection(
    content,
    "[[CHALLENGE]]",
    "[[QUESTIONS]]"
  );

  const questions = extractSection(
    content,
    "[[QUESTIONS]]",
    "[[IMAGE_PROMPT]]"
  );

  const arabic = isArabic(
    `${title} ${intro} ${story} ${explanation} ${facts} ${challenge} ${questions}`
  );

  const labels = arabic
    ? {
        introduction: "مقدمة",
        story: "القصة",
        explanation: "الشرح",
        facts: "حقائق",
        challenge: "التحدي",
        questions: "الأسئلة",
      }
    : {
        introduction: "Introduction",
        story: "Story",
        explanation: "Explanation",
        facts: "Facts",
        challenge: "Challenge",
        questions: "Questions",
      };

  return (
    <div className="space-y-4">
        {audioUrl && (
        <audio
            controls
            src={`${import.meta.env.VITE_API_URL}${audioUrl}`}
            className="w-full mt-4"
        />
        )}
      {title && (
      <div className="bg-card rounded-2xl p-5 border">
        <h2 className="text-xl font-bold">
          🚀 {title}
        </h2>
      </div>
      )}
        
      {intro && (
        <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          📖 {labels.introduction}
        </h3>
        <p>{intro}</p>
      </div>
      )}
      
      {story && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          📚 {labels.story}
        </h3>

        <p>{story}</p>
      </div>
      )}
      
      {explanation && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          🧠 {labels.explanation}
        </h3>

        <p>{explanation}</p>
      </div>
      )}
      
      {facts && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          🌟 {labels.facts}
        </h3>

        <div className="whitespace-pre-wrap">
          {facts}
        </div>
      </div>
      )}

      {challenge && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          🎯 {labels.challenge}
        </h3>
        <p>{challenge}</p>
      </div>
      )}
      
      {questions && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          ❓ {labels.questions}
        </h3>

        <div className="whitespace-pre-wrap">
          {questions}
        </div>
      </div>
      )}
      
    {imageUrl && (
    <img
        src={`${import.meta.env.VITE_API_URL}${imageUrl}`}
        className="rounded-xl w-full mt-4"
    />
    )}

   
    </div>
  );
}