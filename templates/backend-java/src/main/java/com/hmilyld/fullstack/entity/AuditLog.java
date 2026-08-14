package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
public class AuditLog {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id")
private Long userId;

@Column(length = 50)
private String username;

@Column(nullable = false, length = 100)
private String action;

@Column(nullable = false, length = 50)
private String ip = "";

@Column(nullable = false, length = 20)
private String status = "success";

@Column(columnDefinition = "TEXT")
private String detail = "";

@Column(name = "created_at")
private LocalDateTime createdAt;
}
