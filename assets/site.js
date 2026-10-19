/* ==========================================================================
   Y.S — 交互脚本
   主题 / 导航 / 动效 / 目录高亮 / 论文筛选 / 阅读进度 / 站内搜索
   ========================================================================== */
(function () {
  "use strict";

  const doc = document.documentElement;
  doc.classList.add("js");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  const focus = (el) => {
    if (el && el.isConnected) el.focus({ preventScroll: true });
  };
  const focusable = (el) => [...el.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter((item) => item.tabIndex >= 0 && !item.closest("[hidden], [inert]") && item.getClientRects().length);

  /* 统一浮层的焦点、背景隔离与滚动锁，关闭时回到触发控件。 */
  let modal = null;
  const activateModal = (el, initialFocus, close, returnFocus) => {
    const opener = returnFocus || (modal ? modal.opener : document.activeElement);
    if (modal) modal.close(false);
    const inerted = [...document.body.children]
      .filter((child) => child !== el && !child.contains(el))
      .map((child) => [child, child.inert]);
    const overflow = document.body.style.overflow;
    inerted.forEach(([child]) => { child.inert = true; });
    document.body.style.overflow = "hidden";
    modal = { el, opener, close, inerted, overflow, initialFocus };
    focus(initialFocus || focusable(el)[0] || el);
  };
  const deactivateModal = (el, restoreFocus = true) => {
    if (!modal || modal.el !== el) return;
    const previous = modal;
    modal = null;
    previous.inerted.forEach(([child, wasInert]) => { child.inert = wasInert; });
    document.body.style.overflow = previous.overflow;
    if (restoreFocus) focus(previous.opener);
  };
  document.addEventListener("keydown", (e) => {
    if (!modal) return;
    if (e.key === "Escape") {
      e.preventDefault();
      modal.close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusable(modal.el);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first) { e.preventDefault(); focus(modal.el); return; }
    if (e.shiftKey && (document.activeElement === first || !modal.el.contains(document.activeElement))) {
      e.preventDefault(); focus(last);
    } else if (!e.shiftKey && (document.activeElement === last || !modal.el.contains(document.activeElement))) {
      e.preventDefault(); focus(first);
    }
  });
  document.addEventListener("focusin", (e) => {
    if (modal && !modal.el.contains(e.target)) focus(modal.initialFocus || focusable(modal.el)[0] || modal.el);
  });

  motionQuery.addEventListener("change", (e) => {
    reduceMotion = e.matches;
    if (!reduceMotion) return;
    doc.classList.remove("theme-anim");
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll(".hero-card").forEach((el) => {
      el.classList.remove("is-tilting");
      el.style.transform = "";
    });
  });

  /* ---------- 主题 ---------- */
  const THEME_KEY = "ys-theme";
  function applyTheme(mode, animate) {
    if (animate && !reduceMotion) {
      doc.classList.add("theme-anim");
      setTimeout(() => doc.classList.remove("theme-anim"), 500);
    }
    doc.setAttribute("data-theme", mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#06070b" : "#eef2f8");
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-label", mode === "dark" ? "切换到浅色模式" : "切换到深色模式");
      btn.setAttribute("aria-pressed", String(mode === "dark"));
    });
  }
  document.querySelectorAll(".theme-toggle").forEach((btn) => {
    btn.hidden = false;
    btn.addEventListener("click", () => {
      const next = doc.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
      applyTheme(next, true);
    });
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}
    if (!saved) applyTheme(e.matches ? "dark" : "light", true);
  });
  applyTheme(doc.getAttribute("data-theme") || "light");

  /* ---------- 导航吸顶 ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 移动端抽屉 ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".drawer");
  if (navToggle && drawer) {
    navToggle.hidden = false;
    drawer.id = drawer.id || "mobile-menu";
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");
    drawer.setAttribute("aria-label", "移动端导航");
    navToggle.setAttribute("aria-controls", drawer.id);
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "icon-btn drawer-close";
    closeButton.setAttribute("aria-label", "关闭菜单");
    closeButton.textContent = "×";
    closeButton.style.cssText = "position:absolute;top:22px;right:20px;background:var(--panel-solid)";
    drawer.prepend(closeButton);
    const close = (restoreFocus = true) => {
      drawer.classList.remove("is-open");
      drawer.hidden = true;
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "打开菜单");
      deactivateModal(drawer, restoreFocus);
    };
    const open = () => {
      drawer.hidden = false;
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "关闭菜单");
      activateModal(drawer, drawer.querySelector("a") || closeButton, close, navToggle);
      requestAnimationFrame(() => { if (!drawer.hidden) drawer.classList.add("is-open"); });
    };
    navToggle.addEventListener("click", () => drawer.hidden ? open() : close());
    closeButton.addEventListener("click", () => close());
    drawer.addEventListener("click", (e) => {
      if (e.target === drawer || e.target.closest("a")) close();
    });
    window.matchMedia("(min-width: 721px)").addEventListener("change", (e) => {
      if (e.matches && !drawer.hidden) {
        close(false);
        focus(document.querySelector('.nav-links a[aria-current="page"]') || document.querySelector(".nav-links a"));
      }
    });
  }

  /* ---------- 滚动入场 ---------- */
  const revealables = [...document.querySelectorAll("[data-reveal]")];
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach((el) => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = Number(el.dataset.revealDelay || 0);
            setTimeout(() => el.classList.add("is-in"), delay);
            io.unobserve(el);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealables.forEach((el) => io.observe(el));
    }
  }

  /* ---------- 数字滚动 ---------- */
  const counters = [...document.querySelectorAll("[data-count]")];
  if (counters.length) {
    const animate = (el) => {
      const target = Number(el.dataset.count);
      if (reduceMotion || Number.isNaN(target)) return;
      const start = performance.now();
      const dur = 900;
      const tick = (now) => {
        if (reduceMotion) { el.textContent = String(target); return; }
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = String(target);
      };
      el.textContent = "0";
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          animate(e.target);
          io.unobserve(e.target);
        });
      }, { threshold: 0.6 });
      counters.forEach((c) => io.observe(c));
    }
  }

  /* ---------- 跟随光标的光斑 + 首屏卡片微倾斜 ---------- */
  if (!isTouch) {
    const spotEls = document.querySelectorAll(".card, .paper-item, .hero-card");
    spotEls.forEach((el) => {
      el.addEventListener(
        "pointermove",
        (e) => {
          if (reduceMotion) return;
          const r = el.getBoundingClientRect();
          el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
          el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        },
        { passive: true }
      );
    });

    const heroCard = document.querySelector(".hero-card");
    if (heroCard) {
      heroCard.addEventListener("pointermove", (e) => {
        if (reduceMotion) return;
        const r = heroCard.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        heroCard.classList.add("is-tilting");
        heroCard.style.transform = `perspective(900px) rotateX(${(-dy * 4).toFixed(2)}deg) rotateY(${(dx * 5).toFixed(2)}deg) translateY(-2px)`;
      });
      heroCard.addEventListener("pointerleave", () => {
        heroCard.classList.remove("is-tilting");
        heroCard.style.transform = "";
      });
    }
  }

  /* ---------- 论文卡片整卡可点 ---------- */
  document.querySelectorAll(".paper-item").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a, button, input, select, textarea") || window.getSelection()?.toString()) return;
      const link = card.querySelector(".paper-link");
      if (link) window.location.href = link.href;
    });
  });

  /* ---------- 阅读进度 ---------- */
  const progress = document.querySelector(".progress");
  if (progress) {
    const article = document.querySelector(".prose") || document.querySelector("article");
    const update = () => {
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.4;
      const passed = -rect.top + window.innerHeight * 0.25;
      const ratio = total > 0 ? Math.min(1, Math.max(0, passed / total)) : 0;
      progress.style.width = (ratio * 100).toFixed(2) + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------- 目录高亮 ---------- */
  const toc = document.querySelector(".toc");
  if (toc) {
    const links = [...toc.querySelectorAll('a[href^="#"]')];
    const targets = links
      .map((a) => document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1))))
      .filter(Boolean);
    if (targets.length && "IntersectionObserver" in window) {
      const map = new Map();
      links.forEach((a, i) => { if (targets[i]) map.set(targets[i], a); });
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((l) => l.classList.remove("is-active"));
            const link = map.get(entry.target);
            if (link) link.classList.add("is-active");
          });
        },
        { rootMargin: "-12% 0px -70% 0px", threshold: 0 }
      );
      targets.forEach((t) => io.observe(t));
    }
  }

  /* ---------- 论文筛选 ---------- */
  const filterBar = document.querySelector("[data-filter-bar]");
  if (filterBar) {
    const items = [...document.querySelectorAll("[data-topics]")];
    const chips = [...filterBar.querySelectorAll("[data-filter]")];
    const empty = document.querySelector("[data-filter-empty]");
    const apply = (value) => {
      let shown = 0;
      items.forEach((item) => {
        const topics = (item.dataset.topics || "").split(/\s+/).filter(Boolean);
        const match = value === "all" || topics.includes(value);
        item.hidden = !match;
        if (match) shown++;
      });
      chips.forEach((c) => {
        const on = c.dataset.filter === value;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      if (empty) empty.hidden = shown > 0;
      const url = new URL(window.location.href);
      if (value === "all") url.searchParams.delete("topic");
      else url.searchParams.set("topic", value);
      history.replaceState(null, "", url);
    };
    chips.forEach((chip) => chip.addEventListener("click", () => apply(chip.dataset.filter)));
    const initial = new URL(window.location.href).searchParams.get("topic");
    if (initial && chips.some((c) => c.dataset.filter === initial)) apply(initial);
  }

  /* ---------- 站内搜索 ---------- */
  const searchEl = document.getElementById("search");
  if (searchEl) {
    const input = document.getElementById("searchInput");
    const resultsEl = document.getElementById("searchResults");
    const countEl = document.getElementById("searchCount");
    let index = null;
    let indexPromise = null;
    let loadError = false;
    let results = [];
    let active = 0;
    let closeTimer = null;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-controls", resultsEl.id);
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-expanded", "false");
    resultsEl.setAttribute("role", "listbox");
    resultsEl.setAttribute("aria-label", "搜索结果");
    resultsEl.removeAttribute("aria-live");
    countEl.setAttribute("role", "status");
    countEl.setAttribute("aria-live", "polite");
    countEl.setAttribute("aria-atomic", "true");
    document.querySelectorAll("[data-search-open]").forEach((btn) => {
      btn.hidden = false;
      btn.setAttribute("aria-haspopup", "dialog");
      btn.setAttribute("aria-controls", searchEl.id);
      btn.setAttribute("aria-expanded", "false");
    });

    const esc = (s) =>
      String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const highlight = (text, terms) => {
      if (!terms.length) return esc(text);
      const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
      return String(text).split(new RegExp(`(${pattern})`, "gi"))
        .map((part, i) => i % 2 ? `<mark>${esc(part)}</mark>` : esc(part)).join("");
    };

    const load = () => {
      if (index) return Promise.resolve();
      if (indexPromise) return indexPromise;
      loadError = false;
      resultsEl.setAttribute("aria-busy", "true");
      indexPromise = fetch("/search-index.json")
        .then((res) => {
          if (!res.ok) throw new Error("search index unavailable");
          return res.json();
        })
        .then((data) => {
          if (!Array.isArray(data)) throw new Error("invalid search index");
          index = data;
        })
        .catch(() => { loadError = true; })
        .finally(() => {
          indexPromise = null;
          resultsEl.removeAttribute("aria-busy");
        });
      return indexPromise;
    };

    const search = (raw) => {
      const q = raw.trim().toLowerCase();
      if (!q) return [];
      const terms = q.split(/\s+/).filter(Boolean);
      const scored = [];
      for (const item of index || []) {
        const title = item.title.toLowerCase();
        const desc = (item.desc || "").toLowerCase();
        const text = (item.text || "").toLowerCase();
        const tags = (item.tags || []).join(" ").toLowerCase();
        let score = 0;
        let all = true;
        for (const t of terms) {
          let s = 0;
          if (title.includes(t)) s += 120 - title.indexOf(t);
          if (tags.includes(t)) s += 50;
          if (desc.includes(t)) s += 30;
          if (text.includes(t)) s += 12;
          if (!s) all = false;
          score += s;
        }
        if (all && score > 0) scored.push({ item, score });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 12).map((x) => x.item);
    };

    const render = (terms) => {
      input.removeAttribute("aria-activedescendant");
      if (loadError) {
        resultsEl.innerHTML = `<div class="search-empty">搜索索引暂时无法载入，请关闭后重试。也可从导航浏览论文与研究方向。</div>`;
        countEl.textContent = "搜索载入失败";
        return;
      }
      if (!terms.length) {
        resultsEl.innerHTML = `<div class="search-empty">输入关键词，搜索论文、研究方向与笔记。<br>试试「鲁棒」「Wasserstein」「LaTeX」。</div>`;
        countEl.textContent = "";
        return;
      }
      if (!results.length) {
        resultsEl.innerHTML = `<div class="search-empty">没有找到「${esc(terms.join(" "))}」相关的内容。</div>`;
        countEl.textContent = "0 个结果";
        return;
      }
      resultsEl.innerHTML = results
        .map(
          (r, i) => `
<a class="search-item" id="search-option-${i}" href="${esc(r.url)}" role="option" tabindex="-1" aria-selected="${i === active}" data-idx="${i}">
  <div class="si-top"><span class="si-kind">${esc(r.kind)}</span><span class="si-title">${highlight(r.title, terms)}</span></div>
  <div class="si-desc">${highlight((r.desc || r.text || "").slice(0, 180), terms)}</div>
</a>`
        )
        .join("");
      countEl.textContent = `${results.length} 个结果`;
      const selected = resultsEl.querySelector('[aria-selected="true"]');
      if (selected) input.setAttribute("aria-activedescendant", selected.id);
    };

    const update = () => {
      const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      results = search(input.value);
      active = 0;
      render(terms);
    };

    const open = async (opener) => {
      if (!searchEl.hidden && modal?.el === searchEl) return;
      clearTimeout(closeTimer);
      searchEl.hidden = false;
      searchEl.style.pointerEvents = "";
      input.value = "";
      results = [];
      active = 0;
      input.setAttribute("aria-expanded", "true");
      document.querySelectorAll("[data-search-open]").forEach((btn) => btn.setAttribute("aria-expanded", "true"));
      activateModal(searchEl, input, close, opener);
      requestAnimationFrame(() => { if (!searchEl.hidden && modal?.el === searchEl) searchEl.classList.add("is-open"); });
      render([]);
      if (!index) countEl.textContent = "正在载入搜索…";
      await load();
      if (!searchEl.hidden && modal?.el === searchEl) update();
    };

    const close = (restoreFocus = true) => {
      searchEl.classList.remove("is-open");
      searchEl.style.pointerEvents = "none";
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      document.querySelectorAll("[data-search-open]").forEach((btn) => btn.setAttribute("aria-expanded", "false"));
      deactivateModal(searchEl, restoreFocus);
      clearTimeout(closeTimer);
      if (reduceMotion) searchEl.hidden = true;
      else closeTimer = setTimeout(() => { searchEl.hidden = true; }, 220);
    };

    document.querySelectorAll("[data-search-open]").forEach((btn) =>
      btn.addEventListener("click", (e) => open(e.currentTarget))
    );
    searchEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-search-close]")) close();
    });
    input.addEventListener("input", update);

    searchEl.addEventListener("keydown", (e) => {
      if (e.isComposing || (e.target !== input && e.target !== searchEl)) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!results.length) return;
        active = (active + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length;
        resultsEl.querySelectorAll(".search-item").forEach((el, i) =>
          el.setAttribute("aria-selected", String(i === active))
        );
        const sel = resultsEl.querySelector('[aria-selected="true"]');
        if (sel) {
          input.setAttribute("aria-activedescendant", sel.id);
          sel.scrollIntoView({ block: "nearest", behavior: "instant" });
        }
      }
      if (e.key === "Enter" && results[active]) {
        e.preventDefault();
        window.location.href = results[active].url;
      }
    });

    document.addEventListener("keydown", (e) => {
      const isK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isK) {
        e.preventDefault();
        modal?.el === searchEl ? close() : open();
      }
    });
  }

  /* ---------- 插图与图注放大 ---------- */
  document.querySelectorAll(".prose img").forEach((img) => {
    if (img.closest("a, .badges") || img.classList.contains("avatar")) return;
    const figure = img.closest("figure");
    const next = img.parentElement.tagName === "P" ? img.parentElement.nextElementSibling : null;
    const caption = figure?.querySelector("figcaption") ||
      (next?.tagName === "P" && /^图\s*[\d一二三四五六七八九十]+(?:\s*[：:.]|\s+|$)/.test(next.textContent.trim()) ? next : null);
    const open = (opener = img) => {
      const overlay = document.createElement("div");
      overlay.className = "lightbox";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "图片预览");
      overlay.tabIndex = -1;
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "icon-btn lightbox-close";
      closeButton.setAttribute("aria-label", "关闭图片预览");
      closeButton.textContent = "×";
      const big = document.createElement("img");
      big.className = "lightbox-image";
      big.src = img.currentSrc || img.src;
      big.alt = img.alt || "";
      const description = caption ? caption.cloneNode(true) : document.createElement("p");
      description.querySelectorAll(".image-zoom-trigger").forEach((button) => button.remove());
      if (!caption) description.textContent = img.alt || "插图";
      description.className = "lightbox-caption";
      description.id = "lightbox-caption";
      overlay.setAttribute("aria-describedby", description.id);
      overlay.append(closeButton, big, description);
      document.body.appendChild(overlay);
      let closing = false;
      const close = (restoreFocus = true) => {
        if (closing) return;
        closing = true;
        overlay.classList.remove("is-open");
        overlay.style.pointerEvents = "none";
        deactivateModal(overlay, restoreFocus);
        if (reduceMotion) overlay.remove();
        else setTimeout(() => overlay.remove(), 220);
      };
      activateModal(overlay, closeButton, close, opener);
      requestAnimationFrame(() => { if (!closing) overlay.classList.add("is-open"); });
      closeButton.addEventListener("click", () => close());
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay || e.target === big) close();
      });
    };
    img.style.cursor = "zoom-in";
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-haspopup", "dialog");
    img.setAttribute("aria-label", `放大图片：${img.alt || "插图"}`);
    img.addEventListener("click", () => open(img));
    img.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      open(img);
    });
    if (caption) {
      const trigger = document.createElement("button");
      const number = caption.textContent.trim().match(/^图\s*[\d一二三四五六七八九十]+/);
      trigger.type = "button";
      trigger.className = "image-zoom-trigger";
      trigger.textContent = "放大";
      trigger.setAttribute("aria-label", `放大${number ? number[0].replace(/\s+/g, "") : "图片"}`);
      trigger.setAttribute("aria-haspopup", "dialog");
      caption.classList.add("image-caption");
      caption.appendChild(trigger);
      caption.addEventListener("click", (e) => {
        if (e.target.closest("a, button, input, select, textarea") && !trigger.contains(e.target)) return;
        if (window.getSelection()?.toString()) return;
        open(trigger.contains(e.target) ? trigger : img);
      });
    } else {
      const trigger = document.createElement("button");
      const number = img.alt.match(/^图\s*[\d一二三四五六七八九十]+/);
      trigger.type = "button";
      trigger.className = "image-zoom-trigger";
      trigger.textContent = "放大";
      trigger.setAttribute("aria-label", `放大${number ? number[0].replace(/\s+/g, "") : "图片"}`);
      trigger.setAttribute("aria-haspopup", "dialog");
      img.parentElement.appendChild(trigger);
      trigger.addEventListener("click", () => open(trigger));
    }
  });

  /* ---------- BibTeX 复制：保留可直接选择的原文作为回退 ---------- */
  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    }
    const activeElement = document.activeElement;
    const selection = window.getSelection();
    const ranges = selection ? [...Array(selection.rangeCount)].map((_, i) => selection.getRangeAt(i).cloneRange()) : [];
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.readOnly = true;
    helper.setAttribute("aria-hidden", "true");
    helper.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(helper);
    helper.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (_) {}
    helper.remove();
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
    focus(activeElement);
    return copied;
  };
  document.querySelectorAll("[data-copy-citation]").forEach((button) => {
    const target = document.getElementById(button.dataset.target);
    if (!target) return;
    const status = button.closest(".citation")?.querySelector(".copy-status");
    button.hidden = false;
    button.addEventListener("click", async () => {
      const wasFocused = document.activeElement === button;
      button.disabled = true;
      if (status) status.textContent = "";
      try {
        const copied = await copyText(target.textContent);
        if (status) status.textContent = copied ? "BibTeX 已复制" : "无法自动复制，请选择下方 BibTeX 手动复制。";
      } finally {
        button.disabled = false;
        if (wasFocused && (document.activeElement === document.body || document.activeElement === button)) focus(button);
      }
    });
  });

  const citationPrintStates = new Map();
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll("details.citation").forEach((details) => {
      if (!citationPrintStates.has(details)) citationPrintStates.set(details, details.open);
      details.open = true;
    });
  });
  window.addEventListener("afterprint", () => {
    citationPrintStates.forEach((wasOpen, details) => { details.open = wasOpen; });
    citationPrintStates.clear();
  });

  /* ---------- 仅超宽的公式与表格进入键盘焦点顺序 ---------- */
  const regions = new WeakMap();
  let overflowFrame = 0;
  const textWidth = (el) => {
    const block = el.closest("p, li, dd, dt, blockquote") || el.closest(".prose");
    const style = getComputedStyle(block);
    return block.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
  };
  const containInlineFormulae = () => {
    document.querySelectorAll(".prose .formula-scroll[data-inline-formula]").forEach((wrapper) => {
      const formula = wrapper.firstElementChild;
      if (formula && formula.getBoundingClientRect().width <= textWidth(wrapper) + 1) {
        if (resizeObserver) resizeObserver.unobserve(wrapper);
        wrapper.replaceWith(formula);
      }
    });
    document.querySelectorAll(".prose .katex").forEach((formula) => {
      if (formula.closest(".katex-display, .formula-scroll, table")) return;
      if (formula.getBoundingClientRect().width <= textWidth(formula) + 1) return;
      const wrapper = document.createElement("span");
      wrapper.className = "formula-scroll";
      wrapper.dataset.inlineFormula = "";
      formula.replaceWith(wrapper);
      wrapper.appendChild(formula);
    });
  };
  const observeOverflow = () => {
    cancelAnimationFrame(overflowFrame);
    overflowFrame = requestAnimationFrame(() => {
      containInlineFormulae();
      document.querySelectorAll(".prose .katex-display, .prose .formula-scroll, .prose table").forEach((el) => {
        if (!regions.has(el)) {
          regions.set(el, { tabindex: el.getAttribute("tabindex"), label: el.getAttribute("aria-label"), role: el.getAttribute("role") });
          if (resizeObserver) resizeObserver.observe(el);
        }
        const original = regions.get(el);
        const overflows = el.scrollWidth > el.clientWidth + 1;
        if (overflows) {
          el.tabIndex = 0;
          el.setAttribute("aria-label", original.label || (el.tagName === "TABLE" ? "可横向滚动的数据表" : "可横向滚动的公式"));
          if (el.tagName !== "TABLE") el.setAttribute("role", "region");
          el.dataset.scrollRegion = el.tagName === "TABLE" ? "table" : "formula";
        } else {
          [["tabindex", original.tabindex], ["aria-label", original.label], ["role", original.role]].forEach(([key, value]) => {
            if (value === null) el.removeAttribute(key);
            else el.setAttribute(key, value);
          });
          delete el.dataset.scrollRegion;
        }
      });
    });
  };
  const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(observeOverflow) : null;
  document.querySelectorAll(".prose").forEach((prose) => {
    new MutationObserver(observeOverflow).observe(prose, { childList: true, subtree: true });
    if (resizeObserver) resizeObserver.observe(prose);
  });
  window.addEventListener("resize", observeOverflow, { passive: true });
  window.addEventListener("load", observeOverflow, { once: true });
  if (document.fonts?.ready) document.fonts.ready.then(observeOverflow);
  observeOverflow();
})();
