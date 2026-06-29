import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Stack,
  Alert,
  Autocomplete
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  FolderOpen as FolderIcon,
  AssignmentTurnedIn as CompleteIcon,
  PendingActions as PendingIcon,
  SmartToy as AiIcon
} from "@mui/icons-material";

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Suggestion states
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAiSuggestion = async () => {
    setAiLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/ai-classify/${id}/suggest`);
      if (res.data.success) {
        setAiSuggestion(res.data.suggestion);
      } else {
        alert("Failed to fetch AI classification suggestions");
      }
    } catch (err) {
      console.error(err);
      alert("Error fetching AI suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  // DB Dropdowns
  const [themes, setThemes] = useState([]);
  const [subThemes, setSubThemes] = useState([]);
  const [targetGroups, setTargetGroups] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [fundingSources, setFundingSources] = useState([]);
  const [states, setStates] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Taxonomy (4-level cascading hierarchy)
  const [taxonomy, setTaxonomy] = useState([]);

  const SUBTHEME1_NAMES = ["Education", "Health", "Livelihood", "Skill Development", "Capacity Building", "Water", "Awareness", "Climate Resilience", "Research", "Monitoring", "Agriculture"];
  const SUBTHEME2_NAMES = ["Primary Education", "Preprimary Education", "Secondary Education", "Maternal Health", "Eye Health", "Nutrition", "Disabilities", "Construction", "Behavior Change", "Evaluation Study", "Youth Development", "Water", "Community Mobilization"];
  const SUBTHEME3_NAMES = ["Reproductive Health", "Entrepreneurship", "Advocacy", "Natural Resource Management", "Impact Assessment", "Data Collection", "Water Management", "Check Dem construction", "ECCE", "Counselling", "WASH", "Social Securities", "Social Campaign"];

  const TARGET_GROUPS_MAPPING = {
    "Children": [
      "ECCE children",
      "primary school children",
      "upper primary children",
      "secondary students",
      "out-of-school children",
      "child labour-affected children"
    ],
    "Girls": [
      "Adolescent girls",
      "school-going girls",
      "drop-out girls",
      "young women"
    ],
    "Boys": [
      "School-going boys",
      "adolescent boys",
      "youth boys"
    ],
    "Women": [
      "SHG members",
      "pregnant women",
      "lactating mothers",
      "farm women",
      "women entrepreneurs",
      "widows",
      "single women"
    ],
    "Men": [
      "Farmers",
      "skilled workers",
      "community volunteers",
      "fathers",
      "male youth"
    ],
    "Youth": [
      "College youth",
      "unemployed youth",
      "rural youth",
      "urban youth",
      "NEET youth"
    ],
    "Farmers": [
      "Small farmers",
      "marginal farmers",
      "women farmers",
      "tenant farmers",
      "tribal farmers"
    ],
    "Elderly": [
      "Senior citizens",
      "bedridden elderly",
      "single elderly"
    ],
    "Persons with disabilities": [
      "Children with disabilities",
      "adults with disabilities"
    ],
    "Community groups": [
      "SHGs",
      "CBOs",
      "PRI members",
      "teachers",
      "anganwadi workers",
      "ASHAs",
      "peer educators"
    ]
  };

  // Form States (for editing core details)
  const [editName, setEditName] = useState("");
  const [editDocNo, setEditDocNo] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editApprovalDate, setEditApprovalDate] = useState("");
  const [editSanctionedAmount, setEditSanctionedAmount] = useState("");
  const [editStatusId, setEditStatusId] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editFundingType, setEditFundingType] = useState("");
  const [editDonorAgencyName, setEditDonorAgencyName] = useState("");
  const [editDonorCategory, setEditDonorCategory] = useState("");
  const [editDurationMonths, setEditDurationMonths] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editBlockVillageUlb, setEditBlockVillageUlb] = useState("");
  const [agencySelect, setAgencySelect] = useState("");
  const [customAgency, setCustomAgency] = useState("");
  const [fundingSelect, setFundingSelect] = useState("");
  const [customFunding, setCustomFunding] = useState("");
  const [fundingSelect2, setFundingSelect2] = useState("");
  const [customFunding2, setCustomFunding2] = useState("");
  const [selectedStates, setSelectedStates] = useState([{ state_id: "", custom_name: "" }]);

  // Classification States — 4-level taxonomy shape with multiple subthemes under one theme
  const [selectedThemes, setSelectedThemes] = useState([{ themeId: "", subThemes: [{ category: "", subCategory: "", activity: "" }] }]);
  const [selectedTargetGroups, setSelectedTargetGroups] = useState([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);
  const [selectedSdgs, setSelectedSdgs] = useState([]);
  const [projectSummary, setProjectSummary] = useState("");

  // Target Beneficiary Groups & Categories
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([{ mainGroup: "", subGroups: [] }]);

  // Geographical Tagging States
  const [areaType, setAreaType] = useState("");
  const [ruralSubtype, setRuralSubtype] = useState("");
  const [urbanSubtype, setUrbanSubtype] = useState("");
  const [settlementDetail, setSettlementDetail] = useState("");
  const [geographyNotes, setGeographyNotes] = useState("");

  // Beneficiary Counting Format States
  const [beneficiaryCounts, setBeneficiaryCounts] = useState([{ type: "", gender: "", ageGroup: "", educationStage: "", vulnerabilities: [] }]);

  // Output Scale & Outcomes States
  const [totalBeneficiaries, setTotalBeneficiaries] = useState("");
  const [directBeneficiaries, setDirectBeneficiaries] = useState("");
  const [indirectBeneficiaries, setIndirectBeneficiaries] = useState("");
  const [beneficiariesMale, setBeneficiariesMale] = useState("");
  const [beneficiariesFemale, setBeneficiariesFemale] = useState("");
  const [beneficiariesBoys, setBeneficiariesBoys] = useState("");
  const [beneficiariesGirls, setBeneficiariesGirls] = useState("");
  const [outcomeImpactNotes, setOutcomeImpactNotes] = useState("");
  const [projectImages, setProjectImages] = useState([]);
  const [inputUrl, setInputUrl] = useState("");

  // Documents state
  const [projectDocuments, setProjectDocuments] = useState([]);
  const [inputDocUrl, setInputDocUrl] = useState("");
  const [inputDocName, setInputDocName] = useState("");
  const [inputDocType, setInputDocType] = useState("");

  const handleBeneficiaryCountChange = (index, field, value) => {
    const updated = [...beneficiaryCounts];
    updated[index][field] = value;
    setBeneficiaryCounts(updated);
  };

  const handleAddBeneficiaryCountRow = () => {
    setBeneficiaryCounts([...beneficiaryCounts, { type: "", gender: "", ageGroup: "", educationStage: "", vulnerabilities: [] }]);
  };

  const handleRemoveBeneficiaryCountRow = (index) => {
    setBeneficiaryCounts(beneficiaryCounts.filter((_, idx) => idx !== index));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectImages(prev => [...prev, { url: reader.result, remarks: "" }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrlImage = () => {
    if (inputUrl.trim()) {
      setProjectImages([...projectImages, { url: inputUrl.trim(), remarks: "" }]);
      setInputUrl("");
    }
  };

  const handleImageRemarkChange = (index, val) => {
    const updated = [...projectImages];
    updated[index].remarks = val;
    setProjectImages(updated);
  };

  const handleRemoveImage = (index) => {
    setProjectImages(projectImages.filter((_, idx) => idx !== index));
  };

  // Document handlers
  const DOCUMENT_TYPES = ["MOU", "Agreement", "Proposal", "Report", "Budget", "Completion Certificate", "Letter", "Invoice", "Other"];

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProjectDocuments(prev => [...prev, {
          name: file.name,
          type: inputDocType || "Other",
          url: reader.result,
          remarks: "",
          uploadedAt: new Date().toISOString()
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleAddDocUrl = () => {
    if (inputDocUrl.trim() && inputDocName.trim()) {
      setProjectDocuments(prev => [...prev, {
        name: inputDocName.trim(),
        type: inputDocType || "Other",
        url: inputDocUrl.trim(),
        remarks: "",
        uploadedAt: new Date().toISOString()
      }]);
      setInputDocUrl("");
      setInputDocName("");
      setInputDocType("");
    } else {
      alert("Please enter both a Document Name and URL.");
    }
  };

  const handleDocRemarkChange = (index, val) => {
    const updated = [...projectDocuments];
    updated[index].remarks = val;
    setProjectDocuments(updated);
  };

  const handleRemoveDocument = (index) => {
    setProjectDocuments(projectDocuments.filter((_, idx) => idx !== index));
  };

  // SDGs
  const [sdgs, setSdgs] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStateChange = (index, field, value) => {
    const updated = [...selectedStates];
    updated[index][field] = value;
    setSelectedStates(updated);
  };

  const handleAddStateRow = () => {
    setSelectedStates([...selectedStates, { state_id: "", custom_name: "" }]);
  };

  const handleRemoveStateRow = (index) => {
    setSelectedStates(selectedStates.filter((_, idx) => idx !== index));
  };

  const handleThemeChange = (index, themeId) => {
    const updated = [...selectedThemes];
    updated[index] = { themeId, subThemes: [{ category: "", subCategory: "", activity: "" }] };
    setSelectedThemes(updated);
  };

  const handleCategoryChange = (index, subIndex, category) => {
    const updated = [...selectedThemes];
    updated[index].subThemes[subIndex] = {
      ...updated[index].subThemes[subIndex],
      category,
      subCategory: "",
      activity: ""
    };
    setSelectedThemes(updated);
  };

  const handleSubCategoryChange = (index, subIndex, subCategory) => {
    const updated = [...selectedThemes];
    updated[index].subThemes[subIndex] = {
      ...updated[index].subThemes[subIndex],
      subCategory,
      activity: ""
    };
    setSelectedThemes(updated);
  };

  const handleActivityChange = (index, subIndex, activity) => {
    const updated = [...selectedThemes];
    updated[index].subThemes[subIndex] = {
      ...updated[index].subThemes[subIndex],
      activity
    };
    setSelectedThemes(updated);
  };

  const handleAddSubThemePath = (index) => {
    const updated = [...selectedThemes];
    updated[index].subThemes.push({ category: "", subCategory: "", activity: "" });
    setSelectedThemes(updated);
  };

  const handleRemoveSubThemePath = (index, subIndex) => {
    const updated = [...selectedThemes];
    updated[index].subThemes = updated[index].subThemes.filter((_, idx) => idx !== subIndex);
    if (updated[index].subThemes.length === 0) {
      updated[index].subThemes.push({ category: "", subCategory: "", activity: "" });
    }
    setSelectedThemes(updated);
  };

  const handleAddThemeRow = () => {
    setSelectedThemes([...selectedThemes, { themeId: "", subThemes: [{ category: "", subCategory: "", activity: "" }] }]);
  };

  const handleRemoveThemeRow = (index) => {
    setSelectedThemes(selectedThemes.filter((_, idx) => idx !== index));
  };

  const handleBeneficiaryMainChange = (index, value) => {
    const updated = [...selectedBeneficiaries];
    updated[index].mainGroup = value;
    updated[index].subGroups = []; // Reset sub groups when main group changes
    setSelectedBeneficiaries(updated);
  };

  const handleBeneficiarySubChange = (index, value) => {
    const updated = [...selectedBeneficiaries];
    updated[index].subGroups = value;
    setSelectedBeneficiaries(updated);
  };

  const handleAddBeneficiaryRow = () => {
    setSelectedBeneficiaries([...selectedBeneficiaries, { mainGroup: "", subGroups: [] }]);
  };

  const handleRemoveBeneficiaryRow = (index) => {
    setSelectedBeneficiaries(selectedBeneficiaries.filter((_, idx) => idx !== index));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch project details (with classification)
      const projectRes = await axios.get(`http://localhost:5000/project/${id}`);
      const proj = projectRes.data;
      setProject(proj);

      // Pre-populate core details form fields
      setEditName(proj.project_name || "");
      setEditDocNo(proj.doc_no || "");
      setEditYear(proj.year || "");
      setEditRemarks(proj.remarks || "");
      setEditStatusId(proj.status_id || "");
      setEditSanctionedAmount(proj.sanctioned_amount || "");
      setEditApprovalDate(proj.approval_date ? new Date(proj.approval_date).toISOString().split('T')[0] : "");
      setEditFundingType(proj.funding_type || "");
      setEditDonorAgencyName(proj.donor_agency_name || "");
      setEditDonorCategory(proj.donor_category || "");
      setEditDurationMonths(proj.duration_months || "");
      setEditDistrict(proj.district || "");
      setEditBlockVillageUlb(proj.block_village_ulb || "");

      setAgencySelect(proj.agency_id || "");
      setFundingSelect(proj.funding_source_id || "");
      setFundingSelect2(proj.funding_source2_id || "");

      if (proj.state_ids && proj.state_ids.length > 0) {
        setSelectedStates(proj.state_ids.map(sid => ({ state_id: sid, custom_name: "" })));
      } else {
        setSelectedStates([{ state_id: proj.state_id || "", custom_name: "" }]);
      }

      // Pre-populate classification dropdowns
      if (proj.classification) {
        setSelectedTargetGroups(proj.classification.target_group_ids || []);
        setSelectedActivityTypes(proj.classification.activity_type_ids || []);
        setSelectedSdgs(proj.classification.sdg_ids || []);

        if (proj.classification.themes && proj.classification.themes.length > 0) {
          const grouped = {};
          proj.classification.themes.forEach(t => {
            const tid = t.themeId;
            if (!grouped[tid]) {
              grouped[tid] = { themeId: tid, subThemes: [] };
            }
            grouped[tid].subThemes.push({
              category: t.category || "",
              subCategory: t.subCategory || "",
              activity: t.activity || ""
            });
          });
          const loadedThemes = Object.values(grouped);
          if (loadedThemes.length === 0) {
            loadedThemes.push({ themeId: "", subThemes: [{ category: "", subCategory: "", activity: "" }] });
          }
          setSelectedThemes(loadedThemes);
        } else if (proj.classification.theme_id) {
          setSelectedThemes([{ themeId: proj.classification.theme_id, subThemes: [{ category: "", subCategory: "", activity: "" }] }]);
        } else {
          setSelectedThemes([{ themeId: "", subThemes: [{ category: "", subCategory: "", activity: "" }] }]);
        }
      }

      setProjectSummary(proj.project_summary || "");

      // Reconstruct target beneficiary groups from DB columns
      const rawGroups = proj.beneficiary_groups ? proj.beneficiary_groups.split(',') : [];
      const rawSubs = proj.beneficiary_cat1 ? proj.beneficiary_cat1.split(',') : [];

      const mainGroupToSubs = {};
      rawGroups.forEach(g => {
        const trimmed = g.trim();
        if (trimmed) {
          mainGroupToSubs[trimmed] = [];
        }
      });

      rawSubs.forEach(s => {
        const trimmedSub = s.trim();
        if (!trimmedSub) return;
        let foundMain = null;
        for (const [mainG, subList] of Object.entries(TARGET_GROUPS_MAPPING)) {
          if (subList.includes(trimmedSub)) {
            foundMain = mainG;
            break;
          }
        }
        if (foundMain) {
          if (!mainGroupToSubs[foundMain]) {
            mainGroupToSubs[foundMain] = [];
          }
          if (!mainGroupToSubs[foundMain].includes(trimmedSub)) {
            mainGroupToSubs[foundMain].push(trimmedSub);
          }
        }
      });

      const loadedBeneficiaries = [];
      Object.entries(mainGroupToSubs).forEach(([mainGroup, subGroups]) => {
        loadedBeneficiaries.push({ mainGroup, subGroups });
      });

      if (loadedBeneficiaries.length === 0) {
        loadedBeneficiaries.push({ mainGroup: "", subGroups: [] });
      }
      setSelectedBeneficiaries(loadedBeneficiaries);
      setAreaType(proj.area_type || "");
      setRuralSubtype(proj.rural_subtype || "");
      setUrbanSubtype(proj.urban_subtype || "");
      setSettlementDetail(proj.settlement_detail || "");
      setGeographyNotes(proj.geography_notes || "");

      if (proj.beneficiary_counts) {
        try {
          const parsed = JSON.parse(proj.beneficiary_counts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBeneficiaryCounts(parsed);
          } else {
            setBeneficiaryCounts([{ type: "", gender: "", ageGroup: "", educationStage: "", vulnerabilities: [] }]);
          }
        } catch (e) {
          console.error("Error parsing beneficiary_counts", e);
          setBeneficiaryCounts([{ type: "", gender: "", ageGroup: "", educationStage: "", vulnerabilities: [] }]);
        }
      } else {
        setBeneficiaryCounts([{ type: "", gender: "", ageGroup: "", educationStage: "", vulnerabilities: [] }]);
      }

      setTotalBeneficiaries(proj.total_beneficiaries !== null && proj.total_beneficiaries !== undefined ? proj.total_beneficiaries : "");
      setDirectBeneficiaries(proj.direct_beneficiaries !== null && proj.direct_beneficiaries !== undefined ? proj.direct_beneficiaries : "");
      setIndirectBeneficiaries(proj.indirect_beneficiaries !== null && proj.indirect_beneficiaries !== undefined ? proj.indirect_beneficiaries : "");
      setBeneficiariesMale(proj.beneficiaries_male !== null && proj.beneficiaries_male !== undefined ? proj.beneficiaries_male : "");
      setBeneficiariesFemale(proj.beneficiaries_female !== null && proj.beneficiaries_female !== undefined ? proj.beneficiaries_female : "");
      setBeneficiariesBoys(proj.beneficiaries_boys !== null && proj.beneficiaries_boys !== undefined ? proj.beneficiaries_boys : "");
      setBeneficiariesGirls(proj.beneficiaries_girls !== null && proj.beneficiaries_girls !== undefined ? proj.beneficiaries_girls : "");
      setOutcomeImpactNotes(proj.outcome_impact_notes || "");

      if (proj.images) {
        try {
          const parsedImgs = JSON.parse(proj.images);
          if (Array.isArray(parsedImgs)) {
            setProjectImages(parsedImgs);
          } else {
            setProjectImages([]);
          }
        } catch (e) {
          console.error("Error parsing images field:", e);
          setProjectImages([]);
        }
      } else {
        setProjectImages([]);
      }

      if (proj.documents) {
        try {
          const parsedDocs = typeof proj.documents === 'string' ? JSON.parse(proj.documents) : proj.documents;
          if (Array.isArray(parsedDocs)) {
            setProjectDocuments(parsedDocs);
          } else {
            setProjectDocuments([]);
          }
        } catch (e) {
          console.error("Error parsing documents field:", e);
          setProjectDocuments([]);
        }
      } else {
        setProjectDocuments([]);
      }

      // 2. Fetch all metadata dropdowns + taxonomy
      const [themesRes, subThemesRes, targetGroupsRes, activityTypesRes, agenciesRes, fundingRes, statesRes, statusesRes, sdgsRes, taxonomyRes] = await Promise.all([
        axios.get("http://localhost:5000/themes"),
        axios.get("http://localhost:5000/subthemes"),
        axios.get("http://localhost:5000/targetgroups"),
        axios.get("http://localhost:5000/activitytypes"),
        axios.get("http://localhost:5000/agencies"),
        axios.get("http://localhost:5000/fundingsources"),
        axios.get("http://localhost:5000/states"),
        axios.get("http://localhost:5000/statuses"),
        axios.get("http://localhost:5000/sdgs"),
        axios.get("http://localhost:5000/taxonomy")
      ]);

      setThemes(themesRes.data.data || themesRes.data);
      setSubThemes(subThemesRes.data);
      setTargetGroups(targetGroupsRes.data);
      setActivityTypes(activityTypesRes.data);
      setAgencies(agenciesRes.data);
      setFundingSources(fundingRes.data);
      setStates(statesRes.data);
      setStatuses(statusesRes.data.filter(s => s.status_name === 'Pending' || s.status_name === 'Ongoing'));
      setSdgs(sdgsRes.data);
      setTaxonomy(taxonomyRes.data.data?.themes || []);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load project details.");
      setLoading(false);
    }
  };

  // Triggered when editing project details is submitted
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    const agencyVal = agencySelect === "custom" ? customAgency : agencySelect;
    const fundingVal = fundingSelect === "custom" ? customFunding : fundingSelect;
    const fundingVal2 = fundingSelect2 === "custom" ? customFunding2 : fundingSelect2;

    const resolvedStates = selectedStates.map(stObj => {
      return stObj.state_id === "custom" ? stObj.custom_name : stObj.state_id;
    }).filter(Boolean);

    try {
      await axios.put(`http://localhost:5000/projects/${id}`, {
        project_name: editName,
        agency: agencyVal,
        year: editYear,
        funding_source: fundingVal,
        funding_source2: fundingVal2,
        approval_date: editApprovalDate || null,
        sanctioned_amount: editSanctionedAmount || null,
        status_id: editStatusId || null,
        state: resolvedStates,
        remarks: editRemarks,
        funding_type: editFundingType || null,
        donor_agency_name: editDonorAgencyName || null,
        donor_category: editDonorCategory || null,
        duration_months: editDurationMonths ? Number(editDurationMonths) : null,
        district: editDistrict || null,
        block_village_ulb: editBlockVillageUlb || null,
        doc_no: editDocNo || null
      });
      setIsEditing(false);
      loadData();
    } catch (err) {
      console.error("Update Error:", err);
      alert(err.response?.data?.message || "Failed to update project details");
    }
  };

  const handleAddTargetGroup = (e) => {
    const val = Number(e.target.value);
    if (!val) return;
    if (!selectedTargetGroups.includes(val)) {
      setSelectedTargetGroups([...selectedTargetGroups, val]);
    }
    e.target.value = "";
  };

  const handleRemoveTargetGroup = (tgId) => {
    setSelectedTargetGroups(selectedTargetGroups.filter(x => x !== tgId));
  };

  const handleAddActivityType = (e) => {
    const val = Number(e.target.value);
    if (!val) return;
    if (!selectedActivityTypes.includes(val)) {
      setSelectedActivityTypes([...selectedActivityTypes, val]);
    }
    e.target.value = "";
  };

  const handleRemoveActivityType = (atId) => {
    setSelectedActivityTypes(selectedActivityTypes.filter(x => x !== atId));
  };

  // Save classifications to DB
  const saveClassification = async () => {
    try {
      const activeThemes = [];
      selectedThemes.forEach(t => {
        if (!t.themeId) return;
        t.subThemes.forEach(st => {
          activeThemes.push({
            themeId: Number(t.themeId),
            category: st.category || null,
            subCategory: st.subCategory || null,
            activity: st.activity || null,
            subThemeIds: [] // kept for legacy compat
          });
        });
      });

      if (activeThemes.length === 0) {
        alert("Please select at least one Theme.");
        return;
      }

      const response = await axios.post(`http://localhost:5000/classify-project/${id}`, {
        themes: activeThemes,
        targetGroupIds: selectedTargetGroups,
        activityTypeIds: selectedActivityTypes,
        sdgIds: selectedSdgs,
        projectSummary: projectSummary,
        beneficiaryGroups: selectedBeneficiaries.map(x => x.mainGroup).filter(Boolean),
        beneficiaryCat1: selectedBeneficiaries.flatMap(x => x.subGroups || []).filter(Boolean),
        beneficiaryCat2: [],
        beneficiaryCat3: [],
        beneficiaryCat4: [],
        ageGroups: [],
        areaType: areaType,
        ruralSubtype: ruralSubtype,
        urbanSubtype: urbanSubtype,
        settlementDetail: settlementDetail,
        geographyNotes: geographyNotes,
        beneficiaryCounts: beneficiaryCounts,
        totalBeneficiaries: totalBeneficiaries,
        directBeneficiaries: directBeneficiaries,
        indirectBeneficiaries: indirectBeneficiaries,
        beneficiariesMale: beneficiariesMale,
        beneficiariesFemale: beneficiariesFemale,
        beneficiariesBoys: beneficiariesBoys,
        beneficiariesGirls: beneficiariesGirls,
        outcomeImpactNotes: outcomeImpactNotes,
        images: projectImages,
        documents: projectDocuments
      });

      alert(response.data.message);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress size={45} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">Error: {error || "Project not found"}</Alert>
      </Box>
    );
  }



  return (
    <Box sx={{ flexGrow: 1, p: 1, maxWidth: "1000px", mx: "auto" }}>

      {/* Upper header bar */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate("/projects")}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          Back to Projects
        </Button>
        <Button
          variant="contained"
          startIcon={isEditing ? <CloseIcon /> : <EditIcon />}
          color={isEditing ? "inherit" : "primary"}
          onClick={() => setIsEditing(!isEditing)}
          sx={{ textTransform: "none", fontWeight: "bold" }}
        >
          {isEditing ? "Cancel Edit" : "Edit Core Details"}
        </Button>
      </Stack>

      {isEditing ? (
        // ------------------ EDIT FORM MODE ------------------
        <Paper sx={{ p: 4, mb: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 3, color: "#1e293b" }}>
            Edit Project Core Details
          </Typography>
          <Box component="form" onSubmit={handleUpdateDetails}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "text.secondary" }}>Basic Details</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth label="Project Name" required value={editName} onChange={(e) => setEditName(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Document Number / Doc No." value={editDocNo} onChange={(e) => setEditDocNo(e.target.value)} />
              </Grid>

              <Grid size={12}>
                <FormControl fullWidth>
                  <InputLabel>Donor Agency</InputLabel>
                  <Select value={agencySelect} label="Donor Agency" onChange={(e) => setAgencySelect(e.target.value)}>
                    <MenuItem value="">Select Donor Agency</MenuItem>
                    {agencies.map(a => <MenuItem key={a.agency_id} value={a.agency_id}>{a.agency_name}</MenuItem>)}
                    <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New Donor Agency</MenuItem>
                  </Select>
                </FormControl>
                {agencySelect === "custom" && (
                  <TextField fullWidth label="Custom Donor Agency Name" required size="small" sx={{ mt: 2 }} value={customAgency} onChange={(e) => setCustomAgency(e.target.value)} />
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Financial Year" value={editYear} onChange={(e) => setEditYear(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Approval Date" type="date" slotProps={{ inputLabel: { shrink: true } }} value={editApprovalDate} onChange={(e) => setEditApprovalDate(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Sanctioned Amount (Rs.)" type="number" value={editSanctionedAmount} onChange={(e) => setEditSanctionedAmount(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Implementation Status</InputLabel>
                  <Select value={editStatusId} label="Implementation Status" onChange={(e) => setEditStatusId(e.target.value)}>
                    <MenuItem value="">Select Status</MenuItem>
                    {statuses.map(s => <MenuItem key={s.status_id} value={s.status_id}>{s.status_name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Duration (in Months)" type="number" value={editDurationMonths} onChange={(e) => setEditDurationMonths(e.target.value)} />
              </Grid>

              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "text.secondary", mt: 1 }}>Funding & Donor Details</Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Funding Source</InputLabel>
                  <Select value={fundingSelect} label="Funding Source" onChange={(e) => setFundingSelect(e.target.value)}>
                    <MenuItem value="">Select Funding Source</MenuItem>
                    {fundingSources.map(f => <MenuItem key={f.funding_source_id} value={f.funding_source_id}>{f.source_name}</MenuItem>)}
                    <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New Funding Source</MenuItem>
                  </Select>
                </FormControl>
                {fundingSelect === "custom" && (
                  <TextField fullWidth label="Custom Funding Source" required size="small" sx={{ mt: 2 }} value={customFunding} onChange={(e) => setCustomFunding(e.target.value)} />
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Funding Source 2</InputLabel>
                  <Select value={fundingSelect2} label="Funding Source 2" onChange={(e) => setFundingSelect2(e.target.value)}>
                    <MenuItem value="">Select Funding Source 2</MenuItem>
                    {fundingSources.map(f => <MenuItem key={f.funding_source_id} value={f.funding_source_id}>{f.source_name}</MenuItem>)}
                    <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New Funding Source 2</MenuItem>
                  </Select>
                </FormControl>
                {fundingSelect2 === "custom" && (
                  <TextField fullWidth label="Custom Funding Source 2" required size="small" sx={{ mt: 2 }} value={customFunding2} onChange={(e) => setCustomFunding2(e.target.value)} />
                )}
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Funding Type</InputLabel>
                  <Select value={editFundingType} label="Funding Type" onChange={(e) => setEditFundingType(e.target.value)}>
                    <MenuItem value="">Select Funding Type</MenuItem>
                    {["Grant", "Donation", "CSR", "Government", "Other"].map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Donor Agency Name" value={editDonorAgencyName} onChange={(e) => setEditDonorAgencyName(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Donor Category</InputLabel>
                  <Select value={editDonorCategory} label="Donor Category" onChange={(e) => setEditDonorCategory(e.target.value)}>
                    <MenuItem value="">Select Donor Category</MenuItem>
                    {["Corporate", "Individual", "Trust/Foundation", "Government Agency", "International Donor", "Other"].map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "text.secondary", mt: 1 }}>Geography & Location</Typography>
              </Grid>

              <Grid size={12}>
                <Typography variant="caption" sx={{ fontWeight: "bold", mb: 1, color: "#475569", display: "block" }}>
                  Select States *
                </Typography>
                {selectedStates.map((stObj, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: "center" }}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <FormControl fullWidth required>
                        <InputLabel>State</InputLabel>
                        <Select
                          value={stObj.state_id}
                          label="State"
                          onChange={(e) => handleStateChange(index, "state_id", e.target.value)}
                        >
                          <MenuItem value="">Select State</MenuItem>
                          {states.map((s) => (
                            <MenuItem key={s.state_id} value={s.state_id}>{s.state_name}</MenuItem>
                          ))}
                          <MenuItem value="custom" sx={{ color: "#3b82f6", fontWeight: "bold" }}>+ Add New State</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      {stObj.state_id === "custom" && (
                        <TextField
                          fullWidth
                          label="Custom State Name"
                          required
                          size="small"
                          value={stObj.custom_name}
                          onChange={(e) => handleStateChange(index, "custom_name", e.target.value)}
                        />
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      {selectedStates.length > 1 && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveStateRow(index)}
                          sx={{ textTransform: "none", fontWeight: "bold" }}
                        >
                          Remove
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                ))}
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={handleAddStateRow}
                  sx={{ textTransform: "none", fontWeight: "bold", mt: 1 }}
                >
                  + Add Another State
                </Button>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="District" value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Block / Village / ULB" value={editBlockVillageUlb} onChange={(e) => setEditBlockVillageUlb(e.target.value)} />
              </Grid>

              <Grid size={12}>
                <TextField fullWidth multiline rows={3} label="Remarks" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} />
              </Grid>

              <Grid size={12}>
                <Button type="submit" variant="contained" color="success" startIcon={<SaveIcon />} sx={{ textTransform: "none", fontWeight: "bold" }}>
                  Save Core Details
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      ) : (
        // ------------------ VIEW DETAILS MODE ------------------
        <Card sx={{ p: 2, mb: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", position: "relative" }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: "bold", color: "#1e293b", mb: 0.5 }}>
                  {project.project_name}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Project ID: #{project.project_id} | Doc No: {project.doc_no || "N/A"}
                </Typography>
              </Box>
              <Chip
                icon={project.classification_status === "Completed" ? <CompleteIcon /> : <PendingIcon />}
                label={project.classification_status}
                color={project.classification_status === "Completed" ? "success" : "warning"}
                sx={{ fontWeight: "bold" }}
              />
            </Box>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Donor Agency</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.agency_name || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Financial Year</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.year || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>State Location</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.state_name || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Funding Source</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.funding_source || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Funding Source 2</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.funding_source2 || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Approval Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>
                  {project.approval_date ? new Date(project.approval_date).toLocaleDateString() : "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Sanctioned Amount</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>
                  {project.sanctioned_amount ? `Rs. ${Number(project.sanctioned_amount).toLocaleString()}` : "-"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Funding Type</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.funding_type || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Donor Agency Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.donor_agency_name || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Donor Category</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.donor_category || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Duration (Months)</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.duration_months ? `${project.duration_months} Months` : "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>District</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.district || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Block / Village / ULB</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.block_village_ulb || "-"}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Implementation Status</Typography>
                <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155" }}>{project.project_status || "-"}</Typography>
              </Grid>
            </Grid>

            {(project.total_beneficiaries !== null || project.outcome_impact_notes) && (
              <Box sx={{ mt: 3, p: 2, border: "1px dashed #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#475569", mb: 1 }}>Output Scale & Outcomes</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Total Beneficiaries</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>{project.total_beneficiaries ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Direct Beneficiaries</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>{project.direct_beneficiaries ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Indirect Beneficiaries</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>{project.indirect_beneficiaries ?? "-"}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Male / Female / Boys / Girls</Typography>
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>
                      {project.beneficiaries_male ?? 0} M / {project.beneficiaries_female ?? 0} F / {project.beneficiaries_boys ?? 0} B / {project.beneficiaries_girls ?? 0} G
                    </Typography>
                  </Grid>
                  {project.outcome_impact_notes && (
                    <Grid size={12}>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>Outcome / Impact Notes</Typography>
                      <Typography variant="body2" sx={{ color: "#334155" }}>{project.outcome_impact_notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {project.remarks && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Remarks</Typography>
                <Typography variant="body2" sx={{ color: "#334155" }}>{project.remarks}</Typography>
              </Box>
            )}

            {projectImages && projectImages.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#475569", mb: 2 }}>Project Images</Typography>
                <Grid container spacing={2}>
                  {projectImages.map((img, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                      <Paper sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fff" }}>
                        <img 
                          src={img.url} 
                          alt={img.remarks || `Project Image ${idx + 1}`} 
                          style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "4px" }} 
                        />
                        {img.remarks && (
                          <Typography variant="caption" sx={{ display: "block", mt: 1, textAlign: "center", color: "text.secondary", fontWeight: "500" }}>
                            {img.remarks}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ------------------ CLASSIFICATION INTERFACE ------------------ */}
      <Paper sx={{ p: 4, borderRadius: "12px", boxShadow: "0 4px 6px rgba(15, 23, 42, 0.05)", mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#1e293b" }}>
              Assign Project Classification
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Categorize the NGO project by selecting its primary theme and adding sub-themes, target beneficiaries, and activity types.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AiIcon />}
            onClick={fetchAiSuggestion}
            disabled={aiLoading}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "8px",
              backgroundColor: "#8b5cf6",
              "&:hover": { backgroundColor: "#7c3aed" }
            }}
          >
            {aiLoading ? <CircularProgress size={20} color="inherit" /> : "🤖 Get AI Suggestion"}
          </Button>
        </Box>

        {aiSuggestion && (
          <Box sx={{ mb: 4, p: 3, border: "1px solid #ddd6fe", borderRadius: "12px", backgroundColor: "#f5f3ff" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#6d28d9", display: "flex", alignItems: "center", gap: 1 }}>
                <AiIcon /> AI Suggested Classifications
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: "600", color: "#4c1d95" }}>
                  Overall Confidence:
                </Typography>
                <Chip
                  label={`${aiSuggestion.confidence}%`}
                  color={aiSuggestion.confidence >= 70 ? "success" : "warning"}
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
              </Stack>
            </Box>

            {aiSuggestion.confidence < 70 && (
              <Alert severity="warning" sx={{ mb: 3, borderRadius: "8px", fontWeight: "600" }}>
                Needs Manual Review (Confidence score is below 70%)
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Theme Suggestion (Confidence: {aiSuggestion.themeConfidence}%)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: "600", color: "#334155", mt: 0.5 }}>
                    {aiSuggestion.themeName || themes.find(t => t.theme_id === aiSuggestion.themeId)?.theme_name || "None"}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Sub-Themes Suggestion (Confidence: {aiSuggestion.subThemeConfidence}%)</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {aiSuggestion.subThemeIds.length === 0 ? "-" : aiSuggestion.subThemeIds.map(stId => {
                      const st = subThemes.find(x => x.sub_theme_id === stId);
                      return st ? <Chip key={stId} label={st.sub_theme_name} size="small" variant="outlined" /> : null;
                    })}
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Target Groups Suggestion (Confidence: {aiSuggestion.targetGroupConfidence}%)</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {aiSuggestion.targetGroupIds.length === 0 ? "-" : aiSuggestion.targetGroupIds.map(tgId => {
                      const tg = targetGroups.find(x => x.target_group_id === tgId);
                      return tg ? <Chip key={tgId} label={`${tg.main_group} - ${tg.sub_group}`} size="small" variant="outlined" /> : null;
                    })}
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Paper sx={{ p: 2, borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>Activity Types Suggestion (Confidence: {aiSuggestion.activityConfidence}%)</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                    {aiSuggestion.activityTypeIds.length === 0 ? "-" : aiSuggestion.activityTypeIds.map(atId => {
                      const at = activityTypes.find(x => x.activity_type_id === atId);
                      return at ? <Chip key={atId} label={at.activity_type_name} size="small" variant="outlined" /> : null;
                    })}
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                if (aiSuggestion.themeId) {
                  setSelectedThemes([{
                    themeId: aiSuggestion.themeId,
                    subThemes: [{ category: "", subCategory: "", activity: "" }]
                  }]);
                }
                setSelectedTargetGroups(aiSuggestion.targetGroupIds || []);
                setSelectedActivityTypes(aiSuggestion.activityTypeIds || []);
              }}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: "8px",
                backgroundColor: "#7c3aed",
                "&:hover": { backgroundColor: "#6d28d9" }
              }}
            >
              Accept AI Suggestions & Auto-Fill
            </Button>
          </Box>
        )}

        <Grid container spacing={4}>
          {/* Multiple Themes & Subthemes */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              1. Thematic Areas & Sub-Themes
            </Typography>
            {selectedThemes.map((t, index) => {
              return (
                <Paper
                  key={index}
                  sx={{
                    p: 3, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: "12px",
                    position: "relative",
                    background: "linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)",
                    boxShadow: "0 1px 4px rgba(15,23,42,0.06)"
                  }}
                >
                  {selectedThemes.length > 1 && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => handleRemoveThemeRow(index)}
                      sx={{ position: "absolute", right: 10, top: 10, textTransform: "none", fontWeight: "bold", fontSize: "12px" }}
                    >
                      ✕ Remove Block
                    </Button>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#0f766e" }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#0f766e" }}>
                      Theme Block #{index + 1}
                    </Typography>
                  </Box>

                  <Grid container spacing={2.5}>
                    {/* Level 1: Primary Theme */}
                    <Grid size={12}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 0.5 }}>
                        Level 1 — Primary Theme *
                      </Typography>
                      <Autocomplete
                        options={themes}
                        getOptionLabel={(option) => option.theme_name || ""}
                        value={themes.find(th => th.theme_id === Number(t.themeId)) || null}
                        onChange={(_, newValue) => handleThemeChange(index, newValue ? newValue.theme_id : "")}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Search and select a primary theme..."
                            size="small"
                            required
                            sx={{ "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Subtheme Paths under this Theme */}
                    {t.themeId && (
                      <Grid size={12}>
                        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
                          {t.subThemes.map((st, subIndex) => {
                            // Derive taxonomy options by cascading
                            const taxonomyTheme = taxonomy.find(tx => tx.id === Number(t.themeId));
                            const categoryOptions = taxonomyTheme ? taxonomyTheme.categories.map(c => c.name) : [];

                            const taxonomyCategory = taxonomyTheme?.categories.find(c => c.name === st.category);
                            const subCategoryOptions = taxonomyCategory ? taxonomyCategory.subCategories.map(sc => sc.name) : [];

                            const taxonomySubCat = taxonomyCategory?.subCategories.find(sc => sc.name === st.subCategory);
                            const activityOptions = taxonomySubCat ? taxonomySubCat.activities : [];

                            return (
                              <Paper
                                key={subIndex}
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  borderRadius: "8px",
                                  backgroundColor: "background.paper",
                                  borderColor: "#cbd5e1",
                                  position: "relative"
                                }}
                              >
                                {t.subThemes.length > 1 && (
                                  <Button
                                    variant="text"
                                    color="error"
                                    onClick={() => handleRemoveSubThemePath(index, subIndex)}
                                    sx={{ position: "absolute", right: 10, top: 10, textTransform: "none", fontWeight: "bold", fontSize: "11px" }}
                                  >
                                    ✕ Remove Subtheme
                                  </Button>
                                )}

                                <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: "bold", display: "block", mb: 2 }}>
                                  Subtheme Path #{subIndex + 1}
                                </Typography>

                                <Grid container spacing={2}>
                                  {/* Level 2: Category */}
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: "600", display: "block", mb: 0.5 }}>
                                      Category (Subtheme 1)
                                    </Typography>
                                    <Autocomplete
                                      options={categoryOptions}
                                      value={st.category || null}
                                      onChange={(_, newValue) => handleCategoryChange(index, subIndex, newValue || "")}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          placeholder="Select Category..."
                                          size="small"
                                        />
                                      )}
                                    />
                                  </Grid>

                                  {/* Level 3: Sub-category */}
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="caption" sx={{ color: st.category ? "#64748b" : "#cbd5e1", fontWeight: "600", display: "block", mb: 0.5 }}>
                                      Sub-category (Subtheme 2)
                                    </Typography>
                                    <Autocomplete
                                      disabled={!st.category}
                                      options={subCategoryOptions}
                                      value={st.subCategory || null}
                                      onChange={(_, newValue) => handleSubCategoryChange(index, subIndex, newValue || "")}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          placeholder="Select Sub-category..."
                                          size="small"
                                        />
                                      )}
                                    />
                                  </Grid>

                                  {/* Level 4: Activity / Intervention */}
                                  <Grid size={12}>
                                    <Typography variant="caption" sx={{ color: st.subCategory ? "#64748b" : "#cbd5e1", fontWeight: "600", display: "block", mb: 0.5 }}>
                                      Activity / Intervention (Subtheme 3)
                                    </Typography>
                                    <Autocomplete
                                      disabled={!st.subCategory}
                                      options={activityOptions}
                                      value={st.activity || null}
                                      onChange={(_, newValue) => handleActivityChange(index, subIndex, newValue || "")}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          placeholder="Select Activity..."
                                          size="small"
                                        />
                                      )}
                                    />
                                  </Grid>

                                  {/* Path Breadcrumb summary */}
                                  {(st.category || st.subCategory || st.activity) && (
                                    <Grid size={12}>
                                      <Typography variant="caption" sx={{ color: "#166534", fontWeight: "600" }}>
                                        📍 Selected Path: {[
                                          themes.find(th => th.theme_id === Number(t.themeId))?.theme_name,
                                          st.category,
                                          st.subCategory,
                                          st.activity
                                        ].filter(Boolean).join(" → ")}
                                      </Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </Paper>
                            );
                          })}

                          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="secondary"
                              onClick={() => handleAddSubThemePath(index)}
                              sx={{ textTransform: "none", fontWeight: "bold" }}
                            >
                              + Add another subtheme path under this theme
                            </Button>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              );
            })}
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddThemeRow}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              + Add Another Theme Block
            </Button>
          </Grid>



          {/* Beneficiary Groups & Categories */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              2. Target Beneficiary Details
            </Typography>
            {selectedBeneficiaries.map((bg, index) => (
              <Paper key={index} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: "8px", position: "relative" }}>
                {selectedBeneficiaries.length > 1 && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => handleRemoveBeneficiaryRow(index)}
                    sx={{ position: "absolute", right: 10, top: 10, textTransform: "none", fontWeight: "bold" }}
                  >
                    Remove Block
                  </Button>
                )}
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, color: "#0f766e" }}>
                  Beneficiary Group #{index + 1}
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Main Target Group</InputLabel>
                      <Select
                        value={bg.mainGroup}
                        label="Main Target Group"
                        onChange={(e) => handleBeneficiaryMainChange(index, e.target.value)}
                      >
                        <MenuItem value="">Select Main Target Group</MenuItem>
                        {Object.keys(TARGET_GROUPS_MAPPING).map((group) => (
                          <MenuItem key={group} value={group}>{group}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Autocomplete
                      multiple
                      disabled={!bg.mainGroup}
                      options={bg.mainGroup ? TARGET_GROUPS_MAPPING[bg.mainGroup] : []}
                      getOptionLabel={(option) => option}
                      value={bg.subGroups || []}
                      onChange={(event, newValue) => {
                        handleBeneficiarySubChange(index, newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Sub-target groups"
                          placeholder="Select sub-target groups..."
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddBeneficiaryRow}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              + Add Target Beneficiary Group
            </Button>
          </Grid>

          {/* Beneficiary Counting Details */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              3. Beneficiary Counting Format
            </Typography>
            {beneficiaryCounts.map((bc, index) => (
              <Paper key={index} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: "8px", position: "relative" }}>
                {beneficiaryCounts.length > 1 && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => handleRemoveBeneficiaryCountRow(index)}
                    sx={{ position: "absolute", right: 10, top: 10, textTransform: "none", fontWeight: "bold" }}
                  >
                    Remove Row
                  </Button>
                )}
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2, color: "#0f766e" }}>
                  Counting Profile #{index + 1}
                </Typography>
                <Grid container spacing={2}>
                  {/* Beneficiary Type */}
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Beneficiary Type</InputLabel>
                      <Select
                        value={bc.type}
                        label="Beneficiary Type"
                        onChange={(e) => handleBeneficiaryCountChange(index, "type", e.target.value)}
                      >
                        <MenuItem value="">Select Type</MenuItem>
                        <MenuItem value="Direct">Direct</MenuItem>
                        <MenuItem value="Indirect">Indirect</MenuItem>
                        <MenuItem value="Both">Both</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Gender */}
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={bc.gender}
                        label="Gender"
                        onChange={(e) => handleBeneficiaryCountChange(index, "gender", e.target.value)}
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Boy">Boy</MenuItem>
                        <MenuItem value="Girl">Girl</MenuItem>
                        <MenuItem value="Transgender">Transgender</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                        <MenuItem value="Not specified">Not specified</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Age Group */}
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Age Group</InputLabel>
                      <Select
                        value={bc.ageGroup}
                        label="Age Group"
                        onChange={(e) => handleBeneficiaryCountChange(index, "ageGroup", e.target.value)}
                      >
                        <MenuItem value="">Select Age Group</MenuItem>
                        <MenuItem value="0-6">0-6</MenuItem>
                        <MenuItem value="6-14">6-14</MenuItem>
                        <MenuItem value="15-18">15-18</MenuItem>
                        <MenuItem value="19-35">19-35</MenuItem>
                        <MenuItem value="36-59">36-59</MenuItem>
                        <MenuItem value="60+">60+</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Education Stage */}
                  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Education Stage</InputLabel>
                      <Select
                        value={bc.educationStage}
                        label="Education Stage"
                        onChange={(e) => handleBeneficiaryCountChange(index, "educationStage", e.target.value)}
                      >
                        <MenuItem value="">Select Education Stage</MenuItem>
                        <MenuItem value="ECCE">ECCE</MenuItem>
                        <MenuItem value="primary">primary</MenuItem>
                        <MenuItem value="upper primary">upper primary</MenuItem>
                        <MenuItem value="secondary">secondary</MenuItem>
                        <MenuItem value="senior secondary">senior secondary</MenuItem>
                        <MenuItem value="higher education">higher education</MenuItem>
                        <MenuItem value="non-formal education">non-formal education</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Vulnerability */}
                  <Grid size={{ xs: 12, sm: 12, md: 2.4 }}>
                    <Autocomplete
                      multiple
                      options={["Tribal", "SC", "ST", "OBC", "minority", "disability", "migrant", "BPL", "single parent household"]}
                      value={bc.vulnerabilities || []}
                      onChange={(event, newValue) => handleBeneficiaryCountChange(index, "vulnerabilities", newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Vulnerability"
                          placeholder="Select..."
                          size="small"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button
              variant="outlined"
              color="primary"
              onClick={handleAddBeneficiaryCountRow}
              sx={{ textTransform: "none", fontWeight: "bold", mb: 3 }}
            >
              + Add Counting Row
            </Button>
          </Grid>

          {/* Geography Tagging */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              4. Geography Tagging
            </Typography>
            <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: "8px" }}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Area Type</InputLabel>
                    <Select
                      value={areaType}
                      label="Area Type"
                      onChange={(e) => {
                        const val = e.target.value;
                        setAreaType(val);
                        if (val !== "Rural" && val !== "Both") setRuralSubtype("");
                        if (val !== "Urban" && val !== "Both") setUrbanSubtype("");
                      }}
                    >
                      <MenuItem value="">Select Area Type</MenuItem>
                      <MenuItem value="Rural">Rural</MenuItem>
                      <MenuItem value="Urban">Urban</MenuItem>
                      <MenuItem value="Peri-urban">Peri-urban</MenuItem>
                      <MenuItem value="Both">Both</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small" disabled={areaType !== "Rural" && areaType !== "Both"}>
                    <InputLabel>Rural Subtype</InputLabel>
                    <Select
                      value={ruralSubtype}
                      label="Rural Subtype"
                      onChange={(e) => setRuralSubtype(e.target.value)}
                    >
                      <MenuItem value="">Select Rural Subtype</MenuItem>
                      <MenuItem value="Tribal">Tribal</MenuItem>
                      <MenuItem value="Non-tribal">Non-tribal</MenuItem>
                      <MenuItem value="Mixed">Mixed</MenuItem>
                      <MenuItem value="Both">Both</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{xs: 12, sm: 6, md: 3}}>
                  <FormControl fullWidth size="small" disabled={areaType !== "Urban" && areaType !== "Both"}>
                    <InputLabel>Urban Subtype</InputLabel>
                    <Select
                      value={urbanSubtype}
                      label="Urban Subtype"
                      onChange={(e) => setUrbanSubtype(e.target.value)}
                    >
                      <MenuItem value="">Select Urban Subtype</MenuItem>
                      <MenuItem value="Slum">Slum</MenuItem>
                      <MenuItem value="Non-slum">Non-slum</MenuItem>
                      <MenuItem value="Mixed">Mixed</MenuItem>
                      <MenuItem value="Both">Both</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Settlement Detail</InputLabel>
                    <Select
                      value={settlementDetail}
                      label="Settlement Detail"
                      onChange={(e) => setSettlementDetail(e.target.value)}
                    >
                      <MenuItem value="">Select Settlement</MenuItem>
                      <MenuItem value="Village">Village</MenuItem>
                      <MenuItem value="Gram Panchayat">Gram Panchayat</MenuItem>
                      <MenuItem value="Block">Block</MenuItem>
                      <MenuItem value="Town">Town</MenuItem>
                      <MenuItem value="Ward">Ward</MenuItem>
                      <MenuItem value="Municipality">Municipality</MenuItem>
                      <MenuItem value="District">District</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Geography Classification Notes"
                    placeholder="If multiple settings or slums are covered, specify details here (e.g. notified vs non-notified, specific GP names)..."
                    value={geographyNotes}
                    onChange={(e) => setGeographyNotes(e.target.value)}
                    helperText="Rule: If covers more than one setting, set Area to 'Both' and describe subtypes here."
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Output Scale */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              5. Output Scale
            </Typography>
            <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: "8px" }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="No. of Beneficiaries (Total)"
                    value={totalBeneficiaries}
                    onChange={(e) => setTotalBeneficiaries(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Direct Beneficiaries"
                    value={directBeneficiaries}
                    onChange={(e) => setDirectBeneficiaries(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Indirect Beneficiaries"
                    value={indirectBeneficiaries}
                    onChange={(e) => setIndirectBeneficiaries(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Male"
                    value={beneficiariesMale}
                    onChange={(e) => setBeneficiariesMale(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Female"
                    value={beneficiariesFemale}
                    onChange={(e) => setBeneficiariesFemale(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Boys"
                    value={beneficiariesBoys}
                    onChange={(e) => setBeneficiariesBoys(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    label="Girls"
                    value={beneficiariesGirls}
                    onChange={(e) => setBeneficiariesGirls(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Outcomes & Impact Notes */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              6. Outcomes & Impact Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Enter Outcome/Impact Notes"
              value={outcomeImpactNotes}
              onChange={(e) => setOutcomeImpactNotes(e.target.value)}
              placeholder="Describe the key achievements, target outcomes, or impact evaluation notes..."
            />
          </Grid>

          {/* SDGs */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              7. Sustainable Development Goals (SDGs)
            </Typography>
            <Autocomplete
              multiple
              options={sdgs}
              getOptionLabel={(option) => option ? `${option.sdg_code} - ${option.sdg_name}` : ""}
              value={sdgs.filter(s => selectedSdgs.includes(s.sdg_id))}
              onChange={(event, newValue) => {
                setSelectedSdgs(newValue.map(option => option.sdg_id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select SDG Goals"
                  placeholder="Choose SDGs..."
                  size="small"
                />
              )}
            />
          </Grid>

          {/* Activity Types */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              8. Activity Types
            </Typography>
            <Autocomplete
              multiple
              options={activityTypes.filter(at => !selectedActivityTypes.includes(at.activity_type_id))}
              getOptionLabel={(option) => option.activity_type_name || ""}
              value={activityTypes.filter(at => selectedActivityTypes.includes(at.activity_type_id))}
              onChange={(event, newValue) => {
                setSelectedActivityTypes(newValue.map(option => option.activity_type_id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Choose Activity Types"
                  placeholder="Select activity types..."
                  size="small"
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key || option.activity_type_id}
                      label={option.activity_type_name}
                      {...chipProps}
                      color="info"
                      variant="outlined"
                      size="small"
                    />
                  );
                })
              }
            />
          </Grid>

          {/* Project Summary */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              9. Project Summary
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Enter Project Summary / Abstract"
              value={projectSummary}
              onChange={(e) => setProjectSummary(e.target.value)}
              placeholder="Provide a detailed summary of the project goals, impact, and operations..."
            />
          </Grid>

          {/* Project Images */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              10. Project Images
            </Typography>
            <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: "8px", mb: 2 }}>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ textTransform: "none", fontWeight: "bold", height: "40px" }}
                  >
                    Upload Local Images
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Or enter Image URL"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddUrlImage}
                      sx={{ textTransform: "none", fontWeight: "bold", height: "40px" }}
                    >
                      Add
                    </Button>
                  </Stack>
                </Grid>
              </Grid>

              {projectImages.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 2 }}>
                  No images added to this project yet. Upload local files or add image URLs above.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {projectImages.map((img, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                      <Card variant="outlined" sx={{ p: 1, position: "relative" }}>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          onClick={() => handleRemoveImage(idx)}
                          sx={{
                            position: "absolute",
                            top: 5,
                            right: 5,
                            minWidth: 0,
                            width: "24px",
                            height: "24px",
                            p: 0,
                            borderRadius: "50%",
                            fontSize: "10px",
                            fontWeight: "bold"
                          }}
                        >
                          ✕
                        </Button>
                        <img
                          src={img.url}
                          alt={`Uploaded preview ${idx + 1}`}
                          style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "4px", marginBottom: "8px" }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Image description / remarks..."
                          value={img.remarks || ""}
                          onChange={(e) => handleImageRemarkChange(idx, e.target.value)}
                          sx={{ "& input": { fontSize: "12px" } }}
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Documents Upload Section */}
          <Grid size={12}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#1e293b", borderBottom: "2px solid #f1f5f9", pb: 1 }}>
              11. Project Documents (MOU, Agreements &amp; Other)
            </Typography>
            <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", borderRadius: "8px", mb: 2 }}>
              {/* Row 1: Type selector + local upload button */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={inputDocType}
                      label="Document Type"
                      onChange={(e) => setInputDocType(e.target.value)}
                    >
                      <MenuItem value="">Select Type</MenuItem>
                      {["MOU", "Agreement", "Proposal", "Report", "Budget", "Completion Certificate", "Letter", "Invoice", "Other"].map(t => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ textTransform: "none", fontWeight: "bold", height: "40px", borderStyle: "dashed" }}
                  >
                    📁 Upload Local Document (PDF, DOC, XLS, Image)
                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleDocumentUpload}
                    />
                  </Button>
                </Grid>
              </Grid>

              {/* Row 2: Name + URL + Add button */}
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Document Name"
                    value={inputDocName}
                    onChange={(e) => setInputDocName(e.target.value)}
                    placeholder="e.g. MOU with XYZ Foundation"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Or enter Document URL"
                    value={inputDocUrl}
                    onChange={(e) => setInputDocUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleAddDocUrl}
                    fullWidth
                    sx={{ textTransform: "none", fontWeight: "bold", height: "40px" }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>

              {/* Document List */}
              {projectDocuments.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    📄 No documents uploaded yet. Upload files or add document URLs above.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {projectDocuments.map((doc, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                        borderColor: "divider",
                        backgroundColor: "#f8fafc"
                      }}
                    >
                      <Box sx={{ fontSize: "28px", lineHeight: 1, flexShrink: 0 }}>
                        {doc.type === "MOU" || doc.type === "Agreement" ? "📝" :
                         doc.type === "Report" || doc.type === "Proposal" ? "📋" :
                         doc.type === "Budget" || doc.type === "Invoice" ? "💰" :
                         doc.type === "Completion Certificate" ? "🏆" : "📄"}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: "600", color: "#1e293b", wordBreak: "break-word" }}>
                            {doc.name}
                          </Typography>
                          <Chip label={doc.type || "Other"} size="small" color="primary" variant="outlined" sx={{ fontSize: "11px" }} />
                        </Box>
                        {doc.uploadedAt && (
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 1 }}>
                            Added: {new Date(doc.uploadedAt).toLocaleDateString("en-GB")}
                          </Typography>
                        )}
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Remarks / description..."
                          value={doc.remarks || ""}
                          onChange={(e) => handleDocRemarkChange(idx, e.target.value)}
                          sx={{ mb: 1, "& input": { fontSize: "12px" } }}
                        />
                        <Button
                          variant="text"
                          size="small"
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textTransform: "none", fontSize: "12px", p: 0, color: "#3b82f6" }}
                        >
                          🔗 View / Download
                        </Button>
                      </Box>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => handleRemoveDocument(idx)}
                        sx={{ minWidth: 0, width: "28px", height: "28px", p: 0, borderRadius: "50%", fontSize: "12px", fontWeight: "bold", flexShrink: 0, mt: 0.5 }}
                      >
                        ✕
                      </Button>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* Save Button */}
          <Grid size={12} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={saveClassification}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                py: 1.5,
                fontSize: "16px",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)"
              }}
            >
              Save Project Classification
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}