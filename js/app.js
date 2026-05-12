(function () {
  var DATA_URL = "data/site.json";
  var FX_DATA_URL = "data/fx-rates.json";
  var FX_CACHE_KEY = "nightstore_fx_rates_cache_v1";
  var USER_CURRENCY_KEY = "nightstore_user_currency_v1";
  var FX_API_URL =
    "https://api.exchangerate.host/latest?base=RUB&symbols=USD,EUR,GBP,UAH,KZT,PLN,CNY";

  /** Heroicons outline «cog-8-tooth»: тонкая шестерня с кругом в центре */
  var ICON_SETTINGS_GEAR_SVG =
    '<svg class="icon-settings-gear" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>' +
    '<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>' +
    "</svg>";

  function formatIntRu(n) {
    return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  }

  var CURRENCY_OPTIONS = [
    { code: "RUB", label: "RUB — ₽", sym: "₽" },
    { code: "UAH", label: "UAH — ₴", sym: "₴" },
    { code: "KZT", label: "KZT — ₸", sym: "₸" },
    { code: "PLN", label: "PLN — zł", sym: "zł" },
    { code: "USD", label: "USD — $", sym: "$" },
    { code: "EUR", label: "EUR — €", sym: "€" },
    { code: "GBP", label: "GBP — £", sym: "£" },
    { code: "CNY", label: "CNY — ¥", sym: "¥" },
  ];

  var FX_FALLBACK_RATES = { USD: 0.0108, EUR: 0.0099, GBP: 0.0085, UAH: 0.42, KZT: 5.15, PLN: 0.041, CNY: 0.078 };

  function loadUserCurrencyPref(username) {
    try {
      var o = JSON.parse(localStorage.getItem(USER_CURRENCY_KEY) || "{}");
      var c = o[String(username || "")];
      if (c && CURRENCY_OPTIONS.some(function (x) {
        return x.code === c;
      })) {
        return c;
      }
    } catch (e) {
      /* ignore */
    }
    return "RUB";
  }

  function saveUserCurrencyPref(username, code) {
    var o = {};
    try {
      o = JSON.parse(localStorage.getItem(USER_CURRENCY_KEY) || "{}");
    } catch (e) {
      o = {};
    }
    o[String(username || "")] = code;
    try {
      localStorage.setItem(USER_CURRENCY_KEY, JSON.stringify(o));
    } catch (e) {
      /* ignore */
    }
  }

  function applyFxPayloadToData(data, ratesObj) {
    var m = { RUB: 1 };
    if (ratesObj && typeof ratesObj === "object") {
      Object.keys(ratesObj).forEach(function (k) {
        var v = Number(ratesObj[k]);
        if (v > 0) m[k] = v;
      });
    }
    data._fxMultipliers = m;
    data._fxUpdated = Date.now();
  }

  function ensureFxRatesMerged(data, done) {
    var now = Date.now();
    var cached = null;
    try {
      cached = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || "null");
    } catch (e) {
      cached = null;
    }
    if (cached && cached.ts && now - Number(cached.ts) < 86400000 && cached.rates && typeof cached.rates === "object") {
      applyFxPayloadToData(data, cached.rates);
      data._fxUpdated = Number(cached.ts) || data._fxUpdated;
      done();
      return;
    }
    fetch(FX_API_URL)
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        if (j && j.success === true && j.rates && typeof j.rates === "object") {
          try {
            localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ts: now, rates: j.rates }));
          } catch (e) {
            /* ignore */
          }
          applyFxPayloadToData(data, j.rates);
          return null;
        }
        return fetch(FX_DATA_URL).then(function (r) {
          if (!r.ok) throw new Error("fx");
          return r.json();
        });
      })
      .then(function (fileJson) {
        if (!fileJson || !fileJson.rates) return;
        applyFxPayloadToData(data, fileJson.rates);
        try {
          localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ts: now, rates: fileJson.rates }));
        } catch (e) {
          /* ignore */
        }
      })
      .catch(function () {
        applyFxPayloadToData(data, FX_FALLBACK_RATES);
      })
      .finally(function () {
        if (!data._fxMultipliers) applyFxPayloadToData(data, FX_FALLBACK_RATES);
        done();
      });
  }

  function getFxMultiplier(data, code) {
    if (!code || code === "RUB") return 1;
    var m = data && data._fxMultipliers;
    if (!m || typeof m !== "object") return null;
    var v = Number(m[code]);
    return v > 0 ? v : null;
  }

  function formatRubForViewer(data, viewerUsername, rubAmount, opts) {
    opts = opts || {};
    if (opts.hideBalance) return "••••";
    var rub = Number(rubAmount) || 0;
    var cur = loadUserCurrencyPref(viewerUsername);
    if (cur === "RUB") return formatIntRu(rub) + " ₽";
    var mult = getFxMultiplier(data, cur);
    if (mult == null) return formatIntRu(rub) + " ₽";
    var sym = "";
    CURRENCY_OPTIONS.forEach(function (o) {
      if (o.code === cur) sym = o.sym;
    });
    var val = rub * mult;
    var dec = 2;
    return val.toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + " " + sym;
  }

  function iconEyeBalanceSvg() {
    return (
      '<svg class="user-mega__eye-ic" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>' +
      '<circle cx="12" cy="12" r="3"/>' +
      "</svg>"
    );
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** Разметка поста стены: безопасные BB-теги после экранирования остального текста */
  function formatWallPostHtml(raw) {
    var s = String(raw || "");
    var tok = [];
    function push(html) {
      var i = tok.length;
      tok.push(html);
      return "~~~NSW" + i + "~~~";
    }
    s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, function (_, inner) {
      return push("<pre class=\"wall-pre\"><code>" + escapeHtml(inner) + "</code></pre>");
    });
    s = s.replace(/\[align=(left|center|right)\]([\s\S]*?)\[\/align\]/gi, function (_, al, inner) {
      if (!/^(left|center|right)$/.test(al)) return arguments[0];
      return push(
        '<div class="wall-align wall-align--' +
          al +
          '">' +
          escapeHtml(inner).replace(/\n/g, "<br/>") +
          "</div>"
      );
    });
    s = s.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, function (_, inner) {
      return push(
        '<details class="wall-spoiler-d"><summary>Спойлер</summary><div>' +
          escapeHtml(inner).replace(/\n/g, "<br/>") +
          "</div></details>"
      );
    });
    s = s.replace(/\[censor\]([\s\S]*?)\[\/censor\]/gi, function (_, inner) {
      return push(
        '<span class="wall-censor"><span class="wall-censor__blur">' +
          escapeHtml(inner).replace(/\n/g, "<br/>") +
          "</span></span>"
      );
    });
    s = s.replace(/\[icode\]([\s\S]*?)\[\/icode\]/gi, function (_, inner) {
      return push("<code class=\"wall-icode\">" + escapeHtml(inner) + "</code>");
    });
    s = s.replace(/\[user\]([^\]\r\n]+)\[\/user\]/gi, function (_, un) {
      var u = String(un || "").trim();
      if (!u) return arguments[0];
      return push(
        '<a class="wall-user-mention" href="profile.html?user=' +
          encodeURIComponent(u) +
          '">@' +
          escapeHtml(u) +
          "</a>"
      );
    });
    s = s.replace(/\[(img|gif)\](https?:\/\/[^\s\[\]<]+?)\[\/\1\]/gi, function (_, kind, url) {
      if (!/^https?:\/\//i.test(url)) return arguments[0];
      var isGif = String(kind).toLowerCase() === "gif";
      var cls = "wall-post-inline-img" + (isGif ? " wall-post-inline-img--gif" : "");
      return push('<img src="' + escapeHtml(url) + '" class="' + cls + '" alt="" loading="lazy" referrerpolicy="no-referrer" />');
    });
    s = escapeHtml(s).replace(/\n/g, "<br/>");
    tok.forEach(function (html, i) {
      s = s.split("~~~NSW" + i + "~~~").join(html);
    });
    return s;
  }

  function dicebearAvatar(seed) {
    return (
      "https://api.dicebear.com/7.x/notionists/svg?seed=" +
      encodeURIComponent(String(seed || "user").slice(0, 64)) +
      "&backgroundColor=1a1624"
    );
  }

  function resolvedAvatarUrl(url, username) {
    var s = String(url || "").trim();
    if (!s) return dicebearAvatar(username);
    var low = s.toLowerCase();
    if (low.indexOf("pravatar.cc") !== -1 || low.indexOf("ui-avatars.com") !== -1) {
      return dicebearAvatar(username);
    }
    return s;
  }

  function normalizeAvatarsInData(data) {
    (data.users || []).forEach(function (u) {
      u.avatar = resolvedAvatarUrl(u.avatar, u.username);
      if (u.isModerator == null) u.isModerator = false;
      if (u.isOwner == null) u.isOwner = false;
      if (u.email == null) u.email = "";
      if (u.emailVerified == null) u.emailVerified = true;
    });
  }

  function loadRegisteredUsersRaw() {
    try {
      var a = JSON.parse(localStorage.getItem(REG_USERS_KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function saveRegisteredUsersRaw(arr) {
    try {
      localStorage.setItem(REG_USERS_KEY, JSON.stringify(arr.slice(0, 50)));
    } catch (e) {
      window.alert("Не удалось сохранить аккаунт.");
    }
  }

  function userRecordFromRegistration(rec) {
    return {
      id: rec.id,
      username: rec.username,
      email: String(rec.email || "").trim(),
      emailVerified: !!rec.emailVerified,
      avatar: resolvedAvatarUrl(rec.avatar, rec.username),
      balanceRub: Math.max(0, Number(rec.balanceRub) || 0),
      depositRub: Math.max(0, Number(rec.depositRub) || 0),
      registration: String(
        rec.registration ||
          new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
      ),
      numericId: rec.numericId != null ? Number(rec.numericId) : Math.floor(1000000 + Math.random() * 8000000),
      gender: rec.gender || "—",
      birthday: rec.birthday || "—",
      status: rec.status || "В сети",
      likes: Math.max(0, Number(rec.likes) || 0),
      messages: Math.max(0, Number(rec.messages) || 0),
      trophies: Math.max(0, Number(rec.trophies) || 0),
      giveaways: Math.max(0, Number(rec.giveaways) || 0),
      subscriptions: Math.max(0, Number(rec.subscriptions) || 0),
      followers: Math.max(0, Number(rec.followers) || 0),
      isModerator: !!rec.isModerator,
      isOwner: !!rec.isOwner,
      passB64: rec.passB64 || "",
      firebaseUid: rec.firebaseUid || "",
    };
  }

  function mergeRegisteredUsersIntoData(data) {
    var list = loadRegisteredUsersRaw();
    if (!data.users) data.users = [];
    list.forEach(function (rec) {
      if (!rec || !rec.id || !rec.username) return;
      var normalized = userRecordFromRegistration(rec);
      var ix = data.users.findIndex(function (x) {
        return x.id === rec.id;
      });
      if (ix !== -1) {
        data.users[ix] = Object.assign({}, data.users[ix], normalized);
        return;
      }
      var dup = data.users.some(function (x) {
        return (
          x.username === rec.username ||
          (rec.email &&
            x.email &&
            String(x.email).toLowerCase() === String(rec.email).toLowerCase())
        );
      });
      if (!dup) data.users.push(normalized);
    });
  }

  function mergeSessionFromStorage(data) {
    data._sessionGuest = false;
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (o && o.guest === true) {
        data._sessionGuest = true;
        return;
      }
      if (o && o.sessionUserId && (data.users || []).some(function (x) {
        return x.id === o.sessionUserId;
      })) {
        data.sessionUserId = o.sessionUserId;
      }
    } catch (e) {
      /* ignore */
    }
  }

  function writeSession(userId) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionUserId: userId, guest: false }));
    } catch (e) {
      /* ignore */
    }
  }

  function writeGuestSession() {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ guest: true }));
    } catch (e) {
      /* ignore */
    }
  }

  function randomDigitsCode(len) {
    len = len || 6;
    var s = "";
    for (var i = 0; i < len; i++) {
      s += String(Math.floor(Math.random() * 10));
    }
    return s;
  }

  function storeEmailCode(email, purpose) {
    var code = randomDigitsCode(6);
    var exp = Date.now() + 15 * 60 * 1000;
    var all = {};
    try {
      all = JSON.parse(localStorage.getItem(EMAIL_CODES_KEY) || "{}");
    } catch (e) {
      all = {};
    }
    if (!all || typeof all !== "object") all = {};
    all[String(email || "").toLowerCase()] = { code: code, exp: exp, purpose: purpose || "login" };
    try {
      localStorage.setItem(EMAIL_CODES_KEY, JSON.stringify(all));
    } catch (e) {
      /* ignore */
    }
    return code;
  }

  function verifyEmailCode(email, code, purpose) {
    try {
      var all = JSON.parse(localStorage.getItem(EMAIL_CODES_KEY) || "{}");
      var row = all[String(email || "").toLowerCase()];
      if (!row || row.code !== String(code || "").trim()) return false;
      if (Date.now() > (Number(row.exp) || 0)) return false;
      if (purpose && row.purpose !== purpose) return false;
      delete all[String(email || "").toLowerCase()];
      localStorage.setItem(EMAIL_CODES_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadLinkedAccountIds(primaryUserId) {
    try {
      var m = JSON.parse(localStorage.getItem(LINKED_ACCOUNTS_KEY) || "{}");
      var arr = m[String(primaryUserId)];
      return Array.isArray(arr) ? arr.filter(Boolean).slice(0, 1) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLinkedAccountIds(primaryUserId, ids) {
    var m = {};
    try {
      m = JSON.parse(localStorage.getItem(LINKED_ACCOUNTS_KEY) || "{}");
    } catch (e) {
      m = {};
    }
    if (!m || typeof m !== "object") m = {};
    m[String(primaryUserId)] = ids.slice(0, 1);
    try {
      localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(m));
    } catch (e) {
      /* ignore */
    }
  }

  function findUserByLoginOrEmail(data, needle) {
    var q = String(needle || "").trim().toLowerCase();
    if (!q) return null;
    return (
      (data.users || []).find(function (u) {
        return String(u.username || "").toLowerCase() === q;
      }) ||
      (data.users || []).find(function (u) {
        return String(u.email || "").toLowerCase() === q;
      }) ||
      null
    );
  }

  function checkUserPassword(u, password) {
    var p = String(password || "");
    if (u && u.firebaseUid) return false;
    if (u.passB64) {
      try {
        return btoa(unescape(encodeURIComponent(p))) === u.passB64;
      } catch (e) {
        return false;
      }
    }
    return p === "nightstore";
  }

  function firebaseAuthErrorRu(err) {
    var c = err && err.code;
    if (c === "auth/email-already-in-use") return "Этот e-mail уже зарегистрирован.";
    if (c === "auth/invalid-email") return "Некорректный e-mail.";
    if (c === "auth/weak-password") return "Слишком слабый пароль.";
    if (c === "auth/user-disabled") return "Аккаунт отключён.";
    if (c === "auth/user-not-found" || c === "auth/wrong-password" || c === "auth/invalid-credential") {
      return "Неверный логин или пароль.";
    }
    if (c === "auth/too-many-requests") return "Слишком много попыток. Попробуйте позже.";
    if (c === "auth/network-request-failed") return "Нет сети. Проверьте подключение.";
    return (err && err.message) || "Ошибка Firebase.";
  }

  function resolveEmailForFirebaseLogin(data, needle) {
    var raw = String(needle || "").trim();
    if (!raw) return null;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return raw.toLowerCase();
    var u = findUserByLoginOrEmail(data, raw);
    if (u && u.email) return String(u.email).toLowerCase();
    return null;
  }

  function ensureFirebaseRegRecord(data, fu) {
    var email = String(fu.email || "").toLowerCase().trim();
    var arr = loadRegisteredUsersRaw();
    var rec = null;
    var i;
    for (i = 0; i < arr.length; i++) {
      if (
        arr[i] &&
        (arr[i].firebaseUid === fu.uid ||
          (email && String(arr[i].email || "").toLowerCase() === email))
      ) {
        rec = arr[i];
        break;
      }
    }
    if (rec) {
      rec.firebaseUid = fu.uid;
      if (email) rec.email = email;
      rec.emailVerified = !!fu.emailVerified;
      saveRegisteredUsersRaw(arr);
      return rec;
    }
    var base =
      (fu.displayName && String(fu.displayName).trim()) ||
      (email ? email.split("@")[0] : "") ||
      "user";
    base = String(base)
      .trim()
      .slice(0, 24)
      .replace(/[^\w\u0400-\u04FF-]/g, "");
    if (base.length < 3) base = "usr";
    var username = base;
    var n = 0;
    function takenName(name) {
      var q = String(name).toLowerCase();
      return (
        (data.users || []).some(function (x) {
          return String(x.username || "").toLowerCase() === q;
        }) ||
        arr.some(function (r) {
          return r && String(r.username || "").toLowerCase() === q;
        })
      );
    }
    while (takenName(username)) {
      n += 1;
      username = (base.slice(0, 18) || "u") + "_" + n;
    }
    var id = "fb_" + fu.uid;
    rec = {
      id: id,
      username: username,
      email: email,
      firebaseUid: fu.uid,
      passB64: "",
      emailVerified: !!fu.emailVerified,
      avatar: "",
      balanceRub: 0,
      depositRub: 0,
      registration: "",
      numericId: null,
      gender: "—",
      birthday: "—",
      status: "В сети",
      likes: 0,
      messages: 0,
      trophies: 0,
      giveaways: 0,
      subscriptions: 0,
      followers: 0,
      isModerator: false,
      isOwner: false,
    };
    arr.push(rec);
    saveRegisteredUsersRaw(arr);
    return rec;
  }

  function syncFirebaseSessionIntoData(data) {
    var auth = window.NSFirebaseAuth;
    if (!auth) return;
    var fu = auth.currentUser;
    if (!fu || !fu.email) return;
    ensureFirebaseRegRecord(data, fu);
    mergeRegisteredUsersIntoData(data);
    var arr = loadRegisteredUsersRaw();
    var rec = arr.find(function (r) {
      return r && r.firebaseUid === fu.uid;
    });
    if (!rec) return;
    writeSession(rec.id);
    data.sessionUserId = rec.id;
    data._sessionGuest = false;
    mergeRegisteredUsersIntoData(data);
  }

  function mergeLocalUserPrefs(data) {
    try {
      var raw = localStorage.getItem(USER_PREFS_KEY);
      var prefs = raw ? JSON.parse(raw) : {};
      if (!prefs || typeof prefs !== "object") return;
      (data.users || []).forEach(function (u) {
        var p = prefs[u.username];
        if (!p || typeof p !== "object") return;
        if (typeof p.avatar === "string" && isDataImageUrl(p.avatar)) {
          u.avatar = p.avatar;
        }
        if (p.isModerator === true || p.isModerator === false) {
          if (!u.isOwner) u.isModerator = p.isModerator;
        }
      });
    } catch (err) {
      /* ignore */
    }
  }

  function saveLocalUserPref(username, patch) {
    var prefs = {};
    try {
      prefs = JSON.parse(localStorage.getItem(USER_PREFS_KEY) || "{}");
    } catch (e) {
      prefs = {};
    }
    if (!prefs || typeof prefs !== "object") prefs = {};
    prefs[username] = Object.assign({}, prefs[username] || {}, patch);
    try {
      localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      window.alert("Не удалось сохранить настройки (лимит хранилища).");
    }
  }

  function isDataImageUrl(s) {
    return typeof s === "string" && s.indexOf("data:image/") === 0 && s.length < 600000;
  }

  function fileToCompressedDataUrl(file, callback) {
    if (!file || !file.type || file.type.indexOf("image/") !== 0) {
      callback(null);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = reader.result;
      var img = new Image();
      img.onload = function () {
        var maxW = 900;
        var w = img.width;
        var h = img.height;
        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        var out = canvas.toDataURL("image/jpeg", 0.82);
        if (out.length > 480000) {
          out = canvas.toDataURL("image/jpeg", 0.62);
        }
        callback(out);
      };
      img.onerror = function () {
        callback(typeof dataUrl === "string" ? dataUrl : null);
      };
      img.src = dataUrl;
    };
    reader.onerror = function () {
      callback(null);
    };
    reader.readAsDataURL(file);
  }

  function filesToDataUrlList(files, maxCount, callback) {
    var list = [];
    var slice = [].slice.call(files || [], 0, maxCount);
    var i = 0;
    function step() {
      if (i >= slice.length) {
        callback(list);
        return;
      }
      fileToCompressedDataUrl(slice[i], function (url) {
        if (url) list.push(url);
        i++;
        step();
      });
    }
    step();
  }

  function nightstoreEmojiList() {
    return "😀 😃 😄 😁 😅 😂 🤣 😊 😍 🥰 😘 🙂 😏 😮 😴 😌 😛 😜 🤪 😇 🥲 😢 😭 😤 😠 🤬 🥶 😵 🤐 🥸 😎 🤓 🧐 🤠 👍 👎 👌 ✌ 🤞 🤟 🤘 🤙 👏 🙌 🙏 💪 ✨ 🔥 💯 ❤ 🧡 💛 💚 💙 💖 💔 👀 👂 🧠 💤 🐱 🐶 🦊 🐸 🐻 🐼 🐰 🐹 💩 🤖 👻 🎮 🎯 🎲 🎧 📷 🎬 ⭐ 🌙 ☀ 🌈 ⚡ ☁ ❄ 🍕 🍔 ☕ 🎂 🎁 🏆 🎉 ✉ 📎 🔗 ✔ ✖ ➕ ➖ ❓ ❗".split(
      /\s+/
    );
  }

  var WALL_EMOJI_RECENT_KEY = "nightstore_wall_emoji_recent_v1";
  var WALL_EMOJI_GRID_COUNT = 35;
  var MOD_TICKETS_KEY = "nightstore_mod_tickets_v1";
  var USER_PREFS_KEY = "nightstore_user_prefs_v1";
  var SESSION_KEY = "nightstore_session_v1";
  var REG_USERS_KEY = "nightstore_registered_users_v1";
  var PENDING_REG_KEY = "nightstore_pending_reg_v1";
  var EMAIL_CODES_KEY = "nightstore_email_codes_v1";
  var LINKED_ACCOUNTS_KEY = "nightstore_linked_accounts_v1";
  var HIDE_BALANCE_KEY = "nightstore_hide_balance_v1";

  function loadWallEmojiRecent() {
    try {
      var a = JSON.parse(localStorage.getItem(WALL_EMOJI_RECENT_KEY) || "[]");
      return Array.isArray(a) ? a.filter(Boolean).slice(0, 7) : [];
    } catch (err) {
      return [];
    }
  }

  function pushWallEmojiRecent(ch) {
    var c = String(ch || "").trim();
    if (!c) return;
    var a = loadWallEmojiRecent().filter(function (x) {
      return x !== c;
    });
    a.unshift(c);
    a = a.slice(0, 7);
    try {
      localStorage.setItem(WALL_EMOJI_RECENT_KEY, JSON.stringify(a));
    } catch (err) {
      /* quota */
    }
  }

  function insertAtCursor(textarea, text) {
    if (!textarea) return;
    var start = textarea.selectionStart;
    var end = textarea.selectionEnd;
    var val = textarea.value;
    textarea.value = val.slice(0, start) + text + val.slice(end);
    var pos = start + text.length;
    textarea.selectionStart = textarea.selectionEnd = pos;
    textarea.focus();
  }

  function wrapSelection(textarea, before, after) {
    if (!textarea) return;
    var s = textarea.selectionStart;
    var e = textarea.selectionEnd;
    var val = textarea.value;
    var mid = val.slice(s, e) || "текст";
    textarea.value = val.slice(0, s) + before + mid + after + val.slice(e);
    textarea.selectionStart = s + before.length;
    textarea.selectionEnd = s + before.length + mid.length;
    textarea.focus();
  }

  function userById(data, id) {
    return (data.users || []).find(function (u) {
      return u.id === id;
    });
  }

  function sessionUser(data) {
    if (data._sessionGuest) return null;
    var u = userById(data, data.sessionUserId);
    if (u) return u;
    return (data.users || [])[0];
  }

  function paintGuestAuthDropdown() {
    var wrap = null;
    document.querySelectorAll(".header-actions .dropdown-wrap").forEach(function (w) {
      if (w.querySelector("button.user-pill")) wrap = w;
    });
    if (!wrap) return;
    var panel = wrap.querySelector(".dropdown-panel");
    if (!panel) return;
    panel.className = "dropdown-panel user-mega user-mega--guest";
    panel.innerHTML =
      '<a class="user-mega__guest-login btn-primary" href="login.html">Войти</a>' +
      '<a class="user-mega__guest-reg btn-secondary" href="register.html">Регистрация</a>';
    document.querySelectorAll(".js-header-mod-link").forEach(function (el) {
      el.hidden = true;
    });
  }

  function applySessionUser(data) {
    var u = sessionUser(data);
    if (data._sessionGuest || !u) {
      paintGuestAuthDropdown();
      return;
    }
    document.querySelectorAll(".js-user-name").forEach(function (el) {
      el.textContent = u.username;
    });
    var profHref = "profile.html?user=" + encodeURIComponent(u.username);
    document.querySelectorAll("header.site-header .dropdown-panel > a[href='profile.html']").forEach(function (a) {
      if (a.textContent.trim() === "Профиль") a.setAttribute("href", profHref);
    });
    document.querySelectorAll(".js-user-avatar").forEach(function (el) {
      el.src = u.avatar;
      el.alt = u.username;
      attachAvatarFallback(el, u.username);
    });
    paintUserMegaMenu(data);
  }

  function iconSvg(pathD, size) {
    size = size || 20;
    return (
      '<svg width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="' +
      pathD +
      '"/></svg>'
    );
  }

  function paintUserMegaMenu(data) {
    if (data._sessionGuest) return;
    var u = userById(data, data.sessionUserId);
    if (!u) return;
    var wrap = null;
    document.querySelectorAll(".header-actions .dropdown-wrap").forEach(function (w) {
      if (w.querySelector("button.user-pill")) wrap = w;
    });
    if (!wrap) return;
    var panel = wrap.querySelector(".dropdown-panel");
    if (!panel) return;
    var hideBal = false;
    try {
      hideBal = sessionStorage.getItem(HIDE_BALANCE_KEY) === "1";
    } catch (e) {
      hideBal = false;
    }
    var balTxt = formatRubForViewer(data, u.username, u.balanceRub || 0, { hideBalance: hideBal });
    var curSel = loadUserCurrencyPref(u.username);
    var fxUpdatedTs = data._fxUpdated || 0;
    var fxFoot =
      '<div class="user-mega__fx-foot">Курсы обновляются не чаще одного раза в сутки' +
      (fxUpdatedTs
        ? " · " +
          new Date(fxUpdatedTs).toLocaleString("ru-RU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "") +
      "</div>";
    var fxRows = CURRENCY_OPTIONS.map(function (o) {
      var mult = o.code === "RUB" ? 1 : getFxMultiplier(data, o.code);
      var rubPerOne = mult > 0 ? 1 / mult : 0;
      var hint =
        o.code === "RUB"
          ? "Каталог хранит цены в ₽"
          : mult != null && mult > 0
            ? "1 " + o.code + " ≈ " + (rubPerOne >= 1 ? formatIntRu(Math.round(rubPerOne)) : rubPerOne.toFixed(2)) + " ₽"
            : "курс недоступен";
      var picked = o.code === curSel ? " is-picked" : "";
      var check = o.code === curSel ? '<span class="user-mega__fx-check" aria-hidden="true">✓</span>' : "";
      return (
        '<button type="button" class="user-mega__fx-opt' +
        picked +
        '" data-fx-pick="' +
        o.code +
        '"><span class="user-mega__fx-opt-row"><span class="user-mega__fx-opt-main">' +
        escapeHtml(o.label) +
        "</span>" +
        check +
        '</span><span class="user-mega__fx-opt-hint">' +
        escapeHtml(hint) +
        "</span></button>"
      );
    }).join("");

    var mod = canModerate(data, u);
    var linkedIds = loadLinkedAccountIds(u.id);
    var linkedUsers = linkedIds
      .map(function (id) {
        return userById(data, id);
      })
      .filter(Boolean);
    var canAddLink = linkedUsers.length < 1;

    var myProf = "profile.html?user=" + encodeURIComponent(u.username);
    var grid = [
      { href: myProf, label: "Мои аккаунты", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
      { href: "market.html", label: "Мои покупки", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
      { href: myProf + "#create-thread", label: "Мои темы", icon: "M4 6h16M4 12h16M4 18h7" },
      { href: "notifications.html", label: "Мои сообщения", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
      { href: "help.html", label: "Мои тикеты", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
      { href: "help.html", label: "Мои закладки", icon: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" },
      { href: "help.html", label: "FAQ", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
      { href: "#", label: "Язык: EN", icon: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M12 3a17 17 0 010 18" },
    ];
    if (mod) {
      grid.push({
        href: "moderation.html",
        label: "Модерация",
        icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      });
    }
    var gridHtml = grid
      .map(function (g) {
        return (
          '<a class="user-mega__tile" href="' +
          escapeHtml(g.href) +
          '">' +
          iconSvg(g.icon, 22) +
          "<span>" +
          escapeHtml(g.label) +
          "</span></a>"
        );
      })
      .join("");

    var secondHtml = "";
    if (linkedUsers.length) {
      var lu = linkedUsers[0];
      secondHtml =
        '<button type="button" class="user-mega__second" data-switch-user="' +
        escapeHtml(lu.id) +
        '"><span class="user-mega__second-avwrap"><img src="' +
        escapeHtml(lu.avatar) +
        '" alt="" width="40" height="40" loading="lazy"/>' +
        (lu.messages > 0
          ? '<span class="user-mega__msg-badge">' +
            escapeHtml(String(lu.messages > 99 ? "99+" : lu.messages)) +
            "</span>"
          : "") +
        '</span><div class="user-mega__second-main"><div class="user-mega__second-name"><a class="user-mega__second-name-link" href="profile.html?user=' +
        encodeURIComponent(lu.username) +
        '" onclick="event.stopPropagation()">' +
        escapeHtml(lu.username) +
        '</a></div><div class="user-mega__second-bal">' +
        formatRubForViewer(data, u.username, lu.balanceRub || 0, {}) +
        " <span class=\"user-mega__bal-sep\">/</span> " +
        formatRubForViewer(data, u.username, lu.depositRub || 0, {}) +
        '</div></div><span class="user-mega__second-go" aria-hidden="true">›</span></button>';
    }
    if (canAddLink) {
      secondHtml +=
        '<button type="button" class="user-mega__add-link" data-add-linked>Привязать ещё один аккаунт (макс. 1)</button>';
    }

    panel.className = "dropdown-panel user-mega";
    panel.innerHTML =
      '<div class="user-mega__head"><img class="user-mega__av" src="' +
      escapeHtml(u.avatar) +
      '" alt="" width="56" height="56" loading="lazy"/><a class="user-mega__name user-mega__profile-link" href="profile.html?user=' +
      encodeURIComponent(u.username) +
      '">' +
      escapeHtml(u.username) +
      '</a></div><div class="user-mega__balance"><div class="user-mega__balance-label">Баланс</div><div class="user-mega__balance-row"><button type="button" class="user-mega__bal-eye" data-bal-toggle aria-label="Показать или скрыть баланс">' +
      iconEyeBalanceSvg() +
      '</button><span class="user-mega__bal-val" data-bal-val>' +
      escapeHtml(balTxt) +
      '</span><button type="button" class="user-mega__fx-toggle" data-fx-toggle aria-expanded="false" aria-label="Валюта отображения"><span class="user-mega__fx-chev" aria-hidden="true">▾</span></button></div><div class="user-mega__fx-menu" data-fx-menu hidden>' +
      fxRows +
      fxFoot +
      '</div><div class="user-mega__bal-actions"><button type="button" class="user-mega__bal-btn user-mega__bal-btn--plus">Пополнить</button><button type="button" class="user-mega__bal-btn">Вывести</button><button type="button" class="user-mega__bal-btn">Перевести</button></div></div><div class="user-mega__grid">' +
      gridHtml +
      '</div><div class="user-mega__accounts">' +
      secondHtml +
      '</div><div class="user-mega__foot"><a class="user-mega__settings" href="help.html"><span class="user-mega__set-i" aria-hidden="true">⚙</span> Настройки</a><button type="button" class="user-mega__logout" data-logout aria-label="Выйти">' +
      iconSvg("M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1", 20) +
      "</button></div>";

    panel.querySelectorAll(".user-mega__bal-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        window.alert("Операции с балансом сейчас недоступны.");
      });
    });
    var eye = panel.querySelector("[data-bal-toggle]");
    if (eye) {
      eye.addEventListener("click", function (e) {
        e.stopPropagation();
        try {
          var on = sessionStorage.getItem(HIDE_BALANCE_KEY) === "1";
          sessionStorage.setItem(HIDE_BALANCE_KEY, on ? "0" : "1");
        } catch (err) {
          /* ignore */
        }
        paintUserMegaMenu(data);
      });
    }
    var fxWrap = panel.querySelector(".user-mega__balance");
    var fxBtn = panel.querySelector("[data-fx-toggle]");
    var fxMenu = panel.querySelector("[data-fx-menu]");
    function closeFxMenu() {
      if (fxMenu) fxMenu.hidden = true;
      if (fxBtn) fxBtn.setAttribute("aria-expanded", "false");
      if (fxWrap) fxWrap.classList.remove("is-fx-open");
    }
    function openFxMenu() {
      if (fxMenu) fxMenu.hidden = false;
      if (fxBtn) fxBtn.setAttribute("aria-expanded", "true");
      if (fxWrap) fxWrap.classList.add("is-fx-open");
    }
    if (fxBtn && fxMenu) {
      fxBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (fxMenu.hidden) openFxMenu();
        else closeFxMenu();
      });
      fxMenu.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    panel.querySelectorAll("[data-fx-pick]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var code = btn.getAttribute("data-fx-pick");
        if (code) saveUserCurrencyPref(u.username, code);
        closeFxMenu();
        paintUserMegaMenu(data);
        try {
          window.dispatchEvent(new CustomEvent("nightstore-currency-changed"));
        } catch (err) {}
      });
    });
    var lo = panel.querySelector("[data-logout]");
    if (lo) {
      lo.addEventListener("click", function (e) {
        e.stopPropagation();
        var auth = window.NSFirebaseAuth;
        if (auth && auth.currentUser) {
          auth
            .signOut()
            .catch(function () {
              /* ignore */
            })
            .finally(function () {
              writeGuestSession();
              window.location.href = "login.html";
            });
        } else {
          writeGuestSession();
          window.location.href = "login.html";
        }
      });
    }
    var sw = panel.querySelector("[data-switch-user]");
    if (sw) {
      sw.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = sw.getAttribute("data-switch-user");
        if (id && userById(data, id)) {
          writeSession(id);
          window.location.reload();
        }
      });
    }
    var ad = panel.querySelector("[data-add-linked]");
    if (ad) {
      ad.addEventListener("click", function (e) {
        e.stopPropagation();
        var log = window.prompt("Логин аккаунта для привязки (уже существующий на сайте)", "");
        if (log == null) return;
        log = String(log).trim();
        if (!log) return;
        var target = findUserByLoginOrEmail(data, log);
        if (!target || target.id === u.id) {
          window.alert("Пользователь не найден или это ваш текущий аккаунт.");
          return;
        }
        if (loadLinkedAccountIds(u.id).length >= 1) {
          window.alert("Уже привязан максимум один дополнительный аккаунт.");
          return;
        }
        saveLinkedAccountIds(u.id, [target.id]);
        paintUserMegaMenu(data);
      });
    }
    var avBig = panel.querySelector(".user-mega__av");
    if (avBig) attachAvatarFallback(avBig, u.username);
    var secIm = panel.querySelector(".user-mega__second img");
    if (secIm && linkedUsers[0]) attachAvatarFallback(secIm, linkedUsers[0].username);
  }

  function subsStorageKey(username) {
    return "nightstore_topic_subs_" + encodeURIComponent(username || "guest");
  }

  function loadTopicSubs(username) {
    try {
      var raw = localStorage.getItem(subsStorageKey(username));
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveTopicSubs(username, arr) {
    try {
      localStorage.setItem(subsStorageKey(username), JSON.stringify(arr));
    } catch (e) {
      /* quota */
    }
  }

  function upsertTopicSub(viewerUsername, ownerUsername, threadTs, topicTitle) {
    var arr = loadTopicSubs(viewerUsername);
    var ts = Number(threadTs);
    var i = arr.findIndex(function (s) {
      return s.owner === ownerUsername && Number(s.ts) === ts;
    });
    var row = { owner: ownerUsername, ts: ts, title: String(topicTitle || "") };
    if (i === -1) arr.push(row);
    else arr[i].title = row.title;
    saveTopicSubs(viewerUsername, arr);
  }

  function removeTopicSub(viewerUsername, ownerUsername, threadTs) {
    var ts = Number(threadTs);
    var arr = loadTopicSubs(viewerUsername).filter(function (s) {
      return !(s.owner === ownerUsername && Number(s.ts) === ts);
    });
    saveTopicSubs(viewerUsername, arr);
  }

  function isSubscribedToTopic(viewerUsername, ownerUsername, threadTs) {
    var ts = Number(threadTs);
    return loadTopicSubs(viewerUsername).some(function (s) {
      return s.owner === ownerUsername && Number(s.ts) === ts;
    });
  }

  function notifStorageKey(username) {
    return "nightstore_notifications_" + encodeURIComponent(username || "guest");
  }

  function loadNotifications(username) {
    try {
      var raw = localStorage.getItem(notifStorageKey(username));
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveNotifications(username, arr) {
    try {
      localStorage.setItem(notifStorageKey(username), JSON.stringify(arr.slice(0, 200)));
    } catch (e) {
      /* quota */
    }
  }

  function pushNotification(username, item) {
    var list = loadNotifications(username);
    list.unshift(item);
    saveNotifications(username, list);
  }

  function userIsModerator(data, u) {
    return !!(u && (u.isModerator === true || u.role === "moderator"));
  }

  function userIsOwner(data, u) {
    return !!(u && u.isOwner === true);
  }

  function canModerate(data, u) {
    return userIsModerator(data, u) || userIsOwner(data, u);
  }

  function loadModTickets() {
    try {
      var a = JSON.parse(localStorage.getItem(MOD_TICKETS_KEY) || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function saveModTickets(arr) {
    try {
      localStorage.setItem(MOD_TICKETS_KEY, JSON.stringify(arr.slice(0, 150)));
    } catch (e) {
      window.alert("Не удалось сохранить очередь модерации.");
    }
  }

  function enqueueModerationTicket(row) {
    var list = loadModTickets();
    list.unshift({
      id: row.id || "t_" + Date.now(),
      ts: row.ts || Date.now(),
      title: String(row.title || ""),
      detail: String(row.detail || ""),
      link: String(row.link || "#"),
      kind: String(row.kind || "report"),
      reporter: String(row.reporter || ""),
      status: row.status || "open",
      replies: Array.isArray(row.replies) ? row.replies : [],
    });
    saveModTickets(list);
  }

  function sendModerationReport(data, opts) {
    var me = sessionUser(data);
    var reporter = me ? me.username : "гость";
    var detail = String(opts.detail || "").trim();
    var title = String(opts.title || "Обращение в модерацию");
    var link = opts.link || "#";
    var mods = (data.users || []).filter(function (u) {
      return userIsModerator(data, u) || userIsOwner(data, u);
    });
    if (!mods.length) {
      window.alert("Модераторы не настроены в данных сайта.");
      return;
    }
    var baseTs = Date.now();
    var ticketId = "mod_" + baseTs;
    var fullDetail = "От: @" + reporter + (detail ? "\n" + detail : "");
    enqueueModerationTicket({
      id: ticketId,
      ts: baseTs,
      title: title,
      detail: fullDetail,
      link: link,
      kind: opts.kind || "report",
      reporter: reporter,
    });
    mods.forEach(function (m, i) {
      pushNotification(m.username, {
        id: ticketId + "_" + i + "_" + String(m.username).replace(/[^a-z0-9]/gi, "_"),
        tab: "moderation",
        read: false,
        ts: baseTs,
        title: title,
        link: link,
        kind: opts.kind || "report",
        detail: fullDetail,
      });
    });
    updateNotifyBadge(data);
  }

  function attachAvatarFallback(img, seed) {
    if (!img) return;
    var s = String(seed || "user").slice(0, 64);
    img.setAttribute("data-avatar-seed", s);
    img.addEventListener(
      "error",
      function onAvErr() {
        img.removeEventListener("error", onAvErr);
        img.src = dicebearAvatar(s);
      },
      { once: true }
    );
  }

  function formatNotifTime(ts) {
    try {
      return new Date(ts).toLocaleString("ru-RU", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }

  function notifyTopicReplySubscribers(data, ownerUsername, threadTs, topicTitle, replierUsername) {
    var users = data.users || [];
    users.forEach(function (u) {
      if (u.username === replierUsername) return;
      if (!isSubscribedToTopic(u.username, ownerUsername, threadTs)) return;
      pushNotification(u.username, {
        id: String(Date.now()) + "_" + Math.random().toString(16).slice(2, 10),
        tab: "themes",
        read: false,
        ts: Date.now(),
        title: 'Новое сообщение в «' + String(topicTitle || "тема") + "»",
        link:
          "topic.html?user=" +
          encodeURIComponent(ownerUsername) +
          "&id=" +
          encodeURIComponent(String(threadTs)),
        kind: "topic_reply",
      });
    });
    updateNotifyBadge(data);
  }

  function deleteProfileThread(username, threadTs) {
    var arr = loadProfileThreads(username).filter(function (x) {
      return x.ts !== threadTs;
    });
    saveProfileThreads(username, arr);
  }

  function updateNotifyBadge(data) {
    var u = sessionUser(data);
    if (!u) return;
    var n = loadNotifications(u.username).filter(function (x) {
      return !x.read;
    }).length;
    document.querySelectorAll(".js-notify-badge").forEach(function (el) {
      el.textContent = n > 99 ? "99+" : String(n || "");
      el.hidden = n === 0;
    });
  }

  function initNotificationCenter(data) {
    var btn = document.querySelector("[data-notify-toggle]");
    if (!btn || btn.closest(".notif-dropdown")) return;

    var wrap = document.createElement("div");
    wrap.className = "notif-dropdown";
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);

    var panel = document.createElement("div");
    panel.className = "notif-dropdown-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Уведомления");
    panel.innerHTML =
      '<div class="notif-dropdown__head">' +
      '<div class="notif-tabs" role="tablist">' +
      '<button type="button" class="notif-tab is-active" data-notif-tab="all" role="tab">Все</button>' +
      '<button type="button" class="notif-tab" data-notif-tab="market" role="tab">Маркет</button>' +
      '<button type="button" class="notif-tab" data-notif-tab="themes" role="tab">Темы</button>' +
      '<button type="button" class="notif-tab" data-notif-tab="moderation" role="tab">Модерация</button>' +
      "</div>" +
      '<div class="notif-dropdown__actions">' +
      '<button type="button" class="notif-icon-btn" data-notif-markread title="Отметить прочитанным" aria-label="Отметить прочитанным">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></button>' +
      '<a class="notif-icon-btn" href="notifications.html" title="Настройки уведомлений" aria-label="Настройки уведомлений">' +
      ICON_SETTINGS_GEAR_SVG +
      "</a>" +
      "</div></div>" +
      '<div class="notif-dropdown__body" id="nightstoreNotifList"></div>';

    wrap.appendChild(panel);

    var badge = document.createElement("span");
    badge.className = "js-notify-badge notif-dropdown__badge";
    badge.setAttribute("aria-hidden", "true");
    btn.appendChild(badge);

    var activeTab = "all";
    var listEl = panel.querySelector("#nightstoreNotifList");

    function notifBelongsToTab(n, tab) {
      if (tab === "all") return true;
      var t = n && n.tab;
      var k = String((n && n.kind) || "");
      if (tab === "moderation") {
        if (t === "moderation") return true;
        return (
          k === "report" ||
          k === "wall_post_report" ||
          k === "wall_comment_report" ||
          k === "topic_report" ||
          k === "topic_reply_report"
        );
      }
      if (tab === "themes") {
        return t === "themes" || k === "topic_reply";
      }
      if (tab === "market") {
        return t === "market";
      }
      return t === tab;
    }

    function filteredList() {
      var u = sessionUser(data);
      if (!u) return [];
      var all = loadNotifications(u.username);
      return all.filter(function (n) {
        return notifBelongsToTab(n, activeTab);
      });
    }

    function paintList() {
      if (!listEl) return;
      var rows = filteredList();
      if (!rows.length) {
        listEl.innerHTML =
          '<p class="notif-empty">Нет уведомлений' +
          (activeTab === "all" ? "" : " в этой вкладке") +
          ".</p>";
        return;
      }
      var u = sessionUser(data);
      listEl.innerHTML = rows
        .map(function (n) {
          var unread = !n.read ? " notif-item--unread" : "";
          return (
            '<a class="notif-item' +
            unread +
            '" href="' +
            escapeHtml(n.link || "#") +
            '" data-notif-id="' +
            escapeHtml(n.id) +
            '">' +
            '<div class="notif-item__av" aria-hidden="true">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16v16H4zM8 8h8M8 12h5"/></svg>' +
            "</div>" +
            '<div class="notif-item__body">' +
            '<div class="notif-item__title">' +
            escapeHtml(n.title || "") +
            "</div>" +
            (n.detail
              ? '<div class="notif-item__detail">' +
                escapeHtml(n.detail).replace(/\n/g, "<br/>") +
                "</div>"
              : "") +
            '<div class="notif-item__time">' +
            escapeHtml(formatNotifTime(n.ts)) +
            "</div></div></a>"
          );
        })
        .join("");

      listEl.querySelectorAll(".notif-item[data-notif-id]").forEach(function (a) {
        a.addEventListener("click", function () {
          var id = a.getAttribute("data-notif-id");
          if (!id || !u) return;
          var full = loadNotifications(u.username);
          full.forEach(function (x) {
            if (x.id === id) x.read = true;
          });
          saveNotifications(u.username, full);
          updateNotifyBadge(data);
        });
      });
    }

    function setTab(tab) {
      activeTab = tab;
      panel.querySelectorAll("[data-notif-tab]").forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-notif-tab") === tab);
      });
      paintList();
    }

    panel.querySelectorAll("[data-notif-tab]").forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        setTab(b.getAttribute("data-notif-tab") || "all");
      });
    });

    var markReadBtn = panel.querySelector("[data-notif-markread]");
    if (markReadBtn) {
      markReadBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var u = sessionUser(data);
        if (!u) return;
        var full = loadNotifications(u.username);
        var tab = activeTab;
        full.forEach(function (x) {
          if (notifBelongsToTab(x, tab)) x.read = true;
        });
        saveNotifications(u.username, full);
        updateNotifyBadge(data);
        paintList();
      });
    }

    panel.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        setTab(activeTab);
        paintList();
      }
    });

    wrap.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    updateNotifyBadge(data);
  }

  function initNotificationsSettings() {
    var root = document.getElementById("notifSettingsRoot");
    if (!root) return;
    root.innerHTML =
      "<p>Здесь задаются предпочтения по оповещениям (локально в браузере).</p>" +
      "<ul class=\"notif-settings-list\">" +
      "<li>Темы и ответы — при подписке на тему в колокольчик приходят новые сообщения.</li>" +
      "<li>Маркет — вкладка «Маркет» зарезервирована под покупки и сделки (можно расширить позже).</li>" +
      "<li>Модерация — жалобы на посты стены, комментарии и темы приходят пользователям с пометкой модератора в data/site.json.</li>" +
      "</ul>";
  }

  function initForum(data) {
    var root = document.getElementById("forumFeed");
    if (!root) return;

    var u = sessionUser(data);
    var sideName = document.querySelector(".mini-profile .name.js-sidebar-name");
    var sideAvatar = document.querySelector(".mini-profile .js-sidebar-avatar");
    var sLikes = document.querySelector(".mini-profile .js-sidebar-likes");
    var sMsg = document.querySelector(".mini-profile .js-sidebar-messages");
    if (sideName && u) {
      sideName.innerHTML =
        '<a class="mini-profile__name-link" href="profile.html?user=' +
        encodeURIComponent(u.username) +
        '">' +
        escapeHtml(u.username) +
        "</a>";
    } else if (sideName) {
      sideName.textContent = "…";
    }
    if (sideAvatar && u) {
      sideAvatar.src = u.avatar;
      sideAvatar.alt = u.username;
    }
    if (sLikes && u) sLikes.textContent = formatIntRu(u.likes);
    if (sMsg && u) sMsg.textContent = formatIntRu(u.messages);
    if (sideAvatar && u) attachAvatarFallback(sideAvatar, u.username);

    var posts = data.forumPosts || [];
    if (!posts.length) {
      root.innerHTML =
        '<p class="threads-empty" style="margin:28px 0;text-align:center">В общей ленте пока нет тем — создайте свою в <a href="profile.html#create-thread">профиле</a>.</p>';
      return;
    }

    var html = posts
      .map(function (post) {
        var author = userById(data, post.authorId) || u;
        return (
          '<article class="feed-card">' +
          '<div class="meta">' +
          '<a class="feed-card__avatar-link" href="profile.html?user=' +
          encodeURIComponent(author.username) +
          '" aria-label="Профиль ' +
          escapeHtml(author.username) +
          '"><img class="avatar-sm-img" src="' +
          escapeHtml(author.avatar) +
          '" width="36" height="36" alt="" loading="lazy" data-avatar-seed="' +
          escapeHtml(author.username) +
          '"/></a>' +
          "<span><strong>" +
          '<a href="profile.html?user=' +
          encodeURIComponent(author.username) +
          '" class="feed-author-link">' +
          escapeHtml(author.username) +
          "</a></strong> · " +
          escapeHtml(post.board) +
          "</span></div>" +
          "<h2>" +
          escapeHtml(post.title) +
          "</h2>" +
          "<p>" +
          escapeHtml(post.excerpt) +
          "</p>" +
          '<div class="feed-footer">' +
          "<span>❤️ " +
          formatIntRu(post.likes) +
          "</span>" +
          "<span>💬 " +
          formatIntRu(post.comments) +
          "</span>" +
          "<span>" +
          escapeHtml(post.time) +
          "</span></div></article>"
        );
      })
      .join("");
    root.innerHTML = html;
    root.querySelectorAll(".avatar-sm-img").forEach(function (im) {
      attachAvatarFallback(im, im.getAttribute("data-avatar-seed") || "");
    });
  }

  function filterProducts(data, state) {
    var list = (data.products || []).slice();
    var cats = state.categories;
    if (cats.length) {
      list = list.filter(function (p) {
        return cats.indexOf(p.category) !== -1;
      });
    }
    var q = (state.query || "").trim().toLowerCase();
    if (q) {
      list = list.filter(function (p) {
        return String(p.title).toLowerCase().indexOf(q) !== -1;
      });
    }
    var pf = state.priceFrom;
    var pt = state.priceTo;
    if (pf !== "" && !isNaN(Number(pf))) {
      list = list.filter(function (p) {
        return p.price >= Number(pf);
      });
    }
    if (pt !== "" && !isNaN(Number(pt))) {
      list = list.filter(function (p) {
        return p.price <= Number(pt);
      });
    }
    return list;
  }

  function listingCoverSrc(p) {
    var from = p.image || "";
    if (!from || from.indexOf("picsum.photos/seed/") !== -1) {
      var m = (p.id || "").match(/(\d+)/);
      var n = m ? parseInt(m[1], 10) : 1;
      var picId = 10 + (Math.abs(n * 13 + String(p.title || "").length * 3) % 85);
      return "https://picsum.photos/id/" + picId + "/640/360";
    }
    return from;
  }

  function attachListingImageFallbacks(root, filtered) {
    var imgs = root.querySelectorAll(".listing-card__media img");
    filtered.forEach(function (p, i) {
      var el = imgs[i];
      if (!el) return;
      el.addEventListener("error", function onListingImgErr() {
        el.removeEventListener("error", onListingImgErr);
        var label = String(p.category || "lot").replace(/[<>&]/g, "");
        el.src =
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#221e2e"/><stop offset="100%" stop-color="#0f0d14"/></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="320" y="188" fill="#c9b4ff" font-size="28" font-family="system-ui,sans-serif" font-weight="700" text-anchor="middle">' +
              label +
              "</text></svg>"
          );
      });
    });
  }

  function renderMarketListings(data, filtered) {
    var root = document.getElementById("listingsRoot");
    if (!root) return;

    if (!filtered.length) {
      var catalog = (data.products || []).length;
      root.innerHTML =
        catalog === 0
          ? '<div class="listings-empty">В каталоге пока нет лотов — сюда попадут объявления продавцов.</div>'
          : '<div class="listings-empty">Ничего не найдено. Сбросьте фильтры или измените категорию.</div>';
      return;
    }

    var vu = sessionUser(data);
    var vun = vu && vu.username ? vu.username : "";
    root.innerHTML =
      '<div class="listings-grid">' +
      filtered
        .map(function (p) {
          var seller = userById(data, p.sellerId) || vu;
          var badges = (p.badges || [])
            .map(function (b) {
              return '<span class="listing-badge">' + escapeHtml(b) + "</span>";
            })
            .join("");
          return (
            '<article class="listing-card">' +
            '<a class="listing-card__media" href="#">' +
            '<img src="' +
            escapeHtml(listingCoverSrc(p)) +
            '" alt="" loading="lazy" width="640" height="360" />' +
            "</a>" +
            '<div class="listing-card__body">' +
            '<a class="listing-card__title" href="#">' +
            escapeHtml(p.title) +
            "</a>" +
            '<div class="listing-card__row">' +
            '<span class="listing-card__price">' +
            formatRubForViewer(data, vun, p.price || 0, {}) +
            "</span>" +
            '<span class="listing-card__time">' +
            escapeHtml(p.posted) +
            "</span></div>" +
            '<div class="listing-card__seller">' +
            '<a href="profile.html?user=' +
            encodeURIComponent(seller.username) +
            '" class="listing-card__seller-link">' +
            '<img src="' +
            escapeHtml(seller.avatar) +
            '" width="24" height="24" alt="" loading="lazy" />' +
            "<span>" +
            escapeHtml(seller.username) +
            "</span></a></div>" +
            (badges ? '<div class="listing-card__badges">' + badges + "</div>" : "") +
            "</div></article>"
          );
        })
        .join("") +
      "</div>";
    attachListingImageFallbacks(root, filtered);
  }

  function readMarketFilterState() {
    var pf = document.getElementById("priceFrom");
    var pt = document.getElementById("priceTo");
    var st = document.getElementById("searchTitle");
    var cats = [];
    document.querySelectorAll("#categoryGrid .category-tile.is-selected").forEach(function (t) {
      cats.push(t.getAttribute("data-cat") || "");
    });
    return {
      priceFrom: pf ? pf.value : "",
      priceTo: pt ? pt.value : "",
      query: st ? st.value : "",
      categories: cats.filter(Boolean),
    };
  }

  function updateMarketCounts(shown, catalogTotal) {
    document.querySelectorAll(".js-market-shown").forEach(function (el) {
      el.textContent = formatIntRu(shown);
    });
    document.querySelectorAll(".js-market-catalog").forEach(function (el) {
      el.textContent = formatIntRu(catalogTotal);
    });
  }

  function refreshMarketView(data) {
    var state = readMarketFilterState();
    var filtered = filterProducts(data, state);
    renderMarketListings(data, filtered);
    updateMarketCounts(filtered.length, data.marketStats && data.marketStats.totalAccounts ? data.marketStats.totalAccounts : filtered.length);
  }

  function initMarket(data) {
    var u = sessionUser(data);
    var bal = document.querySelector(".js-balance-value");
    if (bal && u) bal.textContent = formatRubForViewer(data, u.username, u.balanceRub || 0, {});

    var tagRoot = document.getElementById("tagCloudRoot");
    if (tagRoot && data.recentSearches && data.recentSearches.length) {
      tagRoot.innerHTML = data.recentSearches
        .map(function (t) {
          return (
            '<span class="pill-tag"><span class="dot"></span>' + escapeHtml(t.label) + "</span>"
          );
        })
        .join("");
    }

    refreshMarketView(data);

    var grid = document.getElementById("categoryGrid");
    if (grid) {
      grid.addEventListener("click", function (e) {
        var tile = e.target.closest(".category-tile");
        if (!tile || !grid.contains(tile)) return;
        tile.classList.toggle("is-selected");
        refreshMarketView(data);
      });
    }

    ["priceFrom", "priceTo", "searchTitle"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", function () {
          refreshMarketView(data);
        });
      }
    });

    var resetCompact = document.getElementById("resetCompactFilters");
    if (resetCompact) {
      resetCompact.addEventListener("click", function () {
        var pf = document.getElementById("priceFrom");
        var pt = document.getElementById("priceTo");
        var st = document.getElementById("searchTitle");
        if (pf) pf.value = "";
        if (pt) pt.value = "";
        if (st) st.value = "";
        document.querySelectorAll("#categoryGrid .category-tile.is-selected").forEach(function (t) {
          t.classList.remove("is-selected");
        });
        refreshMarketView(data);
      });
    }

    document.querySelectorAll(".sort-dropdown-option").forEach(function (opt) {
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        var wrap = opt.closest("[data-dropdown]");
        if (wrap) {
          wrap.classList.remove("is-open");
          var toggle = wrap.querySelector("[data-dropdown-toggle]");
          if (toggle) toggle.setAttribute("aria-expanded", "false");
        }
        var row = opt.closest(".sort-tabs");
        if (row) {
          row.querySelectorAll("button[data-sort-tab]").forEach(function (b) {
            b.classList.remove("is-active");
          });
          row.querySelectorAll(".sort-dropdown-toggle").forEach(function (t) {
            t.classList.remove("is-active");
          });
          var sd = opt.closest(".sort-dropdown");
          var parentToggle = sd && sd.querySelector(".sort-dropdown-toggle");
          if (parentToggle) parentToggle.classList.add("is-active");
        }
      });
    });

    var modal = document.getElementById("marketFiltersModal");
    var openBtn = document.getElementById("openAllFilters");
    if (modal) {
      function setModalOpen(open) {
        modal.classList.toggle("is-open", open);
        modal.setAttribute("aria-hidden", open ? "false" : "true");
        document.body.classList.toggle("modal-open", open);
        if (openBtn) openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      }
      if (openBtn) openBtn.addEventListener("click", function () {
        setModalOpen(true);
      });
      modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
        el.addEventListener("click", function () {
          setModalOpen(false);
        });
      });
      modal.addEventListener("click", function (e) {
        if (e.target === modal) setModalOpen(false);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
          setModalOpen(false);
        }
      });
      var modalReset = document.getElementById("modalResetFilters");
      if (modalReset) {
        modalReset.addEventListener("click", function () {
          modal.querySelectorAll("input, select, textarea").forEach(function (field) {
            if (field.tagName === "SELECT") {
              field.selectedIndex = 0;
              return;
            }
            if (field.type === "checkbox" || field.type === "radio") {
              field.checked = false;
            } else {
              field.value = "";
            }
          });
          modal.querySelectorAll(".tri-toggle").forEach(function (group) {
            group.querySelectorAll("button").forEach(function (b, i) {
              b.classList.toggle("is-on", i === 0);
            });
          });
        });
      }
    }

    if (!window.__nightstoreMarketFxBound) {
      window.__nightstoreMarketFxBound = true;
      window.addEventListener("nightstore-currency-changed", function () {
        var d = window.NightStoreData;
        if (!d) return;
        var us = sessionUser(d);
        var b = document.querySelector(".js-balance-value");
        if (b && us) b.textContent = formatRubForViewer(d, us.username, us.balanceRub || 0, {});
        refreshMarketView(d);
      });
    }
  }

  function formatThreadDate() {
    try {
      return new Date().toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return String(new Date().toISOString()).slice(0, 10);
    }
  }

  function threadStorageKey(username) {
    return "nightstore_threads_" + encodeURIComponent(username || "guest");
  }

  function normalizeThread(th) {
    if (!th || typeof th !== "object") return th;
    if (th.ts == null) th.ts = Date.now();
    if (th.title == null) th.title = "";
    if (th.body == null) th.body = "";
    if (!Array.isArray(th.replies)) th.replies = [];
    if (typeof th.views !== "number" || isNaN(th.views)) th.views = Number(th.views) || 0;
    if (typeof th.likes !== "number" || isNaN(th.likes)) th.likes = 0;
    if (typeof th.dislikes !== "number" || isNaN(th.dislikes)) th.dislikes = 0;
    if (!th.voteByUser || typeof th.voteByUser !== "object") th.voteByUser = {};
    if (typeof th.closed !== "boolean") th.closed = false;
    th.likes = Math.max(0, th.likes);
    th.dislikes = Math.max(0, th.dislikes);
    th.comments = th.replies.length;
    if (!Array.isArray(th.images)) th.images = [];
    else
      th.images = th.images.filter(isDataImageUrl).slice(0, 8);
    th.replies.forEach(function (r, idx) {
      if (!r || typeof r !== "object") return;
      if (r.ts == null) r.ts = Number(th.ts) * 1000 + idx;
      if (r.deleted == null) r.deleted = false;
      if (!Array.isArray(r.images)) r.images = [];
      else r.images = r.images.filter(isDataImageUrl).slice(0, 6);
    });
    return th;
  }

  function loadProfileThreads(username) {
    try {
      var raw = localStorage.getItem(threadStorageKey(username));
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      arr.forEach(normalizeThread);
      return arr;
    } catch (e) {
      return [];
    }
  }

  function updateProfileThread(username, threadTs, mutator) {
    var arr = loadProfileThreads(username);
    var idx = arr.findIndex(function (x) {
      return x.ts === threadTs;
    });
    if (idx === -1) return null;
    mutator(arr[idx]);
    normalizeThread(arr[idx]);
    saveProfileThreads(username, arr);
    return arr[idx];
  }

  function bumpTopicViewOnce(ownerUsername, thread) {
    var key =
      "nightstore_topic_visit_" +
      encodeURIComponent(ownerUsername || "") +
      "_" +
      String(thread.ts);
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    thread.views = (thread.views || 0) + 1;
  }

  function saveProfileThreads(username, threads) {
    try {
      localStorage.setItem(threadStorageKey(username), JSON.stringify(threads));
    } catch (e) {
      /* quota */
    }
  }

  function renderProfileThreads(root, threads, opts) {
    if (!root) return;
    var isOwn = opts && opts.isOwn;
    var profileUser = (opts && opts.profileUsername) || "";
    if (!threads.length) {
      root.innerHTML =
        '<p class="threads-empty">' +
        (isOwn
          ? "Пока нет тем — создайте первую формой выше."
          : "У пользователя пока нет тем в этом браузере.") +
        "</p>";
      return;
    }
    root.innerHTML = threads
      .map(function (th) {
        var href =
          "topic.html?user=" +
          encodeURIComponent(profileUser) +
          "&id=" +
          encodeURIComponent(String(th.ts));
        var repliesCount = Array.isArray(th.replies) ? th.replies.length : th.comments || 0;
        return (
          '<div class="feed-card profile-thread-item">' +
          '<a class="profile-thread-item__title profile-thread-item__link" href="' +
          href +
          '">' +
          escapeHtml(th.title) +
          "</a>" +
          '<div class="feed-footer profile-thread-item__meta">' +
          "<span>👁 " +
          formatIntRu(th.views != null ? th.views : 0) +
          "</span>" +
          "<span>💬 " +
          formatIntRu(repliesCount) +
          "</span>" +
          "<span>" +
          escapeHtml(th.date || "") +
          "</span></div></div>"
        );
      })
      .join("");
  }

  function wireProfileThreadComposer(username, isOwn) {
    var composer = document.getElementById("create-thread");
    var btn = document.getElementById("createThreadBtn");
    var input = document.getElementById("newThreadTitle");
    var imgInput = document.getElementById("newThreadImagesInput");
    var imgBtn = document.getElementById("newThreadImagesBtn");
    var imgPreview = document.getElementById("newThreadImagesPreview");
    if (!composer || !btn || !input) return;
    if (!isOwn) {
      composer.style.display = "none";
      return;
    }
    composer.style.display = "block";
    var threadPendingImages = [];

    function paintThreadPreviews() {
      if (!imgPreview) return;
      if (!threadPendingImages.length) {
        imgPreview.innerHTML = "";
        imgPreview.hidden = true;
        return;
      }
      imgPreview.hidden = false;
      imgPreview.innerHTML = threadPendingImages
        .map(function (src, i) {
          return (
            '<span class="attach-preview__item">' +
            '<img src="' +
            escapeHtml(src) +
            '" alt=""/>' +
            '<button type="button" class="attach-preview__rm" data-idx="' +
            i +
            '" aria-label="Удалить">×</button></span>'
          );
        })
        .join("");
      imgPreview.querySelectorAll(".attach-preview__rm").forEach(function (b) {
        b.onclick = function () {
          var ix = Number(b.getAttribute("data-idx"));
          threadPendingImages.splice(ix, 1);
          paintThreadPreviews();
        };
      });
    }

    if (imgBtn && imgInput && !composer.dataset.threadImgWired) {
      composer.dataset.threadImgWired = "1";
      imgBtn.addEventListener("click", function () {
        imgInput.click();
      });
      imgInput.addEventListener("change", function () {
        filesToDataUrlList(imgInput.files, 4 - threadPendingImages.length, function (got) {
          got.forEach(function (u) {
            if (threadPendingImages.length < 4) threadPendingImages.push(u);
          });
          imgInput.value = "";
          paintThreadPreviews();
        });
      });
    }

    if (btn.dataset.wired === "1") return;
    btn.dataset.wired = "1";
    function submitThread() {
      var title = input.value.trim();
      if (!title) {
        input.focus();
        return;
      }
      var bodyEl = document.getElementById("newThreadBody");
      var body = bodyEl ? String(bodyEl.value || "").trim() : "";
      var arr = loadProfileThreads(username);
      var row = {
        title: title,
        body: body,
        images: threadPendingImages.slice(0, 4),
        views: 0,
        comments: 0,
        date: formatThreadDate(),
        ts: Date.now(),
        replies: [],
        likes: 0,
        dislikes: 0,
        voteByUser: {},
      };
      normalizeThread(row);
      arr.unshift(row);
      saveProfileThreads(username, arr);
      input.value = "";
      if (bodyEl) bodyEl.value = "";
      threadPendingImages.length = 0;
      paintThreadPreviews();
      renderProfileThreads(document.getElementById("profileThreadsRoot"), arr, {
        isOwn: true,
        profileUsername: username,
      });
    }
    btn.addEventListener("click", submitThread);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitThread();
      }
    });
  }

  function renderDataImagesHtml(dataUrls, cls) {
    cls = cls || "embed-img";
    return (dataUrls || [])
      .filter(isDataImageUrl)
      .map(function (src) {
        return '<img class="' + cls + '" src="' + escapeHtml(src) + '" alt="" loading="lazy"/>';
      })
      .join("");
  }

  function avatarForUsername(data, username) {
    var u = (data.users || []).find(function (x) {
      return x.username === username;
    });
    return u && u.avatar ? u.avatar : dicebearAvatar(username);
  }

  function normalizeWallComment(c) {
    if (!c || typeof c !== "object") return null;
    return {
      id: c.id != null ? Number(c.id) : Date.now(),
      author: String(c.author || ""),
      body: String(c.body || ""),
      date: String(c.date || ""),
      deleted: !!c.deleted,
    };
  }

  function normalizeWallPoll(o) {
    if (!o || typeof o !== "object") return null;
    var q = String(o.question || "").trim();
    var ch = Array.isArray(o.choices) ? o.choices : [];
    ch = ch
      .map(function (c, i) {
        if (!c || typeof c !== "object") return null;
        var id = String(c.id != null ? c.id : "c" + i);
        var text = String(c.text || "").trim();
        if (!text) return null;
        return { id: id, text: text };
      })
      .filter(Boolean)
      .slice(0, 6);
    if (!q || ch.length < 2) return null;
    var votes = o.votes && typeof o.votes === "object" ? Object.assign({}, o.votes) : {};
    var desc = String(o.description || "").trim();
    if (desc.length > 240) desc = desc.slice(0, 240);
    return { question: q, choices: ch, votes: votes, description: desc };
  }

  function wallPollBlockHtml(p, voterName, reopenPostId) {
    var pol = normalizeWallPoll(p.poll);
    if (!pol) return "";
    var total = 0;
    Object.keys(pol.votes || {}).forEach(function () {
      total++;
    });
    function countFor(cid) {
      var n = 0;
      Object.keys(pol.votes || {}).forEach(function (u) {
        if (pol.votes[u] === cid) n++;
      });
      return n;
    }
    var my = pol.votes && pol.votes[voterName];
    var reopen =
      reopenPostId != null && reopenPostId !== "" ? String(reopenPostId) : "";
    var showVoteUi = !my || reopen === String(p.id);

    var descHtml = pol.description
      ? '<div class="wall-poll__desc">' + escapeHtml(pol.description) + "</div>"
      : "";
    var kindRow = '<div class="wall-poll__kind">Опрос</div>';

    if (showVoteUi) {
      var preselect = "";
      if (my && reopen === String(p.id)) preselect = my;
      var rowBtns = pol.choices
        .map(function (c) {
          var sel = preselect === c.id ? " is-selected" : "";
          return (
            '<button type="button" class="wall-poll-row wall-poll-row--pick' +
            sel +
            '" data-wall-poll-pick data-choice="' +
            escapeHtml(c.id) +
            '" aria-pressed="' +
            (preselect === c.id ? "true" : "false") +
            '"><span class="wall-poll-row__box" aria-hidden="true"></span><span class="wall-poll-row__text">' +
            escapeHtml(c.text) +
            "</span></button>"
          );
        })
        .join("");
      var subDis = preselect ? "" : " disabled";
      var formDataChoice = preselect
        ? ' data-wall-poll-choice="' + escapeHtml(preselect) + '"'
        : "";
      return (
        '<div class="wall-poll wall-poll--vote" data-wall-poll-form data-post-id="' +
        String(p.id) +
        '"' +
        formDataChoice +
        ">" +
        descHtml +
        kindRow +
        '<div class="wall-poll__q">' +
        escapeHtml(pol.question) +
        '</div><div class="wall-poll__choices">' +
        rowBtns +
        '</div><button type="button" class="wall-poll-vote-btn"' +
        subDis +
        ' data-wall-poll-submit data-post-id="' +
        String(p.id) +
        '">Голосовать</button>' +
        '<p class="wall-poll__foot">' +
        (total > 0 ? "Уже " + formatIntRu(total) + " голос(ов)" : "Пока нет голосов") +
        "</p></div>"
      );
    }

    var resultRows = pol.choices
      .map(function (c) {
        var cnt = countFor(c.id);
        var pct = total ? Math.round((cnt / total) * 100) : 0;
        var mine = my === c.id ? " wall-poll-row--mine" : "";
        return (
          '<div class="wall-poll-row wall-poll-row--result' +
          mine +
          '"><div class="wall-poll-row__bar" style="width:' +
          pct +
          '%"></div><span class="wall-poll-row__text">' +
          escapeHtml(c.text) +
          '</span><span class="wall-poll-row__meta">' +
          formatIntRu(cnt) +
          " · " +
          pct +
          "%</span></div>"
        );
      })
      .join("");
    return (
      '<div class="wall-poll wall-poll--results">' +
      descHtml +
      kindRow +
      '<div class="wall-poll__q">' +
      escapeHtml(pol.question) +
      '</div><div class="wall-poll__choices wall-poll__choices--results">' +
      resultRows +
      '</div><p class="wall-poll__foot">Голосов: ' +
      formatIntRu(total) +
      '</p><button type="button" class="wall-poll-reopen" data-wall-poll-reopen data-post-id="' +
      String(p.id) +
      '">Изменить голос</button></div>'
    );
  }

  function wallVisibleCommentCount(p) {
    return (p.comments || []).filter(function (c) {
      return c && !c.deleted;
    }).length;
  }

  function loadWallPosts(profileUsername) {
    try {
      var raw = localStorage.getItem(wallStorageKey(profileUsername));
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .map(function (p) {
          if (!p || typeof p !== "object") return null;
          var comments = Array.isArray(p.comments)
            ? p.comments.map(normalizeWallComment).filter(Boolean)
            : [];
          var voteByUser =
            p.voteByUser && typeof p.voteByUser === "object" ? Object.assign({}, p.voteByUser) : {};
          return {
            id: p.id != null ? Number(p.id) : Date.now(),
            body: String(p.body || ""),
            author: String(p.author || ""),
            date: String(p.date || ""),
            likes: Math.max(0, Number(p.likes) || 0),
            dislikes: Math.max(0, Number(p.dislikes) || 0),
            voteByUser: voteByUser,
            deleted: !!p.deleted,
            images: Array.isArray(p.images)
              ? p.images.filter(isDataImageUrl).slice(0, 8)
              : [],
            comments: comments,
            poll: normalizeWallPoll(p.poll),
          };
        })
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  function updateWallPost(profileUsername, postId, mutator) {
    var arr = loadWallPosts(profileUsername);
    var p = arr.find(function (x) {
      return Number(x.id) === Number(postId);
    });
    if (!p) return null;
    mutator(p);
    saveWallPosts(profileUsername, arr);
    return p;
  }

  function saveWallPosts(profileUsername, posts) {
    try {
      localStorage.setItem(wallStorageKey(profileUsername), JSON.stringify(posts.slice(0, 200)));
      return true;
    } catch (e) {
      window.alert(
        "Не удалось сохранить данные стены: хранилище браузера переполнено. Уменьшите число фото в посте или удалите старые сообщения."
      );
      return false;
    }
  }

  function closeWallDropdowns() {
    document.querySelectorAll(".wall-dropdown.is-open").forEach(function (wrap) {
      wrap.classList.remove("is-open");
      var btn = wrap.querySelector("[data-wall-dropdown-toggle]");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  function closeWallTbMenusOnly() {
    var ap = document.getElementById("wallTbAlignPopover");
    var mp = document.getElementById("wallTbMorePopover");
    var ab = document.getElementById("wallTbAlignBtn");
    var mb = document.getElementById("wallTbMoreBtn");
    if (ap) ap.hidden = true;
    if (mp) mp.hidden = true;
    if (ab) ab.setAttribute("aria-expanded", "false");
    if (mb) mb.setAttribute("aria-expanded", "false");
  }

  function closeWallEmojiPopoverOnly() {
    var wEmoji = document.getElementById("wallEmojiPopover");
    var wEmoBtn = document.getElementById("wallEmojiBtn");
    if (wEmoji) wEmoji.hidden = true;
    if (wEmoBtn) wEmoBtn.setAttribute("aria-expanded", "false");
  }

  function closeWallEditorFlyouts() {
    closeWallTbMenusOnly();
    closeWallEmojiPopoverOnly();
  }

  function wireProfileWall(data, profileUser) {
    var listEl = document.getElementById("wallFeedList");
    var emptyEl = document.getElementById("wallFeedEmpty");
    var ta = document.getElementById("wallPostInput");
    var pubBtn = document.getElementById("wallPublishBtn");
    var pollBtn = document.getElementById("wallPollBtn");
    if (!listEl || !ta || !pubBtn) return;

    var session = sessionUser(data);
    var wallPendingImages = [];
    var wallPendingPoll = null;
    var wallPollReopenId = null;
    var pollDraftEl = document.getElementById("wallPollDraft");

    function paintPollDraft() {
      if (!pollDraftEl) return;
      var pol = wallPendingPoll ? normalizeWallPoll(wallPendingPoll) : null;
      if (!pol) {
        pollDraftEl.innerHTML = "";
        pollDraftEl.hidden = true;
        return;
      }
      pollDraftEl.hidden = false;
      var descLine = pol.description
        ? '<div class="wall-poll-draft__desc">' + escapeHtml(pol.description) + "</div>"
        : "";
      pollDraftEl.innerHTML =
        '<div class="wall-poll-draft__inner">' +
        '<span class="wall-poll-draft__label">Опрос к посту</span>' +
        descLine +
        '<strong class="wall-poll-draft__q">' +
        escapeHtml(pol.question) +
        "</strong>" +
        '<span class="wall-poll-draft__opts">' +
        pol.choices
          .map(function (c) {
            return escapeHtml(c.text);
          })
          .join(" · ") +
        '</span><button type="button" class="btn-secondary wall-poll-draft__rm" data-wall-poll-draft-clear>Убрать опрос</button></div>';
      var rm = pollDraftEl.querySelector("[data-wall-poll-draft-clear]");
      if (rm) {
        rm.onclick = function () {
          wallPendingPoll = null;
          paintPollDraft();
        };
      }
    }

    var state = {
      mode: "all",
      userNeedle: "",
      textNeedle: "",
      sort: "date",
    };

    function allRaw() {
      return loadWallPosts(profileUser.username);
    }

    function countVisibleUndeleted() {
      return allRaw().filter(function (p) {
        return !p.deleted;
      }).length;
    }

    function anyDeleted() {
      return allRaw().some(function (p) {
        return p.deleted;
      });
    }

    function filtered() {
      var list = allRaw().slice();
      if (state.mode === "deleted") {
        list = list.filter(function (p) {
          return p.deleted;
        });
      } else {
        list = list.filter(function (p) {
          return !p.deleted;
        });
      }
      if (state.mode === "mine") {
        list = list.filter(function (p) {
          return p.author === profileUser.username;
        });
      }
      if (state.userNeedle) {
        var q = state.userNeedle.toLowerCase();
        list = list.filter(function (p) {
          return String(p.author).toLowerCase().indexOf(q) !== -1;
        });
      }
      if (state.textNeedle) {
        var t = state.textNeedle.toLowerCase();
        list = list.filter(function (p) {
          if (String(p.body).toLowerCase().indexOf(t) !== -1) return true;
          if (p.poll && String(p.poll.question || "").toLowerCase().indexOf(t) !== -1) return true;
          if (p.poll && String(p.poll.description || "").toLowerCase().indexOf(t) !== -1) return true;
          if (
            p.poll &&
            Array.isArray(p.poll.choices) &&
            p.poll.choices.some(function (c) {
              return c && String(c.text || "").toLowerCase().indexOf(t) !== -1;
            })
          ) {
            return true;
          }
          return false;
        });
      }
      if (state.sort === "likes") {
        list.sort(function (a, b) {
          return (b.likes || 0) - (a.likes || 0) || (b.id || 0) - (a.id || 0);
        });
      } else if (state.sort === "replies") {
        list.sort(function (a, b) {
          return (
            wallVisibleCommentCount(b) - wallVisibleCommentCount(a) || (b.id || 0) - (a.id || 0)
          );
        });
      } else {
        list.sort(function (a, b) {
          return (b.id || 0) - (a.id || 0);
        });
      }
      return list;
    }

    function paint() {
      var rows = filtered();
      if (!rows.length) {
        listEl.innerHTML = "";
        listEl.hidden = true;
        if (emptyEl) {
          emptyEl.hidden = false;
          if (countVisibleUndeleted() === 0 && state.mode === "all" && !state.userNeedle && !state.textNeedle) {
            emptyEl.textContent = "На стене пока нет ни одного сообщения";
          } else if (state.mode === "deleted" && !anyDeleted()) {
            emptyEl.textContent = "Удаленных сообщений нет";
          } else {
            emptyEl.textContent = "Ничего не найдено по текущим условиям.";
          }
        }
        return;
      }
      if (emptyEl) emptyEl.hidden = true;
      listEl.hidden = false;
      var isMod = canModerate(data, session);
      var isWallOwner = session.username === profileUser.username;
      listEl.innerHTML = rows
        .map(function (p) {
          var imgs = renderDataImagesHtml(p.images, "wall-post-img");
          var bodyHtml = p.body
            ? '<div class="wall-post-card__body">' + formatWallPostHtml(p.body) + "</div>"
            : "";
          var gallery = imgs ? '<div class="wall-post-card__gallery">' + imgs + "</div>" : "";
          var pollBlock = wallPollBlockHtml(p, session.username, wallPollReopenId);
          var avSrc = escapeHtml(avatarForUsername(data, p.author));
          var v = p.voteByUser && p.voteByUser[session.username];
          var nComm = wallVisibleCommentCount(p);
          var commentsHtml = (p.comments || [])
            .filter(function (c) {
              return c && !c.deleted;
            })
            .map(function (c) {
              var cav = escapeHtml(avatarForUsername(data, c.author));
              var canDelC =
                session.username === c.author ||
                isWallOwner ||
                isMod;
              var delBtn = canDelC
                ? '<button type="button" class="wall-comment__del" data-wall-comment-del data-wall-post="' +
                  String(p.id) +
                  '" data-cid="' +
                  String(c.id) +
                  '">Удалить</button>'
                : "";
              return (
                '<div class="wall-comment" data-cid="' +
                String(c.id) +
                '">' +
                '<img class="wall-comment__av" src="' +
                cav +
                '" width="32" height="32" alt="" loading="lazy" data-avatar-seed="' +
                escapeHtml(c.author) +
                '"/>' +
                '<div class="wall-comment__main">' +
                '<div class="wall-comment__meta"><strong>' +
                (String(c.author || "").trim()
                  ? '<a class="feed-author-link wall-author-link" href="profile.html?user=' +
                    encodeURIComponent(String(c.author).trim()) +
                    '">' +
                    escapeHtml(c.author) +
                    "</a>"
                  : "<span>" + escapeHtml(c.author || "") + "</span>") +
                "</strong> · " +
                escapeHtml(c.date || "") +
                "</div>" +
                '<div class="wall-comment__body">' +
                escapeHtml(c.body || "").replace(/\n/g, "<br/>") +
                "</div>" +
                '<div class="wall-comment__actions">' +
                '<button type="button" class="wall-comment__report" data-wall-comment-report data-wall-post="' +
                String(p.id) +
                '" data-cid="' +
                String(c.id) +
                '">Пожаловаться</button>' +
                delBtn +
                "</div></div></div>"
              );
            })
            .join("");
          return (
            '<article class="wall-post-card" id="wall-' +
            escapeHtml(String(p.id)) +
            '" data-wall-post-id="' +
            String(p.id) +
            '">' +
            '<div class="wall-post-card__head">' +
            '<img class="wall-post-card__av" src="' +
            avSrc +
            '" width="40" height="40" alt="" loading="lazy" data-avatar-seed="' +
            escapeHtml(p.author) +
            '"/>' +
            '<div class="wall-post-card__meta">' +
            "<strong>" +
            (String(p.author || "").trim()
              ? '<a class="feed-author-link wall-author-link" href="profile.html?user=' +
                encodeURIComponent(String(p.author).trim()) +
                '">' +
                escapeHtml(p.author) +
                "</a>"
              : "<span>" + escapeHtml(p.author || "") + "</span>") +
            "</strong> · " +
            escapeHtml(p.date || "") +
            "</div>" +
            '<button type="button" class="wall-post-card__report" data-wall-report-post="' +
            String(p.id) +
            '">Пожаловаться</button></div>' +
            bodyHtml +
            gallery +
            pollBlock +
            '<div class="wall-post-card__votes">' +
            '<button type="button" class="wall-vote-btn wall-vote-btn--up' +
            (v === "up" ? " is-on" : "") +
            '" data-wall-vote="up" data-post-id="' +
            String(p.id) +
            '" aria-pressed="' +
            (v === "up" ? "true" : "false") +
            '"><span class="wall-vote-btn__i">👍</span> <span data-wall-lc>' +
            formatIntRu(p.likes || 0) +
            "</span></button>" +
            '<button type="button" class="wall-vote-btn wall-vote-btn--down' +
            (v === "down" ? " is-on" : "") +
            '" data-wall-vote="down" data-post-id="' +
            String(p.id) +
            '" aria-pressed="' +
            (v === "down" ? "true" : "false") +
            '"><span class="wall-vote-btn__i">👎</span> <span data-wall-dc>' +
            formatIntRu(p.dislikes || 0) +
            "</span></button></div>" +
            '<details class="wall-post-card__thread">' +
            "<summary>Комментарии (" +
            nComm +
            ")</summary>" +
            '<div class="wall-comments">' +
            (commentsHtml || '<p class="wall-comments__empty">Пока нет комментариев.</p>') +
            "</div>" +
            '<div class="wall-comment-form">' +
            '<label class="sr-only" for="wallc-' +
            p.id +
            '">Комментарий</label>' +
            '<textarea id="wallc-' +
            p.id +
            '" class="wall-comment-form__ta" rows="2" maxlength="2000" placeholder="Написать комментарий…"></textarea>' +
            '<button type="button" class="btn-primary wall-comment-form__btn" data-wall-comment-send="' +
            String(p.id) +
            '">Отправить</button></div></details></article>'
          );
        })
        .join("");
      listEl.querySelectorAll(".wall-post-card__av, .wall-comment__av").forEach(function (im) {
        attachAvatarFallback(im, im.getAttribute("data-avatar-seed") || "");
      });
    }

    if (pubBtn.dataset.wallWired !== "1") {
      pubBtn.dataset.wallWired = "1";

      document.querySelectorAll("[data-wall-dropdown]").forEach(function (wrap) {
        var btn = wrap.querySelector("[data-wall-dropdown-toggle]");
        if (!btn) return;
        wrap.addEventListener("click", function (e) {
          e.stopPropagation();
        });
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var willOpen = !wrap.classList.contains("is-open");
          document.querySelectorAll("[data-wall-dropdown].is-open").forEach(function (w) {
            if (w !== wrap) {
              w.classList.remove("is-open");
              var ob = w.querySelector("[data-wall-dropdown-toggle]");
              if (ob) ob.setAttribute("aria-expanded", "false");
            }
          });
          wrap.classList.toggle("is-open", willOpen);
          btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });
      });

      document.querySelectorAll("[data-wall-filter]").forEach(function (b) {
        b.addEventListener("click", function () {
          state.mode = b.getAttribute("data-wall-filter") || "all";
          state.userNeedle = "";
          state.textNeedle = "";
          var wrap = b.closest("[data-wall-dropdown]");
          if (wrap) {
            wrap.classList.remove("is-open");
            var tb = wrap.querySelector("[data-wall-dropdown-toggle]");
            if (tb) tb.setAttribute("aria-expanded", "false");
          }
          var fu = document.getElementById("wallFindUser");
          var fq = document.getElementById("wallFindQuery");
          if (fu) fu.value = "";
          if (fq) fq.value = "";
          paint();
        });
      });

      document.querySelectorAll("[data-wall-sort]").forEach(function (b) {
        b.addEventListener("click", function () {
          state.sort = b.getAttribute("data-wall-sort") || "date";
          document.querySelectorAll("[data-wall-sort]").forEach(function (x) {
            x.classList.toggle("is-active", x === b);
          });
          var wrap = b.closest("[data-wall-dropdown]");
          if (wrap) {
            wrap.classList.remove("is-open");
            var tb = wrap.querySelector("[data-wall-dropdown-toggle]");
            if (tb) tb.setAttribute("aria-expanded", "false");
          }
          paint();
        });
      });

      var userBtn = document.getElementById("wallFindUserBtn");
      var qBtn = document.getElementById("wallFindQueryBtn");
      if (userBtn) {
        userBtn.addEventListener("click", function () {
          var inp = document.getElementById("wallFindUser");
          state.userNeedle = inp ? inp.value.trim() : "";
          state.textNeedle = "";
          var fq = document.getElementById("wallFindQuery");
          if (fq) fq.value = "";
          closeWallDropdowns();
          paint();
        });
      }
      if (qBtn) {
        qBtn.addEventListener("click", function () {
          var inp = document.getElementById("wallFindQuery");
          state.textNeedle = inp ? inp.value.trim() : "";
          state.userNeedle = "";
          var fu = document.getElementById("wallFindUser");
          if (fu) fu.value = "";
          closeWallDropdowns();
          paint();
        });
      }

      var wallImgInput = document.getElementById("wallImageInput");
      var wallImgBtn = document.getElementById("wallImageBtn");
      var wallPrevBox = document.getElementById("wallPendingPreview");
      function paintWallPending() {
        if (!wallPrevBox) return;
        if (!wallPendingImages.length) {
          wallPrevBox.innerHTML = "";
          wallPrevBox.hidden = true;
          return;
        }
        wallPrevBox.hidden = false;
        wallPrevBox.innerHTML = wallPendingImages
          .map(function (src, i) {
            return (
              '<span class="attach-preview__item"><img src="' +
              escapeHtml(src) +
              '" alt=""/>' +
              '<button type="button" class="attach-preview__rm" data-wix="' +
              i +
              '" aria-label="Удалить">×</button></span>'
            );
          })
          .join("");
        wallPrevBox.querySelectorAll("[data-wix]").forEach(function (b) {
          b.onclick = function () {
            var ix = Number(b.getAttribute("data-wix"));
            wallPendingImages.splice(ix, 1);
            paintWallPending();
          };
        });
      }
      if (wallImgBtn && wallImgInput) {
        wallImgBtn.addEventListener("click", function () {
          wallImgInput.click();
        });
        wallImgInput.addEventListener("change", function () {
          filesToDataUrlList(wallImgInput.files, 6 - wallPendingImages.length, function (got) {
            got.forEach(function (u) {
              if (wallPendingImages.length < 6) wallPendingImages.push(u);
            });
            wallImgInput.value = "";
            paintWallPending();
          });
        });
      }

      document.querySelectorAll(".wall-tb-menu").forEach(function (m) {
        m.addEventListener("click", function (e) {
          e.stopPropagation();
        });
      });

      var topbar = document.getElementById("wallEditorTopbar");
      var tTopBtn = document.getElementById("wallToggleTopbar");
      if (tTopBtn && topbar) {
        tTopBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var show = topbar.hidden;
          topbar.hidden = !show;
          tTopBtn.setAttribute("aria-expanded", show ? "true" : "false");
          tTopBtn.classList.toggle("is-on", show);
        });
      }

      var pop = document.getElementById("wallEmojiPopover");
      var emoBtn = document.getElementById("wallEmojiBtn");
      var gridEl = document.getElementById("wallEmojiGrid");
      var recentEl = document.getElementById("wallEmojiRecent");

      function bindEmojiCell(cell) {
        cell.addEventListener("click", function (e) {
          e.stopPropagation();
          var ch = cell.textContent || "";
          if (!ch) return;
          insertAtCursor(ta, ch);
          pushWallEmojiRecent(ch);
          paintWallEmojiRecentRow();
          if (pop) pop.hidden = true;
          if (emoBtn) emoBtn.setAttribute("aria-expanded", "false");
          closeWallTbMenusOnly();
        });
      }

      function paintWallEmojiRecentRow() {
        if (!recentEl) return;
        var recent = loadWallEmojiRecent();
        var parts = [];
        for (var i = 0; i < 7; i++) {
          var ch = recent[i] || "";
          if (ch) {
            parts.push('<button type="button" class="wall-emoji-cell wall-emoji-cell--recent">' + ch + "</button>");
          } else {
            parts.push('<span class="wall-emoji-slot" aria-hidden="true"></span>');
          }
        }
        recentEl.innerHTML = parts.join("");
        recentEl.querySelectorAll(".wall-emoji-cell").forEach(bindEmojiCell);
      }

      if (gridEl && !gridEl.dataset.built) {
        gridEl.dataset.built = "1";
        var allEm = nightstoreEmojiList();
        var gridEm = allEm.slice(0, WALL_EMOJI_GRID_COUNT);
        gridEl.innerHTML = gridEm
          .map(function (em) {
            return '<button type="button" class="wall-emoji-cell">' + em + "</button>";
          })
          .join("");
        gridEl.querySelectorAll(".wall-emoji-cell").forEach(bindEmojiCell);
      }
      if (pop) {
        pop.addEventListener("click", function (e) {
          e.stopPropagation();
        });
      }
      if (emoBtn && pop) {
        emoBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeWallTbMenusOnly();
          paintWallEmojiRecentRow();
          var open = pop.hidden;
          pop.hidden = !open;
          emoBtn.setAttribute("aria-expanded", open ? "true" : "false");
        });
      }

      var alignBtn = document.getElementById("wallTbAlignBtn");
      var alignPop = document.getElementById("wallTbAlignPopover");
      if (alignBtn && alignPop) {
        alignBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (pop && !pop.hidden) {
            pop.hidden = true;
            if (emoBtn) emoBtn.setAttribute("aria-expanded", "false");
          }
          var moreP = document.getElementById("wallTbMorePopover");
          if (moreP) moreP.hidden = true;
          var mb = document.getElementById("wallTbMoreBtn");
          if (mb) mb.setAttribute("aria-expanded", "false");
          var willOpen = alignPop.hidden;
          alignPop.hidden = !willOpen;
          alignBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });
        alignPop.querySelectorAll("[data-wall-align]").forEach(function (b) {
          b.addEventListener("click", function () {
            if (pop && !pop.hidden) {
              pop.hidden = true;
              if (emoBtn) emoBtn.setAttribute("aria-expanded", "false");
            }
            var al = b.getAttribute("data-wall-align") || "left";
            if (!/^(left|center|right)$/.test(al)) return;
            wrapSelection(ta, "[align=" + al + "]", "[/align]");
            alignPop.hidden = true;
            alignBtn.setAttribute("aria-expanded", "false");
          });
        });
      }

      var moreBtn = document.getElementById("wallTbMoreBtn");
      var morePop = document.getElementById("wallTbMorePopover");
      if (moreBtn && morePop) {
        moreBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (pop && !pop.hidden) {
            pop.hidden = true;
            if (emoBtn) emoBtn.setAttribute("aria-expanded", "false");
          }
          if (alignPop) alignPop.hidden = true;
          if (alignBtn) alignBtn.setAttribute("aria-expanded", "false");
          var willOpen = morePop.hidden;
          morePop.hidden = !willOpen;
          moreBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });
        morePop.querySelectorAll("[data-wall-more]").forEach(function (b) {
          b.addEventListener("click", function () {
            if (pop && !pop.hidden) {
              pop.hidden = true;
              if (emoBtn) emoBtn.setAttribute("aria-expanded", "false");
            }
            var act = b.getAttribute("data-wall-more") || "";
            if (act === "spoiler") {
              wrapSelection(ta, "[spoiler]", "[/spoiler]");
            } else if (act === "code") {
              wrapSelection(ta, "[code]", "[/code]");
            } else if (act === "icode") {
              wrapSelection(ta, "[icode]", "[/icode]");
            } else if (act === "censor") {
              wrapSelection(ta, "[censor]", "[/censor]");
            } else if (act === "user") {
              var nm = window.prompt("Имя пользователя (логин)", session.username || "");
              if (nm && String(nm).trim()) {
                insertAtCursor(ta, "[user]" + String(nm).trim() + "[/user]");
              }
            } else if (act === "deletemy") {
              if (
                !confirm(
                  "Удалить все ваши сообщения на этой стене? Их можно будет снова увидеть в фильтре «Удалённые сообщения»."
                )
              ) {
                morePop.hidden = true;
                moreBtn.setAttribute("aria-expanded", "false");
                return;
              }
              var arr = allRaw();
              arr.forEach(function (p) {
                if (p.author === session.username) p.deleted = true;
              });
              saveWallPosts(profileUser.username, arr);
              paint();
            }
            morePop.hidden = true;
            moreBtn.setAttribute("aria-expanded", "false");
          });
        });
      }

      var galBtn = document.getElementById("wallTbGalleryBtn");
      if (galBtn && wallImgInput) {
        galBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeWallEditorFlyouts();
          wallImgInput.click();
        });
      }

      var undStack = [ta.value || ""];
      var redStack = [];
      var snapT;
      function snap() {
        var v = ta.value;
        if (undStack[undStack.length - 1] === v) return;
        undStack.push(v);
        if (undStack.length > 35) undStack.shift();
        redStack.length = 0;
      }
      ta.addEventListener("input", function () {
        clearTimeout(snapT);
        snapT = setTimeout(snap, 450);
      });
      var uBtn = document.getElementById("wallUndoBtn");
      var rBtn = document.getElementById("wallRedoBtn");
      if (uBtn) {
        uBtn.addEventListener("click", function (e) {
          e.preventDefault();
          if (undStack.length < 2) return;
          redStack.push(undStack.pop());
          ta.value = undStack[undStack.length - 1];
        });
      }
      if (rBtn) {
        rBtn.addEventListener("click", function (e) {
          e.preventDefault();
          if (!redStack.length) return;
          var v = redStack.pop();
          undStack.push(v);
          ta.value = v;
        });
      }
      var fsBtn = document.getElementById("wallFsBtn");
      var wallCard = document.querySelector(".profile-wall-card");
      if (fsBtn && wallCard) {
        fsBtn.addEventListener("click", function (e) {
          e.preventDefault();
          wallCard.classList.toggle("profile-wall-card--fs");
        });
      }

      document.querySelectorAll("[data-wall-tb]").forEach(function (tb) {
        tb.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeWallEditorFlyouts();
          var k = tb.getAttribute("data-wall-tb");
          if (k === "link") {
            var u = window.prompt("Вставьте URL ссылки", "https://");
            if (u) insertAtCursor(ta, u);
          } else if (k === "spoiler") {
            wrapSelection(ta, "[spoiler]", "[/spoiler]");
          } else if (k === "gif") {
            var g = window.prompt("Ссылка на GIF или картинку (https://…)", "https://");
            if (g && /^https?:\/\//i.test(String(g).trim())) {
              insertAtCursor(ta, "[gif]" + String(g).trim() + "[/gif]");
            }
          }
        });
      });

      pubBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var text = ta.value.trim();
        var pollSnap = wallPendingPoll ? normalizeWallPoll(wallPendingPoll) : null;
        if (!text && !wallPendingImages.length && !pollSnap) {
          ta.focus();
          return;
        }
        var arr = allRaw();
        var newPost = {
          id: Date.now(),
          body: text,
          images: wallPendingImages.slice(0, 6),
          author: session.username,
          date: formatThreadDate(),
          likes: 0,
          dislikes: 0,
          voteByUser: {},
          comments: [],
          deleted: false,
          poll: null,
        };
        if (pollSnap) {
          newPost.poll = {
            question: pollSnap.question,
            description: pollSnap.description || "",
            choices: pollSnap.choices.map(function (c) {
              return { id: c.id, text: c.text };
            }),
            votes: {},
          };
        }
        arr.unshift(newPost);
        if (!saveWallPosts(profileUser.username, arr)) {
          return;
        }
        ta.value = "";
        wallPendingImages.length = 0;
        wallPendingPoll = null;
        paintWallPending();
        paintPollDraft();
        undStack = [""];
        redStack.length = 0;
        paint();
      });

      if (!listEl.dataset.wallDelegate) {
        listEl.dataset.wallDelegate = "1";
        listEl.addEventListener("click", function (ev) {
          var t = ev.target;
          if (!t || !t.closest) return;
          var btn = t.closest("button");
          if (!btn || !listEl.contains(btn)) return;

          if (btn.hasAttribute("data-wall-report-post")) {
            ev.preventDefault();
            var pid = btn.getAttribute("data-wall-report-post");
            var reason = window.prompt("Опишите причину жалобы (уведомление уйдёт модераторам)", "");
            if (reason == null || !String(reason).trim()) return;
            var snap = allRaw().find(function (x) {
              return String(x.id) === String(pid);
            });
            sendModerationReport(data, {
              title: "Жалоба: пост на стене @" + profileUser.username,
              detail:
                "Пост #" +
                pid +
                " — автор @" +
                (snap && snap.author ? snap.author : "?") +
                "\n" +
                String(reason).trim(),
              link: "profile.html?user=" + encodeURIComponent(profileUser.username) + "#wall-" + pid,
              kind: "wall_post_report",
            });
            window.alert("Жалоба отправлена модераторам.");
            return;
          }

          if (btn.hasAttribute("data-wall-comment-report")) {
            ev.preventDefault();
            var postId = btn.getAttribute("data-wall-post");
            var cid = btn.getAttribute("data-cid");
            var reason2 = window.prompt("Опишите причину жалобы на комментарий", "");
            if (reason2 == null || !String(reason2).trim()) return;
            var pst = allRaw().find(function (x) {
              return String(x.id) === String(postId);
            });
            var cm =
              pst &&
              (pst.comments || []).find(function (c) {
                return String(c.id) === String(cid);
              });
            sendModerationReport(data, {
              title: "Жалоба: комментарий на стене @" + profileUser.username,
              detail:
                "Пост #" +
                postId +
                "\nКомментарий от @" +
                (cm && cm.author ? cm.author : "?") +
                "\n" +
                String(reason2).trim(),
              link: "profile.html?user=" + encodeURIComponent(profileUser.username) + "#wall-" + postId,
              kind: "wall_comment_report",
            });
            window.alert("Жалоба отправлена модераторам.");
            return;
          }

          if (btn.hasAttribute("data-wall-poll-pick")) {
            ev.preventDefault();
            var formP = btn.closest("[data-wall-poll-form]");
            if (!formP) return;
            formP.querySelectorAll("[data-wall-poll-pick]").forEach(function (x) {
              x.classList.remove("is-selected");
              x.setAttribute("aria-pressed", "false");
            });
            btn.classList.add("is-selected");
            btn.setAttribute("aria-pressed", "true");
            var chId = btn.getAttribute("data-choice");
            if (chId != null) formP.dataset.wallPollChoice = String(chId);
            var subP = formP.querySelector("[data-wall-poll-submit]");
            if (subP) subP.disabled = false;
            return;
          }

          if (btn.hasAttribute("data-wall-poll-submit")) {
            ev.preventDefault();
            var formS = btn.closest("[data-wall-poll-form]");
            if (!formS) return;
            var postIdP = btn.getAttribute("data-post-id") || formS.getAttribute("data-post-id");
            var choiceId = formS.dataset.wallPollChoice;
            if (!choiceId) {
              window.alert("Выберите вариант ответа.");
              return;
            }
            var pstP = allRaw().find(function (x) {
              return String(x.id) === String(postIdP);
            });
            var polP = pstP && normalizeWallPoll(pstP.poll);
            if (
              !polP ||
              !polP.choices.some(function (c) {
                return c.id === choiceId;
              })
            ) {
              return;
            }
            updateWallPost(profileUser.username, postIdP, function (p) {
              if (!p.poll || typeof p.poll !== "object") return;
              if (!p.poll.votes || typeof p.poll.votes !== "object") p.poll.votes = {};
              p.poll.votes[session.username] = String(choiceId);
            });
            wallPollReopenId = null;
            paint();
            return;
          }

          if (btn.hasAttribute("data-wall-poll-reopen")) {
            ev.preventDefault();
            wallPollReopenId = btn.getAttribute("data-post-id");
            paint();
            return;
          }

          if (btn.hasAttribute("data-wall-comment-del")) {
            ev.preventDefault();
            var postIdD = btn.getAttribute("data-wall-post");
            var cidD = Number(btn.getAttribute("data-cid"));
            var pstD = allRaw().find(function (x) {
              return String(x.id) === String(postIdD);
            });
            var cmD =
              pstD &&
              (pstD.comments || []).find(function (c) {
                return Number(c.id) === cidD;
              });
            if (
              !cmD ||
              !(
                session.username === cmD.author ||
                session.username === profileUser.username ||
                canModerate(data, session)
              )
            ) {
              return;
            }
            if (!window.confirm("Удалить этот комментарий?")) return;
            updateWallPost(profileUser.username, postIdD, function (pp) {
              (pp.comments || []).forEach(function (c) {
                if (c && Number(c.id) === cidD) c.deleted = true;
              });
            });
            paint();
            return;
          }

          var vb = btn.closest("[data-wall-vote]");
          if (vb) {
            ev.preventDefault();
            var dir = vb.getAttribute("data-wall-vote");
            var postIdV = vb.getAttribute("data-post-id");
            updateWallPost(profileUser.username, postIdV, function (p) {
              if (!p.voteByUser) p.voteByUser = {};
              var prev = p.voteByUser[session.username];
              if (dir === "up") {
                if (prev === "up") {
                  p.likes = Math.max(0, (p.likes || 0) - 1);
                  delete p.voteByUser[session.username];
                } else {
                  if (prev === "down") p.dislikes = Math.max(0, (p.dislikes || 0) - 1);
                  p.likes = (p.likes || 0) + 1;
                  p.voteByUser[session.username] = "up";
                }
              } else if (dir === "down") {
                if (prev === "down") {
                  p.dislikes = Math.max(0, (p.dislikes || 0) - 1);
                  delete p.voteByUser[session.username];
                } else {
                  if (prev === "up") p.likes = Math.max(0, (p.likes || 0) - 1);
                  p.dislikes = (p.dislikes || 0) + 1;
                  p.voteByUser[session.username] = "down";
                }
              }
            });
            paint();
            return;
          }

          if (btn.hasAttribute("data-wall-comment-send")) {
            ev.preventDefault();
            var postIdS = btn.getAttribute("data-wall-comment-send");
            var taC = document.getElementById("wallc-" + postIdS);
            var txt = taC ? taC.value.trim() : "";
            if (!txt) {
              if (taC) taC.focus();
              return;
            }
            updateWallPost(profileUser.username, postIdS, function (p) {
              if (!p.comments) p.comments = [];
              p.comments.push({
                id: Date.now(),
                author: session.username,
                body: txt,
                date: formatThreadDate(),
                deleted: false,
              });
            });
            if (taC) taC.value = "";
            paint();
          }
        });
      }

      if (pollBtn) {
        pollBtn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          closeWallEditorFlyouts();
          var q = window.prompt("Вопрос голосования", "");
          if (q == null) return;
          q = String(q).trim();
          if (!q) {
            window.alert("Введите текст вопроса.");
            return;
          }
          var descPoll = window.prompt("Описание к опросу (необязательно)", "");
          if (descPoll == null) return;
          descPoll = String(descPoll).trim();
          if (descPoll.length > 240) descPoll = descPoll.slice(0, 240);
          var rawOpts = window.prompt(
            "Варианты ответа (от 2 до 6), каждый с новой строки",
            "Да\nНет"
          );
          if (rawOpts == null) return;
          var lines = String(rawOpts)
            .split(/\r?\n/)
            .map(function (s) {
              return String(s).trim();
            })
            .filter(Boolean)
            .slice(0, 6);
          if (lines.length < 2) {
            window.alert("Нужно минимум два непустых варианта.");
            return;
          }
          wallPendingPoll = {
            question: q,
            description: descPoll,
            choices: lines.map(function (text, i) {
              return { id: "c" + i, text: text };
            }),
            votes: {},
          };
          paintPollDraft();
        });
      }
    }

    paint();
  }

  function initProfile(data) {
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get("user");
    var u = null;
    if (wanted) {
      u = (data.users || []).find(function (x) {
        return x.username === wanted;
      });
    }
    if (!u) u = sessionUser(data);

    document.title = u.username + " — Night Store";

    var profBase = "profile.html?user=" + encodeURIComponent(u.username);
    var bcA = document.querySelector(".js-profile-bc-user");
    if (bcA) bcA.setAttribute("href", profBase);
    var bc = document.querySelector(".js-profile-breadcrumb-name");
    if (bc) bc.textContent = u.username;

    var h1 = document.querySelector(".js-profile-h1");
    if (h1) {
      h1.textContent = u.username;
      h1.setAttribute("href", profBase);
    }
    var tls = document.querySelector(".js-profile-threads-link");
    if (tls) tls.setAttribute("href", profBase + "#user-topics");

    var modBadge = document.getElementById("profileModBadge");
    if (modBadge) modBadge.hidden = !canModerate(data, u);

    var depTitle = document.querySelector(".js-deposit-title");
    if (depTitle) depTitle.textContent = "Страховой депозит " + u.username;

    var amount = document.querySelector(".js-deposit-amount");
    if (amount) {
      var viewer = sessionUser(data);
      amount.setAttribute("data-deposit-rub", String(u.depositRub || 0));
      amount.textContent = formatRubForViewer(
        data,
        viewer && viewer.username ? viewer.username : "",
        u.depositRub || 0,
        {}
      );
    }

    var av = document.querySelector(".js-profile-avatar-xl");
    if (av) {
      av.src = u.avatar;
      av.alt = u.username;
      attachAvatarFallback(av, u.username);
    }

    var status = document.querySelector(".js-profile-status");
    if (status) status.textContent = u.status + ", обновлено только что";

    var fields = [
      ["js-reg", u.registration],
      ["js-nid", String(u.numericId)],
      ["js-gender", u.gender],
      ["js-bday", u.birthday],
    ];
    fields.forEach(function (pair) {
      var el = document.querySelector("." + pair[0]);
      if (el) el.textContent = pair[1];
    });

    var linksUser = document.querySelector(".js-profile-links-user");
    if (linksUser) linksUser.textContent = u.username;

    var session = sessionUser(data);
    var isOwn = u.id === session.id;

    var threads = loadProfileThreads(u.username);
    var threadsRoot = document.getElementById("profileThreadsRoot");
    renderProfileThreads(threadsRoot, threads, {
      isOwn: isOwn,
      profileUsername: u.username,
    });
    wireProfileThreadComposer(u.username, isOwn);

    wireProfileWall(data, u);

    if (window.location.hash === "#create-thread" && isOwn) {
      var comp = document.getElementById("create-thread");
      if (comp) {
        setTimeout(function () {
          comp.scrollIntoView({ behavior: "smooth", block: "center" });
          var ti = document.getElementById("newThreadTitle");
          if (ti) ti.focus();
        }, 200);
      }
    }

    var wallAv = document.querySelector(".js-wall-avatar");
    if (wallAv) {
      wallAv.src = u.avatar;
      wallAv.alt = "";
      attachAvatarFallback(wallAv, u.username);
    }

    if (isOwn) {
      var editBtn = document.getElementById("profileAvatarBtn");
      var avInp = document.getElementById("profileAvatarInput");
      if (editBtn && avInp && avInp.dataset.wired !== "1") {
        avInp.dataset.wired = "1";
        editBtn.addEventListener("click", function () {
          avInp.click();
        });
        avInp.addEventListener("change", function () {
          var f = avInp.files && avInp.files[0];
          if (!f) return;
          fileToCompressedDataUrl(f, function (url) {
            if (!url) {
              window.alert("Не удалось обработать изображение.");
              return;
            }
            saveLocalUserPref(u.username, { avatar: url });
            u.avatar = url;
            applySessionUser(data);
            if (av) {
              av.src = url;
              attachAvatarFallback(av, u.username);
            }
            if (wallAv) {
              wallAv.src = url;
              attachAvatarFallback(wallAv, u.username);
            }
          });
          avInp.value = "";
        });
      }
    }

    if (!window.__nightstoreProfileFxBound) {
      window.__nightstoreProfileFxBound = true;
      window.addEventListener("nightstore-currency-changed", function () {
        var d = window.NightStoreData;
        var el = document.querySelector(".js-deposit-amount[data-deposit-rub]");
        var v = sessionUser(d);
        if (!el || !d || !v) return;
        el.textContent = formatRubForViewer(d, v.username, Number(el.getAttribute("data-deposit-rub")) || 0, {});
      });
    }
  }

  function initTopic(data) {
    var params = new URLSearchParams(window.location.search);
    var ownerName = params.get("user");
    var idRaw = params.get("id");
    var missing = document.getElementById("topicMissing");
    var content = document.getElementById("topicContent");
    if (!ownerName || idRaw == null || idRaw === "") {
      if (missing) missing.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    var ts = Number(idRaw);
    if (!isFinite(ts)) {
      if (missing) missing.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    var owner = (data.users || []).find(function (x) {
      return x.username === ownerName;
    });
    if (!owner) {
      if (missing) missing.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    var arr = loadProfileThreads(owner.username);
    var idx = arr.findIndex(function (x) {
      return x.ts === ts;
    });
    if (idx === -1) {
      if (missing) missing.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    bumpTopicViewOnce(owner.username, arr[idx]);
    normalizeThread(arr[idx]);
    saveProfileThreads(owner.username, arr);

    if (missing) missing.hidden = true;
    if (content) content.hidden = false;

    var me = sessionUser(data);
    var topicReplyImages = [];

    function currentThread() {
      var list = loadProfileThreads(owner.username);
      var t = list.find(function (x) {
        return x.ts === ts;
      });
      return t ? normalizeThread(t) : null;
    }

    function paintTopicChrome(th) {
      var ownerSettings = document.getElementById("topicSettingsOwner");
      if (ownerSettings) ownerSettings.hidden = me.id !== owner.id;
      var closedHint = document.getElementById("topicClosedHint");
      if (closedHint) closedHint.hidden = !th.closed;
      var replyBox = document.getElementById("topicReplyBox");
      if (replyBox) replyBox.hidden = !!th.closed;
      var subBtn = document.getElementById("topicSubscribeBtn");
      if (subBtn) {
        var subbed = isSubscribedToTopic(me.username, owner.username, ts);
        subBtn.classList.toggle("is-subscribed", subbed);
        subBtn.setAttribute("aria-pressed", subbed ? "true" : "false");
        var lab = document.getElementById("topicSubscribeLabel");
        if (lab) lab.textContent = subbed ? "Подписан на тему" : "Подписаться на тему";
      }
      var tcb = document.getElementById("topicToggleCloseBtn");
      if (tcb) tcb.textContent = th.closed ? "Открыть тему" : "Закрыть тему";
    }

    function paint(th) {
      if (!th) return;
      document.title = th.title + " — Night Store";
      var h1 = document.getElementById("topicPageTitle");
      if (h1) h1.textContent = th.title;
      var meta = document.getElementById("topicPageMeta");
      if (meta) {
        meta.innerHTML =
          "Тема в разделе <a href=\"index.html\" class=\"topic-meta__accent\">Темы форума</a> · создана пользователем " +
          '<a class="topic-meta__accent" href="profile.html?user=' +
          encodeURIComponent(owner.username) +
          '">' +
          escapeHtml(owner.username) +
          "</a> " +
          escapeHtml(th.date || "") +
          " · " +
          formatIntRu(th.views || 0) +
          " просмотров";
      }
      var bcUser = document.querySelector(".js-topic-bc-user");
      if (bcUser) bcUser.textContent = owner.username;
      var bcTitle = document.querySelector(".js-topic-bc-title");
      if (bcTitle) bcTitle.textContent = th.title.length > 48 ? th.title.slice(0, 45) + "…" : th.title;
      var bcProf = document.querySelector(".js-topic-bc-profile");
      if (bcProf) bcProf.setAttribute("href", "profile.html?user=" + encodeURIComponent(owner.username));

      var av = document.getElementById("topicAuthorAvatar");
      if (av) {
        av.src = owner.avatar;
        av.alt = owner.username;
        attachAvatarFallback(av, owner.username);
      }
      var authLink = document.getElementById("topicAuthorLink");
      if (authLink) {
        authLink.href = "profile.html?user=" + encodeURIComponent(owner.username);
      }
      var authName = document.getElementById("topicAuthorName");
      if (authName) authName.textContent = owner.username;
      var bodyEl = document.getElementById("topicPageBody");
      var b = String(th.body || "").trim();
      var hasIm = th.images && th.images.length;
      if (bodyEl) {
        if (b) {
          bodyEl.innerHTML = escapeHtml(b).replace(/\n/g, "<br/>");
        } else if (hasIm) {
          bodyEl.innerHTML = '<span class="topic-op__empty">Без текста — только вложения.</span>';
        } else {
          bodyEl.innerHTML = '<span class="topic-op__empty">Текст темы не указан.</span>';
        }
      }
      var imgBox = document.getElementById("topicPageImages");
      if (imgBox) {
        var gi = renderDataImagesHtml(th.images, "topic-op__img");
        if (gi) {
          imgBox.innerHTML = gi;
          imgBox.hidden = false;
        } else {
          imgBox.innerHTML = "";
          imgBox.hidden = true;
        }
      }
      var dateFoot = document.getElementById("topicPageDate");
      if (dateFoot) dateFoot.textContent = th.date || "";

      var cl = document.getElementById("topicCountLikes");
      var cd = document.getElementById("topicCountDislikes");
      if (cl) cl.textContent = formatIntRu(th.likes || 0);
      if (cd) cd.textContent = formatIntRu(th.dislikes || 0);
      var v = th.voteByUser && th.voteByUser[me.username];
      var btnL = document.getElementById("topicBtnLike");
      var btnD = document.getElementById("topicBtnDislike");
      if (btnL) {
        btnL.setAttribute("aria-pressed", v === "up" ? "true" : "false");
        btnL.classList.toggle("topic-vote-btn--active", v === "up");
      }
      if (btnD) {
        btnD.setAttribute("aria-pressed", v === "down" ? "true" : "false");
        btnD.classList.toggle("topic-vote-btn--active", v === "down");
      }

      var listRoot = document.getElementById("topicRepliesList");
      if (listRoot) {
        if (!th.replies.length) {
          listRoot.innerHTML = '<p class="threads-empty" style="margin:0">Пока нет ответов.</p>';
        } else {
          listRoot.innerHTML = th.replies
            .map(function (r) {
              var au = (data.users || []).find(function (u) {
                return u.username === r.author;
              });
              var avSrc = au ? au.avatar : dicebearAvatar(r.author);
              var authorKey = r.author && String(r.author).trim();
              var whoLine = authorKey
                ? '<a class="topic-reply-card__author" href="profile.html?user=' +
                  encodeURIComponent(authorKey) +
                  '"><strong>' +
                  escapeHtml(authorKey) +
                  "</strong></a>"
                : '<span class="topic-reply-card__author topic-reply-card__author--guest"><strong>' +
                  escapeHtml(r.author || "Гость") +
                  "</strong></span>";
              var rimgs = renderDataImagesHtml(r.images, "topic-reply-img");
              var gal = rimgs ? '<div class="topic-reply-card__gallery">' + rimgs + "</div>" : "";
              var rid = r.ts != null ? r.ts : 0;
              var canDel =
                me.username === r.author ||
                me.username === owner.username ||
                canModerate(data, me);
              var act =
                '<div class="topic-reply-card__actions">' +
                '<button type="button" class="topic-reply__btn" data-topic-reply-report data-rid="' +
                String(rid) +
                '">Пожаловаться</button>' +
                (canDel
                  ? '<button type="button" class="topic-reply__btn topic-reply__btn--danger" data-topic-reply-del data-rid="' +
                    String(rid) +
                    '">Удалить</button>'
                  : "") +
                "</div>";
              return (
                '<article class="topic-reply-card" id="reply-' +
                String(rid) +
                '">' +
                '<div class="topic-reply-card__head">' +
                '<img class="topic-reply-card__av" src="' +
                escapeHtml(avSrc) +
                '" width="40" height="40" alt="" loading="lazy" data-avatar-seed="' +
                escapeHtml(r.author || "") +
                '"/>' +
                whoLine +
                '<span class="topic-reply-card__date">' +
                escapeHtml(r.date || "") +
                "</span></div>" +
                '<div class="topic-reply-card__body">' +
                escapeHtml(r.body || "").replace(/\n/g, "<br/>") +
                "</div>" +
                gal +
                act +
                "</article>"
              );
            })
            .join("");
          listRoot.querySelectorAll(".topic-reply-card__av").forEach(function (im) {
            attachAvatarFallback(im, im.getAttribute("data-avatar-seed") || "");
          });
        }
      }

      if (isSubscribedToTopic(me.username, owner.username, ts)) {
        upsertTopicSub(me.username, owner.username, ts, th.title);
      }
      paintTopicChrome(th);
    }

    paint(currentThread());

    var topicReportBtn = document.getElementById("topicReportBtn");
    if (topicReportBtn && !topicReportBtn.dataset.wired) {
      topicReportBtn.dataset.wired = "1";
      topicReportBtn.addEventListener("click", function () {
        var th = currentThread();
        if (!th) return;
        var reason = window.prompt("Опишите проблему с темой (жалоба отправится модераторам)", "");
        if (reason == null || !String(reason).trim()) return;
        sendModerationReport(data, {
          title: "Жалоба: тема «" + String(th.title || "").slice(0, 80) + "»",
          detail: "Автор темы: @" + owner.username + "\n" + String(reason).trim(),
          link:
            "topic.html?user=" +
            encodeURIComponent(owner.username) +
            "&id=" +
            encodeURIComponent(String(ts)),
          kind: "topic_report",
        });
        window.alert("Жалоба отправлена модераторам.");
      });
    }

    var replyListRoot = document.getElementById("topicRepliesList");
    if (replyListRoot && !replyListRoot.dataset.topicReactWired) {
      replyListRoot.dataset.topicReactWired = "1";
      replyListRoot.addEventListener("click", function (ev) {
        var btn = ev.target.closest("button");
        if (!btn || !replyListRoot.contains(btn)) return;
        if (btn.hasAttribute("data-topic-reply-report")) {
          ev.preventDefault();
          var rid = Number(btn.getAttribute("data-rid"));
          var th = currentThread();
          if (!th) return;
          var rep = (th.replies || []).find(function (r) {
            return r && Number(r.ts) === rid;
          });
          var reason = window.prompt("Опишите жалобу на этот ответ", "");
          if (reason == null || !String(reason).trim()) return;
          sendModerationReport(data, {
            title: "Жалоба: ответ в теме «" + String(th.title || "").slice(0, 60) + "»",
            detail:
              "Тема @" +
              owner.username +
              " id=" +
              ts +
              "\nОтвет от @" +
              (rep && rep.author ? rep.author : "?") +
              "\n" +
              String(reason).trim(),
            link:
              "topic.html?user=" +
              encodeURIComponent(owner.username) +
              "&id=" +
              encodeURIComponent(String(ts)) +
              "#reply-" +
              rid,
            kind: "topic_reply_report",
          });
          window.alert("Жалоба отправлена модераторам.");
          return;
        }
        if (btn.hasAttribute("data-topic-reply-del")) {
          ev.preventDefault();
          var ridD = Number(btn.getAttribute("data-rid"));
          var thD = currentThread();
          if (!thD) return;
          var repD = (thD.replies || []).find(function (r) {
            return r && Number(r.ts) === ridD;
          });
          if (
            !repD ||
            !(
              me.username === repD.author ||
              me.username === owner.username ||
              canModerate(data, me)
            )
          ) {
            return;
          }
          if (!window.confirm("Удалить этот ответ?")) return;
          updateProfileThread(owner.username, ts, function (x) {
            x.replies = (x.replies || []).filter(function (r) {
              return r && Number(r.ts) !== ridD;
            });
          });
          paint(currentThread());
        }
      });
    }

    function applyVote(direction) {
      updateProfileThread(owner.username, ts, function (th) {
        var prev = th.voteByUser[me.username];
        if (direction === "up") {
          if (prev === "up") {
            th.likes = Math.max(0, th.likes - 1);
            delete th.voteByUser[me.username];
          } else {
            if (prev === "down") th.dislikes = Math.max(0, th.dislikes - 1);
            th.likes = (th.likes || 0) + 1;
            th.voteByUser[me.username] = "up";
          }
        } else {
          if (prev === "down") {
            th.dislikes = Math.max(0, th.dislikes - 1);
            delete th.voteByUser[me.username];
          } else {
            if (prev === "up") th.likes = Math.max(0, th.likes - 1);
            th.dislikes = (th.dislikes || 0) + 1;
            th.voteByUser[me.username] = "down";
          }
        }
      });
      paint(currentThread());
    }

    var btnLike = document.getElementById("topicBtnLike");
    var btnDis = document.getElementById("topicBtnDislike");
    if (btnLike && btnLike.dataset.wired !== "1") {
      btnLike.dataset.wired = "1";
      btnLike.addEventListener("click", function () {
        applyVote("up");
      });
    }
    if (btnDis && btnDis.dataset.wired !== "1") {
      btnDis.dataset.wired = "1";
      btnDis.addEventListener("click", function () {
        applyVote("down");
      });
    }

    var replyBtn = document.getElementById("topicReplySubmit");
    var replyTa = document.getElementById("topicReplyInput");
    var replyImgIn = document.getElementById("topicReplyImagesInput");
    var replyImgBtn = document.getElementById("topicReplyImagesBtn");
    var replyPrev = document.getElementById("topicReplyImagesPreview");

    function paintTopicReplyPreviews() {
      if (!replyPrev) return;
      if (!topicReplyImages.length) {
        replyPrev.innerHTML = "";
        replyPrev.hidden = true;
        return;
      }
      replyPrev.hidden = false;
      replyPrev.innerHTML = topicReplyImages
        .map(function (src, i) {
          return (
            '<span class="attach-preview__item"><img src="' +
            escapeHtml(src) +
            '" alt=""/>' +
            '<button type="button" class="attach-preview__rm" data-trix="' +
            i +
            '" aria-label="Удалить">×</button></span>'
          );
        })
        .join("");
      replyPrev.querySelectorAll("[data-trix]").forEach(function (b) {
        b.onclick = function () {
          var ix = Number(b.getAttribute("data-trix"));
          topicReplyImages.splice(ix, 1);
          paintTopicReplyPreviews();
        };
      });
    }

    if (replyImgBtn && replyImgIn && !replyImgBtn.dataset.wired) {
      replyImgBtn.dataset.wired = "1";
      replyImgBtn.addEventListener("click", function () {
        replyImgIn.click();
      });
      replyImgIn.addEventListener("change", function () {
        filesToDataUrlList(replyImgIn.files, 3 - topicReplyImages.length, function (got) {
          got.forEach(function (u) {
            if (topicReplyImages.length < 3) topicReplyImages.push(u);
          });
          replyImgIn.value = "";
          paintTopicReplyPreviews();
        });
      });
    }

    if (replyBtn && replyTa && replyBtn.dataset.wired !== "1") {
      replyBtn.dataset.wired = "1";
      replyBtn.addEventListener("click", function () {
        var cur = currentThread();
        if (!cur || cur.closed) {
          return;
        }
        var text = replyTa.value.trim();
        if (!text && !topicReplyImages.length) {
          replyTa.focus();
          return;
        }
        var titleSnap = cur.title;
        var imgs = topicReplyImages.slice(0, 3);
        updateProfileThread(owner.username, ts, function (th) {
          th.replies.push({
            author: me.username,
            body: text,
            images: imgs,
            date: formatThreadDate(),
            ts: Date.now(),
          });
        });
        replyTa.value = "";
        topicReplyImages.length = 0;
        paintTopicReplyPreviews();
        paint(currentThread());
        notifyTopicReplySubscribers(data, owner.username, ts, titleSnap, me.username);
      });
    }

    var subBtn = document.getElementById("topicSubscribeBtn");
    if (subBtn && subBtn.dataset.wired !== "1") {
      subBtn.dataset.wired = "1";
      subBtn.addEventListener("click", function () {
        var th = currentThread();
        if (!th) return;
        if (isSubscribedToTopic(me.username, owner.username, ts)) {
          removeTopicSub(me.username, owner.username, ts);
        } else {
          upsertTopicSub(me.username, owner.username, ts, th.title);
        }
        paint(currentThread());
      });
    }

    var settingsWrap = document.querySelector("[data-topic-settings]");
    var settingsBtn = document.getElementById("topicSettingsBtn");
    var toggleCloseBtn = document.getElementById("topicToggleCloseBtn");
    var deleteBtn = document.getElementById("topicDeleteBtn");
    if (settingsWrap && settingsWrap.dataset.topicSettingsInit !== "1") {
      settingsWrap.dataset.topicSettingsInit = "1";
      settingsWrap.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      if (settingsBtn) {
        settingsBtn.addEventListener("click", function (e) {
          e.stopPropagation();
          var open = !settingsWrap.classList.contains("is-open");
          settingsWrap.classList.toggle("is-open", open);
          settingsBtn.setAttribute("aria-expanded", open ? "true" : "false");
        });
      }
      if (toggleCloseBtn) {
        toggleCloseBtn.addEventListener("click", function () {
          updateProfileThread(owner.username, ts, function (th) {
            th.closed = !th.closed;
          });
          settingsWrap.classList.remove("is-open");
          if (settingsBtn) settingsBtn.setAttribute("aria-expanded", "false");
          paint(currentThread());
        });
      }
      if (deleteBtn) {
        deleteBtn.addEventListener("click", function () {
          if (!confirm("Удалить тему безвозвратно?")) return;
          deleteProfileThread(owner.username, ts);
          settingsWrap.classList.remove("is-open");
          window.location.href = "profile.html?user=" + encodeURIComponent(owner.username);
        });
      }
    }
  }

  function initModeration(data) {
    var root = document.getElementById("modPageRoot");
    if (!root) return;
    var me = sessionUser(data);
    if (!me || !canModerate(data, me)) {
      root.innerHTML =
        '<div class="sidebar-card mod-denied"><p>У вас нет доступа к панели модерации.</p><p><a href="index.html">На форум</a></p></div>';
      return;
    }

    function paint() {
      var tickets = loadModTickets();
      var ownerBlock = "";
      if (userIsOwner(data, me)) {
        ownerBlock =
          '<section class="sidebar-card mod-grant-card"><h2 class="mod-h2">Права модераторов</h2><p class="mod-hint">Пометка «модератор» сохраняется в этом браузере (localStorage). Владельца нельзя снять с прав.</p><div id="modGrantRoot" class="mod-grant-list"></div></section>';
      }
      root.innerHTML =
        '<div class="mod-page-head"><h1>Модерация</h1><p class="mod-sub">Жалобы пользователей и ответы поддержки</p></div>' +
        ownerBlock +
        '<section id="modTicketsRoot" class="mod-tickets"></section>';

      var grant = document.getElementById("modGrantRoot");
      if (grant && userIsOwner(data, me)) {
        grant.innerHTML = (data.users || [])
          .filter(function (u) {
            return u && u.username && u.username !== me.username && !u.isOwner;
          })
          .map(function (u) {
            var on = userIsModerator(data, u) ? " checked" : "";
            return (
              '<label class="mod-grant-row"><input type="checkbox" data-mod-grant="' +
              escapeHtml(u.username) +
              '"' +
              on +
              ' /> <a class="mod-grant-user" href="profile.html?user=' +
              encodeURIComponent(u.username) +
              '">@' +
              escapeHtml(u.username) +
              "</a></label>"
            );
          })
          .join("");
        grant.querySelectorAll("input[data-mod-grant]").forEach(function (inp) {
          inp.addEventListener("change", function () {
            var un = inp.getAttribute("data-mod-grant");
            if (!un) return;
            saveLocalUserPref(un, { isModerator: !!inp.checked });
            var uu = (data.users || []).find(function (x) {
              return x.username === un;
            });
            if (uu && !uu.isOwner) uu.isModerator = !!inp.checked;
          });
        });
      }

      var tr = document.getElementById("modTicketsRoot");
      if (!tr) return;
      if (!tickets.length) {
        tr.innerHTML = '<p class="mod-empty">Обращений пока нет.</p>';
        return;
      }
      tr.innerHTML = tickets
        .map(function (t) {
          var st = t.status === "resolved" ? "Решено" : "Открыто";
          var reps = (t.replies || [])
            .map(function (r) {
              return (
                '<div class="mod-reply"><strong>' +
                escapeHtml(r.author || "") +
                "</strong> · " +
                escapeHtml(formatNotifTime(r.ts || 0)) +
                '<div class="mod-reply__body">' +
                escapeHtml(r.body || "").replace(/\n/g, "<br/>") +
                "</div></div>"
              );
            })
            .join("");
          return (
            '<article class="sidebar-card mod-ticket" data-mod-ticket-id="' +
            escapeHtml(t.id) +
            '">' +
            '<div class="mod-ticket__head"><span class="mod-ticket__status">' +
            escapeHtml(st) +
            '</span><span class="mod-ticket__kind">' +
            escapeHtml(t.kind || "") +
            "</span></div>" +
            '<h3 class="mod-ticket__title">' +
            escapeHtml(t.title || "") +
            "</h3>" +
            '<div class="mod-ticket__detail">' +
            escapeHtml(t.detail || "").replace(/\n/g, "<br/>") +
            "</div>" +
            '<p class="mod-ticket__link"><a href="' +
            escapeHtml(t.link || "#") +
            '">Открыть ссылку</a></p>' +
            '<div class="mod-ticket__replies">' +
            (reps || '<p class="mod-empty">Ответов пока нет.</p>') +
            "</div>" +
            (t.status === "resolved"
              ? ""
              : '<div class="mod-ticket__actions">' +
                '<label class="sr-only" for="modta-' +
                escapeHtml(t.id) +
                '">Ответ</label>' +
                '<textarea id="modta-' +
                escapeHtml(t.id) +
                '" class="mod-ticket__ta" rows="3" maxlength="4000" placeholder="Ответ пользователю или внутренняя заметка…"></textarea>' +
                '<div class="mod-ticket__btns">' +
                '<button type="button" class="btn-primary" data-mod-reply="' +
                escapeHtml(t.id) +
                '">Отправить ответ</button>' +
                '<button type="button" class="btn-secondary" data-mod-resolve="' +
                escapeHtml(t.id) +
                '">Пометить решённым</button>' +
                "</div></div>") +
            "</article>"
          );
        })
        .join("");

      tr.querySelectorAll("[data-mod-reply]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-mod-reply");
          if (!id) return;
          var taEl = document.getElementById("modta-" + id);
          var body = taEl ? taEl.value.trim() : "";
          if (!body) {
            if (taEl) taEl.focus();
            return;
          }
          var list = loadModTickets();
          var t = list.find(function (x) {
            return x.id === id;
          });
          if (!t) return;
          if (!t.replies) t.replies = [];
          t.replies.push({
            author: me.username,
            body: body,
            ts: Date.now(),
          });
          saveModTickets(list);
          if (taEl) taEl.value = "";
          paint();
        });
      });
      tr.querySelectorAll("[data-mod-resolve]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var id = btn.getAttribute("data-mod-resolve");
          if (!id) return;
          var list = loadModTickets();
          var t = list.find(function (x) {
            return x.id === id;
          });
          if (!t) return;
          t.status = "resolved";
          saveModTickets(list);
          paint();
        });
      });
    }

    paint();
  }

  function gateSiteAccess(data, page) {
    if (page === "login" || page === "register") return true;
    if (page === "verify-email") {
      var uv = sessionUser(data);
      if (!uv || data._sessionGuest) {
        window.location.href = "login.html";
        return false;
      }
      if (uv.emailVerified) {
        window.location.href = "index.html";
        return false;
      }
      return true;
    }
    if (page === "help") return true;
    var gated = { forum: 1, market: 1, profile: 1, topic: 1, notifications: 1, moderation: 1 };
    if (!gated[page]) return true;
    var u = sessionUser(data);
    if (!u || data._sessionGuest) {
      window.location.href =
        "login.html?next=" + encodeURIComponent(location.pathname + location.search + location.hash);
      return false;
    }
    if (!u.emailVerified) {
      window.location.href = "verify-email.html";
      return false;
    }
    return true;
  }

  function setRegisteredUserVerified(userId) {
    var arr = loadRegisteredUsersRaw();
    var ok = false;
    arr.forEach(function (r) {
      if (r && r.id === userId) {
        r.emailVerified = true;
        ok = true;
      }
    });
    if (ok) saveRegisteredUsersRaw(arr);
  }

  function initLoginPage(data) {
    var formP = document.getElementById("loginFormPass");
    var formC = document.getElementById("loginFormCode");
    var tabs = document.querySelectorAll("[data-login-tab]");
    var tabPanels = document.querySelectorAll("[data-login-panel]");
    var auth = window.NSFirebaseAuth;
    if (auth) {
      tabs.forEach(function (t) {
        if ((t.getAttribute("data-login-tab") || "") === "code") {
          t.hidden = true;
        }
      });
      tabPanels.forEach(function (p) {
        if ((p.getAttribute("data-login-panel") || "") === "code") {
          p.hidden = true;
        }
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        if (t.hidden) return;
        var k = t.getAttribute("data-login-tab") || "pass";
        tabs.forEach(function (x) {
          if (x.hidden) return;
          x.classList.toggle("is-active", x === t);
        });
        tabPanels.forEach(function (p) {
          p.hidden = p.getAttribute("data-login-panel") !== k;
        });
      });
    });
    if (formP) {
      formP.addEventListener("submit", function (e) {
        e.preventDefault();
        var login = document.getElementById("loginId");
        var pass = document.getElementById("loginPassword");
        var passVal = pass ? pass.value : "";
        var loginVal = login ? login.value : "";
        var next = new URLSearchParams(location.search).get("next");
        function goAfterLogin(u) {
          writeSession(u.id);
          if (!u.emailVerified) {
            window.location.href = "verify-email.html";
            return;
          }
          if (next && next.charAt(0) === "/" && next.charAt(1) !== "/") {
            window.location.href = next;
          } else {
            window.location.href = "index.html";
          }
        }
        if (auth) {
          var emailFb = resolveEmailForFirebaseLogin(data, loginVal);
          if (!emailFb) {
            window.alert("Укажите e-mail или логин аккаунта, привязанный к почте.");
            return;
          }
          auth
            .signInWithEmailAndPassword(emailFb, passVal)
            .then(function () {
              syncFirebaseSessionIntoData(data);
              var u = sessionUser(data);
              if (!u) {
                window.alert("Не удалось восстановить профиль после входа.");
                return;
              }
              goAfterLogin(u);
            })
            .catch(function (err) {
              var u = findUserByLoginOrEmail(data, loginVal);
              if (u && checkUserPassword(u, passVal)) {
                goAfterLogin(u);
                return;
              }
              window.alert(firebaseAuthErrorRu(err));
            });
          return;
        }
        var u = findUserByLoginOrEmail(data, loginVal);
        if (!u || !checkUserPassword(u, passVal)) {
          window.alert("Неверный логин или пароль.");
          return;
        }
        goAfterLogin(u);
      });
    }
    var sendC = document.getElementById("loginSendCodeBtn");
    if (sendC) {
      sendC.addEventListener("click", function () {
        if (auth) {
          window.alert("Вход по коду из письма недоступен при использовании Firebase. Войдите по паролю.");
          return;
        }
        var em = document.getElementById("loginCodeEmail");
        var email = em ? String(em.value || "").trim().toLowerCase() : "";
        if (!email || email.indexOf("@") === -1) {
          window.alert("Введите корректный e-mail.");
          return;
        }
        var u = (data.users || []).find(function (x) {
          return String(x.email || "").toLowerCase() === email;
        });
        if (!u) {
          window.alert("Пользователь с таким e-mail не найден.");
          return;
        }
        var c = storeEmailCode(email, "login");
        window.alert("Код для входа: " + c + " (действует 15 мин.)");
      });
    }
    if (formC) {
      formC.addEventListener("submit", function (e) {
        e.preventDefault();
        if (auth) {
          window.alert("Вход по коду из письма недоступен при использовании Firebase.");
          return;
        }
        var em = document.getElementById("loginCodeEmail");
        var codeInp = document.getElementById("loginCodeVal");
        var email = em ? String(em.value || "").trim().toLowerCase() : "";
        var code = codeInp ? String(codeInp.value || "").trim() : "";
        if (!verifyEmailCode(email, code, "login")) {
          window.alert("Неверный или просроченный код.");
          return;
        }
        var u = (data.users || []).find(function (x) {
          return String(x.email || "").toLowerCase() === email;
        });
        if (!u) {
          window.alert("Пользователь не найден.");
          return;
        }
        writeSession(u.id);
        var next2 = new URLSearchParams(location.search).get("next");
        if (!u.emailVerified) {
          window.location.href = "verify-email.html";
          return;
        }
        if (next2 && next2.charAt(0) === "/" && next2.charAt(1) !== "/") {
          window.location.href = next2;
        } else {
          window.location.href = "index.html";
        }
      });
    }
  }

  function initRegisterPage(data) {
    var form = document.getElementById("registerForm");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var uN = document.getElementById("regUsername");
      var em = document.getElementById("regEmail");
      var p1 = document.getElementById("regPassword");
      var p2 = document.getElementById("regPassword2");
      var username = uN ? String(uN.value || "").trim() : "";
      var email = em ? String(em.value || "").trim().toLowerCase() : "";
      var pass = p1 ? p1.value : "";
      if (username.length < 3 || username.length > 24) {
        window.alert("Логин: от 3 до 24 символов.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        window.alert("Введите корректный e-mail.");
        return;
      }
      if (String(pass).length < 6) {
        window.alert("Пароль не короче 6 символов.");
        return;
      }
      if (pass !== (p2 ? p2.value : "")) {
        window.alert("Пароли не совпадают.");
        return;
      }
      var taken = (data.users || []).some(function (x) {
        return (
          String(x.username || "").toLowerCase() === username.toLowerCase() ||
          String(x.email || "").toLowerCase() === email
        );
      });
      if (taken) {
        window.alert("Такой логин или e-mail уже занят.");
        return;
      }
      var auth = window.NSFirebaseAuth;
      if (auth) {
        auth
          .createUserWithEmailAndPassword(email, pass)
          .then(function (cred) {
            return cred.user.updateProfile({ displayName: username }).then(function () {
              return cred.user.sendEmailVerification().catch(function () {
                return null;
              }).then(function () {
                return cred;
              });
            });
          })
          .then(function (cred) {
            var id = "fb_" + cred.user.uid;
            var arr = loadRegisteredUsersRaw();
            arr.push({
              id: id,
              username: username,
              email: email,
              firebaseUid: cred.user.uid,
              passB64: "",
              emailVerified: !!cred.user.emailVerified,
              avatar: "",
              balanceRub: 0,
              depositRub: 0,
              registration: "",
              numericId: null,
              gender: "—",
              birthday: "—",
              status: "В сети",
              likes: 0,
              messages: 0,
              trophies: 0,
              giveaways: 0,
              subscriptions: 0,
              followers: 0,
              isModerator: false,
              isOwner: false,
            });
            saveRegisteredUsersRaw(arr);
            writeSession(id);
            mergeRegisteredUsersIntoData(data);
            window.alert(
              "Аккаунт создан. На почту отправлено письмо для подтверждения (Firebase). Откройте ссылку в письме."
            );
            window.location.href = "verify-email.html";
          })
          .catch(function (err) {
            window.alert(firebaseAuthErrorRu(err));
          });
        return;
      }
      var id = "ur" + Date.now();
      var passB64 = btoa(unescape(encodeURIComponent(pass)));
      var code = storeEmailCode(email, "verify");
      var arr = loadRegisteredUsersRaw();
      arr.push({
        id: id,
        username: username,
        email: email,
        passB64: passB64,
        emailVerified: false,
        avatar: "",
        balanceRub: 0,
        depositRub: 0,
        registration: "",
        numericId: null,
        gender: "—",
        birthday: "—",
        status: "В сети",
        likes: 0,
        messages: 0,
        trophies: 0,
        giveaways: 0,
        subscriptions: 0,
        followers: 0,
        isModerator: false,
        isOwner: false,
      });
      saveRegisteredUsersRaw(arr);
      writeSession(id);
      window.alert("Аккаунт создан. Подтвердите почту. Код: " + code + " (15 мин.)");
      window.location.href = "verify-email.html";
    });
  }

  function initVerifyEmailPage(data) {
    var u = sessionUser(data);
    var emEl = document.getElementById("verifyEmailAddr");
    if (emEl && u) emEl.textContent = u.email || "—";
    var auth = window.NSFirebaseAuth;
    var fu = auth && auth.currentUser;
    var firebaseMode = !!(auth && fu && u && (u.firebaseUid || (u.id && String(u.id).indexOf("fb_") === 0)));
    var send = document.getElementById("verifyResendBtn");
    var form = document.getElementById("verifyForm");
    var inp = document.getElementById("verifyCodeInput");
    var subBtn = form ? form.querySelector(".auth-submit") : null;
    if (firebaseMode && inp && form) {
      var lbl = form.querySelector("label[for=\"verifyCodeInput\"]");
      if (lbl) lbl.hidden = true;
      inp.hidden = true;
      inp.removeAttribute("required");
      if (subBtn) subBtn.textContent = "Проверить подтверждение";
      if (send) send.textContent = "Отправить письмо ещё раз";
    }
    if (send) {
      send.addEventListener("click", function () {
        if (!u || !u.email) return;
        if (firebaseMode && auth) {
          var cur = auth.currentUser;
          if (!cur) return;
          cur
            .sendEmailVerification()
            .then(function () {
              window.alert("Письмо отправлено. Проверьте почту и папку «Спам».");
            })
            .catch(function (err) {
              window.alert(firebaseAuthErrorRu(err));
            });
          return;
        }
        var c = storeEmailCode(u.email, "verify");
        window.alert("Новый код подтверждения: " + c);
      });
    }
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!u || !u.email) return;
        if (firebaseMode && auth) {
          var cur = auth.currentUser;
          if (!cur) return;
          cur
            .reload()
            .then(function () {
              if (cur.emailVerified) {
                setRegisteredUserVerified(u.id);
                mergeRegisteredUsersIntoData(data);
                window.location.href = "index.html";
              } else {
                window.alert("Почта ещё не подтверждена. Откройте ссылку из письма или нажмите «Отправить письмо ещё раз».");
              }
            })
            .catch(function (err) {
              window.alert(firebaseAuthErrorRu(err));
            });
          return;
        }
        var code = inp ? String(inp.value || "").trim() : "";
        if (!verifyEmailCode(u.email, code, "verify")) {
          window.alert("Неверный или просроченный код. Нажмите «Выслать код ещё раз».");
          return;
        }
        setRegisteredUserVerified(u.id);
        window.location.href = "index.html";
      });
    }
  }

  function initHelp() {
    var el = document.querySelector(".js-help-intro");
    if (el) {
      el.textContent =
        "Ответы на частые вопросы по Night Store: сделки, платежи, маркет и модерация.";
    }
    var faqM = document.querySelector(".js-faq-market-text");
    if (faqM) {
      faqM.textContent =
        "На маркете доступны категории, фильтры и сохранённые поиски. Число лотов и цены подгружаются из каталога.";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var page = document.body.getAttribute("data-page") || "";
    var firebaseWait = window.NSFirebaseReady || Promise.resolve(null);

    fetch(DATA_URL)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        window.NightStoreData = data;
        mergeRegisteredUsersIntoData(data);
        normalizeAvatarsInData(data);
        mergeSessionFromStorage(data);
        return firebaseWait.then(function () {
          syncFirebaseSessionIntoData(data);
          return data;
        });
      })
      .then(function (data) {
        mergeLocalUserPrefs(data);
        ensureFxRatesMerged(data, function () {
          if (!gateSiteAccess(data, page)) return;
          applySessionUser(data);
          if (page !== "login" && page !== "register" && page !== "verify-email") {
            initNotificationCenter(data);
          }
          if (page === "login") initLoginPage(data);
          else if (page === "register") initRegisterPage(data);
          else if (page === "verify-email") initVerifyEmailPage(data);
          else if (page === "forum") initForum(data);
          else if (page === "market") initMarket(data);
          else if (page === "profile") initProfile(data);
          else if (page === "topic") initTopic(data);
          else if (page === "notifications") initNotificationsSettings();
          else if (page === "moderation") initModeration(data);
          if (page === "help") initHelp();
        });
      })
      .catch(function (err) {
        console.error(err);
        var banner = document.createElement("div");
        banner.className = "site-error-banner";
        banner.textContent =
          "Не удалось загрузить data/site.json. Откройте сайт через локальный сервер (например, python -m http.server).";
        document.body.insertBefore(banner, document.body.firstChild);
      });
  });
})();
