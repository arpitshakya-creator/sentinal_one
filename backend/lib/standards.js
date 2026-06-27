// ---------------------------------------------------------------------------
// Standards & frameworks alignment for SupplyChain Sentinel AI.
//
// This module makes the platform's risk methodology and recommendations
// traceable to recognized security standards:
//
//   - ISO/IEC 27001:2022  — ISMS requirements (risk assessment & treatment).
//   - ISO/IEC 27002:2022  — information security controls (Annex A reference).
//   - ISO/IEC 27005:2022  — information security risk management methodology.
//   - CVSS v3.1           — vulnerability severity scoring (FIRST).
//   - CISA KEV            — Known Exploited Vulnerabilities catalog.
//   - NIST SP 800-53 Rev.5 — security & privacy controls (esp. the SR family).
// ---------------------------------------------------------------------------

export const STANDARDS = [
  {
    id: "iso27001",
    name: "ISO/IEC 27001:2022",
    category: "ISMS",
    summary:
      "Requirements for an Information Security Management System. The supplier risk register and treatment workflow implement clauses 6.1.2/6.1.3 and 8.2/8.3.",
    url: "https://www.iso.org/standard/27001",
  },
  {
    id: "iso27002",
    name: "ISO/IEC 27002:2022",
    category: "Controls",
    summary:
      "Information security controls. Mitigation actions are mapped to Annex A controls — notably 5.7, 5.19–5.23 (supplier & ICT supply chain) and 8.8.",
    url: "https://www.iso.org/standard/75652.html",
  },
  {
    id: "iso27005",
    name: "ISO/IEC 27005:2022",
    category: "Risk methodology",
    summary:
      "Guidance on information security risk management. Risk is rated as Likelihood × Consequence; likelihood is driven by CVSS/KEV exposure and consequence by blast-radius impact.",
    url: "https://www.iso.org/standard/80585.html",
  },
  {
    id: "cvss31",
    name: "CVSS v3.1",
    category: "Vulnerability scoring",
    summary:
      "Common Vulnerability Scoring System. NVD base scores are mapped to the v3.1 qualitative severity bands (None/Low/Medium/High/Critical).",
    url: "https://www.first.org/cvss/v3.1/specification-document",
  },
  {
    id: "cisakev",
    name: "CISA KEV",
    category: "Threat intelligence",
    summary:
      "CISA Known Exploited Vulnerabilities catalog. A KEV match is treated as an authoritative 'actively exploited' breach indicator that raises likelihood.",
    url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
  },
  {
    id: "nist80053",
    name: "NIST SP 800-53 Rev.5",
    category: "Controls",
    summary:
      "Security and privacy controls. Recommendations reference the Supply Chain Risk Management (SR) family plus RA-5, SI-5, IR, CP and SC-7.",
    url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
  },
];

