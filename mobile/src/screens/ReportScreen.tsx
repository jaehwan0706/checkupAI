import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { checkupApi, vitalsApi, aiApi } from '../api';
import { colors, spacing, radius, typography } from '../theme';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import type { TabParamList } from '../navigation/types';

type Route = RouteProp<TabParamList, 'Report'>;

type Tab = 'checkup' | 'vitals' | 'pharmacy' | 'hospital';

const TABS: { key: Tab; emoji: string; label: string }[] = [
  { key: 'checkup', emoji: '📋', label: '건강검진' },
  { key: 'vitals', emoji: '📊', label: '혈압·혈당' },
  { key: 'pharmacy', emoji: '💊', label: '약국봉투' },
  { key: 'hospital', emoji: '🏥', label: '병원진료' },
];

export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const [tab, setTab] = useState<Tab>(route.params?.tab || 'checkup');

  const [checkupData, setCheckupData] = useState<any>(null);
  const [vitalsData, setVitalsData] = useState<any[]>([]);
  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const loadCheckup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await checkupApi.getLatest();
      setCheckupData(res.data);
    } catch {
      // 데이터 없음
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVitals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vitalsApi.getHistory();
      setVitalsData(res.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'checkup') loadCheckup();
    else if (tab === 'vitals') loadVitals();
  }, [tab]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      let res;
      if (tab === 'checkup' && checkupData) {
        res = await aiApi.analyzeCheckup(checkupData.id);
      } else if (tab === 'vitals') {
        res = await aiApi.analyzeDaily();
      } else if (tab === 'pharmacy') {
        res = await aiApi.analyzeMedical('PHARMACY');
      } else if (tab === 'hospital') {
        res = await aiApi.analyzeMedical('HOSPITAL');
      }
      setAiResult(res?.data);
    } catch {
      Alert.alert('분석 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>AI 리포트</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {TABS.map(({ key, emoji, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => { setTab(key); setAiResult(null); }}
          >
            <Text style={styles.tabEmoji}>{emoji}</Text>
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* 건강검진 탭 */}
            {tab === 'checkup' && (
              <CheckupTab data={checkupData} aiResult={aiResult} onAnalyze={handleAnalyze} analyzing={analyzing} />
            )}

            {/* 혈압·혈당 탭 */}
            {tab === 'vitals' && (
              <VitalsTab data={vitalsData} aiResult={aiResult} onAnalyze={handleAnalyze} analyzing={analyzing} />
            )}

            {/* 약국봉투 / 병원진료 탭 */}
            {(tab === 'pharmacy' || tab === 'hospital') && (
              <MedicalTab
                type={tab}
                aiResult={aiResult}
                onAnalyze={handleAnalyze}
                analyzing={analyzing}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CheckupTab({ data, aiResult, onAnalyze, analyzing }: any) {
  if (!data) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTitle}>건강검진 결과가 없어요</Text>
        <Text style={styles.emptySub}>입력 탭에서 검진 결과를 입력해보세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Card padding={20}>
        <Text style={styles.cardTitle}>최근 검진 결과</Text>
        <Text style={styles.checkupDate}>{data.checkupDate}</Text>
        <View style={styles.dataGrid}>
          {[
            { label: '혈압', value: data.systolicBp ? `${data.systolicBp}/${data.diastolicBp}` : '-', unit: 'mmHg', status: getBpStatus(data.systolicBp) },
            { label: '혈당', value: data.fastingBloodSugar ?? '-', unit: 'mg/dL', status: getBsStatus(data.fastingBloodSugar) },
            { label: '콜레스테롤', value: data.totalCholesterol ?? '-', unit: 'mg/dL', status: getChStatus(data.totalCholesterol) },
            { label: '간수치(ALT)', value: data.alt ?? '-', unit: 'U/L', status: getAltStatus(data.alt) },
            { label: 'BMI', value: data.bmi?.toFixed(1) ?? '-', unit: '', status: getBmiStatus(data.bmi) },
          ].map(({ label, value, unit, status }) => (
            <View key={label} style={styles.dataRow}>
              <Text style={styles.dataLabel}>{label}</Text>
              <View style={styles.dataRight}>
                <Text style={styles.dataValue}>{value} {unit}</Text>
                {status && <Badge label={status.label} status={status.type} />}
              </View>
            </View>
          ))}
        </View>
      </Card>

      {!aiResult ? (
        <Button label={analyzing ? 'AI 분석 중...' : '🤖  AI 상세 분석'} onPress={onAnalyze} loading={analyzing} size="lg" />
      ) : (
        <AiResultCard result={aiResult} />
      )}
    </View>
  );
}

function VitalsTab({ data, aiResult, onAnalyze, analyzing }: any) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={styles.emptyTitle}>혈압·혈당 기록이 없어요</Text>
        <Text style={styles.emptySub}>입력 탭에서 오늘의 수치를 기록해보세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Card padding={20}>
        <Text style={styles.cardTitle}>최근 7일 기록</Text>
        {data.slice(0, 7).map((item: any, i: number) => (
          <View key={i} style={styles.vitalRow}>
            <View>
              <Text style={styles.vitalDate}>{item.measuredAt?.slice(0, 10)}</Text>
              <Text style={styles.vitalSlot}>{item.timeSlot}</Text>
            </View>
            <View style={styles.vitalValues}>
              {item.systolicBp && (
                <Text style={styles.vitalVal}>혈압 {item.systolicBp}/{item.diastolicBp}</Text>
              )}
              {item.bloodSugar && (
                <Text style={styles.vitalVal}>혈당 {item.bloodSugar}</Text>
              )}
            </View>
          </View>
        ))}
      </Card>

      {!aiResult ? (
        <Button label={analyzing ? 'AI 분석 중...' : '🤖  AI 트렌드 분석'} onPress={onAnalyze} loading={analyzing} size="lg" />
      ) : (
        <AiResultCard result={aiResult} />
      )}
    </View>
  );
}

