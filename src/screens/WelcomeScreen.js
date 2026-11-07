import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useBLE } from '../context/BLEContext';
import { COLORS, SHADOWS } from '../utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(360, SCREEN_WIDTH - 48);

const HERO_SLIDES = [
  {
    id: '1',
    badge: 'SMART WEARABLE',
    iconName: 'shoe-print',
    title: 'Universal Insole Fit',
    subtitle: 'Ultra-thin, flexible force matrix inserts seamlessly into any shoe for continuous all-day analysis.',
    imageUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBz6u8L-dkEJERHMaHVZ07kmMOlffM8ZfQykn-2ruH95jE-9iWwpTtI_ipp6WdXWI1t47wGdBaH-llXHM5IvWp5s7tjkftrA3kNwwGpTMjR6rx1iz3XsRvmLaJh0Cj9WjbWErID-yMzyJoMJ16c72l5WF0dCPC9K9PYfBJmR1cyXEgomE7q9Obj4xZD_WLW9K-ZgW0-TXb6lxsXWNwPlW7KylVXz6IJfyj3dPSYIrLVIcaYgwKAhbP8qQ',
  },
  {
    id: '2',
    badge: 'ON-DEVICE TINYML',
    iconName: 'chart-bell-curve-cumulative',
    title: 'Precision Edge AI',
    subtitle: 'Real-time gait cycle classification directly on ESP32 microcontrollers at up to 120Hz sample rates.',
    imageUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4UBaEtQAycBoU27ZI-5VM5aCG7JIbp-Lv_HxFwGMtv2MsB3a8ApBEXSeCE-NkZMW080Iz2iild3QH6DyAk2D5cE5malgXrFWUKyJeXnSrF4PnqyWTBei3vrHYwVorxxPgFwugaw4SEV7H-BTW1jSGWarJgqFrQbEdpHMxov0Ba_dskKb0ge5DXY6Tydp1YWynTJq9Ms5eIC0HuuTquCrMPFkpScNShDoefxu-S4vtoBE7NNbbTd8Qtg',
  },
  {
    id: '3',
    badge: 'CLINICAL GRADE',
    iconName: 'brain',
    title: 'Proactive Detection',
    subtitle: 'Early biomarker identification for Parkinson’s shuffling, antalgic limping, and elevated fall risk.',
    imageUri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEQglG3Fz5PNkgaOG31AgfU5WG10yhtLzOe207_RO_5v75H4UqBpHW7DaSqVBZHJSmYl4WkoJRWzIspqhYqiXqaGGj-kJMavRZye6KlgiFvNNqRrGBl-p90OamSO4VappjsH23dM5V7kO34gVMFdV0Rdv8tIgfYkBRN6AzLT-mRqTUTr1Be9zqSUZIJTDP9eQJvrr30uhfrrh8T4yGfrmUpts-30lBGhLSaggJNhxQ40NZs4BPngTiAQ',
  },
];

export default function WelcomeScreen({ navigation }) {
  const { completeOnboarding } = useUser ? useUser() : {};
  const { setDemoMode } = useBLE ? useBLE() : {};
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        if (index !== activeIndex && index >= 0 && index < HERO_SLIDES.length) {
          setActiveIndex(index);
        }
      },
    }
  );

  const handleGetStarted = () => {
    if (navigation?.navigate) {
      navigation.navigate('BLEScan');
    }
  };

  const handleDemoMode = async () => {
    if (setDemoMode) setDemoMode(true);
    if (completeOnboarding) {
      await completeOnboarding();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9F9FF" />

      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="shoe-print" size={32} color="#0058BD" />
        </View>
        <Text style={styles.brandTitle}>GaitSense</Text>
        <Text style={styles.brandTagline}>
          Smart Gait Monitoring & Edge-AI Disease Detection
        </Text>
      </View>

      {/* Hero Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
        >
          {HERO_SLIDES.map((slide) => (
            <View key={slide.id} style={styles.slideWrapper}>
              <View style={styles.slideCard}>
                <View style={styles.imageWrap}>
                  <Image source={{ uri: slide.imageUri }} style={styles.cardImage} resizeMode="cover" />
                  <View style={styles.badgeOverlay}>
                    <Text style={styles.badgeOverlayText}>{slide.badge}</Text>
                  </View>
                </View>
                <View style={styles.cardTextContent}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name={slide.iconName} size={22} color="#0058BD" />
                  </View>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {HERO_SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Primary Get Started Button */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleGetStarted}
        >
          <Text style={styles.primaryButtonText}>Pair Smart Insoles</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Demo Mode Button */}
        <TouchableOpacity
          style={styles.demoLink}
          onPress={handleDemoMode}
          activeOpacity={0.7}
        >
          <Text style={styles.demoLinkText}>⚡ Explore with Simulated Telemetry</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FF',
    justifyContent: 'space-between',
  },
  brandHeader: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E2ED',
    marginBottom: 8,
    ...SHADOWS.card,
  },
  brandTitle: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '800',
    color: '#0058BD',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#414755',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 290,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 8,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  slideCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8F3',
    ...SHADOWS.floating,
  },
  imageWrap: {
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F1F3FE',
    position: 'relative',
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 88, 189, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOverlayText: {
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardTextContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F3FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  slideTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '800',
    color: '#181B23',
    marginBottom: 4,
  },
  slideSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#414755',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#0058BD',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#E0E2ED',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#0058BD',
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.floating,
  },
  primaryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoLink: {
    paddingVertical: 6,
  },
  demoLinkText: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: '#0058BD',
  },
});