// --- Control library (ISO/IEC 27002:2022 Annex A + NIST SP 800-53 Rev.5) -----
export const CONTROL_LIBRARY = {
  // ISO/IEC 27002:2022
  "ISO 27002:5.7": { framework: "ISO/IEC 27002:2022", title: "Threat intelligence" },
  "ISO 27002:5.19": { framework: "ISO/IEC 27002:2022", title: "Information security in supplier relationships" },
  "ISO 27002:5.20": { framework: "ISO/IEC 27002:2022", title: "Addressing information security within supplier agreements" },
  "ISO 27002:5.21": { framework: "ISO/IEC 27002:2022", title: "Managing information security in the ICT supply chain" },
  "ISO 27002:5.22": { framework: "ISO/IEC 27002:2022", title: "Monitoring, review and change management of supplier services" },
  "ISO 27002:5.24": { framework: "ISO/IEC 27002:2022", title: "Information security incident management planning and preparation" },
  "ISO 27002:5.26": { framework: "ISO/IEC 27002:2022", title: "Response to information security incidents" },
  "ISO 27002:5.30": { framework: "ISO/IEC 27002:2022", title: "ICT readiness for business continuity" },
  "ISO 27002:8.8": { framework: "ISO/IEC 27002:2022", title: "Management of technical vulnerabilities" },
  "ISO 27002:8.16": { framework: "ISO/IEC 27002:2022", title: "Monitoring activities" },
  "ISO 27002:8.20": { framework: "ISO/IEC 27002:2022", title: "Networks security" },
  "ISO 27002:8.22": { framework: "ISO/IEC 27002:2022", title: "Segregation of networks" },
  "ISO 27002:8.24": { framework: "ISO/IEC 27002:2022", title: "Use of cryptography" },
  // NIST SP 800-53 Rev.5
  "NIST 800-53:SR-2": { framework: "NIST SP 800-53 Rev.5", title: "Supply Chain Risk Management Plan" },
  "NIST 800-53:SR-3": { framework: "NIST SP 800-53 Rev.5", title: "Supply Chain Controls and Processes" },
  "NIST 800-53:SR-5": { framework: "NIST SP 800-53 Rev.5", title: "Acquisition Strategies, Tools, and Methods" },
  "NIST 800-53:SR-6": { framework: "NIST SP 800-53 Rev.5", title: "Supplier Assessments and Reviews" },
  "NIST 800-53:SR-8": { framework: "NIST SP 800-53 Rev.5", title: "Notification Agreements" },
  "NIST 800-53:SR-11": { framework: "NIST SP 800-53 Rev.5", title: "Component Authenticity" },
  "NIST 800-53:RA-3": { framework: "NIST SP 800-53 Rev.5", title: "Risk Assessment" },
  "NIST 800-53:RA-5": { framework: "NIST SP 800-53 Rev.5", title: "Vulnerability Monitoring and Scanning" },
  "NIST 800-53:CA-7": { framework: "NIST SP 800-53 Rev.5", title: "Continuous Monitoring" },
  "NIST 800-53:SI-5": { framework: "NIST SP 800-53 Rev.5", title: "Security Alerts, Advisories, and Directives" },
  "NIST 800-53:IR-4": { framework: "NIST SP 800-53 Rev.5", title: "Incident Handling" },
  "NIST 800-53:IR-6": { framework: "NIST SP 800-53 Rev.5", title: "Incident Reporting" },
  "NIST 800-53:CP-2": { framework: "NIST SP 800-53 Rev.5", title: "Contingency Plan" },
  "NIST 800-53:SC-7": { framework: "NIST SP 800-53 Rev.5", title: "Boundary Protection" },
  "NIST 800-53:SC-8": { framework: "NIST SP 800-53 Rev.5", title: "Transmission Confidentiality and Integrity" },
  "NIST 800-53:AC-4": { framework: "NIST SP 800-53 Rev.5", title: "Information Flow Enforcement" },
  "NIST 800-53:PM-30": { framework: "NIST SP 800-53 Rev.5", title: "Supply Chain Risk Management Strategy" },
};

// Map each mitigation phase to the controls it operationalizes.
const MITIGATION_CONTROLS = {
  immediate: ["NIST 800-53:SC-7", "NIST 800-53:AC-4", "NIST 800-53:IR-4", "ISO 27002:5.24", "ISO 27002:8.20", "ISO 27002:8.8"],
  short_term: ["NIST 800-53:IR-6", "NIST 800-53:CP-2", "NIST 800-53:SR-8", "ISO 27002:5.26", "ISO 27002:5.30", "ISO 27002:5.20"],
  medium_term: ["NIST 800-53:SR-3", "NIST 800-53:SR-6", "NIST 800-53:RA-3", "ISO 27002:5.19", "ISO 27002:5.21", "ISO 27002:5.22"],
  long_term: ["NIST 800-53:SR-2", "NIST 800-53:SR-5", "NIST 800-53:SR-11", "NIST 800-53:SC-7", "NIST 800-53:PM-30", "ISO 27002:8.22", "ISO 27002:5.21"],
};

export function resolveControls(ids) {
  return ids
    .filter((id) => CONTROL_LIBRARY[id])
    .map((id) => ({ id, ...CONTROL_LIBRARY[id] }));
}

export function controlsForCategory(category) {
  return resolveControls(MITIGATION_CONTROLS[category] ?? []);
}

// --- CVSS v3.1 qualitative severity rating (FIRST specification) -------------
export function cvssV31Severity(score) {
  const s = Number(score) || 0;
  if (s >= 9.0) return { label: "Critical", band: "critical", range: "9.0–10.0" };
  if (s >= 7.0) return { label: "High", band: "critical", range: "7.0–8.9" };
  if (s >= 4.0) return { label: "Medium", band: "medium", range: "4.0–6.9" };
  if (s >= 0.1) return { label: "Low", band: "low", range: "0.1–3.9" };
  return { label: "None", band: "low", range: "0.0" };
}

