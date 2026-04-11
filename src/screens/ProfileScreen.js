import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import COLORS from '../constants/colors';

const MENU_ITEMS = [
  { id: '1', label: 'My Availability', icon: 'calendar-outline', color: '#2196F3', badge: null },
  { id: '2', label: 'Care Notes', icon: 'document-text-outline', color: '#9C27B0', badge: '3 new' },
  { id: '3', label: 'Incident Reports', icon: 'alert-circle-outline', color: '#FF5722', badge: null },
  { id: '4', label: 'Training & Certificates', icon: 'school-outline', color: '#00BCD4', badge: null },
  { id: '5', label: 'Payslips', icon: 'receipt-outline', color: '#4CAF50', badge: null },
  { id: '6', label: 'Contact Supervisor', icon: 'headset-outline', color: '#FFC107', badge: null },
  { id: '7', label: 'Privacy Policy', icon: 'shield-checkmark-outline', color: COLORS.secondary, badge: null },
  { id: '8', label: 'Help & Support', icon: 'help-circle-outline', color: COLORS.grayText, badge: null },
];

const STATS = [
  { label: 'Visits\nCompleted', value: '148', icon: 'checkmark-circle' },
  { label: 'Patients\nAssigned', value: '5', icon: 'people' },
  { label: 'Hours\nThis Month', value: '92h', icon: 'time' },
];

const ProfileScreen = () => {
  const { nurse, logout } = useAuth();
  const [notificationsOn, setNotificationsOn] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the Nurse Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Background image */}
          <Image
            source={require('../../assets/female-nurse-portrait-with-older-patient.jpg')}
            style={styles.headerBgImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={[COLORS.primary + 'BB', COLORS.secondary + 'EE']}
            style={StyleSheet.absoluteFill}
          />

          {/* Logo top right */}
          <View style={styles.headerTopRow}>
            <Text style={styles.pageTitle}>Profile</Text>
            <View style={styles.logoBg}>
              <Image
                source={require('../../assets/main.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Nurse avatar + info */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={48} color={COLORS.primary} />
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <Text style={styles.nurseName}>{nurse?.name}</Text>
          <Text style={styles.nurseRole}>{nurse?.role}</Text>

          {/* Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Ionicons name="id-card-outline" size={13} color={COLORS.white} />
              <Text style={styles.badgeText}>{nurse?.badge}</Text>
            </View>
            <View style={styles.badgePill}>
              <Ionicons name="business-outline" size={13} color={COLORS.white} />
              <Text style={styles.badgeText}>{nurse?.agency}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats row */}
        <View style={styles.statsContainer}>
          {STATS.map((stat, i) => (
            <React.Fragment key={i}>
              <View style={styles.statItem}>
                <Ionicons name={stat.icon} size={20} color={COLORS.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
              {i < STATS.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Contact info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="call-outline" size={18} color="#1565C0" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{nurse?.phone}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.lightGreen }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Nurse PIN</Text>
                <Text style={styles.infoValue}>•••• (Secure)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
                  <View style={[styles.menuIconBg, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <View style={styles.menuRight}>
                    {item.badge && (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
                  </View>
                </TouchableOpacity>
                {i < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.versionText}>CareSense Nurse App v1.0.0</Text>
        <Text style={styles.footerText}>© 2026 CareSense</Text>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 280,
    justifyContent: 'flex-end',
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  headerTopRow: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
  },
  logoBg: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: 32, height: 32 },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: COLORS.white,
  },
  nurseName: {
    fontSize: 22,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
    marginBottom: 3,
  },
  nurseRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.darkText,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.grayText,
    textAlign: 'center',
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    lineHeight: 15,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.darkText,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.darkText,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    marginTop: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: 6,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBg: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkText,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  menuBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginLeft: 62,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#FFEBEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.error,
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.grayText,
    fontSize: 12,
    marginTop: 24,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  footerText: {
    textAlign: 'center',
    color: COLORS.border,
    fontSize: 11,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    marginTop: 4,
  },
});

export default ProfileScreen;
