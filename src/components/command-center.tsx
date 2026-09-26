import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Database,
  GitBranch,
  HardDrive,
  Layers3,
  LockKeyhole,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type PipelineStatus = "Running" | "Healthy" | "Recovering" | "Paused" | "Failed";
type Pipeline = {
  name: string;
  status: PipelineStatus;
  source: string;
  destination: string;
  lastRun: string;
  duration: string;
  success: string;
  recovery: string;
};

const initialPipelines: Pipeline[] = [
  { name: "customer_retention_daily", status: "Running", source: "BigQuery", destination: "GCS · Parquet", lastRun: "2 min ago", duration: "04:12", success: "99.8%", recovery: "Enabled" },
  { name: "transaction_ingestion", status: "Healthy", source: "PostgreSQL", destination: "BigQuery", lastRun: "8 min ago", duration: "01:48", success: "100%", recovery: "Enabled" },
  { name: "product_analytics", status: "Recovering", source: "Kafka", destination: "BigQuery", lastRun: "11 min ago", duration: "06:31", success: "97.2%", recovery: "Medic active" },
  { name: "marketing_attribution", status: "Healthy", source: "GCS · CSV", destination: "BigQuery", lastRun: "24 min ago", duration: "02:06", success: "99.1%", recovery: "Enabled" },
  { name: "revenue_aggregation", status: "Paused", source: "BigQuery", destination: "Snowflake", lastRun: "1 hr ago", duration: "—", success: "98.7%", recovery: "Paused" },
];

const navGroups = [
  { label: "WORKSPACE", items: [{ name: "Overview", icon: Layers3 }, { name: "Pipelines", icon: Workflow }, { name: "Create pipeline", icon: Plus }, { name: "Runs", icon: Activity }] },
  { label: "AUTONOMY", items: [{ name: "Agents", icon: Bot }, { name: "Incidents", icon: AlertTriangle }, { name: "Schemas", icon: Database }, { name: "Code & deployments", icon: GitBranch }] },
  { label: "PLATFORM", items: [{ name: "Infrastructure", icon: Server }, { name: "Audit logs", icon: ShieldCheck }, { name: "Settings", icon: MoreHorizontal }] },
];

const activityEvents = [
  { time: "14:34:17", title: "Pipeline recovered successfully", detail: "product_analytics · run 8f2c1a", status: "good", icon: CheckCircle2 },
  { time: "14:33:02", title: "Pipeline redeployed", detail: "product_analytics · commit 7bc91e4", status: "blue", icon: GitBranch },
  { time: "14:32:31", title: "Validation passed · 18/18 checks", detail: "Schema contract · unit · Spark tests", status: "good", icon: ShieldCheck },
  { time: "14:32:24", title: "Patch candidate generated", detail: "Medic Agent · memory tuning", status: "blue", icon: Sparkles },
  { time: "14:32:15", title: "Schema change identified", detail: "customer_events · column type widened", status: "warn", icon: Database },
  { time: "14:32:08", title: "AnalysisException detected", detail: "product_analytics · task transform_03", status: "bad", icon: AlertTriangle },
];

const chartPoints = [
  { x: 0, ok: 41, recovered: 10, failed: 5 }, { x: 8, ok: 48, recovered: 13, failed: 8 },
  { x: 16, ok: 43, recovered: 12, failed: 6 }, { x: 24, ok: 55, recovered: 17, failed: 10 },
  { x: 32, ok: 51, recovered: 14, failed: 8 }, { x: 40, ok: 63, recovered: 22, failed: 13 },
  { x: 48, ok: 60, recovered: 20, failed: 11 }, { x: 56, ok: 70, recovered: 25, failed: 15 },
  { x: 64, ok: 67, recovered: 22, failed: 12 }, { x: 72, ok: 79, recovered: 29, failed: 16 },
  { x: 80, ok: 74, recovered: 26, failed: 14 }, { x: 88, ok: 87, recovered: 32, failed: 19 },
  { x: 96, ok: 83, recovered: 28, failed: 16 }, { x: 100, ok: 94, recovered: 37, failed: 21 },
];

function StatusPill({ status }: { status: PipelineStatus }) {
  const tone = status === "Healthy" || status === "Running" ? "status-good" : status === "Recovering" ? "status-warn" : status === "Failed" ? "status-bad" : "status-muted";
  return <span className={`status-pill ${tone}`}><span className="status-dot" />{status}</span>;
}

