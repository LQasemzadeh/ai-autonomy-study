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
  setSubmitAttempts
}: ExecutionPreviewProps) => {
  const getExamDateTime = (course: string, semester: string) => {
    // In Execution mode, it's always the 1st opportunity
    const period = semester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul";
    const schedule: { [key: string]: { [key: string]: { [key: string]: string } } } = {
      "WiSe 2025": {
        "1st Opp Jan-Feb": {
          "HCI (main)": "10 Feb 2026, 09:00–10:30",
          "Digital Business Models (main)": "10 Feb 2026, 11:30–13:00",
          "Information Architecture (Skill alignment)": "10 Feb 2026, 10:15–11:45",
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
              setConfirmed(e.target.checked);
              setShowErrors(false);
              logEvent("CONFIRM_CHECKBOX_PREVIEW", { confirmed: e.target.checked });
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
              logEvent("SUBMIT_CLICK", currentSnapshot);

              if (!confirmed) {
                setSubmitAttempts(prev => prev + 1);
                setShowErrors(true);
                setAnimateError(true);
                logEvent("SUBMIT_ERROR_PREVIEW", { reason: "not_confirmed", ...currentSnapshot }, "system");
                setTimeout(() => setAnimateError(false), 500);
                return;
              }
              setIsSubmitted(true);
              logEvent("SUBMIT_SUCCESS", { source: "execution_preview", ...currentSnapshot });
              logEvent("PAGE_VIEW", { section: "ThankYou" });
            }}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all"
          >
            submit
          </button>
          <button
            onClick={() => {
              setShowExecutionPreview(false);
              setSemester("");
              setExamPeriod("");
              setSelectedCourses([]);
              setConfirmed(false);
              setShowErrors(false);
              logEvent("SKIP_EXECUTION_PREVIEW");
            }}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-all"
          >
            skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPreview;
