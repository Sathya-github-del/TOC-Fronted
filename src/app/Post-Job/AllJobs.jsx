// app/jobs/page.jsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Logo from "@/app/components/Logo";
import {
    Menu, X, Bell, User, ChevronDown, Search, MapPin,
    Briefcase, Clock, Bookmark, Share2, ChevronRight, CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";


// --- LOCAL HELPER COMPONENTS (DEFINED IN-FILE) ---

const SearchBar = ({ searchQuery, setSearchQuery, locationFilter, setLocationFilter }) => (
    <section className="bg-gray-900 text-white py-14 md:py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
            <h1 className="font-bold text-4xl md:text-5xl mb-4">Find Your Dream Job</h1>
            <p className="text-xl text-gray-300 mb-8">Discover thousands of job opportunities from top companies.</p>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Job title, skills, or company"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg border-0 py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="relative flex-1 w-full">
                    <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Location"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg border-0 py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <button className="w-full md:w-auto bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors shrink-0">
                    Search Jobs
                </button>
            </div>
        </div>
    </section>
);

const Sidebar = ({ jobs, activeFilter, setActiveFilter, quickFilters, handleQuickFilterChange }) => {
    const jobCategories = [
        { id: "all", name: "All Jobs", count: jobs.length },
        { id: "technology", name: "Technology", count: jobs.filter(j => j.industry === "Technology").length },
        { id: "design", name: "Design", count: jobs.filter(j => j.industry === "Design").length },
        { id: "marketing", name: "Marketing", count: jobs.filter(j => j.industry === "Marketing").length },
    ];
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-8">
            <div>
                <h3 className="text-lg font-bold mb-4">Categories</h3>
                <div className="space-y-2">
                    {jobCategories.map(cat => (
                        <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`w-full flex justify-between items-center text-left text-sm font-medium p-3 rounded-lg transition-colors ${activeFilter === cat.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                            <span>{cat.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${activeFilter === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>{cat.count}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-4">Quick Filters</h3>
                <div className="space-y-3">
                    {[{ id: 'remote', label: 'Remote Only' }, { id: 'urgent', label: 'Urgent Hiring' }, { id: 'featured', label: 'Featured Jobs' }].map(filter => (
                        <label key={filter.id} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={quickFilters[filter.id]} onChange={() => handleQuickFilterChange(filter.id)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600" />
                            {filter.label}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

const getScoreColor = (score) => {
    if (score == null) return 'bg-gray-300';
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
};

const JobCard = ({ job, onSelect, score, isBookmarked, onBookmark }) => (
    <div onClick={onSelect} className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-300 relative overflow-hidden">
        {score != null && (<div className={`absolute top-6 left-0 h-10 w-1.5 rounded-r-md ${getScoreColor(score)}`} />)}
        <div className="flex gap-4 items-start">
            <img src={job.companyLogo} alt={`${job.company} logo`} className="w-16 h-16 rounded-lg border border-gray-200 shrink-0" />
            <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600">{job.title}</h3>
                <p className="text-blue-600 font-semibold mb-2">{job.company}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job.experience}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {job.workType}</span>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 self-start">
                {job.isUrgent && <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">Urgent</span>}
                {job.isFeatured && <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">Featured</span>}
            </div>
        </div>
        <p className="text-gray-600 my-4 line-clamp-2">{job.description}</p>
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-lg font-bold text-green-600">{job.salary}</span>
            <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); onBookmark(job.id); }} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Bookmark job">
                    <Bookmark size={18} className={isBookmarked ? "text-blue-600 fill-current" : ""} />
                </button>
                <button onClick={(e) => e.stopPropagation()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Share job"><Share2 size={18} /></button>
                <button className="bg-blue-50 text-blue-600 font-semibold py-2 px-4 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors">View Details <ChevronRight size={16} /></button>
            </div>
        </div>
    </div>
);

const JobDetailModal = ({ job, onClose, onApply, isBookmarked, onBookmark }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                    <div className="flex items-center gap-6 mb-4">
                        <img src={job.companyLogo} alt={job.company} className="w-20 h-20 rounded-lg border border-gray-200" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">{job.title}</h2>
                            <p className="text-lg font-semibold text-blue-600 mb-2">{job.company}</p>
                            <div className="flex items-center gap-4 text-gray-600">
                                <span className="flex items-center gap-1.5"><MapPin size={16} /> {job.location}</span>
                                <span className="font-semibold">{job.salary}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => onApply(job)} className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">Apply Now</button>
                        <button onClick={() => onBookmark(job.id)} className={`flex items-center gap-2 border border-gray-300 font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors ${isBookmarked ? 'text-blue-600' : 'text-gray-700'}`}>
                            <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
                            {isBookmarked ? 'Saved' : 'Save'}
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-lg font-bold mb-2">Job Description</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-3">Requirements</h3>
                        <ul className="space-y-2">
                            {job.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                                    <span className="text-gray-700">{req}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-3">Benefits</h3>
                        <div className="flex flex-wrap gap-2">
                            {job.benefits.map((benefit, i) => (<span key={i} className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1 rounded-full">{benefit}</span>))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Pagination = () => (
    <div className="flex justify-center items-center mt-12 gap-2">
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Previous</button>
        {[1, 2, 3].map(page => (<button key={page} className={`px-4 py-2 border rounded-lg text-sm font-medium ${page === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{page}</button>))}
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Next</button>
    </div>
);

// --- MAIN PAGE COMPONENT ---
export default function AllJobsPage() {
    // --- STATE MANAGEMENT ---
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [selectedJob, setSelectedJob] = useState(null);
    const [bookmarkedJobs, setBookmarkedJobs] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [candidateName, setCandidateName] = useState('');
    const [candidateLoading, setCandidateLoading] = useState(true);
    const [matchScores, setMatchScores] = useState({});
    const [matchLoading, setMatchLoading] = useState(false);
    const [quickFilters, setQuickFilters] = useState({ remote: false, urgent: false, featured: false });
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const router = useRouter();

    const handleRoutes = () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            router.push('/?view=profile');
        } else {
            router.push('/?view=login');
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
        } catch { }
        window.location.href = '/?view=login';
    };

    // --- DATA FETCHING ---
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            window.location.href = '/?view=login';
            return;
        }
        setCandidateLoading(true);
        fetch('https://toc-bac-1.onrender.com/api/candidate-profile')
            .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch profile')).then(data => {
                const latest = Array.isArray(data) && data.length > 0 ? data[data.length - 1] : null;
                const pi = latest?.personalInfo || {};
                setCandidateName(`${pi.firstName || ''} ${pi.lastName || ''}`.trim() || 'User');
            }).catch(() => setCandidateName('User')).finally(() => setCandidateLoading(false));
    }, []);

    useEffect(() => {
        setLoading(true);
        fetch('https://toc-bac-1.onrender.com/api/jobs/alljobs')
            .then(res => res.ok ? res.json() : Promise.reject(`HTTP error! status: ${res.status}`)).then(data => {
                if (!Array.isArray(data)) {
                    setError('Jobs API did not return an array.'); setJobs([]);
                } else {
                    const formattedJobs = data.map(job => ({
                        id: job.id || job._id, title: job.title || job.jobTitle, company: job.company || job.companyName, companyLogo: job.companyLogo || "/placeholder.svg", location: job.location, workType: job.workType || "Full-time", workMode: job.workMode || "On-site", salary: job.salary || "Not specified", experience: job.experience || "2+ years", postedDate: job.postedDate || "1d ago", applicants: job.applicants || 0, description: job.description || "", requirements: Array.isArray(job.requirements) ? job.requirements : [], skills: Array.isArray(job.skills) ? job.skills : [], benefits: Array.isArray(job.benefits) ? job.benefits : ["Health Insurance", "Paid Time Off", "Remote Work"], companySize: job.companySize || "51-200", industry: job.industry || "Technology", rating: job.rating || 4.2, reviews: job.reviews || 50, isUrgent: !!job.isUrgent, isFeatured: !!job.isFeatured, applicationDeadline: job.applicationDeadline || "2025-12-31", employerId: job.employerId || null,
                    }));
                    setJobs(formattedJobs); setError(null);
                }
            }).catch(err => { setError(err.message); setJobs([]); }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        if (!userId || jobs.length === 0) return;
        setMatchLoading(true);
        Promise.all(jobs.map(job => fetch('https://toc-bac-1.onrender.com/api/matchmaking-proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, jobId: job.id }) }).then(res => res.ok ? res.json() : { score: null }).catch(() => ({ score: null })).then(data => ({ id: job.id, score: data.score }))))
            .then(scores => {
                const scoresMap = scores.reduce((acc, { id, score }) => {
                    acc[id] = (score != null && score <= 1) ? Math.round(score * 100) : score;
                    return acc;
                }, {});
                setMatchScores(scoresMap); setMatchLoading(false);
            });
    }, [jobs]);

    // --- EVENT HANDLERS ---
    const handleQuickFilterChange = (filter) => setQuickFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
    const toggleBookmark = (jobId) => setBookmarkedJobs(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
    const handleApplyForJob = async (job) => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        if (!userId || !token) { alert('Please login to apply for jobs'); window.location.href = '/?view=login'; return; }
        try {
            const response = await fetch('https://toc-bac-1.onrender.com/api/job-applications/candidate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ jobId: job.id }) });
            if (response.ok) { alert('Application submitted successfully!'); setSelectedJob(null); }
            else { const errorData = await response.json(); alert(`Application failed: ${errorData.error || 'Please try again'}`); }
        } catch (error) { console.error("Application submission error:", error); alert('Failed to submit application. Please try again.'); }
    };

    // --- COMPUTED VALUES (FILTERING & SORTING) ---
    const sortedJobs = useMemo(() => {
        return [...jobs]
            .filter(job => {
                const query = searchQuery.toLowerCase(); const loc = locationFilter.toLowerCase();
                const matchesSearch = query === "" || job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query) || job.skills.some(s => s.toLowerCase().includes(query));
                const matchesLocation = loc === "" || job.location.toLowerCase().includes(loc);
                const matchesCategory = activeFilter === "all" || job.industry.toLowerCase() === activeFilter;
                const matchesRemote = !quickFilters.remote || job.workMode.toLowerCase() === 'remote';
                const matchesUrgent = !quickFilters.urgent || job.isUrgent;
                const matchesFeatured = !quickFilters.featured || job.isFeatured;
                return matchesSearch && matchesLocation && matchesCategory && matchesRemote && matchesUrgent && matchesFeatured;
            })
            .sort((a, b) => {
                const scoreA = matchScores[a.id]; const scoreB = matchScores[b.id];
                if (scoreB == null && scoreA == null) return 0; if (scoreB == null) return -1;
                if (scoreA == null) return 1; return scoreB - scoreA;
            });
    }, [jobs, searchQuery, locationFilter, activeFilter, quickFilters, matchScores]);

    // --- RENDER LOGIC ---
    return (
        <div className="font-['Urbanist',_sans-serif] bg-gray-50 text-gray-900 min-h-screen">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
                    <Logo size={200} />
                    <nav className="hidden lg:flex items-center gap-8">
                        {["Find Jobs", "Company Reviews", "Salary Guide", "Career Advice"].map((item, index) => (
                            <a href="#" key={item} className={`text-base font-semibold transition-colors pb-1 ${index === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{item}</a>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4 relative">
                        <button className="relative text-gray-600 hover:text-gray-800"><Bell size={22} /><span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /></button>
                        <div className="hidden md:flex items-center gap-2 cursor-pointer relative">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center"><User size={18} className="text-white" /></div>
                            <button onClick={() => setUserMenuOpen(p => !p)} className="flex items-center gap-1 text-gray-800 hover:text-blue-600">
                                <span className="font-medium max-w-[160px] truncate">{candidateLoading ? 'Loading...' : candidateName || 'Profile'}</span>
                                <ChevronDown size={16} className={`${userMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 top-12 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                                    <button onClick={handleRoutes} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</button>
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2">{isMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
                    </div>
                </div>
            </header>

            {isMenuOpen && (<div className="lg:hidden bg-white border-b border-gray-200 p-4"><Sidebar jobs={jobs} activeFilter={activeFilter} setActiveFilter={setActiveFilter} quickFilters={quickFilters} handleQuickFilterChange={handleQuickFilterChange} /></div>)}

            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} locationFilter={locationFilter} setLocationFilter={setLocationFilter} />

            <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-8">
                <aside className="hidden lg:block w-[300px] shrink-0"><div className="sticky top-28"><Sidebar jobs={jobs} activeFilter={activeFilter} setActiveFilter={setActiveFilter} quickFilters={quickFilters} handleQuickFilterChange={handleQuickFilterChange} /></div></aside>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">{loading ? 'Searching for jobs...' : `${sortedJobs.length} Jobs Found`}</h2>
                        <select className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option>Sort by: Relevance</option><option>Date Posted</option></select>
                    </div>
                    <div className="space-y-6">
                        {loading ? <p>Loading jobs...</p> : error ? <p className="text-red-500 font-medium">{error}</p> : sortedJobs.length === 0 ? <p>No jobs found matching your criteria.</p> : sortedJobs.map(job => (<JobCard key={job.id} job={job} onSelect={() => setSelectedJob(job)} score={matchScores[job.id]} isBookmarked={bookmarkedJobs.includes(job.id)} onBookmark={toggleBookmark} />))}
                    </div>
                    {!loading && sortedJobs.length > 0 && <Pagination />}
                </div>
            </main>

            {selectedJob && (<JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} onApply={handleApplyForJob} isBookmarked={bookmarkedJobs.includes(selectedJob.id)} onBookmark={toggleBookmark} />)}

            <footer className="bg-gray-800 text-white mt-16"><div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400"><p>&copy; 2025 Talent on Cloud. All rights reserved.</p></div></footer>
        </div>
    );
}
