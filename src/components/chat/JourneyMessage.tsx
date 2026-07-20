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
          📖 Introduction
        </h3>
        <p>{intro}</p>
      </div>
      )}
      
      {story && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          📚 Story
        </h3>

        <p>{story}</p>
      </div>
      )}
      
      {explanation && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          🧠 Explanation
        </h3>

        <p>{explanation}</p>
      </div>
      )}
      
      {facts && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          🌟 Facts
        </h3>

        <div className="whitespace-pre-wrap">
          {facts}
        </div>
      </div>
      )}

      {challenge && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          🎯 Challenge
        </h3>
        <p>{challenge}</p>
      </div>
      )}
      
      {questions && (
      <div className="bg-card rounded-2xl p-5 border">
        <h3 className="font-bold mb-2">
          ❓ Questions
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