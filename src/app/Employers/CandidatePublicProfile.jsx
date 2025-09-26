"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
    MapPin,
    Briefcase,
    Download,
    Award,
    Calendar,
    Mail,
    Phone,
    GraduationCap,
    Code,
    User,
    Eye,
    Loader2,
    AlertCircle,
} from "lucide-react"

// --- PUBLIC PROFILE VIEW FOR EMPLOYERS ---
export default function CandidatePublicProfile() {
    const searchParams = useSearchParams()
    const candidateId = searchParams.get("id")

    const [profileData, setProfileData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState("overview")

    useEffect(() => {
        if (!candidateId) {
            setError("No candidate ID was provided in the URL.")
            setLoading(false)
            return
        }

        const fetchPublicProfile = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`https://toc-bac-1.onrender.com/api/candidates/profile/${candidateId}`)
                if (!response.ok) {
                    throw new Error("Could not find the candidate profile.")
                }
                const data = await response.json()
                setProfileData(mapProfileData(data))
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchPublicProfile()
    }, [candidateId])

    // Helper to map backend data to the frontend structure
    function mapProfileData(data) {
        if (!data) return null;

        const pi = data.personalInfo || {};
        const skills = Array.isArray(data.skills) ? data.skills.map((s) => ({ name: s })) : [];
        const experience = Array.isArray(data.experience) ? data.experience.map((exp) => ({
            title: exp.jobTitle,
            company: exp.employer,
            location: exp.location,
            duration: `${exp.startDate || ""} - ${exp.endDate || "Present"}`,
            description: exp.experienceSummary,
        })) : [];
        const projects = Array.isArray(data.projects) ? data.projects.map((proj) => ({
            title: proj.projectName,
            description: proj.description,
            technologies: proj.keySkills ? proj.keySkills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        })) : [];
        const education = Array.isArray(data.education) ? data.education.map((edu) => ({
            degree: edu.degree,
            school: edu.university,
            duration: `${edu.startYear || ""} - ${edu.endYear || ""}`,
        })) : [];

        return {
            name: `${pi.firstName || ""} ${pi.lastName || ""}`.trim(),
            title: experience[0]?.title || "No role specified",
            location: pi.location || "Location not specified",
            email: pi.email || "",
            phone: pi.mobile || "",
            profilePhoto: pi.profilePhoto?.path,
            resume: pi.resume,
            introTranscript: pi.introTranscript || "No summary available.",
            skills,
            experience,
            projects,
            education,
        };
    }

    const handleResumeDownload = (e) => {
        e.preventDefault()
        if (!profileData?.resume?.path) return

        // This endpoint must be created on your backend (see Step 2)
        const downloadUrl = `https://toc-bac-1.onrender.com/api/candidates/resume/${candidateId}`
        window.open(downloadUrl, '_blank')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading Candidate Profile...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-sm">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Profile Sidebar */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
                                <div className="text-center">
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                                        {profileData.profilePhoto ? (
                                            <img src={profileData.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={48} className="text-white" />
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold mb-1">{profileData.name}</h2>
                                    <p className="text-indigo-100 text-base mb-2">{profileData.title}</p>
                                    <div className="flex items-center justify-center text-indigo-100 text-sm">
                                        <MapPin size={14} className="mr-1" />
                                        {profileData.location}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {profileData.email && (
                                        <div className="flex items-center text-gray-600">
                                            <Mail size={16} className="mr-3 text-gray-400" />
                                            <span className="text-sm truncate">{profileData.email}</span>
                                        </div>
                                    )}
                                    {profileData.phone && (
                                        <div className="flex items-center text-gray-600">
                                            <Phone size={16} className="mr-3 text-gray-400" />
                                            <span className="text-sm">{profileData.phone}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 space-y-3">
                                    {profileData.resume?.path && (
                                        <button onClick={handleResumeDownload} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center">
                                            <Download size={16} className="mr-2" />
                                            Download Resume
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 xl:col-span-9">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                            <div className="p-4 sm:p-6">
                                <div className="flex flex-wrap gap-2 sm:gap-4">
                                    {[{ id: "overview", label: "Overview", icon: <Eye size={16} /> }, { id: "experience", label: "Experience", icon: <Briefcase size={16} /> }, { id: "projects", label: "Projects", icon: <Code size={16} /> }, { id: "skills", label: "Skills", icon: <Award size={16} /> }, { id: "education", label: "Education", icon: <GraduationCap size={16} /> }].map((tab) => (
                                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                                            {tab.icon}
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {activeTab === "overview" && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                                    <p className="text-gray-700 leading-relaxed">{profileData.introTranscript}</p>
                                </div>
                            )}
                            {activeTab === "experience" && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Work Experience</h3>
                                    {profileData.experience?.length > 0 ? (
                                        <div className="space-y-6">
                                            {profileData.experience.map((exp, index) => (
                                                <div key={index} className="border-l-4 border-indigo-600 pl-6 relative">
                                                    <div className="absolute -left-[9px] top-1 h-4 w-4 bg-white border-2 border-indigo-600 rounded-full"></div>
                                                    <h4 className="text-lg font-medium text-gray-900">{exp.title}</h4>
                                                    <p className="text-indigo-600 font-medium">{exp.company}</p>
                                                    <p className="text-sm text-gray-500 mb-2">{exp.duration} • {exp.location}</p>
                                                    <p className="text-gray-700 leading-relaxed">{exp.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-500 text-center py-4">No work experience listed.</p>}
                                </div>
                            )}
                            {activeTab === "projects" && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Projects</h3>
                                    {profileData.projects?.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {profileData.projects.map((project, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                                                    <p className="text-gray-700 text-sm my-2 leading-relaxed">{project.description}</p>
                                                    <div className="flex flex-wrap gap-1 mt-3">
                                                        {project.technologies.map((tech, techIndex) => <span key={techIndex} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">{tech}</span>)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-500 text-center py-4">No projects listed.</p>}
                                </div>
                            )}
                            {activeTab === "skills" && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills</h3>
                                    {profileData.skills?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {profileData.skills.map((skill, index) => <span key={index} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">{skill.name}</span>)}
                                        </div>
                                    ) : <p className="text-gray-500 text-center py-4">No skills listed.</p>}
                                </div>
                            )}
                            {activeTab === "education" && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Education</h3>
                                    {profileData.education?.length > 0 ? (
                                        <div className="space-y-6">
                                            {profileData.education.map((edu, index) => (
                                                <div key={index} className="border-l-4 border-indigo-600 pl-6">
                                                    <h4 className="text-lg font-medium text-gray-900">{edu.degree}</h4>
                                                    <p className="text-indigo-600">{edu.school}</p>
                                                    <p className="text-sm text-gray-500">{edu.duration}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-500 text-center py-4">No education listed.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
