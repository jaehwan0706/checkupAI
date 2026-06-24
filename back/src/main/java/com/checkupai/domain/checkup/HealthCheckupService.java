package com.checkupai.domain.checkup;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.pdf.PdfParseResult;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.checkup.CheckupRequest;
import com.checkupai.dto.checkup.CheckupResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class HealthCheckupService {

    private final HealthCheckupRepository checkupRepository;
    private final UserRepository userRepository;

    @Transactional
    public @NonNull CheckupResponse save(@NonNull Long userId, @NonNull CheckupRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        double bmi = calcBmi(request.getWeight(), request.getHeight());
        int healthScore = calcHealthScore(bmi, request.getSystolicBp(), request.getDiastolicBp(),
                request.getFastingBloodSugar(), request.getTotalCholesterol(), request.getAlt());

        HealthCheckup checkup = HealthCheckup.builder()
                .user(user)
                .checkupDate(request.getCheckupDate())
                .height(request.getHeight())
                .weight(request.getWeight())
                .bmi(Math.round(bmi * 10.0) / 10.0)
                .healthScore(healthScore)
                .systolicBp(request.getSystolicBp())
                .diastolicBp(request.getDiastolicBp())
                .fastingBloodSugar(request.getFastingBloodSugar())
                .totalCholesterol(request.getTotalCholesterol())
                .ldlCholesterol(request.getLdlCholesterol())
                .hdlCholesterol(request.getHdlCholesterol())
                .ast(request.getAst())
                .alt(request.getAlt())
                .creatinine(request.getCreatinine())
                .build();

        return CheckupResponse.from(checkupRepository.save(checkup));
    }

    @Transactional(readOnly = true)
    public @NonNull List<CheckupResponse> findAll(@NonNull Long userId) {
        return checkupRepository.findByUserIdOrderByCheckupDateDesc(userId).stream()
                .map(CheckupResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public @NonNull CheckupResponse findById(@NonNull Long userId, @NonNull Long checkupId) {
        HealthCheckup checkup = checkupRepository.findByIdAndUserId(checkupId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.CHECKUP_NOT_FOUND));
        return CheckupResponse.from(checkup);
    }

    @Transactional
    public @NonNull CheckupResponse saveFromPdf(@NonNull Long userId, @NonNull PdfParseResult pdf) {
        if (pdf.getHeight() == null || pdf.getWeight() == null) {
            throw new CustomException(ErrorCode.PDF_PARSE_INCOMPLETE);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        LocalDate date = pdf.getCheckupDate() != null ? pdf.getCheckupDate() : LocalDate.now();
        double bmi = pdf.getBmi() != null
                ? pdf.getBmi()
                : calcBmi(pdf.getWeight(), pdf.getHeight());
        int healthScore = calcHealthScore(bmi, pdf.getSystolicBp(), pdf.getDiastolicBp(),
                pdf.getFastingBloodSugar(), pdf.getTotalCholesterol(), pdf.getAlt());

        HealthCheckup checkup = HealthCheckup.builder()
                .user(user)
                .checkupDate(date)
                .height(pdf.getHeight())
                .weight(pdf.getWeight())
                .bmi(Math.round(bmi * 10.0) / 10.0)
                .healthScore(healthScore)
                .systolicBp(pdf.getSystolicBp())
                .diastolicBp(pdf.getDiastolicBp())
                .fastingBloodSugar(pdf.getFastingBloodSugar())
                .totalCholesterol(pdf.getTotalCholesterol())
                .ldlCholesterol(pdf.getLdlCholesterol())
                .hdlCholesterol(pdf.getHdlCholesterol())
                .ast(pdf.getAst())
                .alt(pdf.getAlt())
                .creatinine(pdf.getCreatinine())
                .build();

        return CheckupResponse.from(checkupRepository.save(checkup));
    }

    @Transactional(readOnly = true)
    public @NonNull Optional<HealthCheckup> findLatestEntity(@NonNull Long userId) {
        return checkupRepository.findFirstByUserIdOrderByCheckupDateDesc(userId);
    }

    @Transactional(readOnly = true)
    public CheckupResponse findLatest(@NonNull Long userId) {
        return checkupRepository
                .findFirstByUserIdOrderByCheckupDateDesc(userId)
                .map(CheckupResponse::from)
                .orElse(null);
    }

    private double calcBmi(double weight, double height) {
        double h = height / 100.0;
        return weight / (h * h);
    }

    private int calcHealthScore(double bmi, Integer systolicBp, Integer diastolicBp,
                                Integer fastingBloodSugar, Integer totalCholesterol, Integer alt) {
        int score = 0;
        if (systolicBp != null && diastolicBp != null && systolicBp <= 120 && diastolicBp <= 80) score += 20;
        if (fastingBloodSugar != null && fastingBloodSugar <= 100) score += 20;
        if (totalCholesterol != null && totalCholesterol <= 200) score += 20;
        if (alt != null && alt <= 40) score += 20;
        if (bmi >= 18.5 && bmi <= 25.0) score += 20;
        return score;
    
        }
}
