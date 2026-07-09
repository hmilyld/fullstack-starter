package com.hmilyld.fullstack.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
private String token;
private AuthUser user;

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class AuthUser {
	private String id;
	private String name;
	private String email;
	private String avatar;
	private String role;
	private List<String> permissions;
}
}
