import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/colors';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('../../assets/nurse-patient-1.jpg'),
    title: 'Compassionate Care',
    description: 'Deliver quality homecare services to elderly patients with dignity and compassion.',
  },
  {
    id: '2',
    image: require('../../assets/health-worker-care.jpg'),
    title: 'Manage Your Visits',
    description: 'View your schedule, track visits, and manage patient care plans all in one place.',
  },
  {
    id: '3',
    image: require('../../assets/elderly-care-2.jpg'),
    title: 'Stay Connected',
    description: 'Keep in touch with your team and supervisors for seamless care coordination.',
  },
];

const SplashScreen = ({ onFinish }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      onFinish();
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.slideImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.1)', COLORS.secondary + 'DD', COLORS.secondary]}
          style={styles.overlay}
          locations={[0, 0.35, 0.7, 1]}
        />
        <View style={styles.slideContent}>
          <Text style={styles.slideTitle}>{item.title}</Text>
          <Text style={styles.slideDescription}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity: dotOpacity, backgroundColor: COLORS.white },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.nextBtn} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.primary, '#009B6A']}
            style={styles.nextBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextBtnText}>
              {activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  slide: {
    width: width,
    height: height,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContent: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  slideTitle: {
    fontSize: 26,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  slideDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingTop: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 50,
  },
  skipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  nextBtnGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
});

export default SplashScreen;
