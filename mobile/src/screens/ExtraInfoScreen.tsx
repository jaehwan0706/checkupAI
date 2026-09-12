import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { userApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, radius, typography } from '../theme';
import Button from '../components/common/Button';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ExtraInfo'>;
type Route = RouteProp<RootStackParamList, 'ExtraInfo'>;

export default function ExtraInfoScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { setToken, setUser } = useAuthStore();

  const [gender, setGender] = useState<'M' | 'F' | null>(null);
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBirthInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 8) {
      let formatted = digits;
      if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4);
      if (digits.length > 6) formatted = digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6);
      setBirthDate(formatted);
    }
  };

  const handleSubmit = async () => {
    if (!gender) return Alert.alert('알림', '성별을 선택해주세요.');
    if (birthDate.length < 10) return Alert.alert('알림', '생년월일을 입력해주세요. (예: 1990-01-15)');

    setLoading(true);
    try {
      const res = await userApi.updateProfile({ gender, birthDate });
      await setUser(res.data);
      // setToken으로 isLoggedIn=true → RootNavigator가 Main으로 자동 전환
      await setToken(route.params.token);
    } catch (e: any) {
      Alert.alert('오류', e.response?.data?.message || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const skip = async () => {
    await setToken(route.params.token);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
    >
      <Text style={styles.step}>2 / 2</Text>
      <Text style={styles.title}>기본 정보를 입력해주세요</Text>
      <Text style={styles.subtitle}>건강 기준 수치 계산에 사용돼요{'\n'}나중에 마이페이지에서도 수정할 수 있어요</Text>

      <Text style={styles.label}>성별</Text>
      <View style={styles.genderRow}>
        {(['M', 'F'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
            onPress={() => setGender(g)}
          >
            <Text style={styles.genderEmoji}>{g === 'M' ? '👨' : '👩'}</Text>
            <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
              {g === 'M' ? '남성' : '여성'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>생년월일</Text>
      <TextInput
        style={styles.input}
        placeholder="1990-01-15"
        value={birthDate}
        onChangeText={handleBirthInput}
        keyboardType="number-pad"
        maxLength={10}
        placeholderTextColor={colors.inkSoft}
      />

      <Button
        label="완료"
        onPress={handleSubmit}
        loading={loading}
        style={styles.btn}
        size="lg"
      />

      <TouchableOpacity onPress={skip} style={styles.skipBtn}>
        <Text style={styles.skipText}>나중에 입력할게요</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: 24,
  },
  step: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMid,
    lineHeight: 22,
    marginBottom: 40,
  },
  label: {
    ...typography.label,
    color: colors.inkMid,
    marginBottom: 10,
    marginTop: 4,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    gap: 8,
  },
  genderBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  genderEmoji: {
    fontSize: 32,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.inkMid,
  },
  genderTextActive: {
    color: colors.primary,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 28,
    letterSpacing: 1,
  },
  btn: {
    marginBottom: 16,
  },
  skipBtn: {
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    ...typography.bodyMid,
    color: colors.inkSoft,
  },
});
