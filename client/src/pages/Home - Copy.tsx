import { trpc } from "@/lib/trpc";
import type { CareerAnalysisResult, CareerInsight, SkillPriority } from "@shared/career";
import TutorialRecommendations from "@/components/TutorialRecommendations";
import JobExplorer from "@/components/JobExplorer";
import { ArrowUpRight, BrainCircuit, Check, ChevronRight, CircleGauge, FileText, GraduationCap, Loader2, Sparkles, Target, UploadCloud, WandSparkles, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

const priorityStyles: Record<SkillPriority, string> = {
  high: "bg-[#ff7568]/15 text-[#b94136] ring-1 ring-[#ff7568]/25",
  medium: "bg-[#ffc858]/20 text-[#886000] ring-1 ring-[#ffc858]/35",
  low: "bg-[#37cbbf]/15 text-[#08786f] ring-1 ring-[#37cbbf]/25",
};

function ScoreRing({ score, size = "large" }: { score: number; size?: "large" | "small" }) {
  const outer = size === "large" ? "h-35 w-35 text-4xl" : "h-17 w-17 text-lg";
  return <div className={`relative grid shrink-0 place-items-center rounded-full ${outer}`} style={{ background: `conic-gradient(#196ee7 0 ${score}%, #dceaf0 ${score}% 100%)` }}><div className="grid h-[calc(100%-10px)] w-[calc(100%-10px)] place-items-center rounded-full bg-white font-bold tracking-tight text-[#19354a]"><span>{score}</span></div></div>;
}

async function extractTextFromPdf(file: File) {
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await getDocument({ data }).promise;
  const pages = await Promise.all(Array.from({ length: document.numPages }, async (_, index) => {
    const page = await document.getPage(index + 1);
    const content = await page.getTextContent();
    return content.items.map(item => ("str" in item ? item.str : "")).join(" ");
  }));
  return pages.join("\n").replace(/\s+/g, " ").trim();
}

async function readPdfAsBase64(file: File) {
  const data = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => reader.result instanceof ArrayBuffer ? resolve(reader.result) : reject(new Error("Unable to read the PDF."));
    reader.onerror = () => reject(new Error("Unable to read the PDF."));
    reader.readAsArrayBuffer(file);
  });
  const bytes = new Uint8Array(data);
  const chunks: string[] = [];
  for (let start = 0; start < bytes.length; start += 0x8000) {
    let chunk = "";
    const end = Math.min(start + 0x8000, bytes.length);
    for (let index = start; index < end; index += 1) chunk += String.fromCharCode(bytes[index] ?? 0);
    chunks.push(chunk);
  }
  return btoa(chunks.join(""));
}

