package com.checkupai.domain.goal;

import com.checkupai.domain.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "goal_check_ins", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"goal_id", "checked_date"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class GoalCheckIn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private UserGoal goal;

    @Column(name = "checked_date", nullable = false)
    private LocalDate checkedDate;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public GoalCheckIn(User user, UserGoal goal, LocalDate checkedDate) {
        this.user = user;
        this.goal = goal;
        this.checkedDate = checkedDate;
    }
}
