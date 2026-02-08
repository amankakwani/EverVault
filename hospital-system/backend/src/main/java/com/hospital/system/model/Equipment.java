package com.hospital.system.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Equipment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // e.g., MRI-1
    private String type; // e.g., MRI

    @Enumerated(EnumType.STRING)
    private EquipmentStatus status;

    private int bufferTime; // in minutes (Procedure Duration)

    @javax.persistence.Transient
    private String nextAvailable;

    @javax.persistence.Transient
    private int queueLength;

    // Custom constructor for DataInitializer
    public Equipment(Long id, String name, String type, EquipmentStatus status, int bufferTime) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.status = status;
        this.bufferTime = bufferTime;
    }
}
