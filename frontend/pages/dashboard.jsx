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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput
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

const COLORS = ["#3b82f6", "#eab308", "#0d9488", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#10b981", "#6366f1", "#14b8a6"];

const AVAILABLE_YEARS = [
  "2018-19",
  "2019-20",
  "2020-21",
  "2021-22",
  "2022-23",
  "2023-24",
  "2024-25",
  "2025-26",
  "2026-27"
];

const glassTooltipStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.98)",
  borderRadius: "10px",
  border: "1px solid", borderColor: "divider",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: "600",
  color: "text.primary"
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedYears, setSelectedYears] = useState([]);

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
    themesFrequency: [],
    fundingAmountDistribution: [],
    agencyAmountDistribution: []
  });

  const [recentProjects, setRecentProjects] = useState([]);
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
  }, [selectedYears]);

  const loadDashboardData = async () => {
    try {
      const yearsParam = selectedYears.length > 0 ? `?years=${selectedYears.join(",")}` : "";
      const [summaryRes, chartsRes, projectsRes] = await Promise.all([
        axios.get(`http://localhost:5000/dashboard/summary${yearsParam}`),
        axios.get(`http://localhost:5000/dashboard/charts${yearsParam}`),
        axios.get("http://localhost:5000/projects?include_archived=false")
      ]);

      setSummary(summaryRes.data);
      setCharts(chartsRes.data);

      const projectsList = projectsRes.data.data || projectsRes.data || [];
      const sorted = [...projectsList].sort((a, b) => b.project_id - a.project_id);
      setRecentProjects(sorted.slice(0, 5));

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
      setDialogTitle('Registered Themes & Subthemes Taxonomy');
      setDialogOpen(true);
      setDialogLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/taxonomy");
        const list = res.data.data?.themes || res.data.themes || res.data.data || [];
        setDialogData(list);
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
      setDialogTitle('Budget Information');
      setDialogOpen(true);
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

  const formattedFundingAmountData = (charts.fundingAmountDistribution || []).map(d => ({
    name: d.source_name ? (d.source_name.length > 20 ? d.source_name.substring(0, 20) + "..." : d.source_name) : "Other",
    fullName: d.source_name || "Other",
    amount: d.amount ? Number(d.amount) : 0,
    amountInLakhs: d.amount ? Number(d.amount) / 100000 : 0
  }));

  const formattedAgencyAmountData = (charts.agencyAmountDistribution || []).map(d => ({
    name: d.agency_name ? (d.agency_name.length > 20 ? d.agency_name.substring(0, 20) + "..." : d.agency_name) : "Unknown",
    fullName: d.agency_name || "Unknown",
    amount: d.amount ? Number(d.amount) : 0,
    amountInLakhs: d.amount ? Number(d.amount) / 100000 : 0
  }));

  const renderFullscreenChart = () => {
    switch (fullscreenChart) {
      case 'theme':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedThemeData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
              <defs>
                <linearGradient id="themeGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
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
            <AreaChart data={charts.projectsByYear} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                innerRadius={80}
                outerRadius={130}
                paddingAngle={4}
                fill="#3b82f6"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                style={{ fontSize: "12px", fontWeight: "700" }}
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
                innerRadius={80}
                outerRadius={130}
                paddingAngle={5}
                fill="#10b981"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                style={{ fontSize: "12px", fontWeight: "700" }}
              >
                {(charts.projectsByStatus || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.classification_status === 'Completed' ? '#10b981' : '#eab308'} />
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
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="year" style={{ fontSize: "12px", fontWeight: "600", fill: "#475569" }} />
              <YAxis label={{ value: 'Rs. Lakhs', angle: -90, position: 'insideLeft', offset: 0 }} />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, "Turnover"]} />
              <Legend />
              <Area type="monotone" dataKey="turnoverInLakhs" name="Turnover (Lakhs)" stroke="#06b6d4" strokeWidth={3} fill="url(#turnoverGradFS)" activeDot={{ r: 8 }} />
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
      case 'fundingAmount':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedFundingAmountData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
              <defs>
                <linearGradient id="fundingAmountGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#db2777" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fontWeight: "500" }} interval={0} />
              <YAxis label={{ value: 'Rs. Lakhs', angle: -90, position: 'insideLeft', offset: 0 }} />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, props.payload.fullName]} />
              <Bar dataKey="amountInLakhs" fill="url(#fundingAmountGradFS)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'agencyAmount':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedAgencyAmountData} margin={{ top: 20, right: 20, left: 10, bottom: 85 }}>
              <defs>
                <linearGradient id="agencyAmountGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 11, fontWeight: "500" }} interval={0} />
              <YAxis label={{ value: 'Rs. Lakhs', angle: -90, position: 'insideLeft', offset: 0 }} />
              <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, props.payload.fullName]} />
              <Bar dataKey="amountInLakhs" fill="url(#agencyAmountGradFS)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "800", color: "text.primary", fontSize: "22px" }}>
            Dashboard Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontWeight: "500" }}>
            Operations Overview, Funding Distributions and AI Classification Statistics. Click on any card for details.
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 240, maxWidth: 320 }}>
          <InputLabel id="year-filter-label" sx={{ fontSize: "13px", fontWeight: "600" }}>Filter Financial Years</InputLabel>
          <Select
            labelId="year-filter-label"
            id="year-filter"
            multiple
            value={selectedYears}
            onChange={(e) => setSelectedYears(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            input={<OutlinedInput label="Filter Financial Years" sx={{ borderRadius: "10px", height: "42px", fontSize: "13px" }} />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" sx={{ fontSize: "11px", fontWeight: "600", bgcolor: "#f1f5f9" }} />
                ))}
              </Box>
            )}
            sx={{ borderRadius: "10px", height: "42px" }}
          >
            {AVAILABLE_YEARS.map((y) => (
              <MenuItem key={y} value={y} sx={{ fontSize: "13px" }}>
                <Checkbox size="small" checked={selectedYears.indexOf(y) > -1} sx={{ color: "#0d9488", "&.Mui-checked": { color: "#0d9488" } }} />
                <ListItemText primary={y} primaryTypographyProps={{ fontSize: '13px', fontWeight: '500' }} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Projects */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            onClick={() => handleKpiClick('projects')}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)",
              borderRadius: "16px",
              border: "1px solid", borderColor: "divider",
              borderLeft: "5px solid #2563eb",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              background: (theme) => theme.palette.mode === 'light' ? 'linear-gradient(135deg, #ffffff 0%, rgba(37, 99, 235, 0.01) 100%)' : 'linear-gradient(135deg, #111827 0%, rgba(37, 99, 235, 0.03) 100%)',
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 20px -5px rgba(37, 99, 235, 0.12)",
                borderColor: "#2563eb"
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "10px" }}>
                    Total Projects
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "850", color: (theme) => theme.palette.mode === 'light' ? '#1d4ed8' : '#60a5fa', mt: 1, fontSize: "28px", letterSpacing: "-0.5px" }}>
                    {summary.totalProjects}
                  </Typography>
                </Box>
                <Box sx={{
                  backgroundColor: "rgba(37, 99, 235, 0.08)",
                  color: "#2563eb",
                  p: 1.2,
                  borderRadius: "12px",
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            onClick={() => handleKpiClick('completed')}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)",
              borderRadius: "16px",
              border: "1px solid", borderColor: "divider",
              borderLeft: "5px solid #10b981",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              background: (theme) => theme.palette.mode === 'light' ? 'linear-gradient(135deg, #ffffff 0%, rgba(16, 185, 129, 0.01) 100%)' : 'linear-gradient(135deg, #111827 0%, rgba(16, 185, 129, 0.03) 100%)',
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 20px -5px rgba(16, 185, 129, 0.12)",
                borderColor: "#10b981"
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "10px" }}>
                    Completed
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "850", color: (theme) => theme.palette.mode === 'light' ? '#047857' : '#34d399', mt: 1, fontSize: "28px", letterSpacing: "-0.5px" }}>
                    {summary.completedProjects}
                  </Typography>
                </Box>
                <Box sx={{
                  backgroundColor: "rgba(16, 185, 129, 0.08)",
                  color: "#10b981",
                  p: 1.2,
                  borderRadius: "12px",
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            onClick={() => handleKpiClick('themes')}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)",
              borderRadius: "16px",
              border: "1px solid", borderColor: "divider",
              borderLeft: "5px solid #14b8a6",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              background: (theme) => theme.palette.mode === 'light' ? 'linear-gradient(135deg, #ffffff 0%, rgba(20, 180, 166, 0.01) 100%)' : 'linear-gradient(135deg, #111827 0%, rgba(20, 180, 166, 0.03) 100%)',
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 20px -5px rgba(20, 180, 166, 0.12)",
                borderColor: "#14b8a6"
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "10px" }}>
                    Total Themes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "850", color: (theme) => theme.palette.mode === 'light' ? '#0f766e' : '#2dd4bf', mt: 1, fontSize: "28px", letterSpacing: "-0.5px" }}>
                    {summary.totalThemes}
                  </Typography>
                </Box>
                <Box sx={{
                  backgroundColor: "rgba(20, 180, 166, 0.08)",
                  color: "#14b8a6",
                  p: 1.2,
                  borderRadius: "12px",
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            onClick={() => handleKpiClick('agencies')}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)",
              borderRadius: "16px",
              border: "1px solid", borderColor: "divider",
              borderLeft: "5px solid #8b5cf6",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              background: (theme) => theme.palette.mode === 'light' ? 'linear-gradient(135deg, #ffffff 0%, rgba(139, 92, 246, 0.01) 100%)' : 'linear-gradient(135deg, #111827 0%, rgba(139, 92, 246, 0.03) 100%)',
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 20px -5px rgba(139, 92, 246, 0.12)",
                borderColor: "#8b5cf6"
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "10px" }}>
                    Total Agencies
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "850", color: (theme) => theme.palette.mode === 'light' ? '#6d28d9' : '#a78bfa', mt: 1, fontSize: "28px", letterSpacing: "-0.5px" }}>
                    {summary.totalAgencies}
                  </Typography>
                </Box>
                <Box sx={{
                  backgroundColor: "rgba(139, 92, 246, 0.08)",
                  color: "#8b5cf6",
                  p: 1.2,
                  borderRadius: "12px",
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            onClick={() => handleKpiClick('manual')}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)",
              borderRadius: "16px",
              border: "1px solid", borderColor: "divider",
              borderLeft: "5px solid #6366f1",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              background: (theme) => theme.palette.mode === 'light' ? 'linear-gradient(135deg, #ffffff 0%, rgba(99, 102, 241, 0.01) 100%)' : 'linear-gradient(135deg, #111827 0%, rgba(99, 102, 241, 0.03) 100%)',
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 20px -5px rgba(99, 102, 241, 0.12)",
                borderColor: "#6366f1"
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "10px" }}>
                    Manual Classified
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "850", color: (theme) => theme.palette.mode === 'light' ? '#4f46e5' : '#818cf8', mt: 1, fontSize: "28px", letterSpacing: "-0.5px" }}>
                    {summary.manualClassifiedProjects || 0}
                  </Typography>
                </Box>
                <Box sx={{
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                  color: "#6366f1",
                  p: 1.2,
                  borderRadius: "12px",
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
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            onClick={() => handleKpiClick('sanctioned')}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)",
              borderRadius: "16px",
              border: "1px solid", borderColor: "divider",
              borderLeft: "5px solid #f59e0b",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              background: (theme) => theme.palette.mode === 'light' ? 'linear-gradient(135deg, #ffffff 0%, rgba(245, 158, 11, 0.01) 100%)' : 'linear-gradient(135deg, #111827 0%, rgba(245, 158, 11, 0.03) 100%)',
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 20px -5px rgba(245, 158, 11, 0.12)",
                borderColor: "#f59e0b"
              }
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "10px" }}>
                    Total Budget
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: "850", color: (theme) => theme.palette.mode === 'light' ? '#b45309' : '#fbbf24', mt: 1, fontSize: "24px", letterSpacing: "-0.5px" }}>
                    {formatCurrency(summary.totalSanctionedAmount)}
                  </Typography>
                </Box>
                <Box sx={{
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  color: "#f59e0b",
                  p: 1.2,
                  borderRadius: "12px",
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
        {/* ROW 1: Large Area Chart (Total Turnover) & Donut Chart (Classification Status) */}
        
        {/* Left: Total Turnover Every Year */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Total Turnover Every Year
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('turnover')} sx={{ color: "#0d9488" }}>
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
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" style={{ fontSize: "11px", fontWeight: "600", fill: "#64748b" }} />
                  <YAxis label={{ value: 'Rs. Lakhs', angle: -90, position: 'insideLeft', offset: -5 }} style={{ fontSize: "11px", fill: "#64748b" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, "Turnover"]} />
                  <Legend />
                  <Area type="monotone" dataKey="turnoverInLakhs" name="Turnover (Lakhs)" stroke="#06b6d4" strokeWidth={3} fill="url(#turnoverGrad)" activeDot={{ r: 8 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Right: Classification Status Distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Classification Status
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('status')} sx={{ color: "#0d9488" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.projectsByStatus || []}
                    dataKey="count"
                    nameKey="classification_status"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                    fill="#10b981"
                  >
                    {(charts.projectsByStatus || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.classification_status === 'Completed' ? '#10b981' : '#eab308'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={glassTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* ROW 2: Bar Chart (Primary Theme) & Donut Chart (States) & List Widget (Recent Projects) */}

        {/* Column 1: Projects by Primary Theme */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Primary Theme Distribution
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('theme')} sx={{ color: "#0d9488" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedThemeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                  barSize={16}
                >
                  <defs>
                    <linearGradient id="themeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 9, fontWeight: "500", fill: "#64748b" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#64748b" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="url(#themeGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Column 2: Geographical Distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Geographical Distribution
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('state')} sx={{ color: "#0d9488" }}>
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
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    fill="#3b82f6"
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

        {/* Column 3: Recent Activity (Dynamic Project List) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Recent Projects
              </Typography>
              <Button size="small" onClick={() => navigate('/projects')} sx={{ color: "#0d9488", fontWeight: "700", fontSize: "12px", textTransform: "none" }}>
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 2, height: 320, overflowY: "auto" }}>
              {recentProjects && recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <Box key={project.project_id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5, borderBottom: "1px solid #f1f5f9", "&:last-child": { borderBottom: 0 } }}>
                    <Box sx={{ maxWidth: "70%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "700", color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", fontSize: "13px" }}>
                        {project.agency_name || project.donor_agency_name || "Others"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280", display: "block", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", fontSize: "11px" }}>
                        {project.project_name || "Untitled Project"}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: "700", color: "#10b981", fontSize: "13px", whiteSpace: "nowrap" }}>
                      +₹{project.sanctioned_amount ? (project.sanctioned_amount / 100000).toFixed(1) : 0}L
                    </Typography>
                  </Box>
                ))
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#9ca3af" }}>
                  No recent projects found
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ROW 3: Large Area Chart (Projects by Financial Year) & Bar Chart (Funding Source) */}

        {/* Left: Projects By Financial Year */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Projects by Financial Year
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('year')} sx={{ color: "#0d9488" }}>
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
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" style={{ fontSize: "11px", fontWeight: "600", fill: "#64748b" }} />
                  <YAxis style={{ fontSize: "11px", fill: "#64748b" }} />
                  <Tooltip contentStyle={glassTooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="count" name="Projects Count" stroke="#2563eb" strokeWidth={3} fill="url(#yearGrad)" activeDot={{ r: 8 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Right: Funding Source Distribution */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Funding Source Distribution
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('funding')} sx={{ color: "#0d9488" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedFundingData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                  barSize={16}
                >
                  <defs>
                    <linearGradient id="fundingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 9, fontWeight: "500", fill: "#64748b" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#64748b" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="url(#fundingGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* ROW 4: Top Agencies & MIS Performance Stats */}

        {/* Column 1: Top Agencies */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Top 10 Agencies
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('agency')} sx={{ color: "#0d9488" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320, flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedAgencyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                  barSize={20}
                >
                  <defs>
                    <linearGradient id="agencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 9, fontWeight: "500", fill: "#64748b" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#64748b" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="url(#agencyGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Column 2: MIS Performance Stats */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                MIS Insights
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 3, justifyContent: "center", height: 320 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: "600" }}>Average Budget / Project</Typography>
                <Typography variant="body1" sx={{ color: "text.primary", fontWeight: "800" }}>
                  {summary.totalProjects > 0 ? formatCurrency(summary.totalSanctionedAmount / summary.totalProjects) : "Rs. 0"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: "600" }}>Taxonomy Themes Count</Typography>
                <Typography variant="body1" sx={{ color: "text.primary", fontWeight: "800" }}>8 Themes</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid #f1f5f9" }}>
                <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: "600" }}>Classification Progress</Typography>
                <Typography variant="body1" sx={{ color: "#0d9488", fontWeight: "800" }}>
                  {summary.totalProjects > 0 ? `${((summary.completedProjects / summary.totalProjects) * 100).toFixed(0)}%` : "0%"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5 }}>
                <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: "600" }}>Registered States</Typography>
                <Typography variant="body1" sx={{ color: "text.primary", fontWeight: "800" }}>
                  {charts.projectsByState ? charts.projectsByState.length : 0} States
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* ROW 5: Top Funding Agencies by Amount & Amount of Funding Source Distribution */}

        {/* Column 1: Top 10 Funding Agencies by Amount */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Top 10 Funding Agencies (by Sanctioned Amount)
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('agencyAmount')} sx={{ color: "#0d9488" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320, flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedAgencyAmountData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 65 }}
                  barSize={20}
                >
                  <defs>
                    <linearGradient id="agencyAmountGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 9, fontWeight: "500", fill: "#64748b" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#64748b" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, props.payload.fullName]} />
                  <Bar dataKey="amountInLakhs" fill="url(#agencyAmountGrad)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Column 2: Amount of Funding Source Distribution */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
          <Paper sx={{ p: 3, borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", border: "1px solid", borderColor: "divider", backgroundColor: "background.paper", width: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "700", color: "text.primary", fontSize: "15px" }}>
                Amount of Funding Source Distribution
              </Typography>
              <IconButton size="small" onClick={() => setFullscreenChart('fundingAmount')} sx={{ color: "#0d9488" }}>
                <FullscreenIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", height: 320, flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formattedFundingAmountData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 65 }}
                  barSize={20}
                >
                  <defs>
                    <linearGradient id="fundingAmountGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#db2777" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ angle: -45, textAnchor: 'end', fontSize: 9, fontWeight: "500", fill: "#64748b" }} interval={0} />
                  <YAxis style={{ fontSize: "11px", fill: "#64748b" }} />
                  <Tooltip contentStyle={glassTooltipStyle} formatter={(value, name, props) => [`Rs. ${Number((value * 100000).toFixed(0)).toLocaleString("en-IN")}`, props.payload.fullName]} />
                  <Bar dataKey="amountInLakhs" fill="url(#fundingAmountGrad)" radius={[4, 4, 0, 0]} />
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
        <DialogContent sx={{ mt: 2, maxHeight: "60vh", overflowX: "hidden" }}>
          {dialogLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {dialogType === 'agencies' && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px", overflowX: "hidden" }}>
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
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px", border: "1px solid", borderColor: "divider", overflowX: "hidden" }}>
                  <Table size="medium">
                    <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "700", width: "80px", color: "text.primary" }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: "700", width: "250px", color: "text.primary" }}>Primary Theme</TableCell>
                        <TableCell sx={{ fontWeight: "700", color: "text.primary" }}>Taxonomy Structure (Categories, Subcategories & Activities)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dialogData.map((theme) => (
                        <TableRow key={theme.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                          <TableCell sx={{ fontWeight: "600", color: "text.secondary", verticalAlign: "top", pt: 2 }}>{theme.id}</TableCell>
                          <TableCell sx={{ fontWeight: "700", color: (theme) => theme.palette.mode === 'light' ? '#0f766e' : '#2dd4bf', verticalAlign: "top", pt: 2 }}>{theme.name}</TableCell>
                          <TableCell sx={{ p: 2 }}>
                            {theme.categories && theme.categories.map((cat, cIdx) => (
                              <Box key={cIdx} sx={{ mb: cat.subCategories && cat.subCategories.length > 0 ? 2 : 0, pb: cIdx < theme.categories.length - 1 ? 2 : 0, borderBottom: cIdx < theme.categories.length - 1 ? "1px dashed #e2e8f0" : "none" }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: "700", color: "#1e293b", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                  <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#0d9488" }} />
                                  {cat.name}
                                </Typography>
                                <Box sx={{ pl: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                                  {cat.subCategories && cat.subCategories.map((sub, sIdx) => (
                                    <Box key={sIdx} sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: "600", color: "#475569", minWidth: "120px" }}>
                                        {sub.name} &rarr;
                                      </Typography>
                                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                        {sub.activities && sub.activities.map((act, aIdx) => (
                                          <Chip 
                                            key={aIdx} 
                                            label={act} 
                                            size="small" 
                                            sx={{ 
                                              fontSize: "10px", 
                                              bgcolor: "#f1f5f9", 
                                              color: "#475569", 
                                              border: "1px solid", borderColor: "divider",
                                              fontWeight: "500"
                                            }} 
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  ))}
                                </Box>
                              </Box>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {dialogType === 'projects-list' && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "8px", overflowX: "hidden" }}>
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
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "text.primary" }}>
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