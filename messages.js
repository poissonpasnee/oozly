// messages.js
import { supabase } from "./supabaseClient.js";

/* =========================
   DOM
========================= */
const logoutBtn = document.getElementById("logoutBtn");
const convoList = document.getElementById("convoList");
const chatTitle = document.getElementById("chatTitle");
const messagesList = document.getElementById("messagesList");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const markReadBtn = document.getElementById("markReadBtn");
const globalUnreadBadge = document.getElementById("globalUnreadBadge");

/* =========================
   State
========================= */
let me = null;
let currentConversationId = null;
let currentOtherUserId = null;
let channel = null;

/* =========================
   Utils
========================= */
function esc(str) {
  return (str ?? "").toString().replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setBadge(el, count) {
  if (!el) return;
  if (count > 0) {
    el.style.display = "inline-flex";
    el.textContent = String(count > 99 ? "99+" : count);
  } else {
    el.style.display = "none";
    el.textContent = "";
  }
}

function setActiveConvo(convoId) {
  document.querySelectorAll(".conversation-item").forEach((x) => x.classList.remove("active"));
  const row = document.querySelector(`[data-convo-id="${convoId}"]`);
  if (row) row.classList.add("active");
}

/* =========================
   Auth
========================= */
async function requireAuth() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    window.location.href = "login.html";
    return null;
  }
  return data.user;
}

/* =========================
   Unread count (global)
========================= */
async function refreshGlobalUnread() {
  if (!me) return;
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", me.id)
    .eq("read", false);

  if (error) {
    console.warn("refreshGlobalUnread error:", error);
    setBadge(globalUnreadBadge, 0);
    return;
  }
  setBadge(globalUnreadBadge, count || 0);
}

/* =========================
   Conversations
========================= */
async function fetchConversations() {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, listing_id, participant1_id, participant2_id, last_message, last_message_at, updated_at")
    .or(`participant1_id.eq.${me.id},participant2_id.eq.${me.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.warn("fetchConversations error:", error);
    return [];
  }
  return data || [];
}

async function fetchUnreadByConversation() {
  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, id")
    .eq("receiver_id", me.id)
    .eq("read", false);

  if (error) {
    console.warn("fetchUnreadByConversation error:", error);
    return new Map();
  }

  const map = new Map();
  for (const row of data || []) {
    const k = row.conversation_id;
    if (!k) continue;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return map;
}

async function renderConversations() {
  const [convos, unreadMap] = await Promise.all([fetchConversations(), fetchUnreadByConversation()]);
  await refreshGlobalUnread();

  if (!convoList) return;

  if (!convos.length) {
    convoList.innerHTML = `<div class="empty">Aucune conversation</div>`;
    return;
  }

  convoList.innerHTML = convos
    .map((c) => {
      const otherId = c.participant1_id === me.id ? c.participant2_id : c.participant1_id;
      const unread = unreadMap.get(c.id) || 0;

      // Libellé simple (tu peux l'améliorer si tu exposes un profiles_public)
      const title = otherId ? `Utilisateur ${otherId.slice(0, 6)}…` : "Utilisateur";
      const last = c.last_message ? esc(c.last_message) : "Aucun message";
      const time = c.last_message_at ? fmtTime(c.last_message_at) : "";

      return `
        <div class="conversation-item" data-convo-id="${c.id}" data-other-id="${otherId || ""}">
          <div class="row">
            <div class="left">
              <div class="name">${title}</div>
              <div class="preview">${last}</div>
            </div>
            <div class="right">
              <div class="time">${time}</div>
              ${unread > 0 ? `<div class="pill">${unread > 99 ? "99+" : unread}</div>` : ``}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".conversation-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const convoId = item.getAttribute("data-convo-id");
      const otherId = item.getAttribute("data-other-id");
      if (!convoId) return;

      currentConversationId = convoId;
      currentOtherUserId = otherId || null;

      setActiveConvo(convoId);
      chatTitle.textContent = otherId ? `Chat (${otherId.slice(0, 6)}…)` : "Chat";

      await loadMessages(convoId);
      await markConversationRead(convoId); // fluide: lu dès ouverture
      await renderConversations(); // met à jour les badges
    });
  });

  // Auto-select première conversation si aucune sélection
  if (!currentConversationId && convos[0]?.id) {
    const first = convos[0];
    currentConversationId = first.id;
    currentOtherUserId = first.participant1_id === me.id ? first.participant2_id : first.participant1_id;

    setActiveConvo(first.id);
    chatTitle.textContent = currentOtherUserId ? `Chat (${currentOtherUserId.slice(0, 6)}…)` : "Chat";

    await loadMessages(first.id);
    await markConversationRead(first.id);
    await renderConversations();
  }
}

