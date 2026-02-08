const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(bodyParser.json());

// --- Data Store (In-Memory) ---
let equipment = [
    { id: 1, name: "MRI-1", status: "AVAILABLE", duration: 60 },
    { id: 2, name: "CT-Scanner", status: "AVAILABLE", duration: 30 },
    { id: 3, name: "Ventilator-1", status: "MAINTENANCE", duration: 1440 }
];

let bookings = [];
let bookingIdCounter = 1;

// Priority Order
const PRIORITY_SCORE = {
    "EMERGENCY": 3,
    "URGENT": 2,
    "NORMAL": 1
};

// --- Routes ---

app.get('/api/equipment', (req, res) => {
    const equipmentWithStatus = equipment.map(eq => {
        // Calculate queue length (CONFIRMED only)
        const queueLength = bookings.filter(b => b.equipmentId === eq.id && b.status === "CONFIRMED").length;

        // Estimate next slot (Now + duration mins per patient in queue)
        const nextSlotTime = new Date();
        nextSlotTime.setMinutes(nextSlotTime.getMinutes() + (queueLength * (eq.duration || 30)));

        let timeString = nextSlotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // If status is MAINTENANCE, say "Indefinite"
        if (eq.status === "MAINTENANCE") timeString = "Under Repair";
        else if (eq.status === "AVAILABLE" && queueLength === 0) timeString = "Now";

        return {
            ...eq,
            queueLength,
            nextAvailable: timeString
        };
    });
    res.json(equipmentWithStatus);
});

// 2. Create Booking Request (USER)
app.post('/api/bookings', (req, res) => {
    const { patientName, equipmentId, requestedPriority, slotTime } = req.body;

    // Server-Side Date Validation
    const selectedDate = new Date(slotTime);
    const now = new Date();
    if (selectedDate < now) {
        console.log(`[VALIDATION-ERROR] Patient ${patientName} tried to book in the past: ${slotTime}`);
        return res.status(400).json({ message: "Error: Booking date cannot be in the past." });
    }

    const newBooking = {
        id: bookingIdCounter++,
        patientName,
        equipmentId: parseInt(equipmentId),
        requestedPriority: requestedPriority || "NORMAL",
        slotTime: slotTime || "As Soon As Possible", // Capture the time!
        priority: "NORMAL",
        status: "PENDING",
        bookingTime: new Date()
    };

    bookings.push(newBooking);
    console.log(`[BOOKING] Request: ${patientName} (${requestedPriority}) for ${newBooking.slotTime}`);
    res.status(201).json(newBooking);
});

// 3. Get Pending Requests (ADMIN)
app.get('/api/bookings/pending', (req, res) => {
    const pending = bookings.filter(b => b.status === 'PENDING');
    res.json(pending);
});

// 4. Confirm & Assign Priority (ADMIN)
app.post('/api/bookings/:id/confirm', (req, res) => {
    const bookingId = parseInt(req.params.id);
    const { assignedPriority } = req.body;

    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return res.status(404).json({ error: "Not found" });

    booking.priority = assignedPriority;
    booking.status = "CONFIRMED";

    console.log(`[ADMIN] Confirmed ${booking.patientName} as ${assignedPriority}`);
    res.json(booking);
});

// 5. Get Sorted Queue (Shows only CONFIRMED)
app.get('/api/queue/:equipmentId', (req, res) => {
    const eqId = parseInt(req.params.equipmentId);
    const activeBookings = bookings.filter(b => b.equipmentId === eqId && b.status === 'CONFIRMED');

    // CORE LOGIC: Sort by Priority (Desc), then Time (Asc)
    activeBookings.sort((a, b) => {
        const scoreA = PRIORITY_SCORE[a.priority] || 0;
        const scoreB = PRIORITY_SCORE[b.priority] || 0;

        if (scoreA !== scoreB) {
            return scoreB - scoreA;
        }
        return new Date(a.bookingTime) - new Date(b.bookingTime);
    });

    res.json(activeBookings);
});

// 6. Call Next Patient
app.post('/api/queue/:equipmentId/next', (req, res) => {
    const eqId = parseInt(req.params.equipmentId);
    const activeBookings = bookings.filter(b => b.equipmentId === eqId && b.status === 'CONFIRMED');

    activeBookings.sort((a, b) => {
        const scoreA = PRIORITY_SCORE[a.priority] || 0;
        const scoreB = PRIORITY_SCORE[b.priority] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(a.bookingTime) - new Date(b.bookingTime);
    });

    if (activeBookings.length === 0) {
        return res.status(404).json({ message: "Queue empty" });
    }

    const nextPatient = activeBookings[0];
    bookings = bookings.filter(b => b.id !== nextPatient.id);

    // --- NEW: Dynamic Status Update ---
    const eq = equipment.find(e => e.id === eqId);
    if (eq) {
        eq.status = "IN_USE";
        console.log(`[EQUIPMENT] ${eq.name} is now IN_USE (Patient: ${nextPatient.patientName})`);

        // Simulate Appointment Duration (e.g., 10 seconds for rapid demo)
        setTimeout(() => {
            eq.status = "AVAILABLE";
            console.log(`[EQUIPMENT] ${eq.name} is now AVAILABLE`);
        }, 10000); // 10 Seconds
    }
    // ----------------------------------

    console.log(`[QUEUE] Called Next: ${nextPatient.patientName}`);
    res.json(nextPatient);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
