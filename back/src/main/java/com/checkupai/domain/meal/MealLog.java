package com.checkupai.domain.meal;

import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meal_logs", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "log_date", "meal_type"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class MealLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", nullable = false, length = 20)
    private MealType mealType;

    @Column(length = 500)
    private String content;

    @Column(length = 300)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String aiAnalysis;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public MealLog(User user, LocalDate logDate, MealType mealType, String content, String imageUrl, String aiAnalysis) {
        this.user = user;
        this.logDate = logDate;
        this.mealType = mealType;
        this.content = content;
        this.imageUrl = imageUrl;
        this.aiAnalysis = aiAnalysis;
    }

    public void update(String content, String imageUrl, String aiAnalysis) {
        if (content != null) this.content = content;
        if (imageUrl != null) this.imageUrl = imageUrl;
        if (aiAnalysis != null) this.aiAnalysis = aiAnalysis;
    }
}
