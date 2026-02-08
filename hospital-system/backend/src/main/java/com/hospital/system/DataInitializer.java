package com.hospital.system;

import com.hospital.system.model.Booking;
import com.hospital.system.model.Equipment;
import com.hospital.system.model.EquipmentStatus;
import com.hospital.system.model.Priority;
import com.hospital.system.repository.BookingRepository;
import com.hospital.system.repository.EquipmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Override
    public void run(String... args) throws Exception {
        // Create Equipment
        equipmentRepository.save(new Equipment(null, "MRI-1", "MRI", EquipmentStatus.AVAILABLE, 60));
        equipmentRepository.save(new Equipment(null, "CT-Scanner", "CT", EquipmentStatus.AVAILABLE, 30));
        equipmentRepository.save(new Equipment(null, "Ventilator-1", "Ventilator", EquipmentStatus.MAINTENANCE, 1440));
        
        // Create some initial bookings for MRI (ID 1)
        // Normal patient waiting
        bookingRepository.save(new Booking(null, "John Doe (Normal)", 1L, Priority.NORMAL, LocalDateTime.now().minusMinutes(30)));
        
        // Urgent patient booking later (should be ahead of Normal)
        bookingRepository.save(new Booking(null, "Jane Smith (Urgent)", 1L, Priority.URGENT, LocalDateTime.now().minusMinutes(10)));
        
        System.out.println("Demo Data Initialized!");
    }
}
