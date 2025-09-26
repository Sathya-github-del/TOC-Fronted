"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import {
    Menu,
    X,
    Search,
    Plus,
    Bell,
    User,
    LogOut,
    Eye,
    MoreVertical,
    List,
    Grid,
    Download,
    Trash2,
} from "lucide-react"
import Logo from "@/app/components/Logo"
import ProtectedRoute from "@/app/components/ProtectedRoute"
import { useAuth } from "@/app/context/AuthContext"

// API Configuration
const API_BASE_URL = "https://toc-bac-1.onrender.com/api"

const STATUS_OPTIONS = [
    "Available (default status)/ Active bench",
    "Proposed to the client",
    "Interview in progress",
    "Confirmed by the client",
    "Soft locked( to be confirmed by client)",
    "Deploying/Onboarding",
]

export default function InternalCandidates() {
    const router = useRouter()
    const { logout } = useAuth()
    const [isMobile, setIsMobile] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [employerName, setEmployerName] = useState("My Company")
    const [activeTab, setActiveTab] = useState("Internal Bench")
    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState("table")
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const [statusUpdateLoading, setStatusUpdateLoading] = useState({})
    const [deleteLoading, setDeleteLoading] = useState({})

    // --- Reusable helper to get auth headers ---
    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            alert("Authentication session expired. Please log in again.")
            router.push("/?view=employerlogin")
            return null
        }
        return { Authorization: `Bearer ${token}` }
    }, [router])

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener("resize", handleResize)
        handleResize()
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    // Fetch employer name when the component mounts
    useEffect(() => {
        const fetchEmployerName = async () => {
            const headers = getAuthHeaders();
            if (!headers) return;

            try {
                // Get employer ID from token or localStorage
                const token = localStorage.getItem('token');
                if (!token) return;

                // Decode token to get employer ID (you might need to adjust this based on your token structure)
                const payload = JSON.parse(atob(token.split('.')[1]));
                const employerId = payload.id || payload.employerId;

                if (!employerId) {
                    console.error('No employer ID found in token');
                    setEmployerName('My Company');
                    return;
                }

                // Use the correct endpoint with employer ID
                const response = await axios.get(`${API_BASE_URL}/employer/${employerId}`, { headers });
                setEmployerName(response.data.companyName || response.data.name || 'My Company');
            } catch (err) {
                console.error('Failed to fetch employer name:', err);
                setEmployerName('My Company');
            }
        };

        fetchEmployerName();
    }, [getAuthHeaders]);


    // Fetch candidates based on active tab and search query
    useEffect(() => {
        const fetchCandidates = async () => {
            0
            setLoading(true)
            setError(null)
            const headers = getAuthHeaders()
            if (!headers) {
                setLoading(false)
                return
            }

            try {
                const params = {
                    status: activeTab,
                    search: searchQuery,
                }
                const response = await axios.get(`${API_BASE_URL}/internal-candidates`, { headers, params })
                setCandidates(response.data.candidates || [])
            } catch (err) {
                console.error("Error fetching candidates:", err)
                setError("Failed to fetch candidates. Please try again.")
                setCandidates([])
            } finally {
                setLoading(false)
            }
        }

        const debouncedFetch = setTimeout(() => {
            fetchCandidates()
        }, 300)

        return () => clearTimeout(debouncedFetch)
    }, [activeTab, searchQuery, getAuthHeaders])

    const updateCandidateStatus = async (candidateId, newStatus) => {
        const headers = getAuthHeaders()
        if (!headers) return

        setStatusUpdateLoading((prev) => ({ ...prev, [candidateId]: true }))

        try {
            await axios.put(`${API_BASE_URL}/internal-candidates/${candidateId}/status`, { status: newStatus }, { headers })

            // Update local state
            setCandidates((prev) =>
                prev.map((candidate) => (candidate._id === candidateId ? { ...candidate, status: newStatus } : candidate)),
            )

            localStorage.setItem(
                "candidateStatusUpdate",
                JSON.stringify({
                    candidateId,
                    newStatus,
                    timestamp: Date.now(),
                }),
            )

            // Trigger storage event for same-tab communication
            window.dispatchEvent(new Event("focus"))

            alert("Status updated successfully!")
        } catch (err) {
            console.error("Error updating candidate status:", err)
            alert("Failed to update status. Please try again.")
        } finally {
            setStatusUpdateLoading((prev) => ({ ...prev, [candidateId]: false }))
        }
    }

    const deleteCandidate = async (candidateId, candidateName) => {
        if (!confirm(`Are you sure you want to delete ${candidateName}? This action cannot be undone.`)) {
            return
        }

        const headers = getAuthHeaders()
        if (!headers) return

        setDeleteLoading((prev) => ({ ...prev, [candidateId]: true }))

        try {
            await axios.delete(`${API_BASE_URL}/internal-candidates/${candidateId}`, { headers })

            // Remove from local state
            setCandidates((prev) => prev.filter((candidate) => candidate._id !== candidateId))

            alert("Candidate deleted successfully!")
        } catch (err) {
            console.error("Error deleting candidate:", err)
            alert("Failed to delete candidate. Please try again.")
        } finally {
            setDeleteLoading((prev) => ({ ...prev, [candidateId]: false }))
        }
    }

    const handleLogout = () => {
        logout()
    }

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50 font-sans">
                {/* Sidebar */}
                <aside
                    className={`bg-white w-64 min-h-full p-4 flex-shrink-0 border-r ${isMobile ? (isMenuOpen ? "absolute z-20 h-full" : "hidden") : "flex flex-col"}`}
                >
                    <div className="flex items-center justify-between mb-8">
                        <Logo />
                        {isMobile && (
                            <button onClick={() => setIsMenuOpen(false)}>
                                <X />
                            </button>
                        )}
                    </div>
                    <nav className="flex-grow">
                        <a href="#" className="flex items-center p-3 text-sm font-medium text-white bg-indigo-600 rounded-lg">
                            <User className="w-5 h-5 mr-3" /> Internal Candidates
                        </a>
                    </nav>
                    <div className="mt-auto">
                        <button
                            onClick={handleLogout}
                            className="flex items-center p-3 w-full text-left text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
                        >
                            <LogOut className="w-5 h-5 mr-3" /> Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
                        <div className="flex items-center">
                            {isMobile && (
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="mr-4">
                                    <Menu />
                                </button>
                            )}
                            <h1 className="text-xl font-semibold text-gray-800">{employerName}</h1>
                        </div>
                        <div className="flex items-center gap-5 relative">
                            <Bell className="text-gray-500 cursor-pointer" />
                            <button onClick={() => setUserMenuOpen((p) => !p)} className="p-1 rounded hover:bg-gray-100">
                                <User className="text-gray-700" />
                            </button>
                            {userMenuOpen && (
                                <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                                    <button
                                        onClick={() => router.push("/?view=companyprofile")}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => router.push("/?view=applications-sent")}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Applications Sent
                                    </button>
                                    <button
                                        onClick={() => router.push("/?view=applications-received")}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Applications Received
                                    </button>
                                    <hr className="my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Internal Candidate Bench</h2>
                                <p className="text-sm text-gray-500 mt-1">View, manage, and deploy candidates to projects.</p>
                            </div>
                            <button
                                onClick={() => router.push("/?view=uploadcandidates")}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Plus size={18} /> Add New Candidate
                            </button>
                        </div>

                        {/* Tabs, Search, and Filters */}
                        <div className="mb-6">
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                                    {["Internal Bench", "Available for Project", "On Project", "Notice Period"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`py-3 px-1 whitespace-nowrap border-b-2 text-sm font-medium ${activeTab === tab ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            <div className="mt-4 flex flex-col md:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, role, skills..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setViewMode("table")}
                                        className={`p-2 rounded-md ${viewMode === "table" ? "bg-indigo-100 text-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}
                                    >
                                        <List />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-2 rounded-md ${viewMode === "grid" ? "bg-indigo-100 text-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}
                                    >
                                        <Grid />
                                    </button>
                                    <button className="flex items-center gap-2 p-2 text-sm border rounded-lg hover:bg-gray-100">
                                        <Download size={16} /> Export
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Candidates Display */}
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            {loading && <p className="p-10 text-center text-gray-500">Loading candidates...</p>}
                            {error && <p className="p-10 text-center text-red-600 bg-red-50 rounded-lg">{error}</p>}
                            {!loading &&
                                !error &&
                                (viewMode === "table" ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Photo
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Role
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Key Skills
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            {/* <tbody className="bg-white divide-y divide-gray-200">
                                                {candidates.length > 0 ? (
                                                    candidates.map((candidate) => (
                                                        <tr key={candidate._id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {candidate.profilePhoto ? (
                                                                    <img
                                                                        src={
                                                                            candidate.profilePhoto.path
                                                                                ? `https://toc-bac-1.onrender.com/uploads/profiles/${candidate.profilePhoto.path}`
                                                                                : `https://toc-bac-1.onrender.com/api/files/${candidate.profilePhoto.fileId}`
                                                                        }
                                                                        alt={candidate.name}
                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                        onError={(e) => {
                                                                            e.target.style.display = "none"
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                                                                        {candidate.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                                                <div className="text-sm text-gray-500">{candidate.email}</div>
                                                                {candidate.location && (
                                                                    <div className="text-sm text-gray-500">📍 {candidate.location}</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.role}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(candidate.skills || []).map((skill, skillIndex) => (
                                                                        <span
                                                                            key={skillIndex}
                                                                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                                                        >
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {(candidate.skills || []).length === 0 && (
                                                                        <span className="text-gray-400">No skills listed</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <select
                                                                    value={candidate.status || "Available (default status)/ Active bench"}
                                                                    onChange={(e) => updateCandidateStatus(candidate._id, e.target.value)}
                                                                    disabled={statusUpdateLoading[candidate._id]}
                                                                    className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                                >
                                                                    {STATUS_OPTIONS.map((status) => (
                                                                        <option key={status} value={status}>
                                                                            {status}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {statusUpdateLoading[candidate._id] && (
                                                                    <div className="text-xs text-gray-500 mt-1">Updating...</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                                                                <button className="text-gray-400 hover:text-indigo-600">
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteCandidate(candidate._id, candidate.name)}
                                                                    disabled={deleteLoading[candidate._id]}
                                                                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                                                                >
                                                                    {deleteLoading[candidate._id] ? (
                                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                                    ) : (
                                                                        <Trash2 size={18} />
                                                                    )}
                                                                </button>
                                                                <button className="text-gray-400 hover:text-indigo-600">
                                                                    <MoreVertical size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center py-12 text-gray-500">
                                                            No candidates found for this view.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody> */}
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {candidates?.length > 0 ? (
                                                    candidates.map((candidate) => (
                                                        <tr key={candidate.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {candidate.profilePhoto ? (
                                                                    <img
                                                                        src={
                                                                            candidate.profilePhoto.path
                                                                                ? `https://toc-bac-1.onrender.com/uploads/profiles/${candidate.profilePhoto.path}`
                                                                                : `https://toc-bac-1.onrender.com/api/files/${candidate.profilePhoto.fileId}`
                                                                        }
                                                                        alt={candidate.name}
                                                                        className="w-10 h-10 rounded-full object-cover"
                                                                        onError={(e) => (e.target.style.display = 'none')}
                                                                    />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                                                                        {candidate.name?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">{candidate.name}</div>
                                                                <div className="text-sm text-gray-500">{candidate.email}</div>
                                                                <div className="text-sm text-gray-500">{candidate.location}</div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{candidate.role}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(candidate.skills ?? []).map((skill, skillIndex) => (
                                                                        <span
                                                                            key={skillIndex}
                                                                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                                                        >
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {(!candidate.skills || candidate.skills.length === 0) && (
                                                                        <span className="text-gray-400">No skills listed</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <select
                                                                    value={candidate.status || 'Available'}
                                                                    onChange={(e) => updateCandidateStatus(candidate.id, e.target.value)}
                                                                    disabled={statusUpdateLoading?.[candidate.id]}
                                                                    className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                                >
                                                                    {STATUS_OPTIONS.map((status) => (
                                                                        <option key={status} value={status}>
                                                                            {status}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {statusUpdateLoading?.[candidate.id] && (
                                                                    <div className="text-xs text-gray-500 mt-1">Updating...</div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2">
                                                                <button className="text-gray-400 hover:text-indigo-600">
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteCandidate(candidate.id, candidate.name)}
                                                                    disabled={deleteLoading?.[candidate.id]}
                                                                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                                                                >
                                                                    {deleteLoading?.[candidate.id] ? (
                                                                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <Trash2 size={18} />
                                                                    )}
                                                                </button>
                                                                <button className="text-gray-400 hover:text-indigo-600">
                                                                    <MoreVertical size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center py-12 text-gray-500">
                                                            No candidates found for this view.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>

                                        </table>
                                    </div>
                                ) : (
                                    // <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                                    //     {candidates.length > 0 ? (
                                    //         candidates.map((candidate) => (
                                    //             <div
                                    //                 key={candidate._id}
                                    //                 className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-lg transition-shadow"
                                    //             >
                                    //                 {candidate.profilePhoto && (
                                    //                     <img
                                    //                         src={
                                    //                             candidate.profilePhoto.path
                                    //                                 ? `https://toc-bac-1.onrender.com/uploads/profiles/${candidate.profilePhoto.path}`
                                    //                                 : `https://toc-bac-1.onrender.com/api/files/${candidate.profilePhoto.fileId}`
                                    //                         }
                                    //                         alt={candidate.name}
                                    //                         className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                                    //                         onError={(e) => {
                                    //                             e.target.style.display = "none"
                                    //                         }}
                                    //                     />
                                    //                 )}
                                    //                 <div className="flex items-center justify-between mb-2">
                                    //                     <h3 className="font-bold text-lg text-gray-800">{candidate.name}</h3>
                                    //                     <button
                                    //                         onClick={() => deleteCandidate(candidate._id, candidate.name)}
                                    //                         disabled={deleteLoading[candidate._id]}
                                    //                         className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                                    //                     >
                                    //                         {deleteLoading[candidate._id] ? (
                                    //                             <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                    //                         ) : (
                                    //                             <Trash2 size={16} />
                                    //                         )}
                                    //                     </button>
                                    //                 </div>
                                    //                 <p className="text-sm text-indigo-600 mb-4">{candidate.role}</p>

                                    //                 {candidate.location && <p className="text-xs text-gray-500 mb-1">📍 {candidate.location}</p>}

                                    //                 <p className="text-xs text-gray-500">Skills</p>
                                    //                 <div className="flex flex-wrap gap-1 mb-3">
                                    //                     {(candidate.skills || []).map((skill, skillIndex) => (
                                    //                         <span
                                    //                             key={skillIndex}
                                    //                             className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                    //                         >
                                    //                             {skill}
                                    //                         </span>
                                    //                     ))}
                                    //                     {(candidate.skills || []).length === 0 && (
                                    //                         <span className="text-gray-400 text-sm">No skills listed</span>
                                    //                     )}
                                    //                 </div>

                                    //                 <p className="text-xs text-gray-500 mb-1">Status</p>
                                    //                 <select
                                    //                     value={candidate.status || "Available (default status)/ Active bench"}
                                    //                     onChange={(e) => updateCandidateStatus(candidate._id, e.target.value)}
                                    //                     disabled={statusUpdateLoading[candidate._id]}
                                    //                     className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    //                 >
                                    //                     {STATUS_OPTIONS.map((status) => (
                                    //                         <option key={status} value={status}>
                                    //                             {status}
                                    //                         </option>
                                    //                     ))}
                                    //                 </select>
                                    //                 {statusUpdateLoading[candidate._id] && (
                                    //                     <div className="text-xs text-gray-500 mt-1">Updating...</div>
                                    //                 )}
                                    //             </div>
                                    //         ))
                                    //     ) : (
                                    //         <div className="col-span-full text-center py-12 text-gray-500">
                                    //             No candidates to display in grid view.
                                    //         </div>
                                    //     )}
                                    // </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                                        {candidates?.length > 0 ? (
                                            candidates.map((candidate) => (
                                                <div
                                                    key={candidate.id}
                                                    className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-lg transition-shadow"
                                                >
                                                    {candidate.profilePhoto && (
                                                        <img
                                                            src={
                                                                candidate.profilePhoto.path
                                                                    ? `https://toc-bac-1.onrender.com/uploads/profiles/${candidate.profilePhoto.path}`
                                                                    : `https://toc-bac-1.onrender.com/api/files/${candidate.profilePhoto.fileId}`
                                                            }
                                                            alt={candidate.name}
                                                            className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                                                            onError={(e) => (e.target.style.display = 'none')}
                                                        />
                                                    )}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="font-bold text-lg text-gray-800">{candidate.name}</h3>
                                                        <button
                                                            onClick={() => deleteCandidate(candidate.id, candidate.name)}
                                                            disabled={deleteLoading?.[candidate.id]}
                                                            className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                                                        >
                                                            {deleteLoading?.[candidate.id] ? (
                                                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Trash2 size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-indigo-600 mb-4">{candidate.role}</p>
                                                    {candidate.location && <p className="text-xs text-gray-500 mb-1">{candidate.location}</p>}
                                                    <p className="text-xs text-gray-500">Skills</p>
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {(candidate.skills ?? []).map((skill, skillIndex) => (
                                                            <span
                                                                key={skillIndex}
                                                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {(!candidate.skills || candidate.skills.length === 0) && (
                                                            <span className="text-gray-400 text-sm">No skills listed</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">Status</p>
                                                    <select
                                                        value={candidate.status || 'Available'}
                                                        onChange={(e) => updateCandidateStatus(candidate.id, e.target.value)}
                                                        disabled={statusUpdateLoading?.[candidate.id]}
                                                        className="w-full text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        {STATUS_OPTIONS.map((status) => (
                                                            <option key={status} value={status}>
                                                                {status}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {statusUpdateLoading?.[candidate.id] && (
                                                        <div className="text-xs text-gray-500 mt-1">Updating...</div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-center py-12 text-gray-500">
                                                No candidates to display in grid view.
                                            </div>
                                        )}
                                    </div>

                                ))}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    )
}
