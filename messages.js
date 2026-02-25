// messages.js
import { supabase } from "./supabaseClient.js";
import { initUnreadBadge } from "./unreadBadge.js";

const els = {
  logoutBtn: document.getElementById("logoutBtn"),
  convoList: document.getElementById("convoList"),
  chatTitle: document.getElementById("chatTitle"),
  messagesList: document.getElementById("messagesList"),
  msgInput: document.getElementById("msgInput"),
  sendBtn: document.getElementById("sendBtn"),
  markReadBtn: document.getElementById("markReadBtn"),
};

let me = null;
let currentConversationId = null;
let currentOtherUserId = null;

// --- Utils ---
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
  return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
}

function setActiveConvoRow(convoId) {
  document.querySelectorAll(".conversation-item").forEach((el) => el.classList.remove("active"));
  const row = document.querySelector(`[data-convo-id="${convoId}"]`);
  if (row) row.classList.add("active");
}

// --- Auth ---
async function requireAuth() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    window.location.href = "login.html";
    return null;
  }
  return data.user;
}

// --- Conversations query (adapté à ton schéma) ---
async function fetchConversations() {
  // On récupère les convos où je suis participant1 ou participant2
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
  // On calcule les non-lus par conversation pour moi
  // (read=false et receiver_id = moi)
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

  if (!els.convoList) return;

  if (!convos.length) {
    els.convoList.innerHTML = `<div class="empty">Aucune conversation</div>`;
    return;
  }

  els.convoList.innerHTML = convos
    .map((c) => {
      const otherId = c.participant1_id === me.id ? c.participant2_id : c.participant1_id;
      const unread = unreadMap.get(c.id) || 0;
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

  // click handlers
  document.querySelectorAll(".conversation-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const convoId = item.getAttribute("data-convo-id");
      const otherId = item.getAttribute("data-other-id");
      if (!convoId) return;
      currentConversationId = convoId;
      currentOtherUserId = otherId || null;

      setActiveConvoRow(convoId);

      els.chatTitle.textContent = otherId ? `Chat (${otherId.slice(0, 6)}…)` : "Chat";
      await loadMessages(convoId);
      await markConversationRead(convoId); // on marque lu dès ouverture (option fluide)
    });
  });

  // Si aucune convo sélectionnée, sélectionner la première
  if (!currentConversationId && convos[0]?.id) {
    const firstId = convos[0].id;
    const firstOther = convos[0].participant1_id === me.id ? convos[0].participant2_id : convos[0].participant1_id;
    currentConversationId = firstId;
    currentOtherUserId = firstOther || null;
    setActiveConvoRow(firstId);
    els.chatTitle.textContent = firstOther ? `Chat (${firstOther.slice(0, 6)}…)` : "Chat";
    await loadMessages(firstId);
    await markConversationRead(firstId);
  }
}

// --- Messages ---
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

  if (!els.messagesList) return;

  if (!msgs.length) {
    els.messagesList.innerHTML = `<div class="empty">Aucun message</div>`;
    return;
  }

  els.messagesList.innerHTML = msgs
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

  // scroll bas
  els.messagesList.scrollTop = els.messagesList.scrollHeight;
}

async function sendMessage() {
  const content = (els.msgInput?.value || "").trim();
  if (!content) return;
  if (!currentConversationId) return;

  // détermination receiver_id : l'autre participant
  const receiverId = currentOtherUserId;
  if (!receiverId) return;

  // option: anti double click
  els.sendBtn.disabled = true;

  const { error } = await supabase.from("messages").insert({
    conversation_id: currentConversationId,
    sender_id: me.id,
    receiver_id: receiverId,
    content,
    read: false,
  });

  els.sendBtn.disabled = false;

  if (error) {
    alert("Erreur envoi: " + error.message);
    return;
  }

  els.msgInput.value = "";
  // la realtime rafraîchira; mais on peut aussi reload immédiatement pour le côté “fluide”
  await loadMessages(currentConversationId);
}

async function markConversationRead(convoId) {
  // Marque read=true sur tous les messages reçus (receiver_id = moi) dans la conversation
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

// --- Options utiles ---
async function ensureConversation(otherUserId, listingId = null) {
  // Crée ou récupère une conversation existante entre 2 users (+ listing_id optionnel)
  // IMPORTANT: on cherche dans conversations via participant1/participant2 (+ listing_id si fourni)
  const baseOr = `and(participant1_id.eq.${me.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${me.id})`;

  let query = supabase
    .from("conversations")
    .select("id, participant1_id, participant2_id, listing_id")
    .or(baseOr);

  if (listingId) query = query.eq("listing_id", listingId);

  const { data: found, error: findErr } = await query.limit(1);

  if (findErr) {
    console.warn("ensureConversation find error:", findErr);
  }

  if (found && found.length > 0) return found[0].id;

  // create
  const { data: created, error: createErr } = await supabase
    .from("conversations")
    .insert({
      participant1_id: me.id,
      participant2_id: otherUserId,
      listing_id: listingId,
      last_message: null,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (createErr) {
    console.warn("ensureConversation create error:", createErr);
    throw createErr;
  }

  return created.id;
}

// --- Realtime ---
function setupRealtime() {
  // Realtime sur messages: quand un message arrive dans une conversation où je suis sender/receiver
  const channel = supabase
    .channel(`messages-live-${me.id}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` },
      async (payload) => {
        // Si j'ai la conversation ouverte, on reload + mark read
        await renderConversations();
        if (payload?.new?.conversation_id && payload.new.conversation_id === currentConversationId) {
          await loadMessages(currentConversationId);
          await markConversationRead(currentConversationId);
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
    supabase.removeChannel(channel);
  });
}

// --- Bootstrap ---
async function init() {
  me = await requireAuth();
  if (!me) return;

  // Badge non-lu global
  await initUnreadBadge();

  // Logout
  els.logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });

  // Envoi
  els.sendBtn?.addEventListener("click", sendMessage);
  els.msgInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Marquer lu
  els.markReadBtn?.addEventListener("click", async () => {
    if (!currentConversationId) return;
    await markConversationRead(currentConversationId);
    await renderConversations();
    await loadMessages(currentConversationId);
  });

  // Si on arrive avec ?to=<userId>&listing=<listingId> (depuis annonce/profil)
  const url = new URL(window.location.href);
  const to = url.searchParams.get("to");
  const listing = url.searchParams.get("listing");

  if (to) {
    try {
      const convoId = await ensureConversation(to, listing || null);
      currentConversationId = convoId;
      currentOtherUserId = to;
    } catch (e) {
      alert("Impossible de créer la conversation.");
    }
  }

  await renderConversations();
  setupRealtime();
}

init();