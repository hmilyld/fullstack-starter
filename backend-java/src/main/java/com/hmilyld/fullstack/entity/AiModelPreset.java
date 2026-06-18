package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_model_presets")
@Data
@NoArgsConstructor
public class AiModelPreset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "\"group\"", nullable = false, length = 100)
    private String groupName;

    @Column(nullable = false, length = 100)
    private String alias;

    @Column(nullable = false, length = 100)
    private String modelName;

    @Column(nullable = false, length = 255)
    private String apiUrl;

    @Column(length = 500)
    private String description = "";

    private Boolean isActive = true;

    private Integer sortOrder = 0;

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
