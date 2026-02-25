import { supabase } from "./supabaseClient.js";

async function updateUnreadBadge() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;

  if (!user) return;

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("read", false);

  const badge = document.getElementById("bottomUnreadBadge");

  if (!badge) return;

  if (count > 0) {
    badge.style.display = "flex";
    badge.textContent = count > 99 ? "99+" : count;
  } else {
    badge.style.display = "none";
  }
}

// realtime listener
function initRealtimeBadge() {
  const channel = supabase.channel("global-unread");

  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, updateUnreadBadge)
    .subscribe();
}

export async function initUnreadBadge() {
  await updateUnreadBadge();
  initRealtimeBadge();
}