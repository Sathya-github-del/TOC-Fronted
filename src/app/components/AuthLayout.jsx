// src/components/AuthLayout.jsx

export default function AuthLayout({
  title,
  subtitle,
  toggleText,
  toggleLink,
  isLogin,
  children,
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      
      {/* Left Section - Ads */}
      <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-indigo-700 to-purple-600 text-white p-12 relative overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white opacity-10 rounded-full"></div>
        <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-white opacity-10 rounded-full"></div>

        <h1 className="text-5xl font-extrabold mb-4 text-center leading-snug">
          Welcome Back!
        </h1>
        <p className="text-lg mb-8 max-w-lg text-center">
          Discover opportunities, connect with employers, and take the next step in your career 🚀
        </p>
        <img
          src="https://i.ibb.co/LXjBknw5/talent2.png"
          alt="Ad illustration"
          className="w-[360px] h-[360px] object-contain mx-auto transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Right Section - Auth Form */}
      <div className="flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 transition-all duration-300 hover:shadow-2xl">
          {/* Brand / Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-700 mb-2 text-center">
            Login
          </h1>
          <p className="text-sm md:text-base text-gray-500 text-center mb-6">
            Your career, powered by cloud talent.
          </p>

          {/* Auth Form Header */}
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-600 mb-6">{subtitle}</p>

          {/* Children Form */}
          <div className="mt-6">{children}</div>

          {/* Toggle link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            {toggleText}{" "}
            <a
              href={toggleLink}
              className="font-semibold text-indigo-600 hover:underline"
            >
              {isLogin ? "Sign up" : "Login"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
