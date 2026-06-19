package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(nullable = false, unique = true, length = 50)
private String username;

@Column(nullable = false, length = 100)
private String name;

@Column(nullable = false, unique = true, length = 100)
private String email;

@Column(nullable = false)
private String passwordHash;

@Column(nullable = false, length = 50)
private String roleId;

@Column(length = 255)
private String avatar = "";
}
