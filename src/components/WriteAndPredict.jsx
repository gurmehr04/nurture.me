import { useState, useMemo, useEffect } from "react";
import { predictTextSentiment } from "../api/nurture";
import { motion, AnimatePresence } from "framer-motion";

// --- Configuration ---
const PROMPTS = [
  "Take your time… what’s on your mind today?",
  "Describe one thing weighing on your mind.",
  "What’s been draining you lately?",
  "If your day had a color, what would it be?",
  "You can rant, vent, or just talk regarding your day.",
  "What emotion feels the strongest right now?",
  "Is there something you wish someone understood?"
];

// Color mapping for the Mood Orb
const MOOD_COLORS = {
  positive: ["#FFEC95", "#FFE066", "#FFD700"], // Sunny Yellows
  negative: ["#F87171", "#EF4444", "#DC2626"], // Soft Reds
  neutral: ["#E2E8F0", "#CBD5E1", "#94A3B8"],   // Calming Grays
  crisis: ["#EF4444", "#991B1B", "#7F1D1D"],    // Deep Warning Red

  // Specific Emotions
  anxiety: ["#A78BFA", "#8B5CF6", "#7C3AED"],   // Jittery Purple
  fatigue: ["#94A3B8", "#64748B", "#475569"],    // Heavy Slate
  sadness: ["#86D5F4", "#60A5FA", "#3B82F6"],    // Melancholy Blue
  anger: ["#FCA5A5", "#F87171", "#EF4444"],    // Heated Red
  relief: ["#33CEC5", "#14B8A6", "#0D9488"],    // Soothing Teal
  joy: ["#FDE047", "#EAB308", "#CA8A04"],    // Bright Gold
};

const DEFAULT_ORB = ["#E2E8F0", "#F1F5F9", "#FFFFFF"]; // Breathing neutral

// --- Helper Components ---

