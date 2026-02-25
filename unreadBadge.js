// unreadBadge.js
import { supabase } from "./supabaseClient.js";

/**
 * Met à jour un badge de non-lus sur un élément
 * @param {HTMLElement|null} el
 * @param {number} count
 */
function renderBadge(el, count) {
  if (!el) return;
  if (count > 0) {
    el.style.display = "inline-flex";
    el.textContent = String(count > 99 ? "99+" : count);
  } else {
    el.style.display = "none";
    el.textContent = "";
  }
}

/**
 * Récupère l'utilisateur connecté
 */
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user ?? null;
}

/**
 * Compte les messages non lus pour l'utilisateur
 */
async function fetchUnreadCount(userId) {
  // On compte les messages où receiver_id = moi et read = false
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("read", false);

  if (error) {
    console.warn("fetchUnreadCount error:", error);
    return 0;
  }
  return count || 0;
}

/**
 * Initialise le badge :
 * - #bottomUnreadBadge (dans la bottom nav)
 * - #globalUnreadBadge (dans messages.html)
 */
export async function initUnreadBadge() {
  const bottomBadge = document.getElementById("bottomUnreadBadge");
  const globalBadge = document.getElementById("globalUnreadBadge");

  const user = await getUser();
  if (!user) {
    renderBadge(bottomBadge, 0);
    renderBadge(globalBadge, 0);
    return;
  }

  // 1) initial load
  const initial = await fetchUnreadCount(user.id);
  renderBadge(bottomBadge, initial);
  renderBadge(globalBadge, initial);

  // 2) realtime: écoute uniquement les inserts/updates qui concernent receiver_id = moi
  const channel = supabase
    .channel(`unread-badge-${user.id}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
      async () => {
        const c = await fetchUnreadCount(user.id);
        renderBadge(bottomBadge, c);
        renderBadge(globalBadge, c);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
      async () => {
        const c = await fetchUnreadCount(user.id);
        renderBadge(bottomBadge, c);
        renderBadge(globalBadge, c);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // ok
      }
    });

  // Optionnel: refresh périodique (utile si Realtime désactivé)
  const interval = setInterval(async () => {
    const c = await fetchUnreadCount(user.id);
    renderBadge(bottomBadge, c);
    renderBadge(globalBadge, c);
  }, 15000);

  // Clean si besoin (page change)
  window.addEventListener("beforeunload", () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  });
}