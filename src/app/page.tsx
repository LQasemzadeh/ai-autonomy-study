"use client";

import { useState, useEffect } from "react";

type Mode = "Information" | "Assistance" | "Execution";

export default function Home() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [mode, setMode] = useState<Mode>("Information");
  const [semester, setSemester] = useState("");
  const [examPeriod, setExamPeriod] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [animateError, setAnimateError] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [showExecutionPreview, setShowExecutionPreview] = useState(false);

  const [sessionId] = useState(() => {
    // Generate a unique session ID for this browser tab session.
    // To ensure it's unique even if participant_id is generated later, 
    // we use a random string.
    if (typeof window !== 'undefined') {
      const existing = sessionStorage.getItem("current_session_id");
      if (existing) return existing;
      const newId = `S-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      sessionStorage.setItem("current_session_id", newId);
      return newId;
    }
    return `S-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  });
  
  // --- SUPABASE CONFIGURATION ---
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

  // Helper to log events
  const logEvent = (action: string, details: any = {}, actor: "user" | "system" = "user") => {
    // Access the global ref directly to ensure we always have the latest value 
    // across all possible re-renders and closures
    const globalSeqRef = (window as any)._eventSeqRef;
    
    // Add to queue to prevent race conditions and ensure strict ordering
    if (typeof window !== 'undefined' && globalSeqRef) {
      (window as any)._logQueue = ((window as any)._logQueue || Promise.resolve()).then(async () => {
        globalSeqRef.current += 1;
        const currentSeq = globalSeqRef.current;
        sessionStorage.setItem("last_event_seq", currentSeq.toString());

        const attemptId = sessionStorage.getItem(`attempts_${sessionId}`);

        const getCurrentStep = () => {
          if (isSubmitted) return "ThankYou";
          if (hasConsented === true) return "Form";
          if (hasConsented === false) return "Declined";
          return "Consent";
        };

        const eventData = {
          participant_id: participantId,
          session_id: sessionId,
          attempt_id: attemptId ? parseInt(attemptId) : 1,
          event_seq: currentSeq,
          client_ts_ms: Date.now(),
          mode: mode,
          actor: actor,
          timestamp_iso: new Date().toISOString(),
          action: action,
          details: details,
          current_step: getCurrentStep()
        };
        
        // 1. Log to console for debugging
        console.log("LOG_EVENT:", eventData);
        
        // 2. Send to Supabase
        const isPlaceholder = SUPABASE_KEY.includes("YOUR_ANON_PUBLIC_KEY") || SUPABASE_KEY === "";
        
        if (!isPlaceholder) {
          try {
            await fetch(`${SUPABASE_URL}/rest/v1/study_logs`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
              },
              body: JSON.stringify(eventData)
            });
          } catch (error) {
            console.error("Failed to send log to Supabase:", error);
          }
        }
      });
    }
  };

  useEffect(() => {
    // Generate Participant ID: P-8K2F9A style
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newParticipantId = `P-${randomStr}`;
    setParticipantId(newParticipantId);

    // Initial landing log with the fresh ID
    // Get or create attempt ID for this session
    const attemptCount = parseInt(sessionStorage.getItem(`attempts_${sessionId}`) || "0") + 1;
    sessionStorage.setItem(`attempts_${sessionId}`, attemptCount.toString());
    
    // Ensure the ref is attached to window immediately and correctly initialized
    const initialSeq = parseInt(sessionStorage.getItem("last_event_seq") || "0");
    if (!(window as any)._eventSeqRef) {
      (window as any)._eventSeqRef = { current: initialSeq };
    }
    if (!(window as any)._logQueue) {
      (window as any)._logQueue = Promise.resolve();
    }

    // A small helper to log the first event with the correct ID immediately
    const logInitialEvent = async () => {
      // Small delay to ensure everything is initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      logEvent("PAGE_VIEW", { 
        section: "Landing/Consent",
        info: "New session/page load"
      });
    };
    
    logInitialEvent();

    // Randomize mode assignment: Information, Assistance, or Execution
    // Use sessionStorage to keep the same mode if they refresh within the same session
    const modes: Mode[] = ["Information", "Assistance", "Execution"];
    const cachedMode = sessionStorage.getItem("assigned_mode") as Mode | null;
    
    let assignedMode: Mode;
    if (cachedMode && modes.includes(cachedMode)) {
      assignedMode = cachedMode;
    } else {
      const randomIndex = Math.floor(Math.random() * 3);
      assignedMode = modes[randomIndex];
      sessionStorage.setItem("assigned_mode", assignedMode);
    }
    
    setMode(assignedMode);
  }, []);

  const handleConsent = () => {
    setHasConsented(true);
    logEvent("CONSENT_GIVEN");
    logEvent("PAGE_VIEW", { section: "Form" });
  };

  const handleSubmit = () => {
    console.log("Submit clicked, mode:", mode);
    const isExactlyTwo = selectedCourses.length === 2;
    const hasMainCourse = selectedCourses.some(c => c.includes("(main)"));
    const isValid = isExactlyTwo && hasMainCourse;
    
    const errors = [];
    if (!isExactlyTwo) errors.push("NEED_EXACTLY_2");
    if (!hasMainCourse) errors.push("NEED_MAIN_COURSE");

    const snapshot = {
      semester,
      examPeriod,
      selectedCourses,
      confirmChecked: confirmed,
      isValid,
      errors,
      mode
    };

    logEvent("SUBMIT_CLICK", snapshot);

    if (mode === "Assistance" || mode === "Information") {
      if (!isValid) {
        console.log(`${mode} mode error triggered`);
        setShowErrors(true);
        setAnimateError(true);
        logEvent("SUBMIT_ERROR", { 
          reason: !isExactlyTwo ? "not_exactly_two" : "no_main_course",
          ...snapshot 
        }, "system");
        setTimeout(() => {
          console.log("Resetting animation state");
          setAnimateError(false);
        }, 500);
        return;
      }
    }

    setIsSubmitted(true);
    logEvent("SUBMIT_SUCCESS", snapshot);
    logEvent("PAGE_VIEW", { section: "ThankYou" });
  };

  const handleCourseToggle = (course: string) => {
    // Reset errors when user makes a change
    setShowErrors(false);

    const isSelecting = !selectedCourses.includes(course);
    logEvent("TOGGLE_COURSE", { course, action: isSelecting ? "select" : "deselect" });

    if (selectedCourses.includes(course)) {
      setSelectedCourses(selectedCourses.filter(c => c !== course));
    } else {
      // In Information mode, we might want to allow more than 2 to show the warning, 
      // but the requirement says "Exactly 2 exams must be selected" warning.
      // However, it also says "if they selected only one... submit should be active".
      // Let's allow selecting up to 4 in Information mode to demonstrate the "exactly 2" warning if needed,
      // or just keep the limit and show the warning when it's 1.
      // Re-reading: "if the user didn't select two courses... Exactly 2 exams must be selected".
      // Let's keep the toggle simple.
      if (mode === "Information" || mode === "Assistance") {
        setSelectedCourses([...selectedCourses, course]);
      } else {
        if (selectedCourses.length < 2) {
          setSelectedCourses([...selectedCourses, course]);
        }
      }
    }
  };

  if (hasConsented === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white px-10 font-sans text-[#171717] text-center overflow-hidden">
        <div className="flex w-full max-w-lg flex-col items-center">
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-blue-600 sm:text-4xl">
            Thank you!
          </h1>
          <div className="space-y-1 text-[15px] leading-tight text-gray-700 sm:text-[16px]">
            <p>You have decided not to participate in this study.</p>
            <p>This decision is fully respected.</p>
            <p>No data has been collected or stored.</p>
            <p className="mt-4 font-medium text-gray-900">You may close this tab now.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white px-10 font-sans text-[#171717] text-center overflow-hidden">
        <div className="flex w-full max-w-lg flex-col items-center">
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-green-600 sm:text-3xl">
            Thank You!
          </h1>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-800">
              your exam registratiomhas been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              you may now close this tab.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasConsented === true) {
    const wise2025Courses = [
      "HCI (main)",
      "Digital Bussiness Models (main)",
      "Informationarchitechture (Skill allignment)",
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
    
    if (showExecutionPreview && mode === "Execution") {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-50 p-4 font-sans text-[#171717] overflow-hidden">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-6">your exams:</h2>
            <div className="space-y-3 mb-8">
              {selectedCourses.map((course, idx) => (
                <div key={idx} className="text-lg text-gray-800 border-b border-gray-100 pb-2">
                  {course.replace(" (main)", "").replace(" (Skill allignment)", "").replace(" (skill alignment)", "")}
                </div>
              ))}
            </div>

            <div className={`mb-6 flex items-start text-left px-2 py-2 rounded-xl transition-all duration-300 ${
              showErrors && mode === "Execution" && showExecutionPreview
                ? "border border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)] ring-0" 
                : "border border-transparent"
            } ${
              animateError && mode === "Execution" && showExecutionPreview ? "animate-shake bg-red-50" : ""
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
                  if (!confirmed) {
                    setShowErrors(true);
                    setAnimateError(true);
                    logEvent("SUBMIT_ERROR_PREVIEW", { reason: "not_confirmed" }, "system");
                    setTimeout(() => setAnimateError(false), 500);
                    return;
                  }
                  setIsSubmitted(true);
                  logEvent("SUBMIT_SUCCESS", { semester, selectedCourses, mode, source: "execution_preview" });
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
    }

    const showCountWarning = ((mode === "Information" || mode === "Assistance") && !isExactlyTwo && selectedCourses.length > 0) || (mode === "Assistance" && showErrors && !isExactlyTwo);
    const showMainWarning = ((mode === "Information" || mode === "Assistance") && isExactlyTwo && !hasMainCourse) || (mode === "Assistance" && showErrors && isExactlyTwo && !hasMainCourse);

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
                  
                  // Reset editable state and errors on any semester change
                  setIsEditable(false);
                  setConfirmed(false);
                  setShowErrors(false);
                  
                  if (mode === "Execution") {
                    if (selectedSemester) {
                      const period = selectedSemester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul";
                      setExamPeriod(period);
                      
                      const courses = selectedSemester === "WiSe 2025" ? [
                        "HCI (main)",
                        "Informationarchitechture (Skill allignment)"
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
                      // Auto-select 1st Opp
                      const period = selectedSemester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul";
                      setExamPeriod(period);
                      
                      // Auto-select one main and one skill alignment
                      const courses = selectedSemester === "WiSe 2025" ? [
                        "HCI (main)",
                        "Digital Bussiness Models (main)",
                        "Informationarchitechture (Skill allignment)",
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
                  
                  // Reset confirmed and showErrors states at the end of any change
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
                      <label key={course} className={`flex items-center p-3 rounded-lg border border-gray-100 transition-colors ${mode === "Execution" || (mode === "Assistance" && !isEditable) ? (selectedCourses.includes(course) ? "bg-blue-50 border-blue-200" : "opacity-75 cursor-not-allowed") : "hover:bg-gray-50 cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course)}
                          onChange={() => handleCourseToggle(course)}
                          disabled={mode === "Execution" || (mode === "Assistance" && !isEditable)}
                          className={`w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${ (mode === "Execution" || (mode === "Assistance" && !isEditable)) && selectedCourses.includes(course) ? "opacity-100 accent-blue-600 !cursor-default" : "disabled:opacity-50"}`}
                        />
                        <span className={`ml-3 text-sm ${(mode === "Execution" || (mode === "Assistance" && !isEditable)) && selectedCourses.includes(course) ? "text-blue-700 font-medium" : "text-gray-700"}`}>{course}</span>
                      </label>
                    ))}
                  </div>
                  {showCountWarning && (
                    <p className="text-amber-700 text-xs mt-2 ml-1">
                      {mode === "Assistance" && showErrors && <span className="text-red-600 font-bold">ERROR: </span>}
                      Exactly 2 exams must be selected.
                    </p>
                  )}
                  {showMainWarning && (
                    <p className="text-amber-700 text-xs mt-2 ml-1">
                      {mode === "Assistance" && showErrors && <span className="text-red-600 font-bold">ERROR: </span>}
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
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-white px-10 font-sans text-[#171717] overflow-hidden">
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        {/* Globe Icon */}
        <div className="mb-4 text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mb-4 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          GDPR Consent Statement
        </h1>

        {/* Content */}
        <div className="space-y-3 text-left text-[14px] leading-relaxed text-gray-700 sm:text-[15px]">
          <p>
            You are invited to participate in a short academic study about AI autonomy levels in a digital workflow.
          </p>

          <p>
            What we collect: interaction data such as clicks, timestamps, and form submission events.
            We do not collect personal identifiers. Please do not enter personal data.
          </p>

          <p>
            Participation is voluntary. You can stop at any time by closing the browser tab. Data will be
            used for academic research only.
          </p>

          <p>
            By clicking &ldquo;I consent&rdquo;, you confirm you are at least 18 years old and agree to participate.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex w-full flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
          <button 
            onClick={handleConsent}
            className="h-10 w-full max-w-[200px] rounded-full bg-[#3b82f6] text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            I consent
          </button>
          <button 
            onClick={() => {
              logEvent("CONSENT_DECLINED");
              setHasConsented(false);
            }}
            className="h-10 w-full max-w-[200px] rounded-full bg-[#e5e7eb] text-sm font-medium text-gray-900 transition-all hover:bg-gray-300 active:scale-[0.98]"
          >
            I do not consent
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-[11px] text-gray-500 sm:text-xs">
          Contact: zahra.qasemzadeh@pfh.de
        </footer>
      </div>
    </div>
  );
}
