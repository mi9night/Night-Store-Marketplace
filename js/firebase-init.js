(function () {
  var cfg = window.__NIGHTSTORE_FIREBASE_CONFIG__;
  if (!cfg || typeof cfg !== "object" || !String(cfg.apiKey || "").trim()) {
    window.NSFirebaseReady = Promise.resolve(null);
    return;
  }

  var ver = "11.6.0";
  var base = "https://www.gstatic.com/firebasejs/" + ver + "/";

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error("load " + src));
      };
      document.head.appendChild(s);
    });
  }

  window.NSFirebaseReady = loadScript(base + "firebase-app-compat.js")
    .then(function () {
      return loadScript(base + "firebase-auth-compat.js");
    })
    .then(function () {
      if (typeof firebase === "undefined" || !firebase.apps) {
        throw new Error("firebase global missing");
      }
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      var auth = firebase.auth();
      window.NSFirebaseAuth = auth;
      if (typeof auth.authStateReady === "function") {
        return auth.authStateReady().then(function () {
          return auth;
        });
      }
      return new Promise(function (resolve) {
        var done = false;
        var t = setTimeout(function () {
          if (!done) {
            done = true;
            resolve(auth);
          }
        }, 4000);
        auth.onAuthStateChanged(function () {
          if (!done) {
            done = true;
            clearTimeout(t);
            resolve(auth);
          }
        });
      });
    })
    .then(function (auth) {
      if (!auth || typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) {
        window.NSFirestoreDb = null;
        return auth;
      }
      return loadScript(base + "firebase-firestore-compat.js")
        .then(function () {
          try {
            if (typeof firebase !== "undefined" && firebase.firestore) {
              window.NSFirestoreDb = firebase.firestore();
            } else {
              window.NSFirestoreDb = null;
            }
          } catch (eFs) {
            console.error("[Night Store] Firestore init:", eFs);
            window.NSFirestoreDb = null;
          }
          return auth;
        })
        .catch(function (eLoad) {
          console.error("[Night Store] Firestore script:", eLoad);
          window.NSFirestoreDb = null;
          return auth;
        });
    })
    .catch(function (err) {
      console.error("[Night Store] Firebase init:", err);
      window.NSFirebaseAuth = null;
      window.NSFirestoreDb = null;
      return null;
    });
})();
