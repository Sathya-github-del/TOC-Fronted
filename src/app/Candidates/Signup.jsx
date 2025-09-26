"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { House, Eye, EyeOff, Users, Building2, Info } from 'lucide-react'; // Standardized icons

// Reusable component for password validation checklist
const ValidationItem = ({ isValid, text }) => (
    <li className={`flex items-center text-xs ${isValid ? 'text-green-600' : 'text-gray-500'} transition-colors duration-300`}>
        <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
                d={isValid
                    ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    : "M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"}
                clipRule="evenodd"
            />
        </svg>
        {text}
    </li>
);

const SignupPage = () => {
    const router = useRouter();
    const { markSignedUp } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Form, error, and validation state
    const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
    const [submitError, setSubmitError] = useState('');
    const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
    const [validationStatus, setValidationStatus] = useState({
        email: { isValid: false }, password: { length: false, specialChar: false }, confirmPassword: { matches: false }
    });
    // OTP flow state
    const [otpSent, setOtpSent] = useState(false);
    const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [canResend, setCanResend] = useState(false);
    const [timer, setTimer] = useState(60);
    const otpInputsRef = useRef([]);

    // --- LOGIC & HANDLERS ---

    // Real-time validation effect
    useEffect(() => {
        if (otpSent) return;
        const emailRegex = /^\S+@\S+\.\S+$/;
        setValidationStatus({
            email: { isValid: emailRegex.test(formData.email) },
            password: {
                length: formData.password.length >= 8,
                specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
            },
            confirmPassword: { matches: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 }
        });
    }, [formData, otpSent]);

    // OTP resend timer effect
    useEffect(() => {
        let interval;
        if (otpSent && timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        } else if (timer === 0) {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer, otpSent]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSubmitError('');
    };

    const handleBlur = (e) => setTouched(prev => ({ ...prev, [e.target.name]: true }));

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otpDigits];
        newOtp[index] = value.slice(-1);
        setOtpDigits(newOtp);
        if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            otpInputsRef.current[index - 1]?.focus();
        }
    };

    const handleSignupSuccess = (email) => {
        markSignedUp(email);
        router.push('/?view=setup');
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (otpSent) {
            await handleVerifyAndSignup();
        } else {
            setTouched({ email: true, password: true, confirmPassword: true });
            const { email, password, confirmPassword } = validationStatus;
            if (email.isValid && password.length && password.specialChar && confirmPassword.matches) {
                await handleSendOtp();
            } else {
                setSubmitError("Please correct the errors before submitting.");
            }
        }
    };

    const handleSendOtp = async (isResend = false) => {
        setLoading(true);
        setSubmitError('');
        try {
            const response = await fetch('https://toc-stage-server.onrender.com/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email.trim() }),
            });
            const data = await response.json();
            if (!response.ok) {
                if (data.message?.toLowerCase().includes('already exists')) {
                    setSubmitError('User already exists. Please sign in.');
                    setTimeout(() => router.push('/?view=login'), 2000);
                    return;
                }
                throw new Error(data.message || 'Failed to send OTP. Please try again.');
            }
            if (!isResend) setOtpSent(true);
            setTimer(60);
            setCanResend(false);
            setOtpDigits(Array(6).fill(''));
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSignup = async () => {
        if (otpDigits.join('').length !== 6) {
            setSubmitError("Please enter the complete 6-digit OTP.");
            return;
        }
        setLoading(true);
        setSubmitError('');
        try {
            const verifyResponse = await fetch('https://toc-stage-server.onrender.com/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email.trim(), otp: otpDigits.join('') }),
            });
            if (!verifyResponse.ok) throw new Error((await verifyResponse.json()).message || 'OTP verification failed. Please try again.');

            const signupResponse = await fetch('https://toc-stage-server.onrender.com/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email.trim(), password: formData.password, verified: true }),
            });
            const signupData = await signupResponse.json();
            if (!signupResponse.ok) throw new Error(signupData.message || 'Final signup failed after verification.');

            localStorage.setItem('userId', signupData.user.id);
            handleSignupSuccess(formData.email);
        } catch (err) {
            setSubmitError(err.message);
            setOtpDigits(Array(6).fill(''));
        } finally {
            setLoading(false);
        }
    };

    // Reusable NavLink component for the large-screen sidebar
    const NavLink = ({ icon: Icon, label, href }) => (
        <button
            onClick={() => router.push(href)}
            className="flex flex-col items-center justify-center space-y-1 text-white/70 hover:text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200"
            title={label}
        >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-stretch font-sans bg-gray-50">
            {/* Left Section with Vertical Navbar (Visible on md screens and up) */}
            <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-indigo-800 to-indigo-500 text-white">
                <nav className="flex flex-col items-center justify-center p-4 bg-black/20 space-y-4">
                    <NavLink icon={House} label="Home" href="/" />
                </nav>

                <div className="flex-1 flex flex-col justify-center items-start px-10 relative overflow-hidden">
                    <div className="relative z-10 max-w-md">
                        <div className="flex items-center space-x-3 mb-8">
                            <span className="text-3xl bg-white/20 p-2 rounded-full shadow">
                                <svg className="h-7 w-7 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </span>
                            <span className="text-2xl font-extrabold tracking-tight">Talent on Cloud</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Find Your Dream Job Today</h1>
                        <p className="text-lg opacity-90 mb-6">
                            Connect with top companies and take the next step in your career journey with us.
                        </p>
                        <img
                            src="https://i.ibb.co/LXjBknw5/talent2.png" // replace with your image URL
                            alt="Career illustration"
                            className="w-full max-w-sm mx-auto object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Right Auth Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="absolute top-0 left-0 p-4 md:hidden">
                    <button onClick={() => router.push('/')} className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Go to homepage">
                        <House className="h-6 w-6" />
                    </button>
                </div>

                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className={`text-3xl font-bold ${otpSent ? 'text-gray-800' : 'text-indigo-600'}`}>
                            {otpSent ? 'Verify Your Email' : 'Create your Account'}
                        </h2>
                        <p className="text-gray-600 mt-2">{otpSent ? `Enter the 6-digit code sent to ${formData.email}` : 'A few simple steps to get started.'}</p>
                    </div>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        {!otpSent ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                    {touched.email && !validationStatus.email.isValid && <p className="text-xs text-red-600 mt-1">Please enter a valid email address.</p>}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                                    <input type={showPassword ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} required className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"><Eye size={20} /></button>
                                    <ul className="mt-2 space-y-1">
                                        <ValidationItem isValid={validationStatus.password.length} text="At least 8 characters long" />
                                        <ValidationItem isValid={validationStatus.password.specialChar} text="Contains a special character (!@#$...)" />
                                    </ul>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm Password</label>
                                    <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} required className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                                    <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600"><Eye size={20} /></button>
                                    {touched.confirmPassword && !validationStatus.confirmPassword.matches && <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>}
                                </div>
                            </>
                        ) : (
                            <div className="p-4 text-center">
                                <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                                    {otpDigits.map((digit, i) => (
                                        <input key={i} ref={el => otpInputsRef.current[i] = el} type="tel" maxLength="1" value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                    ))}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Didn't receive the code?{' '}
                                    {canResend ? (
                                        <button type="button" onClick={() => handleSendOtp(true)} disabled={loading} className="font-medium text-indigo-600 hover:underline disabled:text-gray-400">
                                            {loading ? 'Sending...' : 'Resend'}
                                        </button>
                                    ) : (
                                        <span>Resend in {timer}s</span>
                                    )}
                                </div>
                            </div>
                        )}
                        {submitError && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-lg text-center">{submitError}</p>}
                        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors">
                            {loading ? 'Processing...' : (otpSent ? 'Verify & Create Account' : 'Send OTP')}
                        </button>
                    </form>
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/?view=login" className="font-medium text-indigo-600 hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;