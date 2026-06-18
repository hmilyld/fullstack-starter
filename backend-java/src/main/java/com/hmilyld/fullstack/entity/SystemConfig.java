package com.hmilyld.fullstack.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "system_config")
@Data
@NoArgsConstructor
public class SystemConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String siteName = "管理系统";

    @Column(length = 500)
    private String siteDescription = "";

    @Column(length = 255)
    private String keywords = "";

    private Boolean maintenanceEnabled = false;

    @Column(length = 500)
    private String maintenanceMessage = "";

    private Boolean openRegistration = true;
    private Boolean manualReview = false;

    @Column(length = 50)
    private String defaultRoleId = "user";

    @Column(length = 500)
    private String welcomeMessage = "";

    private Boolean smtpEnabled = false;
    @Column(length = 255)
    private String smtpHost = "";
    private Integer smtpPort = 587;
    @Column(length = 255)
    private String smtpUsername = "";
    @Column(length = 255)
    private String smtpPassword = "";
    @Column(length = 100)
    private String smtpFromName = "管理系统";
    @Column(length = 100)
    private String smtpFromEmail = "";
    private Boolean smtpUseSsl = true;
}
