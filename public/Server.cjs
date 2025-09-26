require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const axios = require("axios");
const fsExtra = require("fs-extra");
const FormData = require("form-data");
const Tesseract = require("tesseract.js");
const ASSEMBLYAI_API_KEY = "a6414a37d6d242669d60cebf865be64d";
const baseUrl = "https://api.assemblyai.com";
const headers = { authorization: ASSEMBLYAI_API_KEY };
const { parseResume } = require("./resume.cjs");
// const { Resend } = require('resend');
// After the otpSchema definition (around line 49), add this line:

// Resume parsing API configuration
// const AFFINDA_API_KEY = "aff_bde96250967ec6a980d9b1409d447afb58f0ee01";
// const AFFINDA_API_URL = "https://api.affinda.com/v2";
// === DATABASE CONNECTION ===
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
const app = express();
// --- NEW: Google Gemini AI SDK ---
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Fix 1: Keep only ONE declaration of GEMINI_API_KEY at the top
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyD9LTTrXmvjzoV0vPOK7RVJSBv10tE7G1w";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "⚠️ WARNING: GEMINI_API_KEY is not set in the environment variables."
  );
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Expires in 10 minutes
});
//OTP Generation
const Otp = mongoose.model("Otp", otpSchema);
// OTP Schema

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to split full name
function splitName(fullName) {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(" ");
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

// Extract Projects section from raw resume text
function extractProjectsFromRawText(rawText) {
  const projects = [];
  if (!rawText) return projects;

  const match = rawText.match(
    /projects\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][a-zA-Z\s]{2,20}[:\-]?\s*\n|$)/i
  );

  if (match && match[1]) {
    const projectBlock = match[1].trim();

    const lines = projectBlock
      .split(/\n|\•|\d\.\s/)
      .map((line) => line.trim())
      .filter(Boolean);

    lines.forEach((line) => {
      projects.push({ description: line });
    });
  }

  return projects;
}

