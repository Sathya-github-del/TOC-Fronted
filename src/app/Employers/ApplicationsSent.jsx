"use client";

import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Modal,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Search, Business, CalendarToday, Close } from "@mui/icons-material";
import Logo from "@/app/components/Logo";
import ProtectedRoute from "@/app/components/ProtectedRoute";

// API Configuration - Updated to match your server URL
const API_BASE_URL = "https://toc-bac-1.onrender.com/api";

// --- UI Components ---
const statusOptions = {
  Sent: { label: "Sent", color: "default" },
  "Under Review": { label: "Under Review", color: "warning" },
  Interviewing: { label: "Interviewing", color: "info" },
  Hired: { label: "Hired", color: "success" },
  Rejected: { label: "Rejected", color: "error" },
};
const Navbar = () => {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        bgcolor: "white",
        boxShadow: 1,
      }}
    >
      <Logo
        onClick={() => router.push("/")}
        className="text-xl font-bold text-indigo-600 cursor-pointer"
      />
      <Box sx={{ display: "flex", gap: 3 }}>
        <Typography
          variant="body1"
          sx={{ cursor: "pointer" }}
          onClick={() => router.push("/?view=companyprofile")}
        >
          Profile
        </Typography>
      </Box>
    </Box>
  );
};

const ApplicationCard = ({ app, onViewDetails }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {app.jobTitle}
      </Typography>
      <Chip
        icon={<Business />}
        label={app.companyName}
        sx={{ mb: 1 }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Applied for: {app.candidateName}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", mb: 2 }}
      >
        <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
        {new Date(app.appliedDate).toLocaleDateString()}
      </Typography>
      <Chip
        label={statusOptions[app.status]?.label || app.status}
        color={statusOptions[app.status]?.color || "default"}
        size="small"
      />
    </CardContent>
    <CardActions>
      <Button size="small" onClick={() => onViewDetails(app)}>
        View Details
      </Button>
    </CardActions>
  </Card>
);

const JobDetailsModal = ({ open, onClose, app }) => (
  <Modal
    open={open}
    onClose={onClose}
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Box
      sx={{
        bgcolor: "white",
        p: 4,
        borderRadius: 2,
        boxShadow: 24,
        maxWidth: 600,
        width: "90%",
        maxHeight: "80vh",
        overflow: "auto",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" component="h2">
          Application Details
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Job Title:</strong> {app?.jobTitle}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Company:</strong> {app?.companyName}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Candidate Name:</strong> {app?.candidateName}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Applied Date:</strong>{" "}
        {app?.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "N/A"}
      </Typography>

      <Typography variant="body1" component="div" sx={{ mb: 2 }}>
        <strong>Status:</strong>{" "}
        <Chip
          label={statusOptions[app?.status]?.label || app?.status}
          color={statusOptions[app?.status]?.color || "default"}
          size="small"
        />
      </Typography>

      x       {app?.rejectionReason && (
        <>
          <Typography variant="body1" sx={{ mb: 1 }}>
            <strong>Rejection Reason:</strong>
          </Typography>
          <Typography variant="body2" sx={{ p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            {app.rejectionReason}
          </Typography>
        </>
      )}

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Cover Letter:</strong>
      </Typography>
      <Typography
        variant="body2"
        sx={{
          p: 2,
          bgcolor: "grey.100",
          borderRadius: 1,
          fontStyle: app?.coverLetter ? "normal" : "italic",
        }}
      >
        {app?.coverLetter || "No cover letter provided."}
      </Typography>
    </Box>
  </Modal>
);

// --- Main Page Component ---
const ApplicationsSentPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/job-applications/employer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApplications(response.data.applications || []);
        setError(null);
      } catch (err) {
        setError("Failed to load your applications. Please try again later.");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const uniqueCompanies = useMemo(
    () => [...new Set(applications.map((app) => app.companyName))],
    [applications]
  );

  const filteredAndSortedApps = useMemo(() => {
    return applications
      .filter((app) => statusFilter === "all" || app.status === statusFilter)
      .filter((app) => companyFilter === "all" || app.companyName === companyFilter)
      .filter((app) => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        return (
          !lowerCaseTerm ||
          app.jobTitle.toLowerCase().includes(lowerCaseTerm) ||
          app.companyName.toLowerCase().includes(lowerCaseTerm) ||
          app.candidateName.toLowerCase().includes(lowerCaseTerm)
        );
      })
      .sort((a, b) =>
        new Date(sortBy === "newest" ? b.appliedDate : a.appliedDate) -
        new Date(sortBy === "newest" ? a.appliedDate : b.appliedDate)
      );
  }, [applications, searchTerm, statusFilter, companyFilter, sortBy]);

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedApp(null);
  };

  return (
    <ProtectedRoute>
      <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
        <Navbar />

        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            My Job Applications
          </Typography>

          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {Object.keys(statusOptions).map((key) => (
                    <MenuItem key={key} value={key}>
                      {key}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Company</InputLabel>
                <Select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <MenuItem value="all">All Companies</MenuItem>
                  {uniqueCompanies.map((company) => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : (
            <Grid container spacing={3}>
              {filteredAndSortedApps.length > 0 ? (
                filteredAndSortedApps.map((app) => (
                  <Grid item xs={12} md={6} lg={4} key={app._id}>
                    <ApplicationCard app={app} onViewDetails={handleViewDetails} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ textAlign: "center", mt: 4 }}>
                    No applications found that match your criteria.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Box>

        {selectedApp && (
          <JobDetailsModal
            open={modalOpen}
            onClose={handleCloseModal}
            app={selectedApp}
          />
        )}
      </Box>
    </ProtectedRoute>
  );
};

export default ApplicationsSentPage;
