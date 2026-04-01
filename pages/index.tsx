import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';

const VALIDATION_STEPS = [
  'Parsing claim document ID-4872-B…',
  'Referencing ADA Procedure Code Registry…',
  'Identifying procedure code D2740 (Crown)…',
  'Cross-referencing with Policy 404…',
  'Searching internal pre-authorization rules…',
  'Checking attached documentation for pre-auth…',
  'Validating HIPAA compliance requirements…',
  'Compiling final ruling…',
];

type MsgRole = 'user' | 'agent';

interface TextMsg { id: string; role: MsgRole; kind: 'text'; html: string; }
interface FileMsg { id: string; role: 'user'; kind: 'file'; }
interface TypingMsg { id: string; role: 'agent'; kind: 'typing'; }
interface StepsMsg { id: string; role: 'agent'; kind: 'steps'; visible: number; done: number; }
type Msg = TextMsg | FileMsg | TypingMsg | StepsMsg;

let _id = 0;
const uid = () => String(++_id);
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="2" width="12" height="16" rx="2" stroke="#4f8ef7" strokeWidth="1.5" fill="rgba(79,142,247,0.08)" />
      <path d="M12 2v5h4" stroke="#4f8ef7" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 14h6M7 11h4" stroke="#4f8ef7" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function FileBubble() {
  return (
    <div className="bubble file-bbl">
      <FileIcon />
      <div>
        <div className="file-bbl-name">Insurance Claim ID-4872-B.pdf</div>
        <div className="file-bbl-meta">2.3 MB · Dental Claim</div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="bubble agent">
      <div className="dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </div>
    </div>
  );
}

