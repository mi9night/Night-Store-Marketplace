(function () {
  document.querySelectorAll("[data-dropdown]").forEach(function (wrap) {
    var btn = wrap.querySelector("[data-dropdown-toggle]");
    var panel = wrap.querySelector(".dropdown-panel");
    if (!btn || !panel) return;

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle("is-open");
      document.querySelectorAll("[data-dropdown].is-open").forEach(function (w) {
        if (w !== wrap) w.classList.remove("is-open");
      });
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  document.addEventListener("click", function (e) {
    document.querySelectorAll("[data-dropdown].is-open").forEach(function (w) {
      w.classList.remove("is-open");
      var b = w.querySelector("[data-dropdown-toggle]");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".notif-dropdown.is-open").forEach(function (w) {
      w.classList.remove("is-open");
      var b = w.querySelector("[data-notify-toggle]");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll("[data-topic-settings].is-open").forEach(function (w) {
      w.classList.remove("is-open");
      var b = w.querySelector("[data-topic-settings-toggle]");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".wall-dropdown.is-open").forEach(function (w) {
      w.classList.remove("is-open");
      var b = w.querySelector("[data-wall-dropdown-toggle]");
      if (b) b.setAttribute("aria-expanded", "false");
    });
    var t = e.target;
    var inEl = t && t.closest ? t.closest.bind(t) : function () {
      return null;
    };
    if (!inEl("#wallEmojiPopover") && !inEl("#wallEmojiBtn")) {
      var wEmoji = document.getElementById("wallEmojiPopover");
      var wEmoBtn = document.getElementById("wallEmojiBtn");
      if (wEmoji && !wEmoji.hidden) {
        wEmoji.hidden = true;
        if (wEmoBtn) wEmoBtn.setAttribute("aria-expanded", "false");
      }
    }
    if (!inEl(".wall-tb-anchor")) {
      var ap = document.getElementById("wallTbAlignPopover");
      var mp = document.getElementById("wallTbMorePopover");
      if (ap) ap.hidden = true;
      if (mp) mp.hidden = true;
      var ab = document.getElementById("wallTbAlignBtn");
      var mb = document.getElementById("wallTbMoreBtn");
      if (ab) ab.setAttribute("aria-expanded", "false");
      if (mb) mb.setAttribute("aria-expanded", "false");
    }
  });

  document.querySelectorAll(".dropdown-panel").forEach(function (panel) {
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  });

  document.querySelectorAll(".tabs").forEach(function (tabs) {
    tabs.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.querySelectorAll(".tab").forEach(function (t) {
          t.classList.remove("is-active");
        });
        tab.classList.add("is-active");
      });
    });
  });

  document.querySelectorAll(".tri-toggle").forEach(function (group) {
    group.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        group.querySelectorAll("button").forEach(function (b) {
          b.classList.remove("is-on");
        });
        btn.classList.add("is-on");
      });
    });
  });

  document.querySelectorAll(".sort-tabs").forEach(function (row) {
    row.querySelectorAll("button[data-sort-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        row.querySelectorAll("button[data-sort-tab]").forEach(function (b) {
          b.classList.remove("is-active");
        });
        row.querySelectorAll(".sort-dropdown-toggle").forEach(function (t) {
          t.classList.remove("is-active");
        });
        btn.classList.add("is-active");
      });
    });
  });
})();
