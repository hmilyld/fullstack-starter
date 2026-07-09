package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
public class Role {
@Id
@Column(length = 50)
private String id;

@Column(nullable = false, length = 100)
private String name;

@Column(length = 500)
private String description = "";

@Column(name = "is_preset", nullable = false)
private Boolean preset = false;

@OneToMany(
	mappedBy = "role",
	cascade = CascadeType.ALL,
	orphanRemoval = true,
	fetch = FetchType.LAZY)
private List<RolePermission> permissions = new ArrayList<>();
}
