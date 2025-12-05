## Installation
- Create mysql database named ark and DB change connect string in main.go
- `go build`
- `./arkexplorer`

# Ark Explorer Frontend

## Setup

1. **Install Bun** (if not installed):

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

**Linux/macOS:**
```bash
curl -fsSL https://bun.sh/install | bash
```

Restart your terminal after installation.

2. **Install dependencies**:
```bash
cd frontend
bun install
```

3. **Start development server**:
```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## That's it!

The app will automatically reload when you make changes.