import React from 'react';

interface MainFormProps {
  participantId: string;
  mode: string;
  semester: string;
  setSemester: (val: string) => void;
  examPeriod: string;
  setExamPeriod: (val: string) => void;
  selectedCourses: string[];
  setSelectedCourses: (val: string[]) => void;
  confirmed: boolean;
  setConfirmed: (val: boolean) => void;
  showErrors: boolean;
  setShowErrors: (val: boolean) => void;
  animateError: boolean;
  setAnimateError: (val: boolean) => void;
  isEditable: boolean;
  setIsEditable: (val: boolean) => void;
  setShowExecutionPreview: (val: boolean) => void;
  logEvent: (action: string, details?: any, actor?: "user" | "system") => void;
  handleSubmit: () => void;
  handleCourseToggle: (course: string) => void;
}

const MainForm = ({
  participantId,
  mode,
  semester,
  setSemester,
  examPeriod,
  setExamPeriod,
  selectedCourses,
  setSelectedCourses,
  confirmed,
  setConfirmed,
  showErrors,
  setShowErrors,
  animateError,
  setAnimateError,
  isEditable,
  setIsEditable,
  setShowExecutionPreview,
  logEvent,
  handleSubmit,
  handleCourseToggle
}: MainFormProps) => {
  const wise2025Courses = [
    "HCI (main)",
    "Digital Business Models (main)",
    "Information Architecture (Skill alignment)",
    "The User in Society (skill alignment)"
  ];
  const sose2026Courses = [
    "Market Research (main)",
    "Ethics (main)",
    "Data Analytics (skill alignment)",
    "User Behaviour Control (skill alignment)"
  ];

  const currentCourses = semester === "WiSe 2025" ? wise2025Courses : sose2026Courses;
  const isExactlyTwo = selectedCourses.length === 2;
  const hasMainCourse = selectedCourses.some(course => course.toLowerCase().includes("(main)"));

  const getExamDateTime = (course: string, semester: string, period: string) => {
    const schedule: { [key: string]: { [key: string]: { [key: string]: string } } } = {
      "WiSe 2025": {
        "1st Opp Jan-Feb": {
          "HCI (main)": "10 Feb 2026, 09:00–10:30",
          "Digital Business Models (main)": "10 Feb 2026, 12:15–13:45",
          "Information Architecture (Skill alignment)": "10 Feb 2026, 10:15–11:45",
          "The User in Society (skill alignment)": "11 Feb 2026, 09:00–10:30"
        },
        "2nd Retake Apr-May": {
          "HCI (main)": "12 May 2026, 09:00–10:30",
          "Digital Business Models (main)": "12 May 2026, 11:15–12:45",
          "Information Architecture (Skill alignment)": "13 May 2026, 09:00–10:30",
          "The User in Society (skill alignment)": "13 May 2026, 11:15–12:45"
        },
        "3rd Retake Sep": {
          "HCI (main)": "15 Sep 2026, 09:00–10:30",
          "Digital Business Models (main)": "15 Sep 2026, 11:15–12:45",
          "Information Architecture (Skill alignment)": "16 Sep 2026, 09:00–10:30",
          "The User in Society (skill alignment)": "16 Sep 2026, 11:15–12:45"
        }
      },
      "SoSe 2026": {
        "1st Opp Jun-Jul": {
          "Market Research (main)": "20 Jul 2026, 09:00–10:30",
          "Data Analytics (skill alignment)": "20 Jul 2026, 10:15–11:45",
          "Ethics (main)": "20 Jul 2026, 12:15–13:45",
          "User Behaviour Control (skill alignment)": "21 Jul 2026, 09:00–10:30"
        },
        "2nd Retake Nov": {
          "Market Research (main)": "16 Nov 2026, 09:00–10:30",
          "Data Analytics (skill alignment)": "17 Nov 2026, 09:00–10:30",
          "Ethics (main)": "16 Nov 2026, 11:15–12:45",
          "User Behaviour Control (skill alignment)": "17 Nov 2026, 11:15–12:45"
        },
        "3rd Retake Mar": {
          "Market Research (main)": "10 Mar 2027, 09:00–10:30",
          "Data Analytics (skill alignment)": "11 Mar 2027, 09:00–10:30",
          "Ethics (main)": "10 Mar 2027, 11:15–12:45",
          "User Behaviour Control (skill alignment)": "11 Mar 2027, 11:15–12:45"
        }
      }
    };
    return schedule[semester]?.[period]?.[course] || "";
  };
  
  const showCountWarning = ((mode === "Information" || mode === "Assistance") && !isExactlyTwo && selectedCourses.length > 0) || (showErrors && !isExactlyTwo);
  const showMainWarning = ((mode === "Information" || mode === "Assistance") && isExactlyTwo && !hasMainCourse) || (showErrors && isExactlyTwo && !hasMainCourse);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans text-[#171717] overflow-hidden">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-fit max-h-full">
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">
          Exam Registration: UX Management and Design
        </h1>
        <div className="flex justify-between text-sm text-gray-600 mb-6 px-2">
          <span>Participant ID: <span className="font-mono font-bold text-blue-600">{participantId}</span></span>
          <span>Mode: <span className="font-bold text-blue-600">{mode}</span></span>
        </div>

        <form className="space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select 
              value={semester}
              onChange={(e) => {
                const selectedSemester = e.target.value;
                setSemester(selectedSemester);
                logEvent("CHANGE_SEMESTER", { value: selectedSemester });
                
                setIsEditable(false);
                setConfirmed(false);
                setShowErrors(false);
                
                if (mode === "Execution") {
                  if (selectedSemester) {
                    const period = selectedSemester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul";
                    setExamPeriod(period);
                    
                    const courses = selectedSemester === "WiSe 2025" ? [
                      "HCI (main)",
                      "Information Architecture (Skill alignment)"
                    ] : [
                      "Market Research (main)",
                      "Data Analytics (skill alignment)"
                    ];
                    
                    setSelectedCourses(courses);
                    setShowExecutionPreview(true);

                    logEvent("SYSTEM_AUTOFILL", {
                      semester: selectedSemester,
                      examPeriod: period,
                      selectedCourses: courses,
                      reason: `Execution mode preview triggered`
                    }, "system");
                  }
                } else if (mode === "Assistance") {
                  if (selectedSemester) {
                    const period = selectedSemester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul";
                    setExamPeriod(period);
                    
                    const courses = selectedSemester === "WiSe 2025" ? [
                      "HCI (main)",
                      "Digital Business Models (main)",
                      "Information Architecture (Skill alignment)",
                      "The User in Society (skill alignment)"
                    ] : [
                      "Market Research (main)",
                      "Ethics (main)",
                      "Data Analytics (skill alignment)",
                      "User Behaviour Control (skill alignment)"
                    ];
                    
                    const mainCourse = courses.find(c => c.toLowerCase().includes("(main)"));
                    const skillCourse = courses.find(c => c.toLowerCase().includes("(skill alignment)") || c.toLowerCase().includes("(skill allignment)"));
                    
                    const autoSelected = [];
                    if (mainCourse) autoSelected.push(mainCourse);
                    if (skillCourse) autoSelected.push(skillCourse);
                    setSelectedCourses(autoSelected);

                    logEvent("SYSTEM_AUTOFILL", {
                      semester: selectedSemester,
                      examPeriod: period,
                      selectedCourses: autoSelected,
                      reason: `${mode} mode auto-selection`
                    }, "system");
                  } else {
                    setExamPeriod("");
                    setSelectedCourses([]);
                  }
                } else {
                  setExamPeriod("");
                  setSelectedCourses([]);
                }
                
                setConfirmed(false);
                setShowErrors(false);
              }}
              disabled={mode === "Assistance" && semester !== "" && !isEditable}
              className={`w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${(mode === "Assistance" && semester !== "" && !isEditable) ? "bg-gray-50 cursor-not-allowed opacity-75" : "bg-white"}`}
            >
              <option value="">Select Semester</option>
              <option value="WiSe 2025">WiSe 2025</option>
              <option value="SoSe 2026">SoSe 2026</option>
            </select>
          </div>

          {semester && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Period</label>
                <select 
                  value={examPeriod}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExamPeriod(val);
                    logEvent("CHANGE_EXAM_PERIOD", { value: val });
                  }}
                  disabled={mode === "Execution" || (mode === "Assistance" && !isEditable)}
                  className={`w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm ${mode === "Execution" || (mode === "Assistance" && !isEditable) ? "bg-gray-50 cursor-not-allowed opacity-75" : "bg-white"}`}
                >
                  <option value="">Select Period</option>
                  {semester === "WiSe 2025" ? (
                    <>
                      <option value="1st Opp Jan-Feb">1st Opp Jan-Feb</option>
                      <option value="2nd Retake Apr-May">2nd Retake Apr-May</option>
                      <option value="3rd Retake Sep">3rd Retake Sep</option>
                    </>
                  ) : (
                    <>
                      <option value="1st Opp Jun-Jul">1st Opp Jun-Jul</option>
                      <option value="2nd Retake Nov">2nd Retake Nov</option>
                      <option value="3rd Retake Mar">3rd Retake Mar</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Selection (select exactly 2 exams):
                </label>
                <div className={`grid grid-cols-1 gap-2 p-2 rounded-xl transition-all duration-300 ${
                  (mode === "Assistance" || mode === "Information") && showErrors 
                    ? "border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)] ring-0" 
                    : "border border-transparent"
                } ${
                  (mode === "Assistance" || mode === "Information") && animateError ? "animate-shake bg-red-50" : ""
                }`}>
                  {currentCourses.map((course) => (
                    <label key={course} className={`flex items-start p-3 rounded-lg border border-gray-100 transition-colors ${mode === "Execution" || (mode === "Assistance" && !isEditable) ? (selectedCourses.includes(course) ? "bg-blue-50 border-blue-200" : "opacity-75 cursor-not-allowed") : "hover:bg-gray-50 cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course)}
                        onChange={() => handleCourseToggle(course)}
                        disabled={mode === "Execution" || (mode === "Assistance" && !isEditable)}
                        className={`mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${ (mode === "Execution" || (mode === "Assistance" && !isEditable)) && selectedCourses.includes(course) ? "opacity-100 accent-blue-600 !cursor-default" : "disabled:opacity-50"}`}
                      />
                      <div className="ml-3 flex flex-col">
                        <span className={`text-sm ${(mode === "Execution" || (mode === "Assistance" && !isEditable)) && selectedCourses.includes(course) ? "text-blue-700 font-medium" : "text-gray-700"}`}>{course}</span>
                        {semester && (
                          <span className="text-[11px] text-gray-500 mt-0.5">
                            {getExamDateTime(course, semester, examPeriod || (semester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul"))}
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {showCountWarning && (
                  <p className="text-amber-700 text-xs mt-2 ml-1">
                    {showErrors && <span className="text-red-600 font-bold">ERROR: </span>}
                    Exactly 2 exams must be selected.
                  </p>
                )}
                {showMainWarning && (
                  <p className="text-amber-700 text-xs mt-2 ml-1">
                    {showErrors && <span className="text-red-600 font-bold">ERROR: </span>}
                    At least one main exam is required.
                  </p>
                )}
              </div>
            </>
          )}

          {mode !== "Execution" && (
            <div className="pt-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setConfirmed(val);
                    logEvent("CONFIRM_CHECKBOX", { confirmed: val });
                  }}
                  disabled={mode === "Assistance" && !semester}
                  className={`mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${(mode === "Assistance" && !semester) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                />
                <span className="ml-3 text-xs text-gray-600 leading-normal">
                  I confirm that I have reviewed my selection and understand the constraints and outcome.
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {mode !== "Execution" && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  !confirmed || 
                  !examPeriod || 
                  (selectedCourses.length === 0)
                }
                className={`${mode === "Assistance" ? "flex-[2]" : "w-full"} py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all`}
              >
                Submit
              </button>
            )}
            {mode === "Assistance" && (
              <button
                type="button"
                onClick={() => {
                  logEvent("EDIT_CLICK");
                  setIsEditable(true);
                }}
                className="flex-1 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-200 transition-all"
              >
                Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MainForm;
