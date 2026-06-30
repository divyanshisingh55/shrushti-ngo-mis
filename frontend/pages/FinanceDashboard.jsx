import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardContent, Divider,
  CircularProgress, Alert, Button, Chip, ToggleButton,
  ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  VolunteerActivism as VolunteerIcon,
  ShowChart as ShowChartIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from "@mui/icons-material";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const API = "http://localhost:5000/finance";

const COLORS = ["#0d9488", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const formatCrore = (val) => {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const formatShort = (val) => {
  if (!val && val !== 0) return "0";
  const n = Number(val);
  if (Math.abs(n) >= 1e7) return `${(n / 1e7).toFixed(1)}Cr`;
  if (Math.abs(n) >= 1e5) return `${(n / 1e5).toFixed(1)}L`;
  return n.toLocaleString("en-IN");
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: "background.paper", border: "1px solid", borderColor: "divider",
        borderRadius: 2, p: 1.5, boxShadow: 4, minWidth: 180
      }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5 }}>
          FY {label}
        </Typography>
        {payload.map((p, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.25 }}>
            <Typography variant="caption" sx={{ color: p.color, fontWeight: 600 }}>{p.name}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatCrore(p.value)}</Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

const KPICard = ({ title, value, subtitle, icon, color, trend, trendVal, onClick }) => (
  <Card elevation={0} onClick={onClick} sx={{
    border: "1px solid", borderColor: "divider", borderRadius: 3,
    background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
    transition: "all 0.2s",
    cursor: onClick ? "pointer" : "default",
    "&:hover": {
      boxShadow: onClick ? 4 : 0,
      transform: onClick ? "translateY(-2px)" : "none",
      borderColor: onClick ? color : "divider"
    }
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", fontSize: "11px" }}>
            {title}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color, mt: 0.5, lineHeight: 1.2 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {subtitle}
            </Typography>
          )}
          {trendVal !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
              {trend === "up" ? <ArrowUpIcon sx={{ fontSize: 14, color: "#22c55e" }} /> : <ArrowDownIcon sx={{ fontSize: 14, color: "#ef4444" }} />}
              <Typography variant="caption" sx={{ color: trend === "up" ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                {trendVal} vs prev year
              </Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ bgcolor: `${color}15`, borderRadius: 2, p: 1.2, display: "flex" }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartView, setChartView] = useState("all");
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [fullscreenChart, setFullscreenChart] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogType, setDetailsDialogType] = useState("");
  const [detailsDialogTitle, setDetailsDialogTitle] = useState("");

  const getFullscreenChartTitle = () => {
    switch (fullscreenChart) {
      case 'income_vs_exp': return 'Income vs Expenditure (Annual)';
      case 'surplus': return 'Annual Surplus / Deficit';
      case 'grants_cat': return 'Grants Received by Category (Annual)';
      case 'grants_source': return 'Grant Received — Source Breakdown (All Years)';
      case 'gia_source': return 'Grant in Aid — Source Breakdown';
      case 'balance_sheet': return 'Balance Sheet — Assets, Liabilities & Networth';
      case 'turnover_trend': return 'Annual Turnover Trend (1998–2025)';
      default: return '';
    }
  };

  const handleKpiClick = (type) => {
    setDetailsDialogType(type);
    let title = "";
    if (type === 'income') title = "Breakdown of Income vs Expenditure";
    else if (type === 'networth') title = "Breakdown of Networth and Assets";
    else if (type === 'grants') title = "Breakdown of Grants Received";
    else if (type === 'surplus') title = "Breakdown of Annual Surplus";
    setDetailsDialogTitle(title);
    setDetailsDialogOpen(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setRecords(res.data);
    } catch (err) {
      setError("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  };

  const allYears = useMemo(() => records.map(r => r.year), [records]);

  const filteredRecords = useMemo(() => {
    if (!fromYear && !toYear) return records;
    return records.filter(r => {
      const y = r.year;
      if (fromYear && y < fromYear) return false;
      if (toYear && y > toYear) return false;
      return true;
    });
  }, [records, fromYear, toYear]);

  const latestRecord = useMemo(() => {
    return filteredRecords[filteredRecords.length - 1];
  }, [filteredRecords]);

  const prevRecord = useMemo(() => {
    return filteredRecords[filteredRecords.length - 2];
  }, [filteredRecords]);

  const kpiTrend = (field) => {
    if (!latestRecord) return {};
    let prev = undefined;
    if (prevRecord) {
      prev = Number(prevRecord[field]);
    } else {
      const idx = records.findIndex(r => r.year === latestRecord.year);
      if (idx > 0) {
        prev = Number(records[idx - 1][field]);
      }
    }
    const curr = Number(latestRecord[field]);
    if (prev === undefined || isNaN(prev)) return {};
    const diff = curr - prev;
    const pct = prev !== 0 ? ((diff / Math.abs(prev)) * 100).toFixed(1) : "N/A";
    return { trend: diff >= 0 ? "up" : "down", trendVal: `${pct}%` };
  };

  // Aggregate totals
  const totals = useMemo(() => ({
    income: filteredRecords.reduce((s, r) => s + Number(r.income || 0), 0),
    expenditure: filteredRecords.reduce((s, r) => s + Number(r.expenditure || 0), 0),
    surplus: filteredRecords.reduce((s, r) => s + Number(r.surplus || 0), 0),
    grantReceived: filteredRecords.reduce((s, r) => s + Number(r.grant_received_total || 0), 0),
  }), [filteredRecords]);

  // Grant breakdown for pie
  const grantBreakdown = useMemo(() => {
    const govt = records.reduce((s, r) => s + Number(r.grant_received_govt || 0), 0);
    const csr = records.reduce((s, r) => s + Number(r.grant_received_csr || 0), 0);
    const fa = records.reduce((s, r) => s + Number(r.grant_received_funding_agency || 0), 0);
    const fcra = records.reduce((s, r) => s + Number(r.grant_received_fcra || 0), 0);
    return [
      { name: "Government", value: govt },
      { name: "CSR", value: csr },
      { name: "Funding Agency", value: fa },
      { name: "FCRA", value: fcra },
    ].filter(d => d.value > 0);
  }, [records]);

  // Grant in Aid breakdown for pie
  const giaBreakdown = useMemo(() => {
    const govt = records.reduce((s, r) => s + Number(r.grant_in_aid_govt || 0), 0);
    const csr = records.reduce((s, r) => s + Number(r.grant_in_aid_csr || 0), 0);
    const fa = records.reduce((s, r) => s + Number(r.grant_in_aid_funding_agency || 0), 0);
    const fcra = records.reduce((s, r) => s + Number(r.grant_in_aid_fcra || 0), 0);
    return [
      { name: "Government", value: govt },
      { name: "CSR", value: csr },
      { name: "Funding Agency", value: fa },
      { name: "FCRA", value: fcra },
    ].filter(d => d.value > 0);
  }, [records]);

  // Chart data
  const chartData = filteredRecords.map(r => ({
    year: r.year,
    Income: Number(r.income || 0),
    Expenditure: Number(r.expenditure || 0),
    Surplus: Number(r.surplus || 0),
    Turnover: Number(r.turnover || 0),
    "Total Assets": Number(r.total_assets || 0),
    Networth: Number(r.networth || 0),
    "Grant Received": Number(r.grant_received_total || 0),
    "Grant in Aid": Number(r.grant_in_aid_total || 0),
  }));

  // Recent 10 years for radar (normalized)
  const recentRecords = records.slice(-10);
  const maxIncome = Math.max(...recentRecords.map(r => Number(r.income || 0)));
  const radarData = recentRecords.map(r => ({
    year: r.year,
    Income: maxIncome > 0 ? ((Number(r.income) / maxIncome) * 100).toFixed(1) : 0,
    Networth: Number(r.networth || 0),
    Surplus: Number(r.surplus || 0),
  }));

  const renderFullscreenChart = () => {
    switch (fullscreenChart) {
      case 'income_vs_exp':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="incomeGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area type="monotone" dataKey="Income" stroke="#0d9488" fill="url(#incomeGradFS)" strokeWidth={3} dot={false} />
              <Area type="monotone" dataKey="Expenditure" stroke="#ef4444" fill="url(#expGradFS)" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'surplus':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatShort} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Surplus" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.Surplus >= 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'grants_cat':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Grant Received" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Grant in Aid" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'grants_source':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={grantBreakdown} cx="50%" cy="50%" outerRadius={150} innerRadius={70}
                dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                style={{ fontSize: "14px", fontWeight: "700" }}
              >
                {grantBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCrore(v)} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'gia_source':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={giaBreakdown} cx="50%" cy="50%" outerRadius={150} innerRadius={70}
                dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                style={{ fontSize: "14px", fontWeight: "700" }}
              >
                {giaBreakdown.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCrore(v)} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'balance_sheet':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatShort} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="Total Assets" stroke="#3b82f6" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="Networth" stroke="#22c55e" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'turnover_trend':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="turnoverGradFS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tickFormatter={formatShort} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Turnover" stroke="#6366f1" fill="url(#turnoverGradFS)" strokeWidth={3} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <CircularProgress sx={{ color: "#0d9488" }} />
    </Box>
  );

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Playfair Display', serif", color: "#0d9488" }}>
            Finance Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Annual Turnover, Networth, Grants & Financial Performance — Shrushti Sava Samiti
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip label={`FY 1998-99 to 2024-25`} size="small" sx={{ bgcolor: "#0d948815", color: "#0d9488", fontWeight: 600 }} />
            <Chip label={`${records.length} years of data`} size="small" variant="outlined" />
          </Stack>
        </Box>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate("/finance/entry")}
          sx={{ bgcolor: "#0d9488", "&:hover": { bgcolor: "#0f766e" }, borderRadius: 2, fontWeight: 700, textTransform: "none", px: 3 }}
        >
          Add / Edit Records
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Latest Annual Income"
            value={latestRecord ? formatCrore(latestRecord.income) : "—"}
            subtitle={latestRecord ? `FY ${latestRecord.year}` : "—"}
            icon={<TrendingUpIcon sx={{ color: "#0d9488", fontSize: 24 }} />}
            color="#0d9488"
            onClick={() => handleKpiClick('income')}
            {...kpiTrend("income")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Current Networth"
            value={latestRecord ? formatCrore(latestRecord.networth) : "—"}
            subtitle={latestRecord ? `Total Assets: ${formatCrore(latestRecord.total_assets)}` : "—"}
            icon={<AccountBalanceIcon sx={{ color: "#3b82f6", fontSize: 24 }} />}
            color="#3b82f6"
            onClick={() => handleKpiClick('networth')}
            {...kpiTrend("networth")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Cumulative Grants Received"
            value={formatCrore(totals.grantReceived)}
            subtitle={(fromYear || toYear) ? "Selected years combined" : "All years combined"}
            icon={<VolunteerIcon sx={{ color: "#f59e0b", fontSize: 24 }} />}
            color="#f59e0b"
            onClick={() => handleKpiClick('grants')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Cumulative Surplus"
            value={formatCrore(totals.surplus)}
            subtitle={`Total Income: ${formatCrore(totals.income)}`}
            icon={<ShowChartIcon sx={{ color: totals.surplus >= 0 ? "#22c55e" : "#ef4444", fontSize: 24 }} />}
            color={totals.surplus >= 0 ? "#22c55e" : "#ef4444"}
            onClick={() => handleKpiClick('surplus')}
          />
        </Grid>
      </Grid>

      {/* Year Range Filter */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.secondary", minWidth: 100 }}>
            Filter Charts:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>From Year</InputLabel>
            <Select value={fromYear} label="From Year" onChange={e => setFromYear(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {allYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>To Year</InputLabel>
            <Select value={toYear} label="To Year" onChange={e => setToYear(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {allYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          {(fromYear || toYear) && (
            <Button size="small" onClick={() => { setFromYear(""); setToYear(""); }} sx={{ textTransform: "none" }}>
              Clear
            </Button>
          )}
          <ToggleButtonGroup
            value={chartView}
            exclusive
            onChange={(_, v) => v && setChartView(v)}
            size="small"
            sx={{ ml: "auto" }}
          >
            <ToggleButton value="all">All Metrics</ToggleButton>
            <ToggleButton value="financial">Income & Expenditure</ToggleButton>
            <ToggleButton value="grants">Grants</ToggleButton>
            <ToggleButton value="balance">Balance Sheet</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Card>

      {/* Charts — Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Income vs Expenditure Area Chart */}
        {(chartView === "all" || chartView === "financial") && (
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  📈 Income vs Expenditure (Annual)
                </Typography>
                <IconButton size="small" onClick={() => setFullscreenChart('income_vs_exp')} sx={{ color: "#0d9488" }}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis tickFormatter={formatShort} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="Income" stroke="#0d9488" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Expenditure" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}

        {/* Surplus Bar Chart */}
        {(chartView === "all" || chartView === "financial") && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  💰 Annual Surplus / Deficit
                </Typography>
                <IconButton size="small" onClick={() => setFullscreenChart('surplus')} sx={{ color: "#0d9488" }}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 9 }} angle={-60} textAnchor="end" height={70} />
                  <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Surplus" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.Surplus >= 0 ? "#22c55e" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Charts — Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Grants Received Bar Chart */}
        {(chartView === "all" || chartView === "grants") && (
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  🤝 Grants Received by Category (Annual)
                </Typography>
                <IconButton size="small" onClick={() => setFullscreenChart('grants_cat')} sx={{ color: "#f59e0b" }}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={65} />
                  <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Grant Received" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Grant in Aid" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}

        {/* Grant Source Breakdown Pie */}
        {(chartView === "all" || chartView === "grants") && (
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  🥧 Grant Received — Source Breakdown (All Years)
                </Typography>
                <IconButton size="small" onClick={() => setFullscreenChart('grants_source')} sx={{ color: "#f59e0b" }}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={grantBreakdown} cx="50%" cy="50%" outerRadius={95} innerRadius={45}
                    dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {grantBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCrore(v)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Charts — Row 3 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Networth & Assets Line Chart */}
        {(chartView === "all" || chartView === "balance") && (
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  🏦 Balance Sheet — Assets, Liabilities & Networth
                </Typography>
                <IconButton size="small" onClick={() => setFullscreenChart('balance_sheet')} sx={{ color: "#3b82f6" }}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={65} />
                  <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Total Assets" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Networth" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}

        {/* Grant in Aid Pie */}
        {(chartView === "all" || chartView === "grants") && (
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  🥧 Grant in Aid — Source Breakdown
                </Typography>
                <IconButton size="small" onClick={() => setFullscreenChart('gia_source')} sx={{ color: "#8b5cf6" }}>
                  <FullscreenIcon />
                </IconButton>
              </Box>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={giaBreakdown} cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                    dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {giaBreakdown.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCrore(v)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Turnover Trend */}
      {(chartView === "all" || chartView === "financial") && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 2.5, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              📊 Annual Turnover Trend (1998–2025)
            </Typography>
            <IconButton size="small" onClick={() => setFullscreenChart('turnover_trend')} sx={{ color: "#6366f1" }}>
              <FullscreenIcon />
            </IconButton>
          </Box>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <defs>
                <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={65} />
              <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Turnover" stroke="#6366f1" fill="url(#turnoverGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Data Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>📋 Year-wise Financial Summary</Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => navigate("/finance/entry")}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Manage Records
          </Button>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(13,148,136,0.08)" }}>
                {["Year", "Income", "Expenditure", "Surplus", "Turnover", "Total Assets", "Networth", "Grant Received", "Grant in Aid"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {h === "Year" ? <span style={{ textAlign: "left", display: "block" }}>{h}</span> : h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filteredRecords].reverse().map((r, i) => (
                <tr key={r.id} style={{ backgroundColor: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(13,148,136,0.04)"}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)"}
                >
                  <td style={{ padding: "9px 14px", fontWeight: 700, color: "#0d9488", borderBottom: "1px solid #f1f5f9" }}>{r.year}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCrore(r.income)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCrore(r.expenditure)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9", color: Number(r.surplus) >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                    {formatCrore(r.surplus)}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCrore(r.turnover)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCrore(r.total_assets)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9", color: Number(r.networth) >= 0 ? "#3b82f6" : "#ef4444", fontWeight: 600 }}>
                    {formatCrore(r.networth)}
                  </td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCrore(r.grant_received_total)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{formatCrore(r.grant_in_aid_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      </Card>

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
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
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
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setFullscreenChart(null)} variant="outlined">
            Close Fullscreen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        fullWidth
        maxWidth="md"
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: "bold", borderBottom: "1px solid", borderColor: "divider", pb: 2 }}>
          {detailsDialogTitle}
        </DialogTitle>
        <DialogContent sx={{ mt: 2, maxHeight: "65vh" }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "rgba(13,148,136,0.06)" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                  {detailsDialogType === 'income' && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Income</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Expenditure</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Surplus</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Turnover</TableCell>
                    </>
                  )}
                  {detailsDialogType === 'networth' && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Assets</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Liabilities</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Networth</TableCell>
                    </>
                  )}
                  {detailsDialogType === 'grants' && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Total Grants</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Government</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">CSR</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Funding Agency</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">FCRA</TableCell>
                    </>
                  )}
                  {detailsDialogType === 'surplus' && (
                    <>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Income</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Expenditure</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Surplus</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {[...filteredRecords].reverse().map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: "#0d9488" }}>{row.year}</TableCell>
                    {detailsDialogType === 'income' && (
                      <>
                        <TableCell align="right">{formatCrore(row.income)}</TableCell>
                        <TableCell align="right">{formatCrore(row.expenditure)}</TableCell>
                        <TableCell align="right" sx={{ color: Number(row.surplus) >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{formatCrore(row.surplus)}</TableCell>
                        <TableCell align="right">{formatCrore(row.turnover)}</TableCell>
                      </>
                    )}
                    {detailsDialogType === 'networth' && (
                      <>
                        <TableCell align="right">{formatCrore(row.total_assets)}</TableCell>
                        <TableCell align="right">{formatCrore(row.total_liabilities)}</TableCell>
                        <TableCell align="right" sx={{ color: Number(row.networth) >= 0 ? "#3b82f6" : "#ef4444", fontWeight: 600 }}>{formatCrore(row.networth)}</TableCell>
                      </>
                    )}
                    {detailsDialogType === 'grants' && (
                      <>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCrore(row.grant_received_total)}</TableCell>
                        <TableCell align="right">{formatCrore(row.grant_received_govt)}</TableCell>
                        <TableCell align="right">{formatCrore(row.grant_received_csr)}</TableCell>
                        <TableCell align="right">{formatCrore(row.grant_received_funding_agency)}</TableCell>
                        <TableCell align="right">{formatCrore(row.grant_received_fcra)}</TableCell>
                      </>
                    )}
                    {detailsDialogType === 'surplus' && (
                      <>
                        <TableCell align="right">{formatCrore(row.income)}</TableCell>
                        <TableCell align="right">{formatCrore(row.expenditure)}</TableCell>
                        <TableCell align="right" sx={{ color: Number(row.surplus) >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{formatCrore(row.surplus)}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={() => setDetailsDialogOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
