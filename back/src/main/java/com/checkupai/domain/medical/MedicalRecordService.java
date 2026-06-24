package com.checkupai.domain.medical;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import com.checkupai.domain.user.User;
import com.checkupai.domain.user.UserRepository;
import com.checkupai.dto.medical.MedicalRecordRequest;
import com.checkupai.dto.medical.MedicalRecordResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final UserRepository userRepository;

    @Transactional
    public @NonNull MedicalRecordResponse save(@NonNull Long userId, @NonNull MedicalRecordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        MedicalRecord record = MedicalRecord.builder()
                .user(user)
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .recordedDate(request.getRecordedDate() != null ? request.getRecordedDate() : LocalDate.now())
                .build();

        return MedicalRecordResponse.from(medicalRecordRepository.save(record));
    }

    @Transactional(readOnly = true)
    public @NonNull List<MedicalRecordResponse> findAll(@NonNull Long userId) {
        return medicalRecordRepository.findAllByUserId(userId)
                .stream()
                .map(MedicalRecordResponse::from)
                .toList();
    }
}
