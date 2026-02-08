package com.hospital.system.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;
    
    private Long equipmentId; // Initial simplification: one queue per equipment

    @Enumerated(EnumType.STRING)
    private Priority priority;

    private String slotTime; // e.g., "2026-02-14T10:30"
    private String status;   // PENDING, CONFIRMED

    private LocalDateTime bookingTime;
}