// --- ISO/IEC 27005 risk rating ----------------------------------------------
// Likelihood comes from live exposure (KEV/CVSS); consequence from how many
// downstream plants the supplier can take down. We expose both the qualitative
// rating and the methodology so the score is auditable.
export function iso27005Likelihood({ breach_indicator, max_cvss, patch_lag_days }) {
  if (breach_indicator) return { level: "Very High", rationale: "Actively exploited (CISA KEV) vulnerability present." };
  if (max_cvss >= 9.0) return { level: "High", rationale: "Critical CVSS v3.1 vulnerability exposure." };
  if (max_cvss >= 7.0 || patch_lag_days >= 14) return { level: "Medium", rationale: "High-severity CVE and/or significant patch lag." };
  if (max_cvss >= 4.0) return { level: "Low", rationale: "Medium-severity CVE exposure." };
  return { level: "Very Low", rationale: "No significant live vulnerability exposure." };
}

export function iso27005Consequence(connectedPlants) {
  const n = Number(connectedPlants) || 0;
  if (n >= 3) return { level: "Severe", rationale: `${n} downstream plants exposed.` };
  if (n === 2) return { level: "Major", rationale: "2 downstream plants exposed." };
  if (n === 1) return { level: "Moderate", rationale: "1 downstream plant exposed." };
  return { level: "Minor", rationale: "No downstream plant directly exposed." };
}

export function iso27005Rating(score) {
  if (score >= 70) return "Critical";
  if (score >= 40) return "High";
  if (score >= 20) return "Medium";
  return "Low";
}

export function iso27005Assessment(inputs) {
  const likelihood = iso27005Likelihood(inputs);
  const consequence = iso27005Consequence(inputs.connected_plant_count);
  return {
    methodology: "ISO/IEC 27005:2022 — risk = likelihood × consequence",
    likelihood,
    consequence,
    risk_rating: iso27005Rating(inputs.risk_score ?? 0),
  };
}

// --- Per-supplier compliance findings (control gaps) -------------------------
// Evaluates a supplier's posture against the relevant controls and flags gaps.
export function supplierComplianceFindings(profile, props = {}) {
  const findings = [];
  const add = (controlId, status, rationale) => {
    const c = CONTROL_LIBRARY[controlId];
    if (c) findings.push({ control: controlId, framework: c.framework, title: c.title, status, rationale });
  };

  // Technical vulnerability management (ISO 8.8 / NIST RA-5, SI-5).
  if (profile.breach_indicator) {
    add("ISO 27002:8.8", "gap", "Actively exploited (KEV) vulnerability is unremediated.");
    add("NIST 800-53:RA-5", "gap", "Known exploited vulnerability requires immediate remediation/monitoring.");
  } else if (profile.max_cvss >= 7.0) {
    add("ISO 27002:8.8", "partial", `Open high/critical CVE (max CVSS ${Number(profile.max_cvss).toFixed(1)}).`);
    add("NIST 800-53:RA-5", "partial", "High-severity vulnerabilities pending remediation.");
  } else {
    add("ISO 27002:8.8", "met", "No high/critical live CVE exposure detected.");
  }

  // Threat intelligence (ISO 5.7 / NIST SI-5) — the platform itself satisfies this.
  add("ISO 27002:5.7", "met", "Live NVD + CISA KEV threat intelligence is monitored for this supplier.");

  // Supplier assessment / audit cadence (ISO 5.22 / NIST SR-6).
  const lastAudit = props.last_audit_date ? new Date(props.last_audit_date) : null;
  const auditAgeDays = lastAudit ? Math.floor((Date.now() - lastAudit.getTime()) / 86_400_000) : null;
  if (auditAgeDays === null) {
    add("NIST 800-53:SR-6", "gap", "No supplier security assessment on record.");
  } else if (auditAgeDays > 365) {
    add("NIST 800-53:SR-6", "gap", `Last assessment ${auditAgeDays} days ago (>12 months).`);
    add("ISO 27002:5.22", "gap", "Supplier service monitoring/review is overdue.");
  } else {
    add("NIST 800-53:SR-6", "met", `Assessed ${auditAgeDays} days ago.`);
  }

  // Secure integration / cryptography (ISO 8.24 / NIST SC-8) for ERP links.
  if (props.erp_connected) {
    add("ISO 27002:5.21", "partial", "Active ICT supply-chain integration (ERP) must be governed and monitored.");
  }

  // Business continuity / single-source resilience (ISO 5.30 / NIST CP-2, SR-3).
  if (props.is_redundant === false) {
    add("NIST 800-53:CP-2", "gap", "Sole-source supplier with no qualified alternate — continuity risk.");
    add("ISO 27002:5.30", "gap", "ICT/operational continuity not assured (single source).");
  } else {
    add("NIST 800-53:CP-2", "met", "Redundant/alternate sourcing available.");
  }

  // Supplier agreements (ISO 5.20 / NIST SR-8) — always recommended baseline.
  add("ISO 27002:5.20", profile.band === "critical" ? "gap" : "partial",
    profile.band === "critical"
      ? "Critical risk: enforce cyber clauses, breach-notification SLAs and audit rights."
      : "Maintain security requirements and breach-notification clauses in the supplier agreement.");

  const summary = {
    met: findings.filter((f) => f.status === "met").length,
    partial: findings.filter((f) => f.status === "partial").length,
    gap: findings.filter((f) => f.status === "gap").length,
  };
  return { findings, summary };
}

