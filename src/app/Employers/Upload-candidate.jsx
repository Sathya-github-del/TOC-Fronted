"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Bell,
  Eye,
  Plus,
  Upload,
  Trash2,
  FileText,
  ChevronDown,
  User,
  Settings,
  LogOut,
  X,
  Download,
  Minus,
  Check,
} from "lucide-react"
import Logo from "@/app/components/Logo"
import axios from "axios"
import ProtectedRoute from "@/app/components/ProtectedRoute"
import { useAuth } from "@/app/context/AuthContext"

const UploadCandidates = () => {
  const router = useRouter()
  const { logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadType, setUploadType] = useState("single")
  const [bulkCandidates, setBulkCandidates] = useState([])
  const [csvPreview, setCsvPreview] = useState([])
  const [recentUploads, setRecentUploads] = useState([])
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [bulkResumeModalVisible, setBulkResumeModalVisible] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [bulkProfilePhotos, setBulkProfilePhotos] = useState([])
  const [bulkResumes, setBulkResumes] = useState([])

  const [bulkUploadSteps, setBulkUploadSteps] = useState({
    csvUploaded: false,
    profilePhotosUploaded: false,
    resumesUploaded: false,
  })

  const [singleForm, setSingleForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    desiredRole: "",
    experience: "",
    status: "",
    skills: "",
    about: "",
    projects: "", // Removed education from here
  })

  const [educationEntries, setEducationEntries] = useState([
    {
      id: 1,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      grade: "",
      description: "",
    },
  ])

  const [resumeFile, setResumeFile] = useState(null)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null)
  const [additionalDocs, setAdditionalDocs] = useState([])
  const [csvFile, setCsvFile] = useState(null)

  // Authentication check
  useEffect(() => {
    const employerId = localStorage.getItem("employerId")
    const token = localStorage.getItem("token")
    if (!employerId || !token) {
      alert("Please login to access this page")
      router.push("/?view=employerlogin")
      return
    }
    fetchRecentUploads()
  }, [router])

  const fetchRecentUploads = async () => {
    try {
      const employerId = localStorage.getItem("employerId")
      if (!employerId) return

      const response = await axios.get(
        `https://toc-bac-1.onrender.com/api/candidate-uploads?employerId=${employerId}`,
        {
          timeout: 15000,
        },
      )

      if (Array.isArray(response.data)) {
        setRecentUploads(response.data)
      }
    } catch (err) {
      console.error("Error fetching recent uploads:", err)
    }
  }

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePhoto(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => setProfilePhotoPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const addEducationEntry = () => {
    const newEntry = {
      id: Date.now(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      grade: "",
      description: "",
    }
    setEducationEntries([...educationEntries, newEntry])
  }

  const removeEducationEntry = (id) => {
    if (educationEntries.length > 1) {
      setEducationEntries(educationEntries.filter((entry) => entry.id !== id))
    }
  }

  const updateEducationEntry = (id, field, value) => {
    setEducationEntries(educationEntries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))
  }

  const handleSingleUpload = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const employerId = localStorage.getItem("employerId")
      if (!employerId) {
        alert("No employer ID found. Please login again.")
        return
      }

      const formData = new FormData()
      const candidateData = {
        name: singleForm.fullName,
        role: singleForm.desiredRole,
        status: singleForm.status,
        email: singleForm.email,
        phone: singleForm.phone,
        experience: singleForm.experience,
        skills: singleForm.skills,
        about: singleForm.about,
        education: JSON.stringify(educationEntries), // Store education as JSON array
        projects: singleForm.projects,
        employerId: employerId,
      }

      formData.append("data", JSON.stringify(candidateData))

      if (profilePhoto) {
        formData.append("profilePhoto", profilePhoto)
      }

      if (resumeFile) {
        formData.append("resume", resumeFile)
      }

      additionalDocs.forEach((doc) => {
        formData.append("additionalDocs", doc)
      })

      const response = await axios.post("https://toc-bac-1.onrender.com/api/candidate-uploads/single", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      })

      alert("Candidate uploaded successfully!")
      setSingleForm({
        fullName: "",
        email: "",
        phone: "",
        desiredRole: "",
        experience: "",
        status: "",
        skills: "",
        about: "",
        projects: "",
      })
      setEducationEntries([
        {
          id: 1,
          institution: "",
          degree: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: "",
          grade: "",
          description: "",
        },
      ])
      setProfilePhoto(null)
      setProfilePhotoPreview(null)
      setResumeFile(null)
      setAdditionalDocs([])

      setTimeout(() => fetchRecentUploads(), 500)
    } catch (error) {
      console.error("Upload error:", error)
      alert(`Upload failed: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkUpload = async () => {
    if (bulkCandidates.length === 0) {
      alert("Please add at least one candidate")
      return
    }

    if (!bulkUploadSteps.csvUploaded || !bulkUploadSteps.profilePhotosUploaded || !bulkUploadSteps.resumesUploaded) {
      alert("Please complete all required steps: 1) Upload CSV, 2) Upload Profile Photos, 3) Upload Resumes")
      return
    }

    setLoading(true)

    try {
      const employerId = localStorage.getItem("employerId")
      if (!employerId) {
        alert("No employer ID found. Please login again.")
        return
      }

      // Create FormData for bulk upload with files
      const formData = new FormData()

      // Add candidate data
      const cleanedCandidates = bulkCandidates.map((candidate) => {
        const candidateCopy = { ...candidate }
        delete candidateCopy.id
        return {
          name: candidateCopy.name || "",
          role: candidateCopy.role || "",
          email: candidateCopy.email || "",
          phone: candidateCopy.phone || "",
          experience: candidateCopy.experience || "",
          skills: candidateCopy.skills || "",
          about: candidateCopy.about || "",
          education: candidateCopy.education || "",
          projects: candidateCopy.projects || "",
          status: candidateCopy.status || "Internal Bench",
        }
      })

      formData.append("candidates", JSON.stringify(cleanedCandidates))
      formData.append("employerId", employerId)

      // Add profile photos
      bulkProfilePhotos.forEach((photo) => {
        formData.append("profilePhotos", photo)
      })

      // Add resumes
      bulkResumes.forEach((resume) => {
        formData.append("resumes", resume)
      })

      const response = await axios.post(
        "https://toc-bac-1.onrender.com/api/candidate-uploads/bulk-with-files",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000, // Increased timeout for file uploads
        },
      )

      alert(`Bulk upload successful! ${cleanedCandidates.length} candidates uploaded with their respective files.`)

      setBulkCandidates([])
      setCsvPreview([])
      setCsvFile(null)
      setBulkProfilePhotos([])
      setBulkResumes([])
      setBulkUploadSteps({
        csvUploaded: false,
        profilePhotosUploaded: false,
        resumesUploaded: false,
      })

      setTimeout(() => fetchRecentUploads(), 500)
    } catch (error) {
      console.error("Bulk upload error:", error)
      alert(`Bulk upload failed: ${error.response?.data?.message || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row")
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      data.push(row)
    }

    return data
  }

  const handleCSVUpload = (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvData = parseCSV(e.target.result)
        setCsvPreview(csvData)
        setBulkUploadSteps((prev) => ({ ...prev, csvUploaded: true }))
        alert(`CSV parsed successfully. Found ${csvData.length} candidates.`)
      } catch (error) {
        alert(`Failed to parse CSV file: ${error.message}`)
        setCsvPreview([])
        setBulkUploadSteps((prev) => ({ ...prev, csvUploaded: false }))
      }
    }
    reader.readAsText(file)
  }

  const importFromCSV = () => {
    if (csvPreview.length === 0) {
      alert("No CSV data to import")
      return
    }

    const importedCandidates = csvPreview.map((row, index) => {
      const normalizedRow = {}
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.toLowerCase().trim()
        normalizedRow[normalizedKey] = row[key]
      })

      return {
        id: Date.now() + index,
        name: normalizedRow.name || normalizedRow["full name"] || "",
        role: normalizedRow.role || normalizedRow["job title"] || "",
        email: normalizedRow.email || "",
        phone: normalizedRow.phone || "",
        experience: normalizedRow.experience || "",
        skills: normalizedRow.skills || "",
        about: normalizedRow.about || normalizedRow.description || "", // New field
        education: normalizedRow.education || "", // New field
        projects: normalizedRow.projects || "", // New field
        status: normalizedRow.status || "Internal Bench",
      }
    })

    setBulkCandidates(importedCandidates)
    setCsvPreview([])
    setCsvFile(null)
    alert(`Imported ${importedCandidates.length} candidates from CSV`)
  }

  const downloadCSVTemplate = () => {
    const template = `name,role,email,phone,experience,skills,about,education,projects,status
"John Doe","Software Engineer","john.doe@example.com","+1234567890","5","JavaScript, React, Node.js","Experienced full-stack developer with passion for clean code","Bachelor's in Computer Science - MIT (2018-2022)","E-commerce Platform, Task Management App","Available (default status)/ Active bench"
"Jane Smith","Product Manager","jane.smith@example.com","+1234567891","3","Product Strategy, Agile","Strategic product manager with focus on user experience","MBA in Business Administration - Harvard (2019-2021)","Mobile Banking App, SaaS Dashboard","Available for Project"`

    const blob = new Blob([template], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "candidate_template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleDeleteUpload = async (id) => {
    try {
      await axios.delete(`https://toc-bac-1.onrender.com/api/candidate-uploads/${id}`)
      alert("Upload deleted successfully")
      fetchRecentUploads()
    } catch (error) {
      alert("Failed to delete upload")
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "internal bench":
        return "bg-blue-100 text-blue-800"
      case "available for project":
        return "bg-green-100 text-green-800"
      case "on project":
        return "bg-yellow-100 text-yellow-800"
      case "notice period":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 font-montserrat">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left side - Logo and Navigation */}
              <div className="flex items-center space-x-8">
                <Logo size={200} />
                <nav className="hidden md:flex space-x-6">
                  <button
                    onClick={() => router.push("/?view=companyprofile")}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button className="text-blue-600 font-medium">Candidates</button>
                  <button className="text-gray-600 hover:text-blue-600 transition-colors">Jobs</button>
                  <button className="text-gray-600 hover:text-blue-600 transition-colors">Analytics</button>
                </nav>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Search size={20} />
                </button>
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      D
                    </div>
                    <ChevronDown size={16} className="text-gray-600" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => router.push("/?view=companyprofile")}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User size={16} className="mr-2" />
                        Profile
                      </button>
                      <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings size={16} className="mr-2" />
                        Settings
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="pt-16 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Candidates</h1>
              <p className="text-gray-600">
                Streamline your recruitment by adding internal bench or new candidates to your talent pool.
              </p>
            </div>

            {/* Upload Method Buttons */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setUploadType("single")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${uploadType === "single" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Upload Manually
                </button>
                <button
                  onClick={() => setUploadType("bulk")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${uploadType === "bulk" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  Bulk Upload
                </button>
              </div>
            </div>

            {/* Single Upload Form */}
            {uploadType === "single" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <form onSubmit={handleSingleUpload}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Candidate Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Candidate Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={singleForm.fullName}
                            onChange={(e) => setSingleForm({ ...singleForm, fullName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={singleForm.email}
                            onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="john.doe@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={singleForm.phone}
                            onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        {/* About/Description field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">About/Description</label>
                          <textarea
                            value={singleForm.about}
                            onChange={(e) => setSingleForm({ ...singleForm, about: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Brief description about the candidate..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role & Status */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Role & Status</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Desired Role</label>
                          <input
                            type="text"
                            value={singleForm.desiredRole}
                            onChange={(e) => setSingleForm({ ...singleForm, desiredRole: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="e.g., Software Engineer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                          <input
                            type="text"
                            value={singleForm.experience}
                            onChange={(e) => setSingleForm({ ...singleForm, experience: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="e.g., 5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Status</label>
                          <select
                            value={singleForm.status}
                            onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select status</option>
                            <option value="Available (default status)/ Active bench">
                              Available (default status)/ Active bench
                            </option>
                            <option value="Proposed to the client">Proposed to the client</option>
                            <option value="Interview in progress">Interview in progress</option>
                            <option value="Confirmed by the client">Confirmed by the client</option>
                            <option value="Soft locked( to be confirmed by client)">
                              Soft locked( to be confirmed by client)
                            </option>
                            <option value="Deploying/Onboarding">Deploying/Onboarding</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                          <textarea
                            value={singleForm.skills}
                            onChange={(e) => setSingleForm({ ...singleForm, skills: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Type or select skills..."
                          />
                        </div>
                        {/* Projects field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Projects</label>
                          <textarea
                            value={singleForm.projects}
                            onChange={(e) => setSingleForm({ ...singleForm, projects: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Notable projects..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-6">Documents</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePhotoChange}
                              className="hidden"
                              id="profile-photo-upload"
                            />
                            <label htmlFor="profile-photo-upload" className="cursor-pointer">
                              {profilePhotoPreview ? (
                                <div className="flex flex-col items-center">
                                  <img
                                    src={profilePhotoPreview || "/placeholder.svg"}
                                    alt="Profile preview"
                                    className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
                                  />
                                  <p className="text-sm text-gray-600">{profilePhoto.name}</p>
                                </div>
                              ) : (
                                <div>
                                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                  <p className="text-sm text-gray-600">Click to upload profile photo</p>
                                  <p className="text-xs text-gray-500 mt-1">(JPG, PNG, Max 5MB)</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Resume/CV</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => setResumeFile(e.target.files[0])}
                              className="hidden"
                              id="resume-upload"
                            />
                            <label htmlFor="resume-upload" className="cursor-pointer">
                              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">
                                {resumeFile ? resumeFile.name : "Click to upload resume"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">(Max 10MB)</p>
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Additional Documents</label>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={(e) => setAdditionalDocs(Array.from(e.target.files))}
                            className="hidden"
                            id="additional-docs"
                          />
                          <label htmlFor="additional-docs" className="cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                              <Plus className="mx-auto h-6 w-6 text-gray-400" />
                              <p className="text-sm text-gray-600 mt-2">Add additional documents</p>
                            </div>
                          </label>
                          {additionalDocs.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {additionalDocs.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
                                >
                                  <span>{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => setAdditionalDocs(additionalDocs.filter((_, i) => i !== index))}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 border-t pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                      <button
                        type="button"
                        onClick={addEducationEntry}
                        className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} className="mr-1" />
                        Add Education
                      </button>
                    </div>

                    <div className="space-y-6">
                      {educationEntries.map((entry, index) => (
                        <div key={entry.id} className="bg-gray-50 rounded-lg p-6 relative">
                          {educationEntries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEducationEntry(entry.id)}
                              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Institution/University
                              </label>
                              <input
                                type="text"
                                value={entry.institution}
                                onChange={(e) => updateEducationEntry(entry.id, "institution", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="e.g., MIT, Harvard University"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Degree/Qualification
                              </label>
                              <input
                                type="text"
                                value={entry.degree}
                                onChange={(e) => updateEducationEntry(entry.id, "degree", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="e.g., Bachelor's, Master's, PhD"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Field of Study</label>
                              <input
                                type="text"
                                value={entry.fieldOfStudy}
                                onChange={(e) => updateEducationEntry(entry.id, "fieldOfStudy", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="e.g., Computer Science, Business Administration"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Grade/GPA (Optional)
                              </label>
                              <input
                                type="text"
                                value={entry.grade}
                                onChange={(e) => updateEducationEntry(entry.id, "grade", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="e.g., 3.8/4.0, First Class"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                              <input
                                type="month"
                                value={entry.startDate}
                                onChange={(e) => updateEducationEntry(entry.id, "startDate", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                              <input
                                type="month"
                                value={entry.endDate}
                                onChange={(e) => updateEducationEntry(entry.id, "endDate", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description (Optional)
                            </label>
                            <textarea
                              value={entry.description}
                              onChange={(e) => updateEducationEntry(entry.id, "description", e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Activities, societies, achievements, relevant coursework..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end mt-8 space-x-4">
                    <button
                      type="button"
                      onClick={() => router.push("/?view=internalcandidates")}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Uploading..." : "Upload Candidate"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bulk Upload Section */}
            {uploadType === "bulk" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload Candidates</h3>
                <p className="text-gray-600 mb-6">
                  Upload multiple candidates at once using a CSV file. All three steps are required to complete the
                  upload.
                </p>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex items-center space-x-2 ${bulkUploadSteps.csvUploaded ? "text-green-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bulkUploadSteps.csvUploaded ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                        >
                          {bulkUploadSteps.csvUploaded ? <Check size={16} /> : "1"}
                        </div>
                        <span className="text-sm font-medium">Upload CSV (Required)</span>
                      </div>
                      <div
                        className={`w-8 h-0.5 ${bulkUploadSteps.csvUploaded ? "bg-green-200" : "bg-gray-200"}`}
                      ></div>
                      <div
                        className={`flex items-center space-x-2 ${bulkUploadSteps.profilePhotosUploaded ? "text-green-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bulkUploadSteps.profilePhotosUploaded ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                        >
                          {bulkUploadSteps.profilePhotosUploaded ? <Check size={16} /> : "2"}
                        </div>
                        <span className="text-sm font-medium">Profile Photos (Required)</span>
                      </div>
                      <div
                        className={`w-8 h-0.5 ${bulkUploadSteps.profilePhotosUploaded ? "bg-green-200" : "bg-gray-200"}`}
                      ></div>
                      <div
                        className={`flex items-center space-x-2 ${bulkUploadSteps.resumesUploaded ? "text-green-600" : "text-gray-400"}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${bulkUploadSteps.resumesUploaded ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                        >
                          {bulkUploadSteps.resumesUploaded ? <Check size={16} /> : "3"}
                        </div>
                        <span className="text-sm font-medium">Resumes (Required)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 1: CSV Upload Section */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${bulkUploadSteps.csvUploaded ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {bulkUploadSteps.csvUploaded ? <Check size={14} /> : "1"}
                    </span>
                    Step 1: Upload CSV File (Required){" "}
                    {bulkUploadSteps.csvUploaded && <span className="ml-2 text-green-600">✓</span>}
                  </h4>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        setCsvFile(e.target.files[0])
                        handleCSVUpload(e.target.files[0])
                      }}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {csvFile ? "CSV File Uploaded Successfully" : "Upload CSV File"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {csvFile ? csvFile.name : "Drag & drop your CSV file here, or click to browse"}
                      </p>
                    </label>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={downloadCSVTemplate}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      <Download size={16} className="mr-1" />
                      Download CSV Template
                    </button>
                    {csvPreview.length > 0 && (
                      <button
                        onClick={importFromCSV}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        Import {csvPreview.length} Candidates
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2: Profile Photos Upload Section */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${bulkUploadSteps.profilePhotosUploaded ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {bulkUploadSteps.profilePhotosUploaded ? <Check size={14} /> : "2"}
                    </span>
                    Step 2: Profile Photos (Required){" "}
                    {bulkUploadSteps.profilePhotosUploaded && <span className="ml-2 text-green-600">✓</span>}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload profile photos for candidates. Name files as: <code>email_profile.jpg</code> (e.g.,
                    john.doe@example.com_profile.jpg)
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.gif"
                      onChange={(e) => {
                        setBulkProfilePhotos(Array.from(e.target.files))
                        setBulkUploadSteps((prev) => ({ ...prev, profilePhotosUploaded: e.target.files.length > 0 }))
                      }}
                      className="hidden"
                      id="profile-photos-upload"
                    />
                    <label htmlFor="profile-photos-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {bulkProfilePhotos.length > 0
                          ? `${bulkProfilePhotos.length} Profile Photos Selected`
                          : "Upload Profile Photos"}
                      </p>
                      <p className="text-sm text-gray-600">Drag & drop profile photos here, or click to browse</p>
                    </label>
                  </div>
                  {bulkProfilePhotos.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Selected files ({bulkProfilePhotos.length}):
                      </p>
                      <ul className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                        {bulkProfilePhotos.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Step 3: Resumes Upload Section */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium mr-2 ${bulkUploadSteps.resumesUploaded ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {bulkUploadSteps.resumesUploaded ? <Check size={14} /> : "3"}
                    </span>
                    Step 3: Resumes (Required){" "}
                    {bulkUploadSteps.resumesUploaded && <span className="ml-2 text-green-600">✓</span>}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload resumes for candidates. Name files as: <code>email_resume.pdf</code> (e.g.,
                    john.doe@example.com_resume.pdf)
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        setBulkResumes(Array.from(e.target.files))
                        setBulkUploadSteps((prev) => ({ ...prev, resumesUploaded: e.target.files.length > 0 }))
                      }}
                      className="hidden"
                      id="resumes-upload"
                    />
                    <label htmlFor="resumes-upload" className="cursor-pointer">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        {bulkResumes.length > 0 ? `${bulkResumes.length} Resumes Selected` : "Upload Resumes"}
                      </p>
                      <p className="text-sm text-gray-600">Drag & drop resumes here, or click to browse</p>
                    </label>
                  </div>
                  {bulkResumes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected files ({bulkResumes.length}):</p>
                      <ul className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                        {bulkResumes.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {bulkCandidates.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        Candidates Ready for Upload ({bulkCandidates.length})
                      </h4>
                      <button
                        onClick={() => setPreviewModalVisible(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      >
                        <Eye size={16} className="mr-1" />
                        Preview All
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                              <th className="px-4 py-2">Name</th>
                              <th className="px-4 py-2">Role</th>
                              <th className="px-4 py-2">Email</th>
                              <th className="px-4 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkCandidates.slice(0, 5).map((candidate, index) => (
                              <tr key={index} className="border-b">
                                <td className="px-4 py-2">{candidate.name}</td>
                                <td className="px-4 py-2">{candidate.role}</td>
                                <td className="px-4 py-2">{candidate.email}</td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}
                                  >
                                    {candidate.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {bulkCandidates.length > 5 && (
                              <tr>
                                <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                                  + {bulkCandidates.length - 5} more candidates
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 space-x-4">
                      <button
                        onClick={() => {
                          setBulkCandidates([])
                          setCsvFile(null)
                          setBulkProfilePhotos([])
                          setBulkResumes([])
                          setBulkUploadSteps({
                            csvUploaded: false,
                            profilePhotosUploaded: false,
                            resumesUploaded: false,
                          })
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Clear All
                      </button>

                      {/* Only show upload button if all 3 steps are complete */}
                      {bulkUploadSteps.csvUploaded &&
                        bulkUploadSteps.profilePhotosUploaded &&
                        bulkUploadSteps.resumesUploaded ? (
                        <button
                          onClick={handleBulkUpload}
                          disabled={loading}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Uploading..." : `Upload ${bulkCandidates.length} Candidates`}
                        </button>
                      ) : (
                        <div className="text-right">
                          <button
                            disabled
                            className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                          >
                            Complete All 3 Steps to Upload
                          </button>
                          <p className="text-sm text-red-600 mt-2">
                            Required: {!bulkUploadSteps.csvUploaded && "CSV, "}
                            {!bulkUploadSteps.profilePhotosUploaded && "Profile Photos, "}
                            {!bulkUploadSteps.resumesUploaded && "Resumes"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Uploads Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Uploads</h3>
              {recentUploads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent uploads found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-2">Upload Name</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Candidates</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUploads.map((upload) => (
                        <tr key={upload._id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{upload.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              {upload.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">{upload.candidateCount}</td>
                          <td className="px-4 py-3">{new Date(upload.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Completed
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedCandidate(upload)
                                  setPreviewModalVisible(true)
                                }}
                                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUpload(upload._id)}
                                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Preview Modal */}
        {previewModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCandidate?.name || "Candidate Preview"}
                </h3>
                <button
                  onClick={() => {
                    setPreviewModalVisible(false)
                    setSelectedCandidate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                {selectedCandidate?.type === "single" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{selectedCandidate.candidates[0]?.name}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{selectedCandidate.candidates[0]?.email}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Phone</label>
                        <p className="text-gray-900">{selectedCandidate.candidates[0]?.phone}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Role</label>
                        <p className="text-gray-900">{selectedCandidate.candidates[0]?.role}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Status</label>
                        <p className="text-gray-900">{selectedCandidate.candidates[0]?.status}</p>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700">Experience</label>
                        <p className="text-gray-900">{selectedCandidate.candidates[0]?.experience}</p>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Skills</label>
                      <p className="text-gray-900">{selectedCandidate.candidates[0]?.skills}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">About</label>
                      <p className="text-gray-900">{selectedCandidate.candidates[0]?.about}</p>
                    </div>
                    {/* Education preview for single upload */}
                    <div>
                      <label className="font-medium text-gray-700">Education</label>
                      {selectedCandidate.candidates[0]?.education ? (
                        (() => {
                          try {
                            const educationData = JSON.parse(selectedCandidate.candidates[0].education)
                            if (Array.isArray(educationData) && educationData.length > 0) {
                              return (
                                <div className="space-y-2 mt-2">
                                  {educationData.map((edu, idx) => (
                                    <div key={idx} className="border-l-2 border-blue-200 pl-3">
                                      <p className="font-semibold text-gray-800">
                                        {edu.degree} in {edu.fieldOfStudy}
                                      </p>
                                      <p className="text-sm text-gray-600">{edu.institution}</p>
                                      <p className="text-xs text-gray-500">
                                        {edu.startDate} - {edu.endDate}
                                      </p>
                                      {edu.description && (
                                        <p className="text-xs text-gray-500 mt-1">{edu.description}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                          } catch (e) {
                            console.error("Failed to parse education JSON:", e)
                            return <p className="text-red-500 text-sm">Error displaying education data.</p>
                          }
                          return <p className="text-gray-600">No education details provided.</p>
                        })()
                      ) : (
                        <p className="text-gray-600">No education details provided.</p>
                      )}
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Projects</label>
                      <p className="text-gray-900">{selectedCandidate.candidates[0]?.projects}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600 mb-4">
                      Showing {Math.min(selectedCandidate?.candidates?.length || 0, 10)} of{" "}
                      {selectedCandidate?.candidates?.length} candidates
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-2">Name</th>
                            <th className="px-4 py-2">Role</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCandidate?.candidates?.slice(0, 10).map((candidate, index) => (
                            <tr key={index} className="border-b">
                              <td className="px-4 py-2">{candidate.name}</td>
                              <td className="px-4 py-2">{candidate.role}</td>
                              <td className="px-4 py-2">{candidate.email}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(candidate.status)}`}>
                                  {candidate.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end p-6 border-t">
                <button
                  onClick={() => {
                    setPreviewModalVisible(false)
                    setSelectedCandidate(null)
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default UploadCandidates
