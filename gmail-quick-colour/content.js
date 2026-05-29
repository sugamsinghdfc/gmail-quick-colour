// === CONFIG ======================================================
// Company palette: Blue, Green, Red, Orange
// Shortcuts are now handled via chrome.commands (configurable in chrome://extensions/shortcuts)
const COLOURS = [
  { name: 'Blue', value: '#0b5394', id: 'blue' },
  { name: 'Green', value: '#00b06c', id: 'green' },
  { name: 'Red', value: '#cc0000', id: 'red' },
  { name: 'Orange', value: '#e69138', id: 'orange' },
  { name: 'Grey', value: '#666666', id: 'grey' }
];
// ================================================================

// Singleton reference to our floating toolbar
let floatingToolbar = null;
let isInteractingWithToolbar = false;

console.log('[Quick‑Colour] v2.4.1 active (Floating Mode, span-based colouring)');

/**
 * Apply color to the currently selected text.
 *
 * NOTE: We deliberately do NOT use document.execCommand('foreColor').
 * execCommand re-normalizes the surrounding DOM (merging text nodes and
 * rewriting/removing nearby <font>/color markup), which silently strips
 * colors from previously-coloured text when editing on top of copied
 * emails. Instead we wrap ONLY the selected text nodes in our own
 * coloured <span>, leaving every neighbouring node untouched.
 */
function applyColor(value, btn = null) {
  const sel = window.getSelection();

  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
    if (btn) showFeedback(btn, false);
    return false;
  }

  try {
    const ok = colorSelection(sel, value);
    if (ok) {
      console.log('[Quick‑Colour] Applied color:', value);
      if (btn) showFeedback(btn, true);
      return true;
    }
    console.warn('[Quick‑Colour] Nothing colourable in selection');
    if (btn) showFeedback(btn, false);
    return false;
  } catch (err) {
    console.error('[Quick‑Colour] colorSelection error', err);
    if (btn) showFeedback(btn, false);
    return false;
  }
}

/**
 * Colour only the text nodes inside the current selection by wrapping
 * each one in its own <span style="color:…">. Touches nothing else.
 */
function colorSelection(sel, color) {
  const range = sel.getRangeAt(0);

  // 1) Split the boundary text nodes so the range covers WHOLE text nodes
  //    only (so we never colour a partial neighbour).
  if (range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0) {
    const after = range.startContainer.splitText(range.startOffset);
    range.setStart(after, 0);
  }
  if (range.endContainer.nodeType === Node.TEXT_NODE &&
      range.endOffset < range.endContainer.nodeValue.length) {
    range.endContainer.splitText(range.endOffset);
  }

  // 2) Collect every text node that falls fully inside the range.
  let rootEl = range.commonAncestorContainer;
  if (rootEl.nodeType === Node.TEXT_NODE) rootEl = rootEl.parentNode;

  const textNodes = [];
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.nodeValue.length) continue;
    // Strict containment (boundaries inclusive at the start, exclusive past
    // the end) so a neighbour merely *touching* the selection is excluded.
    const startsInRange = range.comparePoint(node, 0) >= 0;
    const endsInRange = range.comparePoint(node, node.nodeValue.length) <= 0;
    if (startsInRange && endsInRange) textNodes.push(node);
  }

  // Selection wholly inside one text node that the walker can't descend into.
  if (textNodes.length === 0 && range.startContainer.nodeType === Node.TEXT_NODE) {
    textNodes.push(range.startContainer);
  }

  if (textNodes.length === 0) return false;

  // 3) Wrap each selected text node in its own coloured <span>.
  const wrapped = [];
  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent) return;

    // If this text is already inside a span WE created, just recolour it
    // instead of nesting another span endlessly.
    if (parent.nodeName === 'SPAN' && parent.dataset.qc === '1' &&
        parent.childNodes.length === 1) {
      parent.style.color = color;
      wrapped.push(parent);
      return;
    }

    const span = document.createElement('span');
    span.style.color = color;
    span.dataset.qc = '1';
    parent.insertBefore(span, textNode);
    span.appendChild(textNode);
    wrapped.push(span);
  });

  // 4) Restore the selection across the coloured text so the user can
  //    immediately re-colour or keep typing.
  if (wrapped.length) {
    const newRange = document.createRange();
    newRange.setStartBefore(wrapped[0]);
    newRange.setEndAfter(wrapped[wrapped.length - 1]);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  return wrapped.length > 0;
}

/**
 * Show visual feedback on the button
 */
