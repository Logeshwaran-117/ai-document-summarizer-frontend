import { motion } from "framer-motion";
import { Upload as UploadIcon, BookOpen, Sparkles, Save, CheckCircle2, XCircle } from "lucide-react";

const STAGE_STEPS = [
  { key: "uploading",  label: "Upload",   Icon: UploadIcon     },
  { key: "extracting", label: "Extract",  Icon: BookOpen       },
  { key: "ai",         label: "AI",       Icon: Sparkles       },
  { key: "saving",     label: "Generate", Icon: Save           },
  { key: "done",       label: "Done",     Icon: CheckCircle2   },
];

const STAGE_ORDER = STAGE_STEPS.map((s) => s.key);

function PresentationProgress({ progress }) {
  const { stage, percent, message, error } = progress;
  const currentIdx = error ? -1 : STAGE_ORDER.indexOf(stage);

  const barBg    = error ? "var(--danger)" : percent >= 100 ? "var(--success)" : "var(--primary)";
  const titleCol = error ? "var(--danger)" : "var(--primary)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-xl"
      style={{
        background: error ? "rgba(239,68,68,.06)" : "rgba(var(--primary-rgb),.06)",
        border: `1px solid ${error ? "rgba(239,68,68,.15)" : "rgba(var(--primary-rgb),.15)"}`,
      }}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-sm" style={{ color: titleCol }}>
          {error ? "Generation Failed" : stage === "done" ? "Presentation Complete!" : "Generating Presentation..."}
        </h2>
        <span className="text-sm font-bold tabular-nums" style={{ color: error ? "var(--danger)" : "var(--primary)" }}>
          {error ? "Failed" : `${Math.round(percent)}%`}
        </span>
      </div>

      {/* Message */}
      <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{message}</p>

      {/* Bar track */}
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
        <div
          className={`h-3 rounded-full transition-all duration-500 ${stage !== "done" && !error ? "relative overflow-hidden" : ""}`}
          style={{ width: `${error ? 100 : Math.round(percent)}%`, background: barBg }}
        >
          {stage !== "done" && !error && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.4s_infinite]" />
          )}
        </div>
      </div>

      {/* Stage indicators */}
      <div className="flex justify-between mt-3">
        {STAGE_STEPS.map((step, idx) => {
          const done    = !error && currentIdx >= idx;
          const active  = !error && currentIdx === idx;
          const StepIcon = step.Icon;
          return (
            <div key={step.key} className="flex flex-col items-center gap-0.5" style={{ flex: 1 }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: done
                    ? "var(--primary)"
                    : error
                    ? "rgba(239,68,68,.15)"
                    : "var(--secondary)",
                  boxShadow: done ? "0 1px 4px rgba(var(--primary-rgb),.3)" : "none",
                }}
              >
                <StepIcon size={11} color={done ? "#fff" : error ? "var(--danger)" : "var(--muted)"} className={active && stage !== "done" ? "animate-pulse" : ""} />
              </div>
              <span
                className="text-[10px] font-medium leading-none"
                style={{
                  color: error ? "var(--danger)" : done ? "var(--primary)" : "var(--muted)",
                  opacity: error ? 1 : done ? 1 : 0.6,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--danger)" }}>
          <XCircle size={13} />
          <span>An error occurred during generation.</span>
        </div>
      )}
    </motion.div>
  );
}

export default PresentationProgress;
