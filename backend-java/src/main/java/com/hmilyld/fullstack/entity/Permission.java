package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
public class Permission {
@Id
@Column(length = 100)
private String code;

@Column(nullable = false, length = 100)
private String name;

@Column(nullable = false, length = 20)
private String type;

@Column(length = 100)
private String parent;
}
