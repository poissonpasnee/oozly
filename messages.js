<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Messages - Oozly</title>
    <link rel="stylesheet" href="style.css" />
  </head>

  <body>
    <header class="topbar">
      <a class="btn" href="index.html">←</a>
      <div class="title">Messages</div>
      <button class="btn" id="logoutBtn">⎋</button>
    </header>

    <main class="layout">
      <section class="panel">
        <div class="panelHeader">
          <div class="panelTitle">Conversations</div>
          <div class="badge" id="globalUnreadBadge" style="display:none;"></div>
        </div>
        <div id="convoList" class="list"></div>
      </section>

      <section class="panel chatPanel">
        <div class="panelHeader">
          <div class="panelTitle" id="chatTitle">Chat</div>
          <button class="btnSmall" id="markReadBtn">Marquer lu</button>
        </div>

        <div id="messagesList" class="chat"></div>

        <div class="composer">
          <input id="msgInput" placeholder="Écrire un message…" />
          <button id="sendBtn" class="send">Envoyer</button>
        </div>
      </section>
    </main>

    <script type="module" src="messages.js"></script>
  </body>
</html>
