package com.checkupai.domain.vitals;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.vitals.VitalsRequest;
import com.checkupai.dto.vitals.VitalsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VitalsService {

    private final VitalsRepository vitalsRepository;
    private final UserRepository userRepository;

    @Transactional
    public @NonNull VitalsResponse save(@NonNull Long userId, @NonNull VitalsRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Vitals vitals = Vitals.builder()
                .user(user)
                .systolic(request.getSystolic())
                .diastolic(request.getDiastolic())
                .bloodSugar(request.getBloodSugar())
                .measuredAt(request.getMeasuredAt())
                .memo(request.getMemo())
                .recordedDate(request.getRecordedDate() != null ? request.getRecordedDate() : LocalDate.now())
                .build();

        return VitalsResponse.from(vitalsRepository.save(vitals));
    }

    @Transactional(readOnly = true)
    public @NonNull List<VitalsResponse> findRecent(@NonNull Long userId) {
        LocalDate from = LocalDate.now().minusDays(30);
        return vitalsRepository.findRecentByUserId(userId, from)
                .stream()
                .map(VitalsResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public @NonNull List<VitalsResponse> findAll(@NonNull Long userId) {
        return vitalsRepository.findAllByUserId(userId)
                .stream()
                .map(VitalsResponse::from)
                .toList();
    }
}
