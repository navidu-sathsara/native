'use client';

export function NoraLogo({ className = 'h-8 w-8 text-white' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Upper Interlocking Hook */}
      <path
        d="M 50 53 L 62 65 L 83 44 L 50 11 L 27 34 L 38 45"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower Interlocking Hook */}
      <path
        d="M 50 47 L 38 35 L 17 56 L 50 89 L 73 66 L 62 55"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
