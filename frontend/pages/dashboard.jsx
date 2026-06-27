import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
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
  AreaChart,
  Area,
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
  Person as ManualIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Paid as PaidIcon
} from "@mui/icons-material";

const COLORS = ["#0f766e", "#eab308", "#2563eb", "#8b5cf6", "#10b981", "#f97316", "#06b6d4", "#ec4899", "#6366f1", "#14b8a6"];

const glassTooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "600",
  color: "#0f172a"
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    completedProjects: 0,
    totalThemes: 0,
    totalAgencies: 0,
    aiClassifiedProjects: 0,
    manualClassifiedProjects: 0,
    totalSanctionedAmount: 0
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

  // Modal / Dialog details
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState(""); // 'projects-list', 'agencies', 'themes', 'sanctioned'
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogData, setDialogData] = useState([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Full screen chart state
  const [fullscreenChart, setFullscreenChart] = useState(null); // 'theme', 'year', 'agency', 'state', 'status', 'funding', 'turnover', 'frequency'

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

  const formatCurrency = (amount) => {
    if (!amount) return "Rs. 0";
    if (amount >= 10000000) {
      return `Rs. ${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `Rs. ${(amount / 100000).toFixed(2)} Lakhs`;
  };

  const handleKpiClick = async (type) => {
    if (type === 'projects') {
      navigate('/projects');
    } else if (type === 'pending') {
      navigate('/classify-projects');
    } else if (type === 'completed') {
      navigate('/projects');
    } else if (type === 'agencies') {
      setDialogType('agencies');
      setDialogTitle('All Registered Agencies');
      setDialogLoading(true);
      setDialogOpen(true);
      try {
        const res = await axios.get("http://localhost:5000/agencies");
        setDialogData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setDialogLoading(false);
      }
    } else if (type === 'themes') {
      setDialogType('themes');
      setDialogTitle('All Registered Themes');
      setDialogLoading(type);
      setDialogOpen(true);
      setDialogLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/themes?all=true");
        setDialogData(res.data.data || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setDialogLoading(false);
      }
    } else if (type === 'ai') {
      setDialogType('projects-list');
      setDialogTitle('AI Classified Projects');
      setDialogLoading(true);
      setDialogOpen(true);
      try {
        const res = await axios.get("http://localhost:5000/projects?include_archived=false");
        const list = res.data.data || res.data;
        const filtered = list.filter(p => p.classification_status === 'Completed' && p.classification_method === 'AI');
        setDialogData(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setDialogLoading(false);
      }
    } else if (type === 'manual') {
      setDialogType('projects-list');
      setDialogTitle('Manually Classified Projects');
      setDialogLoading(true);
      setDialogOpen(true);
      try {
        const res = await axios.get("http://localhost:5000/projects?include_archived=false");
        const list = res.data.data || res.data;
        const filtered = list.filter(p => p.classification_status === 'Completed' && p.classification_method === 'Manual');
        setDialogData(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setDialogLoading(false);
      }
    } else if (type === 'sanctioned') {
      setDialogType('sanctioned');
      setDialogTitle('Total Sanctioned Amount Details');
      setDialogOpen(true);
      setDialogData([
        { label: 'Total Active Projects Budget', value: formatCurrency(summary.totalSanctionedAmount) },
        { label: 'Total Active Projects Count', value: summary.totalProjects }
      ]);
    }
  };

  const getFullscreenChartTitle = () => {
    switch (fullscreenChart) {
      case 'theme': return 'Projects by Primary Theme';
      case 'year': return 'Projects by Financial Year';
      case 'agency': return 'Top 10 Agencies';
      case 'state': return 'Geographical Distribution (States)';
      case 'status': return 'Classification Status Distribution';
      case 'funding': return 'Funding Source Distribution';
      case 'turnover': return 'Total Turnover Every Year';
      case 'frequency': return 'Theme Selection Frequencies';
      default: return '';
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
    turnoverInLakhs: d.turnover ? Number(d.turnover) / 100000 : 0
  }));

  const formattedFrequencyData = (charts.themesFrequency || []).map(d => ({
    name: d.theme_name ? (d.theme_name.length > 25 ? d.theme_name.substring(0, 25) + "..." : d.theme_name) : "Unclassified",
    fullName: d.theme_name || "Unclassified",
    count: d.count
  }));

  const renderFullscreenChart = () => {
    if (!fullscreenChart) return null;
    switch (fullscreenChart) {
      case 'theme':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedThemeData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
              <defs>
                <linearGradient id="themeGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fontWeight: "500" }} interval={0} />
              <YAxis />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
              <Bar dataKey="count" fill="url(#themeGradFS)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'year':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.projectsByYear} margin={{ top: 20, right: 35, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="yearGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" style={{ fontSize: "12px", fontWeight: "600", fill: "#475569" }} />
              <YAxis />
              <Tooltip contentStyle={glassTooltipStyle} />
              <Legend />
              <Area type="monotone" dataKey="count" name="Projects Count" stroke="#2563eb" strokeWidth={3} fill="url(#yearGradFS)" activeDot={{ r: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'agency':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedAgencyData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
              <defs>
                <linearGradient id="agencyGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fontWeight: "500" }} interval={0} />
              <YAxis />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
              <Bar dataKey="count" fill="url(#agencyGradFS)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'state':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={charts.projectsByState}
                dataKey="count"
                nameKey="state_name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={130}
                paddingAngle={3}
                fill="#3b82f6"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                style={{ fontSize: "12px", fontWeight: "600" }}
              >
                {charts.projectsByState.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={glassTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'status':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={charts.projectsByStatus || []}
                dataKey="count"
                nameKey="classification_status"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={130}
                paddingAngle={4}
                fill="#10b981"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                style={{ fontSize: "12px", fontWeight: "600" }}
              >
                {(charts.projectsByStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.classification_status === 'Completed' ? '#0f766e' : '#eab308'} />
                ))}
              </Pie>
              <Tooltip contentStyle={glassTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'funding':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedFundingData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
              <defs>
                <linearGradient id="fundingGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fontWeight: "500" }} interval={0} />
              <YAxis />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
              <Bar dataKey="count" fill="url(#fundingGradFS)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'turnover':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedTurnoverData} margin={{ top: 20, right: 35, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="turnoverGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" style={{ fontSize: "12px", fontWeight: "600", fill: "#475569" }} />
              <YAxis label={{ value: 'Rs. Lakhs', angle: -90, position: 'insideLeft', offset: 0 }} />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, "Turnover"]} />
              <Legend />
              <Area type="monotone" dataKey="turnoverInLakhs" name="Turnover (Lakhs)" stroke="#10b981" strokeWidth={3} fill="url(#turnoverGradFS)" activeDot={{ r: 8 }} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'frequency':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedFrequencyData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
              <defs>
                <linearGradient id="frequencyGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fontWeight: "500" }} interval={0} />
              <YAxis />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
              <Bar dataKey="count" fill="url(#frequencyGradFS)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#0f172a", mb: 1 }}>
          Dashboard Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748b" }}>
          Operations Overview, Funding Distributions and AI Classification Statistics. Click on any card for details.
        </Typography>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Projects */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            onClick={() => handleKpiClick('projects')}
            sx={{
              boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)",
              borderRadius: "12px",
              borderLeft: "6px solid #3b82f6",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
              },
              position: "relative",
              overflow: "visible"
            }}
          >
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



        {/* Completed Classification */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            onClick={() => handleKpiClick('completed')}
            sx={{
              boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)",
              borderRadius: "12px",
              borderLeft: "6px solid #10b981",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
              },
              position: "relative",
              overflow: "visible"
            }}
          >
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
          <Card
            onClick={() => handleKpiClick('themes')}
            sx={{
              boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)",
              borderRadius: "12px",
              borderLeft: "6px solid #14b8a6",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
              },
              position: "relative",
              overflow: "visible"
            }}
          >
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
          <Card
            onClick={() => handleKpiClick('agencies')}
            sx={{
              boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)",
              borderRadius: "12px",
              borderLeft: "6px solid #4f46e5",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
              },
              position: "relative",
              overflow: "visible"
            }}
          >
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



        {/* Manual Classified Projects */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            onClick={() => handleKpiClick('manual')}
            sx={{
              boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)",
              borderRadius: "12px",
              borderLeft: "6px solid #6366f1",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
              },
              position: "relative",
              overflow: "visible"
            }}
          >
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

        {/* Total Budget / Sanctioned Amount */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card
            onClick={() => handleKpiClick('sanctioned')}
            sx={{
              boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)",
              borderRadius: "12px",
              borderLeft: "6px solid #059669",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
              },
              position: "relative",
              overflow: "visible"
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
                    Total Budget
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: "800", color: "#0f172a", mt: 1, fontSize: "19px" }}>
                    {formatCurrency(summary.totalSanctionedAmount)}
                  </Typography>
                </Box>
                <Box sx={{
                  backgroundColor: "#d1fae5",
                  color: "#059669",
                  p: 1,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <PaidIcon fontSize="small" />
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
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Projects by Primary Theme
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('theme')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedThemeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <defs>
                    <linearGradient id="themeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10, fontWeight: "500", fill: "#475569" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#475569" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="url(#themeGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By Financial Year */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Projects by Financial Year
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('year')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={charts.projectsByYear}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" style={{ fontSize: "11px", fontWeight: "600", fill: "#475569" }} />
                  <YAxis style={{ fontSize: "11px", fill: "#475569" }} />
                  <Tooltip contentStyle={glassTooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="Projects Count" stroke="#2563eb" strokeWidth={3} fill="url(#yearGrad)" activeDot={{ r: 8 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By Top Agencies */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Top 10 Agencies
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('agency')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedAgencyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <defs>
                    <linearGradient id="agencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10, fontWeight: "500", fill: "#475569" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#475569" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="url(#agencyGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects By State */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Geographical Distribution (States)
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('state')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
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
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    fill="#3b82f6"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    style={{ fontSize: "10px", fontWeight: "600" }}
                  >
                    {charts.projectsByState.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={glassTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Projects by Classification Status (Pie Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Classification Status Distribution
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('status')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
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
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    fill="#10b981"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    style={{ fontSize: "10px", fontWeight: "600" }}
                  >
                    {(charts.projectsByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.classification_status === 'Completed' ? '#0f766e' : '#eab308'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={glassTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Funding Source Distribution (Bar Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Funding Source Distribution
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('funding')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedFundingData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <defs>
                    <linearGradient id="fundingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10, fontWeight: "500", fill: "#475569" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#475569" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="url(#fundingGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Total Turnover Every Year (Area Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Total Turnover Every Year
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('turnover')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={formattedTurnoverData}
                  margin={{ top: 10, right: 30, left: 15, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" style={{ fontSize: "11px", fontWeight: "600", fill: "#475569" }} />
                  <YAxis label={{ value: 'Rs. Lakhs', angle: -90, position: 'insideLeft', offset: -5 }} style={{ fontSize: "11px", fill: "#475569" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, "Turnover"]} />
                  <Legend />
                  <Area type="monotone" dataKey="turnoverInLakhs" name="Turnover (Lakhs)" stroke="#10b981" strokeWidth={3} fill="url(#turnoverGrad)" activeDot={{ r: 8 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Themes Frequencies (Bar Chart) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#0f172a", fontSize: "16px" }}>
                Theme Selection Frequencies
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('frequency')} sx={{ color: "#0f766e" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedFrequencyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <defs>
                    <linearGradient id="frequencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 10, fontWeight: "500", fill: "#475569" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#475569" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="url(#frequencyGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* KPI Details Modal Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: "#1e293b", borderBottom: "1px solid #e2e8f0", pb: 2 }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, maxHeight: "60vh" }}>
          {dialogLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {dialogType === 'agencies' && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Agency Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dialogData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} align="center">No agencies registered</TableCell>
                        </TableRow>
                      ) : (
                        dialogData.map((row) => (
                          <TableRow key={row.agency_id} hover>
                            <TableCell>{row.agency_id}</TableCell>
                            <TableCell sx={{ fontWeight: "600" }}>{row.agency_name}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {dialogType === 'themes' && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Theme Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dialogData.map((row) => (
                        <TableRow key={row.theme_id} hover>
                          <TableCell>{row.theme_id}</TableCell>
                          <TableCell sx={{ fontWeight: "600" }}>{row.theme_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {dialogType === 'projects-list' && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px" }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Project Name</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Financial Year</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Sanctioned Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dialogData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No projects found</TableCell>
                        </TableRow>
                      ) : (
                        dialogData.map((row) => (
                          <TableRow key={row.project_id} hover>
                            <TableCell>{row.project_id}</TableCell>
                            <TableCell sx={{ fontWeight: "600" }}>
                              <Link to={`/project/${row.project_id}`} style={{ textDecoration: "none", color: "#2563eb" }}>
                                {row.project_name}
                              </Link>
                            </TableCell>
                            <TableCell>{row.year}</TableCell>
                            <TableCell>{row.sanctioned_amount ? `Rs. ${Number(row.sanctioned_amount).toLocaleString("en-IN")}` : "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {dialogType === 'sanctioned' && (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <Paper sx={{ p: 3, textAlign: "center", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                        <Typography variant="subtitle1" sx={{ color: "#166534", fontWeight: "bold" }}>
                          Total Budget Allocation
                        </Typography>
                        <Typography variant="h4" sx={{ color: "#15803d", fontWeight: "800", mt: 1 }}>
                          {formatCurrency(summary.totalSanctionedAmount)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid size={12}>
                      <Typography variant="body1" sx={{ color: "#475569" }}>
                        This KPI card represents the sum of the total sanctioned amounts for all active projects (excluding archived projects) within the MIS database.
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Fullscreen Chart Dialog */}
      <Dialog
        fullWidth
        maxWidth="lg"
        open={!!fullscreenChart}
        onClose={() => setFullscreenChart(null)}
        PaperProps={{
          sx: { borderRadius: "16px", p: 1 }
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", pb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#0f172a" }}>
            {getFullscreenChartTitle()}
          </Typography>
          <IconButton onClick={() => setFullscreenChart(null)}>
            <FullscreenExitIcon fontSize="large" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ height: "70vh", minHeight: "500px", mt: 3, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {renderFullscreenChart()}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e2e8f0" }}>
          <Button onClick={() => setFullscreenChart(null)} variant="outlined">
            Close Fullscreen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}