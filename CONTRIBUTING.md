# Contributing to GTFS-RT Python Inspector

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates.
2. **Open a new issue** with:
   - A clear, descriptive title.
   - Steps to reproduce the problem.
   - Expected vs. actual behavior.
   - Your environment details (OS, Python version, browser).
   - If applicable, paste the raw JSON from the "View Raw JSON Data" debug toggle.

### Suggesting Features

Open an issue with the `enhancement` label. Describe:
- The problem your feature would solve.
- Your proposed solution or approach.
- Any alternatives you've considered.

### Submitting Code

#### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/gtfs-rt-py-inspector.git
cd gtfs-rt-py-inspector
```

#### 2. Set Up Your Environment

```bash
python -m venv .venv
# Linux/Mac
source .venv/bin/activate
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

#### 3. Create a Branch

Use a descriptive branch name:

```bash
git checkout -b feature/add-route-filtering
git checkout -b fix/popup-speed-conversion
git checkout -b docs/update-architecture
```

#### 4. Make Your Changes

Follow the coding standards outlined below, then test locally:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open `http://localhost:8000` and verify your changes work across different scenarios (with and without static GTFS data loaded, with different feed providers, etc.).

#### 5. Commit & Push

Write clear, concise commit messages:

```bash
git add .
git commit -m "feat: add route filtering by route_type"
git push origin feature/add-route-filtering
```

We recommend following the [Conventional Commits](https://www.conventionalcommits.org/) specification:

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | CSS/formatting (no logic change) |
| `refactor:` | Code restructuring (no feature change) |
| `perf:` | Performance improvement |
| `test:` | Adding or updating tests |
| `chore:` | Build process, dependencies, tooling |

#### 6. Open a Pull Request

- Target the `main` branch.
- Describe what your PR does, why, and how to test it.
- Link any related issues (e.g., `Closes #12`).

## Coding Standards

### Python (Backend)

- **Version:** Python 3.9+
- **Docstrings:** All public functions and classes must have English docstrings.
- **Type hints:** Use type annotations on function signatures.
- **Formatting:** Follow PEP 8 style guidelines.
- **Imports:** Group imports in order: standard library → third-party → local modules.
- **Error handling:** Always catch specific exceptions; log errors with descriptive messages.

Example:
```python
def fetch_feed(url: str) -> Optional[gtfs_realtime_pb2.FeedMessage]:
    """Download and parse a GTFS-RT Protobuf from the given URL."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response.content)
        return feed
    except requests.RequestException as e:
        print(f"Error fetching feed at {url}: {e}")
        return None
```

### JavaScript (Frontend)

- **No frameworks:** This project intentionally uses Vanilla JS. Do not introduce React, Vue, etc.
- **ES6+:** Use `const`/`let` (never `var`), arrow functions, template literals, and destructuring.
- **DOM references:** Cache DOM element references at the top of `app.js`.
- **i18n compliance:** All user-visible strings must use the `t(key)` function or `data-i18n` attributes. Never hardcode display text.

### CSS

- **Custom properties:** Use the existing CSS variables defined in `:root` for colors, blur, and spacing.
- **No utility frameworks:** Do not add Tailwind, Bootstrap, etc.
- **Dark-mode first:** The default theme is dark. Light mode is handled via the map tile toggle only.

### Internationalization (i18n)

When adding or modifying user-visible text:

1. Add the translation key to **all three** language objects in `static/js/i18n.js` (`pt`, `en`, `es`).
2. For static HTML elements: add `data-i18n="your_key"` to the element.
3. For dynamic JS strings: use `t('your_key')`.
4. Always provide an `N/A` fallback for missing data fields.

## Adding a New Language

1. Add a new object to the `translations` dictionary in `i18n.js` with the language code as key.
2. Copy all keys from an existing language and translate the values.
3. Add the language option to the `<select id="lang-selector">` in `index.html`.
4. Update this document and the README to reflect the new supported language.

## Project Structure

```
gtfs-rt-py-inspector/
├── main.py                 # FastAPI entry point & REST endpoints
├── gtfs_processor.py       # GTFS data parsing & merging engine
├── requirements.txt        # Python dependencies
├── start.bat               # Windows quick-start script
├── Dockerfile              # Container image definition
├── docker-compose.yml      # Docker Compose configuration
├── .gitignore              # Git ignore rules
├── .dockerignore           # Docker build ignore rules
├── LICENSE                 # GPL-3.0 License
├── README.md               # Project overview & usage guide
├── ARCHITECTURE.md         # Technical architecture documentation
├── CONTRIBUTING.md         # This file
└── static/
    ├── index.html          # Main HTML shell
    ├── css/
    │   └── style.css       # Design system & theme
    └── js/
        ├── app.js          # Frontend application logic
        └── i18n.js         # Translation dictionaries & engine
```

## Questions?

If you have questions about contributing, feel free to open a discussion issue. We're happy to help you get started!
