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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, radius, typography } from '../theme';
import Card from '../components/common/Card';
import type { MainStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function MypageScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  const MENU_SECTIONS = [
    {
      title: '계정',
      items: [
        { label: '프로필 수정', icon: 'person-outline' as const, onPress: () => navigation.navigate('ProfileEdit') },
        { label: '건강 목표 설정', icon: 'trophy-outline' as const, onPress: () => navigation.navigate('HealthGoal') },
      ],
    },
    {
      title: '알림',
      items: [
        { label: '알림 설정', icon: 'notifications-outline' as const, onPress: () => navigation.navigate('NotificationSettings') },
      ],
    },
    {
      title: '데이터',
      items: [
        { label: '데이터 동의 관리', icon: 'shield-checkmark-outline' as const, onPress: () => navigation.navigate('ConsentManagement') },
      ],
    },
    {
      title: '구독',
      items: [
        { label: '프리미엄 구독', icon: 'star-outline' as const, onPress: () => navigation.navigate('Premium', {}) },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>마이페이지</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* 프로필 */}
        <Card padding={20} style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1) || '?'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || '사용자'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            {user?.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>⭐ 프리미엄</Text>
              </View>
            )}
          </View>
        </Card>

        {/* 프리미엄 배너 */}
        {!user?.isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => navigation.navigate('Premium', {})}
          >
            <Text style={styles.premiumBannerEmoji}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumBannerTitle}>프리미엄으로 업그레이드</Text>
              <Text style={styles.premiumBannerSub}>AI 심층 분석, 무제한 리포트 이용</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gold} />
          </TouchableOpacity>
        )}

        {/* 메뉴 섹션 */}
        {MENU_SECTIONS.map(({ title, items }) => (
          <View key={title} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Card padding={0}>
              {items.map(({ label, icon, onPress }, i) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.menuItem, i < items.length - 1 && styles.menuBorder]}
                  onPress={onPress}
                >
                  <Ionicons name={icon} size={20} color={colors.inkMid} />
                  <Text style={styles.menuLabel}>{label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <Text style={styles.version}>검진AI v1.0.0</Text>
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
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.white },
  profileInfo: { flex: 1 },
  userName: { ...typography.h3 },
  userEmail: { ...typography.caption, color: colors.inkSoft, marginTop: 2 },
  premiumBadge: {
    marginTop: 6,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  premiumText: { fontSize: 12, fontWeight: '700', color: colors.gold },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldSoft,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.gold + '40',
  },
  premiumBannerEmoji: { fontSize: 24 },
  premiumBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  premiumBannerSub: { ...typography.caption, color: colors.inkMid, marginTop: 2 },
  section: { gap: 6 },
  sectionTitle: { ...typography.caption, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  menuLabel: { flex: 1, ...typography.body },
  logoutBtn: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  logoutText: { ...typography.body, color: colors.danger },
  version: { ...typography.caption, color: colors.inkSoft, textAlign: 'center' },
});
