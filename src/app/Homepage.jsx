"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./components/Logo";
import {
  FaBriefcase,
  FaHome,
  FaFileAlt,
  FaEnvelope,
  FaPhone,
  FaLinkedin,
  FaFacebook,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function Homepage() {
  const router = useRouter();
  const navItems = [
    "Companies",
    "Partner Bench",
    "Mentorship Program",
    "Login",
    "Sign Up",
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobType: "",
    experienceLevel: "",
    salaryRange: "",
    location: "",
    company: "",
    datePosted: "",
  });
  const [email, setEmail] = useState("");

  const handleLoginRoute = () => {
    router.push("/?view=login");
  };

  const handleSignupRoute = () => {
    router.push("/?view=signup");
  };

  const handleEmployerRoute = () => {
    router.push("/?view=employersignup");
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  const handleBrowseJobsClick = () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      router.push("/jobs");
    } else {
      alert("Please log in as a candidate to browse jobs.");
      router.push("/?view=login");
    }
  };

  const handlePostJobClick = () => {
    const employerId = localStorage.getItem("employerId");
    if (employerId) {
      router.push("/?view=companyprofile");
    } else {
      alert("Please log in as an employer to post a job.");
      router.push("/?view=employersignup");
    }
  };

  const handleNavClick = (item) => {
    switch (item) {
      case "Companies":
        router.push("/companies");
        break;
      case "Partner Bench":
        router.push("/partner-bench");
        break;
      case "Mentorship Program":
        router.push("/mentorship");
        break;

      case "Sign Up":
        handleSignupRoute();
        break;
      default:
        break;
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <div className="w-full relative min-h-screen overflow-hidden">
        {/* Background Circle */}
        <div className="fixed w-[600px] h-[700px] md:w-[800px] md:h-[900px] lg:w-[1000px] lg:h-[1100px] xl:w-[1400px] xl:h-[1500px] 2xl:w-[1600px] 2xl:h-[1700px] bg-blue-500 rounded-full -z-10 top-1/2 -translate-y-1/2 -right-[40%] md:-right-[35%] lg:-right-[25%] xl:-right-[20%] 2xl:-right-[15%] opacity-10"></div>

        {/* Navigation Bar */}
        <nav className="flex items-center justify-between bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 w-full px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 z-50 h-16 md:h-18 lg:h-20 xl:h-22 2xl:h-24">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <Logo size={200} className="cursor-pointer" />
          </div>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex list-none gap-4 xl:gap-6 2xl:gap-8 m-0 p-0 items-center">
            {navItems.slice(0, -2).map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleNavClick(item)}
                  className="nav-item-underline text-gray-700 hover:text-blue-500 transition-colors duration-300 text-sm xl:text-base 2xl:text-lg font-medium cursor-pointer bg-transparent border-none font-family-Montserrat"
                >
                  {item}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={handleLoginRoute}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 cursor-pointer"
              >
                Login
              </button>
            </li>
          </ul>

          {/* Mobile Hamburger Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden flex flex-col gap-1 bg-transparent border-none cursor-pointer p-2 transition-transform duration-300"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`w-5 md:w-6 h-0.5 bg-gray-600 rounded-sm transition-all duration-300 ${
                  isMobileMenuOpen
                    ? i === 0
                      ? "rotate-45 translate-y-1.5"
                      : i === 2
                      ? "-rotate-45 -translate-y-1.5"
                      : "opacity-0"
                    : ""
                }`}
              ></span>
            ))}
          </button>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden absolute top-full right-4 bg-white/95 backdrop-blur-md shadow-lg rounded-lg p-4 z-50 min-w-[180px] md:min-w-[200px] border border-gray-200">
              {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full right-4 bg-white/95 backdrop-blur-md shadow-lg rounded-lg p-4 z-50 min-w-[180px] md:min-w-[200px] border border-gray-200">
                  <ul className="list-none m-0 p-0 flex flex-col gap-2">
                    {navItems.slice(0, -2).map((item, index) => (
                      <li key={index}>
                        <button
                          onClick={() => {
                            handleNavClick(item);
                            setIsMobileMenuOpen(false);
                          }}
                          className="nav-item-underline text-gray-700 hover:text-blue-500 transition-colors duration-300 text-sm font-medium cursor-pointer bg-transparent border-none w-full text-left p-2 rounded hover:bg-gray-50"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => {
                          handleLoginRoute();
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-gray-700 hover:text-blue-500 border border-gray-300 hover:border-blue-500 px-4 py-2 rounded-lg font-semibold transition-all duration-300 w-full"
                      >
                        Login
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handleSignupRoute();
                          setIsMobileMenuOpen(false);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 w-full"
                      >
                        Sign Up
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <div className="pt-20 md:pt-24 lg:pt-28 xl:pt-32 2xl:pt-36 px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center min-h-[calc(100vh-5rem)]">
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-6 lg:space-y-8">
                <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 leading-tight">
                  Find Your <span className="text-blue-500">Dream Job</span>{" "}
                  Today
                </h1>

                <p className="text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl text-gray-600 leading-relaxed">
                  Connect with top companies and discover opportunities that
                  match your skills and aspirations.
                </p>

                {/* Enhanced Search Bar */}
                <div className="w-full max-w-4xl mx-auto lg:mx-0">
                  <div className="bg-white/95 backdrop-blur-md p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12 rounded-2xl shadow-2xl border border-white/20">
                    {/* Main Search Section */}
                    <div className="space-y-4 md:space-y-6 lg:space-y-8 mb-6 md:mb-8 lg:mb-10">
                      {/* Primary Search Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 items-end">
                        {/* Job Search Input */}
                        <div className="space-y-2">
                          <label className="block text-xs md:text-sm lg:text-base font-semibold text-gray-700">
                            What job are you looking for?
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Job title, keywords, or company..."
                              className="w-full px-3 md:px-4 lg:px-5 py-3 md:py-4 lg:py-5 pr-10 md:pr-12 lg:pr-14 rounded-lg border-2 border-gray-200 text-sm md:text-base lg:text-lg focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/15 outline-none transition-all duration-300 bg-white"
                            />
                            <div className="absolute right-3 md:right-4 lg:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg
                                className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  cx="11"
                                  cy="11"
                                  r="8"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="m21 21-4.35-4.35"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Location Input */}
                        <div className="space-y-2">
                          <label className="block text-xs md:text-sm lg:text-base font-semibold text-gray-700">
                            Where?
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="City, state, or remote"
                              className="w-full px-3 md:px-4 lg:px-5 py-3 md:py-4 lg:py-5 pr-10 md:pr-12 lg:pr-14 rounded-lg border-2 border-gray-200 text-sm md:text-base lg:text-lg focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/15 outline-none transition-all duration-300 bg-white"
                            />
                            <div className="absolute right-3 md:right-4 lg:right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                              <svg
                                className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <path
                                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <circle
                                  cx="12"
                                  cy="10"
                                  r="3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Search Button */}
                        <button className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 md:px-8 lg:px-10 py-3 md:py-4 lg:py-5 rounded-lg text-sm md:text-base lg:text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 flex items-center justify-center whitespace-nowrap">
                          Find Jobs
                        </button>
                      </div>
                    </div>

                    {/* Advanced Filters Toggle */}
                    <div className="flex justify-center mb-0">
                      <button
                        onClick={() =>
                          setShowAdvancedFilters(!showAdvancedFilters)
                        }
                        className="bg-transparent text-blue-500 border border-blue-500 px-4 md:px-6 lg:px-8 py-2 md:py-3 lg:py-4 rounded-lg text-xs md:text-sm lg:text-base font-medium hover:bg-blue-50 transition-all duration-300 flex items-center gap-2"
                      >
                        {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${
                            showAdvancedFilters ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                      <div className="mt-6 md:mt-8 lg:mt-10 p-4 md:p-6 lg:p-8 bg-gray-50 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                          {[
                            {
                              label: "Job Type",
                              options: [
                                "Full-time",
                                "Part-time",
                                "Contract",
                                "Freelance",
                              ],
                            },
                            {
                              label: "Experience Level",
                              options: [
                                "Entry Level",
                                "Mid Level",
                                "Senior Level",
                                "Executive",
                              ],
                            },
                            {
                              label: "Salary Range",
                              options: [
                                "$0-50k",
                                "$50k-100k",
                                "$100k-150k",
                                "$150k+",
                              ],
                            },
                            {
                              label: "Company Size",
                              options: ["Startup", "Small", "Medium", "Large"],
                            },
                            {
                              label: "Industry",
                              options: [
                                "Technology",
                                "Healthcare",
                                "Finance",
                                "Education",
                              ],
                            },
                            {
                              label: "Date Posted",
                              options: [
                                "Last 24 hours",
                                "Last week",
                                "Last month",
                                "Anytime",
                              ],
                            },
                          ].map((filter, index) => (
                            <div key={index} className="space-y-2">
                              <label className="block text-xs md:text-sm lg:text-base font-semibold text-gray-700">
                                {filter.label}
                              </label>
                              <select className="w-full px-3 md:px-4 lg:px-5 py-2 md:py-3 lg:py-4 rounded-lg border-2 border-gray-200 text-sm md:text-base lg:text-lg focus:border-blue-500 outline-none transition-all duration-300 bg-white">
                                <option value="">Select {filter.label}</option>
                                {filter.options.map((option, optIndex) => (
                                  <option key={optIndex} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Content - Hero Image */}
              <div className="flex flex-col items-center lg:items-end space-y-6 lg:space-y-8">
                <div className="relative">
                  <img
                    src="https://i.ibb.co/sJ68Wd6d/Hero-Right.jpg"
                    alt="Hero Image"
                    className="w-full max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl h-auto rounded-lg shadow-2xl shadow-blue-500/15"
                  />
                </div>
                <div className="text-center lg:text-right">
                  <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-semibold text-gray-900 mb-3 md:mb-4 lg:mb-6">
                    Join 10,000+ Job Seekers
                  </h3>
                  <p className="text-gray-600 text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl leading-relaxed">
                    Trusted by professionals worldwide to find their perfect
                    career match.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="w-full py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 bg-gray-50 rounded-lg my-12 md:my-16 lg:my-20 xl:py-24 2xl:my-28 overflow-hidden">
          <div className="text-center mb-8 md:mb-12 lg:mb-16 xl:mb-20 2xl:mb-24">
            <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-light text-gray-900 mb-2 md:mb-4">
              Trusted by Leading Tech Companies
            </h2>
            <p className="text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-600">
              Join thousands of professionals from top tech companies
            </p>
          </div>

          {/* Infinite Scrolling Container */}
          <div className="relative w-full overflow-hidden py-10 bg-gradient-to-r from-gray-50 via-white to-gray-50">
            {/* Top decorative line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>

            <div className="flex items-center animate-scroll-left whitespace-nowrap">
              {[
                {
                  name: "Google",
                  logo: "https://logo.clearbit.com/google.com",
                },
                {
                  name: "Microsoft",
                  logo: "https://logo.clearbit.com/microsoft.com",
                },
                { name: "Apple", logo: "https://logo.clearbit.com/apple.com" },
                {
                  name: "Amazon",
                  logo: "https://logo.clearbit.com/amazon.com",
                },
                { name: "Meta", logo: "https://logo.clearbit.com/meta.com" },
                {
                  name: "Netflix",
                  logo: "https://logo.clearbit.com/netflix.com",
                },
                {
                  name: "Nvidia",
                  logo: "https://logo.clearbit.com/nvidia.com",
                },
                {
                  name: "Spotify",
                  logo: "https://logo.clearbit.com/spotify.com",
                },
                { name: "Adobe", logo: "https://logo.clearbit.com/adobe.com" },
                {
                  name: "Samsung",
                  logo: "https://logo.clearbit.com/samsung.com",
                },
                { name: "Intel", logo: "https://logo.clearbit.com/intel.com" },
                {
                  name: "Oracle",
                  logo: "https://logo.clearbit.com/oracle.com",
                },
                {
                  name: "Salesforce",
                  logo: "https://logo.clearbit.com/salesforce.com",
                },
                { name: "IBM", logo: "https://logo.clearbit.com/ibm.com" },
                { name: "Tesla", logo: "https://logo.clearbit.com/tesla.com" },
              ]
                .concat([
                  {
                    name: "Google",
                    logo: "https://logo.clearbit.com/google.com",
                  },
                  {
                    name: "Microsoft",
                    logo: "https://logo.clearbit.com/microsoft.com",
                  },
                  {
                    name: "Apple",
                    logo: "https://logo.clearbit.com/apple.com",
                  },
                  {
                    name: "Amazon",
                    logo: "https://logo.clearbit.com/amazon.com",
                  },
                ])
                .map((company, index) => (
                  <div
                    key={index}
                    className="inline-flex flex-col items-center justify-center mx-8 px-6 py-5 bg-white rounded-xl border border-gray-200 min-w-[160px] h-28 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-500"
                  >
                    <img
                      src={company.logo}
                      alt={`${company.name} logo`}
                      className="w-12 h-12 object-contain mb-2"
                    />
                    <p className="text-sm font-medium text-gray-700">
                      {company.name}
                    </p>
                  </div>
                ))}
            </div>

            {/* Bottom decorative line */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
          </div>
        </div>
        {/* How It Works Section */}
        <section className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-light text-gray-900 mb-4 md:mb-6 lg:mb-8">
              How It Works
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-gray-600 mb-12 md:mb-16 lg:mb-20 xl:mb-24 2xl:mb-28 max-w-3xl mx-auto">
              Get started in minutes with our simple process
            </p>

            <div className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 xl:gap-24 2xl:gap-28">
              {/* For Job Seekers */}
              <div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl text-blue-500 mb-8 md:mb-10 lg:mb-12 xl:mb-16 2xl:mb-20 font-light">
                  For Job Seekers
                </h3>
                <div className="space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 2xl:space-y-16">
                  {[
                    {
                      step: 1,
                      title: "Create Your Profile",
                      desc: "Build a comprehensive profile showcasing your skills and experience",
                    },
                    {
                      step: 2,
                      title: "AI-Powered Matching",
                      desc: "Our smart algorithm finds jobs that perfectly match your profile",
                    },
                    {
                      step: 3,
                      title: "Apply with Confidence",
                      desc: "Apply to jobs with one click using your optimized profile",
                    },
                    {
                      step: 4,
                      title: "Land Your Dream Job",
                      desc: "Get hired by top companies looking for your exact skills",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center text-left gap-4 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8 bg-gray-50 rounded-xl border-2 border-transparent hover:border-blue-500 hover:bg-white hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300"
                    >
                      <div className="min-w-[60px] h-15 bg-blue-500 rounded-full flex items-center justify-center text-2xl md:text-3xl lg:text-4xl text-white font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-gray-900 mb-2 md:mb-3 lg:mb-4 font-semibold">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* For Employers */}
              <div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl text-purple-600 mb-8 md:mb-10 lg:mb-12 xl:mb-16 2xl:mb-20 font-light">
                  For Employers
                </h3>
                <div className="space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12 2xl:space-y-16">
                  {[
                    {
                      step: 1,
                      title: "Post Your Job",
                      desc: "Create detailed job postings with requirements and company info",
                    },
                    {
                      step: 2,
                      title: "AI-Powered Matching",
                      desc: "Our algorithm finds and ranks the best candidates for you",
                    },
                    {
                      step: 3,
                      title: "Review Applications",
                      desc: "Manage applications with our intuitive dashboard",
                    },
                    {
                      step: 4,
                      title: "Hire Top Talent",
                      desc: "Connect directly with candidates and make your hire",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center text-left gap-4 md:gap-6 lg:gap-8 p-4 md:p-6 lg:p-8 bg-gray-50 rounded-xl border-2 border-transparent hover:border-purple-600 hover:bg-white hover:shadow-xl hover:shadow-purple-600/15 transition-all duration-300"
                    >
                      <div className="min-w-[60px] h-15 bg-purple-600 rounded-full flex items-center justify-center text-2xl md:text-3xl lg:text-4xl text-white font-bold">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-gray-900 mb-2 md:mb-3 lg:mb-4 font-semibold">
                          {item.title}
                        </h4>
                        <p className="text-gray-600 text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-Action Section */}
        <section className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 md:mb-6 lg:mb-8">
              Ready to Transform Your Career?
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl mb-8 md:mb-12 lg:mb-16 opacity-90 max-w-3xl mx-auto">
              Join thousands of professionals who have found their dream jobs or
              hired exceptional talent through Talent on Cloud
            </p>

            <div className="flex flex-col sm:flex-row gap-6 md:gap-8 lg:gap-10 justify-center">
              <button
                onClick={handleBrowseJobsClick}
                className="bg-white text-blue-500 px-8 md:px-10 lg:px-12 py-4 md:py-5 lg:py-6 rounded-xl text-lg md:text-xl lg:text-2xl font-light hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 min-w-[200px]"
              >
                Browse Jobs
              </button>
              <button
                onClick={handlePostJobClick}
                className="bg-transparent text-white border-2 border-white px-8 md:px-10 lg:px-12 py-4 md:py-5 lg:py-6 rounded-xl text-lg md:text-xl lg:text-2xl font-bold hover:bg-white hover:text-blue-500 hover:-translate-y-1 transition-all duration-300 min-w-[200px]"
              >
                Post Your Job
              </button>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 bg-gray-50">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-8">
              Success Stories
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-gray-600 mb-12 md:mb-16 lg:mb-20 max-w-3xl mx-auto">
              See how Talent on Cloud has transformed careers and businesses
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12 mb-12 md:mb-16 lg:mb-20">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Software Engineer",
                  company: "TechCorp",
                  story:
                    "I found my dream job in just 2 weeks! The AI matching was incredible - I got interviews with companies I never would have found otherwise.",
                  rating: 5,
                },
                {
                  name: "Mark Chen",
                  role: "Hiring Manager",
                  company: "InnovateLab",
                  story:
                    "We hired 3 exceptional developers through Talent on Cloud. The quality of candidates was outstanding, and the process was seamless.",
                  rating: 5,
                },
                {
                  name: "Emily Rodriguez",
                  role: "UX Designer",
                  company: "DesignStudio",
                  story:
                    "The platform made job searching so much easier. I loved how I could see company culture fit scores before applying.",
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white p-6 md:p-8 lg:p-10 rounded-2xl shadow-lg text-left hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="flex mb-4 md:mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span
                        key={i}
                        className="text-yellow-400 text-xl md:text-2xl"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 leading-relaxed mb-6 md:mb-8 italic">
                    "{testimonial.story}"
                  </p>
                  <div className="flex items-center gap-4">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/6522/6522516.png"
                      alt={testimonial.name}
                      className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-base md:text-lg lg:text-xl xl:text-2xl text-gray-900 mb-1 font-semibold">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-8 md:p-10 lg:p-12 rounded-2xl shadow-lg">
              <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl text-gray-900 mb-6 md:mb-8 lg:mb-10 font-semibold">
                Join Our Community
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
                {[
                  { number: "98%", label: "Success Rate" },
                  { number: "4.9/5", label: "User Rating" },
                  { number: "2 weeks", label: "Average Hire Time" },
                  { number: "50K+", label: "Happy Users" },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-blue-500 mb-2 md:mb-3 lg:mb-4">
                      {stat.number}
                    </div>
                    <div className="text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Blog Section */}
        <section className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-900 mb-4 md:mb-6 lg:mb-8">
              Career Insights & Tips
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl text-gray-600 mb-12 md:mb-16 lg:mb-20 max-w-3xl mx-auto">
              Stay ahead with the latest career advice, industry trends, and job
              search tips
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12 mb-8 md:mb-12 lg:mb-16">
              {[
                {
                  category: "Interview Tips",
                  title: "10 Common Interview Questions and How to Answer Them",
                  excerpt:
                    "Master the most frequently asked interview questions with our comprehensive guide...",
                  date: "Jan 15, 2025",
                  readTime: "5 min read",
                  icon: (
                    <i className="fa-solid fa-question text-4xl md:text-5xl lg:text-6xl text-white"></i>
                  ),
                },
                {
                  category: "Industry Trends",
                  title: "The Future of Remote Work: Trends for 2025",
                  excerpt:
                    "Explore how remote work is evolving and what it means for your career...",
                  date: "Jan 12, 2025",
                  readTime: "7 min read",
                  icon: (
                    <i className="fa-solid fa-arrow-trend-up text-4xl md:text-5xl lg:text-6xl text-white"></i>
                  ),
                },
                {
                  category: "Resume Tips",
                  title: "ATS-Friendly Resume: Complete Guide for 2025",
                  excerpt:
                    "Learn how to optimize your resume to pass Applicant Tracking Systems...",
                  date: "Jan 10, 2025",
                  readTime: "6 min read",
                  icon: (
                    <FaFileAlt className="text-4xl md:text-5xl lg:text-6xl text-white" />
                  ),
                },
              ].map((article, index) => (
                <article
                  key={index}
                  className="bg-gray-50 rounded-2xl overflow-hidden text-left hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <div className="h-48 md:h-56 lg:h-64 bg-blue-500 flex items-center justify-center">
                    {article.icon}
                  </div>
                  <div className="p-6 md:p-8 lg:p-10">
                    <div className="inline-block bg-blue-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm lg:text-base font-semibold mb-3 md:mb-4 lg:mb-6">
                      {article.category}
                    </div>
                    <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-gray-900 mb-3 md:mb-4 lg:mb-6 font-semibold leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm md:text-base lg:text-lg xl:text-xl leading-relaxed mb-4 md:mb-6 lg:mb-8">
                      {article.excerpt}
                    </p>
                    <div className="flex justify-between items-center text-xs md:text-sm lg:text-base text-gray-500">
                      <span>{article.date}</span>
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 md:px-8 lg:px-10 py-3 md:py-4 lg:py-5 rounded-lg text-base md:text-lg lg:text-xl font-semibold hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              View All Articles
            </button>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 md:py-20 lg:py-24 xl:py-28 2xl:py-32 px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 bg-gray-900 text-white text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-4 md:mb-6 lg:mb-8">
              Stay Updated with Latest Jobs
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl mb-8 md:mb-10 lg:mb-12 opacity-90">
              Get the latest job opportunities delivered directly to your inbox.
              Never miss out on your dream job!
            </p>
            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-4 md:gap-6 max-w-2xl mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 min-w-[250px] px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5 rounded-lg border-2 border-blue-500 text-base md:text-lg lg:text-xl outline-none text-gray-900 bg-white placeholder-gray-500"
              />

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 md:px-8 lg:px-10 py-3 md:py-4 lg:py-5 rounded-lg text-base md:text-lg lg:text-xl font-semibold hover:-translate-y-1 transition-all duration-300 whitespace-nowrap cursor-pointer"
              >
                Subscribe Now
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-8 md:mb-12 lg:mb-16">
              {/* Company Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="flex flex-col leading-tight font-bold">
                    <span className="text-xl md:text-2xl lg:text-3xl mb-1">
                      Talent on <span className="text-blue-400">Cloud</span>
                    </span>
                    <span className="text-sm md:text-base text-gray-400 font-normal">
                      Powered by{" "}
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm md:text-base lg:text-lg leading-relaxed mb-4 md:mb-6">
                  Connecting talented professionals with innovative companies
                  worldwide. Your career transformation starts here.
                </p>
                <div className="flex gap-4">
                  {[FaLinkedin, FaFacebook, FaEnvelope].map((Icon, index) => (
                    <button
                      key={index}
                      className="w-10 h-10 md:w-12 md:h-12 bg-gray-800 hover:bg-blue-500 rounded-full flex items-center justify-center transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                      <Icon className="text-lg md:text-xl" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 md:mb-6">
                  Quick Links
                </h3>
                <ul className="space-y-2 md:space-y-3">
                  {[
                    "Find Jobs",
                    "Companies",
                    "Post a Job",
                    "About Us",
                    "Contact",
                  ].map((link, index) => (
                    <li key={index}>
                      <button className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base cursor-pointer">
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 md:mb-6">
                  Contact
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-blue-400" />
                    <span className="text-gray-400 text-sm md:text-base">
                      contact@talentoncloud.com
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-blue-400" />
                    <span className="text-gray-400 text-sm md:text-base">
                      +9100000000
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-blue-400" />
                    <span className="text-gray-400 text-sm md:text-base">
                      India, Bangalore
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm md:text-base text-center md:text-left">
                © 2025 Talent on Cloud. All rights reserved.
              </p>
              <div className="flex gap-6 md:gap-8">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (link, index) => (
                    <button
                      key={index}
                      className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base cursor-pointer"
                    >
                      {link}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }
      `}</style>
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes underline-loading {
          0% {
            width: 0;
            left: 0;
          }
          100% {
            width: 100%;
            left: 0;
          }
        }

        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }

        .animate-scroll-left:hover {
          animation-play-state: paused;
        }

        .nav-item-underline {
          position: relative;
          overflow: visible;
        }

        .nav-item-underline::after {
          content: "";
          position: absolute;
          bottom: -4px;
          left: 0;
          height: 2px;
          background: linear-gradient(to right, #3b82f6, #8b5cf6);
          width: 0;
          transition: all 0.3s ease;
          border-radius: 1px;
        }

        .nav-item-underline:hover::after {
          animation: underline-loading 0.6s forwards;
        }
      `}</style>
    </>
  );
}
