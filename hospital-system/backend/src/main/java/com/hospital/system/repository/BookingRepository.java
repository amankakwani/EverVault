package com.hospital.system.repository;

import com.hospital.system.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByEquipmentId(Long equipmentId);
    List<Booking> findByStatus(String status);
    List<Booking> findByEquipmentIdAndStatus(Long equipmentId, String status);
}
