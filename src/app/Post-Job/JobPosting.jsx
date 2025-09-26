"use client"

import { useState, useEffect } from "react"
import Logo from "@/app/components/Logo";
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react";

const API_BASE_URL = "https://toc-bac-1.onrender.com/api";

export default function JobPostingForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")


  // Form state
  const [formData, setFormData] = useState({
    jobTitle: "",
    location: "",
    employmentType: "",
    jobCategory: "",
    experienceLevel: "",
    companyName: "",
    applicationEmail: "",
    keySkills: "",
    screeningQuestions: "",
  })

  const [jobDescription, setJobDescription] = useState("")
  const [responsibilities, setResponsibilities] = useState("")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [errors, setErrors] = useState({})

  // Helper to check if a value is filled
  const isFilled = (v) => v && (typeof v === "string" ? v.trim() !== "" : true)

  // Real-time progress tracking
  useEffect(() => {
    const jobDetailsFilled = [
      formData.jobTitle,
      formData.location,
      formData.employmentType,
      formData.jobCategory,
      salaryMin,
      salaryMax,
      formData.experienceLevel,
    ].every(isFilled)

    const companyInfoFilled = jobDetailsFilled && [formData.companyName, logoFile].every(isFilled)

    const requirementsFilled =
      companyInfoFilled && [jobDescription, responsibilities, formData.keySkills].every(isFilled)

    const applicationSettingsFilled = requirementsFilled && [formData.applicationEmail].every(isFilled)

    let step = 0
    if (jobDetailsFilled) step = 1
    if (companyInfoFilled) step = 2
    if (requirementsFilled) step = 3
    if (applicationSettingsFilled) step = 4
    setCurrentStep(step)
  }, [formData, salaryMin, salaryMax, logoFile, jobDescription, responsibilities])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem("jobDraft")
    if (draft) {
      try {
        const data = JSON.parse(draft)
        setFormData((prev) => ({ ...prev, ...data }))
        setJobDescription(data.jobDescription || "")
        setResponsibilities(data.responsibilities || "")
        setSalaryMin(data.salaryMin || "")
        setSalaryMax(data.salaryMax || "")
        if (data.logoFileName) {
          showMessage(`Please re-upload your company logo: ${data.logoFileName}`, "info")
        }
      } catch (error) {
        console.error("Error loading draft:", error)
      }
    }
  }, [])

  // Clean up logo preview
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showMessage("Only image files are allowed!", "error")
      return
    }

    setLogoFile(file)
    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)
    showMessage("Company logo selected!", "success")
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleGenerateFromPrompt = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/generate-job-post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error("Failed to generate job post")
      const data = await res.json()

      if (data.jobDescription) setJobDescription(data.jobDescription)
      if (data.responsibilities) setResponsibilities(data.responsibilities)
      if (data.keySkills) handleInputChange("keySkills", data.keySkills)

      showMessage("Job post generated successfully!", "success")
    } catch (err) {
      showMessage(err.message || "Failed to generate job post", "error")
    } finally {
      setGenerating(false)
    }
  }


  const validateForm = () => {
    const newErrors = {}

    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required"
    if (!formData.location.trim()) newErrors.location = "Location is required"
    if (!formData.employmentType) newErrors.employmentType = "Employment type is required"
    if (!formData.jobCategory) newErrors.jobCategory = "Job category is required"
    if (!formData.experienceLevel) newErrors.experienceLevel = "Experience level is required"
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required"
    if (!logoFile) newErrors.logo = "Company logo is required"
    if (!formData.keySkills.trim()) newErrors.keySkills = "Key skills are required"
    if (!formData.applicationEmail.trim()) {
      newErrors.applicationEmail = "Application email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.applicationEmail)) {
      newErrors.applicationEmail = "Please enter a valid email"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveDraft = () => {
    const draft = {
      ...formData,
      jobDescription,
      responsibilities,
      salaryMin,
      salaryMax,
      logoFileName: logoFile?.name || null,
    }
    localStorage.setItem("jobDraft", JSON.stringify(draft))
    showMessage("Job posting saved as draft!", "success")
  }

  const handleClearDraft = () => {
    localStorage.removeItem("jobDraft")
    setFormData({
      jobTitle: "",
      location: "",
      employmentType: "",
      jobCategory: "",
      experienceLevel: "",
      companyName: "",
      applicationEmail: "",
      keySkills: "",
      screeningQuestions: "",
    })
    setJobDescription("")
    setResponsibilities("")
    setSalaryMin("")
    setSalaryMax("")
    setLogoFile(null)
    setLogoPreview(null)
    setErrors({})
    showMessage("Draft cleared!", "success")
  }

  const handlePostJob = async () => {
    if (!validateForm()) {
      showMessage("Please fill in all required fields", "error")
      return
    }

    try {
      const formDataToSend = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "screeningQuestions") {
          formDataToSend.append(key, value)
        }
      })

      if (salaryMin && !isNaN(Number(salaryMin))) {
        formDataToSend.append("salaryMin", Number(salaryMin))
      }
      if (salaryMax && !isNaN(Number(salaryMax))) {
        formDataToSend.append("salaryMax", Number(salaryMax))
      }

      formDataToSend.append("jobDescription", jobDescription)
      formDataToSend.append("responsibilities", responsibilities)
      formDataToSend.append("screeningQuestions", formData.screeningQuestions)

      if (logoFile) {
        formDataToSend.append("logo", logoFile)
      }

      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/jobs`, {
        method: "POST",
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        body: formDataToSend,
      })

      if (!res.ok) {
        let errorMsg = "Failed to post job"
        try {
          const errorData = await res.json()
          if (errorData?.error) errorMsg = errorData.error
        } catch { }
        throw new Error(errorMsg)
      }

      showMessage("Job posted successfully!", "success")
      handleClearDraft()
      router.push("/?view=jobs")
    } catch (err) {
      showMessage(err.message || "Failed to post job", "error")
    }
  }

  const showMessage = (message, type) => {
    // Simple toast implementation - you could replace with a proper toast library
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium ${type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
      }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => document.body.removeChild(toast), 3000)
  }

  const steps = [
    { title: "Job Details", number: 1 },
    { title: "Company Info", number: 2 },
    { title: "Requirements", number: 3 },
    { title: "Review & Post", number: 4 },
  ]
  const handleClick = () => {
    router.push('/?view=companyprofile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">


            <div className="flex items-center">
              <Logo size={200} />
            </div>

            {/* <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5zM4 19h10a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
            </div> */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleClick}
          aria-label="Go to company profile"
          className="cursor-pointer"
        >
          <ArrowLeft />
        </button>
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Create New Job Posting</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fill out the form below to create a new job opening and attract top talent.
          </p>
        </div>


        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${index <= currentStep ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`text-sm font-medium whitespace-nowrap ${index <= currentStep ? "text-indigo-600" : "text-gray-500"
                        }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${index < currentStep ? "bg-indigo-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <br />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate from Prompt</h3>
            <p className="text-sm text-gray-600 mb-4">
              Describe the job you want to post and let AI help you create the content.
            </p>

            {/* Search bar style input + button */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Hire a React developer in Bangalore with 3+ years experience..."
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={generating}
              />

              <button
                onClick={handleGenerateFromPrompt}
                disabled={!prompt.trim() || generating}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "..." : "Generate"}
              </button>
            </div>
          </div>
        </div>



        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Details</h2>
                <p className="text-gray-600">Provide the core information about the job opening.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    placeholder="Senior Frontend Engineer"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.jobTitle ? "border-red-300" : "border-gray-300"
                      }`}
                  />
                  {errors.jobTitle && <p className="mt-1 text-sm text-red-600">{errors.jobTitle}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Remote (Global)"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.location ? "border-red-300" : "border-gray-300"
                      }`}
                  />
                  {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleInputChange("employmentType", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.employmentType ? "border-red-300" : "border-gray-300"
                      }`}
                  >
                    <option value="">Select employment type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                  </select>
                  {errors.employmentType && <p className="mt-1 text-sm text-red-600">{errors.employmentType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Category *</label>
                  <select
                    value={formData.jobCategory}
                    onChange={(e) => handleInputChange("jobCategory", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.jobCategory ? "border-red-300" : "border-gray-300"
                      }`}
                  >
                    <option value="">Select job category</option>
                    <option value="software-development">Software Development</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                  </select>
                  {errors.jobCategory && <p className="mt-1 text-sm text-red-600">{errors.jobCategory}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Annual)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="130,000"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                    <input
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="150,000"
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level *</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.experienceLevel ? "border-red-300" : "border-gray-300"
                      }`}
                  >
                    <option value="">Select experience level</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level (2-5 years)</option>
                    <option value="senior">Senior Level (5+ years)</option>
                    <option value="lead">Lead/Principal</option>
                  </select>
                  {errors.experienceLevel && <p className="mt-1 text-sm text-red-600">{errors.experienceLevel}</p>}
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Information</h2>
                <p className="text-gray-600">Details about your company that candidates will see.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Innovate Solutions Inc."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.companyName ? "border-red-300" : "border-gray-300"
                      }`}
                  />
                  {errors.companyName && <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Company Logo *</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${errors.logo ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }`}
                  >
                    {logoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="Logo Preview"
                          className="mx-auto w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <div>
                          <p className="text-sm text-gray-600">{logoFile?.name}</p>
                          <p className="text-xs text-gray-500">{logoFile ? (logoFile.size / 1024).toFixed(1) : 0} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-4 py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-indigo-600 font-medium">Upload Company Logo</p>
                          <p className="text-sm text-gray-500">Drag and drop or click to upload (JPG, PNG, GIF)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif"
                          onChange={handleLogoChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                      </div>
                    )}
                  </div>
                  {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo}</p>}
                </div>
              </div>
            </div>

            {/* Job Description Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Description</h2>
                <p className="text-gray-600">A comprehensive overview of the role's purpose, duties, and impact.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                />
              </div>
            </div>

            {/* Responsibilities Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Responsibilities</h2>
                <p className="text-gray-600">Outline the key duties and responsibilities required for this position.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Responsibilities</label>
                <textarea
                  rows={6}
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  placeholder="• Lead frontend development initiatives&#10;• Collaborate with design and backend teams&#10;• Mentor junior developers..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                />
              </div>
            </div>

            {/* Required Skills Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Required Key Skills</h2>
                <p className="text-gray-600">List the essential skills required for this job (comma-separated).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Key Skills *</label>
                <input
                  type="text"
                  value={formData.keySkills}
                  onChange={(e) => handleInputChange("keySkills", e.target.value)}
                  placeholder="e.g. React, Node.js, MongoDB, TypeScript"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.keySkills ? "border-red-300" : "border-gray-300"
                    }`}
                />
                {errors.keySkills && <p className="mt-1 text-sm text-red-600">{errors.keySkills}</p>}
              </div>
            </div>

            {/* Application Settings Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Settings</h2>
                <p className="text-gray-600">Configure how candidates apply and optional application requirements.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Email *</label>
                  <input
                    type="email"
                    value={formData.applicationEmail}
                    onChange={(e) => handleInputChange("applicationEmail", e.target.value)}
                    placeholder="careers@yourcompany.com"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors.applicationEmail ? "border-red-300" : "border-gray-300"
                      }`}
                  />
                  {errors.applicationEmail && <p className="mt-1 text-sm text-red-600">{errors.applicationEmail}</p>}
                  <p className="mt-1 text-sm text-gray-500">Applications will be sent to this email address.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Screening Questions (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.screeningQuestions}
                    onChange={(e) => handleInputChange("screeningQuestions", e.target.value)}
                    placeholder="Add comma-separated questions to screen candidates (e.g., 'Years of experience in React?', 'Familiar with TypeScript?')"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    These questions will be asked during the application process.
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Preview Column */}
          <div className="lg:col-span-1">

            <div className="sticky top-24 space-y-6">
              {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate from Prompt</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Describe the job you want to post and let AI help you create the content.
                </p>

                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="I want to hire a React developer for a fintech startup in Bangalore with 3+ years experience..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical mb-4"
                  disabled={generating}
                />

                <button
                  onClick={handleGenerateFromPrompt}
                  disabled={!prompt.trim() || generating}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? "Generating..." : "Generate from Prompt"}
                </button>
              </div> */}
              {/* Job Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Posting Preview</h3>
                <p className="text-sm text-gray-600 mb-6">This is how your job posting will appear to candidates.</p>

                <div className="bg-white rounded-lg p-5 border border-blue-100">
                  {/* Company Logo and Title */}
                  <div className="flex items-start space-x-4 mb-5">
                    {logoPreview ? (
                      <img
                        src={logoPreview || "/placeholder.svg"}
                        alt="Company Logo"
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0">
                        📊
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">
                        {formData.jobTitle || "Job Title"}
                      </h4>
                      <p className="text-indigo-600 font-medium">{formData.companyName || "Company Name"}</p>
                      <p className="text-sm text-gray-500">
                        {formData.location || "Location"} • {formData.jobCategory || "Category"}
                      </p>
                    </div>
                  </div>

                  {/* Job Details Tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {formData.employmentType && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🕒 {formData.employmentType}
                      </span>
                    )}
                    {(salaryMin || salaryMax) && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        💰 ₹{salaryMin || "0"} - ₹{salaryMax || "0"}
                      </span>
                    )}
                    {formData.experienceLevel && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        👨‍💻 {formData.experienceLevel}
                      </span>
                    )}
                  </div>

                  {/* Job Description Preview */}
                  {jobDescription && (
                    <div className="mb-5">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h5>
                      <p className="text-sm text-gray-600 line-clamp-4">{jobDescription}</p>
                    </div>
                  )}

                  {/* Responsibilities Preview */}
                  {responsibilities && (
                    <div className="mb-5">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Responsibilities</h5>
                      <div className="text-sm text-gray-600">
                        {responsibilities
                          .split("\n")
                          .slice(0, 3)
                          .map((item, index) => (
                            <div key={index} className="mb-1">
                              {item}
                            </div>
                          ))}
                        {responsibilities.split("\n").length > 3 && (
                          <p className="text-gray-400 text-xs">...and more</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills Preview */}
                  {formData.keySkills && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h5>
                      <div className="flex flex-wrap gap-1">
                        {formData.keySkills
                          .split(",")
                          .slice(0, 6)
                          .map(
                            (skill, idx) =>
                              skill.trim() && (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
                                >
                                  {skill.trim()}
                                </span>
                              ),
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Generation */}

            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push("/all-jobs")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={handleClearDraft}
            className="px-6 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Clear Draft
          </button>
          <button
            onClick={handlePostJob}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all transform hover:scale-105"
          >
            Post Job
          </button>
        </div>
      </div>
    </div>
  )
}
