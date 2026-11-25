(function () {
  const app = document.getElementById("app");
  if (!app || !window.pannellum) return;

  app.innerHTML =
    '<div id="pano" class="orb-pano"></div>' +
    '<div id="loader" class="orb-loader" hidden><span></span></div>' +
    '<div id="empty" class="orb-empty" hidden></div>' +
    '<div id="ui" class="orb-ui"></div>' +
    '<div id="intro" class="orb-intro" hidden></div>' +
    '<div id="modal" class="orb-modal" hidden></div>' +
    '<audio id="audio" loop></audio>';

  const panoEl = document.getElementById("pano");
  const loaderEl = document.getElementById("loader");
  const emptyEl = document.getElementById("empty");
  const uiEl = document.getElementById("ui");
  const introEl = document.getElementById("intro");
  const modalEl = document.getElementById("modal");
  const audioEl = document.getElementById("audio");

  const embed = new URLSearchParams(location.search).get("embed") === "1";
  let tour = null;
  let viewer = null;
  let builtSig = "";
  let chromeSig = "";
  let pendingScene = null;
  let objects = new Map();
  let down = null;
  let dragged = false;
  let introDismissed = false;
  let cardHidden = "";
  let lastAudio = "";
  let muted = false;
  let modalKind = "";
  let booting = false;
  let buildToken = 0;
  const imageCache = new Map();
  let navOpen = false;
  let searchQuery = "";
  let floatPos = null;
  let hashReady = false;
  let pendingView = null;
  let guideAt = 0;

  function glyph(body, fill) {
    return '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" fill="' + (fill ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + body + "</svg>";
  }

  const GLYPH = {
    arrow: glyph('<path d="M3 8h10M9 4l4 4-4 4"/>'),
    info: glyph('<circle cx="8" cy="8" r="5.2"/><path d="M8 7.2V11M8 5.2h.01"/>'),
    link: glyph('<path d="M6.5 9.5l3-3M6 7.2l-.8-.8a2.4 2.4 0 0 0 0 3.4l1.6 1.6a2.4 2.4 0 0 0 3.4 0L11 10.6M10 8.8l.8.8a2.4 2.4 0 0 1 0 3.4"/>'),
    image: glyph('<rect x="2.5" y="3.5" width="11" height="9" rx="1.4"/><path d="M2.8 10.5 6 7.6l2.2 2 1.6-1.4 3.2 2.6"/>'),
    video: glyph('<rect x="2.2" y="4" width="8.2" height="8" rx="1.2"/><path d="M10.4 7.2 13.8 5.4v5.2L10.4 8.8"/>'),
    audio: glyph('<path d="M4 7h2.2L9 4.6v6.8L6.2 9H4zM11 6.4a3 3 0 0 1 0 3.2"/>'),
    pin: glyph('<path d="M8 14s4.2-3.4 4.2-6.2A4.2 4.2 0 1 0 3.8 7.8C3.8 10.6 8 14 8 14z"/><circle cx="8" cy="7.6" r="1.2"/>', true),
    star: glyph('<path d="M8 2.4 9.4 6h3.8L10.6 8.3 11.8 12 8 9.8 4.2 12l1.2-3.7L2.8 6h3.8z"/>', true),
    door: glyph('<path d="M4 3.2h6.2v9.6H4zM10.2 8h1.2M6.2 8h.1"/>'),
    camera: glyph('<path d="M2.5 5.5h2l1-1.4h5l1 1.4h2v6h-11z"/><circle cx="8" cy="8.4" r="1.8"/>'),
    play: glyph('<path d="M6 4.5v7l6-3.5z"/>', true),
    map: glyph('<path d="M2.5 4.2 6 3l4 1.4L13.5 3v8.8L10 13.2 6 11.8 2.5 13zM6 3v8.8M10 4.4v8.8"/>'),
    doc: glyph('<path d="M5 2.5h4.2L12 5.2V13.5H5zM9 2.6V5.4h2.6"/>'),
    heart: glyph('<path d="M8 13s-4.6-2.8-4.6-6A2.6 2.6 0 0 1 8 5.4 2.6 2.6 0 0 1 12.6 7C12.6 10.2 8 13 8 13z"/>'),
    compass: glyph('<circle cx="8" cy="8" r="5.2"/><path d="M9.4 6.6 7.2 7.2 6.6 9.4 8.8 8.8z"/>'),
    eye: glyph('<path d="M1.8 8S4 4.6 8 4.6 14.2 8 14.2 8 12 11.4 8 11.4 1.8 8 1.8 8z"/><circle cx="8" cy="8" r="1.4"/>'),
  };

  const ICONS = GLYPH;

  function post(message) {
    if (!embed || window.parent === window) return;
    window.parent.postMessage(Object.assign({ source: "orbita-player" }, message), location.origin);
  }

  function active() {
    if (!tour) return null;
    return tour.scenes.find((scene) => scene.id === tour.activeSceneId) || tour.scenes[0] || null;
  }

  function findHotspot(id) {
    if (!tour) return null;
    for (const scene of tour.scenes) {
      const hotspot = scene.hotspots.find((item) => item.id === id);
      if (hotspot) return { hotspot, scene };
    }
    return null;
  }

  function hexToRgb(hex) {
    const n = String(hex || "").replace("#", "");
    if (n.length < 6) return [22, 19, 17];
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }

  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function ink(hex) {
    return luminance(hex) > 0.62 ? "#1a140e" : "#fffaf3";
  }

  function applyTheme() {
    const theme = tour.theme;
    const root = document.documentElement;
    const [r, g, b] = hexToRgb(theme.panel);
    root.style.setProperty("--orb-accent", theme.accent);
    root.style.setProperty("--orb-ink", ink(theme.accent));
    root.style.setProperty("--orb-panel", `rgba(${r}, ${g}, ${b}, ${theme.opacity})`);
    root.style.setProperty("--orb-text", theme.text);
    root.style.setProperty("--orb-point", theme.point);
    root.style.setProperty("--orb-point-ink", ink(theme.point));
    root.style.setProperty("--orb-radius", theme.radius + "px");
    root.style.setProperty("--orb-blur", theme.blur + "px");
    root.style.setProperty("--orb-point-size", Math.round(22 * theme.pointScale) + "px");
    root.style.setProperty("--orb-scale", String(theme.uiScale));
    root.style.setProperty("--orb-font", `"${theme.font}", "Manrope", sans-serif`);
    root.style.setProperty("--orb-shadow", (theme.shadow != null ? theme.shadow : 22) + "px");
    root.style.setProperty("--orb-gap", (theme.gap != null ? theme.gap : 8) + "px");
    root.style.setProperty("--orb-thumb", (tour.settings.thumbSize || 96) + "px");
    const scene = active();
    const point = (scene && scene.pointColor) || theme.point;
    root.style.setProperty("--orb-point", point);
    root.style.setProperty("--orb-point-ink", ink(point));
    root.dataset.shape = theme.pointShape;
    root.dataset.nav = (tour.settings && tour.settings.nav) || "strip";
    root.dataset.carousel = carouselSide();
    root.dataset.logo = tour.settings.logoPlacement;
    root.dataset.brand = tour.settings.hideBrand ? "off" : "on";
    document.body.dataset.mode = tour.mode;
    let style = document.getElementById("orb-custom");
    if (!style) {
      style = document.createElement("style");
      style.id = "orb-custom";
      document.head.append(style);
    }
    style.textContent = String(theme.customCss || "").replace(/<\/style/gi, "").slice(0, 4000);
  }

  function carouselSide() {
    const nav = (tour.settings && tour.settings.nav) || "strip";
    const place = tour.settings.carouselPlacement || "bottom";
    if (nav === "side") return place === "right" ? "right" : "left";
    if (nav === "strip") return place;
    return "bottom";
  }

  function resolvedIcon(hotspot) {
    const icon = hotspot.icon && hotspot.icon !== "auto" ? hotspot.icon : "";
    if (icon && GLYPH[icon]) return icon;
    if (hotspot.kind === "info") return "info";
    if (hotspot.kind === "link") return "link";
    if (hotspot.kind === "image") return "image";
    if (hotspot.kind === "video") return "play";
    if (hotspot.kind === "audio") return "audio";
    return "arrow";
  }

  function resolvedMotion(hotspot) {
    if (hotspot.motion && hotspot.motion !== "theme") return hotspot.motion;
    return (tour.theme && tour.theme.hotspotMotion) || "none";
  }

  function imageSig() {
    return tour.scenes.map((scene) => scene.id + "@" + scene.image).join("|");
  }

  function structureSig() {
    return JSON.stringify({
      mode: tour.mode,
      scenes: tour.scenes.map((scene) => [scene.id, scene.image, scene.modules]),
      logo: Boolean(tour.logoUrl),
      audio: Boolean(tour.audioUrl),
      sound: tour.settings.soundEnabled,
      gyro: tour.settings.gyro,
      carousel: tour.settings.carouselPlacement,
      nav: tour.settings.nav || "strip",
      groups: tour.scenes.map((scene) => (scene.group || "") + (scene.featured ? "*" : "")),
      brand: Boolean(tour.settings.hideBrand),
      place: tour.placeKind,
      selectedCard: cardHidden,
      about: tour.scenes.some((scene) => scene.modules.about),
    });
  }

  function showEmpty(title, text) {
    emptyEl.hidden = false;
    emptyEl.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = title;
    emptyEl.append(strong, document.createTextNode(text));
  }

  function setLoader(on) {
    const scene = active();
    loaderEl.hidden = !(on && scene && scene.modules.loader);
  }

  function loadImage(url) {
    const hit = imageCache.get(url);
    if (hit) return hit;
    const promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        imageCache.delete(url);
        resolve(null);
      };
      img.src = url;
    });
    imageCache.set(url, promise);
    return promise;
  }

  function destroyViewer() {
    buildToken += 1;
    booting = false;
    if (viewer) {
      try { viewer.destroy(); } catch (error) { /* already gone */ }
      viewer = null;
    }
    panoEl.replaceChildren();
    objects = new Map();
    pendingScene = null;
    builtSig = "";
  }

  function makeHotspot(hotspot, scene) {
    return {
      id: hotspot.id,
      pitch: hotspot.pitch,
      yaw: hotspot.yaw,
      type: "info",
      cssClass: "orb-hs",
      createTooltipFunc: renderMark,
      createTooltipArgs: argsOf(hotspot, scene),
    };
  }

  function argsOf(hotspot, scene) {
    return {
      id: hotspot.id,
      kind: hotspot.kind,
      title: hotspot.title,
      icon: resolvedIcon(hotspot),
      motion: resolvedMotion(hotspot),
      showLabel: Boolean(scene.modules.labels && hotspot.title),
      selected: tour.selectedHotspotId === hotspot.id,
    };
  }

  function renderMark(div, args) {
    div.classList.add("orb-hs");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "orb-mark" + (args.selected ? " is-selected" : "") + (args.motion && args.motion !== "none" ? " is-" + args.motion : "");
    button.dataset.icon = args.icon || "";
    button.setAttribute("aria-label", args.title || "Точка");
    button.innerHTML = GLYPH[args.icon] || GLYPH.arrow;
    const label = document.createElement("span");
    label.className = "orb-label";
    label.textContent = args.title || "";
    label.hidden = !args.showLabel;
    div.replaceChildren(button, label);
    const stop = (event) => event.stopPropagation();
    button.addEventListener("mousedown", stop);
    button.addEventListener("touchstart", stop, { passive: true });
    button.addEventListener("pointerdown", (event) => {
      stop(event);
      if (tour.mode === "edit") dragHotspot(args.id, event);
    });
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      onHotspot(args.id);
    });
  }

  function updateMark(obj) {
    const args = obj.createTooltipArgs;
    if (!obj.div) return;
    const button = obj.div.querySelector(".orb-mark");
    const label = obj.div.querySelector(".orb-label");
    if (!button || !label) return;
    button.className = "orb-mark" + (args.selected ? " is-selected" : "") + (args.motion && args.motion !== "none" ? " is-" + args.motion : "");
    button.setAttribute("aria-label", args.title || "Точка");
    if (button.dataset.icon !== (args.icon || "")) {
      button.dataset.icon = args.icon || "";
      button.innerHTML = GLYPH[args.icon] || GLYPH.arrow;
    }
    label.textContent = args.title || "";
    label.hidden = !args.showLabel;
  }

  function syncHotspots() {
    if (!viewer) return;
    tour.scenes.forEach((scene) => {
      const want = scene.modules.hotspots ? scene.hotspots : [];
      const refs = objects.get(scene.id) || [];
      const same = refs.length === want.length && refs.every((ref, index) => ref.id === want[index].id);
      if (!same) {
        refs.forEach((ref) => {
          try { viewer.removeHotSpot(ref.id, scene.id); } catch (error) { /* missing */ }
        });
        const next = want.map((hotspot) => {
          const obj = makeHotspot(hotspot, scene);
          viewer.addHotSpot(obj, scene.id);
          return obj;
        });
        objects.set(scene.id, next);
        return;
      }
      want.forEach((hotspot, index) => {
        const obj = refs[index];
        obj.pitch = hotspot.pitch;
        obj.yaw = hotspot.yaw;
        obj.createTooltipArgs = argsOf(hotspot, scene);
        updateMark(obj);
      });
    });
  }

  function onViewerLoad() {
    setLoader(false);
    emptyEl.hidden = true;
    if (!viewer || !tour) return;
    panoEl.classList.toggle("is-placing", Boolean(tour.placeKind) && tour.mode === "edit");
    if (typeof viewer.resize === "function") viewer.resize();
    let current = null;
    try { current = viewer.getScene(); } catch (error) { current = null; }
    if (pendingScene && pendingScene !== current) {
      const want = pendingScene;
      pendingScene = null;
      ensureScene(want);
      return;
    }
    pendingScene = null;
    if (pendingView && viewer) {
      if (Number.isFinite(pendingView.yaw) && viewer.setYaw) viewer.setYaw(pendingView.yaw);
      if (Number.isFinite(pendingView.pitch) && viewer.setPitch) viewer.setPitch(pendingView.pitch);
      pendingView = null;
    }
    chromeSig = "";
    renderChrome(false);
    applyMotion();
  }

  function mountViewer(token, rows) {
    if (token !== buildToken || !tour) return;
    booting = false;
    const scenes = {};
    rows.forEach(({ scene, img }) => {
      if (!img) return;
      const refs = (scene.modules.hotspots ? scene.hotspots : []).map((hotspot) => makeHotspot(hotspot, scene));
      objects.set(scene.id, refs);
      scenes[scene.id] = {
        type: "equirectangular",
        panorama: img,
        yaw: scene.yaw,
        pitch: scene.pitch,
        hfov: scene.hfov,
        northOffset: tour.settings.northOffset || 0,
        hotSpots: refs,
      };
    });
    const ids = Object.keys(scenes);
    const current = active();
    if (!ids.length || !current || !scenes[current.id]) {
      builtSig = "";
      showEmpty("Панорама не открылась", "Проверьте файл или попробуйте другое фото.");
      return;
    }
    emptyEl.hidden = true;
    const first = scenes[tour.activeSceneId] ? tour.activeSceneId : ids[0];
    try {
      viewer = window.pannellum.viewer(panoEl, {
        default: {
          firstScene: first,
          sceneFadeDuration: 650,
          autoLoad: true,
          showControls: false,
          compass: false,
          backgroundColor: [0.063, 0.055, 0.047],
          minHfov: tour.settings.minHfov,
          maxHfov: tour.settings.maxHfov,
          doubleClickZoom: false,
          keyboardZoom: true,
          mouseZoom: true,
          draggable: true,
          strings: {
            loadButtonLabel: "Открыть",
            loadingLabel: "Загрузка…",
            bylineLabel: "%s",
            noPanoramaError: "Панорама не выбрана.",
            fileAccessError: "Не удалось открыть %s",
            malformedURLError: "Некорректный адрес панорамы.",
            iOS8WebGLError: "Это устройство не показывает такую панораму.",
            genericWebGLError: "Нужен WebGL, чтобы показать панораму.",
            textureSizeError: "Панорама слишком большая: %s px при лимите %s px.",
          },
        },
        scenes: scenes,
      });
    } catch (error) {
      builtSig = "";
      showEmpty("Панорама не открылась", "Проверьте файл или попробуйте другое фото.");
      return;
    }
    viewer.on("load", onViewerLoad);
    viewer.on("error", () => showEmpty("Панорама не открылась", "Проверьте файл или попробуйте другое фото."));
    viewer.on("mousedown", (event) => {
      down = { x: event.clientX, y: event.clientY };
    });
    viewer.on("mouseup", onUp);
    viewer.on("scenechange", (id) => {
      pendingScene = null;
      cardHidden = "";
      if (id && tour && id !== tour.activeSceneId) post({ type: "scene", id: id });
    });
    if (viewer.isLoaded()) onViewerLoad();
    else if (panoEl.querySelector(".pnlm-error-msg")) {
      showEmpty("Панорама не открылась", "Проверьте файл или попробуйте другое фото.");
    }
  }

  function buildViewer() {
    const sig = imageSig();
    if (booting && builtSig === sig) return;
    destroyViewer();
    const token = ++buildToken;
    booting = true;
    builtSig = sig;
    const wanted = tour.scenes.filter((scene) => scene.image);
    if (!wanted.length) {
      booting = false;
      builtSig = "";
      return;
    }
    setLoader(true);
    Promise.all(wanted.map((scene) => loadImage(scene.image).then((img) => ({ scene, img }))))
      .then((rows) => mountViewer(token, rows))
      .catch(() => {
        if (token !== buildToken) return;
        booting = false;
        builtSig = "";
        showEmpty("Панорама не открылась", "Проверьте файл или попробуйте другое фото.");
      });
  }

  function ensureScene(id) {
    if (!id) return;
    if (!viewer || booting) {
      pendingScene = id;
      return;
    }
    let loaded = false;
    let current = null;
    try {
      loaded = Boolean(viewer.isLoaded && viewer.isLoaded());
      current = loaded ? viewer.getScene() : null;
    } catch (error) {
      loaded = false;
    }
    if (!loaded) {
      pendingScene = id;
      return;
    }
    if (current === id) return;
    const scene = tour.scenes.find((item) => item.id === id);
    if (!scene) return;
    pendingScene = id;
    viewer.loadScene(id, scene.pitch, scene.yaw, scene.hfov);
    setLoader(true);
  }

  function applyMotion() {
    if (!viewer) return;
    try {
      const config = viewer.getConfig();
      config.autoRotate = tour.settings.autorotate && tour.mode === "play" ? tour.settings.autorotateSpeed : false;
      config.autoRotateInactivityDelay = 2600;
      config.sceneFadeDuration = tour.settings.transition === "none" ? 0 : tour.settings.transition === "zoom" ? 280 : 650;
      viewer.setHfovBounds([tour.settings.minHfov, tour.settings.maxHfov]);
      if (typeof viewer.setNorthOffset === "function") viewer.setNorthOffset(tour.settings.northOffset || 0);
      viewer.setUpdate(true);
      if (!tour.settings.gyro && viewer.isOrientationActive && viewer.isOrientationActive()) viewer.stopOrientation();
    } catch (error) { /* viewer still booting */ }
  }

  function onUp(event) {
    if (!down || !tour || tour.mode !== "edit" || !tour.placeKind) {
      down = null;
      return;
    }
    const dx = event.clientX - down.x;
    const dy = event.clientY - down.y;
    down = null;
    if (dx * dx + dy * dy > 36) return;
    if (event.target && event.target.closest && event.target.closest(".orb-hs, .orb-ui")) return;
    const coords = viewer && viewer.mouseEventToCoords(event);
    if (!coords) return;
    post({ type: "place", kind: tour.placeKind, pitch: coords[0], yaw: coords[1] });
  }

  function dragHotspot(id, event) {
    dragged = false;
    const origin = { x: event.clientX, y: event.clientY };
    const move = (ev) => {
      if (!viewer) return;
      if ((ev.clientX - origin.x) ** 2 + (ev.clientY - origin.y) ** 2 > 16) dragged = true;
      const coords = viewer.mouseEventToCoords(ev);
      if (!coords) return;
      const found = findHotspot(id);
      if (found) {
        found.hotspot.pitch = coords[0];
        found.hotspot.yaw = coords[1];
        syncHotspots();
      }
      post({ type: "move", id: id, pitch: coords[0], yaw: coords[1] });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onHotspot(id) {
    if (dragged) {
      dragged = false;
      return;
    }
    if (tour.mode === "edit") {
      post({ type: "select", id: id });
      return;
    }
    const found = findHotspot(id);
    if (!found) return;
    const hotspot = found.hotspot;
    if (hotspot.kind === "scene" && hotspot.targetSceneId) {
      goScene(hotspot.targetSceneId);
      return;
    }
    if (hotspot.kind === "link" && (hotspot.surface === "direct" || !hotspot.surface)) {
      const url = safeHttp(hotspot.url);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    openHotspot(hotspot);
  }

  function safeHttp(url) {
    const value = String(url || "").trim();
    if (/^https?:\/\//i.test(value) || /^blob:/i.test(value)) return value;
    return "";
  }

  function videoEmbed(url) {
    const value = safeHttp(url);
    if (!value) return "";
    let match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
    if (match) return "https://www.youtube.com/embed/" + match[1];
    match = value.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) return "https://player.vimeo.com/video/" + match[1];
    return "";
  }

  function openHotspot(hotspot) {
    const surface = hotspot.surface === "panel" || hotspot.surface === "tooltip" ? hotspot.surface : "modal";
    modalKind = "open";
    modalEl.hidden = false;
    modalEl.classList.toggle("is-panel", surface === "panel");
    modalEl.classList.toggle("is-tooltip", surface === "tooltip");
    modalEl.replaceChildren();
    const sheet = el("div", "orb-sheet orb-panel");
    sheet.append(el("h2", "", hotspot.title || "Точка"));
    if (hotspot.text) {
      const p = el("p", "");
      p.style.whiteSpace = "pre-wrap";
      p.textContent = hotspot.text;
      sheet.append(p);
    }
    if (hotspot.kind === "image") {
      const url = safeHttp(hotspot.url);
      if (url) {
        const img = document.createElement("img");
        img.alt = hotspot.title || "";
        img.src = url;
        sheet.append(img);
      }
    } else if (hotspot.kind === "video") {
      const embedSrc = videoEmbed(hotspot.url);
      const file = safeHttp(hotspot.url);
      if (embedSrc) {
        const frame = document.createElement("iframe");
        frame.src = embedSrc;
        frame.title = hotspot.title || "Видео";
        frame.allow = "autoplay; encrypted-media; picture-in-picture";
        frame.allowFullscreen = true;
        sheet.append(frame);
      } else if (file) {
        const video = document.createElement("video");
        video.src = file;
        video.controls = true;
        sheet.append(video);
      }
    } else if (hotspot.kind === "audio") {
      const url = safeHttp(hotspot.url);
      if (url) {
        const audio = document.createElement("audio");
        audio.src = url;
        audio.controls = true;
        sheet.append(audio);
      }
    } else if (hotspot.kind === "link") {
      const url = safeHttp(hotspot.url);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = "orb-cta";
        a.textContent = "Открыть ссылку";
        sheet.append(a);
      }
    }
    const close = el("button", "orb-textbtn", "Закрыть");
    close.type = "button";
    close.addEventListener("click", closeModal);
    sheet.append(close);
    modalEl.append(sheet);
  }

  function goScene(id) {
    const scene = tour.scenes.find((item) => item.id === id);
    if (!scene) return;
    tour.activeSceneId = id;
    cardHidden = "";
    guideAt = Date.now();
    flashTransition();
    if (scene.image) {
      emptyEl.hidden = true;
      if (booting && builtSig === imageSig()) pendingScene = id;
      else if (!viewer || builtSig !== imageSig()) buildViewer();
      else ensureScene(id);
    }
    post({ type: "scene", id: id });
    applyTheme();
    renderChrome(true);
    paintDynamic();
    writeHash();
  }

  function flashTransition() {
    const kind = (tour.settings && tour.settings.transition) || "fade";
    panoEl.classList.remove("is-fade", "is-zoom");
    if (kind === "none") return;
    void panoEl.offsetWidth;
    panoEl.classList.add(kind === "zoom" ? "is-zoom" : "is-fade");
  }

  function arm(kind) {
    const next = tour.placeKind === kind ? null : kind;
    tour.placeKind = next;
    panoEl.classList.toggle("is-placing", Boolean(next));
    post({ type: "place-arm", kind: next });
    paintDynamic();
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function iconButton(className, label, svg, onClick) {
    const button = el("button", className);
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.innerHTML = svg;
    button.addEventListener("click", onClick);
    return button;
  }

  const SVG = {
    full: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10h3l4-3v10l-4-3H4zM16 9a4 4 0 0 1 0 6"/></svg>',
    gyro: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 18h2"/></svg>',
    left: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 6 8 12l6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 6l6 6-6 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3 9 9l-6 .5 4.6 3.8L6.5 20 12 16.2 17.5 20l-1.1-6.7L21 9.5 15 9z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    card: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>',
    link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 13a5 5 0 0 0 7.2.4l2-2a5 5 0 0 0-7-7l-1.2 1.1"/><path d="M14 11a5 5 0 0 0-7.2-.4l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></svg>',
  };

  function sceneThumb(item, scene, className) {
    const button = el("button", className + (item.id === scene.id ? " is-active" : "") + (item.featured ? " is-featured" : ""));
    button.type = "button";
    button.dataset.scene = item.id;
    button.setAttribute("aria-label", item.name || "Сцена");
    button.setAttribute("aria-current", item.id === scene.id ? "true" : "false");
    if (item.image) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = item.image;
      button.append(img);
    }
    button.append(el("span", "", item.name || "Сцена"));
    button.addEventListener("click", () => goScene(item.id));
    return button;
  }

  function sceneRow(item, scene) {
    const button = el("button", "orb-row" + (item.id === scene.id ? " is-active" : ""));
    button.type = "button";
    button.dataset.scene = item.id;
    if (item.image) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = item.image;
      button.append(img);
    }
    const text = el("span", "orb-row-copy");
    text.append(el("b", "", item.name || "Сцена"));
    if (item.description) text.append(el("small", "", item.description));
    button.append(text);
    button.addEventListener("click", () => goScene(item.id));
    return button;
  }

  function filterList(panel) {
    const query = searchQuery.trim().toLowerCase();
    panel.querySelectorAll(".orb-row").forEach((node) => {
      const item = tour.scenes.find((scene) => scene.id === node.dataset.scene);
      const hay = item ? (item.name + " " + (item.description || "") + " " + (item.group || "")).toLowerCase() : "";
      node.hidden = Boolean(query) && hay.indexOf(query) === -1;
    });
  }

  function dragFloat(event) {
    const bar = event.currentTarget.parentElement;
    const start = { x: event.clientX, y: event.clientY, l: bar.offsetLeft, t: bar.offsetTop };
    const move = (ev) => {
      const x = Math.max(8, start.l + ev.clientX - start.x);
      const y = Math.max(8, start.t + ev.clientY - start.y);
      bar.style.left = x + "px";
      bar.style.top = y + "px";
      bar.style.bottom = "auto";
      bar.style.right = "auto";
      bar.style.transform = "none";
      floatPos = { x: x, y: y };
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    event.preventDefault();
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function renderPanelNav(scene, nav) {
    if (nav === "radial") {
      const wrap = el("div", "orb-radial" + (navOpen ? " is-open" : ""));
      if (navOpen) {
        const items = tour.scenes.slice(0, 8);
        items.forEach((item, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(items.length, 1) - Math.PI / 2;
          const button = sceneThumb(item, scene, "orb-thumb orb-radial-item");
          button.style.left = Math.round(Math.cos(angle) * 108) + "px";
          button.style.top = Math.round(Math.sin(angle) * 108) + "px";
          wrap.append(button);
        });
      }
      const fab = el("button", "orb-radial-fab", String(tour.scenes.length));
      fab.type = "button";
      fab.setAttribute("aria-label", "Сцены");
      fab.setAttribute("aria-expanded", navOpen ? "true" : "false");
      fab.addEventListener("click", () => {
        navOpen = !navOpen;
        renderChrome(true);
      });
      wrap.append(fab);
      uiEl.append(wrap);
      return;
    }
    if (nav === "grid" || nav === "sheet") {
      const launch = el("button", "orb-nav-launch orb-panel", nav === "sheet" ? (scene.name || "Сцены") : "Сцены");
      launch.type = "button";
      launch.setAttribute("aria-expanded", navOpen ? "true" : "false");
      launch.addEventListener("click", () => {
        navOpen = !navOpen;
        renderChrome(true);
      });
      uiEl.append(launch);
      if (!navOpen) return;
    }
    const panel = el("div", "orb-list orb-panel" + (nav === "grid" ? " orb-grid" : "") + (nav === "sheet" ? " is-sheet" : ""));
    panel.setAttribute("role", "navigation");
    panel.setAttribute("aria-label", "Сцены");
    if (nav === "search") {
      const input = document.createElement("input");
      input.className = "orb-search";
      input.type = "search";
      input.placeholder = "Название, группа, описание";
      input.setAttribute("aria-label", "Поиск сцен");
      input.value = searchQuery;
      input.addEventListener("input", () => {
        searchQuery = input.value;
        filterList(panel);
      });
      panel.append(input);
    }
    if (nav === "groups") {
      const buckets = new Map();
      tour.scenes.forEach((item) => {
        const key = (item.group || "").trim() || "Без группы";
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(item);
      });
      buckets.forEach((items, key) => {
        panel.append(el("p", "orb-group", key));
        items.forEach((item) => panel.append(sceneRow(item, scene)));
      });
    } else if (nav === "grid") {
      tour.scenes.forEach((item) => panel.append(sceneThumb(item, scene, "orb-thumb")));
    } else {
      tour.scenes.forEach((item) => panel.append(sceneRow(item, scene)));
    }
    uiEl.append(panel);
    if (nav === "search") filterList(panel);
  }

  function renderNav(scene, mod) {
    const nav = (tour.settings && tour.settings.nav) || "strip";
    document.documentElement.dataset.nav = nav;
    const showCarousel = Boolean(mod.carousel) && nav !== "hotspots";
    const arrowsOk = nav === "strip" || nav === "side" || nav === "float" || nav === "minimal" || nav === "hotspots";
    const showArrows = Boolean(mod.arrows) && arrowsOk;
    if (nav === "hotspots" && !showArrows) return;
    if (nav === "minimal" || nav === "hotspots") {
      const bar = el("div", "orb-carousel orb-nav-minimal");
      bar.append(iconButton("orb-arrow", "Предыдущая сцена", SVG.left, () => step(-1)));
      if (nav === "minimal") {
        const index = Math.max(0, tour.scenes.findIndex((item) => item.id === scene.id));
        bar.append(el("div", "orb-counter orb-panel", (index + 1) + " / " + tour.scenes.length));
      }
      bar.append(iconButton("orb-arrow", "Следующая сцена", SVG.right, () => step(1)));
      uiEl.append(bar);
      return;
    }
    if (nav === "grid" || nav === "radial" || nav === "groups" || nav === "search" || nav === "sheet") {
      if (showCarousel) renderPanelNav(scene, nav);
      return;
    }
    const bar = el("div", "orb-carousel" + (nav === "float" ? " orb-panel is-float" : ""));
    if (nav === "float") {
      const handle = el("button", "orb-drag", "⋮");
      handle.type = "button";
      handle.setAttribute("aria-label", "Перетащить ленту");
      handle.addEventListener("pointerdown", dragFloat);
      bar.append(handle);
    }
    if (showArrows) bar.append(iconButton("orb-arrow", "Предыдущая сцена", SVG.left, () => step(-1)));
    if (showCarousel) {
      const thumbs = el("div", "orb-thumbs");
      thumbs.setAttribute("role", "listbox");
      thumbs.setAttribute("aria-label", "Сцены");
      tour.scenes.forEach((item) => thumbs.append(sceneThumb(item, scene, "orb-thumb")));
      bar.append(thumbs);
    }
    if (showArrows) bar.append(iconButton("orb-arrow", "Следующая сцена", SVG.right, () => step(1)));
    if (nav === "float" && floatPos) {
      bar.style.left = floatPos.x + "px";
      bar.style.top = floatPos.y + "px";
      bar.style.bottom = "auto";
      bar.style.transform = "none";
    }
    uiEl.append(bar);
  }

  function renderChrome(force) {
    const sig = structureSig();
    if (!force && sig === chromeSig && uiEl.childElementCount) return;
    chromeSig = sig;
    uiEl.replaceChildren();
    const scene = active();
    if (!scene) return;
    const mod = scene.modules;

    const top = el("div", "orb-top");
    if (mod.logo) {
      const logo = el("div", "orb-logo orb-panel");
      if (tour.logoUrl) {
        const img = document.createElement("img");
        img.alt = "";
        img.src = tour.logoUrl;
        logo.append(img);
      }
      const brandText = tour.settings.hideBrand && (tour.settings.logoText || "ORBITA") === "ORBITA" && !tour.logoUrl
        ? ""
        : (tour.settings.logoText || (tour.settings.hideBrand ? "" : tour.title || "ORBITA"));
      if (tour.logoUrl || brandText) {
        if (brandText) logo.append(document.createTextNode(brandText));
        top.append(logo);
      }
    }

    if (mod.sceneTitle) uiEl.append(el("div", "orb-title orb-panel", scene.name));

    const cluster = el("div", "orb-cluster");
    if (tour.mode === "edit") {
      const pin = iconButton("orb-icon", "Поставить переход", SVG.pin, () => arm("scene"));
      pin.dataset.kind = "scene";
      cluster.append(pin);
    }
    if (tour.settings.soundEnabled && tour.audioUrl) {
      cluster.append(iconButton("orb-icon", "Звук", SVG.sound, () => {
        muted = !muted;
        if (muted) audioEl.pause();
        else audioEl.play().catch(() => {});
        paintDynamic();
      }));
    }
    if (tour.settings.gyro && viewer && viewer.isOrientationSupported && viewer.isOrientationSupported()) {
      cluster.append(iconButton("orb-icon", "Гироскоп", SVG.gyro, () => {
        if (viewer.isOrientationActive()) viewer.stopOrientation();
        else viewer.startOrientation();
      }));
    }
    if (mod.about) {
      const about = el("button", "orb-about");
      about.type = "button";
      const span = el("span", "", tour.settings.aboutTitle || "Об аудитории");
      about.append(span);
      about.addEventListener("click", () => openModal(tour.settings.aboutTitle, tour.settings.aboutBody));
      cluster.append(about);
    }
    if (mod.fullscreen) cluster.append(iconButton("orb-icon", "На весь экран", SVG.full, toggleFullscreen));
    if (cluster.childElementCount) top.append(cluster);
    if (top.childElementCount) uiEl.append(top);

    if (mod.infoCard && scene.description && cardHidden !== scene.id) {
      const card = el("div", "orb-card orb-panel");
      const close = iconButton("orb-x", "Скрыть", SVG.close, () => {
        cardHidden = scene.id;
        renderChrome(true);
      });
      const p = document.createElement("p");
      p.textContent = scene.description;
      card.append(close, p);
      uiEl.append(card);
    }

    if (mod.carousel || mod.arrows) renderNav(scene, mod);

    if (mod.minimap && tour.scenes.length) {
      const map = el("div", "orb-map orb-panel");
      const floor = el("div", "orb-map-floor");
      tour.scenes.forEach((item) => {
        const dot = el("button", "orb-dot" + (item.id === scene.id ? " is-active" : ""));
        dot.type = "button";
        dot.dataset.map = item.id;
        dot.style.left = item.mapX + "%";
        dot.style.top = item.mapY + "%";
        dot.title = item.name;
        dot.setAttribute("aria-label", item.name);
        dot.addEventListener("pointerdown", (event) => onMap(item.id, event));
        floor.append(dot);
      });
      map.append(floor);
      uiEl.append(map);
      app.classList.add("has-map");
    } else app.classList.remove("has-map");

    if (mod.compass) {
      const compass = el("div", "orb-compass");
      compass.append(el("b"));
      uiEl.append(compass);
    }

    if (tour.mode === "edit") {
      const tools = el("div", "orb-tools");
      [
        ["info", "Заметка", SVG.card],
        ["image", "Кадр", GLYPH.image],
        ["video", "Видео", GLYPH.play],
        ["audio", "Звук", GLYPH.audio],
        ["scene", "Переход", SVG.pin],
        ["link", "Ссылка", SVG.link],
      ].forEach(([kind, label, svg]) => {
        const button = iconButton("orb-tool", label, svg, () => arm(kind));
        button.dataset.kind = kind;
        tools.append(button);
      });
      uiEl.append(tools);
      if (tour.placeKind) uiEl.append(el("div", "orb-hint", "Кликните по панораме"));
    }
    paintDynamic();
  }

  function paintDynamic() {
    const scene = active();
    if (!scene) return;
    const title = uiEl.querySelector(".orb-title");
    if (title) title.textContent = scene.name;
    const card = uiEl.querySelector(".orb-card p");
    if (card) card.textContent = scene.description;
    uiEl.querySelectorAll(".orb-thumb, .orb-row").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.scene === scene.id);
      if (node.getAttribute("aria-current") != null) node.setAttribute("aria-current", node.dataset.scene === scene.id ? "true" : "false");
      const span = node.querySelector("span");
      const match = tour.scenes.find((item) => item.id === node.dataset.scene);
      if (span && match && !span.querySelector("b")) span.textContent = match.name;
    });
    const counter = uiEl.querySelector(".orb-counter");
    if (counter) {
      const index = Math.max(0, tour.scenes.findIndex((item) => item.id === scene.id));
      counter.textContent = (index + 1) + " / " + tour.scenes.length;
    }
    const launch = uiEl.querySelector(".orb-nav-launch");
    if (launch && document.documentElement.dataset.nav === "sheet") launch.textContent = scene.name || "Сцены";
    uiEl.querySelectorAll(".orb-dot").forEach((node) => {
      const match = tour.scenes.find((item) => item.id === node.dataset.map);
      node.classList.toggle("is-active", node.dataset.map === scene.id);
      if (match) {
        node.style.left = match.mapX + "%";
        node.style.top = match.mapY + "%";
      }
    });
    uiEl.querySelectorAll("[data-kind]").forEach((node) => {
      node.setAttribute("aria-pressed", node.dataset.kind === tour.placeKind ? "true" : "false");
    });
    const sound = uiEl.querySelector('.orb-icon[aria-label="Звук"]');
    if (sound) sound.setAttribute("aria-pressed", muted ? "false" : "true");
    panoEl.classList.toggle("is-placing", Boolean(tour.placeKind) && tour.mode === "edit");
    paintIntro();
  }

  function step(dir) {
    const index = tour.scenes.findIndex((scene) => scene.id === (active() && active().id));
    if (index < 0 || tour.scenes.length < 2) return;
    const next = tour.scenes[(index + dir + tour.scenes.length) % tour.scenes.length];
    goScene(next.id);
  }

  function onMap(id, event) {
    if (tour.mode !== "edit") {
      goScene(id);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const floor = event.currentTarget.parentElement;
    const move = (ev) => {
      const rect = floor.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      const scene = tour.scenes.find((item) => item.id === id);
      if (scene) {
        scene.mapX = Math.max(6, Math.min(94, x));
        scene.mapY = Math.max(8, Math.min(92, y));
        paintDynamic();
      }
      post({ type: "map", id: id, x: Math.max(6, Math.min(94, x)), y: Math.max(8, Math.min(92, y)) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function paintIntro() {
    const scene = active();
    const show = Boolean(tour && tour.mode === "play" && scene && scene.modules.intro && !introDismissed);
    introEl.hidden = !show;
    if (!show) return;
    introEl.replaceChildren();
    const sheet = el("div", "orb-sheet orb-panel");
    sheet.append(el("h2", "", tour.settings.introTitle || tour.title));
    sheet.append(el("p", "", tour.settings.introSubtitle || ""));
    const button = el("button", "orb-cta", tour.settings.introButton || "Начать");
    button.type = "button";
    button.addEventListener("click", () => {
      introDismissed = true;
      introEl.hidden = true;
      if (tour.settings.soundEnabled && tour.audioUrl) audioEl.play().catch(() => {});
    });
    sheet.append(button);
    introEl.append(sheet);
  }

  function openModal(title, body) {
    modalKind = "open";
    modalEl.hidden = false;
    modalEl.replaceChildren();
    const sheet = el("div", "orb-sheet orb-panel");
    sheet.append(el("h2", "", title || ""));
    const p = el("p", "");
    p.style.whiteSpace = "pre-wrap";
    p.textContent = body || "";
    sheet.append(p);
    const close = el("button", "orb-textbtn", "Закрыть");
    close.type = "button";
    close.addEventListener("click", closeModal);
    sheet.append(close);
    modalEl.append(sheet);
  }

  function closeModal() {
    modalKind = "";
    modalEl.hidden = true;
    modalEl.classList.remove("is-panel", "is-tooltip");
    modalEl.replaceChildren();
  }

  function toggleFullscreen() {
    const node = document.fullscreenElement ? document : app;
    if (document.fullscreenElement) document.exitFullscreen();
    else app.requestFullscreen && app.requestFullscreen();
    void node;
  }

  function syncAudio() {
    if (!tour.settings.soundEnabled || !tour.audioUrl) {
      audioEl.pause();
      return;
    }
    if (lastAudio !== tour.audioUrl) {
      lastAudio = tour.audioUrl;
      audioEl.src = tour.audioUrl;
    }
    if (tour.mode === "play" && !muted && introDismissed) audioEl.play().catch(() => {});
  }

  function tick() {
    if (viewer && viewer.isLoaded && viewer.isLoaded()) {
      const yaw = viewer.getYaw();
      const needle = uiEl.querySelector(".orb-compass b");
      if (needle) needle.style.transform = "rotate(" + -yaw + "deg)";
    }
    requestAnimationFrame(tick);
  }

  function resolveMedia(url) {
    if (!url || /^(?:[a-z]+:|\/\/)/i.test(url)) return url || "";
    const base = window.ORBITA_BASE || document.baseURI || location.href;
    try { return new URL(url, base).href; } catch (error) { return url; }
  }

  function normalizeTour(next) {
    if (!next || !window.ORBITA_STANDALONE) return next;
    const scenes = next.scenes.map((scene) => Object.assign({}, scene, { image: resolveMedia(scene.image) }));
    return Object.assign({}, next, {
      scenes: scenes,
      logoUrl: resolveMedia(next.logoUrl),
      audioUrl: resolveMedia(next.audioUrl),
    });
  }

  function apply(next) {
    next = normalizeTour(next);
    if (!next) return;
    consumeHash(next);
    tour = next;
    document.title = tour.title || "ORBITA";
    applyTheme();
    const scene = active();
    if (!scene) {
      destroyViewer();
      showEmpty("Пока пусто", embed ? "Добавьте панораму слева." : "В этом туре нет сцен.");
      uiEl.replaceChildren();
      chromeSig = "";
      return;
    }
    if (!scene.image) {
      destroyViewer();
      showEmpty(scene.name || "Сцена", "У этой сцены ещё нет фото.");
    } else {
      emptyEl.hidden = true;
      if (booting && builtSig === imageSig()) ensureScene(scene.id);
      else if (!viewer || builtSig !== imageSig()) buildViewer();
      else {
        ensureScene(scene.id);
        syncHotspots();
      }
    }
    applyMotion();
    syncAudio();
    renderChrome(false);
    paintDynamic();
  }

  function consumeHash(next) {
    if (embed || hashReady || !next || !next.settings || !next.settings.deepLink) return;
    hashReady = true;
    const query = new URLSearchParams(String(location.hash || "").replace(/^#/, ""));
    const id = query.get("s");
    if (id && next.scenes.some((scene) => scene.id === id)) next.activeSceneId = id;
    const yaw = Number(query.get("y"));
    const pitch = Number(query.get("p"));
    if (Number.isFinite(yaw) || Number.isFinite(pitch)) pendingView = { yaw: yaw, pitch: pitch };
  }

  function writeHash() {
    if (embed || !tour || tour.mode !== "play" || !tour.settings.deepLink || !viewer || !viewer.isLoaded || !viewer.isLoaded()) return;
    const scene = active();
    if (!scene) return;
    const hash = "s=" + encodeURIComponent(scene.id) + "&y=" + Math.round(viewer.getYaw()) + "&p=" + Math.round(viewer.getPitch());
    if (location.hash.replace(/^#/, "") === hash) return;
    history.replaceState(null, "", "#" + hash);
  }

  function tickGuide() {
    if (!tour || tour.mode !== "play" || !tour.settings.guide || !introDismissed || modalKind) {
      guideAt = Date.now();
      return;
    }
    const wait = Math.max(3, Number(tour.settings.guideSeconds) || 8) * 1000;
    if (!guideAt) guideAt = Date.now();
    if (Date.now() - guideAt < wait) return;
    guideAt = Date.now();
    step(1);
  }

  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== "orbita-builder") return;
    if (data.type === "tour") apply(data.tour);
    if (data.type === "remember" && viewer && viewer.isLoaded && viewer.isLoaded()) {
      post({
        type: "view-commit",
        yaw: viewer.getYaw(),
        pitch: viewer.getPitch(),
        hfov: viewer.getHfov(),
        sceneId: viewer.getScene(),
      });
    }
  });

  window.addEventListener("keydown", (event) => {
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.key === "Escape") {
      if (modalKind) closeModal();
      else if (navOpen) {
        navOpen = false;
        renderChrome(true);
      } else if (tour && tour.placeKind) arm(tour.placeKind);
      return;
    }
    if (!tour || tour.mode !== "play") return;
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  });

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => {
      if (viewer && viewer.resize) viewer.resize();
    });
    observer.observe(app);
  }
  requestAnimationFrame(tick);

  let viewTimer = 0;
  window.setInterval(() => {
    if (!embed || !viewer || !viewer.isLoaded || !viewer.isLoaded()) return;
    const now = Date.now();
    if (now - viewTimer < 240) return;
    viewTimer = now;
    post({ type: "view", yaw: viewer.getYaw(), pitch: viewer.getPitch(), hfov: viewer.getHfov() });
  }, 260);

  window.setInterval(() => {
    if (!viewer || !viewer.isLoaded || !viewer.isLoaded()) return;
    writeHash();
    tickGuide();
  }, 900);

  if (embed) post({ type: "ready" });
  else if (window.TOUR) apply(window.TOUR);
})();
