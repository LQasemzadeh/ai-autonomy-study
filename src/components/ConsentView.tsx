import React from 'react';

interface ConsentViewProps {
  handleConsent: () => void;
  logEvent: (action: string, details?: any, actor?: "user" | "system") => void;
  setHasConsented: (val: boolean) => void;
}

const ConsentView = ({ handleConsent, logEvent, setHasConsented }: ConsentViewProps) => (
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

export default ConsentView;
