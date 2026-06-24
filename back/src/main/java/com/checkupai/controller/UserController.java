package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.user.UserService;
import com.checkupai.dto.user.ProfileUpdateRequest;
import com.checkupai.dto.user.UserMeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public @NonNull ApiResponse<UserMeResponse> getMe(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(userService.getMe(userId));
    }

    @PutMapping("/me")
    public @NonNull ApiResponse<UserMeResponse> updateMe(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody @NonNull ProfileUpdateRequest request) {
        return ApiResponse.success(userService.updateProfile(userId, request), "프로필이 저장되었습니다.");
    }

    @PutMapping("/profile")
    public @NonNull ApiResponse<UserMeResponse> updateProfile(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody @NonNull ProfileUpdateRequest request) {
        return ApiResponse.success(userService.updateProfile(userId, request), "프로필이 저장되었습니다.");
    }
}
