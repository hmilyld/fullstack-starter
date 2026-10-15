package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "menu_groups")
@Data
@NoArgsConstructor
public class MenuGroup {
@Id
@Column(length = 50)
private String id;

@Column(nullable = false, length = 100)
private String name;

@Column(name = "sort_order", nullable = false)
private Integer sortOrder = 0;

@Column(name = "is_system", nullable = false)
private Boolean system = false;
}
