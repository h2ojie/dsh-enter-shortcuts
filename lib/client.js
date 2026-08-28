window.__ModuleLoader__.load({
  id: "dsh-enter-shortcuts",
  factory: () => {
    var module = { exports: {} };
    var exports = module.exports;

    const ROOT_CLASS = "dsh-enter-shortcuts-toggle";
    const STYLE_MARK = "data-dsh-enter-shortcuts";
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

    function isComposerTextarea(target) {
      return target !== null && target !== undefined
        && target.tagName === "TEXTAREA"
        && target.closest("[data-composer-card]") !== null
        && target.closest("[data-input-scroll]") !== null;
    }

    function setTextareaValue(textarea, value) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
      if (descriptor?.set !== undefined) descriptor.set.call(textarea, value);
      else textarea.value = value;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function insertNewline(textarea) {
      const value = textarea.value;
      const start = textarea.selectionStart ?? value.length;
      const end = textarea.selectionEnd ?? start;
      const next = value.slice(0, start) + String.fromCharCode(10) + value.slice(end);
      setTextareaValue(textarea, next);
      const caret = start + 1;
      textarea.setSelectionRange(caret, caret);
      window.setTimeout(() => {
        if (textarea.isConnected) textarea.setSelectionRange(caret, caret);
      }, 0);
    }

    function submitThroughNativeHandler(textarea) {
      const synthetic = new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
        cancelable: true,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      });
      Object.defineProperty(synthetic, "__dshEnterShortcutsPassThrough", { value: true });
      textarea.dispatchEvent(synthetic);
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
        ? "已开启：Enter 发送，Ctrl/Shift+Enter 换行"
        : "已关闭：Enter 换行，Ctrl/Shift+Enter 发送";
    }

    function mountCard(card) {
      if (card.querySelector(`.${ROOT_CLASS}`) !== null) return;
      const textarea = card.querySelector("[data-input-scroll] textarea[data-phase]");
      if (textarea === null) return;
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
        if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.__dshEnterShortcutsPassThrough === true) return;
        const textarea = event.target;
        if (!isComposerTextarea(textarea) || textarea.disabled || textarea.getAttribute("aria-haspopup") === "menu") return;
        const key = String(event.key).toLowerCase();
        const accelerated = event.ctrlKey || event.metaKey;
        if (accelerated && !event.altKey && key === "j") {
          event.preventDefault();
          event.stopPropagation();
          insertNewline(textarea);
          return;
        }
        if (event.key !== "Enter") return;
        // Shift+Enter keeps DSH's original behavior in every mode.
        if (event.shiftKey) return;
        const lineBreak = state.enabled
          ? (event.ctrlKey || event.metaKey || event.shiftKey)
          : (!accelerated && !event.shiftKey);
        event.preventDefault();
        event.stopPropagation();
        if (lineBreak) insertNewline(textarea);
        else submitThroughNativeHandler(textarea);
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
