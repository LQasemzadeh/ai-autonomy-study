"use client";

import { useState, useEffect } from "react";
import DeclineView from "@/components/DeclineView";
import ThankYouView from "@/components/ThankYouView";
import ExecutionPreview from "@/components/ExecutionPreview";
import ConsentView from "@/components/ConsentView";
import MainForm from "@/components/MainForm";

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
    if (typeof window !== 'undefined') {
      const existing = sessionStorage.getItem("current_session_id");
      if (existing) return existing;
      const newId = `S-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      sessionStorage.setItem("current_session_id", newId);
      return newId;
    }
    return `S-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  });
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "";

  const logEvent = (action: string, details: any = {}, actor: "user" | "system" = "user") => {
    const globalSeqRef = (window as any)._eventSeqRef;
    
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
        
        console.log("LOG_EVENT:", eventData);
        
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
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newParticipantId = `P-${randomStr}`;
    setParticipantId(newParticipantId);

    const attemptCount = parseInt(sessionStorage.getItem(`attempts_${sessionId}`) || "0") + 1;
    sessionStorage.setItem(`attempts_${sessionId}`, attemptCount.toString());
    
    const initialSeq = parseInt(sessionStorage.getItem("last_event_seq") || "0");
    if (!(window as any)._eventSeqRef) {
      (window as any)._eventSeqRef = { current: initialSeq };
    }
    if (!(window as any)._logQueue) {
      (window as any)._logQueue = Promise.resolve();
    }

    const logInitialEvent = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      logEvent("PAGE_VIEW", { 
        section: "Landing/Consent",
        info: "New session/page load"
      });
    };
    
    logInitialEvent();

    const modes: Mode[] = ["Information", "Assistance", "Execution"];
    
    // Check for mode in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode') as Mode | null;
    
    let assignedMode: Mode;
    if (modeParam && modes.includes(modeParam)) {
      assignedMode = modeParam;
      sessionStorage.setItem("assigned_mode", assignedMode);
    } else {
      const cachedMode = sessionStorage.getItem("assigned_mode") as Mode | null;
      if (cachedMode && modes.includes(cachedMode)) {
        assignedMode = cachedMode;
      } else {
        const randomIndex = Math.floor(Math.random() * 3);
        assignedMode = modes[randomIndex];
        sessionStorage.setItem("assigned_mode", assignedMode);
      }
    }
    
    setMode(assignedMode);
  }, []);

  const handleConsent = () => {
    setHasConsented(true);
    logEvent("CONSENT_GIVEN");
    logEvent("PAGE_VIEW", { section: "Form" });
  };

  const handleSubmit = () => {
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
        setShowErrors(true);
        setAnimateError(true);
        logEvent("SUBMIT_ERROR", { 
          reason: !isExactlyTwo ? "not_exactly_two" : "no_main_course",
          ...snapshot 
        }, "system");
        setTimeout(() => {
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
    setShowErrors(false);

    const isSelecting = !selectedCourses.includes(course);
    logEvent("TOGGLE_COURSE", { course, action: isSelecting ? "select" : "deselect" });

    if (selectedCourses.includes(course)) {
      setSelectedCourses(selectedCourses.filter(c => c !== course));
    } else {
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
    return <DeclineView />;
  }

  if (isSubmitted) {
    return <ThankYouView />;
  }

  if (hasConsented === true) {
    if (showExecutionPreview && mode === "Execution") {
      return (
        <ExecutionPreview
          selectedCourses={selectedCourses}
          confirmed={confirmed}
          setConfirmed={setConfirmed}
          setShowErrors={setShowErrors}
          showErrors={showErrors}
          animateError={animateError}
          setAnimateError={setAnimateError}
          logEvent={logEvent}
          setIsSubmitted={setIsSubmitted}
          setShowExecutionPreview={setShowExecutionPreview}
          setSemester={setSemester}
          setExamPeriod={setExamPeriod}
          setSelectedCourses={setSelectedCourses}
          semester={semester}
          mode={mode}
        />
      );
    }

    return (
      <MainForm
        participantId={participantId}
        mode={mode}
        semester={semester}
        setSemester={setSemester}
        examPeriod={examPeriod}
        setExamPeriod={setExamPeriod}
        selectedCourses={selectedCourses}
        setSelectedCourses={setSelectedCourses}
        confirmed={confirmed}
        setConfirmed={setConfirmed}
        showErrors={showErrors}
        setShowErrors={setShowErrors}
        animateError={animateError}
        setAnimateError={setAnimateError}
        isEditable={isEditable}
        setIsEditable={setIsEditable}
        setShowExecutionPreview={setShowExecutionPreview}
        logEvent={logEvent}
        handleSubmit={handleSubmit}
        handleCourseToggle={handleCourseToggle}
      />
    );
  }

  return (
    <ConsentView
      handleConsent={handleConsent}
      logEvent={logEvent}
      setHasConsented={setHasConsented}
    />
  );
}
