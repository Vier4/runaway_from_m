// B Store installer: puts this app on the phone's home screen.
// Opened from B Store as  <app url>?install  → shows the "Install" window.
// Usage: <script src="install.js" data-app="makar" data-name="Побег от Макара" defer></script>
(function () {
  var me = document.currentScript;
  var APP = me.getAttribute("data-app");
  var NAME = me.getAttribute("data-name") || document.title;
  var KEY = "bstore.installed"; // shared with B Store (same site: vier4.github.io)

  var standalone = matchMedia("(display-mode: standalone)").matches ||
    matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true;

  function markInstalled() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY)) || [];
      if (list.indexOf(APP) < 0) { list.push(APP); localStorage.setItem(KEY, JSON.stringify(list)); }
    } catch (e) {}
  }

  // Started from the home screen icon → the app is installed.
  if (standalone) markInstalled();

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  var wanted = /[?&]install(=|&|$)/.test(location.search);
  var installEvent = null;
  var mode = "wait"; // wait | button | ios | manual | done
  var host, root;

  addEventListener("appinstalled", function () {
    markInstalled();
    installEvent = null;
    if (host) { mode = "done"; render(); }
  });
  if (!wanted || standalone) return;

  addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    installEvent = e;
    if (mode !== "done") { mode = "button"; render(); }
  });

  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/.test(ua);
  var isFirefox = /Firefox\//.test(ua);
  var isMacSafari = !isIOS && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);

  var CSS =
    ":host{all:initial}" +
    ".bg{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;" +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.4}" +
    ".card{background:#fff;color:#12141a;width:100%;max-width:440px;border-radius:22px 22px 0 0;padding:22px 20px calc(22px + env(safe-area-inset-bottom));" +
    "box-shadow:0 -10px 40px rgba(0,0,0,.3);animation:up .25s ease-out}" +
    "@media (min-width:600px){.bg{align-items:center}.card{border-radius:22px}}" +
    "@media (prefers-color-scheme:dark){.card{background:#1c1f27;color:#f1f3f7}.muted{color:#9aa0ad!important}.step{background:#262a35!important}.ghost{color:#9aa0ad!important}}" +
    "@keyframes up{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}" +
    ".top{display:flex;gap:14px;align-items:center;margin-bottom:16px}" +
    ".top img{width:64px;height:64px;border-radius:15px;flex:none;box-shadow:0 2px 10px rgba(0,0,0,.2)}" +
    ".name{font-size:19px;font-weight:800}.muted{color:#6b7180;font-size:14px}" +
    ".btn{display:block;width:100%;border:0;border-radius:14px;padding:14px;font:inherit;font-size:17px;font-weight:800;cursor:pointer;" +
    "background:#2f6bff;color:#fff;margin-top:6px}" +
    ".ghost{display:block;width:100%;border:0;background:none;font:inherit;font-size:15px;font-weight:600;color:#6b7180;padding:12px;margin-top:4px;cursor:pointer}" +
    ".steps{list-style:none;margin:0;padding:0;display:grid;gap:8px}" +
    ".step{display:flex;gap:12px;align-items:center;background:#f2f4f8;border-radius:12px;padding:10px 12px;font-size:15px}" +
    ".n{flex:none;width:26px;height:26px;border-radius:50%;background:#2f6bff;color:#fff;font-weight:800;font-size:14px;display:grid;place-items:center}" +
    ".ico{display:inline-block;vertical-align:-4px;margin:0 2px}" +
    ".spin{width:22px;height:22px;border-radius:50%;border:3px solid #c9d4ff;border-top-color:#2f6bff;animation:r .8s linear infinite;margin:6px auto 10px}" +
    "@keyframes r{to{transform:rotate(360deg)}}" +
    ".ok{width:56px;height:56px;border-radius:50%;background:#22c55e;color:#fff;display:grid;place-items:center;margin:4px auto 10px;font-size:30px}" +
    ".center{text-align:center}";

  var SHARE = '<svg class="ico" width="18" height="20" viewBox="0 0 18 22" fill="none" stroke="#2f6bff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14V2M5 5.5 9 2l4 3.5"/><path d="M6 8H3v12h12V8h-3"/></svg>';
  var ADD = '<svg class="ico" width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="2" width="18" height="18" rx="4"/><path d="M11 7v8M7 11h8"/></svg>';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function steps(list) {
    return '<ol class="steps">' + list.map(function (t, i) { return '<li class="step"><span class="n">' + (i + 1) + "</span><span>" + t + "</span></li>"; }).join("") + "</ol>";
  }

  function body() {
    if (mode === "done") {
      return '<div class="center"><div class="ok">✓</div><div class="name">Готово!</div>' +
        '<p class="muted">«' + esc(NAME) + '» теперь на главном экране. Открывай его оттуда.</p></div>' +
        '<button class="btn" data-a="close">Хорошо</button>';
    }
    if (mode === "button") {
      return '<button class="btn" data-a="install">Установить</button><button class="ghost" data-a="close">Не сейчас</button>';
    }
    if (mode === "ios") {
      return steps([
        "Нажми кнопку «Поделиться» " + SHARE + " внизу экрана (в Chrome — вверху)",
        "Пролистай вниз и выбери «На экран „Домой“» " + ADD,
        "Нажми «Добавить» в правом верхнем углу"
      ]) + '<button class="ghost" data-a="close">Не сейчас</button>';
    }
    if (mode === "manual") {
      var t;
      if (isFirefox && !isAndroid) t = steps(["Firefox на компьютере не умеет ставить приложения. Открой эту страницу в Chrome, Edge или Яндекс Браузере."]);
      else if (isMacSafari) t = steps(["В меню «Файл» выбери «Добавить в Dock»"]);
      else if (isAndroid) t = steps(["Нажми меню браузера ⋮ вверху справа", "Выбери «Установить приложение» или «Добавить на главный экран»", "Нажми «Установить»"]);
      else t = steps(["Нажми значок установки " + ADD + " в адресной строке или меню браузера ⋮", "Выбери «Установить»"]);
      return t + '<p class="muted center" style="margin:10px 0 0">Если приложение уже установлено, просто найди его иконку на главном экране.</p>' +
        '<button class="ghost" data-a="close">Закрыть</button>';
    }
    return '<div class="spin"></div><p class="muted center" style="margin:0 0 6px">Готовим установку…</p><button class="ghost" data-a="close">Не сейчас</button>';
  }

  function render() {
    if (!root) return;
    root.innerHTML = "<style>" + CSS + "</style>" +
      '<div class="bg" data-a="bg"><div class="card" role="dialog" aria-modal="true" aria-label="Установка">' +
      '<div class="top"><img src="apple-touch-icon.png" alt=""><div><div class="name">' + esc(NAME) + "</div>" +
      '<div class="muted">Установить на главный экран</div></div></div>' + body() + "</div></div>";
  }

  function close() {
    if (host) host.remove();
    host = root = null;
    try { history.replaceState(history.state, "", location.pathname + location.hash); } catch (e) {}
  }

  function open() {
    host = document.createElement("div");
    root = host.attachShadow({ mode: "open" });
    // Keep taps and keys inside the window, so the game underneath does not react to them.
    ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "touchstart", "touchend", "wheel", "keydown", "keyup"].forEach(function (ev) {
      host.addEventListener(ev, function (e) { e.stopPropagation(); });
    });
    root.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("[data-a]");
      if (!a) return;
      var act = a.getAttribute("data-a");
      if (act === "bg" && e.target !== a) return;
      if (act === "close" || act === "bg") return close();
      if (act === "install" && installEvent) {
        var ev = installEvent;
        installEvent = null;
        ev.prompt();
        ev.userChoice.then(function (r) {
          if (r && r.outcome === "accepted") { markInstalled(); mode = "done"; }
          else mode = "manual";
          render();
        }, function () { mode = "manual"; render(); });
      }
    });
    document.body.appendChild(host);
    if (installEvent) mode = "button";
    else if (isIOS) mode = "ios";
    render();
    if (mode === "wait") setTimeout(function () { if (mode === "wait") { mode = "manual"; render(); } }, 2500);
  }

  if (document.body) open(); else addEventListener("DOMContentLoaded", open);
})();
