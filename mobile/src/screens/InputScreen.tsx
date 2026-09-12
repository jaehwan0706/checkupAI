import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { checkupApi, vitalsApi, medicalApi } from '../api';
import { colors, spacing, radius, typography, shadow } from '../theme';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import type { TabParamList } from '../navigation/types';

type Nav = BottomTabNavigationProp<TabParamList>;

type InputMode = 'checkup' | 'vitals' | 'pharmacy' | 'hospital';

const INPUT_MODES = [
  { key: 'checkup' as InputMode, emoji: '📋', label: '건강검진' },
  { key: 'vitals' as InputMode, emoji: '📊', label: '혈압·혈당' },
  { key: 'pharmacy' as InputMode, emoji: '💊', label: '약국봉투' },
  { key: 'hospital' as InputMode, emoji: '🏥', label: '병원진료' },
];

const TIME_SLOTS = [
  { key: 'MORNING', label: '아침' },
  { key: 'AFTERNOON', label: '점심' },
  { key: 'EVENING', label: '저녁' },
  { key: 'BEDTIME', label: '취침 전' },
];

export default function InputScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<InputMode>('checkup');
  const [loading, setLoading] = useState(false);

  // 건강검진 필드
  const [checkupDate, setCheckupDate] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [cholesterol, setCholesterol] = useState('');
  const [alt, setAlt] = useState('');

  // 혈압·혈당 필드
  const [timeSlot, setTimeSlot] = useState('MORNING');
  const [vSystolic, setVSystolic] = useState('');
  const [vDiastolic, setVDiastolic] = useState('');
  const [vBloodSugar, setVBloodSugar] = useState('');
  const [memo, setMemo] = useState('');

  const handleSaveCheckup = async () => {
    if (!checkupDate) return Alert.alert('알림', '검진일을 입력해주세요.');
    setLoading(true);
    try {
      await checkupApi.create({
        checkupDate,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        systolicBp: systolicBp ? Number(systolicBp) : undefined,
        diastolicBp: diastolicBp ? Number(diastolicBp) : undefined,
        fastingBloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
        totalCholesterol: cholesterol ? Number(cholesterol) : undefined,
        alt: alt ? Number(alt) : undefined,
      });
      Alert.alert('저장 완료', '건강검진 결과가 저장되었습니다.', [
        { text: '리포트 보기', onPress: () => navigation.navigate('Report', { tab: 'checkup' }) },
        { text: '확인' },
      ]);
    } catch {
      Alert.alert('오류', '저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        name: result.assets[0].name,
        type: 'application/pdf',
      } as any);
      await checkupApi.uploadPdf(formData);
      Alert.alert('분석 완료', 'PDF에서 검진 결과를 추출했습니다.', [
        { text: '리포트 보기', onPress: () => navigation.navigate('Report', { tab: 'checkup' }) },
      ]);
    } catch {
      Alert.alert('오류', 'PDF 분석에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVitals = async () => {
    setLoading(true);
    try {
      await vitalsApi.create({
        measuredAt: new Date().toISOString(),
        timeSlot: timeSlot as any,
        systolicBp: vSystolic ? Number(vSystolic) : undefined,
        diastolicBp: vDiastolic ? Number(vDiastolic) : undefined,
        bloodSugar: vBloodSugar ? Number(vBloodSugar) : undefined,
        memo,
      });
      Alert.alert('저장 완료', '혈압·혈당 기록이 저장되었습니다.');
      setVSystolic(''); setVDiastolic(''); setVBloodSugar(''); setMemo('');
    } catch {
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (type: 'PHARMACY' | 'HOSPITAL') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: result.assets[0].uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('type', type);
      await medicalApi.create(formData);
      Alert.alert('분석 완료', 'AI가 내용을 분석했습니다.', [
        {
          text: '리포트 보기',
          onPress: () => navigation.navigate('Report', { tab: type === 'PHARMACY' ? 'pharmacy' : 'hospital' }),
        },
      ]);
    } catch {
      Alert.alert('오류', '분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCamera = async (type: 'PHARMACY' | 'HOSPITAL') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: result.assets[0].uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      formData.append('type', type);
      await medicalApi.create(formData);
      Alert.alert('분석 완료', 'AI가 내용을 분석했습니다.', [
        { text: '리포트 보기', onPress: () => navigation.navigate('Report', { tab: type === 'PHARMACY' ? 'pharmacy' : 'hospital' }) },
      ]);
    } catch {
      Alert.alert('오류', '분석에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>건강 기록 입력</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {INPUT_MODES.map(({ key, emoji, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.modeBtn, mode === key && styles.modeBtnActive]}
            onPress={() => setMode(key)}
          >
            <Text style={styles.modeEmoji}>{emoji}</Text>
            <Text style={[styles.modeLabel, mode === key && styles.modeLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 80 }]}
      >
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.overlayText}>처리 중...</Text>
          </View>
        )}

        {/* 건강검진 */}
        {mode === 'checkup' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.pdfBtn} onPress={handlePdfUpload}>
              <Text style={styles.pdfEmoji}>📄</Text>
              <View>
                <Text style={styles.pdfTitle}>건강보험공단 PDF 업로드</Text>
                <Text style={styles.pdfSub}>PDF를 올리면 AI가 자동으로 수치를 입력해요</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>또는 직접 입력</Text>
              <View style={styles.divLine} />
            </View>

            <Card padding={20}>
              <Field label="검진일 *" value={checkupDate} onChangeText={setCheckupDate} placeholder="2024-01-15" keyboardType="default" />
              <Row>
                <Field label="키 (cm)" value={height} onChangeText={setHeight} placeholder="170" keyboardType="decimal-pad" flex />
                <Field label="체중 (kg)" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" flex />
              </Row>
              <Row>
                <Field label="수축기 혈압" value={systolicBp} onChangeText={setSystolicBp} placeholder="120" keyboardType="number-pad" flex />
                <Field label="이완기 혈압" value={diastolicBp} onChangeText={setDiastolicBp} placeholder="80" keyboardType="number-pad" flex />
              </Row>
              <Field label="공복혈당 (mg/dL)" value={bloodSugar} onChangeText={setBloodSugar} placeholder="100" keyboardType="number-pad" />
              <Field label="총콜레스테롤 (mg/dL)" value={cholesterol} onChangeText={setCholesterol} placeholder="200" keyboardType="number-pad" />
              <Field label="ALT 간수치" value={alt} onChangeText={setAlt} placeholder="30" keyboardType="number-pad" />
            </Card>

            <Button label="저장하기" onPress={handleSaveCheckup} loading={loading} size="lg" style={{ marginTop: 4 }} />
          </View>
        )}

        {/* 혈압·혈당 */}
        {mode === 'vitals' && (
          <View style={styles.section}>
            <Card padding={20}>
              <Text style={styles.fieldLabel}>측정 시간대</Text>
              <View style={styles.slotRow}>
                {TIME_SLOTS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.slotBtn, timeSlot === key && styles.slotBtnActive]}
                    onPress={() => setTimeSlot(key)}
                  >
                    <Text style={[styles.slotText, timeSlot === key && styles.slotTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionSub}>혈압</Text>
              <Row>
                <Field label="수축기 (mmHg)" value={vSystolic} onChangeText={setVSystolic} placeholder="120" keyboardType="number-pad" flex />
                <Field label="이완기 (mmHg)" value={vDiastolic} onChangeText={setVDiastolic} placeholder="80" keyboardType="number-pad" flex />
              </Row>

              <Text style={styles.sectionSub}>혈당</Text>
              <Field label="혈당 (mg/dL)" value={vBloodSugar} onChangeText={setVBloodSugar} placeholder="100" keyboardType="number-pad" />

              <Field label="메모 (선택)" value={memo} onChangeText={setMemo} placeholder="식후 30분 측정..." />
            </Card>

            <Button label="기록 저장" onPress={handleSaveVitals} loading={loading} size="lg" style={{ marginTop: 4 }} />
          </View>
        )}

        {/* 약국봉투 */}
        {mode === 'pharmacy' && (
          <View style={styles.section}>
            <Text style={styles.guideText}>약봉투 사진을 찍거나 갤러리에서 선택하면{'\n'}AI가 약 이름, 복용법, 주의사항을 분석해요</Text>
            <Card padding={20} style={styles.imageCard}>
              <Text style={styles.imageCardEmoji}>💊</Text>
              <Text style={styles.imageCardTitle}>약국 봉투 이미지</Text>
              <Text style={styles.imageCardSub}>약봉투 전체가 잘 보이게 찍어주세요</Text>
            </Card>
            <View style={styles.btnRow}>
              <Button label="📷  카메라" onPress={() => handleCamera('PHARMACY')} variant="outline" style={styles.halfBtn} />
              <Button label="🖼️  갤러리" onPress={() => handleImageUpload('PHARMACY')} style={styles.halfBtn} />
            </View>
          </View>
        )}

        {/* 병원진료 */}
        {mode === 'hospital' && (
          <View style={styles.section}>
            <Text style={styles.guideText}>진료 기록지나 처방전을 찍으면{'\n'}AI가 진단명, 소견, 권고사항을 정리해요</Text>
            <Card padding={20} style={styles.imageCard}>
              <Text style={styles.imageCardEmoji}>🏥</Text>
              <Text style={styles.imageCardTitle}>병원 진료 기록</Text>
              <Text style={styles.imageCardSub}>진료 기록지나 처방전을 찍어주세요</Text>
            </Card>
            <View style={styles.btnRow}>
              <Button label="📷  카메라" onPress={() => handleCamera('HOSPITAL')} variant="outline" style={styles.halfBtn} />
              <Button label="🖼️  갤러리" onPress={() => handleImageUpload('HOSPITAL')} style={styles.halfBtn} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// 인라인 헬퍼 컴포넌트
function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', flex }: any) {
  return (
    <View style={[fieldStyles.container, flex && { flex: 1 }]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={colors.inkSoft}
      />
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { ...typography.caption, color: colors.inkMid, marginBottom: 6 },
  input: {
    height: 46,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
});

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
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 3,
  },
  modeBtnActive: { borderBottomColor: colors.primary },
  modeEmoji: { fontSize: 18 },
  modeLabel: { fontSize: 11, fontWeight: '600', color: colors.inkSoft },
  modeLabelActive: { color: colors.primary },
  scroll: { padding: spacing.base, gap: 12 },
  section: { gap: 12 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 12,
  },
  overlayText: { ...typography.body, color: colors.inkMid },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: colors.primary + '40',
  },
  pdfEmoji: { fontSize: 32 },
  pdfTitle: { ...typography.h4, color: colors.primary },
  pdfSub: { ...typography.caption, color: colors.primaryDark, marginTop: 2 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.line },
  divText: { ...typography.caption, color: colors.inkSoft },
  fieldLabel: { ...typography.label, color: colors.inkMid, marginBottom: 10 },
  slotRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  slotBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
  },
  slotBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  slotText: { ...typography.caption, color: colors.inkSoft },
  slotTextActive: { color: colors.primary, fontWeight: '700' },
  sectionSub: { ...typography.label, color: colors.inkMid, marginBottom: 8, marginTop: 4 },
  guideText: {
    ...typography.body,
    color: colors.inkMid,
    textAlign: 'center',
    lineHeight: 22,
    padding: 8,
  },
  imageCard: {
    alignItems: 'center',
    padding: 40,
    borderStyle: 'dashed',
    borderColor: colors.line,
  },
  imageCardEmoji: { fontSize: 48, marginBottom: 12 },
  imageCardTitle: { ...typography.h4, color: colors.ink, marginBottom: 4 },
  imageCardSub: { ...typography.caption, color: colors.inkSoft },
  btnRow: { flexDirection: 'row', gap: 10 },
  halfBtn: { flex: 1 },
});
