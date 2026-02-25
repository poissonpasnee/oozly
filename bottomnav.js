// bottomnav.js
import { initUnreadBadge } from "./unreadBadge.js";

/**
 * Injecte une bottom nav identique sur toutes les pages
 * - Accueil (index.html)
 * - Favoris (favorites.html si tu l'as)
 * - Publier (publish.html ou publish/page)
 * - Messages (messages.html)
 * - Profil (profile.html)
 *
 * IMPORTANT: adapte les href si tes pages ont d'autres noms.
 */
export function mountBottomNav(active = "") {
  // évite double insertion
  if (document.getElementById("bottomNav")) return;

  const nav = document.createElement("nav");
  nav.id = "bottomNav";
  nav.className = "bottomnav";

  nav.innerHTML = `
    <a class="bn-item ${active === "home" ? "active" : ""}" href="index.html" aria-label="Accueil">
      <span class="bn-ico">🏠</span>
      <span class="bn-txt">Accueil</span>
    </a>

    <a class="bn-item ${active === "favorites" ? "active" : ""}" href="favorites.html" aria-label="Favoris">
      <span class="bn-ico">❤️</span>
      <span class="bn-txt">Favoris</span>
    </a>

    <a class="bn-item bn-plus ${active === "publish" ? "active" : ""}" href="publish.html" aria-label="Publier">
      <span class="bn-plus-inner">＋</span>
    </a>

    <a class="bn-item ${active === "messages" ? "active" : ""}" href="messages.html" aria-label="Messages">
      <span class="bn-ico">💬</span>
      <span class="bn-txt">Messages</span>
      <span class="bn-badge" id="bottomUnreadBadge" style="display:none;"></span>
    </a>

    <a class="bn-item ${active === "profile" ? "active" : ""}" href="profile.html" aria-label="Profil">
      <span class="bn-ico">👤</span>
      <span class="bn-txt">Profil</span>
    </a>
  `;

  document.body.appendChild(nav);

  // Init badge unread (realtime)
  initUnreadBadge();
}