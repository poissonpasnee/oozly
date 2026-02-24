import { supabase } from "./supabaseClient.js";

/**
 * Requis côté DB:
 * - conversations(participant1_id, participant2_id, listing_id, last_message, last_message_at, updated_at)
 * - messages(sender_id, receiver_id, conversation_id, listing_id, content, read, created_at)
 * - RPC: find_or_create_conversation(partner_id uuid, p_listing_id uuid default null) returns uuid
 * - RPC: mark_conversation_read(convo_id uuid) returns void
 */

const qs = new URLSearchParams(location.search);
const toUserId = qs.get("to");         // /messages.html?to=<uuid>
const listingId = qs.get("listing");   // optionnel

const convoListEl = document.getElementById("convoList");
const messagesListEl = document.getElementById("messagesList");
const msgInputEl = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const logoutBtn = document.getElementById("logoutBtn");
const markReadBtn = document.getElementById("markReadBtn");
const chatTitleEl = document.getElementById("chatTitle");
const globalUnreadBadge = document.getElementById("globalUnreadBadge");

let me = null;
let activeConversationId = null;
let activePartnerId = null;
let activeListingId = null;

let channelAll = null;
let channelActive = null;

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function setEmpty(el, text) {
  el.innerHTML = `<div class="empty">${escapeHtml(text)}</div>`;
}

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.warn("getSession error:", error);

  me = data?.session?.user || null;
  if (!me) {
    alert("Connecte-toi d'abord.");
    location.href = "index.html";
    return false;
  }
  return true;
}

async function logout() {
  await supabase.auth.signOut();
  location.href = "index.html";
}

function renderConversations(rows) {
  convoListEl.innerHTML = rows.map((c) => {
    const isActive = c.id === activeConversationId;
    const last = c.last_message ? escapeHtml(c.last_message) : "…";
    const time = c.last_message_at ? new Date(c.last_message_at).toLocaleString() : "";
    const unread = Number(c.unread_count || 0);

    // partner = l'autre participant
    const partner = c.participant1_id === me.id ? c.participant2_id : c.participant1_id;

    return `
      <button class="row ${isActive ? "active" : ""}" 
              data-id="${c.id}"
              data-partner="${partner}"
              data-listing="${c.listing_id || ""}">
        <div class="rowMain">
          <div class="rowTitle">Conversation</div>
          <div class="rowSub">${last}</div>
          <div class="rowSub">${escapeHtml(time)}</div>
        </div>
        ${unread > 0 ? `<div class="pill">${unread > 99 ? "99+" : unread}</div>` : ""}
      </button>
    `;
  }).join("");

  convoListEl.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const convoId = btn.dataset.id;
      const partner = btn.dataset.partner || null;
      const listing = btn.dataset.listing || null;
      await openConversation(convoId, partner, listing || null);
    });
  });
}

function renderMessages(msgs) {
  messagesListEl.innerHTML = msgs.map((m) => {
    const mine = m.sender_id === me.id;
    const ts = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
    return `
      <div class="bubbleWrap ${mine ? "mine" : ""}">
        <div class="bubble ${mine ? "mine" : ""}">
          ${escapeHtml(m.content)}
          <div class="time">${escapeHtml(ts)}</div>
        </div>
      </div>
    `;
  }).join("");

  messagesListEl.scrollTop = messagesListEl.scrollHeight;
}

async function countUnreadGlobal() {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", me.id)
    .eq("read", false);

  if (error) {
    console.warn("count unread global error:", error);
    globalUnreadBadge.style.display = "none";
    return 0;
  }

  const total = Number(count || 0);
  if (total > 0) {
    globalUnreadBadge.style.display = "inline-flex";
    globalUnreadBadge.textContent = total > 99 ? "99+" : String(total);
  } else {
    globalUnreadBadge.style.display = "none";
  }
  return total;
}

async function getUnreadByConversation(convoIds) {
  if (!convoIds.length) return new Map();

  // Simple et efficace: 1 requête pour récupérer les messages non lus et compter côté JS
  // (Si tu veux ultra perf, on peut faire une view/RPC group by)
  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id")
    .in("conversation_id", convoIds)
    .eq("receiver_id", me.id)
    .eq("read", false)
    .limit(5000);

  if (error) {
    console.warn("unread by convo error:", error);
    return new Map();
  }

  const map = new Map();
  for (const r of data || []) {
    const id = r.conversation_id;
    map.set(id, (map.get(id) || 0) + 1);
  }
  return map;
}

