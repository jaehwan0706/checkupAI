import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import Header from '../components/common/Header';
import Card from '../components/common/Card';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [recordReminder, setRecordReminder] = useState(true);
  const [healthTip, setHealthTip] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="알림 설정" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card padding={0}>
          {[
            { label: '푸시 알림', desc: '앱 알림 수신', value: pushEnabled, onChange: setPushEnabled },
            { label: '기록 리마인더', desc: '혈압·혈당 기록 알림', value: recordReminder, onChange: setRecordReminder },
            { label: '건강 팁', desc: '매일 건강 팁 알림', value: healthTip, onChange: setHealthTip },
          ].map(({ label, desc, value, onChange }, i, arr) => (
            <View key={label} style={[styles.row, i < arr.length - 1 && styles.rowBorder]}>
              <View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowLabel: { ...typography.body },
  rowDesc: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
});
