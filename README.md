# La Bonne Bouffe

A French food vocabulary study site based on your 21-slide classroom PDF. **130 unique terms, three study methods, an English interface.**

## Open and study

Double-click **La-Bonne-Bouffe-Standalone.html** to use the completely self-contained version, or open **index.html** to use the modular website. The site is ready to use. No installation, account, or build is needed. Keep the JavaScript, CSS, and favicon files alongside it.

## Publish on GitHub Pages (simple method)

1. Create a GitHub repository. Upload the **contents** of this folder into its root: `index.html`, `styles.css`, `app.js`, `engine.js`, `data.js`, and `favicon.svg`. You can include the README, sources, and tests too. Do not upload the ZIP itself.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose your main branch, then **/ (root)**, and click **Save**.
5. When deployment finishes, GitHub shows your live website address. It is usually `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

GitHub Pages availability depends on the repository and plan; a public repository works with a free account. Relative asset links support a repository subpath.

## Optional: GitHub Actions deployment

The `.github/workflows/pages.yml` file is included for automatic verification and deployment. If you use it, choose **GitHub Actions** as the Pages source instead of deploying from a branch. Open **Actions → Deploy GitHub Pages → Run workflow**, or push a change to `main` or `master`.

## Three ways to practise

- **Flashcards:** recall the translation, turn the card, and mark “Still learning” or “Got it”.
- **Multiple choice:** choose one of four translations and get immediate feedback.
- **Type the answer:** type in French or English, with optional hints and accent buttons. Articles are optional. Accents can be required.

Choose a topic, translation direction, and round length. Save individual words with the bookmark; revisit them as a collection. Missed, skipped, and hinted words appear in review. Search the complete vocabulary list to see translations, topics, slide numbers, and source clarifications.

Two correct recalls in a row mark a word as learned. Flashcards use your own assessment. The current round, saved words, and progress resume after a refresh. Progress is stored only in this browser and does not sync across devices or website addresses. Settings includes a reset option.

The interface follows the device’s light/dark setting and respects reduced-motion preferences. Keyboard shortcuts are listed in the footer.

## Files

- `La-Bonne-Bouffe-Standalone.html`: the entire study site in one file; this can also be renamed to `index.html` and uploaded on its own for GitHub Pages

- `index.html`: page structure
- `styles.css`: responsive light/dark design
- `data.js`: vocabulary, accepted answers, source slides, and clarifications
- `engine.js`: answer checking, question generation, and learning rules
- `app.js`: study interactions and local storage
- `SOURCES.md`: source notes and references
- `tests/`: dependency-free automated tests

There are no remote fonts, images, scripts, analytics, API keys, or build dependencies. The source PDF and Apple artwork/fonts are not redistributed. This is an independent classroom project.

## Local server (optional)

Some browsers limit persistent storage for pages opened as local files. GitHub Pages provides consistent storage. Alternatively, with Python installed, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Test (optional)

With Node.js 20 or newer:

```sh
node --test tests/*.test.cjs
node --check app.js
```

13 tests cover source completeness, answer variants, exact accents, wrong answers, quiz choices, category/direction settings, study flows, review, bookmarks, progress resuming, and unavailable browser storage. DOM flow tests use a minimal harness; they do not replace browser layout testing.
