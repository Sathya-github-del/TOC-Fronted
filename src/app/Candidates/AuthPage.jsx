"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { House, Users, Building2, Info, Eye, EyeOff } from "lucide-react";

// ====================================================================
// Reusable Sub-Components
// ====================================================================

const NavLink = ({ icon: Icon, label, href, className = "" }) => (
  <button
    onClick={() => router.push(href)}
    className={`flex flex-col items-center justify-center space-y-1 text-white/70 hover:text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200 ${className}`}
    title={label}
  >
    <Icon className="w-6 h-6" />
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const ValidationItem = ({ isValid, text }) => (
  <li
    className={`flex items-center text-xs ${isValid ? "text-green-600" : "text-gray-500"
      }`}
  >
    <svg
      className="w-3.5 h-3.5 mr-1.5 flex-shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d={
          isValid
            ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            : "M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
        }
        clipRule="evenodd"
      />
    </svg>
    {text}
  </li>
);

// ====================================================================
// Candidate Login Form Component
// ====================================================================
const CandidateLoginForm = ({ onSwitchTab }) => {
  const router = useRouter();
  const { markLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("https://toc-bac-1.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed.");

      markLoggedIn(formData.email, data.user.id);
      localStorage.setItem("userId", data.user.id);
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        router.push(data.hasProfile ? "/?view=profile" : "/?view=setup");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in to access your profile.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm text-center">
            {success}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute top-9 right-3 text-gray-500 hover:text-indigo-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          <Link
            href="/?view=forgot"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Need an account?{" "}
        <button
          onClick={() => onSwitchTab("signup")}
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Sign up
        </button>
      </p>
    </div>
  );
};

// ====================================================================
// Candidate Sign Up Form Component
// ====================================================================
const CandidateSignupForm = ({ onSwitchTab }) => {
  const router = useRouter();
  const { markSignedUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [validationStatus, setValidationStatus] = useState({
    email: { isValid: false },
    password: { length: false, specialChar: false },
    confirmPassword: { matches: false },
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (otpSent) return;
    const emailRegex = /^\S+@\S+\.\S+$/;
    setValidationStatus({
      email: { isValid: emailRegex.test(formData.email) },
      password: {
        length: formData.password.length >= 8,
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
      },
      confirmPassword: {
        matches:
          formData.password === formData.confirmPassword &&
          formData.confirmPassword.length > 0,
      },
    });
  }, [formData, otpSent]);

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((p) => p - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer, otpSent]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (submitError) setSubmitError("");
  };

  const handleBlur = (e) =>
    setTouched((p) => ({ ...p, [e.target.name]: true }));

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);
    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    if (otpSent) {
      await handleVerifyAndSignup();
    } else {
      const { email, password, confirmPassword } = validationStatus;
      if (
        email.isValid &&
        password.length &&
        password.specialChar &&
        confirmPassword.matches
      ) {
        await handleSendOtp();
      } else {
        setSubmitError("Please correct the errors before submitting.");
      }
    }
  };

  const handleSendOtp = async (isResend = false) => {
    setLoading(true);
    setSubmitError("");
    try {
      const response = await fetch(
        "https://toc-bac-1.onrender.com/api/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email.trim() }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to send OTP.");
      if (!isResend) setOtpSent(true); // Switches UI to OTP input
      setTimer(60); // Starts the resend timer
      setCanResend(false);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignup = async () => {
    if (otpDigits.join("").length !== 6) {
      setSubmitError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const response = await fetch(
        "https://toc-bac-1.onrender.com/api/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            otp: otpDigits.join(""),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed. Please try again."
        );
      }

      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("token", data.token);
      markSignedUp(formData.email);

      router.push("/?view=setup");
    } catch (err) {
      setSubmitError(err.message);
      setOtpDigits(Array(6).fill(""));
      otpInputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          {otpSent ? "Verify Your Email" : "Create Your Account"}
        </h2>
        <p className="text-gray-600 mt-2">
          {otpSent
            ? `Enter the code sent to ${formData.email}`
            : "Start your career journey here."}
        </p>
      </div>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {submitError && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg text-center">
            {submitError}
          </p>
        )}
        {!otpSent ? (
          <>
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="email-signup"
              >
                Email
              </label>
              <input
                type="email"
                id="email-signup"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {touched.email && !validationStatus.email.isValid && (
                <p className="text-xs text-red-600 mt-1">
                  Please enter a valid email.
                </p>
              )}
            </div>
            <div className="relative">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="password-signup"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password-signup"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute top-8 right-3 text-gray-500"
              >
                <Eye size={20} />
              </button>
              <ul className="mt-2 space-y-1">
                <ValidationItem
                  isValid={validationStatus.password.length}
                  text="At least 8 characters"
                />
                <ValidationItem
                  isValid={validationStatus.password.specialChar}
                  text="Contains a special character"
                />
              </ul>
            </div>
            <div className="relative">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="confirmPassword-signup"
              >
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword-signup"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute top-8 right-3 text-gray-500"
              >
                <Eye size={20} />
              </button>
              {touched.confirmPassword &&
                !validationStatus.confirmPassword.matches && (
                  <p className="text-xs text-red-600 mt-1">
                    Passwords do not match.
                  </p>
                )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="flex justify-center gap-2 sm:gap-3 mb-4">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpInputsRef.current[i] = el)}
                  type="tel"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              ))}
            </div>
            <div className="text-sm text-gray-600">
              Didn't receive code?{" "}
              {canResend ? (
                <button
                  type="button"
                  onClick={() => handleSendOtp(true)}
                  disabled={loading}
                  className="font-medium text-indigo-600 hover:underline"
                >
                  {loading ? "Sending..." : "Resend"}
                </button>
              ) : (
                <span>Resend in {timer}s</span>
              )}
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          {loading
            ? "Processing..."
            : otpSent
              ? "Verify & Create Account"
              : "Send OTP"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          onClick={() => onSwitchTab("login")}
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Sign in
        </button>
      </p>
    </div>
  );
};

