"use client";

import { useState, useEffect } from "react";
import DeclineView from "@/components/DeclineView";
import ThankYouView from "@/components/ThankYouView";
import ExecutionPreview from "@/components/ExecutionPreview";
import ConsentView from "@/components/ConsentView";
import MainForm from "@/components/MainForm";
import ScenarioView from "@/components/ScenarioView";

type Mode = "manual" | "Assistance" | "Execution";

export default function Home() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [showScenario, setShowScenario] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [mode, setMode] = useState<Mode>("manual");
  const [semester, setSemester] = useState("");
  const [examPeriod, setExamPeriod] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [animateError, setAnimateError] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [showExecutionPreview, setShowExecutionPreview] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [totalEdits, setTotalEdits] = useState(0);
  const [interventionCount, setInterventionCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);

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
        
        // Ensure mode and attempt_id are consistent
        const cachedMode = sessionStorage.getItem("assigned_mode") || mode;

        // Safety check for proposal_id in AI-related events
        const aiRelatedEvents = [
          "AI_SUGGESTION_SHOWN",
          "AI_SUGGESTION_ACCEPTED",
          "AI_SUGGESTION_REJECTED",
          "OVERRIDE",
          "FIELD_EDIT",
          "SUBMIT_CLICK",
          "TASK_COMPLETED"
        ];

        // proposal_id should be provided in details if it exists there, 
        // otherwise fall back to current proposalId state for Assistance/Execution modes.
        const effectiveProposalId = details.proposal_id || proposalId;

        if (aiRelatedEvents.includes(action) && cachedMode !== "manual" && !effectiveProposalId) {
          console.warn(`[LOG_WARNING] proposal_id missing for action: ${action}`);
        }

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
          mode: cachedMode,
          actor: actor,
          timestamp_iso: new Date().toISOString(),
          action: action,
          details: {
            ...details,
            proposal_id: effectiveProposalId
          },
          current_step: getCurrentStep()
        };
        
        console.log("LOG_EVENT:", eventData);
        
        const isPlaceholder = SUPABASE_KEY.includes("YOUR_ANON_PUBLIC_KEY") || SUPABASE_KEY === "";
        
        console.log("SENDING_TO_SUPABASE:", `${SUPABASE_URL}/rest/v1/study_logs`);
        
        if (!isPlaceholder) {
          try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/study_logs`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(eventData)
            });
            if (!response.ok) {
              const errorText = await response.text();
              console.error("Supabase error response:", response.status, errorText);
            } else {
              console.log("Supabase log success");
            }
          } catch (error) {
            console.error("Failed to send log to Supabase:", error);
          }
        } else {
          console.warn("Supabase logging skipped: Placeholder key detected");
        }
      });
    } else {
      console.warn("logEvent skipped: window undefined or _eventSeqRef missing", { 
        isWindowUndefined: typeof window === 'undefined',
        hasSeqRef: !!globalSeqRef 
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
    
    // Ensure logEvent is defined after global refs are set
    const logInitialEvent = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      logEvent("PAGE_VIEW", { 
        section: "Landing/Consent",
        info: "New session/page load"
      });
    };
    
    logInitialEvent();

    const modes: Mode[] = ["manual", "Assistance", "Execution"];
    
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
        // Significantly increased chance for Assistance and Execution (47.5% each) vs manual (5%)
        const rand = Math.random();
        if (rand < 0.05) {
          assignedMode = "manual";
        } else if (rand < 0.525) {
          assignedMode = "Assistance";
        } else {
          assignedMode = "Execution";
        }
        sessionStorage.setItem("assigned_mode", assignedMode);
      }
    }
    
    setMode(assignedMode);
  }, []);

  const handleConsent = () => {
    setHasConsented(true);
    setShowScenario(true);
    logEvent("CONSENT_GIVEN");
    logEvent("PAGE_VIEW", { section: "Scenario" });
  };

  const handleStartRegistration = () => {
    if (hasStarted) return;
    setShowScenario(false);
    setHasStarted(true);
    setStartTime(Date.now());
    logEvent("TASK_STARTED");
    logEvent("PAGE_VIEW", { section: "Form" });
  };

  const handleSubmit = () => {
    const getExamDateTime = (course: string, semester: string, period: string) => {
      const schedule: { [key: string]: { [key: string]: { [key: string]: string } } } = {
        "WiSe 2025": {
          "1st Opp Jan-Feb": {
            "HCI (main)": "10 Feb 2026, 09:00–10:30",
            "Digital Business Models (main)": "10 Feb 2026, 11:30–13:00",
            "manual Architecture (Skill alignment)": "10 Feb 2026, 10:15–11:45",
            "The User in Society (skill alignment)": "11 Feb 2026, 09:00–10:30"
          },
          "2nd Retake Apr-May": {
            "HCI (main)": "12 May 2026, 09:00–10:30",
            "Digital Business Models (main)": "12 May 2026, 11:30–13:00",
            "manual Architecture (Skill alignment)": "12 May 2026, 10:15–11:45",
            "The User in Society (skill alignment)": "13 May 2026, 11:15–12:45"
          },
          "3rd Retake Sep": {
            "HCI (main)": "15 Sep 2026, 09:00–10:30",
            "Digital Business Models (main)": "15 Sep 2026, 11:30–13:00",
            "manual Architecture (Skill alignment)": "15 Sep 2026, 10:15–11:45",
            "The User in Society (skill alignment)": "16 Sep 2026, 11:15–12:45"
          }
        },
        "SoSe 2026": {
          "1st Opp Jun-Jul": {
            "Market Research (main)": "20 Jul 2026, 09:00–10:30",
            "Data Analytics (skill alignment)": "20 Jul 2026, 10:15–11:45",
            "Ethics (main)": "20 Jul 2026, 11:30–13:00",
            "User Behaviour Control (skill alignment)": "21 Jul 2026, 09:00–10:30"
          },
          "2nd Retake Nov": {
            "Market Research (main)": "16 Nov 2026, 09:00–10:30",
            "Data Analytics (skill alignment)": "16 Nov 2026, 10:15–11:45",
            "Ethics (main)": "16 Nov 2026, 11:30–13:00",
            "User Behaviour Control (skill alignment)": "17 Nov 2026, 11:15–12:45"
          },
          "3rd Retake Mar": {
            "Market Research (main)": "10 Mar 2027, 09:00–10:30",
            "Data Analytics (skill alignment)": "10 Mar 2027, 10:15–11:45",
            "Ethics (main)": "10 Mar 2027, 11:30–13:00",
            "User Behaviour Control (skill alignment)": "11 Mar 2027, 11:15–12:45"
          }
        }
      };
      return schedule[semester]?.[period]?.[course] || "";
    };

    const checkConflict = () => {
      if (selectedCourses.length < 2) return false;
      
      const p = examPeriod || (semester === "WiSe 2025" ? "1st Opp Jan-Feb" : "1st Opp Jun-Jul");
      const dt1 = getExamDateTime(selectedCourses[0], semester, p);
      const dt2 = getExamDateTime(selectedCourses[1], semester, p);

      if (!dt1 || !dt2) return false;

      const [date1, time1] = dt1.split(", ");
      const [date2, time2] = dt2.split(", ");

      if (date1 !== date2) return false;

      const [start1, end1] = time1.replace('–', '-').split("-");
      const [start2, end2] = time2.replace('–', '-').split("-");

      const toMin = (t: string) => {
        const [h, m] = t.trim().split(":").map(Number);
        return h * 60 + m;
      };

      const s1 = toMin(start1);
      const e1 = toMin(end1);
      const s2 = toMin(start2);
      const e2 = toMin(end2);

      return s1 < e2 && s2 < e1;
    };

    const hasConflict = checkConflict();
    const isExactlyTwo = selectedCourses.length === 2;
    const hasMainCourse = selectedCourses.some(c => c.toLowerCase().includes("(main)"));
    const isValid = isExactlyTwo && hasMainCourse && !hasConflict && examPeriod && confirmed;
    
    const errors = [];
    if (!isExactlyTwo) errors.push("TOO_MANY_EXAMS");
    if (!hasMainCourse) errors.push("ALIGNMENT_REQUIRED");
    if (hasConflict) errors.push("OVERLAP");
    if (!examPeriod) errors.push("MISSING_PERIOD");
    if (!confirmed) errors.push("CONFIRM_REQUIRED");

    const numConflicts = hasConflict ? 1 : 0; // Simplified for this case

    const snapshot = {
      semester,
      examPeriod,
      selectedCourses,
      confirmChecked: confirmed,
      isValid,
      hasConflict,
      errors,
      mode,
      submitAttempts: submitAttempts + 1
    };

    const intervention_rate = totalEdits > 0 ? interventionCount / totalEdits : 0;

    const outcomeData = {
      final_valid: isValid,
      num_conflicts: numConflicts,
      total_edits: totalEdits,
      intervention_count: interventionCount,
      intervention_rate,
      had_intervention: interventionCount > 0,
      // total_time_ms is now calculated server-side
    };

    logEvent("SUBMIT_CLICK", {
      ...snapshot,
      submit_allowed: Boolean(isValid),
      validation_passed: Boolean(isValid),
      isValid: Boolean(isValid),
      error_codes: errors
    });

    if (mode === "Assistance" || mode === "manual") {
      if (!isValid) {
        setSubmitAttempts(prev => prev + 1);
        setShowErrors(true);
        setAnimateError(true);
        let reason = "";
        if (!confirmed) reason = "not_confirmed";
        else if (!examPeriod) reason = "missing_period";
        else if (!isExactlyTwo) reason = "not_exactly_two";
        else if (!hasMainCourse) reason = "no_main_course";
        else if (hasConflict) reason = "time_conflict";

        logEvent("ERROR_SHOWN", { 
          reason,
          error_codes: errors,
          ...snapshot,
          proposal_id: proposalId
        }, "system");
        setTimeout(() => {
          setAnimateError(false);
        }, 500);
        return;
      }
    }

    if (hasCompleted) return;
    setHasCompleted(true);
    setIsSubmitted(true);
    logEvent("TASK_COMPLETED", { 
      ...snapshot, 
      ...outcomeData, 
      final_selectedCourses: selectedCourses, 
      final_examPeriod: examPeriod 
    }, "system");
    logEvent("PAGE_VIEW", { section: "ThankYou" });
  };

  const handleCourseToggle = (course: string) => {
    setShowErrors(false);

    const isSelecting = !selectedCourses.includes(course);
    setTotalEdits(prev => prev + 1);
    
    if (isAiGenerated) {
      setInterventionCount(prev => prev + 1);
    }

    logEvent("FIELD_EDIT", { 
      field_name: "selectedCourses",
      old_value: selectedCourses,
      new_value: isSelecting ? [...selectedCourses, course] : selectedCourses.filter(c => c !== course),
      was_ai_generated: isAiGenerated,
      proposal_id: proposalId
    });

    if (isAiGenerated) {
      logEvent("OVERRIDE", {
        action: "edit_after_suggestion",
        override_type: "edit_selected_courses",
        proposal_id: proposalId
      });
    }

    if (selectedCourses.includes(course)) {
      setSelectedCourses(selectedCourses.filter(c => c !== course));
    } else {
      if (mode === "manual" || mode === "Assistance") {
        setSelectedCourses([...selectedCourses, course]);
      } else {
        if (selectedCourses.length < 2) {
          setSelectedCourses([...selectedCourses, course]);
        }
      }
    }
  };

  const isExactlyTwo = selectedCourses.length === 2;
  const hasMainCourse = selectedCourses.some(c => c.toLowerCase().includes("(main)"));

  if (hasConsented === false) {
    return <DeclineView />;
  }

  if (isSubmitted) {
    return <ThankYouView />;
  }

  if (hasConsented === true) {
    if (showScenario) {
      return <ScenarioView onStartRegistration={handleStartRegistration} />;
    }

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
              submitAttempts={submitAttempts}
              setSubmitAttempts={setSubmitAttempts}
              totalEdits={totalEdits}
              setTotalEdits={setTotalEdits}
              interventionCount={interventionCount}
              setInterventionCount={setInterventionCount}
              startTime={startTime}
              isAiGenerated={isAiGenerated}
              setIsAiGenerated={setIsAiGenerated}
              hasCompleted={hasCompleted}
              setHasCompleted={setHasCompleted}
              proposalId={proposalId}
              setProposalId={setProposalId}
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
        submitAttempts={submitAttempts}
        setTotalEdits={setTotalEdits}
        setInterventionCount={setInterventionCount}
        isAiGenerated={isAiGenerated}
        setIsAiGenerated={setIsAiGenerated}
        proposalId={proposalId}
        setProposalId={setProposalId}
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