// Enhanced text parsing functions for different resume formats
function extractPersonalInfo(text) {
  const info = {
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    location: "",
    company: "",
    nationality: "",
    gender: "",
  };

  // === EMAIL EXTRACTION - Multiple patterns for different formats ===
  const emailPatterns = [
    // Standard email patterns
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Labeled email patterns
    /email\s*[:\-]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    /e-mail\s*[:\-]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    /contact\s*email\s*[:\-]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // ATS-friendly patterns
    /email\s*address\s*[:\-]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
  ];

  for (const pattern of emailPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.email = match[0].toLowerCase();
      break;
    }
  }

  // === PHONE NUMBER EXTRACTION - Multiple formats ===
  const phonePatterns = [
    // International formats
    /(\+\d{1,3}[- ]?)?\d{10,15}/g,
    // Labeled phone patterns
    /phone\s*[:\-]?\s*([+\d\s\-\(\)]+)/gi,
    /mobile\s*[:\-]?\s*([+\d\s\-\(\)]+)/gi,
    /contact\s*[:\-]?\s*([+\d\s\-\(\)]+)/gi,
    /telephone\s*[:\-]?\s*([+\d\s\-\(\)]+)/gi,
    // ATS-friendly patterns
    /phone\s*number\s*[:\-]?\s*([+\d\s\-\(\)]+)/gi,
    /mobile\s*number\s*[:\-]?\s*([+\d\s\-\(\)]+)/gi,
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.mobile = match[0].replace(/\s+/g, "");
      break;
    }
  }

  // === NAME EXTRACTION - Multiple approaches for different formats ===
  const namePatterns = [
    // Explicit name labels
    /^(?:full name|name)\s*[:\-]?\s*(.+)$/im,
    /^(?:first name|f\.?name)\s*[:\-]?\s*(.+)$/im,
    /^(?:last name|l\.?name)\s*[:\-]?\s*(.+)$/im,
    // ATS-friendly patterns
    /^(?:candidate name|applicant name)\s*[:\-]?\s*(.+)$/im,
    // Capitalized name patterns (common in ATS resumes)
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/m,
    // Name with title patterns
    /^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/im,
  ];

  let foundName = "";
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      foundName = match[1].trim();
      break;
    }
  }

  // Fallback: Try to get from first few lines (common in beginner formats)
  if (!foundName) {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Look for capitalized name patterns that aren't emails or URLs
      if (
        line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/) &&
        !line.includes("@") &&
        !line.includes("http") &&
        !line.includes("www") &&
        line.length > 3 &&
        line.length < 50
      ) {
        foundName = line;
        break;
      }
    }
  }

  if (foundName) {
    const nameParts = foundName.split(" ");
    info.firstName = nameParts[0] || "";
    info.lastName = nameParts.slice(1).join(" ") || "";
  }

  // === LOCATION EXTRACTION - Multiple patterns ===
  const locationPatterns = [
    // Explicit location labels
    /location\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    /address\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    /city\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    // ATS-friendly patterns
    /current\s*location\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    /residence\s*[:\-]?\s*(.+?)(?:\n|$)/gi,
    // Geographic patterns
    /([A-Z][a-z]+(?:\s*,\s*[A-Z]{2})?(?:\s*,\s*[A-Z]{2})?)/g,
    // City, State, Country patterns
    /([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?(?:\s*,\s*[A-Z][a-z]+)?)/g,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      info.location = match[1].trim();
      break;
    }
  }

  // === COMPANY EXTRACTION - From most recent experience ===
  const companyPatterns = [
    /(?:at|with|Company:)\s*([A-Z][A-Za-z0-9 &.,'-]+)/gi,
    /([A-Z][A-Za-z0-9 &.,'-]+(?:Inc|Corp|Ltd|LLC|Company|Technologies|Solutions|Systems))/gi,
    // ATS-friendly patterns
    /current\s*company\s*[:\-]?\s*([A-Z][A-Za-z0-9 &.,'-]+)/gi,
    /employer\s*[:\-]?\s*([A-Z][A-Za-z0-9 &.,'-]+)/gi,
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match) {
      info.company = match[1] || match[0];
      break;
    }
  }

  return info;
}

function extractEducation(text) {
  const education = [];

  // === EDUCATION SECTION PATTERNS - Multiple formats ===
  const educationSections = [
    // Standard education sections
    /education\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /academic\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /qualification\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // ATS-friendly patterns
    /educational\s*background\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /academic\s*background\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /degrees\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // Beginner format patterns
    /education\s*and\s*training\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
  ];

  for (const sectionPattern of educationSections) {
    const match = text.match(sectionPattern);
    if (match && match[1]) {
      const educationText = match[1];

      // === DEGREE PATTERNS - Multiple formats ===
      const degreePatterns = [
        // Standard degree patterns
        /(Bachelor|Master|B\.?Tech|M\.?Tech|BSc|MSc|PhD|Diploma|B\.?E\.?|M\.?E\.?|BBA|MBA|BE|ME)[^\n,;]*/gi,
        /(B\.?A\.?|M\.?A\.?|B\.?Com|M\.?Com|B\.?Arch|M\.?Arch)[^\n,;]*/gi,
        // ATS-friendly patterns
        /(Bachelor of|Master of|Doctor of|Associate of)[^\n,;]*/gi,
        // Abbreviated patterns
        /(BS|MS|BA|MA|PhD|MBA|BBA|MSc|BSc)[^\n,;]*/gi,
        // International patterns
        /(B\.?Eng|M\.?Eng|B\.?Sc|M\.?Sc)[^\n,;]*/gi,
      ];

      // === UNIVERSITY PATTERNS - Multiple formats ===
      const universityPatterns = [
        // Standard university patterns
        /(University|College|Institute|School)[^\n,;]*/gi,
        /([A-Z][A-Za-z\s&]+(?:University|College|Institute|School))/gi,
        // ATS-friendly patterns
        /(?:from|at)\s*([A-Z][A-Za-z\s&]+(?:University|College|Institute|School))/gi,
        // International patterns
        /([A-Z][A-Za-z\s&]+(?:University|College|Institute|School|Academy))/gi,
      ];

      // === DATE PATTERNS - Multiple formats ===
      const datePatterns = [
        // Year ranges
        /(\d{4})\s*[-–]\s*(\d{4}|\b(?:Present|Current|Now)\b)/gi,
        /(\d{4})\s*[-–]\s*(\d{4})/gi,
        // Month-Year ranges
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{4})\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(\d{4}|\b(?:Present|Current|Now)\b)/gi,
        // MM/YYYY format
        /(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})?\/(\d{4}|\b(?:Present|Current|Now)\b)/gi,
        // YYYY-MM format
        /(\d{4})-(\d{1,2})\s*[-–]\s*(\d{4})-(\d{1,2})/gi,
      ];

      // Split into individual education entries
      const educationBlocks = educationText.split(/\n\s*\n/);

      for (const block of educationBlocks) {
        if (block.trim().length < 10) continue;

        // Extract degree
        let degree = "";
        for (const pattern of degreePatterns) {
          const match = block.match(pattern);
          if (match) {
            degree = match[0];
            break;
          }
        }

        // Extract university
        let university = "";
        for (const pattern of universityPatterns) {
          const match = block.match(pattern);
          if (match) {
            university = match[1] || match[0];
            break;
          }
        }

        // Extract dates
        let startYear = "",
          endYear = "";
        for (const pattern of datePatterns) {
          const match = block.match(pattern);
          if (match) {
            if (match[1] && match[1].length === 4) {
              startYear = match[1];
            } else if (match[2] && match[2].length === 4) {
              startYear = match[2];
            }

            if (
              match[2] &&
              match[2] !== "Present" &&
              match[2] !== "Current" &&
              match[2] !== "Now" &&
              match[2].length === 4
            ) {
              endYear = match[2];
            } else if (
              match[4] &&
              match[4] !== "Present" &&
              match[4] !== "Current" &&
              match[4] !== "Now" &&
              match[4].length === 4
            ) {
              endYear = match[4];
            }
            break;
          }
        }

        // Extract specialization/major
        const specializationPatterns = [
          /(?:in|major|specialization)\s*[:\-]?\s*([A-Za-z\s&]+)(?:\n|,|;|$)/gi,
          /(?:field|area)\s*[:\-]?\s*([A-Za-z\s&]+)(?:\n|,|;|$)/gi,
        ];

        let specialization = "";
        for (const pattern of specializationPatterns) {
          const match = block.match(pattern);
          if (match) {
            specialization = match[1].trim();
            break;
          }
        }

        // Extract grades
        const gradePatterns = [
          /(?:GPA|Grade|Score)\s*[:\-]?\s*([0-9.]+)/gi,
          /(?:CGPA|GPA)\s*[:\-]?\s*([0-9.]+)/gi,
          /(?:Percentage|Percent)\s*[:\-]?\s*([0-9.]+)%/gi,
        ];

        let grades = "";
        for (const pattern of gradePatterns) {
          const match = block.match(pattern);
          if (match) {
            grades = match[1];
            break;
          }
        }

        if (degree || university) {
          education.push({
            degree: degree || "",
            specialization: specialization || "",
            university: university || "",
            startYear: startYear || "",
            endYear: endYear || "",
            grades: grades || "",
            institution: university || "",
          });
        }
      }
    }
  }

  return education;
}

function extractExperience(text) {
  const experience = [];

  // === EXPERIENCE SECTION PATTERNS - Multiple formats ===
  const experienceSections = [
    // Standard experience sections
    /experience\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /work\s*experience\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /employment\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /career\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // ATS-friendly patterns
    /professional\s*experience\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /work\s*history\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /employment\s*history\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // Beginner format patterns
    /jobs\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /positions\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
  ];

  for (const sectionPattern of experienceSections) {
    const match = text.match(sectionPattern);
    if (match && match[1]) {
      const experienceText = match[1];

      // === JOB TITLE PATTERNS - Multiple formats ===
      const jobTitlePatterns = [
        // Standard job titles
        /(Software Engineer|Developer|Manager|Designer|Analyst|Consultant|Lead|Intern|Director|Administrator|Architect|Specialist|Coordinator|Assistant|Officer)[^\n,;]*/gi,
        /([A-Z][A-Za-z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Consultant|Lead|Intern|Director|Administrator|Architect|Specialist|Coordinator|Assistant|Officer))/gi,
        // ATS-friendly patterns
        /(?:Position|Role|Title)\s*[:\-]?\s*([A-Za-z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Consultant|Lead|Intern|Director|Administrator|Architect|Specialist|Coordinator|Assistant|Officer))/gi,
        // Senior/Junior patterns
        /(Senior|Junior|Lead|Principal|Associate)\s+([A-Za-z\s]+(?:Engineer|Developer|Manager|Designer|Analyst|Consultant|Lead|Intern|Director|Administrator|Architect|Specialist|Coordinator|Assistant|Officer))/gi,
      ];

      // === COMPANY PATTERNS - Multiple formats ===
      const companyPatterns = [
        // Standard company patterns
        /(?:at|with|Company:)\s*([A-Z][A-Za-z0-9 &.,'-]+)/gi,
        /([A-Z][A-Za-z0-9 &.,'-]+(?:Inc|Corp|Ltd|LLC|Company|Technologies|Solutions|Systems))/gi,
        // ATS-friendly patterns
        /(?:Employer|Organization|Company)\s*[:\-]?\s*([A-Z][A-Za-z0-9 &.,'-]+)/gi,
        // International patterns
        /([A-Z][A-Za-z0-9 &.,'-]+(?:Inc|Corp|Ltd|LLC|Company|Technologies|Solutions|Systems|GmbH|SAS|SARL))/gi,
      ];

      // === DATE PATTERNS - Multiple formats ===
      const datePatterns = [
        // Year ranges
        /(\d{4})\s*[-–]\s*(\d{4}|\b(?:Present|Current|Now)\b)/gi,
        /(\d{4})\s*[-–]\s*(\d{4})/gi,
        // Month-Year ranges
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{4})\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(\d{4}|\b(?:Present|Current|Now)\b)/gi,
        // MM/YYYY format
        /(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})?\/(\d{4}|\b(?:Present|Current|Now)\b)/gi,
        // YYYY-MM format
        /(\d{4})-(\d{1,2})\s*[-–]\s*(\d{4})-(\d{1,2})/gi,
        // ATS-friendly patterns
        /(?:Duration|Period)\s*[:\-]?\s*(\d{4})\s*[-–]\s*(\d{4}|\b(?:Present|Current|Now)\b)/gi,
      ];

      // Split into individual experiences
      const experienceBlocks = experienceText.split(/\n\s*\n/);

      for (const block of experienceBlocks) {
        if (block.trim().length < 10) continue;

        // Extract job title
        let jobTitle = "";
        for (const pattern of jobTitlePatterns) {
          const match = block.match(pattern);
          if (match) {
            jobTitle = match[0];
            break;
          }
        }

        // Extract company
        let company = "";
        for (const pattern of companyPatterns) {
          const match = block.match(pattern);
          if (match) {
            company = match[1] || match[0];
            break;
          }
        }

        // Extract dates
        let startDate = "",
          endDate = "";
        let currentJob = false;
        for (const pattern of datePatterns) {
          const match = block.match(pattern);
          if (match) {
            if (match[1] && match[1].length === 4) {
              startDate = match[1];
            } else if (match[2] && match[2].length === 4) {
              startDate = match[2];
            }

            if (
              match[2] === "Present" ||
              match[2] === "Current" ||
              match[2] === "Now"
            ) {
              currentJob = true;
              endDate = "";
            } else if (
              match[2] &&
              match[2] !== "Present" &&
              match[2] !== "Current" &&
              match[2] !== "Now" &&
              match[2].length === 4
            ) {
              endDate = match[2];
            } else if (
              match[4] &&
              match[4] !== "Present" &&
              match[4] !== "Current" &&
              match[4] !== "Now" &&
              match[4].length === 4
            ) {
              endDate = match[4];
            }
            break;
          }
        }

        // Extract employment type
        const employmentTypePatterns = [
          /(?:Employment Type|Type)\s*[:\-]?\s*(Full-time|Part-time|Contract|Internship|Freelance|Remote|Hybrid)/gi,
          /(Full-time|Part-time|Contract|Internship|Freelance|Remote|Hybrid)/gi,
        ];

        let employmentType = "";
        for (const pattern of employmentTypePatterns) {
          const match = block.match(pattern);
          if (match) {
            employmentType = match[1];
            break;
          }
        }

        // Extract location
        const locationPatterns = [
          /(?:Location|Place)\s*[:\-]?\s*([A-Za-z\s,]+)/gi,
          /(?:Remote|On-site|Hybrid)\s*[:\-]?\s*([A-Za-z\s,]+)/gi,
        ];

        let location = "";
        for (const pattern of locationPatterns) {
          const match = block.match(pattern);
          if (match) {
            location = match[1].trim();
            break;
          }
        }

        if (jobTitle || company) {
          experience.push({
            jobTitle: jobTitle || "",
            employer: company || "",
            startDate: startDate || "",
            endDate: endDate || "",
            designation: jobTitle || "",
            employmentType: employmentType || "",
            location: location || "",
            experienceSummary: block.trim(),
            currentJob: currentJob,
          });
        }
      }
    }
  }

  return experience;
}

function extractSkills(text) {
  const skills = [];

  // === SKILLS SECTION PATTERNS - Multiple formats ===
  const skillsSections = [
    // Standard skills sections
    /skills\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /technical\s*skills\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /competencies\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /expertise\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // ATS-friendly patterns
    /key\s*skills\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /core\s*competencies\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /technical\s*expertise\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // Categorized skills
    /programming\s*languages\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /frameworks\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /tools\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /databases\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /cloud\s*platforms\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
  ];

  for (const sectionPattern of skillsSections) {
    const match = text.match(sectionPattern);
    if (match && match[1]) {
      const skillsText = match[1];

      // Split by various delimiters
      const skillDelimiters = [
        ",",
        ";",
        "•",
        "·",
        "|",
        "\n",
        "•",
        "▪",
        "▫",
        "‣",
      ];
      let skillLines = [skillsText];

      for (const delimiter of skillDelimiters) {
        skillLines = skillLines.flatMap((line) => line.split(delimiter));
      }

      // Clean and filter skills
      for (const line of skillLines) {
        const skill = line
          .trim()
          .replace(/^\d+\.?\s*/, "") // Remove numbered lists
          .replace(/^[-•·▪▫‣]\s*/, "") // Remove bullet points
          .replace(/^[A-Z]\.\s*/, "") // Remove lettered lists
          .replace(/\([^)]*\)/g, "") // Remove parentheses content
          .replace(/\[[^\]]*\]/g, "") // Remove bracket content
          .trim();

        if (
          skill.length > 2 &&
          skill.length < 50 &&
          !skill.match(/^(and|or|the|a|an|of|in|on|at|to|for|with|by)$/i) &&
          !skill.match(/^[0-9]+$/) && // Not just numbers
          !skill.match(/^[A-Z\s]+$/) && // Not all caps
          skill.includes(" ")
        ) {
          // Must have spaces (multi-word skills are more specific)
          skills.push(skill);
        }
      }
    }
  }

  return [...new Set(skills)]; // Remove duplicates
}

function extractProjects(text) {
  const projects = [];

  // === PROJECT SECTION PATTERNS - Multiple formats ===
  const projectSections = [
    // Standard project sections
    /projects\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /project\s*experience\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /portfolio\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // ATS-friendly patterns
    /key\s*projects\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /notable\s*projects\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /academic\s*projects\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    // Beginner format patterns
    /work\s*done\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
    /assignments\s*[:\-]?\s*([\s\S]*?)(?=\n[A-Z][A-Z\s]{2,20}[:\-]?\s*\n|$)/gi,
  ];

  for (const sectionPattern of projectSections) {
    const match = text.match(sectionPattern);
    if (match && match[1]) {
      const projectsText = match[1];

      // Split into individual projects
      const projectBlocks = projectsText.split(/\n\s*\n/);

      for (const block of projectBlocks) {
        if (block.trim().length < 10) continue;

        // Extract project name
        const namePatterns = [
          /^([A-Z][A-Za-z\s]+?)(?:\n|:|$)/,
          /^(?:Project|Title)\s*[:\-]?\s*([A-Za-z\s]+)/i,
          /^([A-Z][A-Za-z\s]+(?:App|System|Platform|Tool|Website|Application))/i,
        ];

        let projectName = "";
        for (const pattern of namePatterns) {
          const match = block.match(pattern);
          if (match) {
            projectName = match[1].trim();
            break;
          }
        }

        // Extract description
        const description = block
          .replace(/^[A-Z][A-Za-z\s]+?[\n:]*/, "")
          .trim();

        // Extract dates
        const datePatterns = [
          /(\d{4})\s*[-–]\s*(\d{4}|\b(?:Present|Current|Now)\b)/,
          /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{4})\s*[-–]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?\s*(\d{4}|\b(?:Present|Current|Now)\b)/,
          /(?:Duration|Period)\s*[:\-]?\s*(\d{4})\s*[-–]\s*(\d{4}|\b(?:Present|Current|Now)\b)/,
        ];

        let startDate = "",
          endDate = "";
        for (const pattern of datePatterns) {
          const match = block.match(pattern);
          if (match) {
            if (match[1] && match[1].length === 4) {
              startDate = match[1];
            } else if (match[2] && match[2].length === 4) {
              startDate = match[2];
            }

            if (
              match[2] &&
              match[2] !== "Present" &&
              match[2] !== "Current" &&
              match[2] !== "Now" &&
              match[2].length === 4
            ) {
              endDate = match[2];
            } else if (
              match[4] &&
              match[4] !== "Present" &&
              match[4] !== "Current" &&
              match[4] !== "Now" &&
              match[4].length === 4
            ) {
              endDate = match[4];
            }
            break;
          }
        }

        // Extract technologies/skills
        const techPatterns = [
          /(?:Technologies|Tech Stack|Tools|Skills)\s*[:\-]?\s*([^\n]+)/i,
          /(?:Built with|Developed using|Created with)\s*([^\n]+)/i,
          /(?:Used|Utilized)\s*([^\n]+)/i,
        ];

        let keySkills = "";
        for (const pattern of techPatterns) {
          const match = block.match(pattern);
          if (match) {
            keySkills = match[1].trim();
            break;
          }
        }

        // Extract URL
        const urlPatterns = [
          /(https?:\/\/[^\s]+)/,
          /(?:GitHub|Demo|Live|URL)\s*[:\-]?\s*(https?:\/\/[^\s]+)/i,
          /(?:Repository|Repo)\s*[:\-]?\s*(https?:\/\/[^\s]+)/i,
        ];

        let projectUrl = "";
        for (const pattern of urlPatterns) {
          const match = block.match(pattern);
          if (match) {
            projectUrl = match[1];
            break;
          }
        }

        if (projectName || description) {
          projects.push({
            projectName: projectName || "",
            startDate: startDate || "",
            endDate: endDate || "",
            description: description || "",
            keySkills: keySkills || "",
            projectUrl: projectUrl || "",
          });
        }
      }
    }
  }

  return projects;
}

// Enhanced resume parsing function using Affinda API with comprehensive fallback
// async function parseResumeWithAffinda(filePath) {
//   try {
//     if (!fs.existsSync(filePath)) {
//       console.error("❌ File not found:", filePath);
//       throw new Error("File not found");
//     }

//     const form = new FormData();
//     form.append("file", fs.createReadStream(filePath));

//     const uploadRes = await axios.post(
//       `${AFFINDA_API_URL}/resumes`,
//       form,
//       {
//         headers: {
//           ...form.getHeaders(),
//           Authorization: `Bearer ${AFFINDA_API_KEY}`,
//         },
//       }
//     );

//     const identifier = uploadRes.data.meta?.identifier;
//     if (!identifier) {
//       console.error("❌ Upload succeeded but no identifier found.");
//       throw new Error("No identifier found after upload");
//     }

//     console.log(`🔄 Uploaded. Resume ID: ${identifier}`);

//     // ⏳ Wait and poll for parsing
//     let resumeData = null;
//     const maxAttempts = 10;
//     let attempts = 0;

//     while (attempts < maxAttempts) {
//       await new Promise((res) => setTimeout(res, 2000));
//       const fetchRes = await axios.get(
//         `${AFFINDA_API_URL}/resumes/${identifier}`,
//         {
//           headers: { Authorization: `Bearer ${AFFINDA_API_KEY}` },
//         }
//       );

//       if (fetchRes.data?.data) {
//         resumeData = fetchRes.data.data;
//         break;
//       }

//       console.log(`⏳ Parsing in progress... Attempt ${attempts + 1}`);
//       attempts++;
//     }

//     if (!resumeData) {
//       console.error("❌ Parsing failed or timed out.");
//       throw new Error("Parsing failed or timed out");
//     }

//     // --- PERSONAL DATA ---
//     const nameParts = splitName(resumeData.name?.raw);
//     // Try to get location from address/city
//     let location = '';
//     if (resumeData.addresses && resumeData.addresses.length > 0) {
//       const addr = resumeData.addresses[0];
//       location = [addr.city, addr.state, addr.country].filter(Boolean).join(', ');
//     } else if (resumeData.location) {
//       location = resumeData.location;
//     }
//     // Company from most recent experience
//     let company = '';
//     if (resumeData.workExperience && resumeData.workExperience.length > 0) {
//       company = resumeData.workExperience[0].organization || '';
//     }
//     // Nationality/gender if available
//     let nationality = resumeData.nationality || '';
//     let gender = resumeData.gender || '';
//     const personalData = {
//       firstName: nameParts.firstName,
//       lastName: nameParts.lastName,
//       email: resumeData.emails?.[0] || '',
//       mobile: resumeData.phoneNumbers?.[0] || '',
//       location,
//       company,
//       nationality,
//       gender,
//       profilePhoto: null,
//       resume: null,
//       introductionVideo: null
//     };

//     // --- EDUCATION DATA ---
//     const educationData = (resumeData.education || []).map(edu => ({
//       degree: edu.accreditation?.raw || '',
//       specialization: edu.major || edu.fieldOfStudy || '',
//       university: edu.organization || '',
//       startYear: edu.dates?.start ? (edu.dates.start.split('-')[0] || '') : '',
//       endYear: edu.dates?.end ? (edu.dates.end.split('-')[0] || '') : '',
//       grades: edu.grade || '',
//       institution: edu.organization || '',
//     }));

//     // --- EXPERIENCE DATA ---
//     const experienceData = (resumeData.workExperience || []).map(exp => ({
//       jobTitle: exp.jobTitle || '',
//       employer: exp.organization || '',
//       startDate: exp.dates?.start || '',
//       endDate: exp.dates?.end || '',
//       designation: exp.jobTitle || '',
//       employmentType: exp.employmentType || '',
//       location: exp.location || '',
//       experienceSummary: exp.jobDescription || '',
//       currentJob: !exp.dates?.end || (exp.isCurrent || false),
//     }));

//     // --- SKILLS DATA ---
//     const skillsData = (resumeData.skills || [])
//       .map(skill => skill.name || skill.raw)
//       .filter(Boolean);

//     // --- PROJECTS DATA ---
//     let projectsData = [];
//     if (Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
//       projectsData = resumeData.projects.map(project => ({
//         projectName: project.name || '',
//         startDate: project.dates?.start || '',
//         endDate: project.dates?.end || '',
//         description: project.description || '',
//         keySkills: Array.isArray(project.keywords) ? project.keywords.join(', ') : '',
//         projectUrl: project.url || '',
//       }));
//     } else {
//       // fallback to raw text extraction
//       projectsData = extractProjectsFromRawText(resumeData.rawText).map(p => ({
//         projectName: '',
//         startDate: '',
//         endDate: '',
//         description: p.description,
//         keySkills: '',
//         projectUrl: '',
//       }));
//     }

//     return { personalData, educationData, experienceData, skillsData, projectsData };
//   } catch (err) {
//     console.error("❌ Resume parsing error:", err);
//     throw err;
//   }
// }

const { execFile } = require("child_process");
const { extractAudioFromVideo } = require("./extractAudio.cjs");
const { v4: uuidv4 } = require("uuid");

async function transcribeAudioFile(filePath) {
  try {
    console.log("Reading file for transcription:", filePath);
    const audioData = await fsExtra.readFile(filePath);
    const uploadResponse = await axios.post(`${baseUrl}/v2/upload`, audioData, {
      headers,
    });
    const audioUrl = uploadResponse.data.upload_url;
    console.log("Uploaded to AssemblyAI, URL:", audioUrl);
    const data = { audio_url: audioUrl, speech_model: "universal" };
    const response = await axios.post(`${baseUrl}/v2/transcript`, data, {
      headers,
    });
    const transcriptId = response.data.id;
    const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;
    console.log("Polling transcript at:", pollingEndpoint);
    while (true) {
      const pollingResponse = await axios.get(pollingEndpoint, { headers });
      const transcriptionResult = pollingResponse.data;
      if (transcriptionResult.status === "completed") {
        console.log("Transcription completed:", transcriptionResult.text);
        return transcriptionResult.text;
      } else if (transcriptionResult.status === "error") {
        console.error("Transcription failed:", transcriptionResult.error);
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (err) {
    console.error("Error in transcribeAudioFile:", err);
    throw err;
  }
}

app.use(express.static(path.join(__dirname, "dist")));
// Serve user_uploads as static for profile photos
app.use("/user_uploads", express.static(path.join(__dirname, "user_uploads")));
// Middleware
// Remove CORS config and any Vercel/Render-specific cross-origin logic
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "https://toc-frontend-one.vercel.app",
      "https://toc-frontend-new.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://toc-new-next.vercel.app",
      "https://toc-frontend-stage.vercel.app",
    ],
    credentials: true,
  })
);

// === TEST ENDPOINT ===
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running!" });
});

app.get("/", (req, res) => {
  res.json({
    message: "TOC Backend is running!",
    endpoints: ["/api/test", "/api/matchmaking-proxy"],
  });
});

// === STORAGE UTILITIES ===
const createUserFolder = (email) => {
  console.log("createUserFolder called with email:", email);
  const userDir = path.join(__dirname, "user_uploads", email);
  console.log("User directory path:", userDir);
  if (!fs.existsSync(userDir)) {
    console.log("Creating directory:", userDir);
    fs.mkdirSync(userDir, { recursive: true });
  } else {
    console.log("Directory already exists:", userDir);
  }
  return userDir;
};

const createCompanyFolder = (companyName) => {
  const safeName = companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const companyDir = path.join(__dirname, "Company_uploads", safeName);
  if (!fs.existsSync(companyDir)) {
    fs.mkdirSync(companyDir, { recursive: true });
  }
  return companyDir;
};

function getStorage(type = "user") {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      let uploadPath;
      if (type === "company") {
        let companyName = "unknown_company";
        try {
          if (req.body && req.body.data) {
            const parsed = JSON.parse(req.body.data);
            if (parsed.companyName) {
              companyName = parsed.companyName;
            }
          }
        } catch (e) {}
        uploadPath = createCompanyFolder(companyName);
      } else {
        let email = "unknown";
        try {
          if (req.body && req.body.data) {
            const parsed = JSON.parse(req.body.data);
            if (parsed.personalInfo && parsed.personalInfo.email) {
              email = parsed.personalInfo.email;
            } else if (parsed.email) {
              // For candidate uploads, email is directly in the data
              email = parsed.email;
            }
          }
        } catch (e) {
          console.error("Error parsing email from request body:", e);
        }
        console.log("Creating user folder for email:", email);
        uploadPath = createUserFolder(email);
        console.log("Upload path created:", uploadPath);
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      let base = "unknown";
      let suffix = "";
      if (type === "company") {
        try {
          if (req.body && req.body.data) {
            const parsed = JSON.parse(req.body.data);
            if (parsed.companyName) {
              base = parsed.companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
            }
          }
        } catch (e) {}
        if (file.fieldname === "logo") {
          suffix = "logo";
        } else if (file.fieldname === "documents") {
          suffix = "doc_" + Date.now();
        } else {
          suffix = file.fieldname;
        }
      } else {
        try {
          if (req.body && req.body.data) {
            const parsed = JSON.parse(req.body.data);
            if (parsed.personalInfo && parsed.personalInfo.email) {
              base = parsed.personalInfo.email;
            } else if (parsed.email) {
              // For candidate uploads, email is directly in the data
              base = parsed.email.replace(/[^a-zA-Z0-9_-]/g, "_");
            }
          }
        } catch (e) {
          console.error("Error parsing base from request body:", e);
        }
        console.log("File fieldname:", file.fieldname);
        if (file.fieldname === "profilePhoto") {
          suffix = "profile";
        } else if (file.fieldname === "resume") {
          suffix = "resume";
        } else if (file.fieldname === "introductionVideo") {
          suffix = "introvideo";
        } else if (file.fieldname === "kycDocument") {
          suffix = "pan_card";
        } else {
          suffix = file.fieldname;
        }
        console.log("Suffix determined:", suffix);
      }
      const ext = path.extname(file.originalname);
      const filename = `${base}_${suffix}${ext}`;
      console.log("Final filename:", filename);
      cb(null, filename);
    },
  });
}

function getUpload(type = "user") {
  return multer({
    storage: getStorage(type),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB per file
    },
  });
}

const userUpload = getUpload("user");
const companyUpload = getUpload("company");
const memoryUpload = multer({ storage: multer.memoryStorage() });

// === SCHEMAS AND MODELS ===

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  profile: {
    type: mongoose.Schema.Types.Mixed, // Store profile details directly
    default: null,
  },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// Employer Schema
const employerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CompanyProfile",
    default: null,
  }, // Reference to company profile
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Employer =
  mongoose.models.Employer || mongoose.model("Employer", employerSchema);

