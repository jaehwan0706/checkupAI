package com.checkupai.domain.pdf;

import com.checkupai.common.ApiResponse;
import com.checkupai.domain.checkup.HealthCheckupService;
import com.checkupai.dto.checkup.CheckupResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
public class PdfController {

    private final PdfParseService pdfParseService;
    private final HealthCheckupService checkupService;

    /** PDF 파싱만 수행 (저장 없음) — 미리보기/검증 용도 */
    @PostMapping("/parse")
    public @NonNull ApiResponse<PdfParseResult> parse(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestParam("file") MultipartFile file) {
        PdfParseResult result = pdfParseService.parse(file);
        return ApiResponse.success(result, "PDF 파싱 완료");
    }

    /** PDF 파싱 후 검진 기록 자동 저장 */
    @PostMapping("/parse-and-save")
    @ResponseStatus(HttpStatus.CREATED)
    public @NonNull ApiResponse<CheckupResponse> parseAndSave(
            @AuthenticationPrincipal @NonNull Long userId,
            @RequestParam("file") MultipartFile file) {
        PdfParseResult result = pdfParseService.parse(file);
        CheckupResponse saved = checkupService.saveFromPdf(userId, result);
        return ApiResponse.success(saved, "PDF 파싱 후 검진 기록이 저장되었습니다.");
    }
}
