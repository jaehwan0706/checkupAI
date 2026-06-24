package com.checkupai.controller;

import com.checkupai.common.ApiResponse;
import com.checkupai.common.HealthStatus;
import com.checkupai.domain.checkup.HealthCheckup;
import com.checkupai.domain.checkup.HealthCheckupService;
import com.checkupai.domain.daily.DailyRecord;
import com.checkupai.domain.daily.DailyRecordService;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.home.HealthMetricDto;
import com.checkupai.dto.home.HomeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final HealthCheckupService checkupService;
    private final DailyRecordService dailyRecordService;
    private final UserRepository userRepository;

    @GetMapping
    public @NonNull ApiResponse<HomeResponse> getHome(@AuthenticationPrincipal @NonNull Long userId) {
        Optional<HealthCheckup> latestCheckup = checkupService.findLatestEntity(userId);
        Optional<DailyRecord> todayRecord = dailyRecordService.findToday(userId);
        LocalDate birthDate = userRepository.findById(userId)
                .map(u -> u.getBirthDate())
                .orElse(null);

        HomeResponse response = HomeResponse.builder()
                .lastCheckupDate(latestCheckup.map(HealthCheckup::getCheckupDate).orElse(null))
                .healthScore(latestCheckup.map(HealthCheckup::getHealthScore).orElse(null))
                .metrics(latestCheckup.map(this::buildMetrics).orElse(List.of()))
                .todayCompletionRate(todayRecord.map(this::calcCompletionRate).orElse(0))
                .birthDate(birthDate)
                .build();

        return ApiResponse.success(response);
    }

    private @NonNull List<HealthMetricDto> buildMetrics(@NonNull HealthCheckup c) {
        List<HealthMetricDto> metrics = new ArrayList<>();

        if (c.getSystolicBp() != null && c.getDiastolicBp() != null) {
            metrics.add(HealthMetricDto.builder()
                    .name("혈압")
                    .value(c.getSystolicBp() + "/" + c.getDiastolicBp())
                    .status(bpStatus(c.getSystolicBp(), c.getDiastolicBp()))
                    .build());
        }
        if (c.getFastingBloodSugar() != null) {
            metrics.add(HealthMetricDto.builder()
                    .name("혈당")
                    .value(String.valueOf(c.getFastingBloodSugar()))
                    .status(bsStatus(c.getFastingBloodSugar()))
                    .build());
        }
        if (c.getTotalCholesterol() != null) {
            metrics.add(HealthMetricDto.builder()
                    .name("콜레스테롤")
                    .value(String.valueOf(c.getTotalCholesterol()))
                    .status(cholesterolStatus(c.getTotalCholesterol()))
                    .build());
        }
        if (c.getAlt() != null) {
            metrics.add(HealthMetricDto.builder()
                    .name("간수치(ALT)")
                    .value(String.valueOf(c.getAlt()))
                    .status(altStatus(c.getAlt()))
                    .build());
        }

        return metrics;
    }

    private @NonNull HealthStatus bpStatus(int s, int d) {
        if (s < 120 && d < 80) return HealthStatus.NORMAL;
        if (s < 140 && d < 90) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }

    private @NonNull HealthStatus bsStatus(int bs) {
        if (bs < 100) return HealthStatus.NORMAL;
        if (bs < 126) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }

    private @NonNull HealthStatus cholesterolStatus(int chol) {
        if (chol < 200) return HealthStatus.NORMAL;
        if (chol < 240) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }

    private @NonNull HealthStatus altStatus(int alt) {
        if (alt <= 40) return HealthStatus.NORMAL;
        if (alt <= 80) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }

    private int calcCompletionRate(@NonNull DailyRecord r) {
        int done = 0;
        if (r.getMealBreakfast() != null && !r.getMealBreakfast().isBlank()) done++;
        if (r.getMealLunch() != null && !r.getMealLunch().isBlank()) done++;
        if (r.getMealDinner() != null && !r.getMealDinner().isBlank()) done++;
        if (r.getExerciseType() != null && !r.getExerciseType().isBlank()) done++;
        if (r.getSleepHours() != null) done++;
        return (done * 100) / 5;
    }
}
