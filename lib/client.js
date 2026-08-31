window.__ModuleLoader__.load({
  id: "dsh-enter-shortcuts",
  factory: () => {
    var module = { exports: {} };
    var exports = module.exports;

    const ROOT_CLASS = "dsh-enter-shortcuts-toggle";
    const STYLE_MARK = "data-dsh-enter-shortcuts";
    const PASS_THROUGH = "__dshEnterShortcutsPassThrough";
    const STYLE = `
      .dsh-enter-shortcuts-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        padding: 0 9px;
        border: 1px solid var(--dsw-alias-border-l2, rgba(255,255,255,.14));
        border-radius: 14px;
        color: var(--dsw-alias-label-secondary, #aaa);
        background: transparent;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        line-height: 20px;
        white-space: nowrap;
      }
      .dsh-enter-shortcuts-toggle:hover,
      .dsh-enter-shortcuts-toggle:focus-visible {
        color: var(--dsw-alias-label-primary, #fff);
        border-color: var(--dsw-static-deepseek-500, #4ba3ff);
        outline: none;
      }
      .dsh-enter-shortcuts-toggle[data-enabled="true"] {
        color: var(--dsw-alias-label-primary, #fff);
        border-color: var(--dsw-static-deepseek-500, #4ba3ff);
        background: color-mix(in srgb, var(--dsw-static-deepseek-500, #4ba3ff) 16%, transparent);
      }
      .dsh-enter-shortcuts-toggle-mark {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        opacity: .45;
      }
      .dsh-enter-shortcuts-toggle[data-enabled="true"] .dsh-enter-shortcuts-toggle-mark { opacity: 1; }
    `;
    const state = { enabled: false };

    function installStyle() {
      if (document.querySelector(`style[${STYLE_MARK}]`) !== null) return;
      const style = document.createElement("style");
      style.setAttribute(STYLE_MARK, "true");
      style.textContent = STYLE;
      document.head?.appendChild(style);
    }

    function asElement(target) {
      if (target instanceof Element) return target;
      if (target instanceof Text) return target.parentElement;
      return null;
    }

    function composerInputFrom(target) {
      const el = asElement(target);
      if (el === null) return null;
      const card = el.closest("[data-composer-card]");
      if (card === null) return null;
      return card.querySelector("[data-composer-input]")
        ?? card.querySelector("[data-input-scroll] [contenteditable='true']")
        ?? card.querySelector("[data-input-scroll] textarea[data-phase]");
    }

    function isUsableComposerInput(input) {
      if (input === null) return false;
      if (input.getAttribute("aria-haspopup") === "menu") return false;
      if (input instanceof HTMLTextAreaElement) return !input.disabled;
      if (input.getAttribute("contenteditable") === "false") return false;
      if (input.getAttribute("aria-disabled") === "true") return false;
      return true;
    }

    function dispatchComposerKey(input, init) {
      const synthetic = new KeyboardEvent("keydown", {
        key: init.key,
        code: init.code ?? (init.key === "Enter" ? "Enter" : undefined),
        bubbles: true,
        cancelable: true,
        ctrlKey: init.ctrlKey === true,
        metaKey: init.metaKey === true,
        shiftKey: init.shiftKey === true,
        altKey: false,
      });
      Object.defineProperty(synthetic, PASS_THROUGH, { value: true });
      input.dispatchEvent(synthetic);
    }

    function insertNewline(input) {
      // Current DSH composer is Lexical contenteditable; Shift+Enter is the
      // native line-break gesture. Dispatching it keeps chips/IME intact.
      dispatchComposerKey(input, { key: "Enter", code: "Enter", shiftKey: true });
    }

    function submitThroughNativeHandler(input) {
      // Always dispatch a plain Enter. Native Ctrl/Cmd+Enter is DSH's
      // accelerated/steer gesture while the agent is busy; the plugin's
      // "send" mapping must stay queue/default Enter, not steer.
      dispatchComposerKey(input, { key: "Enter", code: "Enter" });
    }

    function refreshToggle(button) {
      button.dataset.enabled = String(state.enabled);
      button.setAttribute("aria-pressed", String(state.enabled));
      button.textContent = "";
      const mark = document.createElement("span");
      mark.className = "dsh-enter-shortcuts-toggle-mark";
      mark.setAttribute("aria-hidden", "true");
      button.append(mark, document.createTextNode(state.enabled ? "Enter 发送" : "Enter 换行"));
      button.title = state.enabled
        ? "已开启：Enter 发送，Ctrl/Cmd+Enter 换行"
        : "已关闭：Enter 换行，Ctrl/Cmd+Enter 发送";
    }

    function mountCard(card) {
      if (card.querySelector(`.${ROOT_CLASS}`) !== null) return;
      const input = card.querySelector("[data-composer-input]")
        ?? card.querySelector("[data-input-scroll] [contenteditable='true']")
        ?? card.querySelector("[data-input-scroll] textarea[data-phase]");
      if (input === null) return;
      const firstButton = card.querySelector("button");
      const tools = firstButton?.parentElement;
      if (tools === null || tools === undefined) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = ROOT_CLASS;
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        state.enabled = !state.enabled;
        document.querySelectorAll(`.${ROOT_CLASS}`).forEach(refreshToggle);
      });
      tools.appendChild(button);
      refreshToggle(button);
    }

    function mountAll() {
      document.querySelectorAll("[data-composer-card]").forEach(mountCard);
    }

    function apply(ctx) {
      installStyle();
      const onKeyDown = (event) => {
        if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event[PASS_THROUGH] === true) return;
        const input = composerInputFrom(event.target);
        if (!isUsableComposerInput(input)) return;
        const key = String(event.key).toLowerCase();
        const accelerated = event.ctrlKey || event.metaKey;
        if (accelerated && !event.altKey && key === "j") {
          event.preventDefault();
          event.stopPropagation();
          insertNewline(input);
          return;
        }
        if (event.key !== "Enter") return;
        // Shift+Enter keeps DSH's original line-break behavior in every mode.
        if (event.shiftKey) return;
        const lineBreak = state.enabled
          ? (event.ctrlKey || event.metaKey)
          : !accelerated;
        event.preventDefault();
        event.stopPropagation();
        if (lineBreak) insertNewline(input);
        else submitThroughNativeHandler(input);
      };

      document.addEventListener("keydown", onKeyDown, true);
      const start = () => {
        installStyle();
        mountAll();
        const observer = new MutationObserver(mountAll);
        if (document.documentElement !== null) observer.observe(document.documentElement, { childList: true, subtree: true });
        ctx.effect(() => () => observer.disconnect(), "dsh-enter-shortcuts: observer");
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
      else start();

      ctx.effect(() => () => {
        document.removeEventListener("keydown", onKeyDown, true);
        document.querySelectorAll(`.${ROOT_CLASS}`).forEach((button) => button.remove());
        document.querySelector(`style[${STYLE_MARK}]`)?.remove();
      }, "dsh-enter-shortcuts: cleanup");
    }

    exports.apply = apply;
    return module.exports;
  }
});