// --- Standards-lensed simulation analysis -----------------------------------
// Given the standards the user selected, return per-standard analysis of a
// breach scenario so the simulation can be run "through the lens of" each one.
export function simulationStandardsAnalysis(selectedIds, ctx) {
  const { profile = {}, props = {}, impact = {}, cves = [] } = ctx;
  const ids = new Set(selectedIds && selectedIds.length ? selectedIds : STANDARDS.map((s) => s.id));
  const meta = Object.fromEntries(STANDARDS.map((s) => [s.id, s]));
  const scenario = impact.scenario || "breach";
  const out = [];

  if (ids.has("cvss31")) {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, None: 0 };
    let max = 0;
    for (const c of cves) {
      counts[cvssV31Severity(c.cvss).label] += 1;
      max = Math.max(max, Number(c.cvss) || 0);
    }
    const top = cvssV31Severity(max);
    out.push({
      id: "cvss31",
      name: meta.cvss31.name,
      headline: `Max base score ${max.toFixed(1)} — ${top.label}`,
      band: top.band,
      metrics: [
        { label: "Critical", value: counts.Critical },
        { label: "High", value: counts.High },
        { label: "Medium", value: counts.Medium },
        { label: "Low", value: counts.Low },
      ],
      note: `${counts.Critical + counts.High} high/critical CVE(s) in scope. Severity-weighted exposure raises the likelihood of a successful ${scenario}.`,
    });
  }

  if (ids.has("cisakev")) {
    const kev = cves.filter((c) => c.known_exploited);
    out.push({
      id: "cisakev",
      name: meta.cisakev.name,
      headline: kev.length ? `${kev.length} actively exploited CVE(s)` : "No active exploitation",
      band: kev.length ? "critical" : "low",
      list: kev.slice(0, 6).map((c) => c.id),
      note: kev.length
        ? `Active exploitation (CISA KEV) sets likelihood to Very High — prioritize emergency patching and isolation for this ${scenario}.`
        : "No CISA KEV match for this supplier — exploitation likelihood is comparatively lower.",
    });
  }

  if (ids.has("iso27005")) {
    const a =
      profile.iso27005 ||
      iso27005Assessment({
        breach_indicator: profile.breach_indicator,
        max_cvss: profile.max_cvss,
        patch_lag_days: profile.patch_lag_days,
        connected_plant_count: profile.connected_plant_count,
        risk_score: profile.risk_score,
      });
    out.push({
      id: "iso27005",
      name: meta.iso27005.name,
      headline: `Risk rating: ${a.risk_rating}`,
      band: RATING_BAND[a.risk_rating] || "medium",
      metrics: [
        { label: "Likelihood", value: a.likelihood.level },
        { label: "Consequence", value: a.consequence.level },
      ],
      note: `${a.methodology}. The ${scenario} projects ${impact.affected_plants ?? 0} plant(s) and ${impact.revenue_at_risk_usd ?? "$0"} at risk → consequence "${a.consequence.level}".`,
    });
  }

  if (ids.has("iso27002") || ids.has("nist80053")) {
    const { findings } = supplierComplianceFindings(profile, props);
    if (ids.has("iso27002")) {
      out.push({
        id: "iso27002",
        name: meta.iso27002.name,
        headline: "Annex A control posture",
        controls: findings.filter((f) => f.framework.startsWith("ISO/IEC 27002")),
        note: `Information security controls relevant to containing a ${scenario} at this supplier.`,
      });
    }
    if (ids.has("nist80053")) {
      out.push({
        id: "nist80053",
        name: meta.nist80053.name,
        headline: "SP 800-53 control posture",
        controls: findings.filter((f) => f.framework.startsWith("NIST")),
        note: `Security controls (incl. Supply Chain Risk Management family) for containment and recovery.`,
      });
    }
  }

  if (ids.has("iso27001")) {
    const rating = profile.iso27005?.risk_rating ?? iso27005Rating(profile.risk_score ?? 0);
    const treatment =
      rating === "Critical" || rating === "High"
        ? "Modify"
        : rating === "Medium"
        ? "Modify / Share"
        : "Retain";
    const detail =
      rating === "Critical" || rating === "High"
        ? "Apply controls immediately and escalate to the risk owner."
        : rating === "Medium"
        ? "Apply controls and consider contractual risk transfer."
        : "Monitor under the ISMS; risk is within appetite.";
    const { summary } = supplierComplianceFindings(profile, props);
    out.push({
      id: "iso27001",
      name: meta.iso27001.name,
      headline: `Risk treatment: ${treatment}`,
      band: RATING_BAND[rating] || "medium",
      metrics: [
        { label: "Controls met", value: summary.met },
        { label: "Partial", value: summary.partial },
        { label: "Gaps", value: summary.gap },
      ],
      note: `ISO/IEC 27001 Clause 6.1.2/6.1.3 — ${detail}`,
    });
  }

  return out;
}