function StepsBubble({ msg }: { msg: StepsMsg }) {
  return (
    <div className="bubble agent">
      <div className="steps">
        {VALIDATION_STEPS.slice(0, msg.visible).map((text, i) => {
          const isDone = i < msg.done;
          return (
            <div key={i} className={`step vis${isDone ? ' done' : ''}`}>
              {isDone
                ? <span className="step-check">✓</span>
                : <span className="step-spin" />}
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChatMessage({ msg }: { msg: Msg }) {
  const label =
    msg.role === 'user' ? 'YOU'
    : msg.kind === 'steps' ? 'VALIDATION AGENT — THINKING'
    : 'VALIDATION AGENT';

  return (
    <div className={`msg ${msg.role}`}>
      <span className="msg-label">{label}</span>
      {msg.kind === 'file'    && <FileBubble />}
      {msg.kind === 'typing'  && <TypingBubble />}
      {msg.kind === 'steps'   && <StepsBubble msg={msg} />}
      {msg.kind === 'text'    && (
        <div
          className={`bubble ${msg.role}`}
          dangerouslySetInnerHTML={{ __html: msg.html }}
        />
      )}
    </div>
  );
}

export default function Home() {
  const [fileSent, setFileSent] = useState(false);
  const [filePreviewVisible, setFilePreviewVisible] = useState(true);
  const [locked, setLocked] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [showDraftBtn, setShowDraftBtn] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const chatRef  = useRef<HTMLDivElement>(null);
  const lockedRef = useRef(false);

  const setLock = (v: boolean) => { lockedRef.current = v; setLocked(v); };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const appendMsg = useCallback((msg: Msg) => setMessages(p => [...p, msg]), []);

  const patchMsg = useCallback((id: string, patch: Partial<Msg>) => {
    setMessages(p => p.map(m => m.id === id ? { ...m, ...patch } as Msg : m));
  }, []);

  const dropMsg = useCallback((id: string) => {
    setMessages(p => p.filter(m => m.id !== id));
  }, []);

  const removeTyping = useCallback(() => {
    setMessages(p => {
      const last = p[p.length - 1];
      return last && last.kind === 'typing' ? p.slice(0, -1) : p;
    });
  }, []);

  const handleFileSend = useCallback(async () => {
    setFilePreviewVisible(false);
    appendMsg({ id: uid(), role: 'user', kind: 'file' });
    setFileSent(true);
    setLock(true);
    appendMsg({ id: uid(), role: 'agent', kind: 'typing' });
    await sleep(2000);
    removeTyping();
    const id = uid();
    appendMsg({ id, role: 'agent', kind: 'text', html: '' });
    await sleep(50);
    patchMsg(id, {
      html: `Hello! I'm ready to validate <b style="color:#f0f0f5">Insurance Claim ID-4872-B</b>. You can ask me questions about this claim, or ask me to run a full validation of the document.`,
    });
    setLock(false);
    setInputVal('Is procedure D2740 covered under this policy?');
  }, [appendMsg, removeTyping, patchMsg]);

  const handleCoverageQuery = useCallback(async () => {
    setLock(true);
    appendMsg({ id: uid(), role: 'agent', kind: 'typing' });
    await sleep(1400);
    removeTyping();
    const id = uid();
    const base = `<b style="color:#f0f0f5">Is procedure D2740 covered under this policy?</b><br><br>Procedure code <b style="color:#f0f0f5">D2740 (Crown — Porcelain/Ceramic)</b> is listed as a covered service under <b style="color:#f0f0f5">Policy 404 — Major Restorative Services</b>, subject to the following conditions:`;
    appendMsg({ id, role: 'agent', kind: 'text', html: base });
    await sleep(700);
    patchMsg(id, {
      html: base + `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px"><div class="cov-bullet">① A completed <b>Pre-Authorization Form (PAF-9)</b> must be submitted prior to treatment.</div><div class="cov-bullet">② Supporting <b>proof of clinical necessity</b> (X-rays or clinical notes) must accompany the claim.</div></div>`,
    });
    await sleep(500);
    patchMsg(id, {
      html: base + `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px"><div class="cov-bullet">① A completed <b>Pre-Authorization Form (PAF-9)</b> must be submitted prior to treatment.</div><div class="cov-bullet">② Supporting <b>proof of clinical necessity</b> (X-rays or clinical notes) must accompany the claim.</div></div><hr class="cov-divider"><span class="cov-footer">Ask me to run a full agentic validation for a complete ruling.</span>`,
    });
    setLock(false);
    setInputVal('Please run a full agentic validation on this claim.');
  }, [appendMsg, removeTyping, patchMsg]);

  const handleValidation = useCallback(async () => {
    setLock(true);
    await sleep(300);
    const stepsId = uid();
    appendMsg({ id: stepsId, role: 'agent', kind: 'steps', visible: 0, done: 0 });

    for (let i = 0; i < VALIDATION_STEPS.length; i++) {
      await sleep(620);
      patchMsg(stepsId, { visible: i + 1 } as Partial<StepsMsg>);
      await sleep(590);
      patchMsg(stepsId, { done: i + 1 } as Partial<StepsMsg>);
    }

    await sleep(500);
    dropMsg(stepsId);

    const id = uid();
    const base2 = `<b style="color:#f0f0f5">Validation complete.</b> Cross-referenced with <b style="color:#f0f0f5">Policy 404</b>. Missing required <b style="color:#f0f0f5">Pre-Authorization attachment</b>.`;
    appendMsg({ id, role: 'agent', kind: 'text', html: base2 });
    await sleep(650);
    patchMsg(id, {
      html: base2 + `<div style="margin-top:12px"><span style="color:#f05353;font-weight:600">⛔ CLAIM REJECTED.</span><br><span style="font-size:11.5px;color:#55556a">Full report generated below.</span></div>`,
    });
    await sleep(300);
    setShowReport(true);
    setShowDraftBtn(true);
    setLock(false);
    setInputVal('');
  }, [appendMsg, patchMsg, dropMsg]);

  const handleFallback = useCallback(async () => {
    setLock(true);
    appendMsg({ id: uid(), role: 'agent', kind: 'typing' });
    await sleep(900);
    removeTyping();
    appendMsg({
      id: uid(), role: 'agent', kind: 'text',
      html: "I've noted your query. Ask me to run a full agentic validation for a formal ruling on this claim.",
    });
    setLock(false);
  }, [appendMsg, removeTyping]);

  const handleSend = useCallback(async () => {
    if (lockedRef.current) return;

    if (!fileSent && filePreviewVisible) {
      await handleFileSend();
      return;
    }

    const val = inputVal.trim();
    if (!val) return;
    appendMsg({ id: uid(), role: 'user', kind: 'text', html: val });
    setInputVal('');

    const low = val.toLowerCase();
    if (low.includes('d2740') && low.includes('covered')) {
      await handleCoverageQuery();
    } else if (low.includes('validation') || low.includes('full')) {
      await handleValidation();
    } else {
      await handleFallback();
    }
  }, [fileSent, filePreviewVisible, inputVal, appendMsg, handleFileSend, handleCoverageQuery, handleValidation, handleFallback]);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  return (
    <>
      <Head>
        <title>Insurance Rule Validation</title>
        <meta name="description" content="AI-powered compliance & policy verification agent" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="panel">
        {/* Header */}
        <div className="hdr">
          <div className="hdr-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                fill="rgba(255,255,255,0.15)"
              />
              <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1>Insurance Rule Validation</h1>
            <p>AI-powered compliance &amp; policy verification agent</p>
          </div>
          <div className="active-pill">
            <span className="active-dot" /> Active
          </div>
        </div>

        <div className="body">
          {/* File preview chip (pre-send) */}
          {!fileSent && filePreviewVisible && (
            <div className="chip">
              <FileIcon />
              <div>
                <div className="chip-name">Insurance Claim ID-4872-B.pdf</div>
                <div className="chip-meta">2.3 MB · Dental Claim</div>
              </div>
              <button className="chip-remove" onClick={() => setFilePreviewVisible(false)}>✕</button>
            </div>
          )}

          {/* Attached chip (post-send) */}
          {fileSent && (
            <div className="chip">
              <FileIcon />
              <div>
                <div className="chip-name">Insurance Claim ID-4872-B.pdf</div>
                <div className="chip-meta">Uploaded · 2.3 MB · Dental Claim</div>
              </div>
              <span className="chip-badge">ATTACHED</span>
            </div>
          )}

          {/* Chat window */}
          <div className="chat" ref={chatRef}>
            {messages.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
          </div>

          {/* Input row */}
          <div className="input-row">
            <input
              className="txt-input"
              placeholder={fileSent ? 'Ask a question…' : 'Send the file to begin…'}
              value={inputVal}
              disabled={locked}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            />
            <button className="send-btn" disabled={locked} onClick={handleSend}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Report */}
          <div className={`report${showReport ? ' show' : ''}`}>
            <div className="report-hdr">
              <span className="report-dot" />
              <span className="report-title">CLAIM REJECTED — Validation Complete</span>
              <span className="report-id">ID-4872-B</span>
            </div>
            <div className="report-rows">
              <div className="report-row"><span className="rl">Procedure Code</span><span className="rv">D2740 — Crown (Porcelain/Ceramic Substrate)</span></div>
              <div className="report-row"><span className="rl">Policy Referenced</span><span className="rv">Policy 404 — Major Restorative Services</span></div>
              <div className="report-row"><span className="rl">Compliance Std.</span><span className="rv">ADA Code Compliance v2024 · HIPAA §164.502</span></div>
              <div className="report-row">
                <span className="rl">Rejection Reason</span>
                <span className="rv">
                  <span className="tag red">Missing Pre-Authorization</span>
                  <span style={{ marginLeft: 6 }}>Required attachment not found.</span>
                </span>
              </div>
              <div className="report-row"><span className="rl">Risk Level</span><span className="rv"><span className="tag orange">High</span></span></div>
              <div className="report-row"><span className="rl">Recommended</span><span className="rv">Request Pre-Authorization form from submitting clinic before reprocessing.</span></div>
              <div className="report-row"><span className="rl">Confidence</span><span className="rv"><span className="tag blue">97.4%</span></span></div>
            </div>
          </div>

          {/* Draft button */}
          <button className={`draft-btn${showDraftBtn ? ' show' : ''}`} onClick={showToast}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="#4f8ef7" strokeWidth="1.8" />
              <path d="M2 4l10 9 10-9" stroke="#4f8ef7" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Draft Missing Info Request to Clinic
          </button>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast${toastVisible ? ' show' : ''}`}>
        ✅ Missing Info Request drafted and queued for delivery to clinic.
      </div>
    </>
  );
}