// ====================================================================
// Employer Login Form Component
// ====================================================================
const EmployerLoginForm = ({ onSwitchTab }) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
    setTimeout(
      () => setSnackbar({ open: false, message: "", severity: "" }),
      4000
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        "https://toc-bac-1.onrender.com/api/auth/employer-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showSnackbar("Login successful! Redirecting...", "success");
        if (data?.employerId)
          localStorage.setItem("employerId", data.employerId);
        if (data?.token) localStorage.setItem("token", data.token);
        setTimeout(() => {
          router.push(
            data.hasProfile ? "/?view=companyprofile" : "/?view=employersetup"
          );
        }, 1500);
      } else {
        showSnackbar(
          data.message || "Login failed. Please check credentials.",
          "error"
        );
      }
    } catch (error) {
      showSnackbar("A network error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Employer Login</h1>
        <p className="text-gray-600 mt-2">Access your company dashboard.</p>
      </div>
      {snackbar.open && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg font-medium ${snackbar.severity === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
            }`}
          role="alert"
        >
          {snackbar.message}
        </div>
      )}
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
            htmlFor="email-signin"
          >
            Email Address
          </label>
          <input
            id="email-signin"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
            htmlFor="password-signin"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password-signin"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600"
            >
              {showPassword ? (
                <EyeOff className="w-6 h-6" />
              ) : (
                <Eye className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60`}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Need an account?{" "}
        <button
          onClick={() => onSwitchTab("signup")}
          className="font-semibold text-indigo-600 hover:underline"
        >
          Create one here
        </button>
      </p>
    </div>
  );
};

