"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Box,
  Grid,
  Card,
  Avatar,
  Typography,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material"
import { Search, Dashboard, People, Work, Settings, Menu as MenuIcon, Delete as DeleteIcon } from "@mui/icons-material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { useRouter } from "next/navigation"
import Logo from "@/app/components/Logo"
import ProtectedRoute from "@/app/components/ProtectedRoute"

// --- MUI Theme Configuration ---
const theme = createTheme({
  palette: {
    primary: { main: "#4f46e5" },
    secondary: { main: "#8b5cf6" },
    background: { default: "#f3f4f6" },
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        },
      },
    },
  },
})

const drawerWidth = 240

const STATUS_OPTIONS = [
  "Available (default status)/ Active bench",
  "Proposed to the client",
  "Interview in progress",
  "Confirmed by the client",
  "Soft locked( to be confirmed by client)",
  "Deploying/Onboarding",
  // Keep existing external statuses for backward compatibility
  "completed",
  "Under Review",
  "hired",
  "rejected",
  "INHECRATE",
  "Open",
]

// --- Sidebar Component ---
const AppSidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const router = useRouter()
  const navItems = [
    { name: "Dashboard", icon: <Dashboard />, href: "/?view=companyprofile" },
    {
      name: "Candidates",
      icon: <People />,
      href: "/?view=candidate-search",
      current: true,
    },
    { name: "Jobs", icon: <Work />, href: "/?view=jobs" },
  ]

  const handleNavigation = (href) => {
    router.push(href)
  }

  const drawerContent = (
    <div>
      <Toolbar sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span onClick={() => router.push("/?view=companyprofile")} className="cursor-pointer">
          <Logo size={200} />
        </span>
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.href)} selected={item.current}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: 0,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  )
}