// Candidate Profile Schema
const candidateProfileSchema = new mongoose.Schema({
  personalInfo: {
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    mobile: String,
    location: String,
    company: String,
    nationality: String,
    gender: String,
    linkedinUrl: String,
    profilePhoto: {
      path: String,
      originalName: String,
    },
    resume: {
      path: String,
      originalName: String,
    },
    introductionVideo: {
      path: String,
      originalName: String,
      duration: Number,
    },
    introTranscript: String, // Added for transcription
  },
  education: [
    {
      degree: String,
      specialization: String,
      university: String,
      startYear: String,
      endYear: String,
      grades: String,
      institution: String,
    },
  ],
  experience: [
    {
      jobTitle: String,
      employer: String,
      startDate: String,
      endDate: String,
      designation: String,
      employmentType: String,
      location: String,
      experienceSummary: String,
      currentJob: Boolean,
    },
  ],
  skills: [String],
  projects: [
    {
      projectName: String,
      startDate: String,
      endDate: String,
      description: String,
      keySkills: String,
      projectUrl: String,
    },
  ],
  kyc: {
    panCard: {
      path: String,
      originalName: String,
    },
    panNumber: String,
    panName: String,
    ocrText: String,
  },
  profileStatus: { type: String, default: "completed" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CandidateProfile = mongoose.model(
  "CandidateProfile",
  candidateProfileSchema
);

// Candidate Uploads Schema
const candidateUploadsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  statusColor: { type: String, default: "#52c41a" },
  uploadType: { type: String, enum: ["single", "bulk"], required: true },
  employerId: { type: String, required: true }, // Add employer ID field
  email: String,
  phone: String,
  experience: String,
  skills: [String],
  resume: {
    path: String,
    originalName: String,
  },
  additionalDocs: [
    {
      path: String,
      originalName: String,
    },
  ],
  bulkUploadId: String, // For grouping bulk uploads
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CandidateUploads = mongoose.model(
  "CandidateUploads",
  candidateUploadsSchema
);

// Company Profile Schema
const contactSchema = new mongoose.Schema(
  {
    name: String,
    role: String,
    email: String,
    phone: String,
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    name: String,
    status: String,
    file: {
      data: Buffer,
      mimetype: String,
      originalName: String,
    },
    color: String,
  },
  { _id: false }
);

const companyProfileSchema = new mongoose.Schema({
  companyName: { type: String, required: true, unique: true },
  companyDescription: String,
  industryType: String,
  companyWebsite: { type: String, required: true, unique: true },
  logo: {
    data: Buffer,
    mimetype: String,
    originalName: String,
  },
  pan: String,
  gstin: String,
  address: String,
  primaryContact: contactSchema,
  additionalContacts: [contactSchema],
  documents: [documentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const CompanyProfile = mongoose.model("CompanyProfile", companyProfileSchema);

// Job Post Schema
const jobPostSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  location: { type: String, required: true },
  employmentType: { type: String, required: true },
  jobCategory: { type: String, required: true },
  salaryRange: {
    min: Number,
    max: Number,
  },
  experienceLevel: { type: String, required: true },
  companyName: { type: String, required: true },
  companyLogo: {
    data: Buffer,
    contentType: String,
  },
  jobDescription: String,
  responsibilities: String,
  applicationEmail: { type: String, required: true },
  screeningQuestions: [String],
  keySkills: { type: [String], required: true },
  employerId: { type: String, required: true }, // Add employer ID field
  postedAt: { type: Date, default: Date.now },
});

const JobPost = mongoose.model("JobPost", jobPostSchema);

// Job Application Schema
const jobApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  jobId: { type: String, required: true },
  employerId: { type: String, required: true },
  appliedDate: { type: Date, default: Date.now },
  status: { type: String, default: "Under Review" },
  candidateName: String,
  candidateEmail: String,
  candidatePhone: String,
  resume: {
    path: String,
    originalName: String,
  },
  coverLetter: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);

// Job Draft Schema
const jobDraftSchema = new mongoose.Schema({
  jobTitle: String,
  location: String,
  employmentType: String,
  jobCategory: String,
  salaryRange: {
    min: Number,
    max: Number,
  },
  experienceLevel: String,
  companyName: String,
  companyLogo: {
    data: Buffer,
    contentType: String,
  },
  jobDescription: String,
  responsibilities: String,
  applicationEmail: String,
  screeningQuestions: [String],
  keySkills: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const JobDraft = mongoose.model("JobDraft", jobDraftSchema);

// JobSearch Schema for Homepage job search
const jobSearchSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  salary: String,
  experience: String,
  skills: [String],
  description: String,
  type: String,
  postedAt: { type: Date, default: Date.now },
  logo: String, // URL or base64
});
const JobSearch =
  mongoose.models.JobSearch || mongoose.model("JobSearch", jobSearchSchema);

// Seed 20 random IT jobs (for dev/testing)
app.post("/api/jobsearch/seed", async (req, res) => {
  try {
    const jobs = [
      {
        title: "Frontend Developer",
        company: "TechNova",
        location: "Bangalore",
        salary: "₹8-12 LPA",
        experience: "2-4 years",
        skills: ["React", "JavaScript", "CSS"],
        description: "Build modern UIs with React.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Backend Developer",
        company: "Cloudify",
        location: "Hyderabad",
        salary: "₹10-15 LPA",
        experience: "3-5 years",
        skills: ["Node.js", "MongoDB", "Express"],
        description: "Develop scalable backend APIs.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "DevOps Engineer",
        company: "InfraEdge",
        location: "Remote",
        salary: "₹12-18 LPA",
        experience: "4-6 years",
        skills: ["AWS", "Docker", "Kubernetes"],
        description: "Automate CI/CD pipelines.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Data Scientist",
        company: "DataWiz",
        location: "Pune",
        salary: "₹14-20 LPA",
        experience: "2-5 years",
        skills: ["Python", "Machine Learning", "SQL"],
        description: "Analyze data and build ML models.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "QA Engineer",
        company: "TestPro",
        location: "Chennai",
        salary: "₹7-10 LPA",
        experience: "1-3 years",
        skills: ["Selenium", "Jest", "Manual Testing"],
        description: "Ensure product quality.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "UI/UX Designer",
        company: "Designify",
        location: "Bangalore",
        salary: "₹9-13 LPA",
        experience: "2-4 years",
        skills: ["Figma", "Adobe XD", "Prototyping"],
        description: "Design user-centric interfaces.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Full Stack Developer",
        company: "StackMinds",
        location: "Delhi",
        salary: "₹12-16 LPA",
        experience: "3-6 years",
        skills: ["React", "Node.js", "MongoDB"],
        description: "Work on end-to-end solutions.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Cloud Architect",
        company: "Cloudify",
        location: "Remote",
        salary: "₹18-25 LPA",
        experience: "6-10 years",
        skills: ["AWS", "Azure", "Architecture"],
        description: "Design cloud solutions.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Product Manager",
        company: "Prodigy",
        location: "Mumbai",
        salary: "₹15-22 LPA",
        experience: "5-8 years",
        skills: ["Product Strategy", "Agile", "Leadership"],
        description: "Lead product teams.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Mobile App Developer",
        company: "Appify",
        location: "Bangalore",
        salary: "₹10-14 LPA",
        experience: "2-5 years",
        skills: ["Flutter", "React Native", "Android"],
        description: "Build mobile apps.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "System Administrator",
        company: "SysOps",
        location: "Pune",
        salary: "₹8-11 LPA",
        experience: "2-4 years",
        skills: ["Linux", "Networking", "Shell Scripting"],
        description: "Manage IT infrastructure.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Security Analyst",
        company: "SecureIT",
        location: "Hyderabad",
        salary: "₹11-16 LPA",
        experience: "3-6 years",
        skills: ["Cybersecurity", "SIEM", "Vulnerability Assessment"],
        description: "Monitor and secure systems.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Business Analyst",
        company: "BizTech",
        location: "Delhi",
        salary: "₹9-13 LPA",
        experience: "2-5 years",
        skills: ["Business Analysis", "SQL", "Process Improvement"],
        description: "Bridge business and tech.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Machine Learning Engineer",
        company: "MLWorks",
        location: "Remote",
        salary: "₹14-20 LPA",
        experience: "3-6 years",
        skills: ["Python", "TensorFlow", "Deep Learning"],
        description: "Build ML pipelines.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Network Engineer",
        company: "NetConnect",
        location: "Chennai",
        salary: "₹8-12 LPA",
        experience: "2-4 years",
        skills: ["Networking", "Cisco", "Firewall"],
        description: "Maintain network systems.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Technical Writer",
        company: "DocuTech",
        location: "Bangalore",
        salary: "₹6-9 LPA",
        experience: "1-3 years",
        skills: ["Documentation", "Technical Writing", "API Docs"],
        description: "Write technical docs.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Scrum Master",
        company: "AgileWorks",
        location: "Pune",
        salary: "₹12-16 LPA",
        experience: "4-7 years",
        skills: ["Scrum", "Agile", "Facilitation"],
        description: "Facilitate agile teams.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Database Administrator",
        company: "DataSafe",
        location: "Hyderabad",
        salary: "₹10-15 LPA",
        experience: "3-6 years",
        skills: ["SQL", "Oracle", "DBA"],
        description: "Manage databases.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "Support Engineer",
        company: "HelpDesk",
        location: "Delhi",
        salary: "₹7-10 LPA",
        experience: "1-3 years",
        skills: ["Customer Support", "Troubleshooting", "ITIL"],
        description: "Provide tech support.",
        type: "Full-time",
        logo: "",
      },
      {
        title: "IT Project Manager",
        company: "ProjX",
        location: "Mumbai",
        salary: "₹16-24 LPA",
        experience: "6-10 years",
        skills: ["Project Management", "IT", "Leadership"],
        description: "Manage IT projects.",
        type: "Full-time",
        logo: "",
      },
    ];
    await JobSearch.deleteMany({});
    await JobSearch.insertMany(jobs);
    res.json({ message: "Seeded 20 random IT jobs." });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to seed jobs", details: err.message });
  }
});

// Get all jobs from JobSearch
app.get("/api/jobsearch", async (req, res) => {
  try {
    const jobs = await JobSearch.find().sort({ postedAt: -1 });
    res.json(jobs);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch jobs", details: err.message });
  }
});

// === EMAIL CONFIGURATION ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "vickyvic7044@gmail.com",
    pass: process.env.EMAIL_PASS || "zefj lzsj ndim wbhw",
  },
});

