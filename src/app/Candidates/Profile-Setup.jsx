"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Menu, X, Plus, User, GraduationCap, Briefcase, Award, Code, Camera,
  FileText, Check, ArrowLeft, ArrowRight, Video, CreditCard, Linkedin, Loader2
} from "lucide-react"
import { useAuth } from "../context/AuthContext"

// Custom hook for responsive design
const useScreenSize = () => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  return isMobile
}

// UI Components
const StyledInput = (props) => <input {...props} className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white transition-all duration-300 ${props.className || ''}`} />;
const StyledSelect = ({ children, ...props }) => <select {...props} className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white appearance-none cursor-pointer bg-[url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")] bg-[length:1.5em_1.5em] bg-[right_1rem_center] bg-no-repeat ${props.className || ''}`}>{children}</select>;
const StyledTextArea = (props) => <textarea {...props} className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none bg-white resize-y min-h-[120px] ${props.className || ''}`} />;
const FormField = ({ label, children, required }) => <div className="space-y-2"><label className="block text-sm font-semibold text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>{children}</div>;
const StepContentWrapper = ({ title, subtitle, children }) => <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-10 shadow-sm border border-gray-200"><div className="mb-8"><h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{title}</h1><p className="text-base md:text-lg text-gray-600">{subtitle}</p></div>{children}</div>;
const Logo = () => <div className="flex flex-col leading-tight font-bold text-gray-800"><span className="text-lg font-bold">Talent on <span className="text-blue-500">Cloud</span></span><span className="text-xs text-gray-500 font-normal">Candidate Profile Setup</span></div>;

export default function CandidateProfileSetup() {
  const [activeStep, setActiveStep] = useState(1)
  const isMobile = useScreenSize()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { markProfileSetupCompleted } = useAuth()

  const [personalData, setPersonalData] = useState({ firstName: "", lastName: "", email: "", mobile: "", location: "", linkedinUrl: "", profilePhoto: null, resume: null, introductionVideo: null });
  const [educationData, setEducationData] = useState([{ degree: "", specialization: "", university: "", startYear: "", endYear: "", grades: "" }]);
  const [experienceData, setExperienceData] = useState([{ jobTitle: "", employer: "", startDate: "", endDate: "", experienceSummary: "", currentJob: false }]);
  const [skillsData, setSkillsData] = useState([]);
  const [projectsData, setProjectsData] = useState([{ projectName: "", description: "", keySkills: "" }]);
  const [kycData, setKycData] = useState({ panCard: null, panCardName: "" })

  const [selectedSkill, setSelectedSkill] = useState("");
  const resumeInputRef = useRef(null);
  const linkedinInputRef = useRef(null);
  const photoInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const panCardInputRef = useRef(null)

  const handleFileChange = (e, field, sizeLimitMB, validTypes, callback) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validTypes && !validTypes.includes(file.type)) {
      alert(`Invalid file type. Please upload one of: ${validTypes.join(', ')}`);
      return;
    }
    if (file.size > sizeLimitMB * 1024 * 1024) {
      alert(`File size must be less than ${sizeLimitMB}MB.`);
      return;
    }
    callback(file);
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const candidatePayload = {
        personalInfo: {
          firstName: personalData.firstName,
          lastName: personalData.lastName,
          email: personalData.email,
          mobile: personalData.mobile,
          location: personalData.location,
          linkedinUrl: personalData.linkedinUrl
        },
        education: educationData.filter(e => e.degree && e.university),
        experience: experienceData.filter(e => e.jobTitle && e.employer),
        skills: skillsData,
        projects: projectsData.filter(p => p.projectName),
        profileStatus: "completed",
      };
      const formData = new FormData();
      formData.append("data", JSON.stringify(candidatePayload));
      if (personalData.profilePhoto) formData.append("profilePhoto", personalData.profilePhoto);
      if (personalData.resume) formData.append("resume", personalData.resume);
      if (personalData.introductionVideo) formData.append("introductionVideo", personalData.introductionVideo);
      if (kycData.panCard) formData.append("kycDocument", kycData.panCard);

      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User ID not found. Please sign up again.");

      console.log('Submitting profile data:', {
        userId,
        candidatePayload,
        hasProfilePhoto: !!personalData.profilePhoto,
        hasResume: !!personalData.resume,
        hasVideo: !!personalData.introductionVideo,
        hasKyc: !!kycData.panCard
      });

      const response = await fetch(`https://toc-bac-1.onrender.com/api/user/${userId}/profile`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to save profile");
      }

      const result = await response.json();
      console.log('Profile setup response:', result);

      alert("Profile setup completed successfully!");
      markProfileSetupCompleted();

      // Route to login page after successful setup
      router.push("/?view=login");

    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generic state updater functions for lists
  const updateListItem = (setter, index, field, value) => {
    setter(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const addListItem = (setter, newItem) => setter(prev => [...prev, newItem]);
  const removeListItem = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

  const steps = [
    { id: 1, title: "Personal Details", icon: <User size={20} /> },
    { id: 2, title: "Education", icon: <GraduationCap size={20} /> },
    { id: 3, title: "Work Experience", icon: <Briefcase size={20} /> },
    { id: 4, title: "Skills & Projects", icon: <Award size={20} /> },
    { id: 5, title: "Video & KYC", icon: <Video size={20} /> },
  ];

  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, steps.length));
  const handlePrevious = () => setActiveStep(prev => Math.max(prev - 1, 1));

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <StepContentWrapper title="Personal Information" subtitle="Tell us about yourself to create your professional profile">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-12 items-start">
              <div className="flex flex-col items-center gap-4 justify-self-center lg:justify-self-start">
                <div onClick={() => photoInputRef.current.click()} className="w-36 h-36 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden relative hover:border-blue-400">
                  {personalData.profilePhoto ? <img src={URL.createObjectURL(personalData.profilePhoto)} alt="Profile" className="w-full h-full object-cover" /> : <User size={48} className="text-gray-400" />}
                  <div className="absolute bottom-1 right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"><Camera size={16} className="text-white" /></div>
                </div>
                <input type="file" ref={photoInputRef} onChange={(e) => handleFileChange(e, 'profilePhoto', 2, ['image/jpeg', 'image/png'], (file) => setPersonalData(p => ({ ...p, profilePhoto: file })))} accept="image/*" className="hidden" />
                <span className="text-sm text-gray-600 font-medium">{personalData.profilePhoto ? "Change Photo" : "Upload Photo"}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="First Name" required><StyledInput type="text" value={personalData.firstName} onChange={e => setPersonalData(p => ({ ...p, firstName: e.target.value }))} /></FormField>
                <FormField label="Last Name" required><StyledInput type="text" value={personalData.lastName} onChange={e => setPersonalData(p => ({ ...p, lastName: e.target.value }))} /></FormField>
                <FormField label="Email Address" required><StyledInput type="email" value={personalData.email} onChange={e => setPersonalData(p => ({ ...p, email: e.target.value }))} /></FormField>
                <FormField label="Mobile Number" required><StyledInput type="tel" value={personalData.mobile} onChange={e => setPersonalData(p => ({ ...p, mobile: e.target.value }))} /></FormField>
                <FormField label="Location" required><StyledSelect value={personalData.location} onChange={e => setPersonalData(p => ({ ...p, location: e.target.value }))}><option value="">Select Location</option>{["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "Remote"].map(opt => <option key={opt} value={opt}>{opt}</option>)}</StyledSelect></FormField>
                <FormField label="LinkedIn URL" required><StyledInput type="url" value={personalData.linkedinUrl} onChange={e => setPersonalData(p => ({ ...p, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/username" required ref={linkedinInputRef} /></FormField>
                <div className="md:col-span-2">
                  <FormField label="Upload Resume (PDF, Max 5MB)" required>
                    <div onClick={() => resumeInputRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 cursor-pointer hover:border-blue-400">
                      <div className="space-y-3">
                        <FileText size={40} className="text-blue-500 mx-auto" />
                        {personalData.resume ? (
                          <p className="font-medium text-gray-800">{personalData.resume.name}</p>
                        ) : (
                          <>
                            <p className="font-medium text-gray-800 mb-1">Click to upload your resume</p>
                            <p className="text-sm text-gray-600">Supported: PDF only</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={resumeInputRef}
                        onChange={(e) => handleFileChange(e, 'resume', 5, ['application/pdf'], (file) => setPersonalData(p => ({ ...p, resume: file })))}
                        accept=".pdf"
                        className="hidden"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </div>
          </StepContentWrapper>
        );
      case 2:
        return (
          <StepContentWrapper title="Educational Background" subtitle="Add your academic qualifications">
            <div className="space-y-6">
              {educationData.map((edu, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-6 border border-gray-200 relative">
                  {index > 0 && <button onClick={() => removeListItem(setEducationData, index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>}
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Education {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Degree" required><StyledInput value={edu.degree} onChange={e => updateListItem(setEducationData, index, 'degree', e.target.value)} /></FormField>
                    <FormField label="Specialization" required><StyledInput value={edu.specialization} onChange={e => updateListItem(setEducationData, index, 'specialization', e.target.value)} /></FormField>
                    <FormField label="University" required><StyledInput value={edu.university} onChange={e => updateListItem(setEducationData, index, 'university', e.target.value)} /></FormField>
                    <FormField label="Grades/CGPA"><StyledInput value={edu.grades} onChange={e => updateListItem(setEducationData, index, 'grades', e.target.value)} /></FormField>
                    <FormField label="Start Year" required><StyledInput type="number" value={edu.startYear} onChange={e => updateListItem(setEducationData, index, 'startYear', e.target.value)} /></FormField>
                    <FormField label="End Year" required><StyledInput type="number" value={edu.endYear} onChange={e => updateListItem(setEducationData, index, 'endYear', e.target.value)} /></FormField>
                  </div>
                </div>
              ))}
              <div className="flex justify-center mt-6"><button onClick={() => addListItem(setEducationData, { degree: "", specialization: "", university: "", startYear: "", endYear: "", grades: "" })} className="flex items-center gap-2 bg-transparent text-blue-600 border-2 border-dashed border-blue-600 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50"><Plus size={16} /> Add Education</button></div>
            </div>
          </StepContentWrapper>
        );
      case 3:
        return (
          <StepContentWrapper title="Work Experience" subtitle="Share your professional journey">
            <div className="space-y-6">
              {experienceData.map((exp, index) => (
                <div key={index} className="bg-slate-50 rounded-xl p-6 border border-gray-200 relative">
                  {index > 0 && <button onClick={() => removeListItem(setExperienceData, index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>}
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Experience {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Job Title" required><StyledInput value={exp.jobTitle} onChange={e => updateListItem(setExperienceData, index, 'jobTitle', e.target.value)} /></FormField>
                    <FormField label="Company" required><StyledInput value={exp.employer} onChange={e => updateListItem(setExperienceData, index, 'employer', e.target.value)} /></FormField>
                    <FormField label="Start Date" required><StyledInput type="month" value={exp.startDate} onChange={e => updateListItem(setExperienceData, index, 'startDate', e.target.value)} /></FormField>
                    <div>
                      <FormField label="End Date">
                        <StyledInput type="month" value={exp.endDate} onChange={e => updateListItem(setExperienceData, index, 'endDate', e.target.value)} disabled={exp.currentJob} className={exp.currentJob ? "opacity-60" : ""} />
                      </FormField>
                      <div className="flex items-center gap-3 mt-3">
                        <input type="checkbox" id={`current-job-${index}`} checked={exp.currentJob} onChange={e => updateListItem(setExperienceData, index, 'currentJob', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor={`current-job-${index}`} className="text-sm text-gray-600">I currently work here</label>
                      </div>
                    </div>
                    <div className="md:col-span-2"><FormField label="Job Description"><StyledTextArea value={exp.experienceSummary} onChange={e => updateListItem(setExperienceData, index, 'experienceSummary', e.target.value)} /></FormField></div>
                  </div>
                </div>
              ))}
              <div className="flex justify-center mt-6"><button onClick={() => addListItem(setExperienceData, { jobTitle: "", employer: "", startDate: "", endDate: "", experienceSummary: "", currentJob: false })} className="flex items-center gap-2 bg-transparent text-blue-600 border-2 border-dashed border-blue-600 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50"><Plus size={16} /> Add Experience</button></div>
            </div>
          </StepContentWrapper>
        );
      case 4:
        return (
          <StepContentWrapper title="Skills & Projects" subtitle="Highlight your expertise and showcase your work">
            <div className="space-y-8">
              {/* Skills Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Skills</h3>
                <FormField label="Add a skill">
                  <div className="flex gap-4">
                    <StyledInput type="text" value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} placeholder="e.g., JavaScript" />
                    <button onClick={() => { if (selectedSkill) { setSkillsData(s => [...s, selectedSkill]); setSelectedSkill(""); } }} disabled={!selectedSkill} className={`px-6 py-3 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${selectedSkill ? "bg-blue-600 text-white" : "bg-gray-300 cursor-not-allowed"}`}><Plus size={16} />Add</button>
                  </div>
                </FormField>
                <div className="flex flex-wrap gap-3 mt-4">
                  {skillsData.map((skill, index) => <div key={index} className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-200"><span>{skill}</span><button onClick={() => setSkillsData(s => s.filter(i => i !== skill))} className="text-gray-500 hover:text-red-500 w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-100">×</button></div>)}
                </div>
              </div>
              <hr />
              {/* Projects Section */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Projects</h3>
                {projectsData.map((proj, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-6 border border-gray-200 relative mb-6">
                    {index > 0 && <button onClick={() => removeListItem(setProjectsData, index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>}
                    <div className="space-y-6">
                      <FormField label="Project Name" required><StyledInput value={proj.projectName} onChange={e => updateListItem(setProjectsData, index, 'projectName', e.target.value)} /></FormField>
                      <FormField label="Description"><StyledTextArea value={proj.description} onChange={e => updateListItem(setProjectsData, index, 'description', e.target.value)} /></FormField>
                      <FormField label="Technologies Used"><StyledInput value={proj.keySkills} onChange={e => updateListItem(setProjectsData, index, 'keySkills', e.target.value)} placeholder="Comma-separated, e.g., React, Node.js" /></FormField>
                    </div>
                  </div>
                ))}
                <div className="flex justify-center mt-6"><button onClick={() => addListItem(setProjectsData, { projectName: "", description: "", keySkills: "" })} className="flex items-center gap-2 bg-transparent text-blue-600 border-2 border-dashed border-blue-600 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-50"><Plus size={16} /> Add Project</button></div>
              </div>
            </div>
          </StepContentWrapper>
        );
      case 5:
        return (
          <StepContentWrapper title="Video & Verification" subtitle="Add a personal touch and complete verification">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Video Introduction</h3>
                <div onClick={() => videoInputRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 cursor-pointer hover:border-blue-400">
                  {personalData.introductionVideo ? <video controls src={URL.createObjectURL(personalData.introductionVideo)} className="max-w-full max-h-60 rounded-lg mx-auto" /> : <div className="space-y-4"><Video size={48} className="text-gray-400 mx-auto" /><p className="font-medium">Click to upload a video (Max 50MB)</p></div>}
                  <input type="file" ref={videoInputRef} onChange={(e) => handleFileChange(e, 'introductionVideo', 50, ['video/mp4', 'video/quicktime'], (file) => setPersonalData(p => ({ ...p, introductionVideo: file })))} accept="video/*" className="hidden" />
                </div>
              </div>
              <hr />
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">KYC Verification</h3>
                <div onClick={() => panCardInputRef.current.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 cursor-pointer hover:border-blue-400">
                  {kycData.panCard ? <p className="font-medium flex items-center justify-center gap-2"><FileText /> {kycData.panCardName}</p> : <div className="space-y-4"><CreditCard size={48} className="text-gray-400 mx-auto" /><p className="font-medium">Upload PAN Card (Max 2MB)</p></div>}
                  <input type="file" ref={panCardInputRef} onChange={(e) => handleFileChange(e, 'panCard', 2, ['image/jpeg', 'image/png', 'application/pdf'], (file) => setKycData({ panCard: file, panCardName: file.name }))} accept=".jpg,.png,.pdf" className="hidden" />
                </div>
              </div>
            </div>
          </StepContentWrapper>
        );
      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20"><Logo />{isMobile && <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">{isMenuOpen ? <X /> : <Menu />}</button>}</div>
      </header>
      <div className="flex min-h-[calc(100vh-5rem)] max-w-7xl mx-auto">
        {(!isMobile || isMenuOpen) && (
          <aside className={`${isMobile ? "w-full" : "w-80"} bg-white border-r border-gray-200 ${isMobile ? "relative" : "sticky top-20"} ${isMobile ? "h-auto" : "h-[calc(100vh-5rem)]"} overflow-y-auto flex-shrink-0`}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Profile Setup</h2>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-4"><div className="h-full bg-blue-600" style={{ width: `${(activeStep / steps.length) * 100}%` }} /></div>
            </div>
            <nav className="py-2">
              {steps.map((step) => <div key={step.id} onClick={() => setActiveStep(step.id)} className={`flex items-center gap-4 px-6 py-4 cursor-pointer border-r-4 ${activeStep === step.id ? "bg-blue-50 border-blue-600" : "border-transparent hover:bg-gray-50"}`}><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeStep === step.id ? "bg-blue-600 text-white" : activeStep > step.id ? "bg-green-500 text-white" : "bg-gray-100"}`}>{activeStep > step.id ? <Check /> : step.icon}</div><span className={activeStep === step.id ? "text-blue-700 font-medium" : "text-gray-700"}>{step.title}</span></div>)}
            </nav>
          </aside>
        )}
        <main className="flex-1 p-6 md:p-8 lg:p-10 bg-slate-50 min-w-0">
          {renderStepContent()}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-10 gap-4">
            <button onClick={handlePrevious} disabled={activeStep === 1} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold border-2 w-full sm:w-auto ${activeStep === 1 ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white text-gray-600 border-gray-300 hover:text-gray-800"}`}><ArrowLeft size={16} /> Previous</button>
            {activeStep < steps.length ? (
              <button onClick={handleNext} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 shadow-lg w-full sm:w-auto">Next <ArrowRight size={16} /></button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold shadow-lg w-full sm:w-auto ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}>{isSubmitting ? <><Loader2 className="animate-spin" />Saving...</> : <><Check size={16} />Complete Profile</>}</button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
