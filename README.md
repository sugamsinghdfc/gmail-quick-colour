# Quick Colour Buttons for Gmail

Adds five one-click text-colour buttons to Gmail compose — **Blue, Green, Red, Orange, Grey** — plus keyboard shortcuts. Built for fast, consistent colour formatting in emails.

> **Installation guide (easiest):** 👉 **https://sugamsinghdfc.github.io/gmail-quick-colour/**

---

## ⬇️ Install (3 steps, ~1 minute)

1. **Download** the latest version:
   **[Download gmail-quick-colour.zip](https://github.com/sugamsinghdfc/gmail-quick-colour/releases/latest/download/gmail-quick-colour.zip)**
   → then **unzip** it (right-click → *Extract All*). Remember where the folder is.

2. Open Chrome and go to **`chrome://extensions`**, then turn on **Developer mode** (toggle, top-right).

3. Click **Load unpacked** and select the unzipped **`gmail-quick-colour`** folder. Done! ✅

Open Gmail, compose an email, select some text, and the colour bar appears.

> ⚠️ **Keep the folder.** Don't delete the unzipped folder — Chrome runs the extension directly from it.

---

## 🎨 How to use

- **Select text** in a Gmail compose window → a floating colour bar appears → click a colour.
- Or use **keyboard shortcuts** while text is selected:

| Colour | Shortcut |
|--------|----------|
| Blue   | `Ctrl+Shift+1` |
| Green  | `Ctrl+Shift+2` |
| Red    | `Ctrl+Shift+3` |
| Orange | `Ctrl+Shift+4` |
| Grey   | *(set it yourself — see below)* |

### Setting the Grey shortcut (one-time)
Chrome only auto-assigns **4** shortcuts per extension, so Grey needs a one-time manual key:
1. Go to **`chrome://extensions/shortcuts`**
2. Find **Quick Colour Buttons for Gmail → "Apply Grey Color"**
3. Click the box and press **`Ctrl+Shift+5`** (or any key you like).

The Grey **toolbar button** works instantly — only the keyboard shortcut needs this step.

---

## 🔄 Updating to a new version

1. Download the newest `gmail-quick-colour.zip` from the link above and unzip it (replace the old folder).
2. Go to `chrome://extensions` and click the **reload** ↻ icon on the extension.

*(Manual installs don't auto-update — that's a Chrome limitation for non-store extensions.)*

---

## 🛠️ For the maintainer (you)

**Releasing a new version:**
1. Bump `"version"` in `gmail-quick-colour/manifest.json`.
2. Build the zip: `powershell -ExecutionPolicy Bypass -File .\build-release.ps1`
3. Publish the release:
   ```
   gh release create vX.Y.Z dist/gmail-quick-colour.zip --title "vX.Y.Z" --notes "What changed"
   ```
The download links above always point to the **latest** release automatically.

---

## Colours

| Name | Hex |
|------|-----|
| Blue | `#0b5394` |
| Green | `#00b06c` |
| Red | `#cc0000` |
| Orange | `#e69138` |
| Grey | `#666666` |
