import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, radius, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  bg: string;
}

const slides: Slide[] = [
  {
    id: '1',
    emoji: '📋',
    title: 'AI가 분석하는\n건강검진 결과',
    subtitle: '건강보험공단 검진 PDF를 올리거나\n수치를 입력하면 AI가 즉시 분석해요',
    bg: '#E3F8F3',
  },
  {
    id: '2',
    emoji: '💊',
    title: '약봉투·병원진료도\n한눈에 정리',
    subtitle: '사진 한 장으로 약 성분, 복용법,\n병원 진단 내용을 AI가 요약해요',
    bg: '#EAF4FF',
  },
  {
    id: '3',
    emoji: '📈',
    title: '혈압·혈당을\n매일 기록하고 트렌드 확인',
    subtitle: '일상 건강 데이터를 기록하고\nAI 코치의 맞춤 조언을 받아보세요',
    bg: '#FFF3E0',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);

  const next = async () => {
    if (current < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    } else {
      await SecureStore.setItemAsync('onboarded', '1');
      navigation.replace('Auth');
    }
  };

  const skip = async () => {
    await SecureStore.setItemAsync('onboarded', '1');
    navigation.replace('Auth');
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.base }]}>
      <TouchableOpacity style={styles.skipBtn} onPress={skip}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.list}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === current && styles.dotActive]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.nextBtn} onPress={next}>
        <Text style={styles.nextText}>
          {current === slides.length - 1 ? '시작하기' : '다음'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: spacing.base,
    marginTop: 52,
  },
  skipText: {
    ...typography.bodyMid,
    color: colors.inkSoft,
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMid,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: radius.full,
    width: width - 48,
    alignItems: 'center',
  },
  nextText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
