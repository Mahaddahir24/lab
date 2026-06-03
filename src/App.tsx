import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import html2pdf from "html2pdf.js";
import {
  ShieldCheck,
  Search,
  Printer,
  QrCode,
  Plus,
  Check,
  X,
  ShieldAlert,
  FileText,
  User,
  Calendar,
  Shield,
  RefreshCw,
  Eye,
  Building,
  Phone,
  Stethoscope,
  Info,
  Layers,
  Sparkles,
  FileDown,
  MapPin,
  ChevronRight,
  Edit2,
  Trash2,
  Database,
  Link2,
  Copy,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { PatientReport, LabTest } from "./types";
import { INITIAL_REPORTS } from "./data";

export function formatResultDate(dateStr: string): string {
  if (!dateStr) return "";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Try parsing YYYY-MM-DD first to avoid timezone shifts
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIndex = parseInt(match[2], 10) - 1;
    const day = match[3].padStart(2, "0");
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${months[monthIndex]} ${year}`;
    }
  }

  // Check if it is already in "DD mmm YYYY" format (e.g. "03 jun 2026" or "24 May 2026")
  const formattedMatch = dateStr.match(/^(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})$/);
  if (formattedMatch) {
    const day = formattedMatch[1].padStart(2, "0");
    const rawMonth = formattedMatch[2].toLowerCase();
    const monthIndex = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ].indexOf(rawMonth);
    const month =
      monthIndex !== -1
        ? months[monthIndex]
        : rawMonth.charAt(0).toUpperCase() + rawMonth.slice(1);
    const year = formattedMatch[3];
    return `${day} ${month} ${year}`;
  }

  // Fallback to standard Date object
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return dateStr;
  }

  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  const month = months[dateObj.getUTCMonth()];
  const year = dateObj.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

export default function App() {
  // Supabase Integration States
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [autoSync, setAutoSync] = useState(
    () => localStorage.getItem("supabase_autosync") === "true",
  );
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string | null>(
    null,
  );
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [showSupabasePanel, setShowSupabasePanel] = useState(false);

  const getSupabaseClient = () => supabase;

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setSupabaseError(null);
    setSupabaseStatusMsg(null);

    try {
      const { error } = await supabase
        .from("patient_reports")
        .select("id")
        .limit(1);

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message.includes("does not exist") ||
          error.message.includes('relation "patient_reports" does not exist')
        ) {
          setSupabaseError("CONNECTED_BUT_NO_TABLE");
          setIsSupabaseConnected(true);
        } else {
          setSupabaseError(error.message || "Failed to query database.");
          setIsSupabaseConnected(false);
        }
      } else {
        setIsSupabaseConnected(true);
        setSupabaseStatusMsg(
          "Kuxirnaanta waa guul! (Connection successful! Table is ready.)",
        );
      }
    } catch (err: any) {
      setSupabaseError(
        err?.message || "Xiriirka wuu guuldareystay. (Connection failed.)",
      );
      setIsSupabaseConnected(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const syncSingleRecord = async (report: PatientReport) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from("patient_reports").upsert({
        id: report.id,
        boono: report.boono || null,
        name: report.name,
        age: report.age,
        gender: report.gender,
        company: report.company || null,
        passportNo: report.passportNo || null,
        phone: report.phone || null,
        doctor: report.doctor || null,
        resultDate: report.resultDate || null,
        verified: report.verified !== false,
        token: report.token || null,
        tests: report.tests,
      });
    } catch (e) {
      console.error("Auto sync failed:", e);
    }
  };

  const deleteSingleRecord = async (id: string) => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.from("patient_reports").delete().eq("id", id);
    } catch (e) {
      console.error("Auto delete failed:", e);
    }
  };

  const handlePushToSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert(
        "Fadlan marka hore xiriiri Supabase! (Please connect Supabase first!)",
      );
      return;
    }

    setIsTestingConnection(true);
    setSupabaseStatusMsg("Sending data to Supabase...");
    let successCount = 0;
    let failCount = 0;

    try {
      for (const report of reports) {
        const { error } = await client.from("patient_reports").upsert({
          id: report.id,
          boono: report.boono || null,
          name: report.name,
          age: report.age,
          gender: report.gender,
          company: report.company || null,
          passportNo: report.passportNo || null,
          phone: report.phone || null,
          doctor: report.doctor || null,
          resultDate: report.resultDate || null,
          verified: report.verified !== false,
          token: report.token || null,
          tests: report.tests,
        });

        if (error) {
          console.error(`Failed to push report ${report.id}:`, error);
          failCount++;
        } else {
          successCount++;
        }
      }

      if (failCount === 0) {
        setSupabaseStatusMsg(
          `Dhammaan ${successCount} diiwaan ayaa loo diray Supabase! (All ${successCount} records successfully pushed!)`,
        );
      } else {
        setSupabaseStatusMsg(
          `Waxaa guul ku baryay ${successCount} diiwaan, halka ${failCount} ay ku guuldareysteen. (Pushed ${successCount} successfully, ${failCount} failed.)`,
        );
      }
    } catch (err: any) {
      setSupabaseError(
        `Cilad ayaa dhacday intii diiwaanka loo dirayay Supabase: ${err?.message || err}`,
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handlePullFromSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert(
        "Fadlan marka hore xiriiri Supabase! (Please connect Supabase first!)",
      );
      return;
    }

    setIsTestingConnection(true);
    setSupabaseStatusMsg("Retrieving records from Supabase...");

    try {
      const { data, error } = await client
        .from("patient_reports")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const mapped: PatientReport[] = data.map((row: any) => ({
          id: row.id,
          boono: row.boono || "",
          name: row.name,
          age: Number(row.age),
          gender: row.gender,
          company: row.company || "",
          passportNo: row.passportNo || "",
          phone: row.phone || "",
          doctor: row.doctor || "",
          resultDate: row.resultDate || "",
          verified: row.verified !== false,
          token: row.token || "",
          tests: Array.isArray(row.tests) ? row.tests : [],
        }));

        setReports(mapped);
        setSupabaseStatusMsg(
          `Waxaa laga soo jiiday ${mapped.length} diiwaan Supabase! (Successfully pulled ${mapped.length} records!)`,
        );
      } else {
        setSupabaseStatusMsg(
          "Ma jiraan wax diiwaan ah oo ku jira Supabase. (No records found in Supabase.)",
        );
      }
    } catch (err: any) {
      setSupabaseError(
        `Cilad ayaa dhacday intii laga soo jiidayay Supabase: ${err?.message || err}`,
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Auto connect on mount
  useEffect(() => {
    handleTestConnection();
  }, []);

  // Load reports from LocalStorage or use preloaded dataset
  const [reports, setReports] = useState<PatientReport[]>(() => {
    const saved = localStorage.getItem("medilab_reports");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing stored reports, using defaults.", e);
      }
    }
    return INITIAL_REPORTS;
  });

  // Save to LocalStorage whenever reports change
  useEffect(() => {
    localStorage.setItem("medilab_reports", JSON.stringify(reports));
  }, [reports]);

  // Terminal States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("1876");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stampUrl, setStampUrl] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState(
    () =>
      localStorage.getItem("medilab_custom_base_url") || window.location.origin,
  );

  // Simulated Verification Authenticity Override (to show unverified states)
  const [verificationOverride, setVerificationOverride] = useState<
    Record<string, boolean>
  >({});
  const [isExporting, setIsExporting] = useState(false);

  // Form State for creating a new report
  const [newPatient, setNewPatient] = useState({
    id: "",
    boono: "",
    name: "",
    age: 35,
    gender: "Male" as "Male" | "Female" | "Other",
    company: "",
    passportNo: "",
    phone: "",
    doctor: "sadam adan Ahmed",
    resultDate: new Date().toISOString().split("T")[0],
    hcv: "Negative",
    hepB: "Negative",
    hiv: "Negative",
    tpha: "Negative",
    verified: true,
  });

  // Editing state
  const [editingReport, setEditingReport] = useState<PatientReport | null>(
    null,
  );
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState({
    id: "",
    boono: "",
    name: "",
    age: 35,
    gender: "Male" as "Male" | "Female" | "Other",
    company: "",
    passportNo: "",
    phone: "",
    doctor: "sadam adan Ahmed",
    resultDate: "",
    verified: true,
    hcv: "Negative",
    hepB: "Negative",
    hiv: "Negative",
    tpha: "Negative",
  });

  // Read Query Parameter on Mount & dynamic changes (e.g., QR scanner deep links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("id");
    const queryPassport = params.get("passport");
    const queryToken = params.get("token");

    if (queryToken) {
      const match = reports.find((r) => r.token === queryToken);
      if (match) {
        setSelectedReportId(match.id);
      }
    } else if (queryId) {
      const match = reports.find((r) => r.id === queryId);
      if (match) {
        setSelectedReportId(queryId);
      }
    } else if (queryPassport) {
      const match = reports.find(
        (r) => r.passportNo.toLowerCase() === queryPassport.toLowerCase(),
      );
      if (match) {
        setSelectedReportId(match.id);
      }
    }
  }, [reports]);

  // Handle setting parameters to support physical link testing directly
  const updateUrlParam = (report: PatientReport) => {
    const newUrl = `${window.location.origin}${window.location.pathname}?token=${report.token || "a3b8899c3a"}`;
    window.history.replaceState({ path: newUrl }, "", newUrl);
  };

  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    const match = reports.find((r) => r.id === id);
    if (match) {
      updateUrlParam(match);
    }
  };

  // Find dynamic patient active report
  const activeReport =
    reports.find((r) => r.id === selectedReportId) || reports[0];

  // Check if active report is verified
  const isCurrentlyVerified = activeReport
    ? verificationOverride[activeReport.id] !== false && activeReport.verified
    : false;

  const getAvatarColors = (name: string) => {
    const norm = (name || "").toUpperCase();
    if (norm.includes("MYKOLA")) {
      return { bg: "bg-[#eff6ff]", text: "text-[#3b82f6]" };
    } else if (norm.includes("SERGEY")) {
      return { bg: "bg-[#ecfdf5]", text: "text-[#10b981]" };
    } else if (norm.includes("HALIMA")) {
      return { bg: "bg-[#faf5ff]", text: "text-[#a855f7]" };
    } else {
      return { bg: "bg-[#eff6ff]", text: "text-[#3b82f6]" };
    }
  };

  // Filter passengers in terminal panel
  const filteredReports = reports.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.id.includes(query) ||
      r.passportNo.toLowerCase().includes(query) ||
      r.company.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalReportsCount = reports.length;
  const verifiedCount = reports.filter(
    (r) => verificationOverride[r.id] !== false && r.verified,
  ).length;

  // Dynamic document title update during printing to suggest correct patient name as the PDF filename
  useEffect(() => {
    const handleBeforePrint = () => {
      if (activeReport) {
        document.title = `${activeReport.name.trim().toUpperCase().replace(/\s+/g, " ")}`;
      }
    };
    const handleAfterPrint = () => {
      document.title = "Lab Verification Report";
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [activeReport]);

  const handlePrint = () => {
    const originalTitle = document.title;
    if (activeReport) {
      document.title = `${activeReport.name.trim().toUpperCase().replace(/\s+/g, " ")}`;
    }
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("laboratory-report-sheet");
    if (!element || !activeReport) return;

    setIsExporting(true);

    const filename = `${activeReport.name.trim().toUpperCase().replace(/\s+/g, " ")}.pdf`;

    // 1. Create a unique clone of our report sheet
    const clone = element.cloneNode(true) as HTMLElement;

    // 2. Wrap the clone inside a temporary absolute off-screen container.
    // This detaches the layout scaling from any narrow screen viewports or sidebar constraints.
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "800px";
    container.style.background = "#ffffff";
    container.style.color = "#000000";

    container.appendChild(clone);
    document.body.appendChild(container);

    // 3. Force clean inline styles on the clone suited for pristine single A4 page capture
    clone.style.width = "800px";
    clone.style.maxWidth = "800px";
    clone.style.minHeight = "auto"; // size naturally with the report contents
    clone.style.boxShadow = "none";
    clone.style.borderRadius = "0";
    clone.style.border = "none";
    clone.style.padding = "35px";
    clone.style.margin = "0";
    clone.style.background = "#ffffff";

    const opt = {
      margin: 0, // Margins are controlled via the @page rule
      filename: filename,
      image: { type: "jpeg", quality: 1 }, // High quality
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        windowWidth: 800, // Forces consistent render width
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    const exporter = (html2pdf as any).default || html2pdf;

    exporter()
      .set(opt)
      .from(clone)
      .save()
      .then(() => {
        // Clean up elements from DOM comfortably
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        setIsExporting(false);
      })
      .catch((error: any) => {
        console.error("PDF generation failed:", error);
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
        setIsExporting(false);
      });
  };

  const resetToFactoryDefault = () => {
    if (
      confirm(
        "Miyaad la hubtaa inaad dib u dhigto dhammaan diiwaannada Medilab? (Are you sure you want to reset records to original preloaded defaults?)",
      )
    ) {
      setReports(INITIAL_REPORTS);
      setVerificationOverride({});
      setSelectedReportId("1876");
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({ path: cleanUrl }, "", cleanUrl);
    }
  };

  const handleCreateReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.id || !newPatient.name) {
      alert(
        "Fadlan qor lambarka boortada iyo magaca (Please write the Patient ID and Name)",
      );
      return;
    }

    // Check duplicate ID
    if (reports.some((r) => r.id === newPatient.id)) {
      alert(
        "Lambarka ID-ga ee bukaanka mar hore ayaa la isticmaalay! (This Patient ID already exists!)",
      );
      return;
    }

    const created: PatientReport = {
      id: newPatient.id,
      boono: newPatient.boono.trim() || newPatient.id,
      name: newPatient.name.toUpperCase(),
      age: Number(newPatient.age),
      gender: newPatient.gender,
      company: newPatient.company.toUpperCase() || "PRIVATE CO",
      passportNo: newPatient.passportNo.toUpperCase() || "N/A",
      phone: newPatient.phone || "N/A",
      doctor: newPatient.doctor,
      resultDate: newPatient.resultDate,
      verified: newPatient.verified !== false,
      token: Math.random().toString(16).slice(2, 12),
      tests: [
        { name: "HCV", result: newPatient.hcv as any, unit: "test" },
        {
          name: "Hepatitis B Surface Antigen",
          result: newPatient.hepB as any,
          unit: "test",
        },
        { name: "HIV Test", result: newPatient.hiv as any, unit: "test" },
        { name: "TPHA", result: newPatient.tpha as any, unit: "test" },
      ],
    };

    setReports((prev) => [...prev, created]);
    setSelectedReportId(created.id);
    updateUrlParam(created);
    setShowCreateModal(false);

    if (autoSync) {
      syncSingleRecord(created);
    }

    // Reset Form fields
    setNewPatient({
      id: "",
      boono: "",
      name: "",
      age: 35,
      gender: "Male",
      company: "",
      passportNo: "",
      phone: "",
      doctor: "sadam adan Ahmed",
      resultDate: new Date().toISOString().split("T")[0],
      hcv: "Negative",
      hepB: "Negative",
      hiv: "Negative",
      tpha: "Negative",
      verified: true,
    });
  };

  const handleInlineEdit = (field: string, val: string) => {
    if (!activeReport) return;
    const cleanVal = val.trim();
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === activeReport.id) {
          const updated = { ...r };
          if (field === "id") {
            updated.id = cleanVal;
            setSelectedReportId(cleanVal);
          } else if (field === "name") {
            updated.name = cleanVal.toUpperCase();
          } else if (field === "age") {
            updated.age = Number(cleanVal) || r.age;
          } else if (field === "gender") {
            updated.gender = cleanVal as any;
          } else if (field === "company") {
            updated.company = cleanVal;
          } else if (field === "passport") {
            updated.passportNo = cleanVal;
          } else if (field === "phone") {
            updated.phone = cleanVal;
          } else if (field === "doctor") {
            updated.doctor = cleanVal;
          } else if (field === "date") {
            updated.resultDate = cleanVal;
          } else if (
            field === "hcv" ||
            field === "hepb" ||
            field === "hiv" ||
            field === "tpha"
          ) {
            const testNameMap: Record<string, string> = {
              hcv: "HCV",
              hepb: "Hepatitis B Surface Antigen",
              hiv: "HIV Test",
              tpha: "TPHA",
            };
            const targetName = testNameMap[field];
            updated.tests = r.tests.map((t) => {
              if (
                t.name.toLowerCase().includes(targetName.toLowerCase()) ||
                t.name === targetName
              ) {
                return { ...t, result: cleanVal as any };
              }
              return t;
            });
          }
          return updated;
        }
        return r;
      }),
    );
  };

  // Helper to extract test results or default to Negative as required
  const getTestResultVal = (report: PatientReport, nameKey: string): string => {
    if (!report || !report.tests) return "Negative";
    const found = report.tests.find((t) =>
      t.name.toLowerCase().includes(nameKey.toLowerCase()),
    );
    return found ? found.result : "Negative";
  };

  const handleStartEdit = (report: PatientReport) => {
    const hcv = getTestResultVal(report, "HCV");
    const hepB = getTestResultVal(report, "Hepatitis B");
    const hiv = getTestResultVal(report, "HIV");
    const tpha = getTestResultVal(report, "TPHA");

    setEditingReport(report);
    setEditPatientForm({
      id: report.id,
      boono: report.boono || report.id,
      name: report.name,
      age: report.age,
      gender: report.gender,
      company: report.company,
      passportNo: report.passportNo,
      phone: report.phone || "",
      doctor: report.doctor || "sadam adan Ahmed",
      resultDate: report.resultDate,
      verified: report.verified !== false,
      hcv: hcv,
      hepB: hepB,
      hiv: hiv,
      tpha: tpha,
    });
    setShowEditModal(true);
  };

  const handleEditReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    if (!editPatientForm.id || !editPatientForm.name) {
      alert(
        "Fadlan qor lambarka boortada iyo magaca (Please write Patient ID and Name)",
      );
      return;
    }

    // Check duplicate ID (if edited to a new one that isn't the original one)
    if (
      editPatientForm.id !== editingReport.id &&
      reports.some((r) => r.id === editPatientForm.id)
    ) {
      alert(
        "Lambarka ID-ga ee bukaanka mar hore ayaa la isticmaalay! (This Patient ID already exists!)",
      );
      return;
    }

    const updatedReports = reports.map((r) => {
      if (r.id === editingReport.id) {
        return {
          ...r,
          id: editPatientForm.id,
          boono: editPatientForm.boono.trim() || editPatientForm.id,
          name: editPatientForm.name.toUpperCase(),
          age: Number(editPatientForm.age),
          gender: editPatientForm.gender,
          company: editPatientForm.company.toUpperCase() || "PRIVATE CO",
          passportNo: editPatientForm.passportNo.toUpperCase() || "N/A",
          phone: editPatientForm.phone || "N/A",
          doctor: editPatientForm.doctor,
          resultDate: editPatientForm.resultDate,
          verified: editPatientForm.verified,
          tests: [
            { name: "HCV", result: editPatientForm.hcv as any, unit: "test" },
            {
              name: "Hepatitis B Surface Antigen",
              result: editPatientForm.hepB as any,
              unit: "test",
            },
            {
              name: "HIV Test",
              result: editPatientForm.hiv as any,
              unit: "test",
            },
            { name: "TPHA", result: editPatientForm.tpha as any, unit: "test" },
          ],
        };
      }
      return r;
    });

    setReports(updatedReports);

    if (selectedReportId === editingReport.id) {
      setSelectedReportId(editPatientForm.id);
    }

    const editedReport: PatientReport = {
      id: editPatientForm.id,
      boono: editPatientForm.boono.trim() || editPatientForm.id,
      name: editPatientForm.name.toUpperCase(),
      age: Number(editPatientForm.age),
      gender: editPatientForm.gender,
      company: editPatientForm.company.toUpperCase() || "PRIVATE CO",
      passportNo: editPatientForm.passportNo.toUpperCase() || "N/A",
      phone: editPatientForm.phone || "N/A",
      doctor: editPatientForm.doctor,
      resultDate: editPatientForm.resultDate,
      verified: editPatientForm.verified,
      tests: [
        { name: "HCV", result: editPatientForm.hcv as any, unit: "test" },
        {
          name: "Hepatitis B Surface Antigen",
          result: editPatientForm.hepB as any,
          unit: "test",
        },
        { name: "HIV Test", result: editPatientForm.hiv as any, unit: "test" },
        { name: "TPHA", result: editPatientForm.tpha as any, unit: "test" },
      ],
    };

    if (autoSync) {
      syncSingleRecord(editedReport);
      if (editPatientForm.id !== editingReport.id) {
        deleteSingleRecord(editingReport.id);
      }
    }

    setShowEditModal(false);
    setEditingReport(null);
  };

  const handleDeleteReport = (id: string, name: string) => {
    if (
      confirm(
        `Ma hubtaa inaad tirtirto bukaanka: ${name}? (Are you sure you want to delete patient: ${name}?)`,
      )
    ) {
      const remaining = reports.filter((r) => r.id !== id);
      setReports(remaining);
      if (selectedReportId === id) {
        if (remaining.length > 0) {
          setSelectedReportId(remaining[0].id);
          updateUrlParam(remaining[0]);
        } else {
          setSelectedReportId("");
        }
      }
      if (autoSync) {
        deleteSingleRecord(id);
      }
    }
  };

  // Generate dynamic QR code URL based on production host URL in Serverless HTML mode
  const hcvVal = activeReport
    ? getTestResultVal(activeReport, "HCV")
    : "Negative";
  const hepBVal = activeReport
    ? getTestResultVal(activeReport, "Hepatitis B")
    : "Negative";
  const hivVal = activeReport
    ? getTestResultVal(activeReport, "HIV")
    : "Negative";
  const tphaVal = activeReport
    ? getTestResultVal(activeReport, "TPHA")
    : "Negative";

  const verificationLink = activeReport
    ? `${customBaseUrl}/verify.html?id=${activeReport.id}&name=${encodeURIComponent(activeReport.name)}&age=${activeReport.age}&gender=${activeReport.gender}&company=${encodeURIComponent(activeReport.company)}&passport=${encodeURIComponent(activeReport.passportNo)}&phone=${activeReport.phone || ""}&doctor=${encodeURIComponent(activeReport.doctor || "sadam adan Ahmed")}&date=${encodeURIComponent(formatResultDate(activeReport.resultDate))}&hcv=${encodeURIComponent(hcvVal)}&hepb=${encodeURIComponent(hepBVal)}&hiv=${encodeURIComponent(hivVal)}&tpha=${encodeURIComponent(tphaVal)}&verified=${isCurrentlyVerified}`
    : "";

  const qrCodeUrl = verificationLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationLink)}&color=000000`
    : "";

  return (
    <div
      id="medilab-system-root"
      className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased overflow-x-hidden flex flex-col"
    >
      {/* SECURITY TERMINAL TOP BAR (NO-PRINT) */}
      <header className="no-print shrink-0 relative z-20 max-w-7xl w-full mx-auto px-4 pt-6">
        <div
          className="relative bg-[#f4f5f2] border border-slate-200/70 rounded-2xl shadow-md min-h-[120px] md:min-h-[160px]"
          style={{
            backgroundImage:
              "url('https://i.postimg.cc/4xrWCL5B/Labverication.png')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            backgroundColor: "#f4f5f2",
          }}
        >
          {/* Logo is positioned perfectly inside the container using contain sizing */}
        </div>
      </header>

      {/* DASHBOARD GRID CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* LEFT PANEL: ADMINISTRATION & SEARCH (NO-PRINT) */}
        <section
          id="terminal-control-side"
          className="no-print lg:col-span-5 xl:col-span-4 flex flex-col gap-6"
        >
          {/* STATION & VERIFICATION DETAILS (LEFT & RIGHT) */}
          <div className="flex items-center justify-between bg-white border border-slate-200/60 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl text-[#2563eb]">
                <MapPin className="w-4 h-4 text-[#2563eb]" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider leading-none mb-0.5">
                  Station
                </p>
                <p className="text-slate-800 font-black text-sm leading-tight">
                  Global
                </p>
              </div>
            </div>

            <div className="h-8 border-l border-slate-100"></div>

            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                <User className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider leading-none mb-0.5">
                  Total Verified
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-50 text-[#16a34a] font-black text-sm px-2.5 py-0.5 rounded-lg border border-emerald-100">
                    {verifiedCount} / {totalReportsCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & QUICK VERIFY CARD */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>🧑‍⚕️</span>
              <span>Search Patients</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter name or passport number"
                  className="w-full bg-white border border-[#e2e8f0] rounded-xl px-4 py-2.5 pl-11 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 transition-all font-sans shadow-sm"
                />
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 p-0.5 hover:bg-slate-100 rounded-full"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={resetToFactoryDefault}
                className="bg-white hover:bg-slate-100 border border-[#e2e8f0] px-4 py-2.5 text-[#2563eb] rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
                title="Reset local changes and restore original reports"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Reload</span>
              </button>
            </div>

            {/* CREATE NEW REPORT BUTTON */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#16a34a] hover:bg-[#dcfce7] font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Report</span>
            </button>

            {/* QUICK PASSENGER SELECTION LIST */}
            <div className="flex flex-col gap-3">
              {filteredReports.map((r) => {
                const isCurReport = r.id === activeReport?.id;
                const isVerified =
                  verificationOverride[r.id] !== false && r.verified;
                const initials = r.name
                  ? r.name
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "PT";
                const colors = getAvatarColors(r.name);

                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReport(r.id)}
                    className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurReport
                        ? "bg-white border-blue-500 shadow-md ring-1 ring-blue-500"
                        : "bg-white border-[#e2e8f0] hover:bg-slate-50 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${colors.bg} ${colors.text}`}
                      >
                        {initials}
                      </div>
                      <div className="truncate">
                        <div className="font-extrabold text-sm text-slate-850 truncate">
                          {r.name
                            .split(" ")
                            .map(
                              (w) =>
                                w.charAt(0).toUpperCase() +
                                w.slice(1).toLowerCase(),
                            )
                            .join(" ")}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>ID: {r.id}</span>
                          <span>•</span>
                          <span>Passport: {r.passportNo}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="shrink-0 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isVerified ? (
                        <div className="flex items-center gap-1.5 bg-[#ecfdf5] text-[#10b981] text-xs px-2.5 py-1 rounded-full border border-[#a7f3d0] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                          <span>Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs px-2.5 py-1 rounded-full border border-rose-200 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                          <span>Suspended</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(r);
                        }}
                        className="p-1.5 hover:bg-blue-50 hover:text-blue-600 text-slate-405 rounded-lg transition-colors border border-transparent hover:border-blue-200 flex items-center justify-center cursor-pointer"
                        title="Edit Patient"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(r.id, r.name);
                        }}
                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-405 rounded-lg transition-colors border border-transparent hover:border-rose-200 flex items-center justify-center cursor-pointer"
                        title="Delete Patient"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredReports.length === 0 && (
                <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Natiijo lama helin (No match found)
                </div>
              )}
            </div>

            {/* View Report Indicator below the patient list */}
            <div className="text-center py-2 mt-4">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200/60 px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm">
                <Eye className="w-3.5 h-3.5 text-[#2563eb]" />
                View Report
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: LIVE REPORT VIEW RENDERER (RESPONSIVE VIEW) */}
        <section
          id="report-view-canvas"
          className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4"
        >
          <div className="bg-white border border-[#e2e8f0] rounded-3xl p-1 md:p-4 lg:p-6 transition-all shadow-sm print:bg-white print:border-none print:shadow-none print:p-0">
            {/* STAGE CONTAINER WITH LIGHT BACKGROUND FOR AUTHENTIC LAB SHEET LOOK */}
            <div className="print-container bg-[#f1f5f9] p-2 sm:p-4 md:p-6 rounded-2xl text-slate-900 relative shadow-inner overflow-hidden print:bg-white print:p-0 print:text-black">
              {/* OVERLAY DIAGONAL STATS IF UNVERIFIED COUBNTERFEIT WARNING */}
              <AnimatePresence>
                {!isCurrentlyVerified && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                  >
                    {/* diagonal red banner watermark */}
                    <div className="absolute transform -rotate-25 bg-red-600/15 border-y-4 border-red-500/40 text-red-600/70 py-4 px-12 text-center select-none w-[120%] font-black tracking-widest text-[22px] md:text-[36px] uppercase">
                      INVALID DOCUMENT • DIGNIIN REPORT FAUX
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CORE MEDICAL REPORT CONTAINER */}
              <div
                className="medilab-sheet mx-auto"
                style={{ maxWidth: "808px" }}
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                  .container-sheet {
                    max-width: 800px;
                    margin: auto;
                    border: 1px solid #d1d5db;
                    padding: 35px 35px;
                    background: #fff;
                    color: #000;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    text-align: left;
                    box-sizing: border-box;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                  }
                  
                  /* Header styling matching the screenshot */
                  .container-sheet .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #e2e8f0;
                    padding-bottom: 15px;
                    margin-bottom: 22px;
                  }
                  .container-sheet .logo-box {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                  }
                  .container-sheet .logo-container {
                    width: 72px;
                    height: 72px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                  }
                  .container-sheet .logo {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                  }
                  .container-sheet .lab-name {
                    font-weight: 800;
                    font-size: 21px;
                    color: #1a4cd2;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    margin-bottom: 3px;
                  }
                  .container-sheet .lab-address,
                  .container-sheet .lab-tel {
                    font-size: 11.5px;
                    color: #1e293b;
                    font-weight: 500;
                    line-height: 1.4;
                  }
                  
                  /* Right side Meta Info styling */
                  .container-sheet .meta-info {
                    text-align: right;
                    font-size: 12.5px;
                    line-height: 1.6;
                    color: #1e293b;
                  }
                  .container-sheet .meta-row {
                    margin-bottom: 4px;
                    white-space: nowrap;
                    display: block;
                  }
                  .container-sheet .meta-label,
                  .container-sheet .meta-value {
                    display: inline-block;
                    vertical-align: middle;
                    line-height: 1.2;
                  }
                  .container-sheet .meta-label {
                    font-weight: 700;
                    color: #0f172a;
                    margin-right: 4px;
                  }
                  .container-sheet .meta-value {
                    font-weight: 400;
                    color: #1e293b;
                  }

                  /* Information Boxes side by side */
                  .container-sheet .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                    margin-bottom: 25px;
                  }
                  .container-sheet .box {
                    border: 1px solid #e2e8f0;
                    padding: 16px 20px;
                    border-radius: 12px;
                    background: #fff;
                  }
                  .container-sheet .box h3 {
                    font-size: 12.5px;
                    color: #155a79;
                    margin: 0 0 12px 0;
                    font-weight: 400 !important;
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                  }
                  .container-sheet .row {
                    display: flex;
                    font-size: 12.5px;
                    margin-bottom: 6px;
                    line-height: 1.4;
                  }
                  .container-sheet .row:last-child {
                    margin-bottom: 0;
                  }
                  .container-sheet .label {
                    width: 110px;
                    color: #4b5563;
                    font-weight: 500;
                    flex-shrink: 0;
                  }
                  .container-sheet .value {
                    font-weight: 700;
                    color: #000000;
                  }

                  /* Test Results Title and Table */
                  .container-sheet .section-title {
                    font-size: 13px;
                    color: #155a79;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                    margin: 0 0 10px 0;
                    text-align: left;
                    text-transform: uppercase;
                  }
                  .container-sheet .results-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 25px;
                  }
                  .container-sheet .results-table th {
                    text-align: left;
                    border-bottom: 1.5px solid #cbd5e1;
                    padding: 8px;
                    font-size: 12.5px;
                    color: #155a79;
                    font-weight: 400 !important;
                  }
                  .container-sheet .results-table td {
                    padding: 9px 8px;
                    font-size: 12.5px;
                    border-bottom: 1px solid #f1f5f9;
                    color: #000000;
                  }
                  .container-sheet .results-table tr.category td {
                    font-weight: 400 !important;
                    color: #155a79 !important;
                    font-size: 13px;
                    padding: 14px 8px 6px 8px;
                    border-bottom: none !important;
                  }

                  /* Signatures matching referenced layout (Stamp & Signature side by side on left) */
                  .container-sheet .sig-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1.5px dashed #cbd5e1;
                  }
                  .container-sheet .sig-box {
                    font-size: 12.5px;
                    line-height: 1.6;
                    color: #374151;
                    text-align: left;
                  }

                  /* Footer & QR */
                  .container-sheet .footer {
                    margin-top: 25px;
                    border-top: 1.5px solid #e2e8f0;
                    padding-top: 12px;
                    font-size: 11px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: #4b5563;
                  }
                  .container-sheet .footer-credit {
                    display: inline-block;
                    vertical-align: middle;
                    white-space: nowrap;
                  }
                  .container-sheet .footer-credit-logo {
                    border: 1px dashed #cbd5e1;
                    width: 18px;
                    height: 18px;
                    font-size: 8px;
                    font-weight: 700;
                    border-radius: 3px;
                    background: #fff;
                    color: #4b5563;
                    display: inline-block;
                    vertical-align: middle;
                    text-align: center;
                    line-height: 16px;
                    box-sizing: border-box;
                    margin-right: 6px;
                    padding: 0;
                    position: relative;
                    top: 1.5px;
                  }
                  .container-sheet .footer-credit-text {
                    font-size: 11px;
                    color: #4b5563;
                    display: inline-block;
                    vertical-align: middle;
                    line-height: 18px;
                  }
                  .container-sheet .qr-section {
                    text-align: center;
                    margin-top: 25px;
                    color: #000;
                  }

                  /* Media print query for high contrast, absolute high fidelity, and A4 precision */
                  @media print {
                    @page {
                      /* Define exact A4 size */
                      size: 210mm 297mm;
                      margin: 10mm; /* Printer-safe margin */
                    }

                    /* Force the target container to fill the A4 page */
                    #laboratory-report-sheet {
                      display: block !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      box-shadow: none !important;
                      border: none !important;
                      /* Ensure no breaks occur inside the card */
                      break-inside: avoid;
                      page-break-inside: avoid;
                    }

                    /* Hide UI elements */
                    .no-print {
                      display: none !important;
                    }
                  }
                `,
                  }}
                />

                <div
                  id="laboratory-report-sheet"
                  className="container-sheet relative bg-white"
                >
                  {/* OVERLAY DIAGONAL STATE IF UNVERIFIED COUBNTERFEIT WARNING */}
                  <AnimatePresence>
                    {!isCurrentlyVerified && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden"
                      >
                        {/* diagonal red banner watermark */}
                        <div className="absolute transform -rotate-25 bg-red-600/15 border-y-4 border-red-500/40 text-red-600/70 py-4 px-12 text-center select-none w-[120%] font-black tracking-widest text-[22px] md:text-[36px] uppercase">
                          INVALID DOCUMENT • DIGNIIN REPORT FAUX
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="header">
                    <div className="logo-box">
                      <div className="logo-container">
                        <img
                          src="https://i.postimg.cc/v8Vsxr1Q/Logo.png"
                          alt="MEDILAB DIAGNOSTIC Logo"
                          className="logo"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="lab-name">MEDILAB DIAGNOSTIC</div>
                        <div className="lab-address">
                          Address: Aden Adde International Airport, Next To
                          Dahabshiil Bank, Waberi, Mogadishu-Somalia
                        </div>
                        <div className="lab-tel">
                          Tel: +252 613523011 • Email:
                          m.labsdiagnostic@gmail.com
                        </div>
                      </div>
                    </div>
                    <div className="meta-info">
                      <div className="meta-row">
                        <span className="meta-label">Boono #:</span>{" "}
                        <span className="meta-value">
                          {activeReport?.boono || activeReport?.id || "2026"}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Printed:</span>{" "}
                        <span className="meta-value">
                          {formatResultDate(
                            activeReport?.resultDate ||
                              new Date().toISOString().split("T")[0],
                          )}
                        </span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Printed By:</span>{" "}
                        <span className="meta-value">
                          {activeReport?.doctor || "sadam adan Ahmed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC INTEGRITY ALERT WARNING */}
                  {!isCurrentlyVerified && (
                    <div
                      style={{
                        marginBottom: "15px",
                        padding: "10px",
                        background: "#fdf2f2",
                        borderLeft: "4px solid #f05252",
                        borderRadius: "4px",
                        color: "#9b1c1c",
                        fontSize: "12px",
                        textAlign: "left",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          textTransform: "uppercase",
                          marginBottom: "2px",
                        }}
                      >
                        ⚠️ INVALID DOCUMENT / SYSTEM COUBNTERFEIT WARNING
                      </strong>
                      This report has been marked as suspended or simulated and
                      does not match central health registry logs.
                    </div>
                  )}

                  <div className="info-grid">
                    <div className="box">
                      <h3 style={{ fontWeight: "400" }}>PATIENT INFORMATION</h3>
                      <div className="row">
                        <div className="label">Patient Name</div>
                        <div className="value">
                          {activeReport?.name || "MYKOLA VORONA"}
                        </div>
                      </div>
                      <div className="row">
                        <div className="label">Patient ID</div>
                        <div className="value">
                          {activeReport?.id || "1876"}
                        </div>
                      </div>
                      <div className="row">
                        <div className="label">Age / Gender</div>
                        <div className="value">
                          {activeReport?.age || "44"} /{" "}
                          {activeReport?.gender || "Male"}
                        </div>
                      </div>
                      <div className="row">
                        <div className="label">Phone</div>
                        <div className="value">
                          {activeReport?.phone || "839180"}
                        </div>
                      </div>
                      <div className="row">
                        <div className="label">Passport NO</div>
                        <div className="value">
                          {activeReport?.passportNo || "FS879183"}
                        </div>
                      </div>
                    </div>
                    <div className="box">
                      <h3 style={{ fontWeight: "400" }}>LAB ORDER DETAILS</h3>
                      <div className="row">
                        <div className="label">Company</div>
                        <div className="value">
                          {activeReport?.company || "UKRANIAN HELICOPTERS"}
                        </div>
                      </div>
                      <div className="row">
                        <div className="label">Sample Type</div>
                        <div className="value">Blood</div>
                      </div>
                      <div className="row">
                        <div className="label">Collected By</div>
                        <div className="value">Medilab</div>
                      </div>
                      <div className="row">
                        <div className="label">Result Time</div>
                        <div className="value">
                          {formatResultDate(
                            activeReport?.resultDate ||
                              new Date().toISOString().split("T")[0],
                          )}
                        </div>
                      </div>
                      <div className="row">
                        <div className="label">Status</div>
                        <div className="value" style={{ color: "#000000" }}>
                          Final
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section-title">TEST RESULTS</div>
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th style={{ fontWeight: "400" }}>Test Name</th>
                        <th style={{ fontWeight: "400" }}>Result</th>
                        <th style={{ fontWeight: "400" }}>Unit</th>
                        <th style={{ fontWeight: "400" }}>Reference Range</th>
                        <th style={{ fontWeight: "400" }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="category">
                        <td colSpan={5} style={{ fontWeight: "400" }}>
                          Immunology
                        </td>
                      </tr>
                      {activeReport?.tests.map((test, idx) => {
                        const isNegative =
                          test.result === "Negative" ||
                          test.result === "Non-Reactive";
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: "400" }}>{test.name}</td>
                            <td style={{ fontWeight: "400" }}>
                              {isCurrentlyVerified ? test.result : "REJECTED"}
                            </td>
                            <td>{test.unit}</td>
                            <td style={{ fontWeight: "400" }}>Negative</td>
                            <td>
                              {isCurrentlyVerified ? (
                                test.remark || ""
                              ) : (
                                <span
                                  style={{
                                    color: "#e03131",
                                    fontWeight: "bold",
                                    textTransform: "uppercase",
                                    fontSize: "11px",
                                  }}
                                >
                                  Invalid Checksum
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="sig-section">
                    {/* First column: Name & Signature */}
                    <div className="sig-box" style={{ flex: "1" }}>
                      <div>
                        Medilab Diagnostic
                        <br />
                        Name & Signature
                      </div>
                      {isCurrentlyVerified && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginTop: "15px",
                          }}
                        >
                          <img
                            src="https://i.postimg.cc/44vc5LBv/Signature.png"
                            alt="Signature"
                            style={{
                              height: "115px",
                              width: "auto",
                              mixBlendMode: "multiply",
                              display: "block",
                            }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>

                    {/* Second column: Doctor Authorization with Stamp */}
                    <div
                      className="sig-box"
                      style={{ flex: "1", paddingLeft: "80px" }}
                    >
                      <div>
                        Authorized By
                        <br />
                        {activeReport?.doctor || "sadam adan Ahmed"}
                      </div>
                    </div>
                  </div>

                  <div className="footer">
                    <div>Notes: Results are for Medilab Diagnostic.</div>
                    <div className="footer-credit">
                      <span className="footer-credit-logo">DT</span>
                      <span className="footer-credit-text">
                        Powered & Designed by&nbsp;
                        <strong style={{ fontWeight: "600", color: "#374151" }}>
                          Mogadisho tech
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="qr-section">
                    <div
                      style={{
                        background: "#fff",
                        width: "80px",
                        height: "80px",
                        margin: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #eee",
                        borderRadius: "4px",
                      }}
                    >
                      {activeReport ? (
                        <a
                          href={verificationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "block" }}
                        >
                          <img
                            src={qrCodeUrl}
                            alt="Verification QR"
                            className="w-20 h-20 select-none cursor-pointer"
                            style={{ width: "80px", height: "80px" }}
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ) : (
                        <div
                          style={{
                            background: "#eee",
                            width: "80px",
                            height: "80px",
                          }}
                        >
                          [QR]
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "10px", marginTop: "6px" }}>
                      Scan to Verify Result
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VERIFY PAGE PREVIEW SEAMLESS INTEGRATION (NO-PRINT) */}
          <div className="no-print mt-8 mb-6">
            <div className="text-center mb-4 text-slate-600 text-sm font-bold uppercase tracking-wider">
              <span>view verification result</span>
            </div>

            <div className="w-full bg-[#dfe1e6] rounded-2xl p-3 md:p-6 shadow-md border border-slate-300 select-text">
              <div
                className="max-w-[1000px] mx-auto flex flex-col gap-6 text-left"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                {/* Header */}
                <div
                  className="bg-white rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
                  style={{
                    background:
                      "linear-gradient(90deg, #eaf2fd 0%, #ffffff 100%)",
                  }}
                >
                  <img
                    src="https://i.postimg.cc/mk4PXqw2/logo1.png"
                    className="w-[100px] h-[100px] object-contain shrink-0"
                    alt="medilab logo 1"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-center flex-1 px-4">
                    <h1 className="text-[#0459a8] text-xl md:text-2xl font-black mb-1">
                      MEDILAB DIAGNOSTIC CENTER
                    </h1>
                    <p className="text-slate-600 font-semibold text-sm md:text-base mb-2">
                      Official Laboratory Verification Report
                    </p>
                    <div className="w-[70%] h-[3px] bg-[#1b9bc5] mx-auto mb-2.5 rounded"></div>
                    <div className="text-slate-700 text-xs md:text-sm leading-relaxed font-normal">
                      <strong>Address:</strong> Aden Adde International Airport,
                      Next To Dahabshiil Bank, Waberi, Mogadishu-Somalia
                      <br />
                      <strong>Tel:</strong> +252 613523011
                      &nbsp;&nbsp;•&nbsp;&nbsp; <strong>Email:</strong>{" "}
                      m.labsdiagnostic@gmail.com
                    </div>
                  </div>
                  <img
                    src="https://i.postimg.cc/5NN0X8KB/logo2.png"
                    className="w-[100px] h-[100px] object-contain shrink-0"
                    alt="medilab logo 2"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Patient verification card */}
                <div className="bg-[#f7f7f7] rounded-xl border-l-[5px] border-[#3cb54a] p-6 shadow-sm flex flex-col gap-4">
                  <div className="text-[#3d7f36] text-lg md:text-xl font-bold flex items-center gap-2">
                    <span>
                      ✅ Patient waa sax wuxuuna ka yimid Medilab Diagnostic
                      System
                    </span>
                  </div>
                  <div className="text-[#555] text-sm font-semibold border-b border-slate-200/50 pb-2">
                    ✔ This report is authentic and verified by Medilab
                    Diagnostic.
                  </div>
                  <div className="text-slate-800 text-sm md:text-base leading-loose grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                    <div>
                      <strong>Patient ID:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[30px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("id", e.currentTarget.innerText)
                        }
                      >
                        {activeReport?.id || "1876"}
                      </span>
                    </div>
                    <div>
                      <strong>Patient Name:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[80px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("name", e.currentTarget.innerText)
                        }
                      >
                        {activeReport?.name || "MYKOLA VORONA"}
                      </span>
                    </div>
                    <div>
                      <strong>Age:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[20px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("age", e.currentTarget.innerText)
                        }
                      >
                        {activeReport?.age || "44"}
                      </span>{" "}
                      | <strong>Gender:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[40px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("gender", e.currentTarget.innerText)
                        }
                      >
                        {activeReport?.gender || "Male"}
                      </span>
                    </div>
                    <div>
                      <strong>Company:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[100px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("company", e.currentTarget.innerText)
                        }
                      >
                        {activeReport?.company || "UKRANIAN HELICOPTERS"}
                      </span>
                    </div>
                    <div>
                      <strong>Passport No:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[70px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit(
                            "passport",
                            e.currentTarget.innerText,
                          )
                        }
                      >
                        {activeReport?.passportNo || "FS879183"}
                      </span>
                    </div>
                    <div>
                      <strong>Phone:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[50px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("phone", e.currentTarget.innerText)
                        }
                      >
                        {activeReport?.phone || "839180"}
                      </span>
                    </div>
                    <div>
                      <strong>Doctor:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[100px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("doctor", e.currentTarget.innerText)
                        }
                      >
                        {activeReport?.doctor || "sadam adan Ahmed"}
                      </span>
                    </div>
                    <div>
                      <strong>Result Date:</strong>{" "}
                      <span
                        className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 font-bold cursor-text inline-block transition-colors min-w-[75px]"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) =>
                          handleInlineEdit("date", e.currentTarget.innerText)
                        }
                      >
                        {formatResultDate(
                          activeReport?.resultDate ||
                            new Date().toISOString().split("T")[0],
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Immunology Section & Table */}
                <div>
                  <div className="bg-[#0075f2] text-white py-2.5 px-4 rounded-t-lg font-bold text-sm md:text-base">
                    Immunology
                  </div>
                  <table className="w-full bg-[#f7f7f7] rounded-b-lg border-collapse border border-slate-300 overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-[#eceff1] text-slate-700">
                        <th className="border border-slate-300 text-left p-3 text-xs md:text-sm font-bold">
                          Test
                        </th>
                        <th className="border border-slate-300 text-left p-3 text-xs md:text-sm font-bold">
                          Result
                        </th>
                        <th className="border border-slate-300 text-left p-3 text-xs md:text-sm font-bold">
                          Unit
                        </th>
                        <th className="border border-slate-300 text-left p-3 text-xs md:text-sm font-bold">
                          Remark
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-slate-800 text-xs md:text-sm">
                        <td className="border border-slate-200 p-3">HCV</td>
                        <td className="border border-slate-200 p-3 text-slate-800">
                          <span
                            className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 cursor-text"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleInlineEdit("hcv", e.currentTarget.innerText)
                            }
                          >
                            {hcvVal}
                          </span>
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500">
                          test
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500"></td>
                      </tr>
                      <tr className="text-slate-800 text-xs md:text-sm">
                        <td className="border border-slate-200 p-3">
                          Hepatitis B Surface Antigen
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-800">
                          <span
                            className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 cursor-text"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleInlineEdit(
                                "hepb",
                                e.currentTarget.innerText,
                              )
                            }
                          >
                            {hepBVal}
                          </span>
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500">
                          test
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500"></td>
                      </tr>
                      <tr className="text-slate-800 text-xs md:text-sm">
                        <td className="border border-slate-200 p-3">
                          HIV Test
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-800">
                          <span
                            className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 cursor-text"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleInlineEdit("hiv", e.currentTarget.innerText)
                            }
                          >
                            {hivVal}
                          </span>
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500">
                          test
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500"></td>
                      </tr>
                      <tr className="text-slate-800 text-xs md:text-sm">
                        <td className="border border-slate-200 p-3">TPHA</td>
                        <td className="border border-slate-200 p-3 text-slate-800">
                          <span
                            className="edit-field border-b border-dashed border-slate-300 hover:border-blue-500 focus:outline-none focus:bg-white px-1 cursor-text"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) =>
                              handleInlineEdit(
                                "tpha",
                                e.currentTarget.innerText,
                              )
                            }
                          >
                            {tphaVal}
                          </span>
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500">
                          test
                        </td>
                        <td className="border border-slate-200 p-3 text-slate-500"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer Section */}
                <div className="border-t-[3px] border-[#1b84d6] pt-4 pb-2 text-center text-xs text-slate-500 font-semibold leading-relaxed">
                  © 2026 Medilab Diagnostic Center — All rights reserved.
                  <br />
                  Designed & Verified by Daryeel Tech IT Team
                </div>
              </div>
            </div>
          </div>

          {/* EXPORT / PRINT ACTION BUTTONS UNDER THE REPORT SHEET (NO-PRINT) */}
          <div className="no-print mt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="w-full sm:w-auto bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold py-3 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Export laboratory report as PDF"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Export PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-bold py-3 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              title="Print laboratory report"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER ADVISORY BANNER - NO-PRINT */}
      <footer
        style={{ backgroundColor: "#f4f5f2" }}
        className="no-print mt-auto border-t border-slate-300 py-4 text-center text-xs text-slate-700"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>
            © 2026 Lab Verification Center. Designed & Verified by Tech IT Team.
          </p>
        </div>
      </footer>

      {/* CREATE NEW REPORT SLIDE-OVER MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              style={{ backgroundColor: "#f4f5f2" }}
              className="relative border border-slate-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-base">
                      New Clearance Registration
                    </h3>
                    <p className="text-xs text-slate-500">
                      Add medical logs onto local memory database
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleCreateReportSubmit}
                className="flex flex-col gap-4 text-sm text-slate-800"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Patient ID (Lambarka)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2042"
                      value={newPatient.id}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          id: e.target.value.trim(),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Boono #
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026"
                      value={newPatient.boono}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          boono: e.target.value.trim(),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Passport No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FS879183"
                      value={newPatient.passportNo}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          passportNo: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Full Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OLEKSANDR PETRENKO"
                    value={newPatient.name}
                    onChange={(e) =>
                      setNewPatient((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={newPatient.age}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          age: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Gender
                    </label>
                    <select
                      value={newPatient.gender}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          gender: e.target.value as any,
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TURKISH AIRLINES"
                      value={newPatient.company}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          company: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 839180"
                      value={newPatient.phone}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={newPatient.doctor}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          doctor: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Result Release Date
                    </label>
                    <input
                      type="date"
                      value={newPatient.resultDate}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          resultDate: e.target.value,
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                      Report Status
                    </label>
                    <select
                      value={newPatient.verified ? "true" : "false"}
                      onChange={(e) =>
                        setNewPatient((prev) => ({
                          ...prev,
                          verified: e.target.value === "true",
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="true">✅ Verified / Active</option>
                      <option value="false">❌ Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Immunology Panel Results Selection */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-300 mt-2">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />{" "}
                    Bio-Assay Results Matrix
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        HCV Status
                      </label>
                      <select
                        value={newPatient.hcv}
                        onChange={(e) =>
                          setNewPatient((prev) => ({
                            ...prev,
                            hcv: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Hep B Surface Ag
                      </label>
                      <select
                        value={newPatient.hepB}
                        onChange={(e) =>
                          setNewPatient((prev) => ({
                            ...prev,
                            hepB: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        HIV Test Status
                      </label>
                      <select
                        value={newPatient.hiv}
                        onChange={(e) =>
                          setNewPatient((prev) => ({
                            ...prev,
                            hiv: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        TPHA Syphilis
                      </label>
                      <select
                        value={newPatient.tpha}
                        onChange={(e) =>
                          setNewPatient((prev) => ({
                            ...prev,
                            tpha: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-300 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Ka laabo (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Diiwaangeli (Register)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT REPORT MODAL */}
      <AnimatePresence>
        {showEditModal && editingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditModal(false);
                setEditingReport(null);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">
                      Edit Clearance Registration
                    </h3>
                    <p className="text-xs text-slate-400">
                      Modify medical logs on local memory database
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingReport(null);
                  }}
                  className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleEditReportSubmit}
                className="flex flex-col gap-4 text-sm"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Patient ID (Lambarka)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2042"
                      value={editPatientForm.id}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          id: e.target.value.trim(),
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Boono #
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026"
                      value={editPatientForm.boono}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          boono: e.target.value.trim(),
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Passport No
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FS879183"
                      value={editPatientForm.passportNo}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          passportNo: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Full Patient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OLEKSANDR PETRENKO"
                    value={editPatientForm.name}
                    onChange={(e) =>
                      setEditPatientForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      value={editPatientForm.age}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          age: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Gender
                    </label>
                    <select
                      value={editPatientForm.gender}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          gender: e.target.value as any,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TURKISH AIRLINES"
                      value={editPatientForm.company}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          company: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 839180"
                      value={editPatientForm.phone}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder:text-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={editPatientForm.doctor}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          doctor: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Result Release Date
                    </label>
                    <input
                      type="date"
                      value={editPatientForm.resultDate}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          resultDate: e.target.value,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Report Status
                    </label>
                    <select
                      value={editPatientForm.verified ? "true" : "false"}
                      onChange={(e) =>
                        setEditPatientForm((prev) => ({
                          ...prev,
                          verified: e.target.value === "true",
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">✅ Verified / Active</option>
                      <option value="false">❌ Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Immunology Panel Results Selection */}
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mt-2">
                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-400" /> Bio-Assay
                    Results Matrix
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        HCV Status
                      </label>
                      <select
                        value={editPatientForm.hcv}
                        onChange={(e) =>
                          setEditPatientForm((prev) => ({
                            ...prev,
                            hcv: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        Hep B Surface Ag
                      </label>
                      <select
                        value={editPatientForm.hepB}
                        onChange={(e) =>
                          setEditPatientForm((prev) => ({
                            ...prev,
                            hepB: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        HIV Test Status
                      </label>
                      <select
                        value={editPatientForm.hiv}
                        onChange={(e) =>
                          setEditPatientForm((prev) => ({
                            ...prev,
                            hiv: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                        TPHA Syphilis
                      </label>
                      <select
                        value={editPatientForm.tpha}
                        onChange={(e) =>
                          setEditPatientForm((prev) => ({
                            ...prev,
                            tpha: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                      >
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                        <option value="Non-Reactive">Non-Reactive</option>
                        <option value="Reactive">Reactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800/80 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingReport(null);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Ka laabo (Cancel)
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-blue-500/10 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Keydi (Save Changes)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
