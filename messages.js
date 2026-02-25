import { supabase } from "./supabaseClient.js";

const convoList = document.getElementById("convoList");
const messagesList = document.getElementById("messagesList");
const chatTitle = document.getElementById("chatTitle");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");
const markReadBtn = document.getElementById("markReadBtn");
const globalUnreadBadge = document.getElementById("globalUnreadBadge");

let currentUser = null;
let activeConversationId = null;
let activeOtherUserId = null;

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function setBadge(el, n) {
  if (!el) return;
  if (!n || n <= 0) {
    el.style.display = "none";
    el.textContent = "";
  } else {
    el.style.display = "inline-flex";
    el.textContent = String(n);
  }
}

async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    window.location.href = "./login.html";
    return null;
  }
  return data.user;
}

async function getProfileLabel(userId) {
  if (!getProfileLabel.cache) getProfileLabel.cache = new Map();
  const cache = getProfileLabel.cache;
  if (cache.has(userId)) return cache.get(userId);

  const { data, error } = await supabase
    .from("profiles_public")
    .select("id, full_name")
    .eq("id", userId)
    .maybeSingle();

  const label = error
    ? userId.slice(0, 8)
    : (data?.full_name?.trim() ? data.full_name.trim() : userId.slice(0, 8));

  cache.set(userId, label);
  return label;
}

async function fetchGlobalUnread() {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { head: true, count: "exact" })
    .eq("receiver_id", currentUser.id)
    .eq("read", false);

  if (error) {
    console.warn("unread global error:", error);
    return 0;
  }
  return count || 0;
}

async function fetchUnreadForConversation(conversationId) {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { head: true, count: "exact" })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", currentUser.id)
    .eq("read", false);

  if (error) {
    console.warn("unread convo error:", error);
    return 0;
  }
  return count || 0;
}

async function refreshBadges() {
  const total = await fetchGlobalUnread();
  setBadge(globalUnreadBadge, total);

  // badge bottom nav si présent
  const navBadge = document.getElementById("navMessagesBadge");
  if (navBadge) setBadge(navBadge, total);
}

async function loadConversations() {
  convoList.innerHTML = `<div class="empty">Chargement…</div>`;

  const { data, error } = await supabase
    .from("conversations")
    .select("id, listing_id, participant1_id, participant2_id, last_message, last_message_at, updated_at, created_at")
    .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    convoList.innerHTML = `<div class="empty">Erreur: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    convoList.innerHTML = `<div class="empty">Aucune conversation.</div>`;
    return;
  }

  const rows = await Promise.all(
    data.map(async (c) => {
      const otherId = c.participant1_id === currentUser.id ? c.participant2_id : c.participant1_id;
      const label = await getProfileLabel(otherId);
      const unread = await fetchUnreadForConversation(c.id);
      return { ...c, otherId, label, unread };
    })
  );

  convoList.innerHTML = rows.map((c) => {
    const isActive = c.id === activeConversationId;
    const last = c.last_message ? escapeHtml(c.last_message) : "—";
    const time = c.last_message_at ? formatTime(c.last_message_at) : "";
    return `
      <button class="row ${isActive ? "active" : ""}" data-convo="${c.id}" data-other="${c.otherId}">
        <div class="rowMain">
          <div class="rowTitle">${escapeHtml(c.label)}${c.listing_id ? ` <span class="rowSub">• annonce</span>` : ""}</div>
          <div class="rowSub">${last}</div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-left:10px;">
          <div class="rowSub">${escapeHtml(time)}</div>
          ${c.unread > 0 ? `<div class="pill">${c.unread}</div>` : ``}
        </div>
      </button>
    `;
  }).join("");

  Array.from(convoList.querySelectorAll("[data-convo]")).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const convoId = btn.getAttribute("data-convo");
      const otherId = btn.getAttribute("data-other");
      if (!convoId || !otherId) return;
      await openConversation(convoId, otherId);
    });
  });
}

async function loadMessages(conversationId) {
  messagesList.innerHTML = `<div class="empty">Chargement…</div>`;

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, read")
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    messagesList.innerHTML = `<div class="empty">Erreur: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    messagesList.innerHTML = `<div class="empty">Aucun message.</div>`;
    return;
  }

  messagesList.innerHTML = data.map((m) => {
    const mine = m.sender_id === currentUser.id;
    return `
      <div class="bubbleWrap ${mine ? "mine" : ""}">
        <div class="bubble ${mine ? "mine" : ""}">
          ${escapeHtml(m.content)}
          <div class="time">${escapeHtml(formatTime(m.created_at))}${mine ? (m.read ? " • lu" : " • envoyé") : ""}</div>
        </div>
      </div>
    `;
  }).join("");

  messagesList.scrollTop = messagesList.scrollHeight;
}

async function markConversationRead(conversationId) {
  const { error } = await supabase
    .from("messages")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", currentUser.id)
    .eq("read", false);

  if (error) console.warn("mark read error:", error);
}

async function openConversation(conversationId, otherUserId) {
  activeConversationId = conversationId;
  activeOtherUserId = otherUserId;
  chatTitle.textContent = await getProfileLabel(otherUserId);

  Array.from(convoList.querySelectorAll(".row")).forEach((r) => r.classList.remove("active"));
  const activeBtn = convoList.querySelector(`[data-convo="${conversationId}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  await loadMessages(conversationId);
  await markConversationRead(conversationId);
  await refreshBadges();
  await loadConversations();
}

async function sendMessage() {
  if (!activeConversationId || !activeOtherUserId) {
    alert("Sélectionne une conversation.");
    return;
  }

  const content = (msgInput.value || "").trim();
  if (!content) return;
  msgInput.value = "";

  const { error } = await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    sender_id: currentUser.id,
    receiver_id: activeOtherUserId,
    content,
  });

  if (error) {
    alert("Erreur envoi: " + error.message);
    return;
  }

  await loadMessages(activeConversationId);
  await refreshBadges();
  await loadConversations();
}

function setupRealtime() {
  supabase
    .channel("rt-messages")
    .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, async (payload) => {
      if (!currentUser) return;
      const row = payload.new || payload.old;
      if (!row) return;
      if (row.sender_id !== currentUser.id && row.receiver_id !== currentUser.id) return;

      if (activeConversationId && row.conversation_id === activeConversationId) {
        await loadMessages(activeConversationId);
        await markConversationRead(activeConversationId);
      }

      await refreshBadges();
      await loadConversations();
    })
    .subscribe();
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

markReadBtn.addEventListener("click", async () => {
  if (!activeConversationId) return;
  await markConversationRead(activeConversationId);
  await refreshBadges();
  await loadConversations();
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "./login.html";
});

(async function init() {
  currentUser = await requireUser();
  if (!currentUser) return;

  await refreshBadges();
  await loadConversations();
  setupRealtime();
})();