function MedicalTab({ type, aiResult, onAnalyze, analyzing }: any) {
  return (
    <View style={styles.section}>
      <Card padding={20} style={styles.medicalGuide}>
        <Text style={styles.medicalEmoji}>{type === 'pharmacy' ? '💊' : '🏥'}</Text>
        <Text style={styles.medicalTitle}>
          {type === 'pharmacy' ? '약국봉투 AI 분석' : '병원진료 AI 분석'}
        </Text>
        <Text style={styles.medicalSub}>
          {type === 'pharmacy'
            ? '입력한 약봉투 정보를 AI가 분석해 약 성분, 복용법, 주의사항을 정리해드려요'
            : '입력한 진료 기록을 AI가 분석해 진단 내용, 원인, 관리 방법을 설명해드려요'}
        </Text>
      </Card>

      {!aiResult ? (
        <Button label={analyzing ? 'AI 분석 중...' : '🤖  AI 분석 시작'} onPress={onAnalyze} loading={analyzing} size="lg" />
      ) : (
        <AiResultCard result={aiResult} />
      )}
    </View>
  );
}

function AiResultCard({ result }: { result: any }) {
  return (
    <Card padding={20} style={{ borderColor: colors.primary + '30', backgroundColor: colors.primarySoft }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Text style={{ fontSize: 18 }}>🤖</Text>
        <Text style={{ ...typography.h4, color: colors.primary }}>AI 분석 결과</Text>
      </View>
      {result?.summary && (
        <Text style={{ ...typography.body, color: colors.ink, lineHeight: 22, marginBottom: 12 }}>{result.summary}</Text>
      )}
      {result?.riskItems && result.riskItems.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ ...typography.label, color: colors.danger, marginBottom: 6 }}>⚠️ 주의 항목</Text>
          {result.riskItems.map((item: string, i: number) => (
            <Text key={i} style={{ ...typography.body, color: colors.ink, marginBottom: 4 }}>• {item}</Text>
          ))}
        </View>
      )}
      {result?.recommendations && (
        <View>
          <Text style={{ ...typography.label, color: colors.primary, marginBottom: 6 }}>✅ 실천 목표</Text>
          {(Array.isArray(result.recommendations) ? result.recommendations : [result.recommendations]).map((r: string, i: number) => (
            <Text key={i} style={{ ...typography.body, color: colors.ink, marginBottom: 4 }}>• {r}</Text>
          ))}
        </View>
      )}
    </Card>
  );
}

// 상태 판정 함수
function getBpStatus(val?: number) {
  if (!val) return null;
  if (val <= 120) return { label: '정상', type: 'normal' as const };
  if (val <= 139) return { label: '주의', type: 'warning' as const };
  return { label: '위험', type: 'danger' as const };
}
function getBsStatus(val?: number) {
  if (!val) return null;
  if (val <= 100) return { label: '정상', type: 'normal' as const };
  if (val <= 125) return { label: '주의', type: 'warning' as const };
  return { label: '위험', type: 'danger' as const };
}
function getChStatus(val?: number) {
  if (!val) return null;
  if (val <= 200) return { label: '정상', type: 'normal' as const };
  if (val <= 239) return { label: '주의', type: 'warning' as const };
  return { label: '위험', type: 'danger' as const };
}
function getAltStatus(val?: number) {
  if (!val) return null;
  if (val <= 40) return { label: '정상', type: 'normal' as const };
  if (val <= 55) return { label: '주의', type: 'warning' as const };
  return { label: '위험', type: 'danger' as const };
}
function getBmiStatus(val?: number) {
  if (!val) return null;
  if (val >= 18.5 && val <= 25) return { label: '정상', type: 'normal' as const };
  if (val < 18.5) return { label: '저체중', type: 'warning' as const };
  if (val <= 30) return { label: '과체중', type: 'warning' as const };
  return { label: '비만', type: 'danger' as const };
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
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 2,
  },
  tabActive: { borderBottomColor: colors.primary },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: colors.inkSoft },
  tabLabelActive: { color: colors.primary },
  scroll: { padding: spacing.base, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  section: { gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { ...typography.h3, color: colors.ink },
  emptySub: { ...typography.bodyMid, color: colors.inkSoft, textAlign: 'center' },
  cardTitle: { ...typography.h4, marginBottom: 4 },
  checkupDate: { ...typography.caption, color: colors.inkSoft, marginBottom: 16 },
  dataGrid: { gap: 10 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  dataLabel: { ...typography.label, color: colors.inkMid },
  dataRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dataValue: { ...typography.h4 },
  vitalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  vitalDate: { ...typography.label, color: colors.ink },
  vitalSlot: { ...typography.caption, color: colors.inkSoft },
  vitalValues: { alignItems: 'flex-end', gap: 2 },
  vitalVal: { ...typography.body, color: colors.ink },
  medicalGuide: { alignItems: 'center', padding: 32 },
  medicalEmoji: { fontSize: 48, marginBottom: 12 },
  medicalTitle: { ...typography.h3, marginBottom: 8 },
  medicalSub: { ...typography.body, color: colors.inkMid, textAlign: 'center', lineHeight: 22 },
});
