"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Box, AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, CssBaseline, Avatar, Divider
} from '@mui/material';
import {
    Menu as MenuIcon, Dashboard, Work, People, Article, Business, Settings, Logout
} from '@mui/icons-material';

const drawerWidth = 240;

const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: <Dashboard /> },
    { name: "Post a Job", href: "/post-job", icon: <Work /> },
    { name: "Received Applications", href: "/applications", icon: <People /> },
    { name: "My Applications", href: "/my-applications", icon: <Article /> },
    { name: "Company Profile", href: "/profile", icon: <Business /> },
];

const SharedLayout = ({ children, pageTitle }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawerContent = (
        <div>
            <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
                <Typography variant="h6" noWrap component="div" sx={{ color: '#fff' }}>
                    TalentCloud
                </Typography>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <List>
                {navLinks.map((item) => (
                    <ListItem key={item.name} disablePadding>
                        <ListItemButton
                            component={Link}
                            href={item.href}
                            selected={pathname === item.href}
                            sx={{
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    '&:hover': { backgroundColor: 'primary.dark' },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.name} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ flexGrow: 1 }} />
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <List>
                <ListItem disablePadding>
                    <ListItemButton component={Link} href="/settings">
                        <ListItemIcon sx={{ color: 'inherit' }}><Settings /></ListItemIcon>
                        <ListItemText primary="Settings" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton>
                        <ListItemIcon sx={{ color: 'inherit' }}><Logout /></ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItemButton>
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {pageTitle}
                    </Typography>
                    <Avatar alt="User Avatar" src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                aria-label="mailbox folders"
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#1f2937', color: '#fff' },
                    }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#1f2937', color: '#fff' },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
};

export default SharedLayout;
