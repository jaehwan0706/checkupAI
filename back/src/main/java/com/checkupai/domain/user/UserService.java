package com.checkupai.domain.user;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.config.jwt.JwtUtil;
import com.checkupai.dto.auth.AuthResponse;
import com.checkupai.dto.auth.LoginRequest;
import com.checkupai.dto.auth.SignupRequest;
import com.checkupai.dto.user.ProfileUpdateRequest;
import com.checkupai.dto.user.UserMeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public @NonNull AuthResponse signup(@NonNull SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATE);
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .birthDate(request.getBirthDate())
                .gender(request.getGender())
                .loginType(LoginType.EMAIL)
                .build();

        User saved = userRepository.save(user);
        Long savedId = Objects.requireNonNull(saved.getId(), "저장 후 사용자 ID가 null입니다.");
        String token = jwtUtil.generateToken(savedId, saved.getEmail());

        return new AuthResponse(savedId, saved.getEmail(), saved.getName(), token, LoginType.EMAIL.name());
    }

    @Transactional(readOnly = true)
    public @NonNull AuthResponse login(@NonNull LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }

        Long userId = Objects.requireNonNull(user.getId(), "사용자 ID가 null입니다.");
        String token = jwtUtil.generateToken(userId, user.getEmail());
        return new AuthResponse(userId, user.getEmail(), user.getName(), token, user.getLoginType().name());
    }

    @Transactional(readOnly = true)
    public @NonNull UserMeResponse getMe(@NonNull Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return UserMeResponse.from(user);
    }

    @Transactional
    public @NonNull UserMeResponse updateProfile(@NonNull Long userId, @NonNull ProfileUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Gender gender = null;
        if ("남".equals(req.getGender()))        gender = Gender.MALE;
        else if ("여".equals(req.getGender()))   gender = Gender.FEMALE;
        else if (req.getGender() != null) {
            try { gender = Gender.valueOf(req.getGender().toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }

        user.updateProfile(req.getName(), req.getEmail(), req.getBirthDate(), gender);
        return UserMeResponse.from(user);
    }
}
