import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { userApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, radius, typography } from '../theme';
import Header from '../components/common/Header';
import Button from '../components/common/Button';

export default function ProfileEditScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [gender, setGender] = useState<'M' | 'F' | null>((user?.gender as any) || null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await userApi.updateProfile({ name, birthDate, gender: gender || undefined });
      await setUser(res.data);
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
      navigation.goBack();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="프로필 수정" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>이름</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.inkSoft} />

        <Text style={styles.label}>성별</Text>
        <View style={styles.genderRow}>
          {(['M', 'F'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                {g === 'M' ? '남성' : '여성'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>생년월일</Text>
        <TextInput
          style={styles.input}
          value={birthDate}
          onChangeText={setBirthDate}
          placeholder="1990-01-15"
          keyboardType="number-pad"
          placeholderTextColor={colors.inkSoft}
        />

        <Button label="저장" onPress={handleSave} loading={loading} size="lg" style={{ marginTop: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.base, gap: 6 },
  label: { ...typography.label, color: colors.inkMid, marginBottom: 6, marginTop: 14 },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  genderBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  genderText: { ...typography.body, color: colors.inkMid, fontWeight: '600' },
  genderTextActive: { color: colors.primary },
});
