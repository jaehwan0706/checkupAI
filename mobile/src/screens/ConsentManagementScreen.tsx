import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import Header from '../components/common/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function ConsentManagementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [aiConsent, setAiConsent] = useState(true);
  const [dataRetention, setDataRetention] = useState(true);

  const handleSave = () => {
    Alert.alert('저장 완료', '동의 설정이 저장되었습니다.');
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="데이터 동의 관리" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card padding={0}>
          {[
            {
              label: 'AI 분석 동의',
              desc: '건강 데이터를 AI 분석에 활용하는 것에 동의합니다',
              value: aiConsent,
              onChange: setAiConsent,
            },
            {
              label: '데이터 보관 동의',
              desc: '건강 기록 데이터 보관에 동의합니다',
              value: dataRetention,
              onChange: setDataRetention,
            },
          ].map(({ label, desc, value, onChange }, i, arr) => (
            <View key={label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowDesc}>{desc}</Text>
              </View>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          ))}
        </Card>

        <Text style={styles.notice}>
          동의를 철회하면 일부 서비스 이용이 제한될 수 있습니다.
          데이터 삭제를 원하시면 고객센터로 문의해주세요.
        </Text>

        <Button label="저장" onPress={handleSave} size="lg" style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, marginTop: 16, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowLabel: { ...typography.body, fontWeight: '600', marginBottom: 3 },
  rowDesc: { ...typography.caption, color: colors.inkSoft, lineHeight: 18 },
  notice: { ...typography.caption, color: colors.inkSoft, lineHeight: 18, textAlign: 'center' },
});
