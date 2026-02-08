# Hospital Equipment Management System

## Two Ways to Run

### Method 1: The "Standard" Way (For School Demo / Java Environment)
**Requirements:** Maven and Java (JDK 17+) installed.
**What to copy:** The `backend` folder.

1.  Open a Terminal/Command Prompt.
2.  Navigate into the `backend` folder.
3.  Run this command:
    ```bash
    mvn spring-boot:run
    ```
4.  Open your browser to: `http://localhost:8080`
    *(The website is already built-in, no need for Node.js!)*

---

### Method 2: The "Backup" Way (Node.js Environment)
**Requirements:** Node.js installed.
**What to copy:** The `backend-node` and `frontend` folders.

1.  **Start the Backend:**
    *   Open Terminal in `backend-node`.
    *   Run: `node server.js`

2.  **Start the Frontend:**
    *   Open a *new* Terminal in `frontend`.
    *   Run: `npm install` (Only needed the first time).
    *   Run: `npm run dev`

3.  Open your browser to: `http://localhost:5173`
