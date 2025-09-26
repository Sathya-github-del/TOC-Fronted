"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Logo from "@/app/components/Logo";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import {
  Search as SearchIcon,
  MapPin as MapPinIcon,
  Briefcase as BriefcaseIcon,
  ChevronDown as ChevronDownIcon,
  Menu as MenuIcon,
  X as XIcon,
  Wallet as WalletIcon,
  Bookmark as BookmarkIcon,
} from "lucide-react";

// --- API Configuration ---
const API_BASE_URL = "https://toc-bac-1.onrender.com/api";

// --- NavigationBar Component ---
const NavigationBar = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = ["Employer Profile"];

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <span onClick={() => router.push("/")} className="cursor-pointer">
              <Logo size={200} />
            </span>
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <a
                  key={item}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (item === "Employer Profile") {
                      router.push('/?view=companyprofile');
                    }
                  }}
                  className="text-sm font-medium text-gray-600 hover:text-indigo-500 transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {!isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => router.push('/?view=login')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/?view=signup')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/90 backdrop-blur-md py-2 border-t border-gray-200">
            {navItems.map((item) => (
              <a
                key={item}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (item === "Employer Profile") {
                    router.push('/?view=companyprofile');
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="block px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-500 transition-colors"
              >
                {item}
              </a>
            ))}
            {!isAuthenticated && (
              <div className="px-4 py-2 space-y-2">
                <button
                  onClick={() => {
                    router.push('/?view=login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    router.push('/?view=signup');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

// --- Filter Sidebar Component ---
const FilterSidebar = () => {
  return (
    <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-md border border-gray-200 sticky top-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-xl text-gray-800">Filters</h2>
        <button className="text-sm font-semibold text-indigo-600 hover:underline">
          Clear All
        </button>
      </div>

      <FilterSection title="Job Type">
        <div className="space-y-3">
          {["Full-time", "Part-time", "Contract", "Internship"].map((type) => (
            <label key={type} className="flex items-center space-x-3 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Experience Level">
        <div className="space-y-3">
          {[
            { label: "Fresher (0-1 years)", value: "0-1" },
            { label: "Mid-Level (2-5 years)", value: "2-5" },
            { label: "Senior (6-10 years)", value: "6-10" },
            { label: "Lead (10+ years)", value: "10-99" },
          ].map((exp) => (
            <label key={exp.value} className="flex items-center space-x-3 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>{exp.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

const FilterSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left group"
      >
        <h3 className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600">
          {title}
        </h3>
        <ChevronDownIcon
          size={18}
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
};

// --- Enhanced JobCard Component ---
const JobCard = ({ job, onApply, onOpenDetails }) => (
  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-bold text-xl text-gray-900">{job.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{job.company}</p>
      </div>
      <span className="text-xs font-semibold text-white px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm">
        {job.type || "Full-time"}
      </span>
    </div>

    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
      <span className="flex items-center gap-1">
        <MapPinIcon size={16} className="text-indigo-500" />
        {job.location}
      </span>
      <span className="flex items-center gap-1">
        <BriefcaseIcon size={16} className="text-indigo-500" />
        {job.experience}
      </span>
      <span className="flex items-center gap-1">
        <WalletIcon size={16} className="text-indigo-500" />
        {job.salary}
      </span>
    </div>

    <p className="text-sm text-gray-500 mt-2">
      Posted: <span className="font-medium text-gray-800">{new Date(job.postedAt).toLocaleDateString()}</span>
      {job.company && (
        <> · <span>Posted by: <span className="font-medium text-gray-800">{job.company}</span></span></>
      )}
    </p>

    {job.description && (
      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{job.description}</p>
    )}

    {job.skills && job.skills.length > 0 && (
      <div className="flex flex-wrap gap-2 mt-4">
        {job.skills.slice(0, 4).map((skill, idx) => (
          <span
            key={idx}
            className={`text-xs font-medium px-3 py-1 rounded-full ${[
              "bg-indigo-100 text-indigo-700",
              "bg-purple-100 text-purple-700",
              "bg-pink-100 text-pink-700",
              "bg-teal-100 text-teal-700"
            ][idx % 4]
              }`}
          >
            {skill}
          </span>
        ))}
      </div>
    )}

    <div className="flex justify-between items-center mt-6 pt-4 border-t">
      <button className="p-2 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition">
        <BookmarkIcon size={20} />
      </button>
      <button
        onClick={() => onApply(job)}
        className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition"
      >
        Easy Apply →
      </button>
      <button
        onClick={() => onOpenDetails(job)}
        className="px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50"
      >
        View Details
      </button>
    </div>
  </div>
);

// --- Enhanced ApplyModal Component ---
const ApplyModal = ({ job, onClose, onSubmit, internalCandidates }) => {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const filteredCandidates = internalCandidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.role && c.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = () => {
    if (selectedCandidates.length === 0) {
      alert("Please select at least one candidate to submit.");
      return;
    }
    onSubmit(job.id, selectedCandidates);
  };

  if (!job) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-xl border border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Apply on behalf of Candidate(s)</h2>
        <p className="text-base text-gray-600 mb-4">Job: {job.title}</p>

        <label className="text-base font-medium text-gray-700">Search by Name or Role</label>
        <div className="relative mt-2">
          <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter name or role..."
            className="w-full p-3 pl-10 border rounded-md bg-white text-base focus:ring-2 focus:ring-indigo-400 outline-none"
          />
        </div>

        <label className="text-base font-medium text-gray-700 mt-6 block">Select Candidate(s)</label>
        <div className="mt-3 max-h-60 overflow-y-auto space-y-3">
          {filteredCandidates.length > 0 ? (
            filteredCandidates.map((c) => (
              <label key={c._id} className="flex items-center space-x-3 text-base text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(c._id)}
                  onChange={() => handleSelectCandidate(c._id)}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="font-semibold">{c.name}</p>
                  {c.role && <p className="text-sm text-gray-500">{c.role}</p>}
                </div>
              </label>
            ))
          ) : (
            <p className="text-base text-gray-500">No candidates match the search.</p>
          )}
        </div>

        <div className="flex justify-end mt-8 gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2 text-base border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            disabled={selectedCandidates.length === 0}
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function EmployerJobSearch() {
  const router = useRouter();
  const { logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalCandidates, setInternalCandidates] = useState([]);
  const [detailsJob, setDetailsJob] = useState(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/?view=employerlogin");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  }, [router]);

  useEffect(() => {
    const fetchJobsAndCandidates = async () => {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      try {
        const jobsPromise = axios.get(`${API_BASE_URL}/jobs/alljobs`);
        const candidatesPromise = axios.get(`${API_BASE_URL}/internal-candidates`, { headers });

        const [jobsRes, candidatesRes] = await Promise.all([jobsPromise, candidatesPromise]);

        setJobs(jobsRes.data || []);
        setInternalCandidates(candidatesRes.data.candidates || []);
      } catch (err) {
        setError("Failed to load jobs or candidates. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobsAndCandidates();
  }, [getAuthHeaders]);

  const handleApplyClick = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (job) => {
    setDetailsJob(job);
  };
  const handleCloseDetails = () => setDetailsJob(null);

  const handleSubmitApplication = async (jobId, candidateIds) => {
    const headers = getAuthHeaders();
    if (!jobId || !candidateIds || candidateIds.length === 0) {
      alert("Invalid submission data.");
      return;
    }

    try {
      const payload = {
        jobId: jobId,
        candidateIds: candidateIds,
      };
      const response = await axios.post(`${API_BASE_URL}/job-applications`, payload, { headers });
      alert(`Successfully submitted ${response.data.count} applications!`);
      setIsModalOpen(false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unknown error occurred.";
      console.error("Failed to submit applications:", errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const filteredJobs = jobs;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <NavigationBar />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-12 lg:gap-8">
          <aside className="hidden lg:block lg:col-span-3 h-full">
            <FilterSidebar />
          </aside>

          <div className="lg:col-span-9 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-lg text-gray-600">Loading jobs...</div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-4 border rounded-2xl shadow-sm">
                  <h2 className="font-bold text-gray-800">
                    {filteredJobs.length} Jobs Found
                  </h2>
                  <select className="border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="newest">Newest</option>
                    <option value="salary">Salary</option>
                  </select>
                </div>

                {filteredJobs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredJobs.map((job) => (
                      <JobCard key={job.id} job={job} onApply={handleApplyClick} onOpenDetails={handleOpenDetails} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-lg text-gray-600">No jobs found that match your criteria.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {isModalOpen && selectedJob && (
          <ApplyModal
            job={selectedJob}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmitApplication}
            internalCandidates={internalCandidates}
          />
        )}

        {detailsJob && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{detailsJob.title}</h2>
                <button onClick={handleCloseDetails} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <p className="text-sm text-gray-500 mb-2">Company: <span className="font-medium text-gray-800">{detailsJob.company}</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                <div>Location: <span className="font-medium">{detailsJob.location}</span></div>
                <div>Experience: <span className="font-medium">{detailsJob.experience}</span></div>
                <div>Salary: <span className="font-medium">{detailsJob.salary}</span></div>
                <div>Posted: <span className="font-medium">{new Date(detailsJob.postedAt).toLocaleDateString()}</span></div>
              </div>
              {detailsJob.description && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailsJob.description}</p>
                </div>
              )}
              {Array.isArray(detailsJob.skills) && detailsJob.skills.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailsJob.skills.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={handleCloseDetails} className="px-4 py-2 border rounded-md">Close</button>
                <button onClick={() => { handleApplyClick(detailsJob); handleCloseDetails(); }} className="px-5 py-2 bg-indigo-600 text-white rounded-md">Easy Apply</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}