# Launchpad Leaders — Beta Site

Public beta of the Launchpad Leaders marketing site and assessment tools, hosted on GitHub Pages.

**Beta link:** https://launchpadleaders.github.io/msme-beta-site/

This is a **static** site: plain HTML, CSS and JavaScript files. There is no build step. Whatever is on the `main` branch is what the beta link serves.

---

## 1. Ground rules (read first)

This repository and the beta site are **public**. Anyone with the link can open them.

- **Never commit secrets:** no passwords, API keys, tokens, service-account files, `.env` files, or payment credentials.
- **Never commit real customer data:** use dummy or sample data only.
- The beta is marked `noindex` and `robots.txt` blocks crawlers, so it will not show up in search engines. Do not share the link publicly.
- Beta is for testing. Production is **launchpadleaders.in** and is deployed separately.

---

## 2. What works and what does not on beta

| Works | Does not work (yet) |
|---|---|
| Home, Diagnose, Develop, Deliver, About, Contact pages | Login / Register, phone and email verification (OTP) |
| Standalone assessment tools (open them by direct link) | Anything that calls a backend (OTP service, Firebase auth, payments) |
| New static tools you add (Section 5) | Server-side code of any kind (GitHub Pages serves files only) |

Because login does not work on beta, the "Explore tool" buttons on the home page, which ask the visitor to log in first, will not open a tool. **Open tools by their direct link instead**, for example:

`https://launchpadleaders.github.io/msme-beta-site/dpdp-compliance-readiness.html`

---

## 3. Getting access

To add or change files you need **write access** to this repository.

1. Ask a repository admin to add you: **Settings → Collaborators and teams → Add people**.
2. Accept the invitation email from GitHub.
3. You can now edit files in the browser (no software needed) or use Git on your computer.

Viewing the beta needs no access. Anyone can open the link.

---

## 4. How a change reaches the beta link

1. You commit a change to the `main` branch.
2. GitHub automatically runs **pages build and deployment**.
3. After about **1–2 minutes** the beta link shows the change.

To check progress: open the **Actions** tab and look at the latest **pages build and deployment** run (yellow = running, green = live, red = failed).

If you do not see your change, do a hard refresh: **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac).

> A check named "Build and publish beta" may show a red cross. Ignore it. The site is deployed by **pages build and deployment**, and that is the one that matters.

---

## 5. Add a new tool (step by step)

A "tool" here is a single, self-contained HTML page, like the existing assessment tools.

### 5.1 Prepare your tool file

- **One `.html` file** with CSS and JavaScript inside it (or small extra files kept in the same folder).
- **File name:** lowercase words with hyphens, for example `gst-readiness-check.html`.
- **Use relative links only.** Write `href="other-page.html"`, not `href="/other-page.html"`. A link that starts with `/` will break because the site lives under `/msme-beta-site/`.
- Libraries (charts, fonts) may be loaded from a public CDN with an `https://` link.
- **No secrets, no real data, no backend calls.** The tool must work as a plain static page.
- Keep each file under 25 MB (the limit for uploading in the browser).

Test it first by double-clicking the file on your computer. It should work in the browser with no server.

### 5.2 Upload it (no coding needed)

1. Open this repository on GitHub and make sure the branch shows **main**.
2. Click **Add file → Upload files**.
3. Drag your `.html` file (and any extra files) into the box.
4. In **Commit changes**, write a short message, for example `Add GST readiness tool`.
5. Choose **Commit directly to the main branch** (or **Create a new branch and start a pull request** if you want a colleague to review first, see Section 7).
6. Click **Commit changes**.
7. Wait 1–2 minutes, then open:
   `https://launchpadleaders.github.io/msme-beta-site/<your-file-name>.html`

### 5.3 Using Git instead (for developers)

```bash
git clone https://github.com/Launchpadleaders/msme-beta-site.git
cd msme-beta-site
git checkout -b add-gst-tool        # work on a branch
cp ~/Downloads/gst-readiness-check.html .
git add gst-readiness-check.html
git commit -m "Add GST readiness tool"
git push -u origin add-gst-tool
```

Then open a pull request into `main` on GitHub and merge it. The beta updates after the merge.

---

## 6. Show the tool on the home page (optional)

A tool works as soon as its file is uploaded, and you can share its direct link. To also list it on the home page, add a tool card to `index.html`:

