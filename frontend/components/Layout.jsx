import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  Badge,
  Menu,
  MenuItem
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  Category as CategoryIcon,
  AddBox as AddBoxIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  NotificationsNone as NotificationsIcon,
  DarkModeOutlined as DarkModeIcon,
  LightModeOutlined as LightModeIcon,
  AttachMoney as FinanceIcon,
  TableChart as TableChartIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import { useColorMode } from "../src/ThemeContext";
import api from "../services/api";

const drawerWidth = 240;

export default function Layout({ children }) {
  const { mode, toggleColorMode } = useColorMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
  const isPublicPath = publicPaths.includes(location.pathname);

  if (isPublicPath) {
    return <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>{children}</Box>;
  }

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.clear();
    api.post("/auth/logout").catch(() => {});
    navigate("/login");
    window.location.reload();
  };

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

  const financeMenuItems = [
    { text: "Finance Dashboard", icon: <FinanceIcon />, path: "/finance" },
    { text: "Finance Data Entry", icon: <TableChartIcon />, path: "/finance/entry" }
  ];

  const drawer = (
    <Box sx={{ height: "100%", backgroundColor: "background.paper", color: "text.primary", overflowX: "hidden", borderRight: "1px solid", borderColor: "divider" }}>
      <Toolbar style={{ padding: "12px 20px", display: "flex", gap: "12px", alignItems: "center" }}>
        <Box 
          component="img"
          src="/shrushti-logo.png"
          alt="Shrushti Logo"
          sx={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            objectFit: "contain",
            border: "1px solid #e2e8f0"
          }}
        />
        <Box>
          <Typography variant="body1" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: "900", color: "#0d9488", fontSize: "17px", lineHeight: "1.2", letterSpacing: "0.2px" }}>
            SHRUSHTI MIS
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: "'Inter', sans-serif", color: "#64748b", fontWeight: "600", fontSize: "10px", letterSpacing: "0.5px" }}>
            Management Portal
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: "divider" }} />
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
                  color: isActive ? "#0d9488" : "text.secondary",
                  "&:hover": {
                    backgroundColor: "rgba(13, 148, 136, 0.04)",
                    color: "text.primary"
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
      <Divider sx={{ borderColor: "divider" }} />
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: 1 }}>
          Finance
        </Typography>
      </Box>
      <List sx={{ p: 1.5, pt: 0.5 }}>
        {financeMenuItems.map((item) => {
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
                  backgroundColor: isActive ? "rgba(59, 130, 246, 0.08)" : "transparent",
                  color: isActive ? "#3b82f6" : "text.secondary",
                  "&:hover": { backgroundColor: "rgba(59, 130, 246, 0.04)", color: "text.primary" }
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "#3b82f6" : "#94a3b8", minWidth: "35px" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: isActive ? "700" : "600", fontSize: "13.5px" }}
                />
                {isActive && (
                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default", color: "text.primary" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${activeDrawerWidth}px)` },
          ml: { sm: `${activeDrawerWidth}px` },
          backgroundColor: "background.paper",
          boxShadow: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
          transition: "width 0.2s ease-in-out, margin-left 0.2s ease-in-out",
          color: "text.primary"
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: "text.secondary" }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h5" noWrap component="div" sx={{ fontFamily: "'Playfair Display', serif", fontWeight: "900", color: "#14b8a6", fontSize: { xs: "18px", sm: "24px" }, letterSpacing: "0.2px" }}>
              Management Information System
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton onClick={toggleColorMode} color="inherit" sx={{ color: mode === "light" ? "text.secondary" : "#eab308" }}>
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {user && (
              <>
                <IconButton onClick={handleMenuOpen} sx={{ p: 0, ml: 1 }}>
                  <Avatar
                    src={user.profilePhoto ? (user.profilePhoto.startsWith("http") ? user.profilePhoto : `http://localhost:5000${user.profilePhoto}`) : ""}
                    sx={{ bgcolor: "#0d9488", width: 36, height: 36, fontSize: "14px", fontWeight: "bold" }}
                  >
                    {user.fullName?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      width: 220,
                      borderRadius: "10px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
                    }
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold", color: "text.primary" }}>
                      {user.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                      {user.role}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => navigate("/profile")} sx={{ py: 1 }}>
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Account Settings" primaryTypographyProps={{ fontSize: "14px" }} />
                  </MenuItem>
                  <MenuItem onClick={handleLogout} sx={{ py: 1, color: "error.main" }}>
                    <ListItemIcon sx={{ color: "error.main" }}>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: "14px" }} />
                  </MenuItem>
                </Menu>
              </>
            )}
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
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, backgroundColor: "background.paper", borderRight: "1px solid", borderColor: "divider" }
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
              backgroundColor: "background.paper",
              borderRight: "1px solid",
              borderColor: "divider",
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
          flexDirection: "column",
          minWidth: 0
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
