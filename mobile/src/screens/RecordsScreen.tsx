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
import { checkupApi, vitalsApi, medicalApi } from '../api';
import { colors, spacing, radius, typography } from '../theme';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

type RecordTab = 'checkup' | 'vitals' | 'medical';

const RECORD_TABS: { key: RecordTab; label: string }[] = [
  { key: 'checkup', label: '건강검진' },
  { key: 'vitals', label: '혈압·혈당' },
  { key: 'medical', label: '약/병원' },
];

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<RecordTab>('checkup');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        let res;
        if (tab === 'checkup') res = await checkupApi.getAll();
        else if (tab === 'vitals') res = await vitalsApi.getHistory();
        else res = await medicalApi.getHistory();
        setData(res.data || []);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [tab]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>기록</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {RECORD_TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : data.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📂</Text>
          <Text style={styles.emptyTitle}>기록이 없어요</Text>
          <Text style={styles.emptySub}>입력 탭에서 기록을 추가해보세요</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
        >
          {tab === 'checkup' && data.map((item, i) => (
            <CheckupCard key={i} item={item} />
          ))}
          {tab === 'vitals' && data.map((item, i) => (
            <VitalsCard key={i} item={item} />
          ))}
          {tab === 'medical' && data.map((item, i) => (
            <MedicalCard key={i} item={item} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function CheckupCard({ item }: { item: any }) {
  const score = item.healthScore ?? 0;
  const scoreColor = score >= 80 ? colors.primary : score >= 60 ? colors.warn : colors.danger;

  return (
    <Card padding={16} style={styles.recordCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{item.checkupDate}</Text>
        <Text style={[styles.cardScore, { color: scoreColor }]}>{score}점</Text>
      </View>
      <View style={styles.miniGrid}>
        {[
          item.systolicBp && `혈압 ${item.systolicBp}/${item.diastolicBp}`,
          item.fastingBloodSugar && `혈당 ${item.fastingBloodSugar}`,
          item.totalCholesterol && `콜레 ${item.totalCholesterol}`,
          item.bmi && `BMI ${item.bmi?.toFixed(1)}`,
        ].filter(Boolean).map((v, i) => (
          <Text key={i} style={styles.miniVal}>{v}</Text>
        ))}
      </View>
    </Card>
  );
}

function VitalsCard({ item }: { item: any }) {
  const slotLabel: Record<string, string> = {
    MORNING: '아침', AFTERNOON: '점심', EVENING: '저녁', BEDTIME: '취침 전',
  };

  return (
    <Card padding={14} style={styles.recordCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{item.measuredAt?.slice(0, 10)}</Text>
        <Badge label={slotLabel[item.timeSlot] || item.timeSlot} status="info" />
      </View>
      <View style={styles.vitalsRow}>
        {item.systolicBp && (
          <Text style={styles.vitalsVal}>혈압 {item.systolicBp}/{item.diastolicBp} mmHg</Text>
        )}
        {item.bloodSugar && (
          <Text style={styles.vitalsVal}>혈당 {item.bloodSugar} mg/dL</Text>
        )}
      </View>
      {item.memo && <Text style={styles.memo}>{item.memo}</Text>}
    </Card>
  );
}

function MedicalCard({ item }: { item: any }) {
  return (
    <Card padding={16} style={styles.recordCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{item.createdAt?.slice(0, 10)}</Text>
        <Badge
          label={item.type === 'PHARMACY' ? '약국봉투' : '병원진료'}
          status={item.type === 'PHARMACY' ? 'normal' : 'warning'}
        />
      </View>
      {item.summary && <Text style={styles.medicalSummary} numberOfLines={2}>{item.summary}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { ...typography.h2 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: spacing.base,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.label, color: colors.inkSoft },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { ...typography.h3, color: colors.ink },
  emptySub: { ...typography.bodyMid, color: colors.inkSoft },
  scroll: { padding: spacing.base, gap: 10 },
  recordCard: {},
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDate: { ...typography.label, color: colors.inkMid },
  cardScore: { fontSize: 18, fontWeight: '800' },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniVal: { ...typography.caption, color: colors.inkMid, backgroundColor: colors.lineSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  vitalsRow: { gap: 4 },
  vitalsVal: { ...typography.body, color: colors.ink },
  memo: { ...typography.caption, color: colors.inkSoft, marginTop: 8 },
  medicalSummary: { ...typography.body, color: colors.inkMid, lineHeight: 20 },
});
