"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2 as BusinessIcon,
  FileStack as InsertDriveFileIcon,
  MapPin as LocationOnIcon,
  Mail as EmailIcon,
  Pen as EditIcon,
  LogOut as LogoutIcon,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";

export default function CompanyProfile() {
  const [companyProfile, setCompanyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [currentPath, setCurrentPath] = useState("");
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentPath(window.location.search);
    }
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const employerId = localStorage.getItem("employerId");
        const token = localStorage.getItem("token");
        if (!employerId || !token) {
          throw new Error("No employer id found. Please login again.");
        }
        const response = await fetch(
          `https://toc-bac-1.onrender.com/api/company-profile/${employerId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Failed to fetch company profile");
        }
        const profileData = await response.json();
        setCompanyProfile(profileData);
        localStorage.setItem("companyProfile", JSON.stringify(profileData));
      } catch (err) {
        setError(err.message);
        if (err.message.includes("login again")) {
          localStorage.clear();
          router.push("/?view=employerlogin");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  const handleEditProfile = () => {
    router.push("/?view=employersetup&edit=true");
  };

  function uint8ToBase64(u8Arr) {
    let CHUNK_SIZE = 0x8000;
    let index = 0;
    let length = u8Arr.length;
    let result = "";
    let slice;
    while (index < length) {
      slice = u8Arr.subarray(index, Math.min(index + CHUNK_SIZE, length));
      result += String.fromCharCode.apply(null, slice);
      index += CHUNK_SIZE;
    }
    return btoa(result);
  }

  function getCompanyLogoUrl(logo) {
    if (!logo) return null;
    if (logo.data && logo.mimetype) {
      let base64 = "";
      if (logo.data.data) {
        base64 = uint8ToBase64(new Uint8Array(logo.data.data));
      } else if (typeof logo.data === "string") {
        base64 = logo.data;
      }
      return `data:${logo.mimetype};base64,${base64}`;
    }
    if (logo.path) {
      return `https://toc-bac-1.onrender.com/${logo.path.replace(/\\/g, "/")}`;
    }
    return null;
  }

  const navigationItems = [
    { name: "Dashboard", href: "/?view=companyprofile" },
    {
      name: "Jobs",
      children: [
        { name: "Search Jobs", href: "/?view=jobs" },
        { name: "Post a New Job", href: "/?view=jobposting" },
      ],
    },
    {
      name: "Candidates",
      children: [
        { name: "Search for candidates", href: "/?view=candidate-search" },
        { name: "Candidates on bench", href: "/?view=internalcandidates" },
      ],
    },
    {
      name: "Applications",
      children: [
        { name: "Received Applications", href: "/?view=applications-received" },
        { name: "My Job Applications", href: "/?view=applications-sent" },
      ],
    },
  ];

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-indigo-600 font-semibold font-inter">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl">Loading company profile...</p>
      </div>

    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-red-500 font-semibold font-inter">
        {error}
      </div>
    );
  if (!companyProfile)
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-inter">
        No company profile found.
      </div>
    );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 font-inter">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {/* <Logo size={200} /> */}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navigationItems.map((item) => {
                const isParentActive = item.children?.some((child) =>
                  currentPath.endsWith(child.href)
                );
                const isActive = item.href
                  ? currentPath.endsWith(item.href)
                  : isParentActive;

                return item.children ? (
                  <div
                    key={item.name}
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(item.name)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <div
                      className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-all duration-300
                      ${isActive
                          ? "text-indigo-600 bg-indigo-50"
                          : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                        }
                    `}
                    >
                      {item.name}
                      <ChevronDownIcon
                        size={14}
                        className={`transition-transform duration-300 ${openDropdown === item.name ? "rotate-180" : ""
                          }`}
                      />
                    </div>
                    <div
                      className={`absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 transition-all duration-300
                      ${openDropdown === item.name
                          ? "opacity-100 translate-y-0 visible"
                          : "opacity-0 -translate-y-2 invisible"
                        }
                    `}
                    >
                      {item.children.map((child) => (
                        <a
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100 hover:text-indigo-600 transition-colors rounded-md mx-2"
                        >
                          {child.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`text-sm font-medium px-3 py-2 rounded-lg transition-all duration-300
                    ${isActive
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
                      }
                  `}
                  >
                    {item.name}
                  </a>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleEditProfile}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-md"
              >
                <EditIcon size={16} /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-all shadow-md"
              >
                <LogoutIcon size={16} /> Logout
              </button>
            </div>
          </div>
          {/* Mobile Nav */}
          <nav className="md:hidden border-t border-gray-100 bg-white px-4 py-3">
            <div className="flex flex-wrap justify-center gap-4">
              {navigationItems
                .flatMap((item) => (item.children ? item.children : item))
                .map((navItem) => (
                  <a
                    key={navItem.name}
                    href={navItem.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${currentPath.includes(navItem.href.split("?")[1])
                        ? "text-indigo-600 bg-indigo-50"
                        : "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50"
                      }
                `}
                  >
                    {navItem.name}
                  </a>
                ))}
            </div>
          </nav>
        </header>

        {/* Main Layout */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <div className="flex justify-center mb-6">
                  {companyProfile.logo &&
                    getCompanyLogoUrl(companyProfile.logo) ? (
                    <img
                      src={getCompanyLogoUrl(companyProfile.logo)}
                      alt="Company Logo"
                      className="w-24 h-24 object-cover rounded-full border-4 border-indigo-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center bg-indigo-600 rounded-full text-white text-3xl font-bold border-4 border-indigo-100 shadow-sm">
                      <BusinessIcon size={48} />
                    </div>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 text-center truncate">
                  {companyProfile.companyName}
                </h1>
                <p className="text-sm text-gray-500 font-medium text-center mt-1">
                  {companyProfile.industryType}
                </p>
                <div className="flex items-center gap-2 justify-center mt-3 text-gray-600 text-sm">
                  <LocationOnIcon size={16} />
                  <span className="line-clamp-1">{companyProfile.address}</span>
                </div>
                <div className="flex justify-center mt-4">
                  <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />{" "}
                    Verified Company
                  </span>
                </div>
                <div className="text-center mt-4">
                  <a
                    href={companyProfile.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 text-sm font-medium hover:underline break-all"
                  >
                    {companyProfile.companyWebsite}
                  </a>
                </div>
                <div className="mt-6 bg-gray-50 rounded-lg p-4 text-sm space-y-3 border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <EmailIcon size={16} />
                    <span>
                      {companyProfile.primaryContact?.email ||
                        companyProfile.email ||
                        "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <InsertDriveFileIcon size={16} />
                    <span>PAN: {companyProfile.pan || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <InsertDriveFileIcon size={16} />
                    <span>GSTIN: {companyProfile.gstin || "-"}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <section className="flex-1">
              {/* About */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed text-base">
                  {companyProfile.companyDescription}
                </p>
              </div>

              {/* Legal & Business */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Legal & Business Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-indigo-600 font-medium mb-1">
                      PAN Number
                    </div>
                    <div className="text-gray-900 text-base">
                      {companyProfile.pan || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-indigo-600 font-medium mb-1">GSTIN</div>
                    <div className="text-gray-900 text-base">
                      {companyProfile.gstin || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-indigo-600 font-medium mb-1">
                      Registered Address
                    </div>
                    <div className="text-gray-900 text-base break-words">
                      {companyProfile.address || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Contact Information
                </h2>
                {companyProfile.primaryContact &&
                  companyProfile.primaryContact.name && (
                    <div className="bg-green-50 border border-green-100 rounded-lg p-5 mb-6">
                      <div className="font-bold text-green-700 mb-3">
                        Primary Contact
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800">
                        {Object.entries(companyProfile.primaryContact)
                          .filter(([key, value]) => value && key !== "_id")
                          .map(([key, value]) => (
                            <div key={key} className="min-w-[120px]">
                              <span className="font-medium capitalize text-gray-600">
                                {key}:
                              </span>{" "}
                              <span>{value}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                {companyProfile.additionalContacts &&
                  companyProfile.additionalContacts.length > 0 && (
                    <div>
                      <div className="text-indigo-600 font-medium mb-3">
                        Additional Contacts
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {companyProfile.additionalContacts.map((contact, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 border border-gray-100 rounded-lg p-4"
                          >
                            {Object.entries(contact)
                              .filter(([key, value]) => value && key !== "_id")
                              .map(([key, value]) => (
                                <div key={key} className="mb-2 text-gray-800">
                                  <span className="font-medium capitalize text-gray-600">
                                    {key}:
                                  </span>{" "}
                                  <span>{value}</span>
                                </div>
                              ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Documents */}
              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Company Documents
                </h2>
                {companyProfile.documents &&
                  companyProfile.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companyProfile.documents.map((doc, idx) => {
                      const file = doc.file;
                      let canPreview =
                        file && file.data && file.data.data && file.mimetype;

                      return (
                        <div
                          key={idx}
                          className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex items-center hover:shadow-md transition-shadow"
                        >
                          {canPreview && file.mimetype.startsWith("image/") ? (
                            <img
                              src={`data:${file.mimetype};base64,${uint8ToBase64(
                                new Uint8Array(file.data.data)
                              )}`}
                              alt={file.originalName || doc.name}
                              className="w-16 h-16 object-cover rounded-md border border-gray-200 mr-4"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-indigo-100 rounded-md flex items-center justify-center text-indigo-600 mr-4 shrink-0">
                              <InsertDriveFileIcon size={32} />
                            </div>
                          )}
                          <div className="flex-1 overflow-hidden">
                            <div className="font-medium text-gray-900 mb-1 truncate">
                              {doc.name || file?.originalName || "Document"}
                            </div>
                            <div className="text-xs text-indigo-600 mb-2">
                              {doc.status || "Uploaded"}
                            </div>
                            {canPreview && (
                              <div className="flex gap-3">
                                <button
                                  className="text-indigo-600 text-xs font-medium hover:underline"
                                  onClick={() => {
                                    /* View logic */
                                  }}
                                >
                                  View
                                </button>
                                <button
                                  className="text-indigo-600 text-xs font-medium hover:underline"
                                  onClick={() => {
                                    /* Download logic */
                                  }}
                                >
                                  Download
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 border border-gray-100 text-center text-gray-500">
                    No documents have been uploaded yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
        {/* Footer */}
        <footer className="bg-gray-900 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between border-t border-gray-800 pt-6">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Talent on Cloud. All rights
              reserved.
            </p>
            <div className="flex gap-6 text-sm">
              {["Privacy", "Terms", "Cookies", "Sitemap"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-400 hover:text-indigo-400 transition"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
