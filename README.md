# LuminaLens Studio

> **Photography Portfolio & Online Album Management System**  
> A lightweight, modern web application and photography management system engineered with pure HTML5, CSS3, and Vanilla JavaScript on the frontend, powered by a zero-dependency Java 21 standard library backend and JSON file-based persistence.

---

## Architecture & Tech Stack

LuminaLens Studio is architected for maximum portability, high speed, and minimal operational overhead:

- **Frontend:** Pure HTML5, CSS3 (CSS Grid, Flexbox, responsive design tokens, glassmorphism UI), Vanilla JavaScript (ES6+, DOM rendering, asynchronous fetch API).
- **Backend:** Java 21 LTS using the standard library HTTP server (`com.sun.net.httpserver.HttpServer`). Zero third-party dependencies or external build tools (like Maven or Gradle) are required.
- **Persistence Layer:** Flat JSON file storage located in `data/` (`albums.json`, `bookings.json`, `inquiries.json`, `settings.json`).
- **Administrative Portal:** Integrated management dashboard at `/admin` for gallery curations, booking approvals, and client inquiries.

---

## Directory Structure

```text
LuminaLens_Studio/
├── bin/                    # Compiled Java class binaries (git-ignored)
├── data/                   # Persistent JSON storage files
│   ├── albums.json         # Photography albums, tags, and image metadata
│   ├── bookings.json       # Session booking requests & client scheduling
│   ├── inquiries.json      # Client contact inquiries
│   └── settings.json       # Studio configurations and profile details
├── public/                 # Static web assets served by LuminaServer
│   ├── index.html          # Public photography portfolio homepage
│   ├── admin/
│   │   └── index.html      # Protected studio management dashboard
│   ├── css/
│   │   ├── style.css       # Public site styles & dark/light theme tokens
│   │   └── admin.css       # Administrative console styles
│   └── js/
│   │   ├── app.js          # Public portfolio client script & gallery loader
│   │   └── admin.js        # Admin portal CRUD & booking manager
├── src/
│   └── server/
│       └── LuminaServer.java # Core Java 21 HTTP Server & REST API handlers
├── .gitignore              # Version control ignore rules
├── run.bat                 # One-click Windows build and launch script
├── run.sh                  # One-click Unix/macOS build and launch script
└── README.md               # Project documentation
```

---

## System Requirements

- **Java Development Kit (JDK):** Version 21 LTS or newer.
- **Operating System:** Windows, macOS, or Linux.
- **Browser:** Modern web browser supporting ES6+ (Google Chrome, Edge, Firefox, Safari).

To verify your Java installation:
```bash
javac --version
java --version
```

---

## Quick Start & Running the Server

### Option 1: Windows (Command Prompt / PowerShell)
Double-click `run.bat` or run it from terminal:
```cmd
run.bat
```

### Option 2: Linux / macOS (Terminal)
Grant executable permissions and execute:
```bash
chmod +x run.sh
./run.sh
```

### Manual Compilation & Execution
```bash
# Compile all Java sources into bin/
javac -encoding UTF-8 -d bin src/server/*.java

# Run the server
java -Dfile.encoding=UTF-8 -cp bin server.LuminaServer
```

Once running, access the application in your browser:
- **Public Portfolio:** [http://localhost:8080](http://localhost:8080)
- **Admin Dashboard:** [http://localhost:8080/admin](http://localhost:8080/admin)

---

## Default Administrative Access

The admin portal provides complete management over albums, photography showcases, booking calendars, and messages.

- **Admin URL:** `http://localhost:8080/admin`
- **Default Username:** `admin`
- **Default Password:** `admin123`

*(Credentials can be customized in `data/settings.json` or through the admin settings tab).*

---

## REST API Endpoints

The backend server (`src/server/LuminaServer.java`) exposes clean RESTful JSON endpoints alongside static asset serving:

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/` | Serves public portfolio homepage (`public/index.html`) | No |
| `GET` | `/admin` | Serves administration portal (`public/admin/index.html`) | No |
| `GET` | `/*` (static) | Serves static CSS, JS, and image assets from `public/` | No |
| `POST` | `/api/auth/login` | Validates admin credentials and generates session token | No |
| `GET` | `/api/albums` | Retrieves all active public photo albums & metadata | No |
| `POST` | `/api/albums` | Creates a new album | Yes |
| `PUT` | `/api/albums/{id}` | Updates album metadata, photos, or visibility | Yes |
| `DELETE`| `/api/albums/{id}` | Deletes an existing album | Yes |
| `POST` | `/api/bookings` | Submits a public photography booking request | No |
| `GET` | `/api/bookings` | Lists all booking appointments and statuses | Yes |
| `PUT` | `/api/bookings/{id}`| Updates booking status (`pending`, `confirmed`, `completed`) | Yes |
| `POST` | `/api/inquiries` | Submits contact / pricing inquiry form | No |
| `GET` | `/api/inquiries` | Lists customer inquiries | Yes |
| `GET` | `/api/settings` | Fetches studio branding, contacts, and package tiers | No |
| `PUT` | `/api/settings` | Updates studio branding and pricing packages | Yes |

---

## Version Control Standards

- **Default Branch:** `main`
- **Branching Strategy:** Feature branches (`feature/*`) and bug fixes (`bugfix/*`) branch off and merge into `main` (or `develop` when staging).
- **Commit Format:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `style:`, `refactor:`).
- **Assistant Attribution:** Commits include the OpenBot trailer:
  ```text
  Co-authored-by: OpenBot <335604065+openbotgit[bot]@users.noreply.github.com>
  ```
