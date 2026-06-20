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
    <Box sx={{ height: "100%", backgroundColor: "#0f172a", color: "#f8fafc" }}>
      <Toolbar style={{ backgroundColor: "#0b1329", color: "#f8fafc" }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: "bold", color: "#14b8a6" }}>
          Shrushti MIS
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: "#1e293b" }} />
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
                  backgroundColor: isActive ? "rgba(20, 184, 166, 0.15)" : "transparent",
                  color: isActive ? "#14b8a6" : "#94a3b8",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "#f8fafc"
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "#14b8a6" : "#64748b", minWidth: "40px" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? "bold" : "500",
                    color: isActive ? "#14b8a6" : "#94a3b8",
                    fontSize: "14px"
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
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
            Management Information System
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
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, backgroundColor: "#0f172a", borderRight: "1px solid #1e293b" }
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, backgroundColor: "#0f172a", borderRight: "1px solid #1e293b" }
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
