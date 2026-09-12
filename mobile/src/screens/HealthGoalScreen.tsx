import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { goalsApi } from '../api';
import { colors, spacing, radius, typography } from '../theme';
import Header from '../components/common/Header';
import Button from '../components/common/Button';

export default function HealthGoalScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [targetWeight, setTargetWeight] = useState('');
  const [targetBp, setTargetBp] = useState('');
  const [targetSteps, setTargetSteps] = useState('7000');
  const [targetSleep, setTargetSleep] = useState('7');

  useEffect(() => {
    goalsApi.getGoals().then((r) => {
      const g = r.data;
      if (g?.targetWeight) setTargetWeight(String(g.targetWeight));
      if (g?.targetBp) setTargetBp(g.targetBp);
      if (g?.targetSteps) setTargetSteps(String(g.targetSteps));
      if (g?.targetSleep) setTargetSleep(String(g.targetSleep));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await goalsApi.setGoals({
        targetWeight: targetWeight ? Number(targetWeight) : undefined,
        targetBp,
        targetSteps: targetSteps ? Number(targetSteps) : undefined,
        targetSleep: targetSleep ? Number(targetSleep) : undefined,
      });
      Alert.alert('저장 완료', '건강 목표가 저장되었습니다.');
      navigation.goBack();
    } catch {
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="건강 목표 설정" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {[
          { label: '목표 체중 (kg)', value: targetWeight, onChange: setTargetWeight, placeholder: '65', keyboard: 'decimal-pad' },
          { label: '목표 혈압', value: targetBp, onChange: setTargetBp, placeholder: '120/80', keyboard: 'default' },
          { label: '하루 걸음 수', value: targetSteps, onChange: setTargetSteps, placeholder: '7000', keyboard: 'number-pad' },
          { label: '수면 시간 (시간)', value: targetSleep, onChange: setTargetSleep, placeholder: '7', keyboard: 'number-pad' },
        ].map(({ label, value, onChange, placeholder, keyboard }) => (
          <View key={label}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder={placeholder}
              keyboardType={keyboard as any}
              placeholderTextColor={colors.inkSoft}
            />
          </View>
        ))}
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
});