const RATING_BAND = { Critical: "critical", High: "critical", Medium: "medium", Low: "low" };

// --- Control-by-control compliance checklist --------------------------------
// Evaluates a breach against EVERY parameter of each selected standard and
// returns pass / fail / partial / na per control, with rationale + remediation.
export function complianceChecklist(selectedIds, ctx) {
  const { profile = {}, props = {}, impact = {}, cves = [] } = ctx;
  const ids = new Set(selectedIds && selectedIds.length ? selectedIds : STANDARDS.map((s) => s.id));
  const meta = Object.fromEntries(STANDARDS.map((s) => [s.id, s]));

  const breach = !!profile.breach_indicator;
  const maxCvss = Number(profile.max_cvss) || 0;
  const patchLag = Number(profile.patch_lag_days) || 0;
  const criticalCount = cves.filter((c) => Number(c.cvss) >= 9).length;
  const highCount = cves.filter((c) => Number(c.cvss) >= 7 && Number(c.cvss) < 9).length;
  const kevList = cves.filter((c) => c.known_exploited).map((c) => c.id);
  const rating = profile.iso27005?.risk_rating ?? iso27005Rating(profile.risk_score ?? 0);
  const likelihood =
    profile.iso27005?.likelihood?.level ??
    iso27005Likelihood({ breach_indicator: breach, max_cvss: maxCvss, patch_lag_days: patchLag }).level;
  const consequence =
    profile.iso27005?.consequence?.level ?? iso27005Consequence(profile.connected_plant_count).level;
  const band = profile.band ?? "low";
  const lastAudit = props.last_audit_date ? new Date(props.last_audit_date) : null;
  const auditAge = lastAudit ? Math.floor((Date.now() - lastAudit.getTime()) / 86_400_000) : null;
  const erp = !!props.erp_connected;
  const redundant = props.is_redundant === true;
  const soleSource = props.is_redundant === false;
  const scenario = impact.scenario || "breach";
  const { summary: gapSummary } = supplierComplianceFindings(profile, props);
  const totalGaps = gapSummary.gap;

  const mk = (ref, title, status, rationale, remediation) => ({
    ref,
    title,
    status,
    rationale,
    remediation: status === "pass" || status === "na" ? undefined : remediation,
  });
  const groupFor = (id, headline, checks) => {
    const summary = { pass: 0, fail: 0, partial: 0, na: 0 };
    for (const c of checks) summary[c.status] += 1;
    const gband = summary.fail > 0 ? "critical" : summary.partial > 0 ? "medium" : "low";
    return { id, name: meta[id].name, headline, band: gband, summary, checks };
  };

  const groups = [];

  if (ids.has("cvss31")) {
    groups.push(
      groupFor("cvss31", `Max ${maxCvss.toFixed(1)} — ${cvssV31Severity(maxCvss).label}`, [
        mk("Critical (≥9.0)", "No Critical-severity CVEs in scope", criticalCount === 0 ? "pass" : "fail",
          `${criticalCount} Critical CVE(s) matched to this supplier.`,
          "Patch or apply compensating controls for all Critical CVEs."),
        mk("High (7.0–8.9)", "No High-severity CVEs in scope", highCount === 0 ? "pass" : "fail",
          `${highCount} High CVE(s) matched.`,
          "Remediate High-severity vulnerabilities as a priority."),
        mk("Max base score", "Highest base score below High (< 7.0)", maxCvss < 7 ? "pass" : "fail",
          `Highest base score is ${maxCvss.toFixed(1)}.`,
          "Reduce maximum CVSS exposure below 7.0 through patching."),
      ])
    );
  }

  if (ids.has("cisakev")) {
    groups.push(
      groupFor("cisakev", kevList.length ? `${kevList.length} actively exploited` : "No active exploitation", [
        mk("Exploitation status", "No actively exploited (KEV) CVEs", breach ? "fail" : "pass",
          breach ? `Actively exploited: ${kevList.join(", ")}.` : "No CISA KEV match for this supplier.",
          "Treat KEV items as emergencies: patch within CISA timelines or isolate."),
        mk("Remediation timeliness", "KEV remediation within required window", !breach ? "na" : patchLag < 14 ? "pass" : "fail",
          !breach ? "No KEV items requiring remediation." : `Patch lag is ${patchLag} day(s).`,
          "Remediate KEV vulnerabilities within 14 days (or per BOD 22-01)."),
      ])
    );
  }

  if (ids.has("iso27005")) {
    const likeStatus = ["Very Low", "Low"].includes(likelihood) ? "pass" : likelihood === "Medium" ? "partial" : "fail";
    const consStatus = ["Minor", "Moderate"].includes(consequence) ? "pass" : consequence === "Major" ? "partial" : "fail";
    const rateStatus = rating === "Low" ? "pass" : rating === "Medium" ? "partial" : "fail";
    groups.push(
      groupFor("iso27005", `Risk rating: ${rating}`, [
        mk("Likelihood", "Likelihood within appetite (≤ Low)", likeStatus,
          `Assessed likelihood: ${likelihood}.`,
          "Reduce exposure (patch/KEV remediation) to lower likelihood."),
        mk("Consequence", "Consequence within appetite (≤ Moderate)", consStatus,
          `Assessed consequence: ${consequence} (${profile.connected_plant_count ?? impact.affected_plants ?? 0} plant(s)).`,
          "Add redundancy/segmentation to reduce blast radius."),
        mk("Risk evaluation", "Residual risk within appetite (≤ Medium)", rateStatus,
          `Overall ISO 27005 rating: ${rating} for the ${scenario}.`,
          "Apply risk treatment to bring residual risk within appetite."),
      ])
    );
  }

  if (ids.has("iso27001")) {
    const treatStatus = ["Low", "Medium"].includes(rating) ? "pass" : rating === "High" ? "partial" : "fail";
    const gapStatus = totalGaps === 0 ? "pass" : totalGaps <= 2 ? "partial" : "fail";
    groups.push(
      groupFor("iso27001", `Treatment: ${rating === "Critical" || rating === "High" ? "Modify" : rating === "Medium" ? "Modify/Share" : "Retain"}`, [
        mk("Clause 6.1.2", "Information security risk assessment performed", "pass",
          "A live risk profile is computed for this supplier."),
        mk("Clause 6.1.3", "Risk treatment adequate for residual risk", treatStatus,
          `Residual risk rating is ${rating}.`,
          "Define and execute a treatment plan; escalate to the risk owner."),
        mk("Annex A posture", "Annex A control gaps resolved", gapStatus,
          `${totalGaps} open control gap(s) across ISO 27002 / NIST 800-53.`,
          "Close outstanding control gaps to satisfy the ISMS."),
      ])
    );
  }

  if (ids.has("iso27002")) {
    groups.push(
      groupFor("iso27002", "Annex A controls", [
        mk("A.5.7", "Threat intelligence", "pass", "Live NVD + CISA KEV intelligence is monitored."),
        mk("A.5.20", "Information security in supplier agreements", band === "critical" ? "fail" : band === "medium" ? "partial" : "pass",
          `Supplier risk band is ${band}.`,
          "Enforce cyber clauses, breach-notification SLAs and audit rights."),
        mk("A.5.21", "ICT supply chain security", erp ? "partial" : "na",
          erp ? "Active ERP integration must be governed and monitored." : "No ICT integration on record.",
          "Govern and continuously monitor the ICT supply-chain integration."),
        mk("A.5.22", "Monitoring & review of supplier services", auditAge !== null && auditAge <= 365 ? "pass" : "fail",
          auditAge === null ? "No assessment on record." : `Last assessment ${auditAge} day(s) ago.`,
          "Reassess the supplier at least every 12 months."),
        mk("A.5.30", "ICT readiness for business continuity", redundant ? "pass" : "fail",
          redundant ? "Redundant/alternate sourcing available." : "Sole-source supplier — continuity at risk.",
          "Qualify an alternate supplier and build continuity provisions."),
        mk("A.8.8", "Management of technical vulnerabilities", breach ? "fail" : maxCvss >= 7 ? "partial" : "pass",
          breach ? "Unremediated KEV vulnerability present." : maxCvss >= 7 ? `Open high/critical CVE (max ${maxCvss.toFixed(1)}).` : "No high/critical exposure.",
          "Establish a vulnerability remediation SLA and patch backlog."),
        mk("A.8.16", "Monitoring activities", "pass", "Continuous monitoring via the platform."),
      ])
    );
  }

  if (ids.has("nist80053")) {
    groups.push(
      groupFor("nist80053", "SP 800-53 controls", [
        mk("RA-3", "Risk assessment", "pass", "Risk profile maintained for this supplier."),
        mk("RA-5", "Vulnerability monitoring & scanning", breach ? "fail" : maxCvss >= 7 ? "partial" : "pass",
          breach ? "Known exploited vulnerability outstanding." : maxCvss >= 7 ? "High-severity vulnerabilities pending." : "No high/critical exposure.",
          "Continuously scan and remediate within defined SLAs."),
        mk("SI-5", "Security alerts & advisories", "pass", "Threat feed ingests NVD/CISA advisories."),
        mk("CA-7", "Continuous monitoring", "pass", "Posture is monitored continuously."),
        mk("SR-3", "Supply chain controls & processes", soleSource && band === "critical" ? "fail" : redundant ? "pass" : "partial",
          redundant ? "Alternate sourcing exists." : "Single-source dependency.",
          "Define supply-chain controls and qualify alternates."),
        mk("SR-6", "Supplier assessments & reviews", auditAge !== null && auditAge <= 365 ? "pass" : "fail",
          auditAge === null ? "No assessment on record." : `Assessed ${auditAge} day(s) ago.`,
          "Conduct supplier security assessments at least annually."),
        mk("SR-8", "Notification agreements", "partial", "Breach-notification SLA not verified in contract.",
          "Add breach-notification and incident-reporting clauses to the agreement."),
        mk("IR-4", "Incident handling readiness", !breach && redundant ? "pass" : "partial",
          `Readiness for a ${scenario}: ${redundant ? "redundancy available" : "limited fallback"}${breach ? ", active exploitation in play" : ""}.`,
          "Pre-stage IR runbooks and containment playbooks for this supplier."),
        mk("CP-2", "Contingency plan", redundant ? "pass" : "fail",
          redundant ? "Alternate sourcing supports contingency." : "No qualified alternate for contingency.",
          "Develop a contingency plan with a qualified alternate supplier."),
        mk("SC-7", "Boundary protection", erp ? "partial" : "pass",
          erp ? "ERP connectivity requires segmentation/zero-trust enforcement." : "No external integration to segment.",
          "Segment the integration and enforce boundary controls."),
      ])
    );
  }

  const totals = { pass: 0, fail: 0, partial: 0, na: 0 };
  for (const g of groups) for (const k of Object.keys(totals)) totals[k] += g.summary[k];
  totals.total = totals.pass + totals.fail + totals.partial + totals.na;
  return { groups, totals };
}
