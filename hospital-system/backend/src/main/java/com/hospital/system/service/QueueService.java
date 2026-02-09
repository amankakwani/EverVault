package com.hospital.system.service;

import com.hospital.system.model.Booking;
import com.hospital.system.model.Priority;
import com.hospital.system.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hospital.system.model.Equipment;
import com.hospital.system.model.EquipmentStatus;
import com.hospital.system.repository.EquipmentRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QueueService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    public Booking createBookingRequest(Booking booking) {
        if (booking.getBookingTime() == null) {
            booking.setBookingTime(LocalDateTime.now());
        }

        // Server-Side Date Validation (assuming slotTime is ISO string)
        if (booking.getSlotTime() != null) {
            try {
                LocalDateTime selected = LocalDateTime.parse(booking.getSlotTime());
                if (selected.isBefore(LocalDateTime.now())) {
                    throw new RuntimeException("Error: Booking date cannot be in the past.");
                }
            } catch (Exception e) {
                // Handle parsing error or keep existing logic
            }
        }

        // Defaults
        booking.setStatus("PENDING");
        booking.setPriority(Priority.NORMAL); // Temporary default
        return bookingRepository.save(booking);
    }

    public List<Booking> getPendingBookings() {
        return bookingRepository.findByStatus("PENDING");
    }

    public Booking confirmBooking(Long id, Priority newPriority) {
        Booking booking = bookingRepository.findById(id).orElseThrow();
        booking.setPriority(newPriority);
        booking.setStatus("CONFIRMED");
        return bookingRepository.save(booking);
    }

    public List<Booking> getQueueForEquipment(Long equipmentId) {
        // ONLY get CONFIRMED bookings for the queue
        List<Booking> activeBookings = bookingRepository.findByEquipmentIdAndStatus(equipmentId, "CONFIRMED");
        
        // CORE LOGIC: Sort by Priority (High to Low), then Time (Oldest to Newest)
        return activeBookings.stream()
                .sorted(Comparator.comparing(Booking::getPriority).reversed()
                        .thenComparing(Booking::getBookingTime))
                .collect(Collectors.toList());
    }

    public Booking callNext(Long equipmentId) {
        List<Booking> queue = getQueueForEquipment(equipmentId);
        if (queue.isEmpty()) {
            return null;
        }
        Booking nextPatient = queue.get(0);
        
        // Update machine status
        Equipment eq = equipmentRepository.findById(equipmentId).orElse(null);
        if (eq != null) {
            eq.setStatus(EquipmentStatus.IN_USE);
            equipmentRepository.save(eq);
        }

        // We don't delete yet, we mark as IN_PROGRESS or just let the client handle it.
        // But for this simple demo, we'll follow the "markAsServed" pattern.
        // To keep the queue logic clean, maybe we mark it as "PROCESS" or something.
        // Actually, let's just mark it as "IN_USE" status for the booking too.
        nextPatient.setStatus("IN_USE");
        return bookingRepository.save(nextPatient);
    }

    public String calculateNextSlot(Long equipmentId) {
        Equipment eq = equipmentRepository.findById(equipmentId).orElse(null);
        if (eq == null) return "Unknown";
        if (eq.getStatus() == EquipmentStatus.MAINTENANCE) return "Under Repair";

        List<Booking> queue = getQueueForEquipment(equipmentId);
        if (queue.isEmpty()) return "Now";

        // Simple math: Now + (Queue Size * Machine Duration)
        LocalDateTime next = LocalDateTime.now().plusMinutes(queue.size() * (long) eq.getBufferTime());
        return next.toLocalTime().toString().substring(0, 5); // HH:mm format
    }

    public void markAsServed(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus("SERVED");
        bookingRepository.save(booking);

        // Reset equipment status
        Equipment eq = equipmentRepository.findById(booking.getEquipmentId()).orElse(null);
        if (eq != null) {
            eq.setStatus(EquipmentStatus.AVAILABLE);
            equipmentRepository.save(eq);
        }
    }
}
