package com.checkupai.config.oauth;

import com.checkupai.domain.user.LoginType;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    // 카카오 API 응답을 가져오는 RestTemplate의 StringHttpMessageConverter를 UTF-8로 강제
    // Windows 환경에서 플랫폼 기본 charset(CP1252/MS949)이 사용될 경우 한글 닉네임이 깨지는 것을 방지
    @PostConstruct
    private void configureRestTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getMessageConverters().stream()
                .filter(StringHttpMessageConverter.class::isInstance)
                .map(StringHttpMessageConverter.class::cast)
                .forEach(c -> c.setDefaultCharset(StandardCharsets.UTF_8));
        setRestOperations(restTemplate);
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 카카오 사용자 ID
        String kakaoId = String.valueOf(attributes.get("id"));

        // 닉네임 및 실제 이메일 추출
        String name = "카카오유저";
        String kakaoEmail = null;

        @SuppressWarnings("unchecked")
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        if (kakaoAccount != null) {
            @SuppressWarnings("unchecked")
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            if (profile != null && profile.get("nickname") != null) {
                name = profile.get("nickname").toString();
            }
            // 선택 동의 항목 — 사용자가 동의하지 않으면 null
            Object emailObj = kakaoAccount.get("email");
            if (emailObj != null) {
                kakaoEmail = emailObj.toString();
            }
        }

        log.info("카카오 이메일: {}", kakaoEmail);
        if (kakaoEmail == null) {
            log.warn("카카오 이메일 동의 없음 (kakaoId={})", kakaoId);
        }

        // 카카오 ID 기반 고정 이메일 생성 (내부 식별자)
        String email = "kakao_" + kakaoId + "@checkupai.com";

        // 기존 회원 조회 또는 자동 가입
        final String finalEmail = email;
        final String finalName = name;
        final String finalKakaoEmail = kakaoEmail;
        User user = userRepository.findByEmail(finalEmail)
                .orElseGet(() -> {
                    log.info("카카오 신규 회원 가입: email={}, kakaoEmail={}, name={}", finalEmail, finalKakaoEmail, finalName);
                    return userRepository.save(User.builder()
                            .email(finalEmail)
                            .kakaoEmail(finalKakaoEmail)
                            .name(finalName)
                            .loginType(LoginType.KAKAO)
                            .build());
                });

        // 재로그인 시 변경된 값 업데이트 (이름 깨짐 복구 포함)
        boolean changed = false;
        if (finalKakaoEmail != null && !finalKakaoEmail.equals(user.getKakaoEmail())) {
            log.info("카카오 이메일 업데이트: {} → {}", user.getKakaoEmail(), finalKakaoEmail);
            user.updateKakaoEmail(finalKakaoEmail);
            changed = true;
        }
        if (!"카카오유저".equals(finalName) && !finalName.equals(user.getName())) {
            log.info("카카오 닉네임 업데이트: {} → {}", user.getName(), finalName);
            user.updateName(finalName);
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        } else {
            log.info("카카오 기존 회원 로그인: email={}, name={}", user.getEmail(), user.getName());
        }

        // SuccessHandler에서 JWT 발급에 필요한 정보를 attributes에 담아 전달
        Map<String, Object> enrichedAttributes = new HashMap<>(attributes);
        enrichedAttributes.put("_userId", user.getId());
        enrichedAttributes.put("_email", user.getEmail());
        enrichedAttributes.put("_name", user.getName());

        return new DefaultOAuth2User(Collections.emptyList(), enrichedAttributes, "id");
    }
}
