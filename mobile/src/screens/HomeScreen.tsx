import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { homeApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, radius, typography, shadow } from '../theme';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import type { MainStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

interface HomeData {
  healthScore?: number;
  latestCheckup?: {
    checkupDate: string;
    systolicBp?: number;
    diastolicBp?: number;
    fastingBloodSugar?: number;
    totalCholesterol?: number;
    alt?: number;
    bmi?: number;
  };
  hasNewNotification?: boolean;
}

const TIPS = [
  '충분한 수면은 혈압 조절에 도움이 됩니다.',
  '하루 30분 이상 걷기가 콜레스테롤 개선에 효과적이에요.',
  '나트륨 섭취를 줄이면 혈압 관리에 큰 도움이 됩니다.',
  '규칙적인 식사 시간이 혈당 조절의 핵심이에요.',
  '스트레스 관리도 건강검진 수치에 영향을 줍니다.',
  '물을 충분히 마시면 신장 건강에 좋아요.',
  '금주와 금연은 간수치 개선에 가장 효과적입니다.',
];

function getScoreColor(score: number) {
  if (score >= 80) return colors.primary;
  if (score >= 60) return colors.warn;
  return colors.danger;
}

function getStatusLabel(score: number) {
  if (score >= 80) return { label: '양호', status: 'normal' as const };
  if (score >= 60) return { label: '주의', status: 'warning' as const };
  return { label: '관리 필요', status: 'danger' as const };
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const tip = TIPS[today.getDay() % TIPS.length];

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await homeApi.getHomeData();
      setData(res.data);
    } catch {
      // 데이터 없어도 화면 표시
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetch(); }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const score = data?.healthScore ?? 0;
  const ck = data?.latestCheckup;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.greeting}>안녕하세요, {user?.name || '회원'}님 👋</Text>
          <Text style={styles.headerSub}>오늘도 건강 체크해볼까요?</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('NotificationList')}>
            <Ionicons
              name={data?.hasNewNotification ? 'notifications' : 'notifications-outline'}
              size={24}
              color={data?.hasNewNotification ? colors.danger : colors.ink}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Mypage')} style={{ marginLeft: 16 }}>
            <Ionicons name="person-circle-outline" size={26} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} tintColor={colors.primary} />
        }
      >
        {/* 건강 점수 카드 */}
        <Card style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>나의 건강 점수</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreNum, { color: getScoreColor(score) }]}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
            <Badge
              label={getStatusLabel(score).label}
              status={getStatusLabel(score).status}
              style={styles.scoreBadge}
            />
          </View>
          {!ck && (
            <Text style={styles.noData}>건강검진 결과를 입력하면 점수를 확인할 수 있어요</Text>
          )}
        </Card>

        {/* 주요 수치 */}
        {ck && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주요 수치</Text>
            <View style={styles.grid}>
              {[
                { label: '혈압', value: ck.systolicBp ? `${ck.systolicBp}/${ck.diastolicBp}` : '-', unit: 'mmHg' },
                { label: '혈당', value: ck.fastingBloodSugar ?? '-', unit: 'mg/dL' },
                { label: '콜레스테롤', value: ck.totalCholesterol ?? '-', unit: 'mg/dL' },
                { label: 'BMI', value: ck.bmi?.toFixed(1) ?? '-', unit: '' },
              ].map(({ label, value, unit }) => (
                <Card key={label} style={styles.gridCard} padding={14}>
                  <Text style={styles.gridLabel}>{label}</Text>
                  <Text style={styles.gridValue}>{value}</Text>
                  {unit ? <Text style={styles.gridUnit}>{unit}</Text> : null}
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* 오늘의 건강 팁 */}
        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipTitle}>오늘의 건강 팁</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </Card>

        {/* 빠른 실행 */}
        <Text style={[styles.sectionTitle, { marginHorizontal: 0, marginTop: 8 }]}>빠른 입력</Text>
        <View style={styles.quickRow}>
          {[
            { emoji: '📋', label: '건강검진 입력' },
            { emoji: '💊', label: '약봉투 분석' },
            { emoji: '🏥', label: '병원 진료' },
            { emoji: '📊', label: '혈압·혈당' },
          ].map(({ emoji, label }) => (
            <TouchableOpacity key={label} style={styles.quickBtn} onPress={() => navigation.navigate('Input' as any)}>
              <Text style={styles.quickEmoji}>{emoji}</Text>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  headerSub: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  scroll: {
    padding: spacing.base,
    gap: 16,
  },
  scoreCard: {
    padding: 20,
  },
  scoreLabel: {
    ...typography.label,
    color: colors.inkMid,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  scoreNum: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 60,
  },
  scoreMax: {
    fontSize: 18,
    color: colors.inkSoft,
    marginBottom: 8,
  },
  scoreBadge: {
    marginLeft: 8,
    marginBottom: 10,
  },
  noData: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 12,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    width: '47.5%',
  },
  gridLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
  },
  gridUnit: {
    ...typography.caption,
    color: colors.inkSoft,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary + '30',
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tipEmoji: { fontSize: 18 },
  tipTitle: {
    ...typography.h4,
    color: colors.primary,
  },
  tipText: {
    ...typography.body,
    color: colors.primaryDark,
    lineHeight: 22,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.card,
  },
  quickEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkMid,
    textAlign: 'center',
  },
});