function showFeedback(btn, success) {
  btn.classList.add(success ? 'qc-success' : 'qc-error');
  setTimeout(() => {
    btn.classList.remove('qc-success', 'qc-error');
  }, 400); // matches CSS animation duration (0.4s)
}

/**
 * Create the unified floating toolbar element (singleton)
 */
function createFloatingToolbar() {
  if (floatingToolbar) return floatingToolbar;

  const bar = document.createElement('div');
  bar.className = 'qc-floating-bar';
  bar.style.display = 'none'; // Hidden by default
  bar.style.position = 'fixed';
  bar.style.zIndex = '99999';

  // Prevent toolbar clicks from clearing selection
  bar.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isInteractingWithToolbar = true;
  });

  bar.addEventListener('mouseup', () => {
    // Reset interaction flag after a short delay
    setTimeout(() => { isInteractingWithToolbar = false; }, 100);
  });

  COLOURS.forEach(({ name, value, id }) => {
    const btn = document.createElement('button');
    btn.className = 'qc-col-btn';
    btn.type = 'button';
    btn.dataset.colorId = id;
    btn.title = `Apply ${name}`;
    btn.style.setProperty('--btn-color', value);
    btn.style.background = value;

    // Apply color on click
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      applyColor(value, btn);
    });

    bar.appendChild(btn);
  });

  document.body.appendChild(bar);
  floatingToolbar = bar;
  return bar;
}

/**
 * Update toolbar visibility and position based on selection
 */
function updateToolbar() {
  const sel = window.getSelection();

  // 1. Hide if no selection or collapsed (cursor only)
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
    if (!isInteractingWithToolbar) {
      hideToolbar();
    }
    return;
  }

  // 2. Hide if selection is not inside a Gmail compose box
  // Gmail compose areas usually have specific attributes or hierarchy
  // We look for contentEditable elements
  let node = sel.anchorNode;
  const isContentEditable = node && (
    (node.nodeType === 1 && node.isContentEditable) ||
    (node.parentElement && node.parentElement.isContentEditable)
  );

  if (!isContentEditable) {
    hideToolbar();
    return;
  }

  // 3. Position the toolbar
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // If rect is empty/zero (e.g. invisible text), hide
  if (rect.width === 0 || rect.height === 0) {
    hideToolbar();
    return;
  }

  showToolbar(rect);
}

function showToolbar(rect) {
  if (!floatingToolbar) createFloatingToolbar();

  const bar = floatingToolbar;
  bar.style.display = 'flex';

  // Measure actual toolbar dimensions instead of using hardcoded values
  const barRect = bar.getBoundingClientRect();
  const barHeight = barRect.height || 36;
  const barWidth = barRect.width || 130;

  // Position BELOW the selection range
  let top = rect.bottom + 8; // 8px spacing
  let left = rect.left + (rect.width / 2) - (barWidth / 2);

  // Viewport Boundary checks
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // If hitting bottom edge, flip to ABOVE
  if (top + barHeight > viewportHeight - 10) {
    top = rect.top - barHeight - 8;
  }

  // Left/Right bounds
  if (left < 10) left = 10;
  if (left + barWidth > viewportWidth) left = viewportWidth - barWidth - 10;

  bar.style.top = `${top}px`;
  bar.style.left = `${left}px`;

  // Add visible class for animation
  requestAnimationFrame(() => {
    bar.classList.add('visible');
  });
}

function hideToolbar() {
  if (floatingToolbar) {
    floatingToolbar.classList.remove('visible');
    // Wait for the CSS fade-out transition to finish before hiding
    setTimeout(() => {
      if (!floatingToolbar.classList.contains('visible')) {
        floatingToolbar.style.display = 'none';
      }
    }, 250); // matches the 0.25s opacity transition in styles.css
  }
}

/**
 * Initialize
 */
function init() {
  try {
    createFloatingToolbar();

    // Listen for selection changes
    // 'selectionchange' event fires on document
    document.addEventListener('selectionchange', () => {
      // Debounce slightly if needed, or run immediately
      setTimeout(updateToolbar, 10);
    });

    // Also update on scroll/resize as selection rect changes
    window.addEventListener('scroll', hideToolbar, true);
    window.addEventListener('resize', hideToolbar);

    // Handle background commands
    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'apply_color') {
        const c = COLOURS.find(x => x.id === request.color);
        if (c) applyColor(c.value);
      }
    });

    console.log('[Quick‑Colour] Selection listener ready');
  } catch (e) {
    console.error('[Quick-Colour] Init Failed', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
