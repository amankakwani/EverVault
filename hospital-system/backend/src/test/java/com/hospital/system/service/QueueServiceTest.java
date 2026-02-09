package com.hospital.system.service;

import com.hospital.system.model.Booking;
import com.hospital.system.model.Priority;
import com.hospital.system.model.Equipment;
import com.hospital.system.model.EquipmentStatus;
import com.hospital.system.repository.BookingRepository;
import com.hospital.system.repository.EquipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class QueueServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @InjectMocks
    private QueueService queueService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testPrioritySorting() {
        Long mriId = 1L;
        List<Booking> mockBookings = new ArrayList<>();
        
        // Normal patient who arrived first
        Booking normal = new Booking(1L, "Normal Patient", mriId, Priority.NORMAL, "2026-02-14T10:00", "CONFIRMED", LocalDateTime.now().minusMinutes(30));
        // Emergency patient who arrived later
        Booking emergency = new Booking(2L, "Emergency Patient", mriId, Priority.EMERGENCY, "2026-02-14T10:05", "CONFIRMED", LocalDateTime.now().minusMinutes(10));
        
        mockBookings.add(normal);
        mockBookings.add(emergency);

        when(bookingRepository.findByEquipmentIdAndStatus(mriId, "CONFIRMED")).thenReturn(mockBookings);

        List<Booking> sortedQueue = queueService.getQueueForEquipment(mriId);

        assertEquals(2, sortedQueue.size());
        assertEquals("Emergency Patient", sortedQueue.get(0).getPatientName()); // Priority 1st
        assertEquals("Normal Patient", sortedQueue.get(1).getPatientName());    // Normal 2nd
    }

    @Test
    void testMarkAsServed() {
        Long bookingId = 10L;
        Long mriId = 1L;
        Booking booking = new Booking(bookingId, "John Doe", mriId, Priority.NORMAL, "2026-02-14T10:00", "IN_USE", LocalDateTime.now());
        Equipment mri = new Equipment(mriId, "MRI-1", "MRI", EquipmentStatus.IN_USE, 60);

        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(equipmentRepository.findById(mriId)).thenReturn(Optional.of(mri));

        queueService.markAsServed(bookingId);

        assertEquals("SERVED", booking.getStatus());
        assertEquals(EquipmentStatus.AVAILABLE, mri.getStatus());
    }

    @Test
    void testCalculateNextSlotEmpty() {
        Long mriId = 1L;
        Equipment mri = new Equipment(mriId, "MRI-1", "MRI", EquipmentStatus.AVAILABLE, 60);
        
        when(equipmentRepository.findById(mriId)).thenReturn(Optional.of(mri));
        when(bookingRepository.findByEquipmentIdAndStatus(mriId, "CONFIRMED")).thenReturn(new ArrayList<>());

        String next = queueService.calculateNextSlot(mriId);
        assertEquals("Now", next);
    }
}
