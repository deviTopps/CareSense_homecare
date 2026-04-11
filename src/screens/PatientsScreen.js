import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/colors';

const userImages = [
  require('../../assets/user1.jpg'),
  require('../../assets/user2.jpg'),
  require('../../assets/user3.jpg'),
];

const PATIENTS = [
  {
    id: '1',
    name: 'Akosua Boateng',
    age: 82,
    condition: 'Dementia, Hypertension',
    address: '14 Osu Badu Street, Accra',
    nextVisit: 'Today, 11:30',
    status: 'Active',
    gender: 'Female',
    phone: '+233 20 312 4501',
    careLevel: 'High',
    image: require('../../assets/elderly-care-1.jpg'),
  },
  {
    id: '2',
    name: 'Kwame Asante',
    age: 79,
    condition: 'Diabetes, Mobility Issues',
    address: '7 Labone Crescent, Accra',
    nextVisit: 'Today, 14:00',
    status: 'Active',
    gender: 'Male',
    phone: '+233 24 567 8902',
    careLevel: 'Medium',
    image: require('../../assets/elderly-care-2.jpg'),
  },
  {
    id: '3',
    name: 'Ama Owusu',
    age: 88,
    condition: 'Arthritis, Heart Disease',
    address: '22 Cantonments Rd, Accra',
    nextVisit: 'Tomorrow, 09:00',
    status: 'Active',
    gender: 'Female',
    phone: '+233 27 890 1203',
    careLevel: 'High',
    image: require('../../assets/nurse-patient-1.jpg'),
  },
  {
    id: '4',
    name: 'Kofi Adjei',
    age: 75,
    condition: 'COPD, Depression',
    address: '5 Dzorwulu Avenue, Accra',
    nextVisit: 'Thu, 10:00',
    status: 'Active',
    gender: 'Male',
    phone: '+233 50 234 5604',
    careLevel: 'Medium',
    image: require('../../assets/health-worker-care.jpg'),
  },
  {
    id: '5',
    name: 'Efua Mensah',
    age: 91,
    condition: 'Stroke, Parkinson\'s',
    address: '31 East Legon Hills, Accra',
    nextVisit: 'Fri, 08:30',
    status: 'Active',
    gender: 'Female',
    phone: '+233 26 678 9005',
    careLevel: 'Critical',
    image: require('../../assets/elderly-care-2.jpg'),
  },
];

const careLevelColors = {
  Low: { bg: '#E8F5E9', text: '#2E7D32', dot: '#2E7D32' },
  Medium: { bg: '#FFF8E1', text: '#F57C00', dot: '#F57C00' },
  High: { bg: '#FFF3E0', text: '#E65100', dot: '#E65100' },
  Critical: { bg: '#FFEBEE', text: '#C62828', dot: '#C62828' },
};

const PatientsScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const filtered = PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.condition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Patients</Text>
          <Text style={styles.headerSub}>{PATIENTS.length} assigned to you</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.grayText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or condition..."
            placeholderTextColor="#A0B0BA"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.grayText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Patient List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={32} color={COLORS.grayText} />
            <Text style={styles.emptyText}>No patients found</Text>
          </View>
        ) : (
          filtered.map((patient) => {
            const cl = careLevelColors[patient.careLevel] || careLevelColors['Low'];
            const imgIndex = (parseInt(patient.id) - 1) % userImages.length;
            return (
              <TouchableOpacity
                key={patient.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PatientDetail', { patient })}
              >
                <View style={styles.cardLeft}>
                  <Image source={userImages[imgIndex]} style={styles.avatar} />
                </View>

                <View style={styles.cardCenter}>
                  <View style={styles.nameRow}>
                    <Text style={styles.patientName} numberOfLines={1}>{patient.name}</Text>
                    <View style={[styles.careBadge, { backgroundColor: cl.bg }]}>
                      <Text style={[styles.careText, { color: cl.text }]}>{patient.careLevel}</Text>
                    </View>
                  </View>
                  <Text style={styles.conditionText} numberOfLines={1}>{patient.condition}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{patient.gender}, {patient.age} yrs</Text>
                    <View style={styles.metaDot} />
                    <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.visitText}>{patient.nextVisit}</Text>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.grayText} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
  },
  headerSub: {
    color: COLORS.grayText,
    fontSize: 14,
    marginTop: 2,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
  },
  searchWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 3,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkText,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F4',
  },
  cardLeft: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  cardCenter: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientName: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText,
    flexShrink: 1,
  },
  careBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
  },
  careText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  conditionText: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.grayText,
    marginHorizontal: 2,
  },
  visitText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.primary,
  },
  cardRight: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.grayText,
  },
});

export default PatientsScreen;
