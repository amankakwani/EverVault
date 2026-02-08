package com.hospital.system.controller;

import com.hospital.system.model.Booking;
import com.hospital.system.model.Equipment;
import com.hospital.system.model.Priority;
import com.hospital.system.repository.EquipmentRepository;
import com.hospital.system.service.QueueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173") // Allow React Frontend (Vite)
public class HospitalController {

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private QueueService queueService;

    // --- Equipment APIs ---

    @GetMapping("/equipment")
    public List<Equipment> getAllEquipment() {
        List<Equipment> equipmentList = equipmentRepository.findAll();
        
        // Calculate Next Available for each machine
        for (Equipment eq : equipmentList) {
            List<Booking> queue = queueService.getQueueForEquipment(eq.getId());
            eq.setQueueLength(queue.size());

            if ("MAINTENANCE".equals(eq.getStatus())) {
                eq.setNextAvailable("Under Repair");
            } else if (queue.isEmpty()) {
                eq.setNextAvailable("Now");
            } else {
                // Next = Now + (Queue * 30 min)
                java.time.LocalDateTime next = java.time.LocalDateTime.now().plusMinutes(queue.size() * 30L);
                eq.setNextAvailable(next.toLocalTime().toString()); // Simplified time
            }
        }
        return equipmentList;
    }

    // --- Booking (User) ---

    @PostMapping("/bookings")
    public Booking createBooking(@RequestBody Booking booking) {
        // User creates a REQUEST (Pending)
        return queueService.createBookingRequest(booking);
    }

    // --- Admin APIs ---

    @GetMapping("/bookings/pending")
    public List<Booking> getPending() {
        return queueService.getPendingBookings();
    }

    @PostMapping("/bookings/{id}/confirm")
    public Booking confirmBooking(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        // Payload: { "assignedPriority": "URGENT" }
        String priorityStr = payload.get("assignedPriority");
        Priority priority = Priority.valueOf(priorityStr);
        return queueService.confirmBooking(id, priority);
    }

    // --- Queue APIs ---

    @GetMapping("/queue/{equipmentId}")
    public List<Booking> getQueue(@PathVariable Long equipmentId) {
        return queueService.getQueueForEquipment(equipmentId);
    }

    @PostMapping("/queue/{equipmentId}/next")
    public Booking callNext(@PathVariable Long equipmentId) {
        return queueService.callNext(equipmentId);
    }
}