/* =========================
   Messages
========================= */
async function fetchMessages(convoId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, read, read_at")
    .eq("conversation_id", convoId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("fetchMessages error:", error);
    return [];
  }
  return data || [];
}

async function loadMessages(convoId) {
  const msgs = await fetchMessages(convoId);
  if (!messagesList) return;

  if (!msgs.length) {
    messagesList.innerHTML = `<div class="empty">Aucun message</div>`;
    return;
  }

  messagesList.innerHTML = msgs
    .map((m) => {
      const mine = m.sender_id === me.id;
      return `
        <div class="msg ${mine ? "mine" : "theirs"}">
          <div class="bubble">
            <div class="text">${esc(m.content)}</div>
            <div class="meta">
              <span>${fmtTime(m.created_at)}</span>
              ${mine ? `<span class="status">${m.read ? "Lu" : "Envoyé"}</span>` : ``}
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  messagesList.scrollTop = messagesList.scrollHeight;
}

async function sendMessage() {
  const content = (msgInput?.value || "").trim();
  if (!content) return;
  if (!currentConversationId) return;
  if (!currentOtherUserId) return;

  sendBtn.disabled = true;

  const { error } = await supabase.from("messages").insert({
    conversation_id: currentConversationId,
    sender_id: me.id,
    receiver_id: currentOtherUserId,
    content,
    read: false,
  });

  sendBtn.disabled = false;

  if (error) {
    alert("Erreur envoi: " + error.message);
    return;
  }

  msgInput.value = "";
  await loadMessages(currentConversationId);
  // met à jour la liste convos/badges
  await renderConversations();
}

async function markConversationRead(convoId) {
  const { error } = await supabase
    .from("messages")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("conversation_id", convoId)
    .eq("receiver_id", me.id)
    .eq("read", false);

  if (error) {
    console.warn("markConversationRead error:", error);
  }
}

/* =========================
   Deep link: messages.html?to=<userId>&listing=<listingId?>
   -> créer/récupérer la conversation
========================= */
async function ensureConversation(otherUserId, listingId = null) {
  const pairOr =
    `and(participant1_id.eq.${me.id},participant2_id.eq.${otherUserId}),` +
    `and(participant1_id.eq.${otherUserId},participant2_id.eq.${me.id})`;

  let q = supabase.from("conversations").select("id").or(pairOr).limit(1);
  if (listingId) q = q.eq("listing_id", listingId);

  const { data: found, error: findErr } = await q;
  if (findErr) console.warn("ensureConversation findErr:", findErr);

  if (found && found.length > 0) return found[0].id;

  const now = new Date().toISOString();
  const { data: created, error: createErr } = await supabase
    .from("conversations")
    .insert({
      participant1_id: me.id,
      participant2_id: otherUserId,
      listing_id: listingId,
      last_message: null,
      last_message_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (createErr) throw createErr;
  return created.id;
}

/* =========================
   Realtime
========================= */
function setupRealtime() {
  // écoute inserts/updates messages pour moi
  channel = supabase
    .channel(`messages-live-${me.id}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` },
      async (payload) => {
        // refresh convos + badge
        await renderConversations();

        // si conversation ouverte = reload + mark read
        if (payload?.new?.conversation_id && payload.new.conversation_id === currentConversationId) {
          await loadMessages(currentConversationId);
          await markConversationRead(currentConversationId);
          await renderConversations();
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${me.id}` },
      async () => {
        await renderConversations();
        if (currentConversationId) await loadMessages(currentConversationId);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` },
      async () => {
        await renderConversations();
        if (currentConversationId) await loadMessages(currentConversationId);
      }
    )
    .subscribe();

  window.addEventListener("beforeunload", () => {
    if (channel) supabase.removeChannel(channel);
  });
}

/* =========================
   Boot
========================= */
async function init() {
  me = await requireAuth();
  if (!me) return;

  // logout
  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });

  // send
  sendBtn?.addEventListener("click", sendMessage);
  msgInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // mark read
  markReadBtn?.addEventListener("click", async () => {
    if (!currentConversationId) return;
    await markConversationRead(currentConversationId);
    await renderConversations();
    await loadMessages(currentConversationId);
  });

  // deep link
  const url = new URL(window.location.href);
  const to = url.searchParams.get("to");
  const listing = url.searchParams.get("listing");

  if (to) {
    try {
      const convoId = await ensureConversation(to, listing || null);
      currentConversationId = convoId;
      currentOtherUserId = to;
    } catch (e) {
      console.warn(e);
      alert("Impossible de créer la conversation.");
    }
  }

  await renderConversations();
  setupRealtime();

  // refresh périodique (sécurité)
  setInterval(() => {
    refreshGlobalUnread();
  }, 15000);
}

init();