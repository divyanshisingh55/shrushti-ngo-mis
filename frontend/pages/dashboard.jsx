import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  Divider,
  Paper
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  FolderSpecial as FolderIcon,
  HourglassEmpty as PendingIcon,
  CheckCircleOutlined as CompletedIcon,
  Category as ThemesIcon,
  Business as AgenciesIcon
} from "@mui/icons-material";

const COLORS = ["#1abc9c", "#3498db", "#9b59b6", "#e67e22", "#e74c3c", "#2ecc71", "#34495e", "#16a085", "#2980b9", "#8e44ad"];

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    completedProjects: 0,
    totalThemes: 0,
    totalAgencies: 0
  });

  const [charts, setCharts] = useState({
    projectsByTheme: [],
    projectsByYear: [],
    projectsByAgency: [],
    projectsByState: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, chartsRes] = await Promise.all([
        axios.get("http://localhost:5000/dashboard/summary"),
        axios.get("http://localhost:5000/dashboard/charts")
      ]);

      setSummary(summaryRes.data);
      setCharts(chartsRes.data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  // Format agency and theme charts to handle long names cleanly
  const formattedThemeData = charts.projectsByTheme.map(d => ({
    name: d.theme_name ? (d.theme_name.length > 25 ? d.theme_name.substring(0, 25) + "..." : d.theme_name) : "Unclassified",
    fullName: d.theme_name || "Unclassified",
    count: d.count
  }));

  const formattedAgencyData = charts.projectsByAgency.map(d => ({
    name: d.agency_name ? (d.agency_name.length > 20 ? d.agency_name.substring(0, 20) + "..." : d.agency_name) : "Unknown",
    fullName: d.agency_name || "Unknown",
    count: d.count
  }));

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}>
          Dashboard Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Operations Overview and Project Classification Statistics.
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Projects */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #3b82f6",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "11px" }}>
                    Total Projects
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.totalProjects}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#dbeafe", 
                  color: "#3b82f6", 
                  p: 1.5, 
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <FolderIcon fontSize="medium" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Classification */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #f59e0b",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "11px" }}>
                    Pending Classify
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.pendingProjects}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#fef3c7", 
                  color: "#f59e0b", 
                  p: 1.5, 
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <PendingIcon fontSize="medium" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Classification */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #10b981",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "11px" }}>
                    Completed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.completedProjects}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#d1fae5", 
                  color: "#10b981", 
                  p: 1.5, 
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <CompletedIcon fontSize="medium" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Themes */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #14b8a6",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "11px" }}>
                    Total Themes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.totalThemes}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#ccfbf1", 
                  color: "#14b8a6", 
                  p: 1.5, 
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <ThemesIcon fontSize="medium" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Agencies */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #4f46e5",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "11px" }}>
                    Total Agencies
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.totalAgencies}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#e0e7ff", 
                  color: "#4f46e5", 
                  p: 1.5, 
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <AgenciesIcon fontSize="medium" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recharts Sections Grid */}
      <Grid container spacing={3}>
        {/* Projects By Primary Theme */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Projects by Primary Theme
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={formattedThemeData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By Financial Year */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Projects by Financial Year
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart
                  data={charts.projectsByYear}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" style={{ fontSize: "11px" }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Projects Count" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By Top Agencies */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Top 10 Agencies
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={formattedAgencyData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By State */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Geographical Distribution (States)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={charts.projectsByState}
                    dataKey="count"
                    nameKey="state_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#3b82f6"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    style={{ fontSize: "11px", fontWeight: "600" }}
                  >
                    {charts.projectsByState.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}