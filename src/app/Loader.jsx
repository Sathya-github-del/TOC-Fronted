"use client";

export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Loader Icons */}
      <div className="flex space-x-2">
        {/* Gradient defs */}
        <svg height="0" width="0" viewBox="0 0 64 64" className="absolute">
          <defs>
            {/* Gradient for T */}
            <linearGradient id="gradT" x1="0" y1="62" x2="0" y2="2">
              <stop stopColor="orange" />
              <stop stopColor="#FFD700" offset="0.5" />
              <stop stopColor="black" offset="1" />
            </linearGradient>

            {/* Animated gradient for O */}
            <linearGradient id="gradO" x1="0" y1="64" x2="0" y2="0">
              <stop stopColor="#FFD700" />
              <stop stopColor="orange" offset="0.5" />
              <stop stopColor="black" offset="1" />
              <animateTransform
                attributeName="gradientTransform"
                type="rotate"
                values="0 32 32;360 32 32"
                dur="6s"
                repeatCount="indefinite"
              />
            </linearGradient>

            {/* Gradient for C */}
            <linearGradient id="gradC" x1="0" y1="62" x2="0" y2="2">
              <stop stopColor="black" />
              <stop stopColor="#FFD700" offset="0.5" />
              <stop stopColor="orange" offset="1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Icon 1 - T */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-16 h-16">
          <path
            stroke="url(#gradT)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="360"
            d="M8 12h48M32 12v40"
            className="animate-dash"
          />
        </svg>

        {/* Icon 2 - O */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-16 h-16">
          <path
            stroke="url(#gradO)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="360"
            d="M32 12a20 20 0 1 1 0 40a20 20 0 1 1 0-40"
            className="animate-spinDash"
          />
        </svg>

        {/* Icon 3 - C */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-16 h-16">
          <path
            stroke="url(#gradC)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="360"
            d="M52 22a20 20 0 0 0-40 0v20a20 20 0 0 0 40 0"
            className="animate-dash"
          />
        </svg>
      </div>

      {/* Text under loader */}
    <h1 className="mt-6 text-2xl font-bold text-black animate-pulse">
  Talent on Cloud
</h1>
    </div>
  );
}
