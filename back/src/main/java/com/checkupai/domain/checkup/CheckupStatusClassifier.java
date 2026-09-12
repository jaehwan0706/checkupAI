package com.checkupai.domain.checkup;

import com.checkupai.common.HealthStatus;

// HomeController의 수치 판정 기준(bpStatus/bsStatus/cholesterolStatus/altStatus)과 동일한 임계값을 사용한다.
public final class CheckupStatusClassifier {

    private CheckupStatusClassifier() {}

    public static HealthStatus bpStatus(int systolic, int diastolic) {
        if (systolic < 120 && diastolic < 80) return HealthStatus.NORMAL;
        if (systolic < 140 && diastolic < 90) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }

    public static HealthStatus bsStatus(int bs) {
        if (bs < 100) return HealthStatus.NORMAL;
        if (bs < 126) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }

    public static HealthStatus cholesterolStatus(int chol) {
        if (chol < 200) return HealthStatus.NORMAL;
        if (chol < 240) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }

    public static HealthStatus altStatus(int alt) {
        if (alt <= 40) return HealthStatus.NORMAL;
        if (alt <= 80) return HealthStatus.WARNING;
        return HealthStatus.DANGER;
    }
}
