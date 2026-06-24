package com.checkupai.domain.user;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    // 카카오 계정 실제 이메일 (선택 동의 — null 가능)
    @Column(name = "kakao_email")
    private String kakaoEmail;

    private String password;

    @Column(nullable = false)
    private String name;

    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoginType loginType;

    private LocalDateTime annualPassExpiry;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public User(String email, String kakaoEmail, String password, String name, LocalDate birthDate, Gender gender, LoginType loginType) {
        this.email = email;
        this.kakaoEmail = kakaoEmail;
        this.password = password;
        this.name = name;
        this.birthDate = birthDate;
        this.gender = gender;
        this.loginType = loginType;
    }

    public void updateKakaoEmail(String kakaoEmail) {
        this.kakaoEmail = kakaoEmail;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public void updateProfile(String name, String email, LocalDate birthDate, Gender gender) {
        this.name = name;
        this.email = email;
        if (birthDate != null) this.birthDate = birthDate;
        if (gender != null)    this.gender = gender;
    }

    public boolean hasAnnualPass() {
        return annualPassExpiry != null && annualPassExpiry.isAfter(LocalDateTime.now());
    }

    public void grantAnnualPass(LocalDateTime expiry) {
        this.annualPassExpiry = expiry;
    }

    public void revokeAnnualPass() {
        this.annualPassExpiry = null;
    }
}
