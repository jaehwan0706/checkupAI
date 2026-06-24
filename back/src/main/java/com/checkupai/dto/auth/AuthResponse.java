package com.checkupai.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {
    private Long userId;
    private String email;
    private String name;
    private String token;
    private String loginType;
}
