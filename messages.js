// messages.js
import { supabase } from "./supabaseClient.js";

const el = (id) => document.getElementById(id);

const convoList = el("convoList");
const messagesList = el("messagesList");
const chatTitle = el("chatTitle");
const msgInput = el("msgInput");
const sendBtn = el("sendBtn");
const logoutBtn = el("logoutBtn");
const markReadBtn = el("markReadBtn");
const globalUnreadBadge = el("globalUnreadBadge");

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

function setGlobalUnread(count) {
  if (!globalUnreadBadge) return;
  if (!count || count <= 0) {
    globalUnreadBadge.style.display = "none";
    globalUnreadBadge.textContent = "";
    return;
  }
  globalUnreadBadge.style.display = "inline-flex";
  globalUnreadBadge.textContent = String(count);
}

// --- AUTH ---
async function requireUser() {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    window.location.href = "login.html";
    return null;
  }
  return data.user;
}

// --- FETCH PROFILES (pour afficher un nom) ---
async function getProfileLabel(userId) {
  // on évite de faire 50 requêtes : cache simple
  if (!getProfileLabel.cache) getProfileLabel.cache = new Map();
  const cache = getProfileLabel.cache;

  if (cache.has(userId)) return cache.get(userId);

  const { data, error } = await supabase
    .from("profiles_public")
    .select("id, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    cache.set(userId, userId.slice(0, 8));
    return userId.slice(0, 8);
  }

  const label = data?.full_name?.trim() ? data.full_name.trim() : userId.slice(0, 8);
  cache.set(userId, label);
  return label;
}

// --- UNREAD COUNT (global) ---
async function fetchGlobalUnreadCount() {
  if (!currentUser) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", currentUser.id)
    .eq("read", false);

  if (error) {
    console.warn("Unread count error:", error);
    return 0;
  }
  return count || 0;
}

// --- UNREAD COUNT (par conversation) ---
async function fetchUnreadForConversation(conversationId) {
  if (!currentUser) return 0;

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", currentUser.id)
    .eq("read", false);

  if (error) {
    console.warn("Unread per convo error:", error);
    return 0;
  }
  return count || 0;
}

// --- LIST CONVERSATIONS ---
async function loadConversations() {
  convoList.innerHTML = `<div class="empty">Chargement…</div>`;

  const { data, error } = await supabase
    .from("conversations")
    .select("id, listing_id, participant1_id, participant2_id, last_message, last_message_at, updated_at, created_at")
    .or(`participant1_id.eq.${currentUser.id},participant2_id.eq.${currentUser.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("Erreur conversations:", error);
    convoList.innerHTML = `<div class="empty">Erreur: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    convoList.innerHTML = `<div class="empty">Aucune conversation.</div>`;
    return;
  }

  // Préparer UI avec unread
  const rows = await Promise.all(
    data.map(async (c) => {
      const otherId = c.participant1_id === currentUser.id ? c.participant2_id : c.participant1_id;
      const label = await getProfileLabel(otherId);
      const unread = await fetchUnreadForConversation(c.id);

      return {
        ...c,
        otherId,
        label,
        unread,
      };
    })
  );

  // Render
  convoList.innerHTML = rows
    .map((c) => {
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
    })
    .join("");

  // Bind clicks
  Array.from(convoList.querySelectorAll("[data-convo]")).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const convoId = btn.getAttribute("data-convo");
      const otherId = btn.getAttribute("data-other");
      if (!convoId || !otherId) return;
      await openConversation(convoId, otherId);
    });
  });
}

// --- OPEN CONVERSATION + LOAD MESSAGES ---
async function openConversation(conversationId, otherUserId) {
  activeConversationId = conversationId;
  activeOtherUserId = otherUserId;

  const label = await getProfileLabel(otherUserId);
  chatTitle.textContent = label;

  // mettre "active" dans la liste
  Array.from(convoList.querySelectorAll(".row")).forEach((r) => r.classList.remove("active"));
  const activeBtn = convoList.querySelector(`[data-convo="${conversationId}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  await loadMessages(conversationId);

  // Marquer lu automatiquement à l’ouverture
  await markConversationRead(conversationId);

  // Refresh UI
  await refreshBadges();
  await loadConversations();
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
    console.error("Erreur messages:", error);
    messagesList.innerHTML = `<div class="empty">Erreur: ${escapeHtml(error.message)}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    messagesList.innerHTML = `<div class="empty">Aucun message.</div>`;
    return;
  }

  messagesList.innerHTML = data
    .map((m) => {
      const mine = m.sender_id === currentUser.id;
      return `
        <div class="bubbleWrap ${mine ? "mine" : ""}">
          <div class="bubble ${mine ? "mine" : ""}">
            ${escapeHtml(m.content)}
            <div class="time">${escapeHtml(formatTime(m.created_at))}${mine ? (m.read ? " • lu" : " • envoyé") : ""}</div>
          </div>
        </div>
      `;
    })
    .join("");

  // Scroll bottom
  messagesList.scrollTop = messagesList.scrollHeight;
}

// --- SEND ---
async function sendMessage() {
  if (!activeConversationId || !activeOtherUserId) {
    alert("Sélectionne une conversation.");
    return;
  }
  const content = (msgInput.value || "").trim();
  if (!content) return;

  msgInput.value = "";

  const insertPayload = {
    conversation_id: activeConversationId,
    sender_id: currentUser.id,
    receiver_id: activeOtherUserId,
    content,
    // listing_id optionnel: on peut le récupérer depuis conversations si besoin
  };

  const { error } = await supabase.from("messages").insert(insertPayload);
  if (error) {
    console.error("Insert message error:", error);
    alert("Erreur envoi: " + error.message);
    return;
  }

  // UI refresh (le realtime fera aussi le job)
  await loadMessages(activeConversationId);
  await refreshBadges();
  await loadConversations();
}

// --- MARK READ ---
async function markConversationRead(conversationId) {
  const { error } = await supabase
    .from("messages")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", currentUser.id)
    .eq("read", false);

  if (error) console.warn("mark read error:", error);
}

// --- BADGES ---
async function refreshBadges() {
  const total = await fetchGlobalUnreadCount();
  setGlobalUnread(total);

  // Badge sur la bottom nav (si présent dans index.html)
  const navBadge = document.getElementById("navMessagesBadge");
  if (navBadge) {
    if (!total || total <= 0) {
      navBadge.style.display = "none";
      navBadge.textContent = "";
    } else {
      navBadge.style.display = "inline-flex";
      navBadge.textContent = String(total);
    }
  }
}

// --- REALTIME ---
function setupRealtime() {
  // écoute les inserts/updates sur messages qui concernent l’utilisateur
  const channel = supabase
    .channel("rt-messages")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      async (payload) => {
        // si pas loggé -> ignore
        if (!currentUser) return;

        const row = payload.new || payload.old;
        if (!row) return;

        // Filtre client : seulement si sender ou receiver = moi
        if (row.sender_id !== currentUser.id && row.receiver_id !== currentUser.id) return;

        // Si je suis dans la convo active → refresh messages + mark read
        if (activeConversationId && row.conversation_id === activeConversationId) {
          await loadMessages(activeConversationId);
          await markConversationRead(activeConversationId);
        }

        await refreshBadges();
        await loadConversations();
      }
    )
    .subscribe();

  return channel;
}

// --- EVENTS ---
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
  window.location.href = "login.html";
});

// --- INIT ---
(async function init() {
  currentUser = await requireUser();
  if (!currentUser) return;

  await refreshBadges();
  await loadConversations();

  setupRealtime();
})();
