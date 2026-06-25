package com.checkupai.dto.user;

import com.checkupai.domain.user.Gender;
import com.checkupai.domain.user.User;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class UserMeResponse {

    private final Long id;
    private final String email;
    private final String kakaoEmail;
    private final String name;
    private final LocalDate birthDate;
    private final String gender;
    private final LocalDateTime annualPassExpiry;

    private UserMeResponse(Long id, String email, String kakaoEmail, String name, LocalDate birthDate, String gender, LocalDateTime annualPassExpiry) {
        this.id = id;
        this.email = email;
        this.kakaoEmail = kakaoEmail;
        this.name = name;
        this.birthDate = birthDate;
        this.gender = gender;
        this.annualPassExpiry = annualPassExpiry;
    }

    public static UserMeResponse from(User user) {
        String genderLabel = user.getGender() == Gender.MALE ? "남"
                           : user.getGender() == Gender.FEMALE ? "여"
                           : null;
        return new UserMeResponse(user.getId(), user.getEmail(), user.getKakaoEmail(), user.getName(), user.getBirthDate(), genderLabel, user.getAnnualPassExpiry());
    }
}