// ====================================================================
// Employer Sign-Up Form Component
// ====================================================================
const EmployerSignupForm = ({ onSwitchTab }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
    setTimeout(
      () => setSnackbar({ open: false, message: "", severity: "" }),
      4000
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    let errors = { email: "", password: "", confirmPassword: "" };
    let isValid = true;
    if (!formData.email) {
      errors.email = "Email is required.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email address is invalid.";
      isValid = false;
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
      isValid = false;
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
      isValid = false;
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm() || !termsAccepted) {
      if (!termsAccepted)
        showSnackbar("You must accept the terms and conditions.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        "https://toc-bac-1.onrender.com/api/auth/employer-signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        showSnackbar("Account created! Redirecting...", "success");
        if (data?.employer?.id)
          localStorage.setItem("employerId", data.employer.id);
        setTimeout(() => router.push("/?view=employersetup"), 1500);
      } else {
        showSnackbar(data.message || "Signup failed.", "error");
      }
    } catch (error) {
      showSnackbar("A network error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Create an Employer Account
        </h1>
        <p className="text-gray-600 mt-2">
          Start posting jobs and finding talent.
        </p>
      </div>
      {snackbar.open && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg font-medium ${snackbar.severity === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
            }`}
          role="alert"
        >
          {snackbar.message}
        </div>
      )}
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-2"
            htmlFor="email-signup"
          >
            Email Address
          </label>
          <input
            id="email-signup"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            className={`w-full px-4 py-3 border rounded-lg ${formErrors.email ? "border-red-500" : "border-gray-300"
              }`}
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="password-signup"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password-signup"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg pr-12 ${formErrors.password ? "border-red-500" : "border-gray-300"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {formErrors.password && (
            <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="confirmPassword-signup"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword-signup"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className={`w-full px-4 py-3 border rounded-lg ${formErrors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
          />
          {formErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {formErrors.confirmPassword}
            </p>
          )}
        </div>
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="h-4 w-4 text-indigo-600 rounded border-gray-300 mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{" "}
            <button type="button" className="text-indigo-600 hover:underline">
              Terms
            </button>{" "}
            and{" "}
            <button type="button" className="text-indigo-600 hover:underline">
              Privacy Policy
            </button>
            .
          </label>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60`}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <button
          onClick={() => onSwitchTab("login")}
          className="font-semibold text-indigo-600 hover:underline"
        >
          Sign In
        </button>
      </p>
    </div>
  );
};

// ====================================================================
// Main Auth Page Component
// ====================================================================
const AuthPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState("candidate");
  const [activeTab, setActiveTab] = useState("login");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const view = searchParams.get("view") || "login";
    if (["employerlogin", "employersignup"].includes(view)) {
      setRole("employer");
      setActiveTab(view === "employerlogin" ? "login" : "signup");
    } else {
      setRole("candidate");
      setActiveTab(view === "login" ? "login" : "signup");
    }
  }, [searchParams]);

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);
    const newView = newRole === "employer" ? "employer" + activeTab : activeTab;
    router.push(`/?view=${newView}`, { scroll: false });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newView = role === "employer" ? "employer" + tab : tab;
    router.push(`/?view=${newView}`, { scroll: false });
  };

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  const leftClass =
    role === "candidate"
      ? "bg-gradient-to-br from-indigo-800 to-indigo-500"
      : "bg-gradient-to-br from-blue-900 to-blue-400";

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-stretch font-sans bg-gray-50">
      <div className={`hidden md:flex flex-1 relative ${leftClass} text-white`}>
        <nav className="flex flex-col items-center justify-center p-4 bg-black/20 space-y-4">
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer"
          >
            <House className="w-5 h-5" />
            <span>Home</span>
          </Link>
        </nav>
        <div className="flex-1 flex flex-col justify-center items-start px-10">
          {role === "candidate" ? (
            <>
              <h1 className="text-4xl font-bold mb-4">
                Your Next Opportunity Awaits
              </h1>
              <p className="text-lg opacity-90">
                Sign in or create an account to connect with top employers.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-extrabold mb-5">
                Find The Best Talent For Your Company.
              </h1>
              <ul className="space-y-4 text-lg">
                <li className="flex items-center space-x-3">
                  <span>✓</span>
                  <span>Access a curated pool of top-tier candidates.</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span>✓</span>
                  <span>
                    Save time with our intelligent matching algorithm.
                  </span>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
        <div className="absolute top-0 right-4 p-2 md:hidden">
          <Link
            href="/"
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
          >
            <House className="h-6 w-6" />
          </Link>
        </div>
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
          {/* Tabs + Role Dropdown */}
          <div className="flex items-center justify-between border-b pb-2">
            {/* Sign In / Sign Up */}
            <div className="flex space-x-6">
              <button
                onClick={() => handleTabChange("login")}
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === "login"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => handleTabChange("signup")}
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === "signup"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-indigo-500"
                  }`}
              >
                Sign Up
              </button>
            </div>

            {/* Role Selector Dropdown */}
            <div className="relative">
              <select
                value={role}
                onChange={handleRoleChange}
                className="px-3 py-1.5 text-sm font-medium border-0 border-b-2 border-transparent rounded-t-md bg-transparent text-gray-600 focus:outline-none focus:ring-0 focus:border-indigo-600"
              >
                <option value="candidate">I'm a Candidate</option>
                <option value="employer">I'm an Employer</option>
              </select>
            </div>
          </div>

          {/* Form Section */}
          <div className="mt-6">
            {role === "candidate" ? (
              activeTab === "login" ? (
                <CandidateLoginForm onSwitchTab={handleTabChange} />
              ) : (
                <CandidateSignupForm onSwitchTab={handleTabChange} />
              )
            ) : activeTab === "login" ? (
              <EmployerLoginForm onSwitchTab={handleTabChange} />
            ) : (
              <EmployerSignupForm onSwitchTab={handleTabChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

