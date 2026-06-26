// import { useEffect, useRef, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { generateQuestionAudio, getChildStories, getMyStories, speechToTextQuestion } from "@/lib/story";
// import { submitAnswers } from "@/lib/questions";
// import Confetti from "react-confetti";

// export default function MyStories() {
//   const { childId } = useParams();
//   const navigate = useNavigate();

//   const [stories, setStories] = useState<any[]>([]);
//   const [selectedStory, setSelectedStory] = useState<any | null>(null);

//   const audioRef = useRef<HTMLAudioElement | null>(null);
//   const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

//   const [showQuestions, setShowQuestions] = useState(false);
  
//   const [answers, setAnswers] = useState<Record<number, string>>({});

//   const [answersSubmitted, setAnswersSubmitted] = useState(false);

//   const [showConfetti, setShowConfetti] = useState(false);

//   const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

//   const [recordingQuestionId, setRecordingQuestionId] = useState<number | null>(null);

//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);

//   const chunksRef = useRef<Blob[]>([]);

//   const startRecording = async (
//     questionId: number
//   ) => {
//     const stream =
//       await navigator.mediaDevices
//         .getUserMedia({
//           audio: true,
//         });

//     const recorder =
//       new MediaRecorder(stream);

//     chunksRef.current = [];

//     recorder.ondataavailable = (
//       e
//     ) => {
//       chunksRef.current.push(e.data);
//     };

//     recorder.start();

//     mediaRecorderRef.current =
//       recorder;

//     setRecordingQuestionId(
//       questionId
//     );
//   };

//   const stopRecording = async (
//   questionId: number
// ) => {
//   const recorder =
//     mediaRecorderRef.current;

//   if (!recorder) return;

//   recorder.stop();

//   recorder.onstop =
//     async () => {
//       const blob =
//         new Blob(
//           chunksRef.current,
//           {
//             type:
//               "audio/webm",
//           }
//         );

//       const res =
//         await speechToTextQuestion(
//           questionId,
//           blob
//         );
// console.log("STT RESPONSE", res);

//       setAnswers((prev) => ({
//         ...prev,
//         [questionId]:
//           res.data.text,
//       }));

//       setRecordingQuestionId(
//         null
//       );
//     };
// };

// useEffect(() => {
//   console.log("ANSWERS", answers);
// }, [answers]);
//   // ---------------- LOAD ----------------
//   useEffect(() => {
//   console.log("STORIES", stories);
// }, [stories]);

//   useEffect(() => {
//     const load = async () => {
//       const res = childId
//         ? await getChildStories(Number(childId))
//         : await getMyStories();

//       setStories(res.data);
//       console.log("API RESPONSE", res.data);
//     };

//     load();
//   }, [childId]);

//   useEffect(() => {
//   const audio = audioRef.current;
//   if (!audio || !selectedStory) return;

//   const onTimeUpdate = () => {
//     const time = audio.currentTime;

//     console.log("time:", time);

//     const index = selectedStory.scenes.findIndex(
//       (s: any) =>
//         s.startTime != null &&
//         s.endTime != null &&
//         time >= s.startTime &&
//         time < s.endTime
//     );

//     console.log("index:", index);
// console.log("SCENES:", selectedStory.scenes);
// console.log("TIME:", audio.currentTime);
// console.log("FIRST SCENE:", selectedStory.scenes?.[0]);
//     if (index !== -1) {
//       setCurrentSceneIndex(index);
//     }
//   };

//   audio.addEventListener("timeupdate", onTimeUpdate);


//   return () => audio.removeEventListener("timeupdate", onTimeUpdate);
// }, [selectedStory]);

//   useEffect(() => {
//     setCurrentSceneIndex(0);
//   }, [selectedStory]);

//   useEffect(() => {
//   if (!selectedStory) return;

//   if (
//     !selectedStory.audioUrl &&
//     currentSceneIndex === selectedStory.scenes.length - 1
//   ) {
//     setShowQuestions(true);
//   }
// }, [currentSceneIndex, selectedStory]);

