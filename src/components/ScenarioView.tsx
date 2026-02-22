import React from 'react';

interface ScenarioViewProps {
  onStartRegistration: () => void;
}

const ScenarioView = ({ onStartRegistration }: ScenarioViewProps) => (
  <div className="flex h-screen flex-col items-center justify-center bg-white px-10 font-sans text-[#171717] overflow-hidden">
    <div className="flex w-full max-w-lg flex-col items-center text-center">
      {/* Icon (optional, but keeps consistency with ConsentView) */}
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
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      </div>

      {/* Title */}
      <h1 className="mb-4 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
        Study Scenario
      </h1>

      {/* Content */}
      <div className="space-y-4 text-left text-[14px] leading-relaxed text-gray-700 sm:text-[15px]">
        <p>
          You are a master’s student preparing to register for your upcoming exams.
        </p>

        <p>
          The registration period is currently open. Some exams may take place at overlapping times.
        </p>

        <p>
          Please review the available options carefully and complete the registration as you would in a real academic situation. Your choices will determine your final exam schedule.
        </p>
      </div>

      {/* Button */}
      <div className="mt-8 flex w-full flex-col items-center">
        <button 
          onClick={onStartRegistration}
          className="h-10 w-full max-w-[200px] rounded-full bg-[#3b82f6] text-sm font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
        >
          Start registration
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-6 text-[11px] text-gray-500 sm:text-xs">
      </footer>
    </div>
  </div>
);

export default ScenarioView;
