import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { homeApi } from '../api';
import { colors, spacing, typography } from '../theme';
import Header from '../components/common/Header';
import Card from '../components/common/Card';

export default function NotificationListScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeApi.getNotifications()
      .then((r) => setNotifications(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="알림" onBack={() => navigation.goBack()} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyText}>알림이 없습니다</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: spacing.base, gap: 8 }}
          renderItem={({ item }) => (
            <Card padding={14}>
              <Text style={styles.notifTitle}>{item.title || item.message}</Text>
              <Text style={styles.notifDate}>{item.createdAt?.slice(0, 10)}</Text>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { ...typography.bodyMid, color: colors.inkSoft },
  notifTitle: { ...typography.body, color: colors.ink },
  notifDate: { ...typography.caption, color: colors.inkSoft, marginTop: 4 },
});
