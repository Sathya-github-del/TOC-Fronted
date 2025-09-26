"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { House, Eye, EyeOff, Users, Building2, Info } from "lucide-react";

const EmployerSignUp = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [formErrors, setFormErrors] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const handleSignIn = () => {
        router.push("/?view=employerlogin");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: "" }));
        }
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

        if (!formData.password) {
            errors.password = "Password is required.";
            isValid = false;
        } else if (formData.password.length < 8) {
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
        if (!validateForm()) return;
        if (!termsAccepted) {
            showSnackbar('You must accept the terms and conditions.', 'error');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch("https://toc-stage-server.onrender.com/api/auth/employer-signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });
            const data = await response.json();
            if (response.ok) {
                showSnackbar("Account created successfully! Redirecting...", "success");
                if (data?.employer?.id) {
                    localStorage.setItem("employerId", data.employer.id);
                }
                setTimeout(() => {
                    router.push("/?view=employersetup");
                }, 1500);
            } else {
                showSnackbar(data.message || "Signup failed. The email may already be in use.", "error");
            }
        } catch (error) {
            showSnackbar("A network error occurred. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
        setTimeout(() => setSnackbar(prev => ({ ...prev, open: false })), 4000);
    };

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
        <div className="min-h-screen flex flex-col md:flex-row items-stretch">
            {/* Left Section with Vertical Navbar (Visible on md screens and up) */}
            <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-blue-900 to-blue-400 text-white">
                <nav className="flex flex-col items-center justify-center p-4 bg-black/20 space-y-4">
                    <NavLink icon={House} label="Home" href="/" />
                </nav>

                <div className="flex-1 flex flex-col justify-center items-start px-10 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 z-0" aria-hidden="true">
                        <svg width="100%" height="100%"><defs><pattern id="dots" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#fff" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots)" /></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-8">
                            <span className="text-3xl bg-white/20 p-2 rounded-full shadow"><svg className="h-7 w-7 text-yellow-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg></span>
                            <span className="text-2xl font-extrabold tracking-tight">Talent on Cloud</span>
                        </div>
                        <h2 className="text-4xl font-extrabold mb-5">Join the Top Companies Hiring on Our Platform.</h2>
                        <ul className="space-y-4 text-lg">
                            <li className="flex items-center space-x-3"><span className="text-blue-200"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" /></svg></span><span>Post jobs and manage applicants seamlessly.</span></li>
                            <li className="flex items-center space-x-3"><span className="text-blue-200"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2"></path></svg></span><span>Connect with talent that fits your needs.</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right Section - Sign Up Form */}
            <div className="w-full md:max-w-md flex flex-1 flex-col justify-center items-center bg-white py-16 px-6 md:px-12 relative shadow-xl">
                <div className="absolute top-0 left-0 p-4 md:hidden">
                    <button onClick={() => router.push('/')} className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Go to homepage">
                        <House className="h-6 w-6" />
                    </button>
                </div>

                <div className="w-full max-w-sm mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an Employer Account</h1>
                    <p className="text-gray-600 mb-7">Start posting jobs and finding talent today.</p>
                    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email Address</label>
                            <input
                                id="email" name="email" type="email" autoComplete="email" value={formData.email} disabled={loading} onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition disabled:bg-gray-50 ${formErrors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                required autoFocus
                            />
                            {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                            <div className="relative">
                                <input
                                    id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={formData.password} disabled={loading} onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition pr-12 disabled:bg-gray-50 ${formErrors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                    required
                                />
                                <button type="button" tabIndex={-1} className="absolute top-1/2 right-3 -translate-y-1/2 p-1 bg-transparent text-gray-400 hover:text-blue-600" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                </button>
                            </div>
                            {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" value={formData.confirmPassword} disabled={loading} onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition disabled:bg-gray-50 ${formErrors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                                required
                            />
                            {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{formErrors.confirmPassword}</p>}
                        </div>
                        <div className="flex items-start space-x-2">
                            <input
                                type="checkbox" id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-0.5"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-700 select-none">
                                I agree to the <button type="button" className="text-blue-600 hover:underline">Terms of Service</button> and <button type="button" className="text-blue-600 hover:underline">Privacy Policy</button>.
                            </label>
                        </div>
                        <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-semibold transition bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none ${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                    <div className="mt-8 text-center text-gray-500 text-sm">
                        Already have an account?{" "}
                        <button className="text-blue-600 font-semibold hover:underline" onClick={handleSignIn} type="button" disabled={loading}>
                            Sign In
                        </button>
                    </div>
                </div>
            </div>

            {/* Snackbar feedback */}
            {snackbar.open && (
                <div
                    className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg font-medium transition-all duration-300 ${snackbar.severity === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                    role="alert"
                >
                    {snackbar.message}
                </div>
            )}
        </div>
    );
};


export default EmployerSignUp;