// === UTILITY FUNCTIONS ===
const generateToken = (userId) =>
  jwt.sign(
    { userId },
    process.env.JWT_SECRET ||
      "iu!O9RInieEINfin309hWinf08vIM0ojfubejnfuwksmiufwuw.jdiapeihknSKiwjaoksn",
    { expiresIn: "7d" }
  );

const generateEmployerToken = (employerId) =>
  jwt.sign({ employerId }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: "7d",
  });

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER || "your-email@gmail.com",
    to: email,
    subject: "Password Reset Request",
    html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your account.</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you didn't request this, ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
        `,
  };
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

// Job Helper Functions
function formatSalary(salaryRange) {
  if (!salaryRange) return "Not specified";
  const { min, max } = salaryRange;
  if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
  if (min) return `From ₹${min.toLocaleString()}`;
  if (max) return `Up to ₹${max.toLocaleString()}`;
  return "Not specified";
}

function formatPostedDate(date) {
  if (!date) return "Recently";
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function mapCategoryToIndustry(category) {
  const mapping = {
    "software-development": "Technology",
    design: "Design Agency",
    marketing: "Marketing",
    sales: "Sales",
  };
  return mapping[category] || "Technology";
}

function parseArrayField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string")
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

// === ROUTES ===
// ** OTP Send Login **
// Send OTP endpoint
// CORS middleware (if not already added)
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//     if (req.method === 'OPTIONS') {
//         res.sendStatus(200);
//     } else {
//         next();
//     }
// });

// Send OTP
// ** Send OTP Endpoint (Updated with Nodemailer) **
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User already exists with this email",
        });
    }

    await Otp.deleteMany({ email: email.toLowerCase() });

    const otpCode = generateOTP();
    const newOtp = new Otp({ email: email.toLowerCase(), otp: otpCode });
    await newOtp.save();

    // --- Send email using Nodemailer ---
    const mailOptions = {
      from: `"Talent on Cloud" <${
        process.env.EMAIL_USER || "your-email@gmail.com"
      }>`,
      to: email,
      subject: "Your Verification Code",
      html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Hello,</h2>
                    <p>Your verification code for Talent on Cloud is:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otpCode}</p>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you did not request this code, please ignore this email.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Talent on Cloud Team</p>
                </div>
            `,
    };

    await transporter.sendMail(mailOptions);
    // --- End of Nodemailer logic ---

    console.log(`OTP sent to ${email}: ${otpCode}`);
    res
      .status(200)
      .json({
        success: true,
        message: "OTP sent successfully. Please check your email.",
      });
  } catch (error) {
    console.error("Error in /api/send-otp:", error);
    if (error.code === "EENVELOPE" || error.command === "CONN") {
      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to send OTP email. Please check server email configuration.",
        });
    }
    res
      .status(500)
      .json({ success: false, message: "An internal server error occurred." });
  }
});

// Verify OTP
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find and verify OTP from the database
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      otp: otp.toString(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // The OTP is considered verified. It is deleted only upon successful registration.
    res.status(200).json({
      success: true,
      message: "OTP verified successfully. Please complete your registration.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
});
// ** Resend OTP Endpoint (using Nodemailer) **
app.post("/api/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    // Delete any existing OTPs for this email to invalidate old ones
    await Otp.deleteMany({ email: email.toLowerCase() });

    // Generate and save a new OTP
    const otpCode = generateOTP();
    const newOtp = new Otp({ email: email.toLowerCase(), otp: otpCode });
    await newOtp.save();

    // Send the new OTP using Nodemailer
    const mailOptions = {
      from: `"Talent on Cloud" <${
        process.env.EMAIL_USER || "your-email@gmail.com"
      }>`,
      to: email,
      subject: "Your New Verification Code",
      html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Hello again,</h2>
                    <p>Your new verification code is:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${otpCode}</p>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({
        success: true,
        message: "A new OTP has been sent to your email.",
      });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error while resending OTP" });
  }
});

// ** Secure Signup/Register Route (replaces old /api/signup) **
// This route verifies the OTP and creates the user in a single, secure step.
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and OTP are required.",
      });
    }

    // --- Step 1: Verify the OTP ---
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      otp: otp.toString(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // --- Step 2: Check if user already exists ---
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // --- Step 3: Hash password and create user ---
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    await newUser.save();

    // --- Step 4: Delete the used OTP ---
    await Otp.deleteOne({ _id: otpRecord._id });

    // --- Step 5: Generate token and send response ---
    const token = generateToken(newUser._id);
    res.status(201).json({
      success: true,
      message: "User registered successfully!",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

// Update login to return user id and profile status
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);
    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email },
      hasProfile: !!user.profile,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res
        .status(400)
        .json({ message: "Token and new password required" });
    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "iu!O9RInieEINfin309hWinf08vIM0ojfubejnfuwksmiufwuw.jdiapeihknSKiwjaoksn"
    );
    const user = await User.findOne({
      _id: decoded.userId,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Server error during password reset" });
  }
});

app.get("/api/auth/verify-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "iu!O9RInieEINfin309hWinf08vIM0ojfubejnfuwksmiufwuw.jdiapeihknSKiwjaoksn"
    );
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ message: "Invalid token" });

    res.json({ message: "Token is valid", user });
  } catch (err) {
    console.error("Verify token error:", err);
    res.status(401).json({ message: "Invalid token" });
  }
});
// fetching the profile
// GET a single candidate profile by ID or Email
app.get("/api/candidates/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let candidate;

    // Check if the ID is a valid MongoDB ObjectId, otherwise treat it as an email
    if (mongoose.Types.ObjectId.isValid(id)) {
      candidate = await CandidateProfile.findById(id);
    } else {
      // If not a valid ObjectId, search by email
      candidate = await CandidateProfile.findOne({ "personalInfo.email": id });
      if (!candidate) {
        // Fallback for uploads schema
        candidate = await CandidateUploads.findOne({ email: id });
      }
    }

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.json(candidate);
  } catch (error) {
    console.error("Error fetching candidate profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// other companies candidates backend
app.get("/api/candidates/all", async (req, res) => {
  try {
    // Fetching from CandidateUploads to show only internal/uploaded candidates.
    const internalCandidates = await CandidateUploads.find({});

    // Map the data from the CandidateUploads schema to the format
    // expected by the OtherCandidates.jsx component.
    const formattedCandidates = internalCandidates.map((c) => {
      return {
        id: c._id,
        name: c.name || "N/A",
        // Using 'role' from the upload schema as the current role.
        currentRole: c.role || "N/A",
        // Assuming 'currentCompany' is not a field in CandidateUploads, so we use a placeholder.
        // If you add a company field to your upload form, you can map it here.
        currentCompany: "Internal Candidate",
        skills: c.skills || [],
        experience: c.experience || "Not specified",
        location: c.location || "N/A",
        // A random match score for display purposes.
        matchScore: Math.floor(Math.random() * 20) + 80,
        companyLogo: "/placeholder.svg",
      };
    });

    res.status(200).json(formattedCandidates);
  } catch (error) {
    console.error("Error fetching all candidate profiles:", error);
    res.status(500).json({ message: "Failed to fetch candidate profiles." });
  }
});
// Endpoint to update user profile by user id (with file upload support)
app.post(
  "/api/user/:id/profile",
  userUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "introductionVideo", maxCount: 1 },
    { name: "kycDocument", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.params.id;
      let profileData;
      // Accept either JSON in 'data' field (for FormData) or raw JSON body
      try {
        if (req.body && req.body.data) {
          profileData = JSON.parse(req.body.data);
        } else {
          profileData = req.body || {};
        }
      } catch (parseErr) {
        console.error("Profile data JSON parse error:", parseErr.message);
        profileData = {};
      }
      // Attach file info if present
      if (!profileData.personalInfo) profileData.personalInfo = {};
      if (!profileData.kyc) profileData.kyc = {};
      if (req.files && req.files.profilePhoto) {
        profileData.personalInfo.profilePhoto = {
          path: req.files.profilePhoto[0].path,
          originalName: req.files.profilePhoto[0].originalname,
        };
      }
      if (req.files && req.files.resume) {
        profileData.personalInfo.resume = {
          path: req.files.resume[0].path,
          originalName: req.files.resume[0].originalname,
        };
      }
      // Handle video and transcript
      if (req.files && req.files.introductionVideo) {
        profileData.personalInfo.introductionVideo = {
          path: req.files.introductionVideo[0].path,
          originalName: req.files.introductionVideo[0].originalname,
          duration: profileData.personalInfo.introductionVideo?.duration || 0,
        };
        try {
          const audioPath = await extractAudioFromVideo(
            req.files.introductionVideo[0].path
          );
          const transcript = await transcribeAudioFile(audioPath);
          profileData.personalInfo.introTranscript = transcript;
          if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (err) {
          profileData.personalInfo.introTranscript = "";
        }
      }
      // Handle KYC PAN OCR
      if (req.files && req.files.kycDocument) {
        const panFile = req.files.kycDocument[0];
        profileData.kyc.panCard = {
          path: panFile.path,
          originalName: panFile.originalname,
        };
        try {
          const {
            data: { text },
          } = await Tesseract.recognize(panFile.path, "eng");
          profileData.kyc.ocrText = text;
          const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
          const panMatch = text.match(panRegex);
          if (panMatch) {
            profileData.kyc.panNumber = panMatch[0];
          }
          let nameMatch = text.match(/Name\s*[:\n]*\s*([A-Z\s\.]+)/i);
          if (nameMatch && nameMatch[1]) {
            profileData.kyc.panName = nameMatch[1].trim();
          } else {
            const lines = text.split("\n").map((l) => l.trim());
            const idx = lines.findIndex((l) =>
              /INCOME\s*TAX|GOVT\.?\s*OF\s*INDIA/i.test(l)
            );
            if (idx !== -1 && idx + 1 < lines.length) {
              const candidate = lines[idx + 1];
              if (/^[A-Z\s\.]{4,}$/.test(candidate)) {
                profileData.kyc.panName = candidate.trim();
              }
            }
          }
        } catch (ocrErr) {
          // ignore OCR errors; keep other profile data
          console.error("Tesseract OCR error:", ocrErr.message);
        }
      }
      // Save to user profile
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      user.profile = { ...(user.profile || {}), ...profileData };
      await user.save();

      // --- Upsert CandidateProfile ---
      {
        const emailForUpsert =
          profileData.personalInfo && profileData.personalInfo.email
            ? profileData.personalInfo.email
            : user.email || "";
        if (emailForUpsert) {
          const lowerEmail = emailForUpsert.toLowerCase();
          const upsertPersonalInfo = {
            ...(profileData.personalInfo || {}),
            email: lowerEmail,
          };
          await CandidateProfile.findOneAndUpdate(
            { "personalInfo.email": lowerEmail },
            {
              personalInfo: upsertPersonalInfo,
              education: profileData.education || [],
              experience: profileData.experience || [],
              skills: profileData.skills || [],
              projects: profileData.projects || [],
              kyc: profileData.kyc || {},
              profileStatus: profileData.profileStatus || "completed",
              updatedAt: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      }
      // --- End Upsert ---

      res.json({ message: "Profile updated", profile: user.profile });
    } catch (err) {
      console.error("Update user profile error:", err);
      res.status(500).json({ message: "Server error updating profile" });
    }
  }
);

// Endpoint to fetch user profile by user id
app.get("/api/user/:id/profile", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ profile: user.profile });
  } catch (err) {
    console.error("Fetch user profile error:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

// Endpoint to download resume from user's profile
app.get("/api/user/:id/resume", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (
      !user ||
      !user.profile ||
      !user.profile.personalInfo ||
      !user.profile.personalInfo.resume ||
      !user.profile.personalInfo.resume.path
    ) {
      return res.status(404).json({ error: "Resume not found" });
    }
    const filePath = user.profile.personalInfo.resume.path;
    const fileName =
      user.profile.personalInfo.resume.originalName || "resume.pdf";
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Resume file missing on server" });
    }
    res.download(filePath, fileName);
  } catch (err) {
    console.error("User resume download error:", err);
    res.status(500).json({ error: "Server error during resume download" });
  }
});

// **Employer Authentication Routes**
// **Employer Authentication Routes**
// === EMPLOYER OTP ROUTES ===

// Send OTP for Employer
// app.post('/api/auth/employer/send-otp', async (req, res) => {
//     try {
//         const { email } = req.body;
//         if (!email) {
//             return res.status(400).json({ success: false, message: 'Email is required' });
//         }

//         // Check if an employer with this email already exists
//         const existingEmployer = await Employer.findOne({ email: email.toLowerCase() });
//         if (existingEmployer) {
//             return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
//         }

//         // Clear any previous OTPs for this email to prevent conflicts
//         await Otp.deleteMany({ email: email.toLowerCase() });

//         const otpCode = generateOTP();
//         const newOtp = new Otp({ email: email.toLowerCase(), otp: otpCode });
//         await newOtp.save();

//         // Send OTP email using Resend
//         const { data, error } = await resend.emails.send({
//             from: 'Your App <onboarding@resend.dev>',
//             to: [email],
//             subject: 'Employer Account - Email Verification Code',
//             html: `
//                 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//                     <h2 style="color: #333; text-align: center;">Employer Email Verification</h2>
//                     <p>Your verification code is:</p>
//                     <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
//                         <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">${otpCode}</h1>
//                     </div>
//                     <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
//                 </div>
//             `
//         });

//         if (error) {
//             console.error('Resend API error for employer OTP:', error);
//             // Clean up the saved OTP if the email fails to send
//             await Otp.deleteOne({ email: email.toLowerCase(), otp: otpCode });
//             return res.status(500).json({ success: false, message: 'Failed to send verification email.' });
//         }

//         res.status(200).json({ success: true, message: 'OTP sent successfully' });

//     } catch (error) {
//         console.error('Employer Send OTP error:', error);
//         res.status(500).json({ success: false, message: 'Server error while sending OTP.' });
//     }
// });

// // Verify OTP for Employer
// app.post('/api/auth/employer/verify-otp', async (req, res) => {
//     try {
//         const { email, otp } = req.body;
//         if (!email || !otp) {
//             return res.status(400).json({ success: false, message: 'Email and OTP are required' });
//         }

//         const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp: otp.toString() });
//         if (!otpRecord) {
//             return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
//         }

//         // OTP is correct, but we don't delete it yet.
//         // It will be "consumed" during the final signup step.
//         res.status(200).json({ success: true, message: 'OTP verified successfully.' });

//     } catch (error) {
//         console.error('Employer Verify OTP error:', error);
//         res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
//     }
// });

// // Resend OTP for Employer
// app.post('/api/auth/employer/resend-otp', async (req, res) => {
//     // This route is identical in function to the initial send-otp,
//     // as it clears old OTPs and sends a new one.
//     // It can simply call the same logic.
//     await app._router.handle({
//         method: 'POST',
//         url: '/api/auth/employer/send-otp',
//         body: req.body,
//         res: res
//     }, res, () => {});
// });

// Updated Employer Signup Route
app.post("/api/auth/employer-signup", async (req, res) => {
  try {
    console.log("Employer signup request:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    // 1. Check if employer already exists
    const existingEmployer = await Employer.findOne({
      email: email.toLowerCase(),
    });
    if (existingEmployer) {
      return res
        .status(400)
        .json({ message: "An account with this email already exists." });
    }

    // 2. Create the account
    const hashedPassword = await bcrypt.hash(password, 12);
    const newEmployer = new Employer({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: null,
    });
    await newEmployer.save();
    console.log("Employer saved:", newEmployer);

    // 3. Generate token and send response
    const token = generateEmployerToken(newEmployer._id);
    res.status(201).json({
      message: "Employer registered successfully",
      token,
      employer: { id: newEmployer._id, email: newEmployer.email },
    });
  } catch (err) {
    console.error("Employer signup error:", err);
    res.status(500).json({ message: "Server error during employer signup." });
  }
});

app.post("/api/auth/employer-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const employer = await Employer.findOne({ email });
    if (!employer || !(await bcrypt.compare(password, employer.password)))
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateEmployerToken(employer._id);

    // Get company profile if it exists
    let companyProfile = null;
    if (employer.profile) {
      companyProfile = await CompanyProfile.findById(employer.profile);
    }

    res.json({
      message: "Login successful",
      token,
      employerId: employer._id,
      email: employer.email,
      hasProfile: !!employer.profile,
      companyProfile: companyProfile,
    });
  } catch (err) {
    console.error("Employer login error:", err);
    res.status(500).json({ message: "Server error during employer login" });
  }
});

