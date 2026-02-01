"use client";

import { useState, useEffect } from "react";

type Mode = "Information" | "Assistance" | "Autonomous";

export default function Home() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [participantId, setParticipantId] = useState("");
  const [mode, setMode] = useState<Mode>("Information");
  const [semester, setSemester] = useState("");
  const [examPeriod, setExamPeriod] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Logic for random but balanced mode distribution could be more complex with a backend,
    // but for a frontend-only demo, we'll use a simple rotation or random.
    // To strictly follow the "1st: Info, 2nd: Assist, 3rd: Auto, 4th: Info..." rule 
    // without a backend, we can use localStorage to track the count locally for this browser,
    // but the prompt implies a more global balancing. For now, let's use a simple local rotation.
    
    const count = parseInt(localStorage.getItem("participant_count") || "0");
    const modes: Mode[] = ["Information", "Assistance", "Autonomous"];
    const assignedMode = modes[count % 3];
    
    setMode(assignedMode);
    
    // Generate Participant ID: P-8K2F9A style
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    setParticipantId(`P-${randomStr}`);
  }, [hasConsented]);

  const handleConsent = () => {
    const count = parseInt(localStorage.getItem("participant_count") || "0");
    localStorage.setItem("participant_count", (count + 1).toString());
    setHasConsented(true);
  };

  const handleCourseToggle = (course: string) => {
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
      if (mode === "Information") {
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
    
    const showCountWarning = mode === "Information" && !isExactlyTwo && selectedCourses.length > 0;
    const showMainWarning = mode === "Information" && isExactlyTwo && !hasMainCourse;

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
                  setSemester(e.target.value);
                  setExamPeriod("");
                  setSelectedCourses([]);
                }}
                className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
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
                    onChange={(e) => setExamPeriod(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
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
                  <div className="grid grid-cols-1 gap-2">
                    {currentCourses.map((course) => (
                      <label key={course} className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedCourses.includes(course)}
                          onChange={() => handleCourseToggle(course)}
                          disabled={mode !== "Information" && !selectedCourses.includes(course) && selectedCourses.length >= 2}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">{course}</span>
                      </label>
                    ))}
                  </div>
                  {showCountWarning && (
                    <p className="text-amber-700 text-xs mt-2 ml-1">Exactly 2 exams must be selected.</p>
                  )}
                  {showMainWarning && (
                    <p className="text-amber-700 text-xs mt-2 ml-1">At least one main exam is required.</p>
                  )}
                </div>
              </>
            )}

            <div className="pt-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-xs text-gray-600 leading-normal">
                  I confirm that I have reviewed my selection and understand the constraints and outcome.
                </span>
              </label>
            </div>

            <button
              type="button"
              disabled={
                !confirmed || 
                !examPeriod || 
                (mode !== "Information" && selectedCourses.length !== 2) ||
                (selectedCourses.length === 0)
              }
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all mt-4"
            >
              Submit
            </button>
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
            onClick={() => setHasConsented(false)}
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
