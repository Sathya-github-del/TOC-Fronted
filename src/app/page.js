"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

// Core Components
import Homepage from "./Homepage";
import Loader from "./Loader";

// Candidate-Related Components
import CandidateAuthPage from "./Candidates/AuthPage"; // Unified component for Candidate Login/Signup
import ProtectedRoute from "./Candidates/ProtectedRoute";
import CandProfile from "./Candidates/CandProfile";
import ProfileSetup from "./Candidates/Profile-Setup";

// Employer-Related Components
import EmployerAuthPage from "./Employers/AuthPage"; // Unified component for Employer Login/Signup
import EmployerProfileSetup from "./Employers/Profile-setup";
import CompanyProfile from "./Employers/EmpProfile";
import UploadCandidates from "./Employers/Upload-candidate";
import InternalCandidates from "./Employers/Internal-candidate";
import SearchJobs from "./Employers/Jobs";
import ApplicationsReceived from "./Employers/ApplicationsReceived";
import ApplicationsSent from "./Employers/ApplicationsSent";

// Other Shared Pages
import JobPosting from "./Post-Job/JobPosting";
import AllJobsPage from "./Post-Job/AllJobs";
import ExternalCandidates from "./External/ExternalCandidates";
import OtherCompaniesCandidates from "./External/OtherCandidates";
import CandidateSearchPage from "./Employers/Candidate-Search"

// 👉 This component reads the 'view' param and renders the correct component
function ViewRouter() {
    const params = useSearchParams();
    const view = params.get("view");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => setLoading(false), 800); // Simulate loading for smooth transitions
        return () => clearTimeout(timer);
    }, [view]);

    if (loading) return <Loader />;

    // Main routing logic for all views
    switch (view) {
        // --- Candidate Views ---
        case "login":
        case "signup":
            return <CandidateAuthPage />;

        case "profile":
            return (
                <ProtectedRoute requireLogin={true}>
                    <CandProfile />
                </ProtectedRoute>
            );

        case "setup":
            return (
                <ProtectedRoute requireSignup={true}>
                    <ProfileSetup />
                </ProtectedRoute>
            );

        // --- Employer Views ---
        case "employerlogin":
        case "employersignup":
            return <EmployerAuthPage />;

        case "employersetup":
            return <EmployerProfileSetup />; // Consider adding a ProtectedRoute for employers

        case "companyprofile":
            return <CompanyProfile />; // Consider adding a ProtectedRoute for employers

        case "uploadcandidates":
            return <UploadCandidates />; // Consider adding a ProtectedRoute for employers

        case "internalcandidates":
            return <InternalCandidates />; // Consider adding a ProtectedRoute for employers
        
        case "jobs":
            return <SearchJobs />; // Consider adding a ProtectedRoute for employers
        
        case "candidate-search":
            return <CandidateSearchPage />;

        // --- Public & Other Views ---
        case "jobposting":
            return <JobPosting />;

        case "alljobs":
            return <AllJobsPage />;

        case "externalcandidates":
            return <ExternalCandidates />;
            
        case "othercompaniescandidates":
            return <OtherCompaniesCandidates />;
        
        case "applications-sent":
            return <ApplicationsSent />;
        
        case "applications-received":
            return <ApplicationsReceived />;

        default:
            return <Homepage />;
    }
}

// 👉 Wrap the router in Suspense to handle dynamic loading of components
export default function Home() {
    return (
        <Suspense fallback={<Loader />}>
            <ViewRouter />
        </Suspense>
    );
}