//   // ---------------- GRID VIEW ----------------
//   if (!selectedStory) {
//     return (
//       <div className="p-6 grid md:grid-cols-2 gap-4">
//         {stories.map((story) => (
//           <div key={story.id} className="bg-white p-4 rounded-xl shadow">
//             <h2 className="font-bold text-xl">{story.title}</h2>

//             <p className="text-gray-600 mb-3">
//               {story.content.slice(0, 120)}...
//             </p>

//             <button
//               onClick={() => {
//                 setSelectedStory(story);
//                 setShowQuestions(false);
//                 setAnswers({});
//                 setCurrentSceneIndex(0);
//               setAnswersSubmitted(false);
//               }}
//               className="bg-blue-500 text-white px-4 py-2 rounded"
//             >
//               Open Story
//             </button>
//           </div>
//         ))}
//       </div>
//     );
//   }

//   // ---------------- PLAYER VIEW ----------------
//   const story = selectedStory;
//   const scene = story.scenes?.[currentSceneIndex];

//   const handleSubmitAnswers = async () => {
//     if(answersSubmitted) return
//     try {
//       await submitAnswers(
//         story.id,
//         {
//           answers: story.questions.map(
//               (q: any) => ({
//                 questionId: q.id,
//                 answer:
//                   answers[q.id] || "",
//               })
//             ),
//         }
//       );
//     setAnswersSubmitted(true)
//     setShowConfetti(true);
//     setTimeout(() => {
//       setShowConfetti(false);
//     }, 5000);

//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const handlePlayQuestionAudio = async (questionId: number, questionText: string) => {
//   try {
//     setPlayingAudioId(questionId);

//     const res = await generateQuestionAudio(questionId);

// const audio = new Audio(
//   `http://localhost:3000${res.data.audioUrl}`
// );

//     audio.play();

//     audio.onended = () => {
//       setPlayingAudioId(null);
//     };
//   } catch (err) {
//     console.log(err);
//     setPlayingAudioId(null);
//   }
// };
//   return (
//     <div className="fixed inset-0 bg-gray-100">
//       {/* back button */}
//       <div className="h-20 flex items-center justify-between px-6">
//         <button
//           onClick={() => setSelectedStory(null)}
//           className="mb-4 bg-gray-200 px-3 py-2 rounded"
//         >
//           ← Back
//         </button>

//         {story.audioUrl && (
//         <audio
//           ref={audioRef}
//           controls
//           // className="w-full mb-6"
//           className="w-[400px]"
//           onEnded={() => {
//           setShowQuestions(true);
//         }}
//         >
//           <source
//             src={`http://localhost:3000${story.audioUrl}`}
//             type="audio/mpeg"
//           />
//         </audio>
//         )}
//       </div>

//       <div className="h-screen flex flex-col overflow-hidden">

//         <div className="flex-1 overflow-y-auto px-4">
//           {/* scene */}
//           <div className="flex-1 px-4 flex flex-col items-center">
//             <h2 className="text-2xl font-bold mt-4">{scene?.title}</h2>

//             {showConfetti && (
//               <>
//                 <Confetti />

//                 <div className="fixed inset-0 flex items-center justify-center z-50">
//                   <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
//                     <div className="text-6xl mb-4">🏆</div>

//                     <h2 className="text-3xl font-bold">
//                       أحسنت يا بطل!
//                     </h2>

//                     <p className="mt-3">
//                       لقد أكملت أسئلة القصة بنجاح
//                     </p>
//                   </div>
//                 </div>
//               </>
//             )}
//             {scene?.imageUrl && (
//               <img
//                 src={`http://localhost:3000${scene.imageUrl}`}
//                 className="h-[65vh] w-auto object-contain"
//               />
//             )}

//             <p className="text-lg text-center mt-3 max-w-3xl leading-relaxed">
//               {scene?.content}
//             </p>
//           </div>

