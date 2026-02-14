import React from 'react';

const ThankYouView = () => (
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

export default ThankYouView;
