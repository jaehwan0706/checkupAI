package com.checkupai.config.oauth;

import com.checkupai.config.jwt.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        Long userId = (Long) oAuth2User.getAttribute("_userId");
        String email = (String) oAuth2User.getAttribute("_email");

        if (userId == null || email == null) {
            log.error("카카오 OAuth2 사용자 정보 누락 — userId={}, email={}", userId, email);
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/auth?error=oauth_failed");
            return;
        }

        String name = Objects.toString(oAuth2User.getAttribute("_name"), "카카오 사용자");
        String token = jwtUtil.generateToken(Objects.requireNonNull(userId), Objects.requireNonNull(email), name);
        String redirectUrl = frontendUrl + "/auth/callback?token=" + token;

        log.info("카카오 로그인 성공 — userId={}, redirect={}", userId, redirectUrl);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
