import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import type { CareerAnalysisResult, CareerChatTopic } from "@shared/career";
import { BrainCircuit, BriefcaseBusiness, GraduationCap, MessageCirclePlus, PenLine, RefreshCw, X } from "lucide-react";
import { useMemo, useState } from "react";

type QuickAction = {
  topic: CareerChatTopic;
  label: string;
  description: string;
  prompt: string;
  icon: typeof BriefcaseBusiness;
};

const quickActions: QuickAction[] = [
  { topic: "job_enquiry", label: "Job enquiry", description: "Understand your fit, gaps, and the next application step.", prompt: "Which of my matching jobs should I focus on first, and why?", icon: BriefcaseBusiness },
  { topic: "course_recommendation", label: "Course recommendations", description: "Choose practical learning paths and certifications for your gaps.", prompt: "Recommend the best course and learning path for my highest-priority skill gaps.", icon: GraduationCap },
  { topic: "resume_improvement", label: "Résumé improvement", description: "Refine your profile for the roles you want to pursue.", prompt: "What are the most important improvements I should make to my résumé for my strongest role?", icon: PenLine },
];

const HISTORY_CONTENT_LIMIT = 1500;

function truncateHistoryContent(content: string) {
  return content.length > HISTORY_CONTENT_LIMIT ? `${content.slice(0, HISTORY_CONTENT_LIMIT - 1).trimEnd()}…` : content;
}

function topicLabel(topic: CareerChatTopic | null) {
  return quickActions.find(action => action.topic === topic)?.label ?? "Choose a topic";
}

export function CareerChatbot({ analysis }: { analysis: CareerAnalysisResult | null }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState<CareerChatTopic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const chat = trpc.career.chat.useMutation();

  const context = useMemo(() => analysis ? ({
    detectedSkills: analysis.profile.detectedSkills.slice(0, 30),
    experience: analysis.profile.experience,
    matches: analysis.topMatches.slice(0, 3).map(match => ({
      role: match.role,
      company: match.company,
      score: match.score,
      matchedSkills: match.matchedSkills.slice(0, 10),
      missingSkills: match.missingSkills.slice(0, 10),
    })),
    skillGaps: analysis.skillGaps.slice(0, 5).map(gap => ({ skill: gap.skill, priority: gap.priority })),
  }) : undefined, [analysis]);

  const resetConversation = () => {
    setTopic(null);
    setMessages([]);
    setSuggestions([]);
  };

  const sendMessage = (content: string, selectedTopic = topic, historyOverride?: Array<{ role: "user" | "assistant"; content: string }>) => {
    if (!selectedTopic || chat.isPending) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    const rawPriorMessages = historyOverride ?? messages.slice(-6).flatMap(message => message.role === "user" || message.role === "assistant" ? [{ role: message.role, content: message.content }] : []);
    const priorMessages = rawPriorMessages.map(message => ({ ...message, content: truncateHistoryContent(message.content) }));
    setMessages(current => [...current, { role: "user", content: trimmed }]);
    chat.mutate({ topic: selectedTopic, question: trimmed, history: priorMessages, context }, {
      onSuccess: result => {
        setMessages(current => [...current, { role: "assistant", content: result.answer }]);
        setSuggestions(result.suggestedQuestions);
      },
      onError: error => setMessages(current => [...current, { role: "assistant", content: error.message || "The career assistant could not respond. Please try again." }]),
    });
  };

  const chooseAction = (action: QuickAction) => {
    setTopic(action.topic);
    setMessages([]);
    setSuggestions([]);
    sendMessage(action.prompt, action.topic, []);
  };

  return <div className="fixed bottom-5 right-4 z-50 w-[calc(100%-2rem)] max-w-md sm:bottom-6 sm:right-6">
    {open && <section className="mb-3 overflow-hidden rounded-[1.55rem] border border-[#b9e4e1] bg-white/95 shadow-[0_20px_50px_rgba(17,82,99,0.26)] backdrop-blur-xl" aria-label="CareerQuest AI assistant">
      <header className="flex items-center justify-between gap-3 border-b border-[#d9eeee] bg-[#173b55] px-5 py-4 text-white">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#4dd7cb] text-[#173b55]"><BrainCircuit className="h-5 w-5" /></span><div><p className="text-sm font-bold">CareerQuest assistant</p><p className="text-[11px] text-[#b9d9df]">{topicLabel(topic)}</p></div></div>
        <div className="flex items-center gap-1"><button type="button" onClick={resetConversation} aria-label="Choose a new question" className="grid h-9 w-9 place-items-center rounded-lg text-[#aaf4ed] transition-colors hover:bg-white/10" title="New question"><RefreshCw className="h-4 w-4" /></button><button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="grid h-9 w-9 place-items-center rounded-lg text-[#d5eef0] transition-colors hover:bg-white/10"><X className="h-4 w-4" /></button></div>
      </header>
      {!topic ? <div className="p-5"><p className="text-sm font-bold text-[#244b60]">What would you like help with?</p><p className="mt-1 text-xs leading-5 text-[#6b8997]">Choose a guided path. The assistant uses your active CareerQuest analysis when available.</p><div className="mt-4 grid gap-3">{quickActions.map(action => { const Icon = action.icon; return <button key={action.topic} type="button" onClick={() => chooseAction(action)} className="flex items-start gap-3 rounded-2xl border border-[#d3eaeb] bg-[#faffff] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#4ccfc6] hover:shadow-[4px_5px_0_#d4f6f2] active:scale-[0.99]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6f8f6] text-[#187f78]"><Icon className="h-4.5 w-4.5" /></span><span><span className="block text-sm font-bold text-[#244b60]">{action.label}</span><span className="mt-1 block text-xs leading-5 text-[#688796]">{action.description}</span></span></button>; })}</div></div> : <div><AIChatBox messages={messages} onSendMessage={sendMessage} isLoading={chat.isPending} placeholder={`Ask about ${topicLabel(topic).toLowerCase()}…`} height="360px" emptyStateMessage="Preparing your personalized guidance…" />{suggestions.length > 0 && <div className="border-t border-[#d8eeee] bg-[#f7fffe] px-4 py-3"><p className="mono-label text-[9px] text-[#487a87]">Try next</p><div className="mt-2 flex flex-wrap gap-2">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} disabled={chat.isPending} className="rounded-full border border-[#bfe6e4] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#237772] transition-colors hover:bg-[#e9fbf9] disabled:opacity-60">{suggestion}</button>)}</div></div>}</div>}
    </section>}
    <button type="button" onClick={() => setOpen(current => !current)} className="ml-auto inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#173b55] px-4 text-sm font-bold text-white shadow-[5px_6px_0_#4dd7cb] transition-transform hover:-translate-y-0.5 active:scale-[0.98]" aria-expanded={open}><MessageCirclePlus className="h-5 w-5 text-[#68e4d7]" />{open ? "Close assistant" : "Ask CareerQuest"}</button>
  </div>;
}
