package com.hmilyld.fullstack.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiModelTestResult {
private boolean success;
private String message;
private Double responseTime;
private String model;
}
