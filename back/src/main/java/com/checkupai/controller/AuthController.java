package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.user.UserService;
import com.checkupai.dto.auth.AuthResponse;
import com.checkupai.dto.auth.LoginRequest;
import com.checkupai.dto.auth.SignupRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<AuthResponse> signup(@Valid @RequestBody @NonNull SignupRequest request) {
        return ApiResponse.success(userService.signup(request), "회원가입이 완료되었습니다.");
    }

    @PostMapping("/login")
    public @NonNull ApiResponse<AuthResponse> login(@Valid @RequestBody @NonNull LoginRequest request) {
        return ApiResponse.success(userService.login(request));
    }

    /** 카카오 로그인 시작 — Spring Security OAuth2 흐름으로 위임 */
    @GetMapping("/kakao")
    public void kakaoLogin(HttpServletResponse response) throws IOException {
        response.sendRedirect("/oauth2/authorization/kakao");
    }
}