export default function Home() {
  const [analysis, setAnalysis] = useState<CareerAnalysisResult | null>(null);
  const [insight, setInsight] = useState<CareerInsight | null>(null);
  const [message, setMessage] = useState("Loading the supplied resume example…");
  const [processedFile, setProcessedFile] = useState("Supplied resume example");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exampleAnalysis = trpc.career.analyzeExample.useMutation();
  const resumeAnalysis = trpc.career.analyzeResume.useMutation();
  const resumePdfAnalysis = trpc.career.analyzeResumePdf.useMutation();
  const aiInsight = trpc.career.getAIInsights.useMutation();
  const isAnalyzing = exampleAnalysis.isPending || resumeAnalysis.isPending || resumePdfAnalysis.isPending;

  useEffect(() => {
    exampleAnalysis.mutate(undefined, { onSuccess: result => { setAnalysis(result); setMessage("Supplied example ready — upload a PDF to create a fresh personal analysis."); }, onError: () => setMessage("The supplied example could not be loaded. Upload your resume PDF to begin.") });
  }, []);

  const handleResume = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setMessage("Please upload a PDF resume."); return; }
    if (file.size > 7 * 1024 * 1024) { setMessage("Please upload a PDF smaller than 7 MB."); return; }
    const completeAnalysis = (result: CareerAnalysisResult) => {
      setAnalysis(result); setProcessedFile(file.name); setMessage("Analysis complete. Your best matches and most valuable skill gaps are ready.");
    };
    try {
      setInsight(null); setMessage(`Reading ${file.name}…`);
      const resumeText = await extractTextFromPdf(file);
      if (resumeText.length < 80) { setMessage("This PDF contains too little readable text. Please upload a text-based resume PDF."); return; }
      setMessage("Comparing your skills with the backend job catalogue…");
      resumeAnalysis.mutate({ resumeText }, { onSuccess: completeAnalysis, onError: error => setMessage(error.message || "We could not analyze that resume. Please try another PDF.") });
    } catch {
      try {
        setMessage("Using the secure mobile PDF compatibility check…");
        const base64 = await readPdfAsBase64(file);
        resumePdfAnalysis.mutate({ fileName: file.name, base64 }, {
          onSuccess: completeAnalysis,
          onError: error => setMessage(error.message || "We could not find readable text in this PDF. Please upload a text-based resume PDF."),
        });
      } catch {
        setMessage("We could not read this PDF. Please upload a text-based resume PDF.");
      }
    }
  };

  const generateInsight = () => {
    if (!analysis) return;
    setMessage("Generating a tailored career plan with AI…");
    const aiMatches = analysis.topMatches.slice(0, 6);
    aiInsight.mutate({ resumeText: `Resume skills detected: ${analysis.profile.detectedSkills.join(", ")}. Experience: ${analysis.profile.experience.totalYears ? `${analysis.profile.experience.totalYears}+ years` : "years not detected"}. Domains: ${analysis.profile.experience.domains.join(", ") || "not identified"}.`, matches: aiMatches.map(match => ({ role: match.role, company: match.company, score: match.score, matchedSkills: match.matchedSkills, missingSkills: match.missingSkills, experienceFit: { score: match.experienceFit.score, label: match.experienceFit.label, candidateYears: match.experienceFit.candidateYears, requiredYears: match.experienceFit.requiredYears, relevantDomains: match.experienceFit.relevantDomains }, certificationSignals: match.certificationSignals })), skillGaps: analysis.skillGaps.map(gap => ({ skill: gap.skill, priority: gap.priority, opportunityCount: gap.opportunityCount })) }, { onSuccess: result => { setInsight(result); setMessage("Your experience-aware career plan is ready."); }, onError: error => setMessage(error.message || "AI insights are temporarily unavailable. Please try again.") });
  };
  function getJobSource(url: string | null) {
    if (!url) return "Source not listed";

    try {
      const hostname = new URL(url).hostname.toLowerCase();

      if (hostname.includes("technopark.in")) {
        return "Technopark";
      }

      if (hostname.includes("infopark.in")) {
        return "Infopark";
      }

      return hostname.replace(/^www\./, "");
    } catch {
      return "Source not listed";
    }
  }


  const topMatch = analysis?.topMatches[0];
  return <div className="isometric-stage min-h-screen overflow-hidden bg-[#f8fcfd] text-[#173247]">
    <div className="iso-plane iso-plane-one hidden md:block" /><div className="iso-plane iso-plane-two hidden lg:block" />
    <header className="relative z-10 mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 lg:px-10"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#173b55] text-white shadow-[7px_8px_0_#4dd7cb]"><Target className="h-5 w-5" /></div><div><p className="text-xl font-bold tracking-[-0.06em] text-[#16364d]">CareerQuest</p><p className="mono-label text-[9px] text-[#578093]">match intelligence</p></div></div><div className="hidden items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs font-medium text-[#4c7184] shadow-sm sm:flex"><span className="h-2 w-2 rounded-full bg-[#36c9bb]" /> Curated role signals</div></header>
    <main className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-14 lg:px-10">
      <section className="relative mb-7 overflow-hidden rounded-[2rem] border border-white/90 bg-white/70 px-6 py-8 shadow-[0_22px_55px_rgba(18,79,110,0.10)] backdrop-blur-xl sm:px-9 lg:px-12 lg:py-10"><div className="pointer-events-none absolute right-[-3rem] top-[-3rem] h-48 w-48 rotate-45 rounded-[2rem] bg-[#b8f3ed]/65" /><div className="relative grid gap-9 lg:grid-cols-[minmax(0,1.1fr)_0.72fr] lg:items-center"><div className="max-w-3xl"><p className="mono-label mb-3 text-[10px] font-medium text-[#188d85]">Career matching quest</p><h1 className="max-w-2xl text-4xl font-bold leading-[0.93] tracking-[-0.075em] text-[#16364d] sm:text-5xl lg:text-6xl">Turn your resume into a clear next move.</h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#59788a] sm:text-base">Upload a resume PDF. CareerQuest compares it with a curated role catalogue, then pinpoints matching jobs and the skills most worth developing next.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"><label className="group inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#173b55] px-5 text-sm font-bold text-white shadow-[5px_6px_0_#4dd7cb] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}{isAnalyzing ? "Analyzing resume" : "Upload resume PDF"}<input ref={fileInputRef} className="sr-only" type="file" accept="application/pdf,.pdf" onChange={event => handleResume(event.target.files?.[0])} /></label><button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#cbe6e6] bg-white/70 px-5 text-sm font-semibold text-[#28716f] transition-all duration-150 hover:border-[#59cfc7] hover:bg-[#ecfbf8] active:scale-[0.98]" onClick={() => fileInputRef.current?.click()}><FileText className="h-4 w-4" /> PDF only · roles are ready for you</button></div><p className="mt-5 text-xs text-[#668695]" aria-live="polite">{message}</p></div><div className="relative hidden h-58 lg:block"><div className="absolute right-4 top-2 h-36 w-36 rotate-12 rounded-[2rem] border border-white/90 bg-[#d7fbf7]/80 shadow-[12px_14px_0_rgba(53,155,199,0.13)]" /><div className="absolute right-12 top-14 grid h-30 w-30 place-items-center rounded-[1.8rem] bg-[#1f7be5] text-white shadow-[10px_12px_0_rgba(68,210,197,0.55)]"><Target className="h-9 w-9" /></div><div className="absolute bottom-0 left-3 right-0"><div className="career-path-line absolute left-7 right-7 top-5" /><div className="relative flex justify-between"><PathNode number="01" label="Resume" color="teal" /><PathNode number="02" label="Signals" color="blue" /><PathNode number="03" label="Role fit" color="coral" /></div></div></div></div></section>
      {analysis ? <>
        <section className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(310px,0.72fr)]"><div className="space-y-7"><div className="flex items-end justify-between px-1"><div><p className="mono-label text-[10px] text-[#168f87]">Your role leaderboard</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.055em]">Best matching jobs</h2></div><span className="hidden text-xs text-[#668696] sm:inline">Ranked from resume evidence</span></div><div className="space-y-4">{analysis.topMatches.map((match, index) => <article key={match.id} className="soft-card group rounded-[1.45rem] p-5 transition-transform duration-200 hover:-translate-y-1 sm:p-6"><div className="flex gap-4 sm:gap-5"><ScoreRing score={match.score} size="small" /><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono-label text-[9px] text-[#3b82f6]">
              Rank 0{index + 1}
            </span>

            <span className="rounded-full bg-[#e7f2ff] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#216fc9]">
              {getJobSource(match.url)}
            </span>

            {index === 0 && (
              <span className="rounded-full bg-[#fff0d0] px-2 py-0.5 text-[9px] font-bold text-[#956100]">
                TOP FIT
              </span>
            )}
          </div>
          <h3 className="mt-1 text-lg font-bold leading-5 tracking-[-0.04em] text-[#18384f]">{match.role}</h3><p className="mt-1 text-xs text-[#678596]">{match.company}</p></div>{match.url && <a href={match.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#216fc9] hover:text-[#12549b]">View role <ArrowUpRight className="h-3.5 w-3.5" /></a>}</div><p className="mt-4 text-sm leading-5 text-[#527385]">{match.rationale}</p><div className="mt-4 grid gap-3 lg:grid-cols-2"><ChipSection label="Evidence found" chips={match.matchedSkills.slice(0, 10)} tone="match" /><ChipSection label="Growth edge" chips={match.missingSkills.slice(0, 10)} tone="gap" empty="No catalogue gap" /></div></div></div></article>)}</div></div>
          <aside className="space-y-5 xl:pt-10"><div className="soft-card overflow-hidden rounded-[1.6rem] p-6"><div className="flex items-start justify-between"><div><p className="mono-label text-[9px] text-[#168f87]">Top match</p><h2 className="mt-1 text-xl font-bold tracking-[-0.05em]">{topMatch?.role}</h2><p className="mt-1 max-w-40 text-xs text-[#668698]">{topMatch?.company}</p></div><Sparkles className="h-6 w-6 text-[#ff7568]" /></div><div className="my-6 flex justify-center"><ScoreRing score={topMatch?.score ?? 0} /></div><div className="flex items-center justify-between border-t border-[#dcecf0] pt-4"><span className="text-xs text-[#668698]">Evidence-backed match score</span><CircleGauge className="h-4 w-4 text-[#2573d0]" /></div></div><div className="soft-card rounded-[1.6rem] p-6"><div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-[#2480d3]" /><div><p className="mono-label text-[9px] text-[#168f87]">Readiness meter</p><h2 className="text-xl font-bold tracking-[-0.05em]">Your progress map</h2></div></div><div className="mt-6 space-y-5">{analysis.readiness.map((metric, index) => <div key={metric.label}><div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-bold text-[#36566a]">{metric.label}</span><span className="mono-label text-[10px] text-[#246dc6]">{metric.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#dcebef]"><div className={`h-full rounded-full ${index === 0 ? "bg-[#2e78e8]" : index === 1 ? "bg-[#2fc7bb]" : "bg-[#ff7b6f]"}`} style={{ width: `${metric.value}%` }} /></div><p className="mt-1.5 text-[11px] leading-4 text-[#7391a0]">{metric.detail}</p></div>)}</div></div></aside>
        </section>
        <JobExplorer />
        <section className="mt-9 grid gap-7 xl:grid-cols-[0.88fr_1.12fr]"><div className="soft-card rounded-[1.7rem] p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="mono-label text-[10px] text-[#168f87]">Skill signal</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.055em]">Areas for improvement</h2><p className="mt-2 max-w-lg text-xs leading-5 text-[#668798]">Priorities are weighted by how often a missing skill appears in your best matching roles.</p></div><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff0ed] text-[#e36558]"><Zap className="h-5 w-5" /></div></div><div className="mt-6 space-y-3">{analysis.skillGaps.length ? analysis.skillGaps.map(gap => <div key={gap.skill} className="flex items-center gap-3 rounded-xl border border-[#e1eef1] bg-white/70 p-3.5"><span className={`min-w-13 rounded-lg px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wider ${priorityStyles[gap.priority]}`}>{gap.priority}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#25475b]">{gap.skill}</p><p className="mt-0.5 text-[11px] leading-4 text-[#75919e]">{gap.description}</p></div><ChevronRight className="h-4 w-4 text-[#7aa2b3]" /></div>) : <p className="rounded-xl bg-[#f0faf9] p-4 text-sm text-[#52798c]">No recurring skill gaps were detected in the top roles.</p>}</div></div><div className="soft-card rounded-[1.7rem] p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="mono-label text-[10px] text-[#168f87]">Resume record</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.055em]">Detected career toolkit</h2><p className="mt-2 text-xs text-[#668798]">Source: {processedFile}</p></div><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f2ff] text-[#277ae0]"><FileText className="h-5 w-5" /></div></div><div className="mt-6 flex flex-wrap gap-2">{analysis.profile.detectedSkills.map(skill => <span key={skill} className="rounded-lg border border-[#cae7e6] bg-[#f4fffe] px-2.5 py-1.5 text-xs font-semibold text-[#237773]">{skill}</span>)}</div></div></section>
        <AICareerCoach isPending={aiInsight.isPending} onGenerate={generateInsight} />
        {insight && <section className="mt-9 overflow-hidden rounded-[1.85rem] border border-[#bfdede] bg-[#effbfa]/85 shadow-[0_16px_35px_rgba(28,120,122,0.10)]"><div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]"><div><div className="flex items-center gap-2 text-[#13877f]"><WandSparkles className="h-5 w-5" /><p className="mono-label text-[10px]">AI career insight</p></div><h2 className="mt-3 text-3xl font-bold leading-8 tracking-[-0.065em] text-[#163d53]">{insight.headline}</h2><p className="mt-4 text-sm leading-6 text-[#507283]">{insight.summary}</p><div className="mt-6 rounded-xl bg-white/75 p-4"><p className="mono-label text-[9px] text-[#4e7d8d]">Apply this week</p><ol className="mt-3 space-y-2">{insight.applicationPlan.map((step, index) => <li key={step} className="flex gap-2 text-xs leading-5 text-[#486c7e]"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#1d6ed8] text-[10px] font-bold text-white">{index + 1}</span>{step}</li>)}</ol></div></div><div className="grid gap-4 md:grid-cols-2"><div className="rounded-2xl bg-white/75 p-5"><p className="mono-label text-[9px] text-[#4e7d8d]">Learning priorities</p><div className="mt-4 space-y-4">{insight.learningPriorities.map(item => <div key={item.skill}><p className="text-sm font-bold text-[#244b60]">{item.skill}</p><p className="mt-1 text-xs leading-5 text-[#648492]">{item.reason}</p><p className="mt-1.5 text-xs font-semibold text-[#16877f]">Next: {item.nextStep}</p></div>)}</div></div><div className="rounded-2xl bg-[#173b55] p-5 text-white"><p className="mono-label text-[9px] text-[#a7ece5]">Resume improvements</p><ul className="mt-4 space-y-4">{insight.resumeSuggestions.map(suggestion => <li key={suggestion} className="flex gap-2 text-xs leading-5 text-[#d5e8ef]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#60dfd3]" />{suggestion}</li>)}</ul></div></div></div><div className="border-t border-[#c8e8e6] bg-white/40 p-6 sm:p-8"><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-[#d4ecea] bg-white/80 p-5"><div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-[#1d78d6]" /><div><p className="mono-label text-[9px] text-[#4e7d8d]">Certification path</p><h3 className="text-lg font-bold tracking-[-0.04em] text-[#244b60]">Recommended credentials</h3></div></div><div className="mt-4 space-y-4">{insight.certificationRecommendations.map(item => <div key={item.certification} className="border-l-2 border-[#37bdb4] pl-3"><p className="text-sm font-bold text-[#244b60]">{item.certification}</p><p className="text-[11px] font-semibold text-[#2476ca]">{item.provider} · {item.targetRoles.join(", ")}</p><p className="mt-1 text-xs leading-5 text-[#648492]">{item.reason}</p><p className="mt-1 text-xs font-semibold text-[#13877f]">Start: {item.firstStep}</p></div>)}</div></div><div className="rounded-2xl bg-[#173b55] p-5 text-white"><div className="flex items-center gap-2"><Target className="h-5 w-5 text-[#60dfd3]" /><div><p className="mono-label text-[9px] text-[#a7ece5]">Skill improvement sprint</p><h3 className="text-lg font-bold tracking-[-0.04em]">Your 90-day action plan</h3></div></div><div className="mt-4 space-y-4">{insight.skillImprovementPlan.map((item, index) => <div key={item.phase} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#4dd7cb] text-[10px] font-bold text-[#14364c]">{index + 1}</span><div><p className="text-sm font-bold text-white">{item.phase} · {item.focus}</p><ul className="mt-1 space-y-1">{item.actions.map(action => <li key={action} className="text-xs leading-5 text-[#d5e8ef]">• {action}</li>)}</ul><p className="mt-1 text-xs font-semibold text-[#71e5da]">Outcome: {item.outcome}</p></div></div>)}</div></div></div></div></section>}
      </> : <section className="soft-card flex min-h-80 items-center justify-center rounded-[1.7rem] p-8 text-center"><div><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#2187d8]" /><p className="mt-4 font-bold text-[#34556a]">Preparing your CareerQuest dashboard</p><p className="mt-1 text-sm text-[#688897]">Matching roles against the backend catalogue…</p></div></section>}
      {insight && <TutorialRecommendations tutorials={insight.tutorials} />}
    </main>
  </div>;
}


function AICareerCoach({ isPending, onGenerate }: { isPending: boolean; onGenerate: () => void }) {
  return <section className="mt-7 rounded-[1.6rem] bg-[#173b55] p-6 text-white shadow-[8px_9px_0_#a7ece7]"><div className="flex items-center gap-2 text-[#aaf4ed]"><BrainCircuit className="h-5 w-5" /><p className="mono-label text-[9px]">AI career coach</p></div><h2 className="mt-3 text-2xl font-bold leading-6 tracking-[-0.06em]">Turn your match data into an action plan.</h2><p className="mt-3 text-xs leading-5 text-[#b5d2dd]">Get tailored learning priorities and resume refinements from your server-side AI coach.</p><button onClick={onGenerate} disabled={isPending} className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#4dd7cb] px-4 text-sm font-bold text-[#14364c] transition-transform duration-150 hover:bg-[#74e3d9] disabled:cursor-wait disabled:opacity-70 active:scale-[0.98]">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}{isPending ? "Building your plan" : "Generate AI insight"}</button></section>;
}

function ChipSection({ label, chips, tone, empty }: { label: string; chips: string[]; tone: "match" | "gap"; empty?: string }) {
  const chipClass = tone === "match" ? "bg-[#dbf8f4] text-[#087b73]" : "bg-[#fff0ed] text-[#b64b42]";
  return <div><p className="mono-label mb-2 text-[9px] text-[#577d8e]">{label}</p><div className="flex flex-wrap gap-1.5">{chips.length ? chips.map(skill => <span key={skill} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${chipClass}`}>{skill}</span>) : <span className="inline-flex items-center gap-1 rounded-md bg-[#e6f7ec] px-2 py-1 text-[10px] font-semibold text-[#268454]"><Check className="h-3 w-3" /> {empty}</span>}</div></div>;
}

function PathNode({ number, label, color }: { number: string; label: string; color: "teal" | "blue" | "coral" }) {
  const colors = { teal: "bg-[#39cbbf]", blue: "bg-[#337ee5]", coral: "bg-[#ff7c70]" };
  return <div className="flex flex-col items-center"><span className={`grid h-10 w-10 place-items-center rounded-xl border-4 border-white text-[9px] font-bold text-white shadow-sm ${colors[color]}`}>{number}</span><span className="mt-1.5 text-[10px] font-bold text-[#4f7285]">{label}</span></div>;
}
