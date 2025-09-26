"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    UploadCloud,
    Building,
    ShieldCheck,
    Edit,
    AlertCircle,
    CheckCircle,
} from "lucide-react";

// --- HELPER COMPONENTS ---
const StyledInput = React.memo(({ error, className = "", ...props }) => (
    <input
        {...props}
        className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${error
            ? "border-red-500"
            : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            } ${className}`}
    />
));

const StyledTextArea = React.memo(({ error, className = "", ...props }) => (
    <textarea
        {...props}
        rows="4"
        className={`w-full px-4 py-2 border rounded-md transition-colors duration-300 ${error
            ? "border-red-500"
            : "border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            } ${className}`}
    />
));

const FormField = React.memo(
    ({ label, children, required, error, note, className = "" }) => (
        <div className={`space-y-1 ${className}`}>
            <label className="text-sm font-medium text-gray-700 flex items-center">
                {label} {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
        </div>
    )
);

const Card = ({ children, className = "" }) => (
    <div
        className={`bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 ${className}`}
    >
        {children}
    </div>
);

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            {title}
        </h2>
        {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
    </div>
);

export default function ProfileSetup() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("company"); // "company" | "legal"
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        companyName: "",
        companyDescription: "",
        industryType: "",
        companyWebsite: "",
        pan: "",
        gstin: "",
        address: "",
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [primaryContact, setPrimaryContact] = useState({
        name: "",
        role: "",
        email: "",
        phone: "",
    });
    const [additionalContacts, setAdditionalContacts] = useState([]);
    const [status, setStatus] = useState({
        loading: false,
        error: null,
        success: null,
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const edit = searchParams.get("edit") === "true";
        setIsEditMode(edit);

        if (edit) {
            const savedProfile = localStorage.getItem("companyProfile");
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                setFormData({
                    companyName: profile.companyName || "",
                    companyDescription: profile.companyDescription || "",
                    industryType: profile.industryType || "",
                    companyWebsite: profile.companyWebsite || "",
                    pan: profile.pan || "",
                    gstin: profile.gstin || "",
                    address: profile.address || "",
                });
                setPrimaryContact(
                    profile.primaryContact || { name: "", role: "", email: "", phone: "" }
                );
                setAdditionalContacts(profile.additionalContacts || []);
            }
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePrimaryContactChange = (e) => {
        const { name, value } = e.target;
        setPrimaryContact((prev) => ({ ...prev, [name]: value }));
    };

    const handleAdditionalContactChange = (index, e) => {
        const { name, value } = e.target;
        const updatedContacts = [...additionalContacts];
        updatedContacts[index][name] = value;
        setAdditionalContacts(updatedContacts);
    };

    const addContact = () => {
        setAdditionalContacts([
            ...additionalContacts,
            { name: "", role: "", email: "", phone: "" },
        ]);
    };

    const removeContact = (index) => {
        setAdditionalContacts(additionalContacts.filter((_, i) => i !== index));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        } else {
            setLogoFile(null);
            setLogoPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: null, success: null });

        const employerId = localStorage.getItem("employerId");
        const token = localStorage.getItem("token");

        if (!employerId || !token) {
            setStatus({
                loading: false,
                error: "Authentication error. Please log in again.",
                success: null,
            });
            return;
        }

        const dataPayload = {
            ...formData,
            primaryContact,
            additionalContacts,
        };

        const submissionForm = new FormData();
        submissionForm.append("data", JSON.stringify(dataPayload));
        if (logoFile) {
            submissionForm.append("logo", logoFile);
        }

        const url = `https://toc-bac-1.onrender.com/api/company-profile/${employerId}`;
        try {
            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: submissionForm,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to save profile`);
            }

            const result = await response.json();
            setStatus({
                loading: false,
                error: null,
                success: `Profile successfully saved!`,
            });

            localStorage.setItem("companyProfile", JSON.stringify(result));
            setTimeout(() => {
                router.push("/?view=companyprofile");
            }, 1500);
        } catch (error) {
            setStatus({ loading: false, error: error.message, success: null });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {isEditMode ? "Edit Company Profile" : "Setup Your Company Profile"}
                    </h1>
                    <p className="mt-4 text-lg text-gray-600">
                        {isEditMode
                            ? "Update your company details below to keep everything current."
                            : "Provide your company details to get started on our platform."}
                    </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex -mb-px space-x-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab("company")}
                            className={`pb-2 px-2 text-sm font-medium ${activeTab === "company"
                                ? "border-b-2 border-indigo-600 text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Company Information
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("legal")}
                            className={`pb-2 px-2 text-sm font-medium ${activeTab === "legal"
                                ? "border-b-2 border-indigo-600 text-indigo-600"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Legal & Financial + Contacts
                        </button>
                    </nav>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Tab 1 */}
                    {activeTab === "company" && (
                        <Card>
                            <SectionHeader
                                title={
                                    <>
                                        <Building className="text-indigo-500" /> Company Information
                                    </>
                                }
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="Company Name" required className="md:col-span-2">
                                    <StyledInput
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </FormField>
                                <FormField label="Company Website" required>
                                    <StyledInput
                                        name="companyWebsite"
                                        type="url"
                                        value={formData.companyWebsite}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="https://example.com"
                                    />
                                </FormField>
                                <FormField label="Industry Type">
                                    <StyledInput
                                        name="industryType"
                                        value={formData.industryType}
                                        onChange={handleInputChange}
                                    />
                                </FormField>
                                <FormField label="Company Description" className="md:col-span-2">
                                    <StyledTextArea
                                        name="companyDescription"
                                        value={formData.companyDescription}
                                        onChange={handleInputChange}
                                    />
                                </FormField>
                                <FormField label="Company Address" className="md:col-span-2">
                                    <StyledInput
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                    />
                                </FormField>
                                <FormField
                                    label="Company Logo"
                                    note="Recommended: 200x200px, Max 2MB"
                                    className="md:col-span-2"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border">
                                            {logoPreview ? (
                                                <img
                                                    src={logoPreview}
                                                    alt="Logo Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <UploadCloud className="text-gray-400" />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm"
                                        >
                                            Upload Logo
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleLogoChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                    </div>
                                </FormField>
                            </div>
                        </Card>
                    )}

                    {/* Tab 2 */}
                    {activeTab === "legal" && (
                        <>
                            <Card>
                                <SectionHeader
                                    title={
                                        <>
                                            <ShieldCheck className="text-indigo-500" /> Legal &
                                            Financial
                                        </>
                                    }
                                    subtitle="This information helps us verify your company."
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField label="PAN Number" required>
                                        <StyledInput
                                            name="pan"
                                            value={formData.pan}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </FormField>
                                    <FormField label="GSTIN">
                                        <StyledInput
                                            name="gstin"
                                            value={formData.gstin}
                                            onChange={handleInputChange}
                                        />
                                    </FormField>
                                </div>
                            </Card>

                            <Card>
                                <SectionHeader
                                    title={
                                        <>
                                            <Edit className="text-indigo-500" /> Contact Persons
                                        </>
                                    }
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-4">
                                        Primary Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                        <FormField label="Full Name" required>
                                            <StyledInput
                                                name="name"
                                                value={primaryContact.name}
                                                onChange={handlePrimaryContactChange}
                                                required
                                            />
                                        </FormField>
                                        <FormField label="Role / Designation">
                                            <StyledInput
                                                name="role"
                                                value={primaryContact.role}
                                                onChange={handlePrimaryContactChange}
                                            />
                                        </FormField>
                                        <FormField label="Email" required>
                                            <StyledInput
                                                type="email"
                                                name="email"
                                                value={primaryContact.email}
                                                onChange={handlePrimaryContactChange}
                                                required
                                            />
                                        </FormField>
                                        <FormField label="Phone">
                                            <StyledInput
                                                name="phone"
                                                value={primaryContact.phone}
                                                onChange={handlePrimaryContactChange}
                                            />
                                        </FormField>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-semibold text-gray-800">
                                            Additional Contacts
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={addContact}
                                            className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
                                        >
                                            <Plus size={16} /> Add Contact
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {additionalContacts.map((contact, index) => (
                                            <div
                                                key={index}
                                                className="relative p-4 border rounded-lg bg-gray-50"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <FormField label="Full Name">
                                                        <StyledInput
                                                            name="name"
                                                            value={contact.name}
                                                            onChange={(e) =>
                                                                handleAdditionalContactChange(index, e)
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Role">
                                                        <StyledInput
                                                            name="role"
                                                            value={contact.role}
                                                            onChange={(e) =>
                                                                handleAdditionalContactChange(index, e)
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Email">
                                                        <StyledInput
                                                            type="email"
                                                            name="email"
                                                            value={contact.email}
                                                            onChange={(e) =>
                                                                handleAdditionalContactChange(index, e)
                                                            }
                                                        />
                                                    </FormField>
                                                    <FormField label="Phone">
                                                        <StyledInput
                                                            name="phone"
                                                            value={contact.phone}
                                                            onChange={(e) =>
                                                                handleAdditionalContactChange(index, e)
                                                            }
                                                        />
                                                    </FormField>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeContact(index)}
                                                    className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}

                    {/* Submit Section */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6">
                        {status.error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                                <AlertCircle size={18} /> {status.error}
                            </div>
                        )}
                        {status.success && (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <CheckCircle size={18} /> {status.success}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={status.loading}
                            className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status.loading
                                ? "Saving..."
                                : isEditMode
                                    ? "Update Profile"
                                    : "Save and Continue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}