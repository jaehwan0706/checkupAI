package com.checkupai.domain.guide;

import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "guide_check_ins", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "category", "checked_date"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class GuideCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 팁 자체는 AI가 매번 새로 생성해 문구가 바뀔 수 있으므로, 카테고리(혈당/혈압/콜레스테롤/간수치/전신) 단위로 체크인을 쌓는다.
    @Column(nullable = false, length = 20)
    private String category;

    @Column(name = "checked_date", nullable = false)
    private LocalDate checkedDate;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public GuideCheckIn(User user, String category, LocalDate checkedDate) {
        this.user = user;
        this.category = category;
        this.checkedDate = checkedDate;
    }
}
