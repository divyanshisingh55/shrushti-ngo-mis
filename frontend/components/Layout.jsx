import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  Category as CategoryIcon,
  AddBox as AddBoxIcon,
  Assessment as AssessmentIcon
} from "@mui/icons-material";

const drawerWidth = 240;

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Projects List", icon: <ListIcon />, path: "/projects" },
    { text: "Classify Queue", icon: <CategoryIcon />, path: "/classify-projects" },
    { text: "Add New Project", icon: <AddBoxIcon />, path: "/projects/add" },
    { text: "Reports & Export", icon: <AssessmentIcon />, path: "/reports" }
  ];

  const drawer = (
    <div>
      <Toolbar style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
          Shrushti NGO MIS
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ p: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: "8px",
                  backgroundColor: isActive ? "#e2e8f0" : "transparent",
                  "&:hover": {
                    backgroundColor: "#f1f5f9"
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "#0f172a" : "#64748b", minWidth: "40px" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive ? "bold" : "500",
                    color: isActive ? "#0f172a" : "#475569",
                    fontSize: "14px"
                  }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: "#0f172a",
          boxShadow: "none",
          borderBottom: "1px solid #1e293b"
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            NGO Management Information System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
