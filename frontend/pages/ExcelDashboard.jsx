import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Search as SearchIcon,
  TableChart as TableChartIcon,
  Business as BusinessIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  AttachMoney as MoneyIcon,
  FolderOpen as FolderIcon,
  Close as CloseIcon,
  TrendingUp as TrendingIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = [
  "#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#10b981", "#f97316", "#06b6d4",
  "#ec4899", "#84cc16"
];

const STATUS_COLORS = {
  Completed: "#10b981",
  Pending: "#f59e0b"
};

function formatCurrency(val) {
  const n = Number(val);
  if (isNaN(n)) return "₹0";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function StatCard({ icon, label, value, color }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 140,
        background: "#ffffff",
        borderRadius: "12px",
        p: 2.5,
        display: "flex",
        alignItems: "center",
        gap: 2,
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        border: `1px solid ${color}22`,
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)" }
      }}
    >
      <Box
        sx={{
          width: 48, height: 48, borderRadius: "12px",
          background: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: color, flexShrink: 0
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", fontSize: "10px" }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2, fontSize: "1.1rem" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ExcelDashboard() {
  const [agencies, setAgencies] = useState([]);
  const [filteredAgencies, setFilteredAgencies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [agencyStats, setAgencyStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const detailRef = useRef(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredAgencies(
      agencies.filter(a =>
        a.agency_name.toLowerCase().includes(q) ||
        (a.primary_theme || "").toLowerCase().includes(q)
      )
    );
  }, [search, agencies]);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reports/agencies/summary");
      setAgencies(res.data.data || []);
    } catch (err) {
      console.error("Error fetching agencies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAgency = async (agency) => {
    if (selectedAgency?.agency_id === agency.agency_id) {
      setSelectedAgency(null);
      setAgencyStats(null);
      return;
    }
    setSelectedAgency(agency);
    setStatsLoading(true);
    setAgencyStats(null);
    try {
      const res = await api.get(`/reports/agency/${agency.agency_id}/stats`);
      setAgencyStats(res.data);
    } catch (err) {
      console.error("Error fetching agency stats:", err);
    } finally {
      setStatsLoading(false);
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  const completionRate = agencyStats
    ? agencyStats.summary.total_projects > 0
      ? Math.round((agencyStats.summary.completed / agencyStats.summary.total_projects) * 100)
      : 0
    : 0;

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Page Header */}
      <Box sx={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
        borderRadius: "16px",
        p: 3,
        mb: 3,
        display: "flex",
        alignItems: "center",
        gap: 2
      }}>
        <Box sx={{
          width: 52, height: 52, borderRadius: "14px",
          background: "rgba(20,184,166,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <TableChartIcon sx={{ color: "#14b8a6", fontSize: 28 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" }}>
            Excel-Style Agency Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.3 }}>
            Select any agency row to view their individual project charts and analytics
          </Typography>
        </Box>
        <Tooltip title="Refresh data">
          <IconButton onClick={fetchAgencies} sx={{ color: "#94a3b8", "&:hover": { color: "#14b8a6" } }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          placeholder="Search agency or theme..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{
            maxWidth: 360,
            "& .MuiOutlinedInput-root": {
              background: "#ffffff",
              borderRadius: "10px",
              "& fieldset": { borderColor: "#e2e8f0" },
              "&:hover fieldset": { borderColor: "#94a3b8" },
              "&.Mui-focused fieldset": { borderColor: "#14b8a6" }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
              </InputAdornment>
            )
          }}
        />
        <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500 }}>
          {filteredAgencies.length} of {agencies.length} agencies
          {selectedAgency && (
            <Box component="span" sx={{ ml: 2, color: "#14b8a6", fontWeight: 700 }}>
              • Selected: {selectedAgency.agency_name}
            </Box>
          )}
        </Typography>
      </Box>

      {/* Excel-Style Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #cbd5e1",
          boxShadow: "0 4px 16px rgba(15,23,42,0.06)"
        }}
      >
        {/* Excel top bar */}
        <Box sx={{
          background: "#217346",
          px: 2, py: 1,
          display: "flex", alignItems: "center", gap: 1.5
        }}>
          <Box sx={{ width: 14, height: 14, borderRadius: "50%", background: "#ff5f57" }} />
          <Box sx={{ width: 14, height: 14, borderRadius: "50%", background: "#ffbd2e" }} />
          <Box sx={{ width: 14, height: 14, borderRadius: "50%", background: "#28ca41" }} />
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", ml: 1, fontFamily: "monospace", fontSize: 11 }}>
            Agency_Dashboard.xlsx — Shrushti MIS
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#14b8a6" }} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 480 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {["#", "Agency Name", "Total Projects", "Sanctioned Amount", "Completed", "Pending", "Completion %", "Primary Theme"].map((col, i) => (
                    <TableCell
                      key={col}
                      sx={{
                        background: "#e2efda",
                        fontFamily: "Calibri, Arial, sans-serif",
                        fontWeight: 700,
                        color: "#1e3a2f",
                        fontSize: "12px",
                        borderRight: "1px solid #b7d4a8",
                        borderBottom: "2px solid #217346",
                        whiteSpace: "nowrap",
                        py: 1.2,
                        px: i === 0 ? 1 : 1.5,
                        textAlign: i > 1 ? "center" : "left",
                        minWidth: i === 1 ? 220 : i === 3 ? 150 : i === 7 ? 180 : 90
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAgencies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: "center", py: 5, color: "#94a3b8", fontFamily: "Calibri, sans-serif" }}>
                      No agencies found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgencies.map((agency, idx) => {
                    const isSelected = selectedAgency?.agency_id === agency.agency_id;
                    const rate = agency.total_projects > 0
                      ? Math.round((agency.completed_projects / agency.total_projects) * 100)
                      : 0;

                    return (
                      <TableRow
                        key={agency.agency_id}
                        onClick={() => handleSelectAgency(agency)}
                        sx={{
                          cursor: "pointer",
                          background: isSelected
                            ? "linear-gradient(90deg, #e6f4ea 0%, #d9f0ff 100%)"
                            : idx % 2 === 0 ? "#ffffff" : "#f8fffe",
                          "&:hover": {
                            background: isSelected
                              ? "linear-gradient(90deg, #d0ebd8 0%, #c5e8ff 100%)"
                              : "#e8f5e9"
                          },
                          outline: isSelected ? "2px solid #14b8a6" : "none",
                          outlineOffset: "-1px",
                          transition: "all 0.15s"
                        }}
                      >
                        {/* Row number */}
                        <TableCell sx={{
                          fontFamily: "Calibri, sans-serif", fontSize: "11px", color: "#94a3b8",
                          textAlign: "center", background: isSelected ? "#d8f2e8" : "#f1f5f9",
                          borderRight: "1px solid #e2e8f0", py: 1, px: 1, fontWeight: 500, width: 36
                        }}>
                          {idx + 1}
                        </TableCell>

                        {/* Agency Name */}
                        <TableCell sx={{
                          fontFamily: "Calibri, sans-serif", fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? "#065f46" : "#1e293b", fontSize: "13px",
                          borderRight: "1px solid #e9f0e6", py: 1, px: 1.5, maxWidth: 220
                        }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {isSelected && (
                              <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", flexShrink: 0 }} />
                            )}
                            {agency.agency_name}
                          </Box>
                        </TableCell>

                        {/* Total Projects */}
                        <TableCell sx={{
                          textAlign: "center", fontFamily: "Calibri, sans-serif",
                          fontWeight: 700, color: "#1e40af", fontSize: "13px",
                          borderRight: "1px solid #e9f0e6", py: 1
                        }}>
                          {agency.total_projects}
                        </TableCell>

                        {/* Sanctioned Amount */}
                        <TableCell sx={{
                          textAlign: "right", fontFamily: "monospace",
                          color: "#065f46", fontSize: "12px", fontWeight: 600,
                          borderRight: "1px solid #e9f0e6", py: 1, pr: 1.5
                        }}>
                          {formatCurrency(agency.total_sanctioned)}
                        </TableCell>

                        {/* Completed */}
                        <TableCell sx={{
                          textAlign: "center", fontFamily: "Calibri, sans-serif",
                          color: "#15803d", fontWeight: 700, fontSize: "13px",
                          borderRight: "1px solid #e9f0e6", py: 1
                        }}>
                          {agency.completed_projects}
                        </TableCell>

                        {/* Pending */}
                        <TableCell sx={{
                          textAlign: "center", fontFamily: "Calibri, sans-serif",
                          color: "#b45309", fontWeight: 700, fontSize: "13px",
                          borderRight: "1px solid #e9f0e6", py: 1
                        }}>
                          {agency.pending_projects}
                        </TableCell>

                        {/* Completion % — inline progress bar */}
                        <TableCell sx={{ textAlign: "center", borderRight: "1px solid #e9f0e6", py: 1, px: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box sx={{
                              flex: 1, height: 8, borderRadius: 4,
                              background: "#e2e8f0", overflow: "hidden"
                            }}>
                              <Box sx={{
                                height: "100%",
                                width: `${rate}%`,
                                background: rate >= 75 ? "#10b981" : rate >= 40 ? "#f59e0b" : "#ef4444",
                                borderRadius: 4, transition: "width 0.6s ease"
                              }} />
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#374151", minWidth: 32, fontFamily: "monospace" }}>
                              {rate}%
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Primary Theme */}
                        <TableCell sx={{ py: 1, px: 1.5 }}>
                          {agency.primary_theme ? (
                            <Chip
                              label={agency.primary_theme}
                              size="small"
                              sx={{
                                background: "#eff6ff", color: "#1d4ed8",
                                fontWeight: 600, fontSize: "10px",
                                height: 20, fontFamily: "Calibri, sans-serif"
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: "#cbd5e1" }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Per-Agency Chart Panel */}
      {(selectedAgency || statsLoading) && (
        <Box
          ref={detailRef}
          sx={{
            mt: 4,
            animation: "slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
            "@keyframes slideInUp": {
              from: { opacity: 0, transform: "translateY(32px)" },
              to: { opacity: 1, transform: "translateY(0)" }
            }
          }}
        >
          {/* Panel Header */}
          <Box sx={{
            background: "linear-gradient(135deg, #0f172a 0%, #164e63 100%)",
            borderRadius: "16px 16px 0 0",
            px: 3, py: 2.5,
            display: "flex", alignItems: "center", gap: 2
          }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "10px",
              background: "rgba(20,184,166,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <BusinessIcon sx={{ color: "#14b8a6", fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.3px" }}>
                {selectedAgency?.agency_name}
              </Typography>
              <Typography variant="caption" sx={{ color: "#7dd3fc" }}>
                Individual Agency Analytics Dashboard
              </Typography>
            </Box>
            <IconButton
              onClick={() => { setSelectedAgency(null); setAgencyStats(null); }}
              sx={{ color: "#94a3b8", "&:hover": { color: "#f8fafc", background: "rgba(255,255,255,0.1)" } }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{
            background: "#ffffff",
            borderRadius: "0 0 16px 16px",
            border: "1px solid #e2e8f0",
            borderTop: "none",
            p: 3,
            boxShadow: "0 8px 32px rgba(15,23,42,0.1)"
          }}>
            {statsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8, gap: 2 }}>
                <CircularProgress size={32} sx={{ color: "#14b8a6" }} />
                <Typography sx={{ color: "#64748b" }}>Loading agency analytics...</Typography>
              </Box>
            ) : agencyStats ? (
              <>
                {/* Stat Cards */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 4 }}>
                  <StatCard icon={<FolderIcon />} label="Total Projects" value={agencyStats.summary.total_projects} color="#3b82f6" />
                  <StatCard icon={<MoneyIcon />} label="Total Sanctioned" value={formatCurrency(agencyStats.summary.total_sanctioned)} color="#14b8a6" />
                  <StatCard icon={<CheckIcon />} label="Completed" value={agencyStats.summary.completed} color="#10b981" />
                  <StatCard icon={<PendingIcon />} label="Pending" value={agencyStats.summary.pending} color="#f59e0b" />
                  <StatCard
                    icon={<TrendingIcon />}
                    label="Completion Rate"
                    value={`${completionRate}%`}
                    color={completionRate >= 75 ? "#10b981" : completionRate >= 40 ? "#f59e0b" : "#ef4444"}
                  />
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Row 1: Bar + Line charts */}
                <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
                  <Paper elevation={0} sx={{ flex: 1, minWidth: 280, p: 2.5, border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fafafa" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 4, height: 16, borderRadius: 2, background: "#3b82f6", flexShrink: 0 }} />
                      Projects by Year
                    </Typography>
                    {agencyStats.byYear.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>No year data available</Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={agencyStats.byYear} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                          <RTooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            formatter={(v) => [v, "Projects"]}
                          />
                          <Bar dataKey="count" name="Projects" radius={[4, 4, 0, 0]}>
                            {agencyStats.byYear.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Paper>

                  <Paper elevation={0} sx={{ flex: 1, minWidth: 280, p: 2.5, border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fafafa" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 4, height: 16, borderRadius: 2, background: "#14b8a6", flexShrink: 0 }} />
                      Sanctioned Amount by Year
                    </Typography>
                    {agencyStats.amountByYear.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>No amount data available</Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={agencyStats.amountByYear} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748b" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => formatCurrency(v)} width={70} />
                          <RTooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            formatter={(v) => [formatCurrency(v), "Sanctioned"]}
                          />
                          <Line
                            type="monotone" dataKey="amount" name="Sanctioned"
                            stroke="#14b8a6" strokeWidth={3}
                            dot={{ fill: "#14b8a6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Paper>
                </Box>

                {/* Row 2: Pie + Donut charts */}
                <Box sx={{ display: "flex", gap: 3, mb: 4, flexWrap: "wrap" }}>
                  <Paper elevation={0} sx={{ flex: 1, minWidth: 260, p: 2.5, border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fafafa" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 4, height: 16, borderRadius: 2, background: "#8b5cf6", flexShrink: 0 }} />
                      Theme Distribution
                    </Typography>
                    {agencyStats.themeDistribution.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>No theme data</Box>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={agencyStats.themeDistribution}
                            cx="50%" cy="50%" outerRadius={95}
                            dataKey="value" labelLine={false} label={CustomPieLabel}
                          >
                            {agencyStats.themeDistribution.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                            formatter={(v, n, p) => [v + " projects", p.payload.name]}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Paper>

                  <Paper elevation={0} sx={{ flex: 1, minWidth: 260, p: 2.5, border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fafafa" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 4, height: 16, borderRadius: 2, background: "#f59e0b", flexShrink: 0 }} />
                      Classification Status
                    </Typography>
                    {agencyStats.statusBreakdown.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>No status data</Box>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <ResponsiveContainer width="60%" height={240}>
                          <PieChart>
                            <Pie
                              data={agencyStats.statusBreakdown}
                              cx="50%" cy="50%"
                              innerRadius={55} outerRadius={90}
                              dataKey="value" paddingAngle={3}
                            >
                              {agencyStats.statusBreakdown.map((entry, i) => (
                                <Cell key={i} fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip
                              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                              formatter={(v, n, p) => [v + " projects", p.payload.name]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5, pr: 1 }}>
                          {agencyStats.statusBreakdown.map((entry, i) => (
                            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{
                                width: 12, height: 12, borderRadius: "3px", flexShrink: 0,
                                background: STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]
                              }} />
                              <Box>
                                <Typography variant="caption" sx={{ display: "block", color: "#64748b", fontWeight: 600, fontSize: "10px" }}>
                                  {entry.name}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
                                  {entry.value}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                          <Divider sx={{ my: 0.5 }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, fontSize: "10px" }}>
                              COMPLETION RATE
                            </Typography>
                            <Typography variant="body1" sx={{
                              fontWeight: 800,
                              color: completionRate >= 75 ? "#10b981" : completionRate >= 40 ? "#f59e0b" : "#ef4444"
                            }}>
                              {completionRate}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Box>

                {/* Recent Projects Table */}
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 4, height: 16, borderRadius: 2, background: "#0f172a", flexShrink: 0 }} />
                  Recent Projects — {selectedAgency?.agency_name}
                </Typography>
                <TableContainer sx={{ borderRadius: "10px", border: "1px solid #e2e8f0", maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {["#", "Project Name", "Year", "Sanctioned Amount", "Theme(s)", "Status"].map(col => (
                          <TableCell key={col} sx={{
                            background: "#f8fafc", fontWeight: 700, color: "#475569",
                            fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px",
                            borderBottom: "2px solid #e2e8f0", py: 1
                          }}>
                            {col}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agencyStats.recentProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#94a3b8" }}>
                            No projects found for this agency.
                          </TableCell>
                        </TableRow>
                      ) : (
                        agencyStats.recentProjects.map((p, idx) => (
                          <TableRow key={p.project_id} sx={{
                            background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                            "&:hover": { background: "#eff6ff" }
                          }}>
                            <TableCell sx={{ color: "#94a3b8", fontSize: "11px", py: 0.8 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: "#1e293b", py: 0.8 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 300 }}>
                                {p.project_name}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ color: "#475569", py: 0.8 }}>{p.year || "—"}</TableCell>
                            <TableCell sx={{ color: "#065f46", fontWeight: 600, fontFamily: "monospace", py: 0.8 }}>
                              {formatCurrency(p.sanctioned_amount)}
                            </TableCell>
                            <TableCell sx={{ py: 0.8, maxWidth: 200 }}>
                              <Typography variant="caption" sx={{ color: "#0369a1", fontWeight: 500 }}>
                                {p.themes}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 0.8 }}>
                              <Chip
                                label={p.classification_status}
                                size="small"
                                sx={{
                                  background: p.classification_status === "Completed" ? "#d1fae5" : "#fef3c7",
                                  color: p.classification_status === "Completed" ? "#065f46" : "#92400e",
                                  fontWeight: 700, fontSize: "10px", height: 20
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : null}
          </Box>
        </Box>
      )}

      {/* Empty hint when nothing selected */}
      {!selectedAgency && !statsLoading && agencies.length > 0 && (
        <Box sx={{
          mt: 4, py: 6, textAlign: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #e8f5e9 100%)",
          borderRadius: "16px", border: "2px dashed #cbd5e1"
        }}>
          <TableChartIcon sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
          <Typography variant="h6" sx={{ color: "#94a3b8", fontWeight: 600 }}>
            Click any agency row above to view their analytics
          </Typography>
          <Typography variant="body2" sx={{ color: "#cbd5e1", mt: 0.5 }}>
            Charts, stats, and project details will appear here
          </Typography>
        </Box>
      )}
    </Box>
  );
}
