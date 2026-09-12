import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { goalsApi, vitalsApi } from '../api';
import { colors, spacing, radius, typography } from '../theme';
import Card from '../components/common/Card';
import type { MainStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function HealthScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any>(null);
  const [recentVitals, setRecentVitals] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      goalsApi.getGoals().then((r) => setGoals(r.data)).catch(() => {}),
      vitalsApi.getRecent().then((r) => setRecentVitals(r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const DAILY_TIPS = [
    { emoji: '🚶', title: '하루 7,000보 걷기', desc: '심혈관 건강에 효과적', color: '#E3F8F3' },
    { emoji: '💧', title: '물 2L 마시기', desc: '신장 건강과 노폐물 배출', color: '#EAF4FF' },
    { emoji: '🥗', title: '채소 위주 식단', desc: '혈당·콜레스테롤 조절', color: '#F0FFF0' },
    { emoji: '😴', title: '7시간 이상 수면', desc: '혈압·혈당 조절에 필수', color: '#FFF3E0' },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>건강 관리</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        {/* 오늘의 건강 가이드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 건강 가이드</Text>
          <View style={styles.tipGrid}>
            {DAILY_TIPS.map(({ emoji, title, desc, color }) => (
              <Card key={title} style={[styles.tipCard, { backgroundColor: color }]} padding={14}>
                <Text style={styles.tipEmoji}>{emoji}</Text>
                <Text style={styles.tipTitle}>{title}</Text>
                <Text style={styles.tipDesc}>{desc}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* 건강 목표 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>건강 목표</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthGoal')}>
              <Text style={styles.editBtn}>수정</Text>
            </TouchableOpacity>
          </View>

          {goals ? (
            <Card padding={16}>
              {Object.entries(goals).slice(0, 4).map(([key, val]: any) => (
                <View key={key} style={styles.goalRow}>
                  <Text style={styles.goalKey}>{key}</Text>
                  <Text style={styles.goalVal}>{val}</Text>
                </View>
              ))}
            </Card>
          ) : (
            <Card padding={20}>
              <Text style={styles.emptyText}>건강 목표를 설정해보세요</Text>
              <TouchableOpacity
                style={styles.setGoalBtn}
                onPress={() => navigation.navigate('HealthGoal')}
              >
                <Text style={styles.setGoalText}>목표 설정하기</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* 최근 혈압·혈당 요약 */}
        {recentVitals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 혈압·혈당</Text>
            <Card padding={16}>
              {recentVitals.slice(0, 3).map((item, i) => (
                <View key={i} style={styles.vitalRow}>
                  <Text style={styles.vitalDate}>{item.measuredAt?.slice(0, 10)} {item.timeSlot}</Text>
                  <Text style={styles.vitalVal}>
                    {item.systolicBp ? `혈압 ${item.systolicBp}/${item.diastolicBp}` : ''}
                    {item.bloodSugar ? `  혈당 ${item.bloodSugar}` : ''}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* 건강 체크리스트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 체크리스트</Text>
          <Card padding={16}>
            {[
              '아침 혈압 측정',
              '혈당 기록하기',
              '30분 걷기',
              '약 복용하기',
              '물 2L 마시기',
            ].map((item, i) => (
              <View key={i} style={styles.checkItem}>
                <View style={styles.checkbox} />
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { ...typography.h2 },
  scroll: { padding: spacing.base, gap: 20 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...typography.h3 },
  editBtn: { ...typography.label, color: colors.primary },
  tipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tipCard: { width: '47.5%', borderColor: 'transparent' },
  tipEmoji: { fontSize: 28, marginBottom: 8 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 3 },
  tipDesc: { ...typography.caption, color: colors.inkMid },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  goalKey: { ...typography.label, color: colors.inkMid },
  goalVal: { ...typography.label, color: colors.ink },
  emptyText: { ...typography.body, color: colors.inkSoft, textAlign: 'center', marginBottom: 12 },
  setGoalBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  setGoalText: { color: colors.white, fontWeight: '700' },
  vitalRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  vitalDate: { ...typography.caption, color: colors.inkSoft },
  vitalVal: { ...typography.label, color: colors.ink, marginTop: 2 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line },
  checkText: { ...typography.body, color: colors.ink },
});