// **Candidate Profile Routes**
app.post(
  "/api/candidate-profile/extract-resume-fields",
  memoryUpload.single("resume"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No resume file uploaded" });
      const tempFilePath = path.join(__dirname, "temp_resume.pdf");
      fs.writeFileSync(tempFilePath, req.file.buffer);
      try {
        // Use the local resume.cjs parser
        const parsedProfile = await parseResume(tempFilePath);
        console.log(
          "Parsed Resume Output:",
          JSON.stringify(parsedProfile, null, 2)
        );
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        if (!parsedProfile) {
          return res
            .status(500)
            .json({
              error: "Resume parsing failed (local parser returned null)",
            });
        }
        res.json(parsedProfile);
      } catch (err) {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        res
          .status(500)
          .json({ error: "Resume parsing failed", details: err.message });
      }
    } catch (err) {
      res.status(500).json({ error: "Server error during resume extraction" });
    }
  }
);

app.post(
  "/api/candidate-profile",
  userUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "resume", maxCount: 1 },
    { name: "introductionVideo", maxCount: 1 },
    { name: "kycDocument", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const parsed = JSON.parse(req.body.data);
      const { personalInfo, education, experience, skills, projects } = parsed;
      const kyc = parsed.kyc || {};

      if (req.files.profilePhoto) {
        personalInfo.profilePhoto = {
          path: req.files.profilePhoto[0].path,
          originalName: req.files.profilePhoto[0].originalname,
        };
      }

      if (req.files.resume) {
        personalInfo.resume = {
          path: req.files.resume[0].path,
          originalName: req.files.resume[0].originalname,
        };
      }

      let transcript = "";
      if (req.files.introductionVideo) {
        personalInfo.introductionVideo = {
          path: req.files.introductionVideo[0].path,
          originalName: req.files.introductionVideo[0].originalname,
          duration: personalInfo.introductionVideo?.duration || 0,
        };
        try {
          console.log(
            "Extracting audio from video:",
            req.files.introductionVideo[0].path
          );
          const audioPath = await extractAudioFromVideo(
            req.files.introductionVideo[0].path
          );
          console.log("Audio extracted to:", audioPath);
          transcript = await transcribeAudioFile(audioPath);
          personalInfo.introTranscript = transcript; // Save transcript in DB
          console.log("Transcription result:", transcript);
          // Clean up audio file
          if (audioPath && fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }
        } catch (err) {
          personalInfo.introTranscript = "";
          console.error("Transcription error:", err);
        }
      }

      // KYC PAN OCR
      if (req.files.kycDocument) {
        const panFile = req.files.kycDocument[0];
        kyc.panCard = {
          path: panFile.path,
          originalName: panFile.originalname,
        };
        try {
          const {
            data: { text },
          } = await Tesseract.recognize(panFile.path, "eng");
          kyc.ocrText = text;
          const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
          const panMatch = text.match(panRegex);
          if (panMatch) {
            kyc.panNumber = panMatch[0];
          }
          let nameMatch = text.match(/Name\s*[:\n]*\s*([A-Z\s\.]+)/i);
          if (nameMatch && nameMatch[1]) {
            kyc.panName = nameMatch[1].trim();
          } else {
            const lines = text.split("\n").map((l) => l.trim());
            const idx = lines.findIndex((l) =>
              /INCOME\s*TAX|GOVT\.?\s*OF\s*INDIA/i.test(l)
            );
            if (idx !== -1 && idx + 1 < lines.length) {
              const candidate = lines[idx + 1];
              if (/^[A-Z\s\.]{4,}$/.test(candidate)) {
                kyc.panName = candidate.trim();
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      const existing = await CandidateProfile.findOne({
        "personalInfo.email": personalInfo.email,
      });
      if (existing)
        return res.status(400).json({ error: "Profile already exists" });

      const newProfile = new CandidateProfile({
        personalInfo,
        education,
        experience,
        skills,
        projects,
        kyc,
      });

      await newProfile.save();
      // For debugging: return transcript in response if available
      res
        .status(201)
        .json({
          message: "Profile created",
          profileId: newProfile._id,
          transcript: transcript || undefined,
        });
    } catch (err) {
      console.error("Profile creation error:", err);
      res.status(500).json({ error: "Server error during profile creation" });
    }
  }
);

app.get("/api/candidate-profile", async (req, res) => {
  try {
    const profiles = await CandidateProfile.find();
    res.json(profiles);
  } catch (err) {
    console.error("Get profiles error:", err);
    res.status(500).json({ error: "Server error fetching profiles" });
  }
});

// Combined candidates: internal (CandidateUploads) + external (CandidateProfile)
app.get("/api/candidates/all-combined", async (req, res) => {
  try {
    const [internalCandidates, externalProfiles] = await Promise.all([
      CandidateUploads.find({}),
      CandidateProfile.find({}),
    ]);

    const mapInternal = (c) => ({
      id: c._id,
      source: "internal",
      name: c.name || "N/A",
      currentRole: c.role || "N/A",
      currentCompany: "Internal Candidate",
      skills: Array.isArray(c.skills) ? c.skills : [],
      experience: c.experience || "",
      location: c.location || "N/A",
      email: c.email || "",
      phone: c.phone || "",
      status: c.status || "Internal Bench",
      employerId: c.employerId || "",
      uploadType: c.uploadType || "single",
    });

    const mapExternal = (p) => ({
      id: p._id,
      source: "external",
      name:
        `${p.personalInfo?.firstName || ""} ${
          p.personalInfo?.lastName || ""
        }`.trim() || "N/A",
      currentRole:
        Array.isArray(p.experience) && p.experience[0]?.jobTitle
          ? p.experience[0].jobTitle
          : "N/A",
      currentCompany:
        p.personalInfo?.company ||
        (Array.isArray(p.experience) && p.experience[0]?.employer) ||
        "N/A",
      skills: Array.isArray(p.skills) ? p.skills : [],
      experience: Array.isArray(p.experience) ? p.experience : [],
      location: p.personalInfo?.location || "N/A",
      email: p.personalInfo?.email || "",
      phone: p.personalInfo?.mobile || "",
      linkedinUrl: p.personalInfo?.linkedinUrl || "",
    });

    const combined = [
      ...internalCandidates.map(mapInternal),
      ...externalProfiles.map(mapExternal),
    ];

    res.status(200).json({
      candidates: combined,
      counts: {
        internal: internalCandidates.length,
        external: externalProfiles.length,
        total: combined.length,
      },
    });
  } catch (err) {
    console.error("Error fetching combined candidates:", err);
    res.status(500).json({ error: "Failed to fetch combined candidates" });
  }
});

app.get("/api/candidate-profile/:id/resume", async (req, res) => {
  try {
    const profile = await CandidateProfile.findById(req.params.id);
    if (
      !profile ||
      !profile.personalInfo ||
      !profile.personalInfo.resume ||
      !profile.personalInfo.resume.path
    ) {
      console.error("Resume not found: Profile or resume path missing", {
        profileId: req.params.id,
      });
      return res
        .status(404)
        .json({ error: "Resume not found for this candidate." });
    }

    const filePath = profile.personalInfo.resume.path;
    const fileName = profile.personalInfo.resume.originalName || "resume.pdf";

    // Log the file path for debugging
    console.log("Attempting to download resume:", {
      filePath,
      fileName,
      profileId: req.params.id,
    });

    if (!fs.existsSync(filePath)) {
      console.error("Resume file missing on server", {
        filePath,
        profileId: req.params.id,
      });
      return res.status(404).json({ error: "Resume file missing on server." });
    }

    // Set headers for download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/pdf");

    // Stream the file for better performance
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
      console.error("Error streaming resume file:", err);
      res.status(500).json({ error: "Error reading resume file." });
    });
    fileStream.pipe(res);
  } catch (err) {
    console.error("Resume download error:", err);
    res.status(500).json({ error: "Server error during resume download." });
  }
});

app.delete("/api/candidate-profile/:id", async (req, res) => {
  try {
    const profile = await CandidateProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ error: "Not found" });

    // Delete files
    const email = profile.personalInfo.email;
    const folder = path.join(__dirname, "user_uploads", email);
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true, force: true });
    }

    await CandidateProfile.findByIdAndDelete(req.params.id);
    res.json({ message: "Profile deleted with files" });
  } catch (err) {
    console.error("Profile deletion error:", err);
    res.status(500).json({ error: "Server error during profile deletion" });
  }
});

// === CANDIDATE UPLOADS ROUTES ===

