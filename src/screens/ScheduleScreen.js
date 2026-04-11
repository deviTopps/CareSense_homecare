import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/colors';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TODAY_INDEX = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

const SCHEDULE = {
  0: [
    { id: '1', patient: 'Akosua Boateng', time: '09:00', end: '10:00', type: 'Morning Care', status: 'completed', icon: 'sunny-outline' },
    { id: '2', patient: 'Kwame Asante', time: '11:30', end: '12:15', type: 'Medication Check', status: 'completed', icon: 'medkit-outline' },
    { id: '3', patient: 'Ama Owusu', time: '14:00', end: '15:30', type: 'Personal Care', status: 'upcoming', icon: 'heart-outline' },
  ],
  1: [
    { id: '4', patient: 'Kofi Adjei', time: '09:30', end: '10:30', type: 'Physiotherapy', status: 'upcoming', icon: 'fitness-outline' },
    { id: '5', patient: 'Efua Mensah', time: '13:00', end: '14:00', type: 'Wound Dressing', status: 'upcoming', icon: 'bandage-outline' },
  ],
  2: [
    { id: '6', patient: 'Akosua Boateng', time: '10:00', end: '11:00', type: 'Morning Care', status: 'upcoming', icon: 'sunny-outline' },
    { id: '7', patient: 'Kwame Asante', time: '14:30', end: '15:00', type: 'Medication', status: 'upcoming', icon: 'medkit-outline' },
    { id: '8', patient: 'Ama Owusu', time: '16:00', end: '17:00', type: 'Evening Care', status: 'upcoming', icon: 'moon-outline' },
  ],
  3: [
    { id: '9', patient: 'Efua Mensah', time: '08:30', end: '09:30', type: 'Morning Care', status: 'upcoming', icon: 'sunny-outline' },
    { id: '10', patient: 'Kofi Adjei', time: '11:00', end: '12:00', type: 'Check-up', status: 'upcoming', icon: 'pulse-outline' },
  ],
  4: [
    { id: '11', patient: 'Akosua Boateng', time: '09:00', end: '10:30', type: 'Personal Care', status: 'upcoming', icon: 'heart-outline' },
    { id: '12', patient: 'Ama Owusu', time: '14:00', end: '15:00', type: 'Medication', status: 'upcoming', icon: 'medkit-outline' },
  ],
  5: [],
  6: [],
};

const statusColors = {
  completed: { bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle' },
  upcoming: { bg: '#FFF8E1', text: '#F57C00', icon: 'time' },
  inprogress: { bg: '#E3F2FD', text: '#1565C0', icon: 'play-circle' },
};

const typeColors = {
  'Morning Care': '#45B6FE',
  'Medication Check': '#2196F3',
  'Medication': '#2196F3',
  'Personal Care': '#9C27B0',
  'Physiotherapy': '#FF5722',
  'Wound Dressing': '#F44336',
  'Check-up': '#00BCD4',
  'Evening Care': '#3F51B5',
};

const ScheduleScreen = () => {
  const [selectedDay, setSelectedDay] = useState(TODAY_INDEX);
  const dayVisits = SCHEDULE[selectedDay] || [];

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - TODAY_INDEX);

  const getDayDate = (i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d.getDate();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>My Schedule</Text>
        <Text style={styles.headerSub}>
          Week of{' '}
          {startOfWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {/* Day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {WEEK_DAYS.map((day, i) => {
            const isSelected = selectedDay === i;
            const isToday = i === TODAY_INDEX;
            const count = (SCHEDULE[i] || []).length;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => setSelectedDay(i)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {day}
                </Text>
                <Text style={[styles.dayDate, isSelected && styles.dayDateSelected]}>
                  {getDayDate(i)}
                </Text>
                {count > 0 && (
                  <View style={[styles.visitCountDot, isSelected && styles.visitCountDotSelected]}>
                    <Text style={[styles.visitCountText, isSelected && styles.visitCountTextSelected]}>
                      {count}
                    </Text>
                  </View>
                )}
                {isToday && !isSelected && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Visit list */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {dayVisits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No visits scheduled</Text>
            <Text style={styles.emptySub}>Enjoy your day off!</Text>
          </View>
        ) : (
          dayVisits.map((visit, index) => {
            const sc = statusColors[visit.status] || statusColors.upcoming;
            const typeColor = typeColors[visit.type] || COLORS.primary;
            return (
              <View key={visit.id} style={styles.timelineRow}>
                {/* Timeline */}
                <View style={styles.timelineLeft}>
                  <Text style={styles.timeText}>{visit.time}</Text>
                  <View style={[styles.timelineDot, { backgroundColor: typeColor }]} />
                  {index < dayVisits.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                {/* Visit card */}
                <TouchableOpacity
                  style={styles.visitCard}
                  activeOpacity={0.88}
                >
                  <View style={styles.visitTop}>
                    <View style={[styles.visitIconBg, { backgroundColor: typeColor + '20' }]}>
                      <Ionicons name={visit.icon} size={20} color={typeColor} />
                    </View>
                    <View style={styles.visitInfo}>
                      <Text style={styles.patientName}>{visit.patient}</Text>
                      <Text style={styles.visitType}>{visit.type}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                      <Ionicons name={sc.icon} size={11} color={sc.text} />
                      <Text style={[styles.statusText, { color: sc.text }]}>
                        {visit.status === 'completed' ? 'Done' : visit.status === 'inprogress' ? 'Active' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.visitBottom}>
                    <View style={styles.timeRange}>
                      <Ionicons name="time-outline" size={13} color={COLORS.grayText} />
                      <Text style={styles.timeRangeText}>
                        {visit.time} – {visit.end}
                      </Text>
                    </View>
                    {visit.status === 'upcoming' && (
                      <TouchableOpacity style={styles.startBtn}>
                        <LinearGradient
                          colors={[COLORS.primary, COLORS.secondary]}
                          style={styles.startBtnGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.startBtnText}>Start Visit</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 3,
    marginBottom: 16,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  daySelector: {
    gap: 8,
    paddingVertical: 4,
  },
  dayBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 52,
    gap: 2,
  },
  dayBtnSelected: {
    backgroundColor: COLORS.white,
  },
  dayName: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  dayNameSelected: {
    color: COLORS.secondary,
  },
  dayDate: {
    fontSize: 18,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
  },
  dayDateSelected: {
    color: COLORS.primary,
  },
  visitCountDot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  visitCountDotSelected: {
    backgroundColor: COLORS.lightGreen,
  },
  visitCountText: {
    fontSize: 10,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
  },
  visitCountTextSelected: {
    color: COLORS.primary,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#FFC107',
    marginTop: 2,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.grayText,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.border,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
    minHeight: 110,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'center',
    paddingTop: 14,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: -4,
  },
  visitCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
    marginLeft: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  visitTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  visitIconBg: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitInfo: { flex: 1 },
  patientName: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
  },
  visitType: {
    fontSize: 12,
    color: COLORS.grayText,
    marginTop: 2,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  visitBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 10,
  },
  timeRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeRangeText: {
    fontSize: 12,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  startBtn: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  startBtnGradient: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  startBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
});

export default ScheduleScreen;
