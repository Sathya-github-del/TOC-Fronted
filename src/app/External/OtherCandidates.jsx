"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "./DashboardLayout"; // Assuming layout is in the components folder
import { Grid, List, Briefcase, MapPin, Search, XCircle, Star, Mail, Phone, X } from 'lucide-react';

// --- Reusable UI Components ---

/**
 * A skeleton card component to display while candidate data is loading.
 * Provides a better user experience by indicating that content is on its way.
 */
const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-lg shadow-md animate-pulse">
        <div className="flex items-center mb-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
            <div>
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
        </div>
        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        <div className="flex justify-between items-center mt-4">
            <div className="h-8 bg-gray-300 rounded w-24"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
    </div>
);

/**
 * A card component to display a summary of a single candidate's profile.
 * Used in the grid view layout.
 * @param {object} candidate - The candidate data object.
 * @param {function} onViewProfile - Function to call when "View Profile" is clicked.
 */
const CandidateCard = ({ candidate, onViewProfile }) => (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between h-full">
        <div>
            <div className="flex items-start mb-3">
                <img src={candidate.companyLogo || "/placeholder.svg"} alt={`${candidate.name}'s company logo`} className="w-12 h-12 rounded-full mr-4 object-cover" />
                <div>
                    <h3 className="font-bold text-lg text-gray-800">{candidate.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                        <Briefcase className="w-4 h-4 mr-1.5" />
                        {candidate.currentRole} at {candidate.currentCompany}
                    </p>
                </div>
            </div>
            <div className="mb-3">
                <p className="text-sm text-gray-700 font-semibold mb-1">Top Skills:</p>
                <div className="flex flex-wrap gap-1">
                    {(candidate.skills || []).slice(0, 3).map(skill => (
                        <span key={skill} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">{skill}</span>
                    ))}
                </div>
            </div>
            <p className="text-sm text-gray-500 flex items-center mb-4">
                <MapPin className="w-4 h-4 mr-1.5" />
                {candidate.location} | {candidate.experience}
            </p>
        </div>
        <div className="flex justify-between items-center mt-auto pt-3 border-t">
            <button
                onClick={() => onViewProfile(candidate)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors">
                View Profile
            </button>
            <div className="flex items-center text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-gray-700 font-bold ml-1">{candidate.matchScore}%</span>
            </div>
        </div>
    </div>
);

/**
 * A modal dialog component to display the full details of a selected candidate.
 * @param {object} candidate - The full data object for the candidate to display.
 * @param {function} onClose - Function to call to close the modal.
 */
const CandidateProfileModal = ({ candidate, onClose }) => {
    if (!candidate) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
                        <p className="text-gray-600 flex items-center mt-1">
                            <Briefcase size={16} className="mr-2" />{candidate.currentRole}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={28} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Contact and Location */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Personal Details</h4>
                            <div className="space-y-2 text-sm">
                                <p className="flex items-center"><Mail size={14} className="mr-2 text-gray-500" /> {candidate.email || "Not provided"}</p>
                                <p className="flex items-center"><Phone size={14} className="mr-2 text-gray-500" /> {candidate.phone || "Not provided"}</p>
                                <p className="flex items-center"><MapPin size={14} className="mr-2 text-gray-500" /> {candidate.location || "Not provided"}</p>
                            </div>
                        </div>

                        {/* Right Column: Professional Info */}
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Professional Summary</h4>
                            <div className="space-y-2 text-sm">
                                <p><strong>Company:</strong> {candidate.currentCompany}</p>
                                <p><strong>Experience:</strong> {candidate.experience}</p>
                                <p><strong>Match Score:</strong> <span className="font-bold text-indigo-600">{candidate.matchScore}%</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Full Skills Section */}
                    <div className="mt-6">
                        <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {(candidate.skills && candidate.skills.length > 0) ? (
                                candidate.skills.map(skill => (
                                    <span key={skill} className="bg-gray-200 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">No skills listed for this candidate.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-lg sticky bottom-0">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Page Component ---
export default function OtherCandidates() {
    const [candidates, setCandidates] = useState([]);
    const [filteredCandidates, setFilteredCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid");

    // State to manage the profile modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    // Fetch candidate data from the backend when the component mounts
    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                setLoading(true);
                setError(null);

                // Using the specific API endpoint provided by the user
                const response = await fetch("https://toc-bac-1.onrender.com/api/candidates/all");

                if (!response.ok) {
                    throw new Error(`Failed to fetch data. Server responded with status: ${response.status}`);
                }

                const data = await response.json();
                setCandidates(data);
                setFilteredCandidates(data);

            } catch (err) {
                console.error("Error fetching candidates:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Handle search input changes to filter candidates
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        if (query) {
            const filtered = candidates.filter(c =>
                (c.name && c.name.toLowerCase().includes(query)) ||
                (c.currentRole && c.currentRole.toLowerCase().includes(query)) ||
                (c.skills && c.skills.some(skill => skill.toLowerCase().includes(query)))
            );
            setFilteredCandidates(filtered);
        } else {
            setFilteredCandidates(candidates);
        }
    };

    // Clear the search query and reset the filter
    const clearSearch = () => {
        setSearchQuery("");
        setFilteredCandidates(candidates);
    };

    // --- Modal Control Handlers ---
    const handleViewProfile = (candidate) => {
        setSelectedCandidate(candidate);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedCandidate(null);
    };

    // Conditionally renders the main content based on state (loading, error, data)
    const renderContent = () => {
        if (loading) {
            return (
                <div className={`gap-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'}`}>
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-12 text-red-600 bg-red-50 rounded-lg">
                    <p className="font-bold">An Error Occurred</p>
                    <p className="mt-2 text-sm text-gray-700">{error}</p>
                    <p className="mt-1 text-xs text-gray-500">Please check the console for more details and ensure the API is running.</p>
                </div>
            );
        }

        if (filteredCandidates.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">
                        {searchQuery ? `Your search for "${searchQuery}" did not return any results.` : "No candidates have been added yet."}
                    </p>
                </div>
            );
        }

        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCandidates.map(c =>
                        <CandidateCard key={c.id} candidate={c} onViewProfile={handleViewProfile} />
                    )}
                </div>
            );
        }

        // List View
        return (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Skills</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCandidates.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                                    <div className="text-sm text-gray-500">{c.currentRole}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.currentCompany}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.experience}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.skills || []).slice(0, 3).join(', ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleViewProfile(c)} className="text-indigo-600 hover:text-indigo-900">
                                        View Profile
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="p-6 bg-gray-50 min-h-screen">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Browse All Candidates</h1>
                    <p className="text-gray-600 mt-1">Discover top-tier talent from across the platform.</p>
                </header>

                {/* Search and Filter Controls */}
                <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-1/2 lg:w-1/3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, role, or skills..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="pl-10 pr-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {searchQuery && (
                            <XCircle
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                size={20}
                                onClick={clearSearch}
                            />
                        )}
                    </div>
                    <div className="flex items-center bg-gray-200 p-1 rounded-md">
                        <button onClick={() => setViewMode("grid")} className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
                            <Grid className="w-5 h-5" />
                        </button>
                        <button onClick={() => setViewMode("list")} className={`px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <main>
                    {renderContent()}
                </main>

                {/* Conditionally render the modal here */}
                {isModalOpen && <CandidateProfileModal candidate={selectedCandidate} onClose={handleCloseModal} />}
            </div>
        </DashboardLayout>
    );
}