1. Open `index.html` in GitHub and click the pencil icon (**Edit this file**).
2. Press **Ctrl+F** (Cmd+F on Mac) in the editor and search for `dpdp-compliance-readiness.html`. This finds an existing tool card.
3. Copy the whole card around it (the block that contains the title, price line and the **Explore tool** button) and paste it right after that card.
4. In your copy, change the title, description and the file name `dpdp-compliance-readiness.html` to your file name. The button looks like this:

```html
<a class="btn-sm-primary" href="your-tool.html"
   onclick="return requireAuthThenGo('your-tool.html');">Explore tool →</a>
```

5. Commit the change.

> **Beta note:** `requireAuthThenGo(...)` asks the visitor to log in first, and login does not work on beta, so the button will not open the tool. For beta, either remove the `onclick="..."` part so the plain `href` works, or share the direct link. Put the `onclick` back when the change moves to production.

`index.html` is a large file. Make small, careful edits, and use **History** (Section 8) if something breaks.

---

## 7. Review before publishing (recommended for bigger changes)

1. Choose **Create a new branch for this commit and start a pull request** when you commit.
2. A colleague opens the **Pull requests** tab, reviews the **Files changed**, and clicks **Merge pull request**.
3. The beta updates after the merge.

Small fixes can go straight to `main`. Anything that changes `index.html` or several files should get a second pair of eyes.

---

## 8. Undo a mistake

1. Open the file, click **History**, and find the last good version.
2. Open that commit and click the **⋯** menu → **Revert**, or copy the old content back into the file and commit.
3. Wait 1–2 minutes for the beta to update.

---

## 9. What is in this repository

| File | What it is |
|---|---|
| `index.html` | The home page and all main pages (Home, Diagnose, Develop, Deliver, About, Contact) |
| `launchpad.css` | Styles for the site |
| `script0.js`, `script2.js`, `script3.js`, `script4.js` | Site behaviour: navigation, forms, language switch |
| `LLBizAssess-engine_v2.1.html` | Business assessment tool |
| `dpdp-compliance-readiness.html` | DPDP compliance readiness tool |
| `favicon.svg` | Site icon |
| `robots.txt` | Tells search engines not to index the beta |

---

## 10. Bring changes over from the main (private) project

The site files here are copies of the website in the private `MSME-Platform` repository (folder `website_1.0v_Containerized`). This beta does not update itself from that repository. To refresh a file:

| Beta file | Copy from (private repo) |
|---|---|
| `launchpad.css` | `src/launchpad/launchpad.css` |
| `script0.js`, `script2.js`, `script3.js`, `script4.js` | `src/launchpad/script0.js` and so on |
| `LLBizAssess-engine_v2.1.html`, `dpdp-compliance-readiness.html`, `favicon.svg` | `public/` folder |
| Page content in `index.html` | `src/launchpad/markup.html` |

For these files, open the file here, click the pencil icon, replace the content with the new version, and commit.

For `index.html`, the content of `markup.html` sits between `<body>` and the first line `<script src="script0.js"></script>`. Replace only that part. Leave the `<head>` section and the four script lines at the bottom as they are.

Before copying anything, check that it contains no secrets (Section 1), and remember that this repo is public.

---

## 11. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| My change is not showing | Wait 2 minutes, check **Actions → pages build and deployment**, then hard refresh (Ctrl/Cmd+Shift+R). |
| Page shows 404 | The file name in the link does not match the uploaded file. Names are case-sensitive. |
| Styles or images are missing | A link starts with `/`. Change it to a relative link (for example `style.css`). |
| "Explore tool" does nothing | Expected on beta: it needs login, which is not available here (Section 6). Open the tool by direct link. |
| Pages build shows a red cross | Open the run in **Actions** and read the error. The most common cause is a file that is too large or has a name with special characters. |
| Upload says the file is too large | Browser upload limit is 25 MB per file. Use Git (Section 5.3), or shrink the file. |
| I committed a secret by mistake | Tell the repo admin **immediately**. The secret must be revoked and replaced. Deleting the file is not enough, because it stays in the history. |

---

## 12. Quick reference

- **Beta link:** https://launchpadleaders.github.io/msme-beta-site/
- **Add a tool:** upload the `.html` file to `main` → open `…/msme-beta-site/<file>.html` after 1–2 minutes
- **Check deploy:** repository **Actions** tab → **pages build and deployment**
- **Undo:** file **History** → revert
- **Production:** https://launchpadleaders.in (separate from this beta)