const MoodOrb = ({ emotion, label, busy }) => {
  const colors = MOOD_COLORS[emotion] || MOOD_COLORS[label] || DEFAULT_ORB;

  return (
    <div className="relative flex justify-center items-center py-10">
      <motion.div
        animate={{
          scale: busy ? [1, 1.1, 1] : [1, 1.05, 1],
          rotate: busy ? 360 : 0,
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          boxShadow: [
            `0px 0px 20px ${colors[0]}80`,
            `0px 0px 40px ${colors[1]}60`,
            `0px 0px 20px ${colors[0]}80`
          ]
        }}
        transition={{
          duration: busy ? 2 : 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-32 h-32 rounded-full blur-xl absolute opacity-60"
      />
      <motion.div
        animate={{
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        }}
        className="relative w-24 h-24 rounded-full shadow-inner flex items-center justify-center text-4xl"
      >
        {busy ? "🌪️" :
          emotion === "joy" || label === "positive" ? "✨" :
            emotion === "sadness" ? "💧" :
              emotion === "anger" ? "🔥" :
                emotion === "anxiety" ? "〰️" :
                  emotion === "relief" ? "🍃" :
                    "💭"
        }
      </motion.div>
    </div>
  );
};

// --- Suggestions Data (Expanded) ---
const suggestionsByEmotion = {
  joy: [
    { title: "Celebrate", desc: "Share this good moment with a friend.", icon: "🎉" },
    { title: "Gratitude", desc: "Write down exactly why you feel good.", icon: "📝" },
  ],
  bullying: [
    { title: "Speak Up", desc: "Write down what happened to keep a record.", icon: "📝" },
    { title: "Protect Peace", desc: "Block or mute them if this is online.", icon: "🛡️" },
  ],
  anxiety: [
    { title: "Box Breathing", desc: "Inhale 4s, Hold 4s, Exhale 4s.", icon: "🌬️" },
    { title: "Grounding", desc: "List 5 things you can see right now.", icon: "👀" },
  ],
  fatigue: [
    { title: "Hydrate", desc: "Drink a full glass of water.", icon: "💧" },
    { title: "Digital Break", desc: "Close your eyes for 2 minutes.", icon: "😌" },
  ],
  loneliness: [
    { title: "Reach Out", desc: "Send a 'thinking of you' text.", icon: "📱" },
    { title: "Comfort", desc: "Wrap yourself in a warm blanket.", icon: "🧣" },
  ],
  anger: [
    { title: "Cool Down", desc: "Splash cold water on your face.", icon: "❄️" },
    { title: "Release", desc: "Scribble on paper to let it out.", icon: "🖊️" },
  ],
  sadness: [
    { title: "Small Joy", desc: "Listen to one favorite song.", icon: "🎶" },
    { title: "Self Hug", desc: "Give yourself a literal hug.", icon: "🫂" },
  ],
  general: [
    { title: "Journal", desc: "Write one thing you need right now.", icon: "📔" },
    { title: "Walk", desc: "Take a 5-minute walk outside.", icon: "🚶" },
  ],
  crisis: [
    { title: "Tele-MANAS", desc: "Call 14416 for 24/7 free support.", icon: "🇮🇳" },
    { title: "Vandrevala", desc: "Call +91 9999 666 555 for help.", icon: "🤝" },
  ]
};

// --- Main Component ---
export default function WriteAndPredict() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [promptIdx, setPromptIdx] = useState(0);

  // Rotate prompts every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIdx(prev => (prev + 1) % PROMPTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const canSubmit = text.trim().length >= 3 && !busy;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setBusy(true);
    setResult(null);

    // Simulate a "thinking" pause for better UX feeling
    await new Promise(r => setTimeout(r, 800));

    try {
      const res = await predictTextSentiment(text.trim());
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const emotion = result?.emotion_detected || "general";

  // Safe logic for crisis labeling
  const effectiveEmotion = result?.label === 'crisis' ? 'crisis' : emotion;
  const currentTips = suggestionsByEmotion[effectiveEmotion] || suggestionsByEmotion.general;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl"
      >
        {/* Header Area */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#33CEC5] to-[#86D5F4] mb-2">
            Your Safe Space
          </h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={promptIdx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-gray-500 font-medium h-6"
            >
              {PROMPTS[promptIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Input Card */}
        <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl shadow-xl p-2 relative overflow-hidden group">
          {/* Subtle glow effect behind card */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFEC95]/20 via-transparent to-[#86D5F4]/20 pointer-events-none group-hover:opacity-75 transition-opacity" />

          <form onSubmit={submit} className="relative z-10 p-4">
            <textarea
              className="w-full min-h-[200px] bg-transparent resize-none outline-none text-gray-700 text-lg placeholder-gray-400/70 leading-relaxed font-medium"
              placeholder="Start writing..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                backgroundImage: "linear-gradient(transparent, transparent 31px, #e5e7eb 31px)",
                backgroundSize: "100% 32px",
                lineHeight: "32px",
                paddingTop: "6px"
              }}
            />

            <div className="flex justify-between items-center mt-4 border-t border-gray-100 pt-3">
              <div className="text-xs text-gray-400 font-medium pl-1">
                {text.length > 0 ? `${text.length} characters` : "Your thoughts are private"}
              </div>
              <button
                disabled={!canSubmit}
                type="submit"
                className={`rounded-full px-6 py-2 font-semibold text-white transition-all shadow-md transform active:scale-95
                        ${canSubmit ? 'bg-gradient-to-r from-[#33CEC5] to-[#4FD1C5] hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed'}
                     `}
              >
                {busy ? "Listening..." : "Analyze Mood"}
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Result Section */}
        <AnimatePresence>
          {(busy || result) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 overflow-hidden"
            >
              <div className="flex flex-col items-center">
                {/* Visualization */}
                <MoodOrb
                  emotion={effectiveEmotion}
                  label={result?.label}
                  busy={busy}
                />

                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    {/* Empathetic Summary */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#f0f0f0] mb-6 text-center">
                      <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed">
                        "{result.summary}"
                      </p>
                      <p className="text-sm text-gray-400 mt-4 font-medium uppercase tracking-widest">
                        Detected: {effectiveEmotion}
                      </p>
                    </div>

                    {/* Suggestion Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentTips.map((tip, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -5 }}
                          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4"
                        >
                          <div className="bg-gray-50 text-2xl p-3 rounded-xl">
                            {tip.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">{tip.title}</h3>
                            <p className="text-sm text-gray-500">{tip.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {result.label === 'crisis' && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-sm flex items-start gap-3">
                        <span className="text-2xl">🇮🇳</span>
                        <div>
                          <p className="font-bold">Immediate Support Available in India</p>
                          <p>If you feel unsafe, please call 14416 (Tele-MANAS) or 112. You matter.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
