package com.checkupai.domain.pdf;

import com.checkupai.common.CustomException;
import com.checkupai.common.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class PdfParseService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    public @NonNull PdfParseResult parse(@NonNull MultipartFile file) {
        validateFile(file);

        String rawText;
        try {
            rawText = extractText(file);
        } catch (IOException e) {
            log.warn("PDF 텍스트 추출 실패: {}", e.getMessage());
            return PdfParseResult.builder()
                    .parsedSuccessfully(false)
                    .rawText("")
                    .build();
        }

        Double height           = extractDouble(rawText,  "신장|키|height",            100.0, 250.0);
        Double weight           = extractDouble(rawText,  "체중|몸무게|weight",           30.0, 200.0);
        Double bmi              = calcBmi(height, weight);
        Integer systolicBp      = extractInteger(rawText, "수축기|최고혈압",               60,   200);
        Integer diastolicBp     = extractInteger(rawText, "이완기|최저혈압",               40,   130);
        Integer fastingBloodSugar = extractInteger(rawText, "공복혈당|혈당",              50,   500);
        Integer totalCholesterol = extractInteger(rawText, "총콜레스테롤|콜레스테롤",      100,  400);
        Integer ldlCholesterol  = extractInteger(rawText, "LDL|저밀도",                  50,   300);
        Integer hdlCholesterol  = extractInteger(rawText, "HDL|고밀도",                  20,   100);
        Integer ast             = extractInteger(rawText, "AST|GOT",                     0,    500);
        Integer alt             = extractInteger(rawText, "ALT|GPT",                     0,    500);
        Double creatinine       = extractDouble(rawText,  "크레아티닌|creatinine",         0.1,  15.0);
        LocalDate checkupDate   = extractDate(rawText);

        long count = countNonNull(height, weight, systolicBp, diastolicBp,
                fastingBloodSugar, totalCholesterol, ldlCholesterol, hdlCholesterol,
                ast, alt, creatinine, checkupDate);

        return PdfParseResult.builder()
                .checkupDate(checkupDate)
                .height(height)
                .weight(weight)
                .bmi(bmi)
                .systolicBp(systolicBp)
                .diastolicBp(diastolicBp)
                .fastingBloodSugar(fastingBloodSugar)
                .totalCholesterol(totalCholesterol)
                .ldlCholesterol(ldlCholesterol)
                .hdlCholesterol(hdlCholesterol)
                .ast(ast)
                .alt(alt)
                .creatinine(creatinine)
                .parsedSuccessfully(count >= 3)
                .rawText(rawText)
                .build();
    }

    private void validateFile(@NonNull MultipartFile file) {
        if (file.isEmpty()) {
            throw new CustomException(ErrorCode.PDF_EMPTY);
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new CustomException(ErrorCode.PDF_INVALID_TYPE);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new CustomException(ErrorCode.PDF_TOO_LARGE);
        }
    }

    private @NonNull String extractText(@NonNull MultipartFile file) throws IOException {
        try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
            return new PDFTextStripper().getText(doc);
        }
    }

    /**
     * 키워드 이후 60자 윈도우에서 소수점 포함 숫자를 찾아 범위 내 첫 값을 반환.
     */
    @Nullable
    private Double extractDouble(@NonNull String text, @NonNull String keywords,
                                  double min, double max) {
        Pattern keyPat = Pattern.compile("(?i)(?:" + keywords + ")", Pattern.DOTALL);
        Matcher km = keyPat.matcher(text);
        while (km.find()) {
            String window = text.substring(km.end(), Math.min(km.end() + 60, text.length()));
            Matcher nm = Pattern.compile("(\\d{1,3}\\.\\d{1,2})").matcher(window);
            while (nm.find()) {
                try {
                    double v = Double.parseDouble(nm.group(1));
                    if (v >= min && v <= max) return v;
                } catch (NumberFormatException ignored) { }
            }
            // 소수점 없는 정수도 시도
            Matcher im = Pattern.compile("(\\d{1,3})").matcher(window);
            while (im.find()) {
                try {
                    double v = Double.parseDouble(im.group(1));
                    if (v >= min && v <= max) return v;
                } catch (NumberFormatException ignored) { }
            }
        }
        return null;
    }

    /**
     * 키워드 이후 60자 윈도우에서 정수를 찾아 범위 내 첫 값을 반환.
     */
    @Nullable
    private Integer extractInteger(@NonNull String text, @NonNull String keywords,
                                    int min, int max) {
        Pattern keyPat = Pattern.compile("(?i)(?:" + keywords + ")", Pattern.DOTALL);
        Matcher km = keyPat.matcher(text);
        while (km.find()) {
            String window = text.substring(km.end(), Math.min(km.end() + 60, text.length()));
            Matcher nm = Pattern.compile("(\\d{1,3})").matcher(window);
            while (nm.find()) {
                try {
                    int v = Integer.parseInt(nm.group(1));
                    if (v >= min && v <= max) return v;
                } catch (NumberFormatException ignored) { }
            }
        }
        return null;
    }

    @Nullable
    private LocalDate extractDate(@NonNull String text) {
        // YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
        Matcher m1 = Pattern.compile("(\\d{4})[-./](\\d{1,2})[-./](\\d{1,2})").matcher(text);
        if (m1.find()) {
            try {
                return LocalDate.of(
                        Integer.parseInt(m1.group(1)),
                        Integer.parseInt(m1.group(2)),
                        Integer.parseInt(m1.group(3)));
            } catch (Exception ignored) { }
        }
        // YYYY년 MM월 DD일
        Matcher m2 = Pattern.compile("(\\d{4})년\\s*(\\d{1,2})월\\s*(\\d{1,2})일").matcher(text);
        if (m2.find()) {
            try {
                return LocalDate.of(
                        Integer.parseInt(m2.group(1)),
                        Integer.parseInt(m2.group(2)),
                        Integer.parseInt(m2.group(3)));
            } catch (Exception ignored) { }
        }
        return null;
    }

    @Nullable
    private Double calcBmi(@Nullable Double height, @Nullable Double weight) {
        if (height == null || weight == null || height == 0) return null;
        double h = height / 100.0;
        double bmi = weight / (h * h);
        return Math.round(bmi * 10.0) / 10.0;
    }

    private long countNonNull(Object... values) {
        long count = 0;
        for (Object v : values) {
            if (v != null) count++;
        }
        return count;
    }
}