// Upload single candidate
app.post(
  "/api/candidate-uploads/single",
  userUpload.fields([
    { name: "resume", maxCount: 1 },
    { name: "additionalDocs", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log("Single upload request received:", {
        body: req.body,
        files: req.files,
        headers: req.headers,
        method: req.method,
        url: req.url,
      });

      if (!req.body.data) {
        console.error("No data field in request body:", req.body);
        return res.status(400).json({ error: "Missing data field in request" });
      }

      const data = JSON.parse(req.body.data);
      console.log("Parsed data:", data);

      const {
        name,
        role,
        status,
        email,
        phone,
        experience,
        skills,
        employerId,
      } = data;

      // Validate employerId
      if (!employerId) {
        return res.status(400).json({ error: "Employer ID is required" });
      }

      // Create candidate upload record
      const uploadData = {
        name,
        role,
        status: status || "Internal Bench",
        statusColor: "#52c41a",
        uploadType: "single",
        employerId,
        email,
        phone,
        experience,
        skills: Array.isArray(skills)
          ? skills
          : skills
          ? skills.split(",").map((s) => s.trim())
          : [],
      };

      console.log("Upload data to be saved:", uploadData);

      // Handle resume file
      if (req.files && req.files.resume && req.files.resume[0]) {
        uploadData.resume = {
          path: req.files.resume[0].path,
          originalName: req.files.resume[0].originalname,
        };
        console.log("Resume file added:", uploadData.resume);
      } else {
        console.log("No resume file provided");
      }

      // Handle additional documents
      if (
        req.files &&
        req.files.additionalDocs &&
        req.files.additionalDocs.length > 0
      ) {
        uploadData.additionalDocs = req.files.additionalDocs.map((file) => ({
          path: file.path,
          originalName: file.originalname,
        }));
        console.log("Additional docs added:", uploadData.additionalDocs);
      } else {
        console.log("No additional docs provided");
      }

      console.log(
        "About to create CandidateUploads instance with data:",
        uploadData
      );
      const newUpload = new CandidateUploads(uploadData);
      console.log("CandidateUploads instance created:", newUpload);

      console.log("About to save candidate to database...");
      await newUpload.save();
      console.log("Candidate saved successfully with ID:", newUpload._id);

      res.status(201).json({
        message: "Candidate uploaded successfully",
        uploadId: newUpload._id,
      });
    } catch (err) {
      console.error("Single candidate upload error:", err);
      console.error("Error stack:", err.stack);
      res
        .status(500)
        .json({
          error: "Server error during candidate upload",
          details: err.message,
        });
    }
  }
);

// Test endpoint to check server health
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is running",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Test endpoint for candidate uploads
app.get("/api/candidate-uploads/test", async (req, res) => {
  try {
    const count = await CandidateUploads.countDocuments();
    res.json({
      message: "Candidate uploads endpoint working",
      count: count,
      mongodb:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  } catch (error) {
    console.error("Candidate uploads test error:", error);
    res.status(500).json({
      error: "Database error",
      details: error.message,
      mongodb:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  }
});

// Test endpoint for single upload without files
app.post("/api/candidate-uploads/single-test", async (req, res) => {
  try {
    console.log("Single upload test request received:", {
      body: req.body,
      headers: req.headers,
    });

    if (!req.body.data) {
      return res.status(400).json({ error: "Missing data field in request" });
    }

    const data = JSON.parse(req.body.data);
    console.log("Parsed test data:", data);

    const { name, role, status, email, phone, experience, skills } = data;

    const uploadData = {
      name,
      role,
      status: status || "Internal Bench",
      statusColor: "#52c41a",
      uploadType: "single",
      email,
      phone,
      experience,
      skills: Array.isArray(skills)
        ? skills
        : skills
        ? skills.split(",").map((s) => s.trim())
        : [],
    };

    console.log("Test upload data:", uploadData);

    const newUpload = new CandidateUploads(uploadData);
    await newUpload.save();

    res.status(201).json({
      message: "Test candidate uploaded successfully",
      uploadId: newUpload._id,
    });
  } catch (err) {
    console.error("Single upload test error:", err);
    res
      .status(500)
      .json({ error: "Server error during test upload", details: err.message });
  }
});
// new upload candidate endpoint
const upload = multer({ storage: multer.memoryStorage() }); // Using memory storage for simpler processing
app.post(
  "/api/candidates/upload",
  upload.single("resume"),
  async (req, res) => {
    try {
      const {
        name,
        role,
        email,
        phone,
        experience,
        skills,
        status,
        employerId,
      } = req.body;

      // --- 1. Validate Essential Data ---
      if (!name || !role || !email || !employerId) {
        return res
          .status(400)
          .json({
            message:
              "Validation failed: Name, role, email, and employerId are required fields.",
          });
      }

      // --- 2. Create the Employer-Specific Record (for Internal-candidate.jsx) ---
      // This record is tied to the employer's private view.
      const newUploadRecord = new CandidateUploads({
        name,
        role,
        email,
        phone: phone || "N/A",
        experience: experience || "N/A",
        skills: skills ? skills.split(",").map((s) => s.trim()) : [],
        status: status || "Internal Bench",
        employerId,
        uploadType: "single", // This can be adapted for bulk uploads
      });
      await newUploadRecord.save();

      // --- 3. Create or Update the Global Profile (for OtherCandidates.jsx) ---
      // This makes the candidate visible to everyone on the platform.
      const nameParts = name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const globalProfileData = {
        personalInfo: {
          firstName,
          lastName,
          email,
          mobile: phone || "N/A",
        },
        experience: [
          {
            jobTitle: role,
            currentJob: true,
          },
        ],
        skills: skills ? skills.split(",").map((s) => s.trim()) : [],
        profileStatus: "completed",
      };

      // Using `findOneAndUpdate` with `upsert: true` is crucial. It prevents creating
      // duplicate global profiles for the same email address.
      await CandidateProfile.findOneAndUpdate(
        { "personalInfo.email": email },
        { $set: globalProfileData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.status(201).json({
        message:
          "Candidate successfully uploaded and is now visible in both internal and external lists.",
        candidate: newUploadRecord,
      });
    } catch (error) {
      console.error(
        "Error during the unified candidate upload process:",
        error
      );
      if (error.code === 11000) {
        // Handles duplicate email error in CandidateUploads
        return res
          .status(409)
          .json({
            message: `A candidate with the email ${req.body.email} already exists in your internal list.`,
          });
      }
      res
        .status(500)
        .json({
          message: "A server error occurred during the upload process.",
        });
    }
  }
);
// Upload bulk candidates
app.post(
  "/api/candidate-uploads/bulk",
  multer().none(), // Add middleware to handle multipart/form-data
  async (req, res) => {
    try {
      console.log("Bulk upload request received:", {
        body: req.body,
        headers: req.headers,
        method: req.method,
        url: req.url,
      });

      let data;
      // Handle both FormData and JSON
      if (req.body.data) {
        data = JSON.parse(req.body.data);
      } else if (req.body.candidates) {
        // Direct JSON payload
        data = req.body;
      } else {
        console.error("Invalid request body:", req.body);
        return res.status(400).json({ error: "Invalid request format" });
      }
      console.log("Parsed data:", data);

      const { candidates, bulkName, employerId } = data;

      if (!Array.isArray(candidates) || candidates.length === 0) {
        console.log("Invalid candidates data:", candidates);
        return res.status(400).json({ error: "Candidates array is required" });
      }

      if (!employerId) {
        return res.status(400).json({ error: "Employer ID is required" });
      }

      console.log("Processing", candidates.length, "candidates");
      console.log("MongoDB connection status:", mongoose.connection.readyState);

      // Test the model
      try {
        const testCount = await CandidateUploads.countDocuments();
        console.log("Current candidate count in database:", testCount);
      } catch (testError) {
        console.error("Error testing CandidateUploads model:", testError);
      }

      const bulkUploadId = `bulk_${Date.now()}`;
      const uploadPromises = [];
      let successCount = 0;
      let errorCount = 0;

      for (const candidate of candidates) {
        console.log("Processing candidate:", candidate);

        // Validate required fields
        if (!candidate.name || !candidate.role) {
          console.log("Missing required fields for candidate:", candidate);
          errorCount++;
          continue;
        }

        // Process skills field
        let skillsArray = [];
        if (Array.isArray(candidate.skills)) {
          skillsArray = candidate.skills;
        } else if (candidate.skills && typeof candidate.skills === "string") {
          skillsArray = candidate.skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
        }

        const uploadData = {
          name: candidate.name,
          role: candidate.role,
          status: candidate.status || "Internal Bench",
          statusColor: "#52c41a",
          uploadType: "bulk",
          employerId,
          email: candidate.email || "",
          phone: candidate.phone || "",
          experience: candidate.experience || "",
          skills: skillsArray,
          bulkUploadId,
          bulkName: bulkName || `Bulk Upload (${candidates.length} candidates)`,
        };

        console.log("Upload data for candidate:", uploadData);

        // For bulk uploads, we don't associate files with individual candidates
        // Files are uploaded separately and manually associated later
        // This prevents the 500 error when files are not provided for each candidate

        try {
          const newUpload = new CandidateUploads(uploadData);
          const savedUpload = await newUpload.save();
          console.log("Successfully saved candidate:", savedUpload._id);
          successCount++;
        } catch (saveError) {
          console.error("Error saving candidate:", saveError);
          console.error("Failed candidate data:", uploadData);
          errorCount++;
        }
      }

      console.log(
        `Bulk upload completed. Success: ${successCount}, Errors: ${errorCount}`
      );

      res.status(201).json({
        message: `Bulk upload successful. ${successCount} candidates uploaded.`,
        bulkUploadId,
        count: successCount,
        errors: errorCount,
      });
    } catch (err) {
      console.error("Bulk candidate upload error:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      res.status(500).json({
        error: "Server error during bulk candidate upload",
        details: err.message,
      });
    }
  }
);

// Get all candidate uploads for a specific employer
app.get("/api/candidate-uploads", async (req, res) => {
  try {
    const { employerId } = req.query;

    if (!employerId) {
      return res.status(400).json({ error: "Employer ID is required" });
    }

    const uploads = await CandidateUploads.find({ employerId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(uploads);
  } catch (err) {
    console.error("Get candidate uploads error:", err);
    res.status(500).json({ error: "Server error fetching candidate uploads" });
  }
});

// Get internal candidates for display for a specific employer
// app.get('/api/internal-candidates', async (req, res) => {
//     try {
//         const { status, search, page = 1, limit = 10, employerId } = req.query;

//         if (!employerId) {
//             return res.status(400).json({ error: 'Employer ID is required' });
//         }

//         let query = { employerId };
//         let statusList = [];

//         // If status is provided as a comma-separated list, split it
//         if (status) {
//             statusList = status.split(',').map(s => s.trim()).filter(Boolean);
//         }

//         // Default: show all relevant statuses
//         if (!statusList.length) {
//             statusList = [
//                 'Internal Bench',
//                 'Available for Project',
//                 'On Project',
//                 'Notice Period'
//             ];
//         }

//         // Use $in for multiple statuses
//         query.status = { $in: statusList };

//         // Search functionality
//         if (search) {
//             query.$or = [
//                 { name: { $regex: search, $options: 'i' } },
//                 { role: { $regex: search, $options: 'i' } },
//                 { email: { $regex: search, $options: 'i' } },
//                 { skills: { $in: [new RegExp(search, 'i')] } }
//             ];
//         }

//         const skip = (page - 1) * limit;

//         const candidates = await CandidateUploads.find(query)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(parseInt(limit));

//         const total = await CandidateUploads.countDocuments(query);

//         res.json({
//             candidates,
//             total,
//             page: parseInt(page),
//             totalPages: Math.ceil(total / limit)
//         });
//     } catch (err) {
//         console.error('Get internal candidates error:', err);
//         res.status(500).json({ error: 'Server error fetching internal candidates' });
//     }
// });
app.get("/api/internal-candidates", async (req, res) => {
  try {
    const { employerId } = req.query;
    if (!employerId) {
      return res
        .status(400)
        .json({ message: "Employer ID is required for this request." });
    }
    const candidates = await CandidateUploads.find({ employerId: employerId });
    res.status(200).json({ candidates });
  } catch (error) {
    console.error("Error fetching internal candidates:", error);
    res.status(500).json({ message: "Failed to fetch internal candidates." });
  }
});

// Delete candidate upload
app.delete("/api/candidate-uploads/:id", async (req, res) => {
  try {
    const upload = await CandidateUploads.findById(req.params.id);
    if (!upload) return res.status(404).json({ error: "Upload not found" });

    // Delete associated files
    if (
      upload.resume &&
      upload.resume.path &&
      fs.existsSync(upload.resume.path)
    ) {
      fs.unlinkSync(upload.resume.path);
    }

    if (upload.additionalDocs && upload.additionalDocs.length > 0) {
      upload.additionalDocs.forEach((doc) => {
        if (doc.path && fs.existsSync(doc.path)) {
          fs.unlinkSync(doc.path);
        }
      });
    }

    await CandidateUploads.findByIdAndDelete(req.params.id);
    res.json({ message: "Upload deleted successfully" });
  } catch (err) {
    console.error("Delete candidate upload error:", err);
    res.status(500).json({ error: "Server error during upload deletion" });
  }
});

// Upload resume for existing candidate
app.post(
  "/api/candidate-uploads/:id/resume",
  userUpload.single("resume"),
  async (req, res) => {
    try {
      const candidate = await CandidateUploads.findById(req.params.id);
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No resume file provided" });
      }

      // Update candidate with resume information
      candidate.resume = {
        path: req.file.path,
        originalName: req.file.originalname,
      };

      await candidate.save();

      res.json({
        message: "Resume uploaded successfully",
        resume: {
          originalName: req.file.originalname,
        },
      });
    } catch (err) {
      console.error("Resume upload error:", err);
      res.status(500).json({ error: "Server error during resume upload" });
    }
  }
);

// **Company Profile Routes**
app.post(
  "/api/company-profile",
  companyUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const data = JSON.parse(req.body.data);

      // Check for duplicate by companyName or website
      const existing = await CompanyProfile.findOne({
        $or: [
          { companyName: data.companyName },
          { companyWebsite: data.companyWebsite },
        ],
      });
      if (existing)
        return res
          .status(400)
          .json({ error: "Company profile already exists" });

      // Build profile object
      const profile = { ...data };

      // Attach logo file
      if (req.files.logo && req.files.logo[0]) {
        profile.logo = {
          data: req.files.logo[0].buffer,
          mimetype: req.files.logo[0].mimetype,
          originalName: req.files.logo[0].originalname,
        };
      }

      // Attach document files
      if (req.files.documents) {
        profile.documents = (profile.documents || []).map((doc, idx) => ({
          ...doc,
          file: req.files.documents[idx]
            ? {
                data: req.files.documents[idx].buffer,
                mimetype: req.files.documents[idx].mimetype,
                originalName: req.files.documents[idx].originalname,
              }
            : undefined,
        }));
      }

      const newProfile = new CompanyProfile(profile);
      await newProfile.save();

      res
        .status(201)
        .json({ message: "Company profile created", id: newProfile._id });
    } catch (err) {
      console.error("Company profile creation error:", err);
      res
        .status(500)
        .json({ error: "Server error during company profile creation" });
    }
  }
);

app.get("/api/company-profile", async (req, res) => {
  try {
    const profiles = await CompanyProfile.find();
    res.json(profiles);
  } catch (err) {
    console.error("Get company profiles error:", err);
    res.status(500).json({ error: "Server error fetching company profiles" });
  }
});

app.post(
  "/api/company-profile-setup",
  companyUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "documents", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      console.log("Received body:", req.body);
      console.log("Received files:", req.files);
      const data = JSON.parse(req.body.data);

      // Check for duplicate by companyName or website
      const existing = await CompanyProfile.findOne({
        $or: [
          { companyName: data.companyName },
          { companyWebsite: data.companyWebsite },
        ],
      });
      if (existing)
        return res
          .status(400)
          .json({ error: "Company profile already exists" });

      // Build profile object
      const profile = { ...data };

      // Attach logo file
      if (req.files.logo && req.files.logo[0]) {
        profile.logo = {
          data: req.files.logo[0].buffer,
          mimetype: req.files.logo[0].mimetype,
          originalName: req.files.logo[0].originalname,
        };
      }

      // Attach document files
      if (req.files.documents) {
        profile.documents = (profile.documents || []).map((doc, idx) => ({
          ...doc,
          file: req.files.documents[idx]
            ? {
                data: req.files.documents[idx].buffer,
                mimetype: req.files.documents[idx].mimetype,
                originalName: req.files.documents[idx].originalname,
              }
            : undefined,
        }));
      }

      const newProfile = new CompanyProfile(profile);
      await newProfile.save();

      // Link the profile to the employer's bucket if employerId is provided
      if (data.employerId) {
        await Employer.findByIdAndUpdate(data.employerId, {
          profile: newProfile._id,
        });
      }

      res
        .status(201)
        .json({ message: "Company profile created", id: newProfile._id });
    } catch (err) {
      console.error("Company profile creation error:", err);
      res
        .status(500)
        .json({ error: "Server error during company profile creation" });
    }
  }
);

app.get("/api/company-profile-setup", async (req, res) => {
  // Just proxy to the real handler
  const profiles = await CompanyProfile.find();
  res.json(profiles);
});

app.delete("/api/company-profile/:id", async (req, res) => {
  try {
    const profile = await CompanyProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ error: "Not found" });

    // Delete files folder
    if (profile.companyName) {
      const folder = path.join(
        __dirname,
        "Company_uploads",
        profile.companyName.replace(/[^a-zA-Z0-9_-]/g, "_")
      );
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
      }
    }

    await CompanyProfile.findByIdAndDelete(req.params.id);
    res.json({ message: "Company profile deleted" });
  } catch (err) {
    console.error("Company profile deletion error:", err);
    res
      .status(500)
      .json({ error: "Server error during company profile deletion" });
  }
});

