package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "role_permissions")
@Data
@NoArgsConstructor
public class RolePermission {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(nullable = false, length = 50)
private String roleId;

@Column(nullable = false, length = 100)
private String permissionCode;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "roleId", insertable = false, updatable = false)
private Role role;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "permissionCode", insertable = false, updatable = false)
private Permission permission;
}
