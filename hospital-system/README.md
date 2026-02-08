# 🛡️ EverVault | Advanced Health Logistics

Welcome to **EverVault**, a premium Hospital Equipment Management System designed for **Evernorth Health Services**. This project features a modern React frontend and a multi-backend architecture (Java Spring Boot & Node.js).

## 🚀 How to Run (Choose your Method)

### Method 1: The "Everything in One" Java Demo (Recommended for School)
Use this if you have **Java 17+** and **Maven** installed. This runs the backend and the website together on Port 8080.

1.  Open a terminal in the `hospital-system/backend` folder.
2.  Run:
    ```bash
    mvn spring-boot:run
    ```
3.  Open: **[http://localhost:8080/](http://localhost:8080/)**

---

### Method 2: The Developer Setup (Node.js + React)
Use this on your own PC for live updates.

1.  **Terminal 1 (Backend):**
    ```bash
    cd hospital-system/backend-node
    node server.js
    ```
2.  **Terminal 2 (Frontend):**
    ```bash
    cd hospital-system/frontend
    npm run dev
    ```
3.  Open: **[http://localhost:5173/](http://localhost:5173/)** (or the link shown in the terminal)

---

## ✨ Features
- **EverVault Landing Page**: Premium entry point with Evernorth branding.
- **Priority Triage**: Smart queueing (Emergency > Urgent > Normal).
- **Live Tracking**: Automatic equipment status updates (available in demo).
- **Date Validation**: Prevents booking slots in the past.
- **Health Control Center**: Admin view for confirmed machine availability.

## 🛠️ One-Time Setup (New Computer)
If you just downloaded this from GitHub, run these commands once:
- **Frontend**: `cd hospital-system/frontend && npm install`
- **Backend Node**: `cd hospital-system/backend-node && npm install` (if using node)

---
© 2026 Evernorth Health Logistics | Developed for Evernorth Portfolio Demo
