"use client";

import { useCallback, useState } from "react";
import { useDropzone }           from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudUpload, FileText, Image as ImageIcon,
  AlertCircle, ScanLine,
} from "lucide-react";
import { cn }                     from "@/lib/utils";
import { useLang }                 from "@/contexts/LanguageContext";
import { AgenticDebate }          from "./AgenticDebate";
import { AnalysisResult, type AnalysisResponse } from "./AnalysisResult";

type Stage =
  | { name: "idle" }
  | { name: "preparing"; file: File; progress: number }
  | { name: "analyzing"; file: File }
  | { name: "debate_done"; file: File }
  | { name: "complete"; file: File; result: AnalysisResponse }
  | { name: "error"; message: string };

interface DropZoneProps {
  className?: string;
}

const ACCEPTED_TYPES = {
  "application/pdf":  [".pdf"],
  "image/jpeg":       [".jpg", ".jpeg"],
  "image/png":        [".png"],
  "image/webp":       [".webp"],
  "image/tiff":       [".tif", ".tiff"],
  "text/xml":         [".xml"],
  "application/xml":  [".xml"],
};

export function DropZone({ className }: DropZoneProps) {
  const { t, lang } = useLang();
  const [stage, setStage] = useState<Stage>({ name: "idle" });

  const reset = () => setStage({ name: "idle" });

  const processFile = useCallback(async (file: File) => {
    setStage({ name: "preparing", file, progress: 20 });
    await new Promise((r) => setTimeout(r, 300));
    setStage({ name: "preparing", file, progress: 70 });
    await new Promise((r) => setTimeout(r, 200));
    setStage({ name: "preparing", file, progress: 100 });
    await new Promise((r) => setTimeout(r, 150));
    setStage({ name: "analyzing", file });
  }, []);

  const onDebateComplete = useCallback(async () => {
    if (stage.name !== "analyzing") return;
    const { file } = stage;

    setStage({ name: "debate_done", file });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body:   formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Analysis failed" }));
        setStage({ name: "error", message: err.error ?? "Analysis failed" });
        return;
      }

      const result: AnalysisResponse = await res.json();
      setStage({ name: "complete", file, result });
    } catch (err) {
      setStage({ name: "error", message: String(err) });
    }
  }, [stage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop:   (accepted) => { if (accepted[0]) processFile(accepted[0]); },
    accept:   ACCEPTED_TYPES,
    maxSize:  25 * 1024 * 1024,
    multiple: false,
    disabled: stage.name !== "idle",
  });

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">

        {stage.name === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300",
                isDragActive
                  ? "border-[#5C2E0E] bg-[#EDE0CC]/60 scale-[1.005]"
                  : "border-[#C4A882] bg-[#FAF5EE] hover:border-[#8B5A35] hover:bg-[#EDE0CC]/40 hover:shadow-alinma-sm"
              )}
            >
              <input {...getInputProps()} />
              <CornerBrackets active={isDragActive} />

              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(93,46,14,0.10) 1.5px, transparent 1.5px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative flex flex-col items-center gap-5">
                <div className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isDragActive
                    ? "border-[#5C2E0E] bg-[#5C2E0E]"
                    : "border-[#C4A882] bg-white group-hover:border-[#8B5A35]"
                )}>
                  {isDragActive
                    ? <ScanLine className="h-9 w-9 text-white animate-bounce" />
                    : <CloudUpload className="h-9 w-9 text-[#8B5A35] group-hover:text-[#5C2E0E] transition-colors" />
                  }
                </div>

                <div className="space-y-1.5">
                  <p className="text-xl font-bold text-[#3D1A08]">
                    {isDragActive ? t("dropDragging") : t("dropIdle")}
                  </p>
                  <p className="text-sm text-[#8B5A35] max-w-sm mx-auto">{t("dropSubIdle")}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { label: "PDF",       icon: FileText  },
                    { label: "JPG / PNG", icon: ImageIcon },
                    { label: "XML",       icon: FileText  },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-1.5 rounded-full border border-[#D9C5A8] bg-white px-3 py-1 text-[11px] font-bold text-[#6B3518]">
                      <f.icon className="h-3 w-3" />{f.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {stage.name === "preparing" && (
          <motion.div
            key="preparing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-[#C4A882] bg-[#FAF5EE] p-8"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C4A882] bg-white">
                <FileText className="h-7 w-7 text-[#5C2E0E]" />
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" strokeWidth="3" stroke="#EDE0CC" />
                  <motion.circle
                    cx="32" cy="32" r="28" fill="none" strokeWidth="3"
                    stroke="#5C2E0E" strokeLinecap="round"
                    strokeDasharray={176}
                    initial={{ strokeDashoffset: 176 }}
                    animate={{ strokeDashoffset: 176 * (1 - stage.progress / 100) }}
                    transition={{ duration: 0.4 }}
                  />
                </svg>
              </div>
              <div>
                <p className="font-bold text-[#3D1A08]">
                  {lang === "ar" ? "جاري تجهيز الفاتورة للتحليل..." : "Preparing invoice for analysis..."}
                </p>
                <p className="text-sm text-[#8B5A35] truncate max-w-xs">{stage.file.name}</p>
              </div>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#EDE0CC]">
                <motion.div
                  className="h-full rounded-full bg-[#5C2E0E]"
                  animate={{ width: `${stage.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {(stage.name === "analyzing" || stage.name === "debate_done") && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AgenticDebate
              fileName={stage.file.name}
              onComplete={stage.name === "analyzing" ? onDebateComplete : undefined}
            />
            {stage.name === "debate_done" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-xl border border-[#C4A882] bg-[#FAF5EE] px-4 py-3 text-center"
              >
                <p className="text-sm font-semibold text-[#5C2E0E] flex items-center justify-center gap-2">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-[#5C2E0E]"
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, delay: i * 0.2, repeat: Infinity }}
                      />
                    ))}
                  </span>
                  {lang === "ar" ? "الوكلاء انتهوا، جارٍ دمج النتائج..." : "Agents complete, consolidating results..."}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {stage.name === "complete" && (
          <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalysisResult
              result={stage.result}
              fileName={stage.file.name}
              onReset={reset}
            />
          </motion.div>
        )}

        {stage.name === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border-2 border-[#C0392B]/40 bg-[#FDEDEC] p-8 text-center"
          >
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-[#C0392B]" />
            <p className="font-bold text-[#C0392B] mb-1">
              {lang === "ar" ? "فشل التحليل" : "Analysis Failed"}
            </p>
            <p className="text-sm text-[#6B3518] mb-4">{stage.message}</p>
            <button
              onClick={reset}
              className="rounded-xl border border-[#C0392B]/30 bg-white px-4 py-2 text-sm font-semibold text-[#C0392B] hover:bg-[#FDEDEC] transition-colors"
            >
              {lang === "ar" ? "حاول مجدداً" : "Try again"}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function CornerBrackets({ active }: { active: boolean }) {
  return (
    <>
      {[
        "top-0 right-0 border-t-2 border-r-2",
        "top-0 left-0  border-t-2 border-l-2",
        "bottom-0 right-0 border-b-2 border-r-2",
        "bottom-0 left-0  border-b-2 border-l-2",
      ].map((cls, i) => (
        <span
          key={i}
          className={cn("pointer-events-none absolute h-5 w-5", cls)}
          style={{ borderColor: active ? "#5C2E0E" : "#C4A882" }}
        />
      ))}
    </>
  );
}