// **Job Posting Routes**
const jobUpload = multer({
  dest: path.join(__dirname, "job_logos"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

app.post("/api/jobs", jobUpload.single("logo"), async (req, res) => {
  try {
    console.log("Received job post:", req.body);
    if (req.file) {
      console.log("Received logo file:", req.file.originalname, req.file.path);
    }

    // Parse salary range
    let salaryMin = req.body.salaryMin || req.body["salaryRange[min]"];
    let salaryMax = req.body.salaryMax || req.body["salaryRange[max]"];
    if (salaryMin !== undefined) salaryMin = Number(salaryMin);
    if (salaryMax !== undefined) salaryMax = Number(salaryMax);

    // Parse screening questions
    let screeningQuestions = req.body.screeningQuestions;
    if (typeof screeningQuestions === "string") {
      screeningQuestions = screeningQuestions
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean);
    } else if (!Array.isArray(screeningQuestions)) {
      screeningQuestions = [];
    }

    // Parse keySkills
    let keySkills = req.body.keySkills;
    if (typeof keySkills === "string") {
      keySkills = keySkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(keySkills)) {
      keySkills = [];
    }

    // Handle job description and responsibilities
    let jobDescription = req.body.jobDescription;
    if (Array.isArray(jobDescription)) {
      jobDescription = jobDescription.join("\n");
    }

    let responsibilities = req.body.responsibilities;
    if (Array.isArray(responsibilities)) {
      responsibilities = responsibilities.join("\n");
    }

    // Handle logo file
    let companyLogo = undefined;
    if (req.file) {
      const fileData = fs.readFileSync(req.file.path);
      companyLogo = {
        data: fileData,
        contentType: req.file.mimetype,
      };
      // Delete the file from disk after reading
      fs.unlink(req.file.path, () => {});
    }

    const jobPostData = {
      jobTitle: req.body.jobTitle,
      location: req.body.location,
      employmentType: req.body.employmentType,
      jobCategory: req.body.jobCategory,
      salaryRange: {
        min: salaryMin,
        max: salaryMax,
      },
      experienceLevel: req.body.experienceLevel,
      companyName: req.body.companyName,
      companyLogo: companyLogo,
      jobDescription,
      responsibilities,
      applicationEmail: req.body.applicationEmail,
      screeningQuestions,
      keySkills,
      employerId: req.body.employerId || "default-employer-id", // Add employer ID
    };

    const jobPost = new JobPost(jobPostData);
    await jobPost.save();

    console.log("Saved job post:", jobPost._id);
    res.status(201).json(jobPost);
  } catch (error) {
    console.error("Error creating job post:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/jobs/drafts", jobUpload.single("logo"), async (req, res) => {
  try {
    // Parse salary range
    let salaryMin = req.body.salaryMin || req.body["salaryRange[min]"];
    let salaryMax = req.body.salaryMax || req.body["salaryRange[max]"];
    if (salaryMin !== undefined) salaryMin = Number(salaryMin);
    if (salaryMax !== undefined) salaryMax = Number(salaryMax);

    // Parse screening questions
    let screeningQuestions = req.body.screeningQuestions;
    if (typeof screeningQuestions === "string") {
      screeningQuestions = screeningQuestions
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean);
    } else if (!Array.isArray(screeningQuestions)) {
      screeningQuestions = [];
    }

    // Parse keySkills
    let keySkills = req.body.keySkills;
    if (typeof keySkills === "string") {
      keySkills = keySkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (!Array.isArray(keySkills)) {
      keySkills = [];
    }

    // Handle job description and responsibilities
    let jobDescription = req.body.jobDescription;
    if (Array.isArray(jobDescription)) {
      jobDescription = jobDescription.join("\n");
    }

    let responsibilities = req.body.responsibilities;
    if (Array.isArray(responsibilities)) {
      responsibilities = responsibilities.join("\n");
    }

    // Handle logo file
    let companyLogo = undefined;
    if (req.file) {
      const fileData = fs.readFileSync(req.file.path);
      companyLogo = {
        data: fileData,
        contentType: req.file.mimetype,
      };
      fs.unlink(req.file.path, () => {});
    }

    const draftData = {
      jobTitle: req.body.jobTitle,
      location: req.body.location,
      employmentType: req.body.employmentType,
      jobCategory: req.body.jobCategory,
      salaryRange: {
        min: salaryMin,
        max: salaryMax,
      },
      experienceLevel: req.body.experienceLevel,
      companyName: req.body.companyName,
      companyLogo: companyLogo,
      jobDescription,
      responsibilities,
      applicationEmail: req.body.applicationEmail,
      screeningQuestions,
      keySkills,
      employerId: req.body.employerId || "default-employer-id", // Add employer ID
    };

    const draft = new JobDraft(draftData);
    await draft.save();

    res.status(201).json({ message: "Draft saved", draftId: draft._id });
  } catch (error) {
    console.error("Error saving job draft:", error);
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const jobPosts = await JobPost.find().sort({ postedAt: -1 });
    res.json(jobPosts);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/jobs/alljobs", async (req, res) => {
  try {
    const jobs = await JobPost.find().sort({ postedAt: -1 });
    console.log("Fetched jobs count:", jobs.length);

    const PLACEHOLDER_LOGO = "/static/placeholder-logo.png";

    function isValidLogo(logo) {
      return (
        logo &&
        logo.data &&
        Buffer.isBuffer(logo.data) &&
        logo.data.length > 0 &&
        logo.contentType
      );
    }

    const mappedJobs = jobs.map((job) => ({
      id: job._id.toString(),
      title: job.jobTitle || "No title",
      company: job.companyName || "No company",
      companyLogo: isValidLogo(job.companyLogo)
        ? `data:${
            job.companyLogo.contentType
          };base64,${job.companyLogo.data.toString("base64")}`
        : PLACEHOLDER_LOGO,
      location: job.location || "Remote",
      workType: job.employmentType || "Full-time",
      workMode:
        job.location && job.location.toLowerCase().includes("remote")
          ? "Remote"
          : "On-site",
      salary: formatSalary(job.salaryRange),
      experience: job.experienceLevel || "Not specified",
      postedDate: formatPostedDate(job.postedAt),
      description: job.jobDescription || "",
      requirements: job.responsibilities
        ? job.responsibilities.split("\n").filter(Boolean)
        : [],
      skills: Array.isArray(job.keySkills)
        ? job.keySkills
        : parseArrayField(job.keySkills),
      benefits: [],
      companySize: "51-200",
      industry: mapCategoryToIndustry(job.jobCategory),
      applicationDeadline: job.postedAt
        ? new Date(
            job.postedAt.getTime() + 30 * 24 * 60 * 60 * 1000
          ).toLocaleDateString()
        : "",
      employerId: job.employerId || "default-employer-id", // Add employer ID
    }));

    res.json(Array.isArray(mappedJobs) ? mappedJobs : []);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch jobs", details: err.message });
  }
});

app.get("/api/jobs/:id", async (req, res) => {
  try {
    const jobPost = await JobPost.findById(req.params.id);
    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }
    res.json(jobPost);
  } catch (error) {
    console.error("Error fetching job:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/jobs/drafts", async (req, res) => {
  try {
    const drafts = await JobDraft.find().sort({ updatedAt: -1 });
    res.json(drafts);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/jobs/drafts/:id", async (req, res) => {
  try {
    const draft = await JobDraft.findById(req.params.id);
    if (!draft) return res.status(404).json({ error: "Draft not found" });
    res.json(draft);
  } catch (error) {
    console.error("Error fetching draft:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const jobPost = await JobPost.findByIdAndDelete(req.params.id);
    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    // Optionally delete logo file
    if (jobPost.companyLogo && jobPost.companyLogo.path) {
      fs.unlink(jobPost.companyLogo.path, () => {});
    }

    res.json({ message: "Job post deleted" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/jobs/drafts/:id", async (req, res) => {
  try {
    const draft = await JobDraft.findByIdAndDelete(req.params.id);
    if (!draft) return res.status(404).json({ error: "Draft not found" });
    res.json({ message: "Draft deleted" });
  } catch (error) {
    console.error("Error deleting draft:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/jobs/:id", jobUpload.single("logo"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.companyLogo = {
        path: req.file.path,
        originalName: req.file.originalname,
      };
    }

    // Parse salary range
    if (
      updateData.salaryMin !== undefined ||
      updateData["salaryRange[min]"] !== undefined
    ) {
      updateData.salaryRange = updateData.salaryRange || {};
      updateData.salaryRange.min = Number(
        updateData.salaryMin || updateData["salaryRange[min]"]
      );
    }

    if (
      updateData.salaryMax !== undefined ||
      updateData["salaryRange[max]"] !== undefined
    ) {
      updateData.salaryRange = updateData.salaryRange || {};
      updateData.salaryRange.max = Number(
        updateData.salaryMax || updateData["salaryRange[max]"]
      );
    }

    // Parse screening questions
    if (typeof updateData.screeningQuestions === "string") {
      updateData.screeningQuestions = updateData.screeningQuestions
        .split(",")
        .map((q) => q.trim())
        .filter(Boolean);
    }

    const jobPost = await JobPost.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!jobPost) {
      return res.status(404).json({ error: "Job post not found" });
    }

    res.json(jobPost);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(400).json({ error: error.message });
  }
});

// Add this after your other employer routes
app.get("/api/employer/:id", async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);
    if (!employer)
      return res.status(404).json({ message: "Employer not found" });
    res.json({
      id: employer._id,
      email: employer.email,
      profile: employer.profile, // This is the ObjectId of the company profile
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get a single company profile by id
app.get("/api/company-profile/:id", async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default_secret"
      );
      if (!decoded.employerId) {
        return res.status(401).json({ message: "Invalid token" });
      }
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Find employer and their profile
    const employer = await Employer.findById(req.params.id);
    if (!employer) {
      return res.status(404).json({ message: "Employer not found" });
    }

    if (!employer.profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const profile = await CompanyProfile.findById(employer.profile);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    console.error("Error fetching company profile:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get candidate profile by userId (using email)
app.get("/api/candidate-profile/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching profile for userId:", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.email) {
      console.log("No email found for user:", userId);
      return res.status(404).json({ message: "User email not found" });
    }

    console.log("Looking for profile with email:", user.email);

    // Find candidate profile by email (case-insensitive)
    const profile = await CandidateProfile.findOne({
      "personalInfo.email": {
        $regex: new RegExp(
          "^" + user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$",
          "i"
        ),
      },
    });

    if (!profile) {
      console.log("No profile found for email:", user.email);
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    console.log("Profile found successfully");
    res.json(profile);
  } catch (err) {
    console.error("Error fetching candidate profile by userId:", err);
    res
      .status(500)
      .json({ message: "Server error fetching candidate profile" });
  }
});

// === GEMINI 2.5 JOB POST GENERATION ENDPOINT ===
// Use a valid Gemini model name for the API
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent";
const GEMINI_EMBEDDING_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

app.post("/api/generate-job-post", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Compose the Gemini API request
    const geminiReq = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Given the following job prompt, generate:
1. A detailed Job Description
2. A list of Responsibilities (comma-separated or as a bullet list)
3. A list of Required Key Skills (comma-separated)
Respond in the following format (no extra text, no JSON):
Job Description: <text>
Responsibilities: <text>
Required Key Skills: <text>
Prompt: ${prompt}`,
            },
          ],
        },
      ],
    };

    const geminiRes = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      geminiReq,
      { headers: { "Content-Type": "application/json" } }
    );

    // Parse Gemini's response
    let text = "";
    if (
      geminiRes.data &&
      geminiRes.data.candidates &&
      geminiRes.data.candidates[0].content &&
      geminiRes.data.candidates[0].content.parts
    ) {
      text = geminiRes.data.candidates[0].content.parts[0].text;
    } else if (
      geminiRes.data &&
      geminiRes.data.candidates &&
      geminiRes.data.candidates[0].content &&
      geminiRes.data.candidates[0].content.text
    ) {
      text = geminiRes.data.candidates[0].content.text;
    }

    // Extract sections from the response
    let jobDescription = "",
      responsibilities = "",
      keySkills = "";
    const descMatch = text.match(
      /Job Description:\s*([\s\S]*?)(?:Responsibilities:|$)/i
    );
    if (descMatch) jobDescription = descMatch[1].trim();
    const respMatch = text.match(
      /Responsibilities:\s*([\s\S]*?)(?:Required Key Skills:|$)/i
    );
    if (respMatch) responsibilities = respMatch[1].trim();
    const skillsMatch = text.match(/Required Key Skills:\s*([\s\S]*)/i);
    if (skillsMatch) keySkills = skillsMatch[1].trim();

    res.json({ jobDescription, responsibilities, keySkills });
  } catch (err) {
    console.error(
      "Gemini job post generation error:",
      err.response?.data || err.message
    );
    res
      .status(500)
      .json({
        error: "Failed to generate job post",
        details: err.response?.data || err.message,
      });
  }
});

// === Cosine Similarity ===
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

// === Get Gemini Embedding ===
async function getGeminiEmbedding(text) {
  const headers = {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY,
  };
  const payload = {
    content: {
      parts: [{ text }],
    },
    task_type: "SEMANTIC_SIMILARITY",
  };
  try {
    const response = await axios.post(GEMINI_EMBEDDING_API_URL, payload, {
      headers,
    });
    if (
      response.data &&
      response.data.embedding &&
      response.data.embedding.values
    ) {
      return response.data.embedding.values;
    } else {
      console.error("Unexpected Gemini embedding response:", response.data);
      return null;
    }
  } catch (err) {
    console.error(
      "Error getting Gemini embedding:",
      err.response?.data || err.message
    );
    return null;
  }
}

// === Calculate Match Score ===
async function calculateMatchScore(candidateText, jobText) {
  const candidateVector = await getGeminiEmbedding(candidateText);
  const jobVector = await getGeminiEmbedding(jobText);
  if (!candidateVector || !jobVector) {
    return { score: null, interpretation: "Failed to generate embeddings." };
  }
  const score = cosineSimilarity(candidateVector, jobVector);
  let interpretation = "";
  if (score >= 0.85)
    interpretation =
      "Excellent Match! This candidate is highly aligned with the job requirements.";
  else if (score >= 0.7)
    interpretation =
      "Strong Match. This candidate has many of the required skills and experiences.";
  else if (score >= 0.5)
    interpretation =
      "Moderate Match. There are some overlaps, but also areas for improvement or further review.";
  else
    interpretation =
      "Low Match. The candidate's profile does not strongly align with the job description.";
  return { score, interpretation };
}

// === Matchmaking Proxy Endpoint ===
app.get("/api/matchmaking-proxy", (req, res) => {
  res.json({ message: "Matchmaking endpoint is available" });
});

app.post("/api/matchmaking-proxy", async (req, res) => {
  try {
    const { userId, jobId } = req.body;
    if (!userId || !jobId) {
      return res.status(400).json({ error: "userId and jobId are required" });
    }

    // 1. Fetch candidate details
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const profile = await CandidateProfile.findOne({
      "personalInfo.email": user.email,
    });
    if (!profile)
      return res.status(404).json({ error: "Candidate profile not found" });

    // 2. Fetch job details
    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    // 3. Construct payload (not stored)
    const candidate_details = {
      candidate_id: userId,
      years_of_exp: profile.experience?.length || 0,
      skills: profile.skills || [],
      Tools: profile.skills || [],
      "Work Experience":
        profile.experience?.map((exp) => exp.experienceSummary).join(" ") || "",
      self_intro: profile.personalInfo?.introduction || "",
    };
    const job_description = {
      _id: { $oid: job._id.toString() },
      jobTitle: job.jobTitle,
      location: job.location,
      employmentType: job.employmentType,
      jobCategory: job.jobCategory,
      salaryRange: job.salaryRange,
      experienceLevel: job.experienceLevel,
      companyName: job.companyName,
      jobDescription: job.jobDescription,
      responsibilities: job.responsibilities,
      applicationEmail: job.applicationEmail,
      screeningQuestions: job.screeningQuestions,
      keySkills: job.keySkills,
      postedAt: { $date: job.postedAt.toISOString() },
      __v: 0,
    };

    // 4. Calculate match score using Gemini
    // --- Extract and combine relevant text for job ---
    const job_description_parts = [];
    if (job_description.jobDescription)
      job_description_parts.push(job_description.jobDescription);
    if (job_description.responsibilities)
      job_description_parts.push(job_description.responsibilities);
    if (Array.isArray(job_description.keySkills))
      job_description_parts.push(job_description.keySkills.join(" "));
    const job_text_for_embedding = job_description_parts.join(" ");
    // --- Extract and combine relevant text for candidate ---
    const candidate_profile_parts = [];
    if (candidate_details.self_intro)
      candidate_profile_parts.push(candidate_details.self_intro);
    if (candidate_details["Work Experience"])
      candidate_profile_parts.push(candidate_details["Work Experience"]);
    if (Array.isArray(candidate_details.skills))
      candidate_profile_parts.push(candidate_details.skills.join(" "));
    if (Array.isArray(candidate_details.Tools))
      candidate_profile_parts.push(candidate_details.Tools.join(" "));
    const candidate_text_for_embedding = candidate_profile_parts.join(" ");

    const { score, interpretation } = await calculateMatchScore(
      candidate_text_for_embedding,
      job_text_for_embedding
    );
    const percentScore = score !== null ? Math.round(score * 100) : null;

    // 5. Return score to frontend
    res.json({ score: percentScore, interpretation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Update candidate status
app.patch("/api/candidate-uploads/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Missing status in request body" });
    }
    const candidate = await CandidateUploads.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    res.json({ message: "Status updated successfully", candidate });
  } catch (err) {
    console.error("Error updating candidate status:", err);
    res.status(500).json({ error: "Server error updating candidate status" });
  }
});

// Get counts of candidates for each status for a specific employer
app.get("/api/candidate-uploads/status-counts", async (req, res) => {
  try {
    const { employerId } = req.query;

    if (!employerId) {
      return res.status(400).json({ error: "Employer ID is required" });
    }

    // List of statuses to count
    const statuses = [
      "Internal Bench",
      "Available for Project",
      "On Project",
      "Notice Period",
    ];
    const counts = {};
    for (const status of statuses) {
      counts[status] = await CandidateUploads.countDocuments({
        status,
        employerId,
      });
    }
    res.json(counts);
  } catch (err) {
    console.error("Error fetching status counts:", err);
    res.status(500).json({ error: "Server error fetching status counts" });
  }
});

// Job Application Endpoints
app.post("/api/job-applications", async (req, res) => {
  try {
    const { userId, jobId, employerId, appliedDate, status } = req.body;

    if (!userId || !jobId) {
      return res
        .status(400)
        .json({
          error: "Missing required fields: userId and jobId are required",
        });
    }

    // If employerId is not provided, try to get it from the job posting
    let finalEmployerId = employerId;
    if (!finalEmployerId) {
      // Try to find the job and get the employer ID from it
      const job = await JobPost.findById(jobId);
      if (job && job.employerId) {
        finalEmployerId = job.employerId;
      } else {
        // Use a default employer ID for now
        finalEmployerId = "default-employer-id";
      }
    }

    // Check if user has already applied for this job
    const existingApplication = await JobApplication.findOne({ userId, jobId });
    if (existingApplication) {
      return res
        .status(400)
        .json({ error: "You have already applied for this job" });
    }

    // Get candidate details
    const candidateProfile = await CandidateProfile.findOne({ userId });
    const applicationData = {
      userId,
      jobId,
      employerId: finalEmployerId,
      appliedDate,
      status,
      candidateName: candidateProfile
        ? `${candidateProfile.personalInfo?.firstName || ""} ${
            candidateProfile.personalInfo?.lastName || ""
          }`.trim()
        : "Unknown",
      candidateEmail: candidateProfile?.personalInfo?.email || "",
      candidatePhone: candidateProfile?.personalInfo?.phone || "",
    };

    const newApplication = new JobApplication(applicationData);
    await newApplication.save();

    res.status(201).json({
      message: "Application submitted successfully",
      applicationId: newApplication._id,
    });
  } catch (err) {
    console.error("Error submitting job application:", err);
    res.status(500).json({ error: "Server error submitting application" });
  }
});

// Get job applications for an employer
app.get("/api/job-applications", async (req, res) => {
  try {
    const { employerId } = req.query;

    if (!employerId) {
      return res.status(400).json({ error: "Employer ID is required" });
    }

    const applications = await JobApplication.find({ employerId })
      .sort({ appliedDate: -1 })
      .populate("jobId", "title company location")
      .populate("userId", "personalInfo");

    res.json({ applications });
  } catch (err) {
    console.error("Error fetching job applications:", err);
    res.status(500).json({ error: "Server error fetching applications" });
  }
});

// Update application status
app.patch("/api/job-applications/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const application = await JobApplication.findByIdAndUpdate(
      id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json({ message: "Status updated successfully", application });
  } catch (err) {
    console.error("Error updating application status:", err);
    res.status(500).json({ error: "Server error updating status" });
  }
});

// resume fetching for candidate search
// --- NEW ENDPOINT for Public Resume Download ---
app.get("/api/candidates/resume/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let candidate;

    if (mongoose.Types.ObjectId.isValid(id)) {
      candidate = await CandidateProfile.findById(id);
    } else {
      candidate = await CandidateProfile.findOne({ "personalInfo.email": id });
    }

    if (
      !candidate ||
      !candidate.personalInfo ||
      !candidate.personalInfo.resume ||
      !candidate.personalInfo.resume.path
    ) {
      return res
        .status(404)
        .json({ error: "Resume not found for this candidate." });
    }

    const filePath = path.join(__dirname, candidate.personalInfo.resume.path);

    if (fs.existsSync(filePath)) {
      res.download(
        filePath,
        candidate.personalInfo.resume.originalName,
        (err) => {
          if (err) {
            console.error("Error downloading file:", err);
            res.status(500).send("Could not download the file.");
          }
        }
      );
    } else {
      res.status(404).json({ error: "File does not exist on the server." });
    }
  } catch (error) {
    console.error("Error fetching resume:", error);
    res
      .status(500)
      .json({ error: "Server error while trying to fetch resume." });
  }
});

// Helper: Confidence scoring
function confidenceValue(affindaVal, modelVal) {
  if (affindaVal && modelVal && affindaVal === modelVal)
    return { value: affindaVal, confidence: "high" };
  if (affindaVal) return { value: affindaVal, confidence: "high" };
  if (modelVal) return { value: modelVal, confidence: "medium" };
  return { value: "", confidence: "low" };
}

// Hybrid resume parsing function using Affinda API and model-based extraction
async function parseResumeHybrid(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const uploadRes = await axios.post(`${AFFINDA_API_URL}/resumes`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${AFFINDA_API_KEY}`,
      },
    });

    const identifier = uploadRes.data.meta?.identifier;
    if (!identifier) throw new Error("No identifier found after upload");

    let resumeData = null;
    let rawText = "";
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      // ✅ await is legal now because we’re inside async function
      await new Promise((res) => setTimeout(res, 2000));

      const fetchRes = await axios.get(
        `${AFFINDA_API_URL}/resumes/${identifier}`,
        { headers: { Authorization: `Bearer ${AFFINDA_API_KEY}` } }
      );

      if (fetchRes.data?.data) {
        resumeData = fetchRes.data.data;
        rawText = fetchRes.data.data.rawText || "";
        break;
      }
      attempts++;
    }

    if (!resumeData) throw new Error("Parsing failed or timed out");

    // … rest of your educationData / experienceData / skillsData / projectsData building code goes here …

    return {
      personalData,
      educationData,
      experienceData,
      skillsData,
      projectsData,
    };
  } catch (err) {
    throw err;
  }
}

const validator = require("validator");

function validateEmail(email) {
  return validator.isEmail(email || "");
}
function validatePhone(phone) {
  // Accepts 10-15 digits, allows +, spaces, dashes
  const cleaned = (phone || "").replace(/[^\d+]/g, "");
  return (
    cleaned.length >= 10 &&
    cleaned.length <= 15 &&
    /^\+?\d{10,15}$/.test(cleaned)
  );
}
function validateName(name) {
  if (!name) return false;
  if (name.length < 2 || name.length > 50) return false;
  if (name === name.toUpperCase()) return false;
  if (name.match(/@|http|www/)) return false;
  if (name.split(" ").length < 2) return false;
  return true;
}
function validateYear(year) {
  return year && /^\d{4}$/.test(year) && +year > 1950 && +year < 2100;
}
function validateDate(date) {
  // Accepts YYYY, YYYY-MM, MM/YYYY, etc.
  if (!date) return false;
  if (/^\d{4}$/.test(date)) return true;
  if (/^\d{4}-\d{2}$/.test(date)) return true;
  if (/^\d{2}\/\d{4}$/.test(date)) return true;
  return false;
}

function smartConfidence(affindaVal, modelVal, validatorFn) {
  const affValid = validatorFn(affindaVal);
  const modValid = validatorFn(modelVal);
  if (affindaVal && modelVal && affindaVal === modelVal && affValid)
    return { value: affindaVal, confidence: "very high", validated: true };
  if (affindaVal && affValid)
    return { value: affindaVal, confidence: "high", validated: true };
  if (modelVal && modValid)
    return { value: modelVal, confidence: "high", validated: true };
  if (affindaVal)
    return { value: affindaVal, confidence: "medium", validated: false };
  if (modelVal)
    return { value: modelVal, confidence: "medium", validated: false };
  return { value: "", confidence: "low", validated: false };
}

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📋 Available endpoints:`);
      console.log(`   - POST /api/send-otp`);
      console.log(`   - POST /api/verify-otp`);
      console.log(`   - POST /api/resend-otp`);
      console.log(`   - POST /api/signup`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to DB:", error);
    process.exit(1);
  });

module.exports = app;
