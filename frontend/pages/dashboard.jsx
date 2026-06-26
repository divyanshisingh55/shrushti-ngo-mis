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
  Business as AgenciesIcon,
  SmartToy as AiIcon,
  Person as ManualIcon
} from "@mui/icons-material";

const COLORS = ["#1abc9c", "#3498db", "#9b59b6", "#e67e22", "#e74c3c", "#2ecc71", "#34495e", "#16a085", "#2980b9", "#8e44ad"];

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    completedProjects: 0,
    totalThemes: 0,
    totalAgencies: 0,
    aiClassifiedProjects: 0,
    manualClassifiedProjects: 0
  });

  const [charts, setCharts] = useState({
    projectsByTheme: [],
    projectsByYear: [],
    projectsByAgency: [],
    projectsByState: [],
    projectsByStatus: [],
    fundingSourceDistribution: [],
    turnoverByYear: [],
    themesFrequency: []
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

  // Format agency, theme, and funding charts to handle long names cleanly
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

  const formattedFundingData = (charts.fundingSourceDistribution || []).map(d => ({
    name: d.source_name ? (d.source_name.length > 20 ? d.source_name.substring(0, 20) + "..." : d.source_name) : "Other",
    fullName: d.source_name || "Other",
    count: d.count
  }));

  const formattedTurnoverData = (charts.turnoverByYear || []).map(d => ({
    year: d.year || "Unknown",
    turnover: d.turnover ? Number(d.turnover) : 0,
    turnoverInLakhs: d.turnover ? Number(d.turnover) / 100000 : 0 // Rs. 1 Lakh = 100,000
  }));

  const formattedFrequencyData = (charts.themesFrequency || []).map(d => ({
    name: d.theme_name ? (d.theme_name.length > 25 ? d.theme_name.substring(0, 25) + "..." : d.theme_name) : "Unclassified",
    fullName: d.theme_name || "Unclassified",
    count: d.count
  }));

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}>
          Dashboard Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Operations Overview, Funding Distributions and AI Classification Statistics.
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Projects */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #3b82f6",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    Total Projects
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.totalProjects}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#dbeafe", 
                  color: "#3b82f6", 
                  p: 1, 
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <FolderIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Classification */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #f59e0b",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    Pending
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.pendingProjects}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#fef3c7", 
                  color: "#f59e0b", 
                  p: 1, 
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <PendingIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Classification */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #10b981",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    Completed
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.completedProjects}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#d1fae5", 
                  color: "#10b981", 
                  p: 1, 
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <CompletedIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Themes */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #14b8a6",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    Total Themes
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.totalThemes}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#ccfbf1", 
                  color: "#14b8a6", 
                  p: 1, 
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <ThemesIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Agencies */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #4f46e5",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    Total Agencies
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.totalAgencies}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#e0e7ff", 
                  color: "#4f46e5", 
                  p: 1, 
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <AgenciesIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Classified Projects */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #8b5cf6",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    AI Classified
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.aiClassifiedProjects || 0}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#f5f3ff", 
                  color: "#8b5cf6", 
                  p: 1, 
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <AiIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Manual Classified Projects */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card sx={{ 
            boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", 
            borderRadius: "12px", 
            borderLeft: "6px solid #6366f1",
            position: "relative",
            overflow: "visible"
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    Manual Classified
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1 }}>
                    {summary.manualClassifiedProjects || 0}
                  </Typography>
                </Box>
                <Box sx={{ 
                  backgroundColor: "#e0e7ff", 
                  color: "#6366f1", 
                  p: 1, 
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <ManualIcon fontSize="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recharts Sections Grid */}
      <Grid container spacing={3}>
        {/* Projects By Primary Theme */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Projects by Primary Theme
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedThemeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10 }} interval={0} />
                  <YAxis style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By Financial Year */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Projects by Financial Year
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.projectsByYear}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
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
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Top 10 Agencies
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedAgencyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10 }} interval={0} />
                  <YAxis style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By State */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Geographical Distribution (States)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
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

        {/* Projects by Classification Status (Pie Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Classification Status Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.projectsByStatus || []}
                    dataKey="count"
                    nameKey="classification_status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    fill="#10b981"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    style={{ fontSize: "11px", fontWeight: "600" }}
                  >
                    {(charts.projectsByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.classification_status === 'Completed' ? '#10b981' : '#f59e0b'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Funding Source Distribution (Bar Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Funding Source Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedFundingData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10 }} interval={0} />
                  <YAxis style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Total Turnover Every Year (Line Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Total Turnover Every Year
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formattedTurnoverData}
                  margin={{ top: 10, right: 30, left: 15, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" style={{ fontSize: "11px" }} />
                  <YAxis label={{ value: 'Rs. Lakhs', angle: -90, position: 'insideLeft', offset: -5 }} style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, "Turnover"]} />
                  <Legend />
                  <Line type="monotone" dataKey="turnoverInLakhs" name="Turnover (Lakhs)" stroke="#e11d48" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Themes Frequencies (Bar Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b" }}>
              Theme Selection Frequencies
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedFrequencyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10 }} interval={0} />
                  <YAxis style={{ fontSize: "11px" }} />
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}