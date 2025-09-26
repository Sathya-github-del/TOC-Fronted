"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, Search, Bell, Users, Settings, LogOut, TrendingUp, GraduationCap } from 'lucide-react'
import Logo from "@/app/components/Logo";

export default function DashboardLayout({ children, activePage }) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navigationItems = [
        { id: "dashboard", name: "Dashboard", icon: Users, href: '/?view=companyprofile' },
        { id: "external", name: "External Candidates", icon: GraduationCap, href: '/?view=externalcandidates' },
        { id: "other", name: "Other Companies", icon: TrendingUp, href: '/?view=othercompaniescandidates' },
    ];

    const Sidebar = () => (
        <div className="bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="flex items-center justify-between h-20 border-b border-gray-200 px-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                    <Logo size={200} />
                </div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navigationItems.map(item => (
                    <button key={item.id} onClick={() => router.push(item.href)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activePage === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                    </button>
                ))}
            </nav>
            <div className="px-4 py-6 border-t border-gray-200 space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
                    <Settings size={20} /> Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100">
                    <LogOut size={20} /> Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen font-sans flex">
            {/* Static Sidebar for Desktop */}
            <div className="hidden lg:flex lg:flex-shrink-0 w-64">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen">
                <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-30">
                    <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-600">
                            <Menu size={24} />
                        </button>
                        {/* Placeholder for search or other header actions */}
                        <div className="flex-1"></div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 rounded-full text-gray-500 hover:bg-slate-100 relative">
                                <Bell size={20} />
                                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                            </button>
                            <div className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-100">
                                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white">HR</div>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-semibold text-gray-800">HR Manager</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                {/* Page-specific content is rendered here */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
