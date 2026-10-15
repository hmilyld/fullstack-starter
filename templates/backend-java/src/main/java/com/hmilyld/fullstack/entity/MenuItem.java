package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
public class MenuItem {
@Id
@Column(name = "permission_code", length = 100)
private String permissionCode;

@Column(name = "group_id", nullable = false, length = 50)
private String groupId;

@Column(nullable = false, length = 255)
private String route;

@Column(nullable = false, length = 50)
private String icon = "circle";

@Column(name = "sort_order", nullable = false)
private Integer sortOrder = 0;

@Column(name = "is_system", nullable = false)
private Boolean system = false;
}