// --- Candidate Table Row Component ---
const CandidateTableRow = ({ candidate, index, onDelete }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [resumeUrl, setResumeUrl] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState(null)
  const router = useRouter()
  const [imageErrors, setImageErrors] = useState(new Set())

  const handleImageError = (candidateEmail) => {
    setImageErrors((prev) => new Set([...prev, candidateEmail]))
  }

  // Helper function to construct profile photo URLs
  const getProfilePhotoUrl = (candidate, candidateType) => {
    const buildFrom = (pp) => {
      if (!pp) return null
      if (pp.fileId) return `https://toc-bac-1.onrender.com/api/files/${pp.fileId}`
      if (pp.path) return `https://toc-bac-1.onrender.com/uploads/profiles/${pp.path}`
      if (typeof pp === "string") return pp
      return null
    }

    if (candidateType === "Internal") {
      return buildFrom(candidate.profilePhoto)
    } else {
      return buildFrom(candidate.personalInfo?.profilePhoto)
    }
  }

  const getResumeUrl = (candidate, candidateType) => {
    if (candidateType === "Internal") {
      const r = candidate.resume
      if (!r) return null
      if (typeof r === "string") return r
      if (r?.fileId) return `https://toc-bac-1.onrender.com/api/files/${r.fileId}`
      if (r?.path) return `https://toc-bac-1.onrender.com/uploads/resumes/${r.path}`
      return null
    } else {
      const r = candidate.personalInfo?.resume
      if (!r) return null
      if (typeof r === "string") return r
      if (r?.fileId) return `https://toc-bac-1.onrender.com/api/files/${r.fileId}`
      if (r?.path) return `https://toc-bac-1.onrender.com/user_uploads/${r.path}`
      return null
    }
  }

  // --- Functionality (Data Extraction) ---
  const candidateType = candidate.source === "internal" ? "Internal" : "External"
  const name =
    candidateType === "Internal"
      ? candidate.name || "Unnamed"
      : (candidate.personalInfo
        ? `${candidate.personalInfo.firstName || ""} ${candidate.personalInfo.lastName || ""}`.trim()
        : candidate.name) || "Unnamed"
  const role =
    candidateType === "Internal"
      ? candidate.role || "Not Specified"
      : candidate.experience?.[0]?.jobTitle || candidate.role || "Not Specified"
  const email = candidateType === "Internal" ? candidate.email : candidate.personalInfo?.email
  const phone = candidateType === "Internal" ? candidate.phone : candidate.personalInfo?.mobile
  const location = candidateType === "Internal" ? candidate.location : candidate.personalInfo?.location
  const status = candidate.profileStatus || candidate.status || "Available (default status)/ Active bench"
  const skills = Array.isArray(candidate.skills) ? candidate.skills : []
  const photoPath = getProfilePhotoUrl(candidate, candidateType)
  const imageKey = candidate._id || email || name

  const resumePath = getResumeUrl(candidate, candidateType)
  const education = Array.isArray(candidate.education) ? candidate.education : []
  const experience = Array.isArray(candidate.experience) ? candidate.experience : []

  // Handle View Resume click
  const handleViewResume = async () => {
    if (!resumePath) {
      setResumeError("No resume available for this candidate")
      return
    }

    setResumeLoading(true)
    setResumeError(null)

    try {
      if (resumePath.startsWith("http")) {
        window.open(resumePath, "_blank")
        setResumeLoading(false)
        return
      }

      if (resumePath.includes("fileId")) {
        const fileId = candidateType === "Internal" ? candidate.resume?.fileId : candidate.personalInfo?.resume?.fileId

        if (fileId) {
          const resumeUrl = `https://toc-bac-1.onrender.com/api/files/${fileId}`
          window.open(resumeUrl, "_blank")
        } else {
          setResumeError("Resume file ID not found")
        }
      } else {
        window.open(resumePath, "_blank")
      }
    } catch (error) {
      console.error("Error opening resume:", error)
      setResumeError("Failed to open resume")
    } finally {
      setResumeLoading(false)
    }
  }

  // Calculate total work experience in years
  const calculateExperienceYears = () => {
    if (!experience || experience.length === 0) return 0

    let totalMonths = 0

    experience.forEach((exp) => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate)
        const end = exp.endDate === "Present" ? new Date() : new Date(exp.endDate)
        const diffTime = Math.abs(end - start)
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
        totalMonths += diffMonths
      }
    })

    return Math.round(totalMonths / 12)
  }

  const experienceYears = calculateExperienceYears()

  const getEducationSummary = () => {
    if (candidateType === "Internal") {
      // For internal candidates, education might be stored as JSON string
      if (typeof candidate.education === "string" && candidate.education.trim()) {
        try {
          const parsedEducation = JSON.parse(candidate.education)
          if (Array.isArray(parsedEducation) && parsedEducation.length > 0) {
            return parsedEducation
              .map(
                (edu) =>
                  `${edu.degree || "Degree"} in ${edu.fieldOfStudy || "Field"} from ${edu.institution || "Institution"}`,
              )
              .join(", ")
          }
        } catch (e) {
          // If parsing fails, return the raw string
          return candidate.education
        }
      } else if (Array.isArray(candidate.education) && candidate.education.length > 0) {
        return candidate.education
          .map(
            (edu) =>
              `${edu.degree || "Degree"} in ${edu.fieldOfStudy || "Field"} from ${edu.institution || "Institution"}`,
          )
          .join(", ")
      }
    } else {
      // For external candidates
      if (Array.isArray(education) && education.length > 0) {
        return education
          .map(
            (edu) =>
              `${edu.degree || "Degree"} in ${edu.fieldOfStudy || "Field"} from ${edu.institution || "Institution"}`,
          )
          .join(", ")
      }
    }
    return "No education listed"
  }

  const educationSummary = getEducationSummary()

  const getProjectsSummary = () => {
    if (candidateType === "Internal") {
      // Check if projects is stored as a string
      if (typeof candidate.projects === "string" && candidate.projects.trim()) {
        return candidate.projects
      } else if (Array.isArray(candidate.projects) && candidate.projects.length > 0) {
        return candidate.projects.map((proj) => proj.title || proj.name || proj).join(", ")
      }
    } else {
      // For external candidates
      if (Array.isArray(candidate.projects) && candidate.projects.length > 0) {
        return candidate.projects.map((proj) => proj.title || proj.name || proj).join(", ")
      }
    }
    return "No projects listed"
  }

  const projectsSummary = getProjectsSummary()

  const getAboutDescription = () => {
    if (candidateType === "Internal") {
      return candidate.about || candidate.description || "No description available"
    } else {
      return (
        candidate.personalInfo?.about ||
        candidate.personalInfo?.description ||
        candidate.about ||
        candidate.description ||
        "No description available"
      )
    }
  }

  const about = getAboutDescription()

  const statusChipColor = {
    "Available (default status)/ Active bench": "success",
    "Proposed to the client": "warning",
    "Interview in progress": "info",
    "Confirmed by the client": "primary",
    "Soft locked( to be confirmed by client)": "warning",
    "Deploying/Onboarding": "success",
    // Keep existing colors for backward compatibility
    completed: "success",
    "Under Review": "warning",
    hired: "primary",
    rejected: "error",
    INHECRATE: "error",
    Open: "success",
  }

  const handleViewProfile = () => {
    if (candidate._id) {
      router.push(`/?view=candidate-public-profile&id=${encodeURIComponent(candidate._id)}`)
    }
  }

  // Alternate row colors
  const rowColor = index % 2 === 0 ? "#f0f8ff" : "#e6f7ff"

  return (
    <>
      <TableRow hover sx={{ bgcolor: rowColor }}>
        <TableCell>
          <Button
            variant="contained"
            size="small"
            onClick={handleViewResume}
            disabled={!resumePath || resumeLoading}
            sx={{
              bgcolor: "#4f46e5",
              color: "white",
              "&:hover": {
                bgcolor: "#3f36d5",
              },
            }}
          >
            {resumeLoading ? <CircularProgress size={20} /> : "View Resume"}
          </Button>
          {resumeError && (
            <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
              {resumeError}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              src={!imageErrors.has(imageKey) ? photoPath : null}
              onError={() => handleImageError(imageKey)}
              sx={{ width: 40, height: 40, mr: 2 }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            {name}
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ maxWidth: 200, wordWrap: "break-word" }}>
            {about}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ maxWidth: 250, wordWrap: "break-word" }}>
            {educationSummary}
          </Typography>
        </TableCell>
        <TableCell>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 200 }}>
            {skills.map((skill, index) => (
              <Chip key={index} label={skill} size="small" />
            ))}
            {skills.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No skills listed
              </Typography>
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{experienceYears} years</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ maxWidth: 200, wordWrap: "break-word" }}>
            {projectsSummary}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip label={candidateType} color={candidateType === "Internal" ? "primary" : "secondary"} size="small" />
        </TableCell>
        <TableCell>
          <Chip label={status} color={statusChipColor[status] || "default"} size="small" />
        </TableCell>
        <TableCell>
          {candidateType === "Internal" && onDelete && (
            <IconButton
              onClick={() => onDelete(candidate._id, name)}
              color="error"
              size="small"
              title="Delete candidate"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    </>
  )
}

