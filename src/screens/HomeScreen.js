import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import COLORS from '../constants/colors';

const { width } = Dimensions.get('window');

const MOCK_VISITS_TODAY = [
  {
    id: '1',
    patient: 'Akosua Boateng',
    time: '09:00',
    duration: '1h',
    address: '14 Osu Badu Street, Accra',
    status: 'completed',
    type: 'Morning Care',
  },
  {
    id: '2',
    patient: 'Kwame Asante',
    time: '11:30',
    duration: '45m',
    address: '7 Labone Crescent, Accra',
    status: 'upcoming',
    type: 'Medication',
  },
  {
    id: '3',
    patient: 'Ama Owusu',
    time: '14:00',
    duration: '1h 30m',
    address: '22 Cantonments Rd, Accra',
    status: 'upcoming',
    type: 'Personal Care',
  },
];

const QUICK_STATS = [
  { label: 'Patients Today', value: '3', icon: 'people-outline', bg: COLORS.primary, iconColor: COLORS.white },
  { label: 'Completed', value: '1', icon: 'checkmark-circle-outline', bg: COLORS.secondary, iconColor: COLORS.white },
  { label: 'Upcoming', value: '2', icon: 'time-outline', bg: COLORS.primary, iconColor: COLORS.white },
  { label: 'Reported Incidents', value: '14', icon: 'warning-outline', bg: COLORS.secondary, iconColor: COLORS.white },
];

const statusColors = {
  completed: { bg: '#E8F5E9', text: '#2E7D32', label: 'Completed' },
  upcoming: { bg: '#FFF8E1', text: '#F57C00', label: 'Upcoming' },
  inprogress: { bg: '#E3F2FD', text: '#1565C0', label: 'In Progress' },
};

const HomeScreen = ({ navigation }) => {
  const { nurse, logout } = useAuth();
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* White Top Bar */}
      <View style={styles.topBar}>
        <Image
          source={require('../../assets/main.png')}
          style={styles.topBarLogo}
          resizeMode="contain"
        />
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarIcon}>
            <Ionicons name="search-outline" size={20} color={COLORS.darkText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.darkText} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Gradient Greeting */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.greetingBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.greetingText}>
          {greeting}, {nurse?.name?.split(' ')[0]} 👋
        </Text>
        <Text style={styles.agencyLabel}>{nurse?.agency}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          {QUICK_STATS.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: stat.bg }]}>  
                <Ionicons name={stat.icon} size={20} color={stat.iconColor} />
              </View>
              <View style={styles.statTextCol}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Today's Care Image Banner */}
        <View style={styles.bannerCard}>
          <Image
            source={require('../../assets/health-worker-care.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', COLORS.secondary + 'EE']}
            style={styles.bannerOverlay}
          >
            <Text style={styles.bannerTitle}>Today's Care Plan</Text>
            <Text style={styles.bannerSub}>
              {now.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Patients')}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.actionIcon}>
              <Ionicons name="people" size={22} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.actionLabel}>My Patients</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Schedule')}
          >
            <LinearGradient colors={['#2196F3', '#1565C0']} style={styles.actionIcon}>
              <Ionicons name="calendar" size={22} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.actionLabel}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['#9C27B0', '#6A1B9A']} style={styles.actionIcon}>
              <Ionicons name="document-text" size={22} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.actionLabel}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['#FF5722', '#BF360C']} style={styles.actionIcon}>
              <Ionicons name="alert-circle" size={22} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.actionLabel}>Incident</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
  },
  topBarLogo: {
    width: 150,
    height: 44,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topBarIcon: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF5722',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  greetingBanner: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  agencyLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8F0ED',
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextCol: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.darkText,
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    lineHeight: 14,
  },
  bannerCard: {
    borderRadius: 6,
    overflow: 'hidden',
    height: 130,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
  bannerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
  },
  bannerSub: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.darkText,
  },
  seeAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
  },
  visitCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  visitLeft: { marginRight: 12 },
  timeBadge: {
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    minWidth: 52,
  },
  visitTime: {
    fontSize: 14,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.primary,
  },
  visitDuration: {
    fontSize: 10,
    color: COLORS.secondary,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    marginTop: 2,
  },
  visitInfo: { flex: 1 },
  patientName: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
    marginBottom: 2,
  },
  visitType: {
    fontSize: 12,
    color: COLORS.grayText,
    marginBottom: 4,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  visitAddress: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
    textAlign: 'center',
  },
});

export default HomeScreen;
