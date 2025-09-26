"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Menu,
  X,
  MapPin,
  Briefcase,
  Edit3,
  Download,
  Eye,
  Award,
  Calendar,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  GraduationCap,
  Code,
  User,
} from "lucide-react"
import Logo from "@/app/components/Logo";

// Custom Tooltip Component to replace Material-UI
const Tooltip = ({ children, title }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        {children}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
          {title}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

export default function CandidateProfile() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState(null)
  const [resumeAvailable, setResumeAvailable] = useState(false)
  const [resumeName, setResumeName] = useState("Resume")
  const [downloadError, setDownloadError] = useState("")
  const [userId, setUserId] = useState(null)
  const [userProfileResumeAvailable, setUserProfileResumeAvailable] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const router = useRouter()

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Initialize userId from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/?view=login")
        return
      }
      setUserId(localStorage.getItem("userId"))
    }
  }, [])
  // Fetch the candidate profile for the logged-in user on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    setLoading(true)
    const userIdFromStorage = localStorage.getItem("userId")
    setUserId(userIdFromStorage)

    if (!userIdFromStorage) {
      setProfileData(null)
      setProfileId(null)
      setResumeAvailable(false)
      setUserProfileResumeAvailable(false)
      setLoading(false)
      return
    }

    fetch(`https://toc-bac-1.onrender.com/api/candidate-profile/user/${userIdFromStorage}`)
      .then((res) => {
        if (!res.ok) throw new Error("No candidate profile")
        return res.json()
      })
      .then((profile) => {
        setProfileId(profile._id)
        setResumeAvailable(!!(profile.personalInfo && profile.personalInfo.resume && profile.personalInfo.resume.path))
        setUserProfileResumeAvailable(false)
        setResumeName(
          profile.personalInfo && profile.personalInfo.resume && profile.personalInfo.resume.originalName
            ? profile.personalInfo.resume.originalName
            : "Resume",
        )

        // Debug logging for profile photo
        console.log('Profile data received:', profile)
        console.log('Profile photo data:', profile.personalInfo?.profilePhoto)

        const mappedProfile = mapProfileData(profile)
        console.log('Final mapped profile data:', mappedProfile)
        console.log('Profile photo URL in final data:', mappedProfile.profilePhoto)
        setProfileData(mappedProfile)
        setLoading(false)
      })
      .catch(() => {
        // Fallback: fetch from User document
        fetch(`https://toc-bac-1.onrender.com/api/user/${userIdFromStorage}/profile`)
          .then((res) => {
            if (!res.ok) throw new Error("No user profile")
            return res.json()
          })
          .then((data) => {
            if (data && data.profile) {
              setProfileId(null)
              const hasResume = !!(
                data.profile.personalInfo &&
                data.profile.personalInfo.resume &&
                data.profile.personalInfo.resume.path
              )
              setResumeAvailable(false)
              setUserProfileResumeAvailable(hasResume)
              setResumeName(
                data.profile.personalInfo &&
                  data.profile.personalInfo.resume &&
                  data.profile.personalInfo.resume.originalName
                  ? data.profile.personalInfo.resume.originalName
                  : "Resume",
              )
              // Debug logging for fallback profile photo
              console.log('Fallback profile data received:', data.profile)
              console.log('Fallback profile photo data:', data.profile.personalInfo?.profilePhoto)

              const mapped = mapProfileData(data.profile)
              if (data.profile.personalInfo && data.profile.personalInfo.profilePhoto) {
                mapped.profilePhoto = data.profile.personalInfo.profilePhoto.fileId
                  ? `https://toc-bac-1.onrender.com/api/files/${data.profile.personalInfo.profilePhoto.fileId}`
                  : null
              }
              console.log('Final mapped fallback profile data:', mapped)
              console.log('Profile photo URL in fallback data:', mapped.profilePhoto)
              setProfileData(mapped)
            } else {
              setProfileData(null)
              setUserProfileResumeAvailable(false)
            }
            setLoading(false)
          })
          .catch(() => {
            setProfileData(null)
            setProfileId(null)
            setResumeAvailable(false)
            setUserProfileResumeAvailable(false)
            setLoading(false)
          })
      })
  }, [])

  // Helper: map backend profile to frontend structure
  function mapProfileData(data) {
    if (!data) return null

    const pi = data.personalInfo || {}
    const skills = Array.isArray(data.skills) ? data.skills.map((s) => ({ name: s, years: "", level: "" })) : []

    const experience = Array.isArray(data.experience)
      ? data.experience.map((exp) => ({
        title: exp.jobTitle,
        company: exp.employer,
        location: exp.location,
        duration: `${exp.startDate || ""}${exp.endDate ? " - " + exp.endDate : ""}`,
        type: exp.employmentType,
        description: exp.experienceSummary,
        achievements: [],
      }))
      : []

    const projects = Array.isArray(data.projects)
      ? data.projects.map((proj) => ({
        title: proj.projectName,
        description: proj.description,
        technologies: proj.keySkills
          ? proj.keySkills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
          : [],
        link: proj.projectUrl,
        image: "📁",
      }))
      : []

    const education = Array.isArray(data.education)
      ? data.education.map((edu) => ({
        degree: edu.degree,
        field: edu.specialization,
        school: edu.university,
        location: edu.institution,
        duration: `${edu.startYear || ""}${edu.endYear ? " - " + edu.endYear : ""}`,
        gpa: edu.grades,
      }))
      : []

    const certifications = []
    const introTranscript = pi.introTranscript || ""

    // Construct proper profile photo URL
    const profilePhotoUrl = pi.profilePhoto?.fileId
      ? `https://toc-bac-1.onrender.com/api/files/${pi.profilePhoto.fileId}`
      : null

    const resumeUrl = pi.resume?.fileId
      ? `https://toc-bac-1.onrender.com/api/files/${pi.resume.fileId}`
      : null

    console.log('Profile photo URL constructed:', profilePhotoUrl)
    console.log('Profile photo path from backend:', pi.profilePhoto?.path)

    return {
      name: `${pi.firstName || ""} ${pi.lastName || ""}`.trim(),
      title: pi.title || "",
      location: pi.location || "",
      email: pi.email || "",
      phone: pi.mobile || "",
      website: "",
      linkedin: "",
      github: "",
      profileViews: "",
      searchAppearances: "",
      recruiterViews: "",
      skills,
      experience,
      projects,
      education,
      certifications,
      introTranscript,
      profilePhoto: profilePhotoUrl,
      resumeUrl,
    }
  }

  const handleBrowseJobs = () => {
    router.push("/?view=alljobs")
  }

  const handleEndSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userId")
      localStorage.removeItem("token")
    }
    router.push("/?view=login")
  }

  const handleEditProfile = () => {
    // router.push("/candidate/profile-setup")
  }

  const handleResumeDownload = async (e) => {
    e.preventDefault()
    setDownloadError("")

    if (!(resumeAvailable || userProfileResumeAvailable)) return

    try {
      let url = ""
      if (profileId && resumeAvailable) {
        url = `https://toc-bac-1.onrender.com/api/candidate-profile/${profileId}/resume`
      } else if (userId && userProfileResumeAvailable) {
        url = `https://toc-bac-1.onrender.com/api/user/${userId}/resume`
      } else {
        setDownloadError("Resume not available.")
        alert("Resume not available.")
        return
      }

      console.log('Attempting to download resume from:', url)
      console.log('Resume availability:', { resumeAvailable, userProfileResumeAvailable, profileId, userId })

      const response = await fetch(url, { method: "GET" })
      if (!response.ok) {
        const data = await response.json()
        console.error('Resume download error:', data)
        setDownloadError(data.error || "Failed to download resume.")
        alert(data.error || "Failed to download resume.")
        return
      }

      const blob = await response.blob()
      const urlBlob = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = urlBlob
      a.download = resumeName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(urlBlob)
    } catch (error) {
      console.error('Resume download error:', error)
      setDownloadError("Error downloading resume.")
      alert("Error downloading resume.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Profile Found</h2>
            <p className="text-gray-600 mb-6">Please complete your profile setup to get started.</p>
            <button
              onClick={handleEditProfile}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Setup Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  const navigationItems = [
    { name: "Companies", href: "#", active: false },
    { name: "My Profile", href: "#", active: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <span>
              <Logo size={200} />
            </span>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${item.active
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    }`}
                >
                  {item.name}
                </a>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4 relative">
              <button
                onClick={handleBrowseJobs}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Browse Jobs
              </button>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((p) => !p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <span className="max-w-[140px] truncate">{profileData?.name || "Profile"}</span>
                  <svg className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                    <div className="px-3 py-2 text-xs text-gray-500">Signed in as</div>
                    <div className="px-3 py-1 text-sm font-medium text-gray-800 truncate">{profileData?.email || ''}</div>
                    <hr className="my-1" />
                    <button
                      onClick={handleEndSession}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${item.active
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    }`}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex flex-col space-y-2 px-3">
                  <button
                    onClick={handleBrowseJobs}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors text-center"
                  >
                    Browse Jobs
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center border border-gray-300 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                    {profileData.profilePhoto ? (
                      <img
                        src={profileData.profilePhoto}
                        onError={(e) => {
                          console.log('Image failed to load:', profileData.profilePhoto)
                          console.log('Image error details:', e.target.src)
                          e.target.style.display = 'none'
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', profileData.profilePhoto)
                        }}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-white" />
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-1">{profileData.name}</h2>
                  <p className="text-indigo-100 text-sm sm:text-base mb-2">{profileData.title}</p>
                  {profileData.location && (
                    <div className="flex items-center justify-center text-indigo-100 text-sm">
                      <MapPin size={14} className="mr-1" />
                      {profileData.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
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
                  {profileData.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe size={16} className="mr-3 text-gray-400" />
                      <a href={profileData.website} className="text-sm text-indigo-600 hover:underline truncate">
                        {profileData.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleEditProfile}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  >
                    <Edit3 size={16} className="mr-2" />
                    Edit Profile
                  </button>

                  {(resumeAvailable || userProfileResumeAvailable || profileData?.resumeUrl) && (
                    <Tooltip title={`Download ${resumeName}`}>
                      <a
                        href={profileData?.resumeUrl || (profileId ? `https://toc-bac-1.onrender.com/api/candidate-profile/${profileId}/resume` : (userId ? `https://toc-bac-1.onrender.com/api/user/${userId}/resume` : '#'))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                      >
                        <Download size={16} className="mr-2" />
                        Download Resume
                      </a>
                    </Tooltip>
                  )}
                </div>

                {/* Profile Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{profileData.profileViews || "0"}</div>
                      <div className="text-xs text-gray-500">Profile Views</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 sm:gap-4">
                  {[
                    { id: "overview", label: "Overview", icon: <Eye size={16} /> },
                    { id: "experience", label: "Experience", icon: <Briefcase size={16} /> },
                    { id: "projects", label: "Projects", icon: <Code size={16} /> },
                    { id: "skills", label: "Skills", icon: <Award size={16} /> },
                    { id: "education", label: "Education", icon: <GraduationCap size={16} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* About Section */}
                  {profileData.introTranscript && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">About</h3>
                        <button onClick={handleEditProfile} className="text-indigo-600 hover:text-indigo-700 p-1">
                          <Edit3 size={16} />
                        </button>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{profileData.introTranscript}</p>
                    </div>
                  )}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                      <Briefcase className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{profileData.experience?.length || 0}</div>
                      <div className="text-sm text-gray-500">Work Experience</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                      <Code className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{profileData.projects?.length || 0}</div>
                      <div className="text-sm text-gray-500">Projects</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                      <Award className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{profileData.skills?.length || 0}</div>
                      <div className="text-sm text-gray-500">Skills</div>
                    </div>
                  </div>

                  {/* Recent Experience Preview */}
                  {profileData.experience && profileData.experience.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Experience</h3>
                      <div className="space-y-4">
                        {profileData.experience.slice(0, 2).map((exp, index) => (
                          <div key={index} className="border-l-4 border-indigo-600 pl-4">
                            <h4 className="font-medium text-gray-900">{exp.title}</h4>
                            <p className="text-indigo-600 text-sm">{exp.company}</p>
                            <p className="text-gray-500 text-sm">{exp.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "experience" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                    <button onClick={handleEditProfile} className="text-indigo-600 hover:text-indigo-700 p-1">
                      <Edit3 size={16} />
                    </button>
                  </div>

                  {profileData.experience && profileData.experience.length > 0 ? (
                    <div className="space-y-6">
                      {profileData.experience.map((exp, index) => (
                        <div key={index} className="border-l-4 border-indigo-600 pl-6 pb-6 last:pb-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{exp.title}</h4>
                              <p className="text-indigo-600 font-medium">{exp.company}</p>
                            </div>
                            <div className="text-sm text-gray-500 mt-1 sm:mt-0 sm:text-right">
                              <div className="flex items-center sm:justify-end">
                                <Calendar size={14} className="mr-1" />
                                {exp.duration}
                              </div>
                              {exp.location && (
                                <div className="flex items-center sm:justify-end mt-1">
                                  <MapPin size={14} className="mr-1" />
                                  {exp.location}
                                </div>
                              )}
                            </div>
                          </div>
                          {exp.type && (
                            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mb-3">
                              {exp.type}
                            </span>
                          )}
                          {exp.description && <p className="text-gray-700 leading-relaxed">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No work experience added yet.</p>
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Add Experience
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "projects" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
                    <button onClick={handleEditProfile} className="text-indigo-600 hover:text-indigo-700 p-1">
                      <Edit3 size={16} />
                    </button>
                  </div>

                  {profileData.projects && profileData.projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {profileData.projects.map((project, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{project.image}</span>
                              <h4 className="font-medium text-gray-900">{project.title}</h4>
                            </div>
                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700"
                              >
                                <ExternalLink size={16} />
                              </a>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm mb-3 leading-relaxed">{project.description}</p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.technologies.map((tech, techIndex) => (
                                <span
                                  key={techIndex}
                                  className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No projects added yet.</p>
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Add Project
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "skills" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
                    <button onClick={handleEditProfile} className="text-indigo-600 hover:text-indigo-700 p-1">
                      <Edit3 size={16} />
                    </button>
                  </div>

                  {profileData.skills && profileData.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profileData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No skills added yet.</p>
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Add Skills
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "education" && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                    <button onClick={handleEditProfile} className="text-indigo-600 hover:text-indigo-700 p-1">
                      <Edit3 size={16} />
                    </button>
                  </div>

                  {profileData.education && profileData.education.length > 0 ? (
                    <div className="space-y-6">
                      {profileData.education.map((edu, index) => (
                        <div key={index} className="border-l-4 border-indigo-600 pl-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">{edu.degree}</h4>
                              {edu.field && <p className="text-indigo-600 font-medium">{edu.field}</p>}
                              <p className="text-gray-700">{edu.school}</p>
                            </div>
                            <div className="text-sm text-gray-500 mt-1 sm:mt-0 sm:text-right">
                              <div className="flex items-center sm:justify-end">
                                <Calendar size={14} className="mr-1" />
                                {edu.duration}
                              </div>
                              {edu.location && (
                                <div className="flex items-center sm:justify-end mt-1">
                                  <MapPin size={14} className="mr-1" />
                                  {edu.location}
                                </div>
                              )}
                            </div>
                          </div>
                          {edu.gpa && <p className="text-gray-600 text-sm">GPA: {edu.gpa}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No education added yet.</p>
                      <button
                        onClick={handleEditProfile}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Add Education
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
