"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Typography, CircularProgress, Alert, Paper, Grid, Avatar, Chip, Divider } from '@mui/material';
import { Email, Phone, LocationOn, Work, School, Code, Assignment } from '@mui/icons-material';

const Section = ({ title, icon, children }) => (
    <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            {icon}
            <Typography variant="h5" sx={{ fontWeight: '600' }}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
    </Box>
);

const PublicProfile = () => {
    const searchParams = useSearchParams();
    const candidateId = searchParams.get('id');
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!candidateId) {
            setError('No candidate ID provided in the URL.');
            setLoading(false);
            return;
        }

        const fetchCandidate = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`https://toc-bac-1.onrender.com/api/candidates/profile/${candidateId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch data. Status: ${response.status}`);
                }
                const data = await response.json();
                setCandidate(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCandidate();
    }, [candidateId]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress size={50} /></Box>;
    }

    if (error) {
        return <Box sx={{ p: 4 }}><Alert severity="error">Error: {error}</Alert></Box>;
    }

    if (!candidate) {
        return <Box sx={{ p: 4 }}><Alert severity="warning">Could not find candidate data.</Alert></Box>;
    }

    const personalInfo = candidate.personalInfo || {
        firstName: candidate.name?.split(' ')[0] || '',
        lastName: candidate.name?.split(' ').slice(1).join(' ') || '',
        email: candidate.email,
        mobile: candidate.phone,
        profilePhoto: candidate.profilePhoto,
        location: candidate.location,
    };
    const experience = candidate.experience || [];
    const education = candidate.education || [];
    const skills = candidate.skills || [];
    const projects = candidate.projects || [];
    const role = experience[0]?.jobTitle || candidate.role || 'Role not specified';
    const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: '#f3f4f6', minHeight: '100vh' }}>
            <Paper elevation={2} sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, borderRadius: '12px' }}>
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Avatar
                            src={personalInfo.profilePhoto?.path}
                            sx={{ width: 160, height: 160, mx: 'auto', mb: 2, fontSize: '4rem', bgcolor: 'secondary.main' }}
                        >
                            {personalInfo.firstName?.charAt(0)}{personalInfo.lastName?.charAt(0)}
                        </Avatar>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {fullName}
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            {role}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            {personalInfo.email && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Email color="action" /><Typography variant="body1">{personalInfo.email}</Typography></Box>}
                            {personalInfo.mobile && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Phone color="action" /><Typography variant="body1">{personalInfo.mobile}</Typography></Box>}
                            {personalInfo.location && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LocationOn color="action" /><Typography variant="body1">{personalInfo.location}</Typography></Box>}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Section title="Skills" icon={<Code color="primary" />}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {skills.length > 0 ? skills.map((skill, i) => <Chip key={i} label={skill} variant="outlined" />) : <Typography>No skills listed.</Typography>}
                            </Box>
                        </Section>

                        <Section title="Work Experience" icon={<Work color="primary" />}>
                            {experience.length > 0 ? experience.map((exp, i) => (
                                <Box key={i} sx={{ mb: i < experience.length - 1 ? 3 : 0 }}>
                                    <Typography variant="h6">{exp.jobTitle}</Typography>
                                    <Typography variant="subtitle1" color="text.secondary">{exp.employer} ({exp.startDate} - {exp.endDate || 'Present'})</Typography>
                                    <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{exp.experienceSummary}</Typography>
                                </Box>
                            )) : <Typography>No experience details found.</Typography>}
                        </Section>

                        <Section title="Education" icon={<School color="primary" />}>
                            {education.length > 0 ? education.map((edu, i) => (
                                <Box key={i} sx={{ mb: i < education.length - 1 ? 2 : 0 }}>
                                    <Typography variant="h6">{edu.degree}</Typography>
                                    <Typography variant="subtitle1" color="text.secondary">{edu.university} ({edu.startYear} - {edu.endYear})</Typography>
                                </Box>
                            )) : <Typography>No education details found.</Typography>}
                        </Section>

                        <Section title="Projects" icon={<Assignment color="primary" />}>
                            {projects.length > 0 ? projects.map((proj, i) => (
                                <Box key={i} sx={{ mb: i < projects.length - 1 ? 3 : 0 }}>
                                    <Typography variant="h6">{proj.projectName}</Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{proj.description}</Typography>
                                    {proj.keySkills && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}><b>Skills:</b> {proj.keySkills}</Typography>}
                                </Box>
                            )) : <Typography>No projects listed.</Typography>}
                        </Section>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default PublicProfile;
