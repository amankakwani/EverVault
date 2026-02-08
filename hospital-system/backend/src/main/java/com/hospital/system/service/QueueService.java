package com.hospital.system.service;

import com.hospital.system.model.Booking;
import com.hospital.system.model.Priority;
import com.hospital.system.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QueueService {

    @Autowired
    private BookingRepository bookingRepository;

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
        bookingRepository.delete(nextPatient); // Remove from queue (served)
        return nextPatient;
    }
}
