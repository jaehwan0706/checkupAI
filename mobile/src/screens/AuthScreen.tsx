import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { authApi, userApi } from '../api';
import { useAuthStore } from '../store/authStore';
import { colors, spacing, radius, typography } from '../theme';
import Button from '../components/common/Button';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { setToken, setUser } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { token, name: userName, email: userEmail, userId } = res.data;
      await setToken(token);
      await setUser({ userId, name: userName, email: userEmail });
      // RootNavigator가 isLoggedIn=true를 감지해 Main으로 자동 전환
    } catch (e: any) {
      Alert.alert('로그인 실패', e.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !name) return Alert.alert('알림', '모든 항목을 입력해주세요.');
    setLoading(true);
    try {
      const res = await authApi.signup({ name, email, password, birthDate: '', gender: '' });
      const { token } = res.data;
      // setToken 호출 시 isLoggedIn=true가 되어 ExtraInfo 스택이 사라지므로
      // SecureStore에만 저장하고 ExtraInfo에서 setToken 완료
      await SecureStore.setItemAsync('token', token);
      navigation.replace('ExtraInfo', { token });
    } catch (e: any) {
      Alert.alert('회원가입 실패', e.response?.data?.message || '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const redirectUrl = Linking.createURL('/kakao-callback');
      const result = await WebBrowser.openAuthSessionAsync(
        authApi.getKakaoLoginUrl(),
        redirectUrl
      );
      if (result.type === 'success' && result.url) {
        const tokenMatch = result.url.match(/[?&]token=([^&]+)/);
        if (tokenMatch) {
          const token = decodeURIComponent(tokenMatch[1]);
          await setToken(token);
          try {
            const meRes = await userApi.getMe();
            await setUser(meRes.data);
          } catch {}
          // RootNavigator가 isLoggedIn=true를 감지해 Main으로 자동 전환
        }
      }
    } catch {
      Alert.alert('카카오 로그인 실패', '다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>🩺</Text>
        <Text style={styles.title}>검진AI</Text>
        <Text style={styles.subtitle}>AI가 분석하는 나의 건강</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>로그인</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'signup' && styles.tabActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>회원가입</Text>
          </TouchableOpacity>
        </View>

        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="이름"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            placeholderTextColor={colors.inkSoft}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.inkSoft}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.inkSoft}
        />

        <Button
          label={mode === 'login' ? '로그인' : '회원가입'}
          onPress={mode === 'login' ? handleLogin : handleSignup}
          loading={loading}
          style={styles.btn}
          size="lg"
        />

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.kakaoBtn} onPress={handleKakaoLogin}>
          <Text style={styles.kakaoText}>🟡  카카오로 로그인</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyMid,
    color: colors.inkSoft,
    marginBottom: 36,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.lineSoft,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 24,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    ...typography.label,
    color: colors.inkSoft,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 12,
    backgroundColor: colors.white,
  },
  btn: {
    width: '100%',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  kakaoBtn: {
    width: '100%',
    backgroundColor: '#FEE500',
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  kakaoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3C1E1E',
  },
});
