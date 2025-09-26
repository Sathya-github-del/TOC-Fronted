"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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
import { Search, Person, CalendarToday, Close } from "@mui/icons-material";
import Logo from "@/app/components/Logo";
import ProtectedRoute from "@/app/components/ProtectedRoute";

const API_BASE_URL = "https://toc-bac-1.onrender.com/api";


const statusOptions = {
  "Sent": { label: "Sent", color: "default" },
  "Under Review": { label: "Under Review", color: "warning" },
  "Interviewing": { label: "Interviewing", color: "info" },
  "Hired": { label: "Hired", color: "success" },
  "Rejected": { label: "Rejected", color: "error" },
};

const Navbar = () => {
  const router = useRouter();

  const handleRoute = () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        router.push('/?view=companyprofile');
      } else {
        router.push('/?view=employerlogin');
      }
    } catch {
      router.push('/?view=employerlogin');
    }
  };

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
        <Typography variant="body1" sx={{ cursor: "pointer" }} onClick={handleRoute} >
          Profile
        </Typography>
      </Box>
    </Box>
  );
};

const ApplicationCard = ({ app, onViewDetails, onUpdateStatus }) => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        {app.jobTitle}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", mb: 1 }}
      >
        <Person sx={{ mr: 1, fontSize: 16 }} />
        {app.candidateName}
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
    <CardActions sx={{ justifyContent: "space-between" }}>
      <Button size="small" onClick={() => onViewDetails(app)}>
        View Details
      </Button>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={app.status}
          onChange={(e) => onUpdateStatus(app._id, e.target.value)}
          displayEmpty
        >
          {Object.keys(statusOptions).map((status) => (
            <MenuItem key={status} value={status}>
              {statusOptions[status].label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
          Candidate Application Details
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Candidate Name:</strong> {app?.candidateName}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Job Title:</strong> {app?.jobTitle}
      </Typography>

      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Applied Date:</strong>{" "}
        {app?.appliedDate
          ? new Date(app.appliedDate).toLocaleDateString()
          : "N/A"}
      </Typography>

      <Typography variant="body1" component="div" sx={{ mb: 2 }}>
        <strong>Status:</strong>{" "}
        <Chip
          label={statusOptions[app?.status]?.label || app?.status}
          color={statusOptions[app?.status]?.color || "default"}
          size="small"
        />
      </Typography>

      {app?.candidateEmail && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Email:</strong> {app.candidateEmail}
        </Typography>
      )}

      {app?.candidatePhone && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          <strong>Phone:</strong> {app.candidatePhone}
        </Typography>
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
          mb: 2,
        }}
      >
        {app?.coverLetter || "No cover letter provided"}
      </Typography>

      <Box sx={{ display: "flex", gap: 1 }}>
        {/* <Button
          variant="outlined"
          onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) return alert('Please login again.');
              const url = `${API_BASE_URL}/job-applications/${app?._id}/resume`;
              const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return alert(data.error || 'Resume not available');
              }
              const blob = await res.blob();
              const dlUrl = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = dlUrl;
              a.download = (app?.candidateName ? `${app.candidateName.replace(/\s+/g, '_')}_Resume.pdf` : 'resume.pdf');
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(dlUrl);
            } catch (e) {
              alert('Failed to download resume');
            }
          }}
        >
          Download Resume
        </Button> */}
      </Box>
    </Box>
  </Modal>
);

const ApplicationsReceivedPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch received applications when component mounts
  useEffect(() => {
    const fetchReceivedApplications = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/job-applications/received`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          setApplications(response.data.applications || []);
        } else {
          setError('Failed to fetch applications');
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
        setError('Failed to load applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedApplications();
  }, []);

  // Update application status
  const [reasonModal, setReasonModal] = useState({ open: false, applicationId: null, status: 'Rejected', text: '' });

  const submitStatusUpdate = async (applicationId, newStatus, rejectionReason) => {
    const token = localStorage.getItem('token');
    const payload = (newStatus === 'Rejected') ? { status: newStatus, rejectionReason } : { status: newStatus };
    const response = await axios.patch(
      `${API_BASE_URL}/job-applications/${applicationId}/status`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    if (response.status === 200) {
      setApplications(prev => prev.map(app => app._id === applicationId ? { ...app, status: newStatus, rejectionReason } : app));
    } else {
      console.error('Failed to update status');
      alert('Failed to update application status. Please try again.');
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      if (newStatus === 'Rejected') {
        setReasonModal({ open: true, applicationId, status: newStatus, text: '' });
        return;
      }
      await submitStatusUpdate(applicationId, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating application status. Please try again.');
    }
  };

  // Generate unique job titles dynamically from fetched applications
  const uniqueJobTitles = useMemo(() => {
    return [...new Set(applications.map((app) => app.jobTitle))];
  }, [applications]);

  const filteredAndSortedApps = useMemo(() => {
    return applications
      .filter((app) => statusFilter === "all" || app.status === statusFilter)
      .filter((app) => jobFilter === "all" || app.jobTitle === jobFilter)
      .filter((app) => {
        const lowerCaseTerm = searchTerm.toLowerCase();
        return (
          !lowerCaseTerm ||
          app.jobTitle.toLowerCase().includes(lowerCaseTerm) ||
          app.candidateName.toLowerCase().includes(lowerCaseTerm)
        );
      })
      .sort(
        (a, b) =>
          new Date(sortBy === "newest" ? b.appliedDate : a.appliedDate) -
          new Date(sortBy === "newest" ? a.appliedDate : b.appliedDate)
      );
  }, [applications, searchTerm, statusFilter, jobFilter, sortBy]);

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
            Received Applications
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading applications...</Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
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
                      sx: { borderRadius: "8px" },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      sx={{ borderRadius: "8px" }}
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
                    <InputLabel>Job Title</InputLabel>
                    <Select
                      value={jobFilter}
                      onChange={(e) => setJobFilter(e.target.value)}
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="all">All Jobs</MenuItem>
                      {uniqueJobTitles.map((title) => (
                        <MenuItem key={title} value={title}>
                          {title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      sx={{ borderRadius: "8px" }}
                    >
                      <MenuItem value="newest">Newest First</MenuItem>
                      <MenuItem value="oldest">Oldest First</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={3}>
                {filteredAndSortedApps.length > 0 ? (
                  filteredAndSortedApps.map((app) => (
                    <Grid item xs={12} md={6} lg={4} key={app._id}>
                      <ApplicationCard
                        app={app}
                        onViewDetails={handleViewDetails}
                        onUpdateStatus={updateApplicationStatus}
                      />
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ textAlign: "center", mt: 4 }}>
                      No applications found.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Box>

        <JobDetailsModal
          open={modalOpen}
          onClose={handleCloseModal}
          app={selectedApp}
        />
        <Modal
          open={reasonModal.open}
          onClose={() => setReasonModal({ open: false, applicationId: null, status: 'Rejected', text: '' })}
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 24, width: '90%', maxWidth: 480 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Rejection Reason</Typography>
            <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>Please provide a reason for rejecting this candidate (optional).</Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={reasonModal.text}
              onChange={(e) => setReasonModal((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="E.g., Not a fit for role requirements, insufficient experience, etc."
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button onClick={() => setReasonModal({ open: false, applicationId: null, status: 'Rejected', text: '' })}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  const { applicationId, status, text } = reasonModal;
                  await submitStatusUpdate(applicationId, status, text || undefined);
                  setReasonModal({ open: false, applicationId: null, status: 'Rejected', text: '' });
                }}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </ProtectedRoute>
  );
};

export default ApplicationsReceivedPage;