//           {/* privous and next buttons  */}
//           <div className="text-sm text-gray-400 mt-3">
//             Scene {currentSceneIndex + 1} / {story.scenes.length}
//             {!story.audioUrl && (
//             <div className="flex justify-between mt-4">
//               <button
//                 onClick={() =>
//                   setCurrentSceneIndex((prev) => prev - 1)
//                 }
//                 disabled={currentSceneIndex === 0}
//                 className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
//               >
//                 Previous
//               </button>

//               <button
//                 onClick={() =>
//                   setCurrentSceneIndex((prev) => prev + 1)
//                 }
//                 disabled={
//                   currentSceneIndex === story.scenes.length - 1
//                 }
//                 className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
//               >
//                 Next
//               </button>
//             </div>
//           )}
//           </div>

//           {/* questions place  */}
//           {showQuestions && (
//           <div className="mt-8 bg-white p-6 rounded-xl shadow w-full max-w-3xl mx-auto">
//             <h2 className="text-2xl font-bold mb-4">
//               Questions
//             </h2>

//             {story.questions?.map((q: any) => (
//             <div
//               key={q.id}
//               className="mb-4"
//             >
//               <div className="flex items-center gap-2 mb-2">
//                 <p className="font-medium mb-2">
//                   {q.question}
//                 </p>

//                 <button
//                   onClick={() => handlePlayQuestionAudio(q.id, q.question)}
//                   className="text-blue-600 text-xl"
//                   disabled={playingAudioId === q.id}
//                 >
//                   {playingAudioId === q.id ? "🔊..." : "🔊"}
//                 </button>

//                 <button
//                 onClick={() =>
//                   recordingQuestionId === q.id
//                     ? stopRecording(q.id)
//                     : startRecording(q.id)
//                 }
//                 className="text-red-600 text-xl"
//               >
//                 {recordingQuestionId === q.id
//                   ? "⏹️"
//                   : "🎤"}
//               </button>
//               </div>

//               <textarea
//                     className="w-full border rounded-lg p-2"
//                     value={answers[q.id] || ""}
//                     onChange={(e) =>
//                       setAnswers((prev) => ({
//                         ...prev,
//                         [q.id]: e.target.value,
//                       }))
//                     }
//                   />
//                 </div>
//             ))}

//             <button
//               disabled={answersSubmitted}
//               onClick={handleSubmitAnswers}
//               className="bg-green-600 text-white px-4 py-2 rounded-xl"
//             >
//               {answersSubmitted ? "Answers Submitted" : "Submit Answers "}
//             </button>
//           </div>
//           )}

//         </div>
//       </div>
//     </div>
//   );
// }
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateQuestionAudio, getChildStories, getMyStories, speechToTextQuestion } from "@/lib/story";
import { submitAnswers } from "@/lib/questions";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";

export default function MyStories() {
  const { childId } = useParams();
  const navigate = useNavigate();

  const [stories, setStories] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const [showQuestions, setShowQuestions] = useState(false);
  
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [answersSubmitted, setAnswersSubmitted] = useState(false);

  const [showConfetti, setShowConfetti] = useState(false);

  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);

  const [recordingQuestionId, setRecordingQuestionId] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const chunksRef = useRef<Blob[]>([]);

  const { t } = useTranslation();
  const startRecording = async (
    questionId: number
  ) => {
    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true,
        });

    const recorder =
      new MediaRecorder(stream);

    chunksRef.current = [];

    recorder.ondataavailable = (
      e
    ) => {
      chunksRef.current.push(e.data);
    };

    recorder.start();

    mediaRecorderRef.current =
      recorder;

    setRecordingQuestionId(
      questionId
    );
  };

  const stopRecording = async (
  questionId: number
) => {
  const recorder =
    mediaRecorderRef.current;

  if (!recorder) return;

  recorder.stop();

  recorder.onstop =
    async () => {
      const blob =
        new Blob(
          chunksRef.current,
          {
            type:
              "audio/webm",
          }
        );

      const res =
        await speechToTextQuestion(
          questionId,
          blob
        );
console.log("STT RESPONSE", res);

      setAnswers((prev) => ({
        ...prev,
        [questionId]:
          res.data.text,
      }));

      setRecordingQuestionId(
        null
      );
    };
};

