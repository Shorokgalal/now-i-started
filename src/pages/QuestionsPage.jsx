// src/pages/QuestionsPage.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  addDoc, collection, onSnapshot, orderBy, query,
  serverTimestamp, where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../state/auth.jsx";
import { useNavigate } from "react-router-dom";
import {
  HoverTime, ReactionButton, Avatar,
  nameFromEmail
} from "../components/ui/MessageHelpers.jsx";

import { useApp } from "../state/appState.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import { Card, Button, Page } from "../components/ui";
import { useLang } from "../state/lang.jsx";

// ----- Config: questions -----
const QUESTIONS = [
  { id: "q1" },
  { id: "q2" },
  { id: "q3" },
];

export default function QuestionsPage() {
  const [expandedCards, setExpandedCards] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [filterQ, setFilterQ] = useState("all");
  const [composeQ, setComposeQ] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { user } = useAuth();
  const { t, lang } = useLang();
  const nav = useNavigate();
  const { communityLock, setCommunityLock } = useApp();
  const textareaRef = useRef(null);
  const endRef = useRef(null);

  const COMMUNITY_MAX = 3600;
  const [left, setLeft] = useState(COMMUNITY_MAX);

  // Sync lock state
  useEffect(() => {
    const saved = typeof communityLock.leftSec === "number" ? communityLock.leftSec : null;
    const locked = communityLock.lockedUntil && Date.now() < communityLock.lockedUntil;
    if (locked) {
      setLeft(0);
    } else if (saved == null || saved <= 0 || saved === 900) {
      setLeft(COMMUNITY_MAX);
    } else {
      setLeft(Math.min(COMMUNITY_MAX, saved));
    }
  }, [communityLock]);

  // Countdown
  useEffect(() => {
    if (communityLock.lockedUntil && Date.now() < communityLock.lockedUntil) {
      setLeft(0);
      return;
    }
    if (left <= 0) return;
    const id = setInterval(() => {
      setLeft(curr => Math.max(0, curr - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [communityLock.lockedUntil, left]);

  const locked =
    (communityLock.lockedUntil && Date.now() < communityLock.lockedUntil) || left <= 0;

  // Fetch messages
  useEffect(() => {
    let qRef;
    if (filterQ === "all") {
      qRef = query(collection(db, "qaMessages"), orderBy("createdAt", "asc"));
    } else {
      qRef = query(
        collection(db, "qaMessages"),
        where("questionId", "==", filterQ),
        orderBy("createdAt", "asc")
      );
    }
    const unsub = onSnapshot(qRef, snap =>
      setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [filterQ]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  // Send answer
  async function send() {
    const txt = (text || "").trim();
    if (!user) { nav("/auth"); return; }
    if (!txt) return;

    const q = QUESTIONS.find(q => q.id === composeQ);
    setSending(true);
    try {
      await addDoc(collection(db, "qaMessages"), {
        questionId: composeQ,
        questionTitle: t(q?.id),
        type: "answer",
        text: txt,
        uid: user.uid,
        authorName: user.displayName || nameFromEmail(user.email || ""),
        authorPhotoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      });
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"; // ✅ shrink back
      }
      if (filterQ !== "all" && filterQ !== composeQ) setFilterQ(composeQ);
    } finally {
      setSending(false);
    }
  }

  return (
    <Page>
      {/* Header (from Page component) is rendered here */}
      {/* Sticky progress bar after header */}
      <div className="sticky top-[56px] z-20 bg-white border-b border-gray-200 shadow-sm w-full">
        <div className="w-full px-4">
          <div className="flex items-center gap-4 py-3">
            <ProgressBar value={Math.max(0, Math.min(COMMUNITY_MAX, left))} max={COMMUNITY_MAX} />
            <div className="badge whitespace-nowrap">
              {Math.floor(left / 3600).toString().padStart(2, "0")}:
              {Math.floor((left % 3600) / 60).toString().padStart(2, "0")}:
              {(left % 60).toString().padStart(2, "0")} {t("left")}
            </div>
          </div>
        </div>
      </div>
      {/* Sticky filter buttons below progress bar */}
      <div className="sticky top-[104px] z-20 bg-white border-b border-gray-100 w-full">
        <div className="max-w-2xl mx-auto px-4 flex gap-2 pb-3 pt-2 overflow-x-auto whitespace-nowrap">
          <Button
            className={`badge ${filterQ === "all" ? "bg-slate-900 text-white" : ""}`}
            onClick={() => setFilterQ("all")}
          >
            {t("all")}
          </Button>
          {QUESTIONS.map(q => (
            <Button
              key={q.id}
              className={`badge ${filterQ === q.id ? "bg-slate-900 text-white" : ""}`}
              onClick={() => {
                setFilterQ(q.id);
                setComposeQ(q.id);
              }}
            >
              {t(q.id)}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto pr-1 grow min-h-0 pb-2 pt-[120px]">
        <div className="grid gap-2 sm:gap-3">
          {msgs.map(m => {
            const isMine = m.uid && user && m.uid === user.uid;
            const expanded = expandedCards.includes(m.id);
            const isLong = m.text && m.text.length > 120;
            const cardBg = isMine ? "bg-gray-50" : "bg-white"; // ✅ neutral for your own msgs
            const fadeFrom = "from-white";

            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <Card className={`p-3 sm:p-4 w-[90%] ${cardBg}`}> 
                  {/* Header */}
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2 justify-start">
                      <Avatar src={m.authorPhotoURL} name={m.authorName || "User"} />
                      <a
                        href={`/profile/${m.uid || ""}`}
                        className="font-semibold underline decoration-muted/60 hover:decoration-current"
                      >
                        {m.authorName || "User"}
                      </a>
                    </div>
                    <span className="mt-0.5 text-xs text-text/60 text-left block">
                      {m.questionTitle || t("question")}
                    </span>
                  </div>

                  <div className="my-2 border-t border-ring/40" />

                  {/* Message text */}
                  <div
                    className="relative my-2"
                    style={{
                      textAlign: (m.text && /[\u0600-\u06FF]/.test(m.text)) ? "right" : "left",
                      direction: (m.text && /[\u0600-\u06FF]/.test(m.text)) ? "rtl" : "ltr"
                    }}
                  >
                    <div className={expanded ? "" : "line-clamp-2"}>{m.text}</div>

                    {!expanded && isLong && (
                      <div className={`absolute bottom-0 left-0 w-full flex justify-center bg-gradient-to-t ${fadeFrom} to-transparent`}>
                        <div className="rounded bg-blue-50 px-2 py-1">
                          <span
                            onClick={() => setExpandedCards([...expandedCards, m.id])}
                            className="text-sm text-blue-600 hover:underline cursor-pointer"
                          >
                            {t("seeMore") || "see more"}
                          </span>
                        </div>
                      </div>
                    )}

                    {expanded && isLong && (
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className="rounded bg-blue-50 px-2 py-1 mt-1">
                          <span
                            onClick={() =>
                              setExpandedCards(expandedCards.filter(id => id !== m.id))
                            }
                            className="text-sm text-blue-600 hover:underline cursor-pointer"
                          >
                            {t("seeLess") || "see less"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className={`mt-3 flex items-center gap-3 text-xs text-text/60 ${isMine ? "justify-end" : ""}`}>
                    <HoverTime ts={m.createdAt} />
                    <ReactionButton messageId={m.id} uid={user?.uid} />
                  </div>
                </Card>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-3xl z-40 bg-white border-t border-gray-200 px-2 sm:px-0">
        <Card className="p-1 sm:p-2 m-0 shadow-none w-full rounded-md">
          <div className="flex flex-row items-center gap-2 mb-1 flex-nowrap w-full overflow-hidden">
            <span className="text-sm text-text/70 whitespace-nowrap">{t("replyTo")}</span>
            <select
              className="text min-w-[120px] max-w-[180px] truncate overflow-ellipsis whitespace-nowrap"
              id="question-select"
              value={filterQ === "all" ? composeQ : filterQ}
              onChange={(e) => setComposeQ(e.target.value)}
              disabled={filterQ !== "all"}
            >
              {filterQ === "all" && (
                <option value="">{t("chooseQuestion")}</option>
              )}
              {QUESTIONS.map((q) => (
                <option key={q.id} value={q.id} className="truncate">
                  {t(q.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 w-full">
            <textarea
              ref={textareaRef}
              className="text flex-1 resize-none overflow-hidden min-h-[40px] max-h-[120px] sm:min-h-[48px] sm:max-h-[160px] rounded-md border border-gray-300 p-2 placeholder:truncate placeholder:overflow-ellipsis placeholder:whitespace-nowrap"
              rows={1}
              placeholder={
                filterQ === "all" && !composeQ
                  ? t("selectQuestionPlaceholder")
                  : t("writeAnswer")
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              disabled={filterQ === "all" && !composeQ}
            />
            <Button
              variant="primary"
              className="min-w-[48px] sm:min-w-[64px]"
              onClick={send}
              disabled={sending || !text.trim() || (filterQ === "all" && !composeQ)}
            >
              {sending ? t("sending") : t("send")}
            </Button>
          </div>
        </Card>
      </div>

      {/* Lock screen */}
      {locked && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm grid place-items-center p-6">
          <Card className="max-w-md w-full p-6 text-center">
            <h3 className="text-2xl font-semibold mb-2">{t("timeIsUp")}</h3>
            <p className="text-text/70 mb-6">{t("communityOpensTomorrow")}</p>
            <Button variant="primary" className="w-full" onClick={() => nav("/vote")}>
              {t("goBack")}
            </Button>
          </Card>
        </div>
      )}
    </Page>
  );
}
