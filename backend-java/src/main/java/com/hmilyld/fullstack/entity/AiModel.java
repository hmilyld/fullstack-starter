package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ai_models")
@Data
@NoArgsConstructor
public class AiModel {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(nullable = false, unique = true, length = 100)
private String alias;

@Column(nullable = false, length = 100)
private String modelName;

@Column(nullable = false, length = 255)
private String apiUrl;

@Column(nullable = false, length = 255)
private String apiKey;

@Column(length = 500)
private String description = "";

@Column(name = "is_default")
private Boolean defaultModel = false;

@Column(columnDefinition = "datetime default current_timestamp")
private LocalDateTime createdAt;

@Column(columnDefinition = "datetime default current_timestamp")
private LocalDateTime updatedAt;

@PrePersist
protected void onCreate() {
	createdAt = LocalDateTime.now();
	updatedAt = LocalDateTime.now();
}

@PreUpdate
protected void onUpdate() {
	updatedAt = LocalDateTime.now();
}
}