useEffect(() => {
  console.log("ANSWERS", answers);
}, [answers]);
  // ---------------- LOAD ----------------
  useEffect(() => {
  console.log("STORIES", stories);
}, [stories]);

  useEffect(() => {
    const load = async () => {
      const res = childId
        ? await getChildStories(Number(childId))
        : await getMyStories();

      setStories(res.data);
      console.log("API RESPONSE", res.data);
    };

    load();
  }, [childId]);

  useEffect(() => {
  const audio = audioRef.current;
  if (!audio || !selectedStory) return;

  const onTimeUpdate = () => {
    const time = audio.currentTime;

    console.log("time:", time);

    const index = selectedStory.scenes.findIndex(
      (s: any) =>
        s.startTime != null &&
        s.endTime != null &&
        time >= s.startTime &&
        time < s.endTime
    );

    console.log("index:", index);
console.log("SCENES:", selectedStory.scenes);
console.log("TIME:", audio.currentTime);
console.log("FIRST SCENE:", selectedStory.scenes?.[0]);
    if (index !== -1) {
      setCurrentSceneIndex(index);
    }
  };

  audio.addEventListener("timeupdate", onTimeUpdate);


  return () => audio.removeEventListener("timeupdate", onTimeUpdate);
}, [selectedStory]);

  useEffect(() => {
    setCurrentSceneIndex(0);
  }, [selectedStory]);

  useEffect(() => {
  if (!selectedStory) return;

  if (
    !selectedStory.audioUrl &&
    currentSceneIndex === selectedStory.scenes.length - 1
  ) {
    setShowQuestions(true);
  }
}, [currentSceneIndex, selectedStory]);

  // ---------------- GRID VIEW ----------------
  if (!selectedStory) {
    return (
      <div className="p-6 grid md:grid-cols-2 gap-4">
        {stories.map((story) => (
          <div key={story.id} className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-bold text-xl">{story.title}</h2>

            <p className="text-gray-600 mb-3">
              {story.content.slice(0, 120)}...
            </p>

            <button
              onClick={() => {
                setSelectedStory(story);
                setShowQuestions(false);
                setAnswers({});
                setCurrentSceneIndex(0);
              setAnswersSubmitted(false);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Open Story
            </button>
          </div>
        ))}
      </div>
    );
  }

  // ---------------- PLAYER VIEW ----------------
  const story = selectedStory;
  const scene = story.scenes?.[currentSceneIndex];

  const handleSubmitAnswers = async () => {
    if(answersSubmitted) return
    try {
      await submitAnswers(
        story.id,
        {
          answers: story.questions.map(
              (q: any) => ({
                questionId: q.id,
                answer:
                  answers[q.id] || "",
              })
            ),
        }
      );
    setAnswersSubmitted(true)
    setShowQuestions(false);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    } catch (err) {
      console.log(err);
    }
  };

  const handlePlayQuestionAudio = async (questionId: number, questionText: string) => {
  try {
    setPlayingAudioId(questionId);

    const res = await generateQuestionAudio(questionId);

const audio = new Audio(
  `http://localhost:3000${res.data.audioUrl}`
);

    audio.play();

    audio.onended = () => {
      setPlayingAudioId(null);
    };
  } catch (err) {
    console.log(err);
    setPlayingAudioId(null);
  }
};
return (
  <div className="fixed inset-0 bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 overflow-hidden">
    {/* background */}
    <div className="absolute inset-0">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-300/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/20 blur-3xl" />
    </div>

    {/* Header */}
    <div className="relative z-50 h-20 flex items-center justify-between px-6">
      <button
        onClick={() => setSelectedStory(null)}
        className="rounded-xl bg-white px-4 py-2 shadow"
      >
        ← Back
      </button>

      <div className="w-[400px]">
        {story.audioUrl && (
          <audio
            ref={audioRef}
            controls
            className="w-full"
            onEnded={() => setShowQuestions(true)}
          >
            <source
              src={`http://localhost:3000${story.audioUrl}`}
              type="audio/mpeg"
            />
          </audio>
        )}
      </div>
    </div>

    {/* Scene */}
    <div className="relative z-10 h-[calc(100vh-80px)] flex items-center justify-center p-6">

      <div
  key={currentSceneIndex}
  className="
    w-full
    max-w-6xl
    h-full
    rounded-3xl
    bg-white/80
    backdrop-blur
    shadow-2xl
    overflow-y-auto
    flex
    flex-col
  "
>
        {/* progress */}
        <div className="px-8 pt-6">
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${
                  ((currentSceneIndex + 1) /
                    story.scenes.length) *
                  100
                }%`,
              }}
            />
          </div>

          <p className="text-center mt-2 text-sm text-slate-500">
            Scene {currentSceneIndex + 1} of {story.scenes.length}
          </p>
        </div>

        {/* confetti */}
        {showConfetti && (
  <>
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <Confetti />
    </div>

    <div className="fixed inset-0 flex items-center justify-center z-[110]">
      <div className="bg-white p-8 rounded-3xl shadow-xl text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold">Great job, champion!</h2>
        <p className="mt-3">You have successfully completed the story questions.</p>
      </div>
    </div>
  </>
)}

        {/* title */}
        <h2 className="text-4xl font-bold text-center pt-6">
          {scene?.title}
        </h2>

        {/* image */}
        <div className="h-[55vh] flex items-center justify-center px-8 py-4">
          {scene?.imageUrl && (
            <img
            src={`http://localhost:3000${scene.imageUrl}`}
            className="
              max-h-full
              max-w-full
              object-contain
            "
          />
          )}
        </div>

        {/* content */}
        <div className="px-10 pb-8">
          <p
            className="
              text-xl
              leading-9
              text-center
              text-slate-700
              max-w-4xl
              mx-auto
            "
          >
            {scene?.content}
          </p>
        </div>
      </div>

      {/* manual navigation */}
      {!story.audioUrl && (
        <>
          <button
            onClick={() =>
              setCurrentSceneIndex((prev) => prev - 1)
            }
            disabled={currentSceneIndex === 0}
            className="
              fixed
              left-6
              top-1/2
              -translate-y-1/2
              h-14
              w-14
              rounded-full
              bg-white
              shadow-xl
              text-2xl
              disabled:opacity-40
            "
          >
            ←
          </button>

          <button
            onClick={() =>
              setCurrentSceneIndex((prev) => prev + 1)
            }
            disabled={
              currentSceneIndex === story.scenes.length - 1
            }
            className="
              fixed
              right-6
              top-1/2
              -translate-y-1/2
              h-14
              w-14
              rounded-full
              bg-blue-500
              text-white
              shadow-xl
              text-2xl
              disabled:opacity-40
            "
          >
            →
          </button>
        </>
      )}
    </div>

    {/* Questions */}
    {showQuestions && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
          <h2 className="text-3xl font-bold mb-6">
            Questions
          </h2>

          {story.questions?.map((q: any) => (
            <div key={q.id} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium flex-1">
                  {q.question}
                </p>

                <button
                  onClick={() =>
                    handlePlayQuestionAudio(q.id, q.question)
                  }
                  className="text-blue-600 text-xl"
                >
                  {playingAudioId === q.id
                    ? "🔊..."
                    : "🔊"}
                </button>

                <button
                  onClick={() =>
                    recordingQuestionId === q.id
                      ? stopRecording(q.id)
                      : startRecording(q.id)
                  }
                  className="text-red-600 text-xl"
                >
                  {recordingQuestionId === q.id
                    ? "⏹️"
                    : "🎤"}
                </button>
              </div>

              <textarea
                className="w-full border rounded-xl p-3"
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [q.id]: e.target.value,
                  }))
                }
              />
            </div>
          ))}

          <button
            disabled={answersSubmitted}
            onClick={handleSubmitAnswers}
            className="
              bg-green-600
              text-white
              px-6
              py-3
              rounded-xl
            "
          >
            {answersSubmitted
              ? "Answers Submitted"
              : "Submit Answers"}
          </button>
        </div>
      </div>
    )}
  </div>
);
}
