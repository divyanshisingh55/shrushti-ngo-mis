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
  IconButton,
  Avatar,
  Badge
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  Category as CategoryIcon,
  AddBox as AddBoxIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  NotificationsNone as NotificationsIcon
} from "@mui/icons-material";

const drawerWidth = 240;

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    if (window.innerWidth < 600) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const activeDrawerWidth = isCollapsed ? 0 : drawerWidth;

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Projects List", icon: <ListIcon />, path: "/projects" },
    { text: "Classify Queue", icon: <CategoryIcon />, path: "/classify-projects" },
    { text: "Add New Project", icon: <AddBoxIcon />, path: "/projects/add" }
  ];

  const drawer = (
    <Box sx={{ height: "100%", backgroundColor: "#ffffff", color: "#0f172a", overflowX: "hidden", borderRight: "1px solid #f1f5f9" }}>
      <Toolbar style={{ backgroundColor: "#ffffff", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "center" }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: "8px",
          backgroundColor: "#0d9488",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#ffffff"
        }}>
          <AssessmentIcon fontSize="small" />
        </Box>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", lineHeight: "1.2" }}>
            Shrushti MIS
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", fontWeight: "500", fontSize: "10px" }}>
            Management Portal
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "#f1f5f9" }} />
      <List sx={{ p: 1.5 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: "10px",
                  py: 1, px: 2,
                  backgroundColor: isActive ? "rgba(13, 148, 136, 0.08)" : "transparent",
                  color: isActive ? "#0d9488" : "#64748b",
                  "&:hover": {
                    backgroundColor: "rgba(13, 148, 136, 0.04)",
                    color: "#0f172a"
                  }
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "#0d9488" : "#94a3b8", minWidth: "35px" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? "700" : "600",
                    fontSize: "13.5px"
                  }}
                />
                {isActive && (
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#0d9488" }} />
                )}
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
          width: { sm: `calc(100% - ${activeDrawerWidth}px)` },
          ml: { sm: `${activeDrawerWidth}px` },
          backgroundColor: "#ffffff",
          boxShadow: "none",
          borderBottom: "1px solid #f1f5f9",
          transition: "width 0.2s ease-in-out, margin-left 0.2s ease-in-out",
          color: "#0f172a"
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: "#64748b" }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: "700", color: "#0f172a", fontSize: "16px" }}>
              Management Information System
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton sx={{ color: "#64748b" }}>
              <SearchIcon fontSize="small" />
            </IconButton>
            <IconButton sx={{ color: "#64748b" }}>
              <Badge color="error" variant="dot">
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { sm: activeDrawerWidth },
          flexShrink: { sm: 0 },
          transition: "width 0.2s ease-in-out"
        }}
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
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, backgroundColor: "#ffffff", borderRight: "1px solid #f1f5f9" }
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: isCollapsed ? "none" : { xs: "none", sm: "block" },
            width: activeDrawerWidth,
            transition: "width 0.2s ease-in-out",
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: activeDrawerWidth,
              backgroundColor: "#ffffff",
              borderRight: "1px solid #f1f5f9",
              transition: "width 0.2s ease-in-out",
              overflowX: "hidden"
            }
          }}
          open={!isCollapsed}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${activeDrawerWidth}px)` },
          transition: "width 0.2s ease-in-out, margin-left 0.2s ease-in-out",
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
