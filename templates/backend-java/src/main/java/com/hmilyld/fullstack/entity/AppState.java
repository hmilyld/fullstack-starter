package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "app_state")
@Data
@NoArgsConstructor
public class AppState {
@Id private Long id;

@Column(name = "session_epoch", nullable = false, length = 64)
private String sessionEpoch;

@Column(name = "menu_layout_version", nullable = false)
private Integer menuLayoutVersion = 1;
}
