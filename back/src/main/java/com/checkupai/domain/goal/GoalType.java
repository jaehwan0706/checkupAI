package com.checkupai.domain.goal;

public enum GoalType {
    NUMERIC,    // 수치형: 혈당/혈압 목표값 추적
    BEHAVIORAL, // 행동형: 운동 체크인 기반
    DIETARY     // 식단형: 식단 기록 횟수 기반
}
