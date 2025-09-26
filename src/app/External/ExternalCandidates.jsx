"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "./DashboardLayout";
import { Grid, List, Briefcase, GraduationCap, Search, XCircle } from 'lucide-react';
import axios from 'axios';

// --- Reusable UI Components (defined outside for performance) ---

const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                <div>
                    <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                </div>
            </div>
            <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="bg-gray-100 rounded-lg p-3 mb-4 h-16"></div>
        <div className="flex flex-wrap gap-1.5">
            <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
            <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
            <div className="h-5 w-14 bg-gray-200 rounded-full"></div>
        </div>
        <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="h-8 w-full bg-gray-200 rounded-full"></div>
        </div>
    </div>
);

const CandidateCard = ({ candidate }) => {
    const getStatusColorClasses = (status) => ({
        'Active': 'bg-emerald-100 text-emerald-700',
        'Interviewing': 'bg-blue-100 text-blue-700',
        'Not Available': 'bg-red-100 text-red-700',
    }[status] || 'bg-amber-100 text-amber-700');

    // Calculate experience years from candidate's experience array
    const calculateTotalExperience = (experiences) => {
        if (!experiences || !experiences.length) return '0';
        const years = experiences.reduce((total, exp) => {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            return total + (end.getFullYear() - start.getFullYear());
        }, 0);
        return `${years}`;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
            <div className="flex-grow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={candidate.personalInfo?.profilePhoto?.path || "/placeholder.svg"}
                            alt={`${candidate.personalInfo?.firstName} ${candidate.personalInfo?.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                            <h4 className="font-bold text-gray-800 text-xl group-hover:text-indigo-600">
                                {`${candidate.personalInfo?.firstName} ${candidate.personalInfo?.lastName}`}
                            </h4>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <Briefcase size={14} />
                                {calculateTotalExperience(candidate.experience)} Years Experience
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3 mb-4">
                    <GraduationCap size={24} className="text-indigo-600 mt-1 flex-shrink-0" />
                    <div>
                        <p className="font-semibold text-gray-800 text-sm">
                            {candidate.education?.[0]?.degree || 'No degree listed'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {candidate.education?.[0]?.university || 'No institution listed'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {(candidate.skills || []).slice(0, 4).map(skill => (
                        <span key={skill} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
            <div className="border-t border-gray-100 pt-4 mt-4">
                <div className={`text-center text-xs font-bold px-3 py-1.5 rounded-full ${getStatusColorClasses(candidate.profileStatus)}`}>
                    {candidate.profileStatus || 'Active'}
                </div>
            </div>
        </div>
    );
};

const CandidateListRow = ({ candidate }) => {
    const getStatusColorClasses = (status) => ({
        'Shortlisted': 'bg-emerald-100 text-emerald-700',
        'Interview Scheduled': 'bg-blue-100 text-blue-700',
        'Rejected': 'bg-red-100 text-red-700',
    }[status] || 'bg-amber-100 text-amber-700');

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-4">
                    <img className="h-10 w-10 rounded-full" src={candidate.avatar} alt={candidate.name} />
                    <div>
                        <div className="text-sm font-semibold text-gray-900">{candidate.name}</div>
                        <div className="text-xs text-gray-500">{candidate.college}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.appliedFor}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">{skill}</span>
                    ))}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColorClasses(candidate.status)}`}>
                    {candidate.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-indigo-600 hover:text-indigo-900">View</button>
            </td>
        </tr>
    );
};


// --- Main Page Component ---
export default function ExternalCandidatesPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState("grid");
    const [activeFilter, setActiveFilter] = useState("All Candidates");
    const [searchQuery, setSearchQuery] = useState("");
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch external candidates
    useEffect(() => {
        const fetchCandidates = async () => {
            setLoading(true);
            try {
                const response = await axios.get('https://toc-bac-1.onrender.com/api/candidate-profile');
                // Filter only completed profiles
                const externalCandidates = response.data.filter(candidate =>
                    candidate.profileStatus === 'completed' &&
                    candidate.personalInfo?.firstName &&
                    candidate.personalInfo?.lastName
                );
                setCandidates(externalCandidates);
            } catch (error) {
                console.error('Error fetching candidates:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, []);

    const filteredCandidates = candidates.filter(candidate => {
        const matchesFilter = activeFilter === "All Candidates" || candidate.profileStatus === activeFilter;
        const lowerCaseQuery = searchQuery.toLowerCase();
        const matchesSearch = lowerCaseQuery === '' ||
            `${candidate.personalInfo?.firstName} ${candidate.personalInfo?.lastName}`.toLowerCase().includes(lowerCaseQuery) ||
            candidate.skills?.some(skill => skill.toLowerCase().includes(lowerCaseQuery));
        return matchesFilter && matchesSearch;
    });

    const statusFilters = ["All Candidates", "Active", "Interviewing", "Not Available"];

    return (
        <DashboardLayout activePageId="external">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">External Candidates</h1>
                    <p className="text-gray-500 mt-1">Fresh talent applying for positions at your company.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-full sm:w-64">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, role, skill..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <div className="p-1 bg-gray-200 rounded-lg flex items-center self-start">
                        <button onClick={() => setViewMode("grid")} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}><Grid size={18} className={viewMode === 'grid' ? 'text-indigo-600' : 'text-gray-500'} /></button>
                        <button onClick={() => setViewMode("list")} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}><List size={18} className={viewMode === 'list' ? 'text-indigo-600' : 'text-gray-500'} /></button>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <div className="flex items-center gap-2 -mb-px overflow-x-auto">
                    {statusFilters.map(filter => (
                        <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 ${activeFilter === filter ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{filter}</button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border">
                    <XCircle size={48} className="mx-auto text-gray-400" />
                    <h3 className="mt-4 text-lg font-semibold text-gray-800">No Candidates Found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredCandidates.map(candidate => <CandidateCard key={candidate.id} candidate={candidate} />)}
                </div>
            ) : (
                <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Candidate</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applied For</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Top Skills</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCandidates.map(candidate => <CandidateListRow key={candidate.id} candidate={candidate} />)}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex justify-between items-center mt-8 text-sm">
                <p className="text-gray-600">Showing {filteredCandidates.length} of {candidates.length} candidates</p>
                <div className="flex items-center gap-1">
                    <button className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition">Previous</button>
                    <button className="w-9 h-9 border rounded-md bg-indigo-600 text-white border-indigo-600">1</button>
                    <button className="w-9 h-9 border rounded-md bg-white hover:bg-gray-50 border-gray-300">2</button>
                    <button className="px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition">Next</button>
                </div>
            </div>
        </DashboardLayout>
    );
}