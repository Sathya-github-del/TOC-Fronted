"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { House, Users, Building2, Info, Eye, EyeOff } from "lucide-react";

// Reusable NavLink for the sidebar
const NavLink = ({ icon: Icon, label, href }) => {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className="flex flex-col items-center justify-center space-y-1 text-white/70 hover:text-white hover:bg-white/10 p-3 rounded-lg transition-all duration-200"
            title={label}
        >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
};
//
const LoginPage = () => {
    const router = useRouter();
    const { markLoggedIn } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('https://toc-bac-1.onrender.com/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Login failed. Please check your credentials.');
            }
            markLoggedIn(formData.email, data.user.id);
            localStorage.setItem('userId', data.user.id);
            setSuccess(data.message || 'Login successful! Redirecting...');
            setTimeout(() => {
                router.push(data.hasProfile ? '/?view=profile' : '/?view=setup');
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-stretch font-sans">
            {/* Left Section with Sidebar */}
            <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-indigo-800 to-indigo-500 text-white">
                <nav className="flex flex-col items-center justify-center p-4 bg-black/20 space-y-4">
                    <NavLink icon={House} label="Home" href="/" />
                </nav>
                <div className="flex-1 flex flex-col justify-center items-start px-10">
                    <h1 className="text-4xl font-bold mb-4">Unlock Your Next Career Move</h1>
                    <p className="text-lg opacity-90">Connect with top employers and find a job that matters.</p>
                </div>
            </div>

            {/* Right Section - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
                <div className="absolute top-0 left-0 p-4 md:hidden">
                    <Link href="/" className="p-2 rounded-full text-gray-600 hover:bg-gray-100" aria-label="Go to homepage">
                        <House className="h-6 w-6" />
                    </Link>
                </div>
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                        <p className="text-gray-600 mt-2">Sign in to access your profile.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm text-center">{error}</div>}
                        {success && <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm text-center">{success}</div>}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute top-9 right-3 text-gray-500 hover:text-indigo-600">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input type="checkbox" name="remember" checked={formData.remember} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                                <label className="ml-2 block text-sm text-gray-900">Remember me</label>
                            </div>
                            <Link href="/?view=forgot" className="text-sm text-indigo-600 hover:text-indigo-500">Forgot password?</Link>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/?view=signup" className="font-medium text-indigo-600 hover:underline">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
export default LoginPage;
