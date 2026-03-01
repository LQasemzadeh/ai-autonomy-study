import React from 'react';

interface ExecutionPreviewProps {
  selectedCourses: string[];
  confirmed: boolean;
  setConfirmed: (val: boolean) => void;
  setShowErrors: (val: boolean) => void;
  showErrors: boolean;
  animateError: boolean;
  setAnimateError: (val: boolean) => void;
  logEvent: (action: string, details?: any, actor?: "user" | "system") => void;
  setIsSubmitted: (val: boolean) => void;
  setShowExecutionPreview: (val: boolean) => void;
  setSemester: (val: string) => void;
  setExamPeriod: (val: string) => void;
  setSelectedCourses: (val: string[]) => void;
  semester: string;
  mode: string;
  submitAttempts: number;
  setSubmitAttempts: React.Dispatch<React.SetStateAction<number>>;
  totalEdits: number;
  setTotalEdits: (val: (prev: number) => number) => void;
  interventionCount: number;
  setInterventionCount: (val: (prev: number) => number) => void;
  startTime: number | null;
  isAiGenerated: boolean;
  setIsAiGenerated: (val: boolean) => void;
  hasCompleted: boolean;
  setHasCompleted: (val: boolean) => void;
}

const ExecutionPreview = ({
  selectedCourses,
  confirmed,
  setConfirmed,
  setShowErrors,
  showErrors,
  animateError,
  setAnimateError,
  logEvent,
  setIsSubmitted,
  setShowExecutionPreview,
  setSemester,
  setExamPeriod,
  setSelectedCourses,
  semester,
  mode,
  submitAttempts,
  setSubmitAttempts,
  totalEdits,
  setTotalEdits,
  interventionCount,
  setInterventionCount,
  startTime,
  isAiGenerated,
  setIsAiGenerated,
  hasCompleted,
  setHasCompleted
}: ExecutionPreviewProps) => {
  const getExamDateTime = (course: string, semester: string) => {
    // In Execution mode, it's always the 1st opportunity
    const period = semester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul";
    const schedule: { [key: string]: { [key: string]: { [key: string]: string } } } = {
      "WiSe 2025": {
        "1st Opp Jan-Feb": {
          "HCI (main)": "10 Feb 2026, 09:00–10:30",
          "Digital Business Models (main)": "10 Feb 2026, 11:30–13:00",
          "manual Architecture (Skill alignment)": "10 Feb 2026, 10:15–11:45",
          "The User in Society (skill alignment)": "11 Feb 2026, 09:00–10:30"
        }
      },
      "SoSe 2026": {
        "1st Opp Jun-Jul": {
          "Market Research (main)": "20 Jul 2026, 09:00–10:30",
          "Data Analytics (skill alignment)": "20 Jul 2026, 10:15–11:45",
          "Ethics (main)": "20 Jul 2026, 11:30–13:00",
          "User Behaviour Control (skill alignment)": "21 Jul 2026, 09:00–10:30"
        }
      }
    };
    return schedule[semester]?.[period]?.[course] || "";
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans text-[#171717] overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-6">your exams:</h2>
        <div className="space-y-4 mb-8">
          {selectedCourses.map((course: string, idx: number) => (
            <div key={idx} className="flex flex-col items-center bg-gray-100 rounded-lg p-3 border border-gray-200">
              <span className="text-lg text-gray-800 font-medium">
                {course.replace(" (main)", "").replace(" (Skill alignment)", "").replace(" (skill alignment)", "").replace(" (Skill allignment)", "")}
              </span>
              <span className="text-sm text-gray-500 mt-1">
                {getExamDateTime(course, semester)}
              </span>
            </div>
          ))}
        </div>

      <div className={`mb-6 flex items-start text-left px-2 py-2 rounded-xl transition-all duration-300 ${
        showErrors
          ? "border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)] ring-0" 
          : "border border-transparent"
      } ${
        animateError ? "animate-shake bg-red-50" : ""
      }`}>
        <label className="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => {
              const val = e.target.checked;
              setTotalEdits(prev => prev + 1);
              if (isAiGenerated) {
                setInterventionCount(prev => prev + 1);
              }
              logEvent("FIELD_EDIT", { 
                field_name: "confirmed_preview",
                old_value: confirmed,
                new_value: val,
                was_ai_generated: isAiGenerated
              });
              setConfirmed(val);
              setIsAiGenerated(false);
              setShowErrors(false);
            }}
            className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="ml-3 text-sm text-gray-600 leading-tight group-hover:text-gray-900 transition-colors">
            I confirm that I have reviewed my selection and understand the constraints and outcome.
          </span>
        </label>
      </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              const currentSnapshot = {
                semester,
                selectedCourses,
                mode,
                confirmChecked: confirmed,
                submitAttempts: submitAttempts + 1,
                hasConflict: false // Usually auto-selected without conflict in Execution
              };

              const intervention_rate = totalEdits > 0 ? interventionCount / totalEdits : 0;
              const outcomeData = {
                final_valid: confirmed, // In execution, it's valid if confirmed
                num_conflicts: 0,
                total_edits: totalEdits,
                intervention_count: interventionCount,
                intervention_rate,
                had_intervention: interventionCount > 0,
                // total_time_ms is now calculated server-side
              };

              logEvent("SUBMIT_CLICK", {
                ...currentSnapshot,
                submit_allowed: confirmed,
                validation_passed: confirmed,
                error_codes: !confirmed ? ["CONFIRM_REQUIRED"] : []
              });

              if (!confirmed) {
                setSubmitAttempts(prev => prev + 1);
                setShowErrors(true);
                setAnimateError(true);
                logEvent("ERROR_SHOWN", { 
                  reason: "not_confirmed", 
                  error_codes: ["CONFIRM_REQUIRED"],
                  ...currentSnapshot 
                }, "system");
                setTimeout(() => setAnimateError(false), 500);
                return;
              }
              if (hasCompleted) return;
              setHasCompleted(true);
              setIsSubmitted(true);
              logEvent("TASK_COMPLETED", { source: "execution_preview", ...currentSnapshot, ...outcomeData }, "system");
              logEvent("PAGE_VIEW", { section: "ThankYou" });
            }}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all"
          >
            submit
          </button>
          <button
            onClick={() => {
              setInterventionCount(prev => prev + 1);
              logEvent("OVERRIDE", { 
                action: "skip_execution_preview",
                override_type: "skip_proposal"
              });
              setShowExecutionPreview(false);
              setSemester("");
              setExamPeriod("");
              setSelectedCourses([]);
              setConfirmed(false);
              setShowErrors(false);
            }}
            className="flex-1 py-2 bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-lg hover:bg-indigo-200 transition-all"
          >
            skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPreview;
