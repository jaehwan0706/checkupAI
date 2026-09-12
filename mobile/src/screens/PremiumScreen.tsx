import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function PremiumScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handlePurchase = (type: 'single' | 'monthly') => {
    // Toss Payments 연동 예정
    Alert.alert(
      '결제 준비 중',
      type === 'single'
        ? '건당 해석 (₩1,900) 결제는 준비 중입니다.'
        : '월간 패스 (₩9,900) 결제는 준비 중입니다.',
    );
  };

  const MONTHLY_FEATURES = [
    '무제한 AI 건강검진 해석',
    '연도별 트렌드 분석',
    '일상 건강관리 AI 코치',
    '무제한 PDF 리포트 저장',
    '가족 계정 1개 추가',
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프리미엄</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>⭐</Text>
          <Text style={styles.heroTitle}>더 깊은 건강 인사이트</Text>
          <Text style={styles.heroSub}>AI가 당신의 건강을 더 자세히 분석해드려요</Text>
        </View>

        {/* 건당 해석 */}
        <Card padding={20} style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>건당 해석</Text>
            <View style={styles.priceBox}>
              <Text style={styles.price}>₩1,900</Text>
              <Text style={styles.priceUnit}>/회</Text>
            </View>
          </View>
          <Text style={styles.planDesc}>검진 결과 한 건에 대한 AI 심층 분석</Text>
          <View style={styles.features}>
            <Text style={styles.feature}>✓ 검진 결과 AI 상세 해석</Text>
            <Text style={styles.feature}>✓ PDF 리포트 1회 저장</Text>
          </View>
          <Button label="건당 결제하기" onPress={() => handlePurchase('single')} variant="outline" style={{ marginTop: 16 }} />
        </Card>

        {/* 월간 패스 */}
        <Card padding={20} style={[styles.planCard, styles.premiumPlan]}>
          <View style={styles.recommendBadge}>
            <Text style={styles.recommendText}>추천</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: colors.gold }]}>월간 패스</Text>
            <View style={styles.priceBox}>
              <Text style={[styles.price, { color: colors.gold }]}>₩9,900</Text>
              <Text style={styles.priceUnit}>/월</Text>
            </View>
          </View>
          <Text style={styles.planDesc}>모든 기능을 무제한으로 이용하세요</Text>
          <View style={styles.features}>
            {MONTHLY_FEATURES.map((f) => (
              <Text key={f} style={styles.feature}>✓ {f}</Text>
            ))}
          </View>
          <Button label="월간 패스 구독하기" onPress={() => handlePurchase('monthly')} variant="gold" style={{ marginTop: 16 }} />
        </Card>

        <Text style={styles.notice}>
          • 구독은 언제든지 해지할 수 있습니다{'\n'}
          • 결제는 Toss Payments를 통해 안전하게 처리됩니다{'\n'}
          • 환불 정책은 이용약관을 확인해주세요
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { ...typography.h3 },
  scroll: { padding: spacing.base, gap: 16 },
  hero: { alignItems: 'center', paddingVertical: 24 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  heroSub: { ...typography.bodyMid, color: colors.inkMid, textAlign: 'center' },
  planCard: { position: 'relative' },
  premiumPlan: {
    borderColor: colors.gold + '60',
    backgroundColor: colors.goldSoft,
  },
  recommendBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  recommendText: { color: colors.white, fontSize: 11, fontWeight: '800' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  planName: { fontSize: 18, fontWeight: '800', color: colors.ink },
  priceBox: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 26, fontWeight: '800', color: colors.ink },
  priceUnit: { ...typography.body, color: colors.inkSoft, marginBottom: 3 },
  planDesc: { ...typography.caption, color: colors.inkMid, marginBottom: 12 },
  features: { gap: 6 },
  feature: { ...typography.body, color: colors.ink },
  notice: { ...typography.caption, color: colors.inkSoft, lineHeight: 20, textAlign: 'center' },
});