// --- Main Page Component ---
const CandidateSearchPage = () => {
  // --- Functionality (Hooks and State) ---
  const [isMounted, setIsMounted] = useState(false)
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState("table")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [deleteLoading, setDeleteLoading] = useState({})
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    const fetchCandidates = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("https://toc-bac-1.onrender.com/api/candidates/all-combined")
        if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`)
        const data = await response.json()
        const list = Array.isArray(data) ? data : data && Array.isArray(data.candidates) ? data.candidates : []

        setCandidates(list)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCandidates()
  }, [isMounted])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "candidateStatusUpdate") {
        const updateData = JSON.parse(e.newValue)
        setCandidates((prev) =>
          prev.map((candidate) =>
            candidate._id === updateData.candidateId
              ? { ...candidate, status: updateData.newStatus, profileStatus: updateData.newStatus }
              : candidate,
          ),
        )
        // Clear the storage item after processing
        localStorage.removeItem("candidateStatusUpdate")
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Also check for updates on component focus (for same-tab updates)
    const handleFocus = () => {
      const updateData = localStorage.getItem("candidateStatusUpdate")
      if (updateData) {
        const parsed = JSON.parse(updateData)
        setCandidates((prev) =>
          prev.map((candidate) =>
            candidate._id === parsed.candidateId
              ? { ...candidate, status: parsed.newStatus, profileStatus: parsed.newStatus }
              : candidate,
          ),
        )
        localStorage.removeItem("candidateStatusUpdate")
      }
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  const handleDeleteCandidate = async (candidateId, candidateName) => {
    if (!confirm(`Are you sure you want to delete ${candidateName}? This action cannot be undone.`)) {
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      alert("Authentication required. Please log in again.")
      return
    }

    setDeleteLoading((prev) => ({ ...prev, [candidateId]: true }))

    try {
      const response = await fetch(`https://toc-bac-1.onrender.com/api/internal-candidates/${candidateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete candidate")
      }

      // Remove from local state
      setCandidates((prev) => prev.filter((candidate) => candidate._id !== candidateId))
      alert("Candidate deleted successfully!")
    } catch (err) {
      console.error("Error deleting candidate:", err)
      alert("Failed to delete candidate. Please try again.")
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [candidateId]: false }))
    }
  }

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const cType = c.source === "internal" ? "Internal" : "External"

      const name =
        cType === "Internal"
          ? c.name || ""
          : (c.personalInfo ? `${c.personalInfo.firstName || ""} ${c.personalInfo.lastName || ""}`.trim() : c.name) ||
          ""

      const role = cType === "Internal" ? c.role || "" : c.experience?.[0]?.jobTitle || c.role || ""

      const skills = Array.isArray(c.skills) ? c.skills : []
      const cStatus = c.profileStatus || c.status || "Available (default status)/ Active bench"

      const term = searchTerm.toLowerCase()
      const matchesSearch =
        !term ||
        name.toLowerCase().includes(term) ||
        role.toLowerCase().includes(term) ||
        skills.some((s) => typeof s === "string" && s.toLowerCase().includes(term))
      const matchesStatus = statusFilter === "All" || cStatus === statusFilter
      const matchesType = typeFilter === "All" || cType === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })
  }, [candidates, searchTerm, statusFilter, typeFilter])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  if (!isMounted) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  // --- UI and Styling ---
  return (
    <ProtectedRoute>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: "flex" }}>
          <CssBaseline />
          <AppSidebar mobileOpen={mobileOpen} handleDrawerToggle={() => setMobileOpen(!mobileOpen)} />
          <Box
            component="main"
            sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
          >
            <AppBar
              position="fixed"
              elevation={0}
              sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                borderBottom: 1,
                borderColor: "divider",
                color: "text.primary",
              }}
            >
              <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box display="flex" alignItems="center">
                  <IconButton
                    color="inherit"
                    edge="start"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    sx={{ mr: 2, display: { sm: "none" } }}
                  >
                    <MenuIcon />
                  </IconButton>
                  <Typography variant="h6" noWrap>
                    Candidate Search
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2} position="relative">
                  <IconButton color="inherit" onClick={() => setUserMenuOpen((p) => !p)}>
                    <Settings />
                  </IconButton>
                  {userMenuOpen && (
                    <Box
                      sx={{
                        position: "absolute",
                        right: 0,
                        top: 48,
                        bgcolor: "white",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        boxShadow: 3,
                        minWidth: 220,
                      }}
                    >
                      <List dense sx={{ p: 0 }}>
                        <ListItem disablePadding>
                          <ListItemButton onClick={() => router.push("/?view=companyprofile")}>
                            <ListItemText primary="Profile" />
                          </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemButton onClick={() => router.push("/?view=applications-sent")}>
                            <ListItemText primary="Applications Sent" />
                          </ListItemButton>
                        </ListItem>
                        <ListItem disablePadding>
                          <ListItemButton onClick={() => router.push("/?view=applications-received")}>
                            <ListItemText primary="Applications Received" />
                          </ListItemButton>
                        </ListItem>
                        <Divider />
                        <ListItem disablePadding>
                          <ListItemButton
                            onClick={() => {
                              localStorage.removeItem("token")
                              router.push("/?view=employerlogin")
                            }}
                          >
                            <ListItemText primary="Logout" />
                          </ListItemButton>
                        </ListItem>
                      </List>
                    </Box>
                  )}
                </Box>
              </Toolbar>
            </AppBar>
            <Toolbar />

            <Card sx={{ p: 2, mb: 3, bgcolor: "#f0f8ff" }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search by name, role, or skill..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: <Search sx={{ mr: 1, color: "text.disabled" }} /> }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                      <MenuItem value="All">All Statuses</MenuItem>
                      {STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
                      <MenuItem value="All">All Types</MenuItem>
                      <MenuItem value="Internal">Internal</MenuItem>
                      <MenuItem value="External">External</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>View</InputLabel>
                    <Select value={viewMode} label="View" onChange={(e) => setViewMode(e.target.value)}>
                      <MenuItem value="table">Table View</MenuItem>
                      <MenuItem value="card">Card View</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Card>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">Failed to load candidates: {error}</Alert>
            ) : viewMode === "table" ? (
              <Paper sx={{ width: "100%", overflow: "hidden" }}>
                <TableContainer sx={{ maxHeight: 640 }}>
                  <Table stickyHeader aria-label="candidates table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>Resume</TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>
                          Profile Picture & Name
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>
                          About/Description
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>
                          Education
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>Skills</TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>
                          Experience (Years)
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>
                          Projects
                        </TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>Type</TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>Status</TableCell>
                        <TableCell sx={{ bgcolor: "#e6f7ff", fontWeight: "bold", fontSize: "1rem" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCandidates
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((candidate, index) => (
                          <CandidateTableRow
                            key={candidate._id || candidate.email}
                            candidate={candidate}
                            index={index}
                            onDelete={handleDeleteCandidate}
                          />
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredCandidates.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{ bgcolor: "#e6f7ff" }}
                />
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <Grid item xs={12} sm={6} md={4} key={candidate._id || candidate.email}>
                      {/* Your existing card view component would go here */}
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Box textAlign="center" mt={5}>
                      <Typography variant="h6" color="text.secondary">
                        No Candidates Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your candidate list is empty or the filters match no one.
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </Box>
      </ThemeProvider>
    </ProtectedRoute>
  )
}

export default CandidateSearchPage