function HealthChart({ range }: { range: string }) {
  const makePath = (key: "ok" | "recovered" | "failed") => chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${100 - point[key]}`).join(" ");
  return (
    <div className="chart-wrap">
      <div className="chart-scale"><span>120</span><span>90</span><span>60</span><span>30</span><span>0</span></div>
      <svg className="health-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Pipeline health over ${range}`}>
        {[0, 25, 50, 75, 100].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="chart-gridline" />)}
        <path d={`${makePath("ok")} L 100 100 L 0 100 Z`} className="chart-area" />
        <path d={makePath("ok")} className="chart-line line-good" />
        <path d={makePath("recovered")} className="chart-line line-recovered" />
        <path d={makePath("failed")} className="chart-line line-failed" />
      </svg>
      <div className="chart-times"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>Now</span></div>
    </div>
  );
}

export function CommandCenter() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [range, setRange] = useState("24h");
  const [prompt, setPrompt] = useState("");
  const [planReady, setPlanReady] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [pipelines, setPipelines] = useState(initialPipelines);

  const visiblePipelines = useMemo(() => pipelines.filter((pipeline) => `${pipeline.name} ${pipeline.source} ${pipeline.destination} ${pipeline.status}`.toLowerCase().includes(filter.toLowerCase())), [filter, pipelines]);

  const handleGenerate = () => {
    if (!prompt.trim()) {
      setNotice("Describe the pipeline you want to build first.");
      return;
    }
    setPlanReady(true);
    setNotice("");
  };

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  const approvePlan = () => {
    const pipeline: Pipeline = { name: prompt.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32) || "new_pipeline", status: "Running", source: "BigQuery", destination: "GCS · Parquet", lastRun: "Just now", duration: "00:03", success: "—", recovery: "Enabled" };
    setPipelines((existing) => [pipeline, ...existing]);
    setPlanReady(false);
    setPrompt("");
    setActiveNav("Pipelines");
    notify("Plan approved · deterministic checks passed · deployment queued");
  };

  const pageTitle = activeNav === "Overview" ? "Data Engineering Command Center" : activeNav;

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark"><Workflow size={19} strokeWidth={1.8} /></div>
          <div className="brand-name"><span>AI DATA</span><strong>ENGINEER</strong></div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={16} /></button>
        </div>
        <div className="private-status"><span className="status-dot" />PRIVATE / ON-PREM <LockKeyhole size={12} /></div>
        <div className="workspace-picker"><div className="workspace-avatar">P</div><div><strong>Platform workspace</strong><span>production cluster</span></div><ChevronDown size={14} /></div>
        <nav className="side-navigation" aria-label="Main navigation">
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            {group.items.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${activeNav === name ? "nav-item-active" : ""}`} onClick={() => { setActiveNav(name); setSidebarOpen(false); }}>
              <Icon size={16} strokeWidth={1.8} /><span>{name}</span>{name === "Incidents" && <span className="nav-count">2</span>}
            </button>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="medic-brief"><div className="medic-top"><span><span className="status-dot dot-cyan" /> MEDIC AGENT</span><span className="online-label">ONLINE</span></div><div className="medic-progress"><span /></div><div className="medic-foot"><span>2 active tasks</span><span>2 / 3 gates</span></div></div>
          <div className="profile-row"><div className="profile-avatar">AW</div><div className="profile-copy"><strong>Aman Wairagkar</strong><span>Data Engineer</span></div><MoreHorizontal size={17} /></div>
          <div className="production-tag"><span className="status-dot dot-good" />PRODUCTION</div>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="topbar">
          <div className="topbar-left"><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu /></Button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={13} /><strong>{activeNav}</strong></div></div>
          <div className="topbar-right"><button className="environment-select"><span className="status-dot dot-good" />Production <ChevronDown size={13} /></button><div className="top-health"><span className="status-dot dot-good" /><span>All systems operational</span></div><div className="model-indicator"><span className="model-glyph">◈</span><span>Local LLM <b>·</b> Online</span></div><Button variant="ghost" size="icon" className="top-icon" aria-label="Search" onClick={() => document.getElementById("pipeline-search")?.focus()}><Search /></Button><Button variant="ghost" size="icon" className="top-icon help-icon" aria-label="Help" onClick={() => notify("Platform documentation · Internal support") }><CircleHelp /></Button><div className="top-avatar">AW</div></div>
        </header>

        <div className="page-scroll">
          {activeNav === "Create pipeline" ? <section className="create-page">
            <div className="page-heading"><div><div className="eyebrow"><span className="status-dot dot-cyan" /> PIPELINE PLANNER</div><h1>Create a data pipeline</h1><p>Describe the outcome. Review the plan, generated artifacts, and validation before deployment.</p></div><span className="private-chip"><LockKeyhole size={13} /> Data stays inside your environment</span></div>
            <section className="instruction-panel"><div className="panel-heading"><div><span className="section-kicker">01 / REQUEST</span><h2>Pipeline requirements</h2></div><span className="private-chip">Natural language</span></div><textarea className="pipeline-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. Ingest daily transactions from BigQuery to GCS as Parquet, partition by event date, and mask customer email addresses…" /><div className="prompt-footer"><span><LockKeyhole size={13} /> Prompt processed by your local model runtime</span><Button className="action-primary" onClick={handleGenerate}><Sparkles size={15} /> Generate pipeline plan</Button></div></section>
            {planReady && <PlanReview prompt={prompt} onApprove={approvePlan} onEdit={() => setPlanReady(false)} />}
            {!planReady && <div className="planner-steps"><span className="step-active"><i>1</i> Request</span><ChevronRight size={15} /><span><i>2</i> AI proposal</span><ChevronRight size={15} /><span><i>3</i> Validation</span><ChevronRight size={15} /><span><i>4</i> Deploy</span></div>}
          </section> : <>
            <section className="page-heading">
              <div><div className="eyebrow"><span className="eyebrow-mark" /> PRODUCTION / DATA PLATFORM</div><h1>{pageTitle}</h1><p>{activeNav === "Overview" ? "Monitor pipelines, autonomous agents, infrastructure and recovery activity." : getSectionDescription(activeNav)}</p></div>
              <div className="heading-actions"><span className="last-updated"><span className="live-dot" /> LIVE <span className="updated-divider">·</span> Updated just now</span><Button className="action-primary" onClick={() => { setActiveNav("Create pipeline"); setPlanReady(false); }}><Plus size={15} /> New pipeline</Button></div>
            </section>

            <section className="metrics-grid" aria-label="Platform metrics">
              <MetricCard title="Active pipelines" value="24" note="+3 this week" icon={Workflow} change="up" />
              <MetricCard title="Running jobs" value="7" note="2 Spark · 5 Airflow" icon={Play} />
              <MetricCard title="Success rate" value="98.4%" note="Last 7 days" icon={Activity} change="up" />
              <MetricCard title="Autonomous recoveries" value="18" note="92% resolved independently" icon={Zap} change="up" />
            </section>

            <section className="overview-grid">
              <div className="main-column">
                <section className="panel health-panel">
                  <div className="panel-heading"><div><span className="section-kicker">EXECUTION TELEMETRY</span><h2>Pipeline health</h2></div><div className="range-control" aria-label="Chart time range">{["24h", "7d", "30d"].map((period) => <button key={period} className={range === period ? "range-active" : ""} onClick={() => setRange(period)}>{period}</button>)}</div></div>
                  <div className="chart-summary"><strong>1,284 <span>total runs</span></strong><span className="chart-variance"><ArrowUpRight size={14} /> 6.2% <small>vs previous period</small></span></div>
                  <HealthChart range={range} />
                  <div className="chart-legend"><span><i className="legend-good" />Successful <b>1,251</b></span><span><i className="legend-recovered" />Recovered <b>24</b></span><span><i className="legend-failed" />Failed <b>9</b></span></div>
                </section>

                <section className="panel pipeline-panel">
                  <div className="panel-heading pipeline-heading"><div><span className="section-kicker">ORCHESTRATION</span><h2>Active pipelines <span className="subtle-count">{pipelines.length}</span></h2></div><div className="table-actions"><label className="search-field"><Search size={14} /><input id="pipeline-search" aria-label="Search pipelines" placeholder="Filter pipelines…" value={filter} onChange={(event) => setFilter(event.target.value)} /></label><Button variant="outline" size="sm" className="filter-button" onClick={() => { setFilter(""); notify("Pipeline filters cleared"); }}>Filters <ChevronDown size={13} /></Button></div></div>
                  <div className="table-scroll"><table className="pipeline-table"><thead><tr><th>Pipeline</th><th>Status</th><th>Source</th><th>Destination</th><th>Last run</th><th>Duration</th><th>Success</th><th>AI recovery</th></tr></thead><tbody>
                    {visiblePipelines.map((pipeline) => <tr key={pipeline.name} onClick={() => setSelectedPipeline(pipeline)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedPipeline(pipeline); }}><td><span className="pipeline-name">{pipeline.name}</span><span className="pipeline-id">AF · {pipeline.name === "product_analytics" ? "run_8f2c1a" : "dag_" + pipeline.name.slice(0, 8)}</span></td><td><StatusPill status={pipeline.status} /></td><td><span className="table-source"><Database size={13} />{pipeline.source}</span></td><td>{pipeline.destination}</td><td>{pipeline.lastRun}</td><td className="mono-value">{pipeline.duration}</td><td><span className="success-value">{pipeline.success}</span></td><td><span className={pipeline.recovery === "Medic active" ? "recovery-active" : "recovery-enabled"}><span className="status-dot" />{pipeline.recovery}</span></td></tr>)}
                    {visiblePipelines.length === 0 && <tr><td colSpan={8} className="empty-table">No pipelines match “{filter}”.</td></tr>}
                  </tbody></table></div>
                  <div className="table-footer"><span>Showing {visiblePipelines.length} of {pipelines.length} pipelines</span><button onClick={() => setActiveNav("Pipelines")}>View all pipelines <ChevronRight size={13} /></button></div>
                </section>
              </div>

              <aside className="right-column">
                <section className="panel recovery-panel">
                  <div className="panel-heading"><div><span className="section-kicker">AUTONOMOUS REMEDIATION</span><h2>Medic recovery loop</h2></div><span className="online-tag"><i /> ACTIVE</span></div>
                  <div className="recovery-context"><div className="context-symbol"><Bot size={17} /></div><div><strong>product_analytics</strong><span>AnalysisException · 2m ago</span></div><button aria-label="More incident options" className="icon-button" onClick={() => notify("Incident run 8f2c1a · production cluster") }><MoreHorizontal size={17} /></button></div>
                  <div className="recovery-steps"><div className="recovery-step done"><span className="step-icon"><Check size={12} /></span><div><strong>Failure analyzed</strong><span>Type mismatch · column session_id</span></div><time>14:32:08</time></div><div className="recovery-step done"><span className="step-icon"><Check size={12} /></span><div><strong>Patch generated</strong><span>Cast widened to BIGINT · 3 files</span></div><time>14:32:24</time></div><div className="recovery-step done"><span className="step-icon"><Check size={12} /></span><div><strong>Deterministic checks passed</strong><span>18 / 18 checks · 0 policy warnings</span></div><time>14:32:31</time></div><div className="recovery-step current"><span className="step-icon"><ArrowUpRight size={12} /></span><div><strong>Redeployed successfully</strong><span>commit 7bc91e4 · run 8f2c1a</span></div><time>14:33:02</time></div></div>
                  <div className="recovery-footer"><span><ShieldCheck size={14} /> 1 of 2 hourly attempts used</span><Button variant="outline" size="sm" onClick={() => setActiveNav("Incidents")}>Inspect incident <ChevronRight size={13} /></Button></div>
                </section>

                <section className="panel activity-panel"><div className="panel-heading"><div><span className="section-kicker">AUDITABLE EVENT STREAM</span><h2>Autonomous activity</h2></div><Button variant="ghost" size="icon" className="more-button" aria-label="Activity options" onClick={() => setActiveNav("Audit logs")}><MoreHorizontal /></Button></div><div className="activity-list">{activityEvents.slice(0, 5).map(({ time, title, detail, status, icon: Icon }) => <div className="activity-item" key={time}><span className={`activity-icon activity-${status}`}><Icon size={14} /></span><div className="activity-copy"><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>)}</div><button className="activity-all" onClick={() => setActiveNav("Audit logs")}>View full activity log <ChevronRight size={13} /></button></section>

                <section className="infra-strip"><div className="infra-heading"><span className="section-kicker">CONNECTED SERVICES</span><button aria-label="View infrastructure" onClick={() => setActiveNav("Infrastructure")}><ChevronRight size={15} /></button></div><div className="infra-grid"><InfraItem icon={Workflow} label="Airflow" value="2.x" /><InfraItem icon={Box} label="Spark" value="Connected" /><InfraItem icon={Database} label="Warehouse" value="BigQuery" /><InfraItem icon={HardDrive} label="GitLab" value="Connected" /></div></section>
              </aside>
            </section>
          </>}
          <footer className="page-footer"><span><LockKeyhole size={12} /> PRIVATE INFRASTRUCTURE <span className="footer-dot">·</span> NO EXTERNAL DATA TRANSFER</span><span>CONTROL PLANE <b>v2.4.0</b></span></footer>
        </div>
      </main>

      {notice && <div className="toast-message" role="status"><CheckCircle2 size={16} />{notice}<button aria-label="Dismiss" onClick={() => setNotice("")}><X size={14} /></button></div>}
      {selectedPipeline && <div className="dialog-backdrop" role="presentation" onClick={() => setSelectedPipeline(null)}><section className="pipeline-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={(event) => event.stopPropagation()}><div className="dialog-heading"><div><span className="section-kicker">PIPELINE DETAIL · PRODUCTION</span><h2 id="dialog-title">{selectedPipeline.name}</h2></div><button className="icon-button" aria-label="Close details" onClick={() => setSelectedPipeline(null)}><X size={18} /></button></div><div className="dialog-status"><StatusPill status={selectedPipeline.status} /><span>Airflow DAG · dag_{selectedPipeline.name.slice(0, 8)}</span></div><div className="detail-grid"><div><span>Source</span><strong>{selectedPipeline.source}</strong></div><div><span>Destination</span><strong>{selectedPipeline.destination}</strong></div><div><span>Last run</span><strong>{selectedPipeline.lastRun}</strong></div><div><span>Duration</span><strong>{selectedPipeline.duration}</strong></div><div><span>Success rate</span><strong>{selectedPipeline.success}</strong></div><div><span>AI recovery</span><strong>{selectedPipeline.recovery}</strong></div></div><div className="dialog-run"><div className="run-icon"><Workflow size={16} /></div><div><strong>Latest execution · run_8f2c1a</strong><span>Validation passed · Airflow · Spark · 14:34 UTC</span></div><CheckCircle2 size={16} className="run-check" /></div><div className="dialog-actions"><Button variant="outline" onClick={() => { setSelectedPipeline(null); setActiveNav("Runs"); }}>View run history</Button><Button className="action-primary" onClick={() => { setSelectedPipeline(null); notify("Run queued · execution will start shortly"); }}><Play size={14} /> Run now</Button></div></section></div>}
    </div>
  );
}

function MetricCard({ title, value, note, icon: Icon, change }: { title: string; value: string; note: string; icon: typeof Activity; change?: "up" }) {
  return <div className="metric-card"><div className="metric-top"><span>{title}</span><Icon size={16} /></div><div className="metric-value">{value}</div><div className="metric-note">{change && <ArrowUpRight size={13} />}{note}</div></div>;
}

function InfraItem({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return <div className="infra-item"><Icon size={15} /><div><strong>{label}</strong><span><i />{value}</span></div></div>;
}

function PlanReview({ prompt, onApprove, onEdit }: { prompt: string; onApprove: () => void; onEdit: () => void }) {
  const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32) || "new_pipeline";
  return <section className="panel plan-review"><div className="panel-heading"><div><span className="section-kicker">02 / AI PROPOSAL · REQUIRES APPROVAL</span><h2>AI generated pipeline plan</h2></div><span className="proposal-tag"><Sparkles size={13} /> PROPOSAL</span></div><div className="plan-summary"><div><span>Pipeline name</span><strong>{slug}</strong></div><div><span>Execution schedule</span><strong>Every day at 00:00 UTC</strong></div><div><span>Source</span><strong>BigQuery · source dataset</strong></div><div><span>Destination</span><strong>GCS · partitioned Parquet</strong></div></div><div className="plan-flow"><span>Extract</span><ChevronRight size={14} /><span>Validate schema</span><ChevronRight size={14} /><span>Spark transform</span><ChevronRight size={14} /><span>Quality checks</span><ChevronRight size={14} /><span>Write target</span></div><div className="validation-banner"><ShieldCheck size={16} /><div><strong>Deterministic validation passed</strong><span>18 / 18 checks · policy and schema contracts clear · no external model requests</span></div><CheckCircle2 size={16} /></div><p className="proposal-copy">Request: “{prompt}”</p><div className="plan-actions"><Button variant="outline" onClick={onEdit}>Edit request</Button><Button className="action-primary" onClick={onApprove}><Check size={15} /> Approve & deploy</Button></div></section>;
}

function getSectionDescription(section: string) {
  const descriptions: Record<string, string> = { Pipelines: "Track deployed data workflows, execution state, and recovery controls.", Runs: "Inspect recent pipeline executions, validation results, and task-level logs.", Agents: "Review controlled agent activity, tools, permissions, and success rates.", Incidents: "Investigate failures, inspect proposed patches, and review recovery timelines.", Schemas: "Monitor registered data contracts and evaluate schema compatibility changes.", "Code & deployments": "Review generated artifacts, protected branches, validation, and releases.", Infrastructure: "Check the health of connected compute, storage, Git, and model services.", "Audit logs": "Search a traceable record of human and autonomous platform actions.", Settings: "Manage platform policies, local model runtime, roles, and integrations." };
  return descriptions[section] ?? "Platform operations and recent activity.";
}