async function loadConversations() {
  // Récupérer toutes mes conversations
  const { data, error } = await supabase
    .from("conversations")
    .select("id, listing_id, participant1_id, participant2_id, last_message, last_message_at, updated_at, created_at")
    .or(`participant1_id.eq.${me.id},participant2_id.eq.${me.id}`)
    .order("last_message_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.warn("load conversations error:", error);
    setEmpty(convoListEl, "Erreur chargement conversations.");
    return [];
  }

  const rows = data || [];
  const ids = rows.map((c) => c.id);

  const unreadMap = await getUnreadByConversation(ids);

  const enriched = rows.map((c) => ({
    ...c,
    unread_count: unreadMap.get(c.id) || 0,
  }));

  renderConversations(enriched);

  // auto-select si rien d’ouvert
  if (!activeConversationId && enriched.length > 0) {
    const c0 = enriched[0];
    const partner = c0.participant1_id === me.id ? c0.participant2_id : c0.participant1_id;
    await openConversation(c0.id, partner, c0.listing_id || null);
  }

  await countUnreadGlobal();
  return enriched;
}

async function loadMessages(convoId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, receiver_id, content, created_at, read")
    .eq("conversation_id", convoId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    console.warn("load messages error:", error);
    setEmpty(messagesListEl, "Erreur chargement messages.");
    return [];
  }

  const msgs = data || [];
  renderMessages(msgs);
  return msgs;
}

async function openConversation(convoId, partnerId, listing) {
  activeConversationId = convoId;
  activePartnerId = partnerId;
  activeListingId = listing;

  chatTitleEl.textContent = "Chat";

  await loadMessages(convoId);

  // Marquer lu
  await supabase.rpc("mark_conversation_read", { convo_id: convoId });

  // Rafraîchir badges
  await loadConversations();

  // Realtime pour la convo active (plus fluide)
  if (channelActive) {
    await supabase.removeChannel(channelActive);
    channelActive = null;
  }

  channelActive = supabase
    .channel("rt-active-" + convoId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convoId}` },
      async (payload) => {
        const m = payload.new;
        // Si je reçois un message dans la convo active -> mark read automatiquement
        if (m.receiver_id === me.id) {
          await supabase.rpc("mark_conversation_read", { convo_id: convoId });
        }
        await loadMessages(convoId);
        await loadConversations();
      }
    )
    .subscribe();
}

async function ensureConversationFromQuery() {
  // Si on arrive depuis une annonce ou un profil
  if (!toUserId) return;

  const { data: convoId, error } = await supabase.rpc("find_or_create_conversation", {
    partner_id: toUserId,
    p_listing_id: listingId || null,
  });

  if (error) {
    console.warn("find_or_create_conversation error:", error);
    return;
  }

  // on ouvre
  activeConversationId = convoId;
  activePartnerId = toUserId;
  activeListingId = listingId || null;

  await openConversation(convoId, toUserId, listingId || null);
}

async function sendMessage() {
  const content = msgInputEl.value.trim();
  if (!content) return;

  if (!activeConversationId || !activePartnerId) {
    alert("Sélectionne une conversation.");
    return;
  }

  msgInputEl.value = "";

  // Insert message (ton schéma)
  const { error } = await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    sender_id: me.id,
    receiver_id: activePartnerId,
    listing_id: activeListingId || null,
    content,
    read: false,
    status: "sent",
  });

  if (error) {
    console.warn("send message error:", error);
    alert("Erreur: " + error.message);
    return;
  }

  // Optimisation: la preview conversation est maintenue par trigger côté DB (si tu l'as ajouté)
  await loadMessages(activeConversationId);
  await loadConversations();
}

async function markRead() {
  if (!activeConversationId) return;
  await supabase.rpc("mark_conversation_read", { convo_id: activeConversationId });
  await loadConversations();
}

async function initRealtimeGlobal() {
  // Un seul canal global pour rafraîchir badges + liste quand un message arrive
  if (channelAll) return;

  channelAll = supabase
    .channel("rt-messages-global")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
      const m = payload.new;
      // si message me concerne, on refresh
      if (m.sender_id === me.id || m.receiver_id === me.id) {
        await loadConversations();
        if (activeConversationId && m.conversation_id === activeConversationId) {
          await loadMessages(activeConversationId);
          if (m.receiver_id === me.id) {
            await supabase.rpc("mark_conversation_read", { convo_id: activeConversationId });
          }
        }
      }
    })
    .subscribe();
}

logoutBtn.addEventListener("click", logout);
sendBtn.addEventListener("click", sendMessage);
msgInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
markReadBtn.addEventListener("click", markRead);

(async function main() {
  const ok = await requireAuth();
  if (!ok) return;

  await initRealtimeGlobal();
  await loadConversations();
  await ensureConversationFromQuery();
})();