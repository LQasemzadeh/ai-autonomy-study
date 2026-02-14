import React from 'react';

const DeclineView = () => (
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

export default DeclineView;
