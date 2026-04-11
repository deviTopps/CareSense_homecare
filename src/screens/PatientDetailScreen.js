import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/colors';

const userImages = [
  require('../../assets/user1.jpg'),
  require('../../assets/user2.jpg'),
  require('../../assets/user3.jpg'),
];

const VITAL_FIELDS = [
  { key: 'bloodPressure', label: 'Blood Pressure', placeholder: 'e.g. 120/80', unit: 'mmHg' },
  { key: 'heartRate', label: 'Heart Rate', placeholder: 'e.g. 72', unit: 'bpm', keyboard: 'numeric' },
  { key: 'temperature', label: 'Temperature', placeholder: 'e.g. 36.6', unit: '°C', keyboard: 'decimal-pad' },
  { key: 'oxygenSaturation', label: 'Oxygen Saturation', placeholder: 'e.g. 98', unit: '%', keyboard: 'numeric' },
  { key: 'respiratoryRate', label: 'Respiratory Rate', placeholder: 'e.g. 16', unit: '/min', keyboard: 'numeric' },
  { key: 'bloodSugar', label: 'Blood Sugar', placeholder: 'e.g. 5.5', unit: 'mmol/L', keyboard: 'decimal-pad' },
  { key: 'weight', label: 'Weight', placeholder: 'e.g. 68', unit: 'kg', keyboard: 'decimal-pad' },
];

const VITAL_VALIDATION = {
  bloodPressure: (val) => {
    const parts = val.split('/');
    if (parts.length !== 2) return { type: 'error', msg: 'Enter BP as systolic/diastolic (e.g. 120/80).' };
    const sys = parseInt(parts[0]), dia = parseInt(parts[1]);
    if (isNaN(sys) || isNaN(dia)) return { type: 'error', msg: 'Both values must be numbers (e.g. 120/80).' };
    if (sys < 60) return { type: 'warning', msg: 'Systolic BP is critically low (below 60 mmHg). This may indicate hypotension or shock.' };
    if (sys > 180) return { type: 'critical', msg: 'Systolic BP exceeds 180 mmHg — hypertensive crisis range. Verify the reading and consider urgent medical review.' };
    if (sys > 140) return { type: 'warning', msg: 'Systolic BP is above 140 mmHg, indicating high blood pressure (hypertension). Monitor closely.' };
    if (dia < 40) return { type: 'warning', msg: 'Diastolic BP is very low (below 40 mmHg). This may indicate poor cardiac output.' };
    if (dia > 120) return { type: 'critical', msg: 'Diastolic BP exceeds 120 mmHg — hypertensive emergency range. Seek immediate medical attention.' };
    if (dia > 90) return { type: 'warning', msg: 'Diastolic BP is above 90 mmHg, suggesting high blood pressure. Monitor and report.' };
    return null;
  },
  heartRate: (val) => {
    const v = parseInt(val);
    if (isNaN(v)) return { type: 'error', msg: 'Heart rate must be a number.' };
    if (v < 30) return { type: 'critical', msg: 'Heart rate below 30 bpm is dangerously low (severe bradycardia). Verify reading and seek immediate medical review.' };
    if (v < 50) return { type: 'warning', msg: 'Heart rate below 50 bpm indicates bradycardia. Patient may feel dizzy or faint. Monitor closely.' };
    if (v > 150) return { type: 'critical', msg: 'Heart rate above 150 bpm is dangerously high (severe tachycardia). Verify reading and consider urgent review.' };
    if (v > 100) return { type: 'warning', msg: 'Heart rate above 100 bpm indicates tachycardia. Could be due to pain, fever, anxiety, or cardiac issues.' };
    return null;
  },
  temperature: (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return { type: 'error', msg: 'Temperature must be a number.' };
    if (v < 34) return { type: 'critical', msg: 'Temperature below 34°C indicates severe hypothermia. This is a medical emergency requiring immediate warming.' };
    if (v < 35) return { type: 'warning', msg: 'Temperature below 35°C indicates hypothermia. The patient may be cold, confused, or drowsy.' };
    if (v > 40) return { type: 'critical', msg: 'Temperature above 40°C is a high fever (hyperthermia). Risk of febrile seizures. Seek urgent medical review.' };
    if (v > 38) return { type: 'warning', msg: 'Temperature above 38°C indicates a fever. May be caused by infection. Monitor and consider medication review.' };
    return null;
  },
  oxygenSaturation: (val) => {
    const v = parseInt(val);
    if (isNaN(v)) return { type: 'error', msg: 'Oxygen saturation must be a number.' };
    if (v > 100) return { type: 'error', msg: 'SpO₂ cannot exceed 100%. Please check the reading.' };
    if (v < 85) return { type: 'critical', msg: 'SpO₂ below 85% is critically low. Patient may be in respiratory distress. Administer oxygen and seek emergency care.' };
    if (v < 92) return { type: 'warning', msg: 'SpO₂ below 92% is below normal. Patient may have breathing difficulties. Monitor closely and consider supplemental oxygen.' };
    return null;
  },
  respiratoryRate: (val) => {
    const v = parseInt(val);
    if (isNaN(v)) return { type: 'error', msg: 'Respiratory rate must be a number.' };
    if (v < 8) return { type: 'critical', msg: 'Respiratory rate below 8/min is dangerously low. May indicate respiratory depression. Seek immediate review.' };
    if (v < 12) return { type: 'warning', msg: 'Respiratory rate below 12/min is low (bradypnoea). May be caused by medication or neurological issues.' };
    if (v > 30) return { type: 'critical', msg: 'Respiratory rate above 30/min is critically high. Patient may be in acute respiratory distress.' };
    if (v > 20) return { type: 'warning', msg: 'Respiratory rate above 20/min is elevated (tachypnoea). Could indicate pain, infection, or anxiety.' };
    return null;
  },
  bloodSugar: (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return { type: 'error', msg: 'Blood sugar must be a number.' };
    if (v < 2.0) return { type: 'critical', msg: 'Blood sugar below 2.0 mmol/L is severely low (hypoglycaemia). Risk of seizures or loss of consciousness. Give fast-acting sugar immediately.' };
    if (v < 4.0) return { type: 'warning', msg: 'Blood sugar below 4.0 mmol/L is low (hypoglycaemia). Patient may feel shaky, sweaty, or confused. Offer a sugary snack.' };
    if (v > 20) return { type: 'critical', msg: 'Blood sugar above 20 mmol/L is dangerously high (severe hyperglycaemia). Risk of diabetic ketoacidosis. Seek urgent medical review.' };
    if (v > 11) return { type: 'warning', msg: 'Blood sugar above 11 mmol/L is high (hyperglycaemia). May indicate poor glucose control. Review medication and diet.' };
    return null;
  },
  weight: (val) => {
    const v = parseFloat(val);
    if (isNaN(v)) return { type: 'error', msg: 'Weight must be a number.' };
    if (v < 20) return { type: 'warning', msg: 'Weight below 20 kg is unusually low for an adult. Please verify the reading is correct.' };
    if (v > 250) return { type: 'warning', msg: 'Weight above 250 kg is unusually high. Please verify the reading is correct.' };
    return null;
  },
};

const careLevelColors = {
  Low: { bg: '#E8F5E9', text: '#2E7D32' },
  Medium: { bg: '#FFF8E1', text: '#F57C00' },
  High: { bg: '#FFF3E0', text: '#E65100' },
  Critical: { bg: '#FFEBEE', text: '#C62828' },
};

const PatientDetailScreen = ({ route, navigation }) => {
  const { patient } = route.params;
  const cl = careLevelColors[patient.careLevel] || careLevelColors['Low'];

  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({});
  const [fieldWarnings, setFieldWarnings] = useState({});
  const [notes, setNotes] = useState('');

  // Medication modal
  const [showMedModal, setShowMedModal] = useState(false);
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', route: '', startDate: '', notes: '' });
  const [medSearch, setMedSearch] = useState('');
  const [showMedDropdown, setShowMedDropdown] = useState(false);
  const [showMedFreqDropdown, setShowMedFreqDropdown] = useState(false);
  const [showMedRouteDropdown, setShowMedRouteDropdown] = useState(false);
  const [customMeds, setCustomMeds] = useState([]);

  const MEDICATIONS = [
    'Metformin', 'Amlodipine', 'Lisinopril', 'Atorvastatin', 'Omeprazole',
    'Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Ciprofloxacin', 'Metoprolol',
    'Aspirin', 'Losartan', 'Furosemide', 'Warfarin', 'Insulin Glargine',
    'Hydrochlorothiazide', 'Simvastatin', 'Clopidogrel', 'Gabapentin', 'Tramadol',
    'Diclofenac', 'Prednisolone', 'Salbutamol', 'Azithromycin', 'Doxycycline',
    'Nifedipine', 'Digoxin', 'Spironolactone', 'Captopril', 'Glibenclamide',
    'Ranitidine', 'Diazepam', 'Morphine', 'Codeine', 'Chloroquine',
    'Artemether-Lumefantrine', 'Folic Acid', 'Ferrous Sulphate', 'Vitamin B Complex',
    'Multivitamin', 'Calcium Carbonate', 'Vitamin D3', 'Erythromycin', 'Fluconazole',
  ];

  const MED_FREQUENCIES = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 8 hours', 'Every 12 hours', 'Once weekly', 'As needed (PRN)',
    'At bedtime', 'Before meals', 'After meals', 'Every other day',
  ];

  const MED_ROUTES = [
    'Oral', 'Sublingual', 'Topical', 'Intravenous (IV)', 'Intramuscular (IM)',
    'Subcutaneous', 'Inhalation', 'Rectal', 'Ophthalmic (Eye)', 'Otic (Ear)',
    'Nasal', 'Transdermal Patch',
  ];

  const allMeds = [...MEDICATIONS, ...customMeds].sort();
  const filteredMeds = medSearch.trim()
    ? allMeds.filter(m => m.toLowerCase().includes(medSearch.trim().toLowerCase()))
    : allMeds;
  const canAddCustomMed = medSearch.trim().length > 1 &&
    !allMeds.some(m => m.toLowerCase() === medSearch.trim().toLowerCase());

  // Incident modal
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentForm, setIncidentForm] = useState({ type: '', date: '', time: '', description: '', actionTaken: '', witnesses: '' });
  const [showIncidentTypeDropdown, setShowIncidentTypeDropdown] = useState(false);

  const INCIDENT_TYPES = [
    'Fall', 'Medication Error', 'Allergic Reaction', 'Injury', 'Skin Tear',
    'Behavioral Incident', 'Choking', 'Burns', 'Infection', 'Missing Property',
    'Wandering / Elopement', 'Equipment Malfunction', 'Abuse / Neglect',
    'Pressure Injury', 'Unresponsive Episode', 'Seizure', 'Death', 'Other',
  ];

  // Observation modal
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [observationForm, setObservationForm] = useState({ category: '', mood: '', mobility: '', skinCondition: '', appetite: '', notes: '' });
  const [openDropdown, setOpenDropdown] = useState(null);

  const OBS_OPTIONS = {
    category: ['General', 'Behavioral', 'Physical', 'Cognitive', 'Emotional', 'Social'],
    mood: ['Happy', 'Calm', 'Anxious', 'Agitated', 'Withdrawn', 'Confused', 'Depressed', 'Irritable'],
    mobility: ['Independent', 'Assisted Walking', 'Wheelchair', 'Bed-bound', 'Uses Walker', 'Uses Cane'],
    skinCondition: ['Normal', 'Dry', 'Rash', 'Bruising', 'Pressure Sore', 'Swelling', 'Wound', 'Discoloration'],
    appetite: ['Good', 'Fair', 'Poor', 'Refused Meals', 'Eating Well', 'Reduced Intake', 'Increased Appetite'],
  };

  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', priority: '' });

  // Record lists
  const [medicationList, setMedicationList] = useState([
    { id: '1', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', route: 'Oral', startDate: '2025-11-10', notes: 'Take after meals', date: '10 Nov 2025' },
    { id: '2', name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', route: 'Oral', startDate: '2025-09-05', notes: 'For blood pressure control', date: '05 Sep 2025' },
    { id: '3', name: 'Aspirin', dosage: '75mg', frequency: 'Once daily', route: 'Oral', startDate: '2026-01-15', notes: '', date: '15 Jan 2026' },
  ]);
  const [incidentList, setIncidentList] = useState([
    { id: '1', type: 'Fall', date: '20 Mar 2026', time: '08:45', description: 'Patient slipped on wet floor in bathroom. No visible injuries but complained of mild knee pain.', actionTaken: 'Applied ice pack to knee. Monitored for 2 hours. Advised family to install non-slip mats.', witnesses: 'Ama Owusu (Caregiver)' },
  ]);
  const [observationList, setObservationList] = useState([
    { id: '1', category: 'General', mood: 'Calm', mobility: 'Assisted Walking', skinCondition: 'Normal', appetite: 'Good', notes: 'Patient in good spirits today. Eating well and engaged in conversation.', date: '24 Mar 2026, 11:00' },
  ]);
  const [expandedMeds, setExpandedMeds] = useState({});
  const [expandedIncidents, setExpandedIncidents] = useState({});
  const [expandedObs, setExpandedObs] = useState({});

  const [vitalsHistory, setVitalsHistory] = useState([
    {
      id: '1',
      date: '24 Mar 2026, 10:30',
      bloodPressure: '130/85',
      heartRate: '78',
      temperature: '36.8',
      oxygenSaturation: '97',
      respiratoryRate: '18',
      bloodSugar: '6.2',
      weight: '72',
      notes: 'Slightly elevated BP. Patient reports feeling well.',
    },
    {
      id: '2',
      date: '22 Mar 2026, 09:15',
      bloodPressure: '125/80',
      heartRate: '74',
      temperature: '36.5',
      oxygenSaturation: '98',
      respiratoryRate: '16',
      bloodSugar: '5.8',
      weight: '72',
      notes: 'All vitals within normal range.',
    },
  ]);
  const [expandedCards, setExpandedCards] = useState({});

  const handleSaveVitals = () => {
    const filledFields = Object.values(vitalsForm).filter(v => v && v.trim());
    if (filledFields.length === 0) {
      Alert.alert('Missing Data', 'Please enter at least one vital reading.');
      return;
    }

    // Check for validation errors (not warnings)
    const errors = Object.entries(fieldWarnings).filter(([_, w]) => w && w.type === 'error');
    if (errors.length > 0) {
      Alert.alert('Invalid Values', 'Please fix the fields marked in red before saving.');
      return;
    }

    // Check for critical warnings — confirm before saving
    const criticals = Object.entries(fieldWarnings).filter(([_, w]) => w && w.type === 'critical');
    if (criticals.length > 0) {
      Alert.alert(
        'Critical Values Detected',
        'Some readings are in the critical range. Are you sure you want to save?',
        [
          { text: 'Review', style: 'cancel' },
          { text: 'Save Anyway', style: 'destructive', onPress: () => doSave() },
        ]
      );
      return;
    }

    doSave();
  };

  const doSave = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const newRecord = {
      id: String(Date.now()),
      date: dateStr,
      ...vitalsForm,
      notes,
    };

    setVitalsHistory([newRecord, ...vitalsHistory]);
    setVitalsForm({});
    setFieldWarnings({});
    setNotes('');
    setShowVitalsModal(false);
    Alert.alert('Vitals Recorded', `Vitals for ${patient.name} have been saved successfully.`);
  };

  const updateField = (key, value) => {
    setVitalsForm(prev => ({ ...prev, [key]: value }));
    // Run validation
    if (value && value.trim()) {
      const validator = VITAL_VALIDATION[key];
      if (validator) {
        const result = validator(value.trim());
        setFieldWarnings(prev => ({ ...prev, [key]: result }));
      }
    } else {
      setFieldWarnings(prev => ({ ...prev, [key]: null }));
    }
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveMedication = () => {
    if (!medForm.name.trim() || !medForm.dosage.trim()) {
      Alert.alert('Required Fields', 'Please enter at least the medication name and dosage.');
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const newMed = { id: String(Date.now()), ...medForm, date: dateStr };
    setMedicationList(prev => [newMed, ...prev]);
    setMedForm({ name: '', dosage: '', frequency: '', route: '', startDate: '', notes: '' });
    setMedSearch('');
    setShowMedDropdown(false);
    setShowMedModal(false);
    Alert.alert('Medication Added', `${medForm.name} has been added to ${patient.name}'s medications.`);
  };

  const handleSaveIncident = () => {
    if (!incidentForm.type.trim() || !incidentForm.description.trim()) {
      Alert.alert('Required Fields', 'Please enter the incident type and description.');
      return;
    }
    const now = new Date();
    const dateStr = incidentForm.date || now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = incidentForm.time || now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newIncident = { id: String(Date.now()), ...incidentForm, date: dateStr, time: timeStr };
    setIncidentList(prev => [newIncident, ...prev]);
    setIncidentForm({ type: '', date: '', time: '', description: '', actionTaken: '', witnesses: '' });
    setShowIncidentTypeDropdown(false);
    setShowIncidentModal(false);
    Alert.alert('Incident Reported', `Incident report for ${patient.name} has been submitted.`);
  };

  const handleSaveObservation = () => {
    if (!observationForm.notes.trim() && !observationForm.mood) {
      Alert.alert('Required Fields', 'Please fill in at least one observation field.');
      return;
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const newObs = { id: String(Date.now()), ...observationForm, date: dateStr };
    setObservationList(prev => [newObs, ...prev]);
    setObservationForm({ category: '', mood: '', mobility: '', skinCondition: '', appetite: '', notes: '' });
    setOpenDropdown(null);
    setShowObservationModal(false);
    Alert.alert('Observation Saved', `Observation report for ${patient.name} has been saved.`);
  };

  const handleSaveNote = () => {
    if (!noteForm.content.trim()) {
      Alert.alert('Required Field', 'Please enter the note content.');
      return;
    }
    setNoteForm({ title: '', content: '', priority: '' });
    setShowNoteModal(false);
    Alert.alert('Note Added', `Note for ${patient.name} has been saved.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View style={[styles.careLevelBadge, { backgroundColor: cl.bg }]}>
            <Text style={[styles.careLevelText, { color: cl.text }]}>
              {patient.careLevel} Care
            </Text>
          </View>
        </View>
        <View style={styles.headerBottom}>
          <Image
            source={userImages[(parseInt(patient.id) - 1) % userImages.length]}
            style={styles.patientAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.patientName} numberOfLines={1}>{patient.name}</Text>
            <Text style={styles.patientMeta} numberOfLines={1}>
              {patient.gender}, {patient.age} yrs
            </Text>
            <Text style={styles.patientCondition} numberOfLines={1}>
              {patient.condition}
            </Text>
          </View>
          <TouchableOpacity style={styles.startCarePlanBtn} activeOpacity={0.85} onPress={() => navigation.navigate('CarePlan', { patient })}>
            <Ionicons name="play-circle" size={16} color={COLORS.white} />
            <Text style={styles.startCarePlanText}>Start Care Plan</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Info Cards */}
        <View style={styles.quickInfoRow}>
          <View style={styles.quickInfoCard}>
            <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickInfoLabel}>Address</Text>
            <Text style={styles.quickInfoValue}>{patient.address}</Text>
          </View>
          <View style={styles.quickInfoCard}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickInfoLabel}>Phone</Text>
            <Text style={styles.quickInfoValue}>{patient.phone}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => setShowVitalsModal(true)}
            >
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="heart-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.actionBtnLabel}>Record{"\n"}Vitals</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={() => setShowMedModal(true)}>
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.secondary }]}>
                <Ionicons name="medkit-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.actionBtnLabel}>Add{"\n"}Medication</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={() => setShowIncidentModal(true)}>
              <View style={[styles.actionIconBg, { backgroundColor: '#C62828' }]}>
                <Ionicons name="warning-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.actionBtnLabel}>Report{"\n"}Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={() => setShowObservationModal(true)}>
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="clipboard-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.actionBtnLabel}>Observation{"\n"}Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={() => setShowNoteModal(true)}>
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.secondary }]}>
                <Ionicons name="create-outline" size={20} color={COLORS.white} />
              </View>
              <Text style={styles.actionBtnLabel}>Add{"\n"}Note</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient Records Card */}
        <View style={styles.recordsCard}>

          {/* Vitals History */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vitals History</Text>
            <Text style={styles.sectionCount}>{vitalsHistory.length} records</Text>
          </View>

        {vitalsHistory.map((record) => {
          const isExpanded = expandedCards[record.id];
          return (
            <View key={record.id} style={styles.vitalsCard}>
              <TouchableOpacity
                style={styles.vitalsCardHeader}
                activeOpacity={0.7}
                onPress={() => toggleCard(record.id)}
              >
                <Text style={styles.vitalsDate}>{record.date}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.grayText}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.vitalsBody}>
                  <View style={styles.vitalsGrid}>
                    {record.bloodPressure ? (
                      <View style={styles.vitalItem}>
                        <Text style={styles.vitalLabel}>Blood Pressure</Text>
                        <Text style={styles.vitalValue}>{record.bloodPressure} <Text style={styles.vitalUnit}>mmHg</Text></Text>
                      </View>
                    ) : null}
                    {record.heartRate ? (
                      <View style={styles.vitalItem}>
                        <Text style={styles.vitalLabel}>Heart Rate</Text>
                        <Text style={styles.vitalValue}>{record.heartRate} <Text style={styles.vitalUnit}>bpm</Text></Text>
                      </View>
                    ) : null}
                    {record.temperature ? (
                      <View style={styles.vitalItem}>
                        <Text style={styles.vitalLabel}>Temperature</Text>
                        <Text style={styles.vitalValue}>{record.temperature} <Text style={styles.vitalUnit}>°C</Text></Text>
                      </View>
                    ) : null}
                    {record.oxygenSaturation ? (
                      <View style={styles.vitalItem}>
                        <Text style={styles.vitalLabel}>SpO₂</Text>
                        <Text style={styles.vitalValue}>{record.oxygenSaturation} <Text style={styles.vitalUnit}>%</Text></Text>
                      </View>
                    ) : null}
                    {record.respiratoryRate ? (
                      <View style={styles.vitalItem}>
                        <Text style={styles.vitalLabel}>Resp Rate</Text>
                        <Text style={styles.vitalValue}>{record.respiratoryRate} <Text style={styles.vitalUnit}>/min</Text></Text>
                      </View>
                    ) : null}
                    {record.bloodSugar ? (
                      <View style={styles.vitalItem}>
                        <Text style={styles.vitalLabel}>Blood Sugar</Text>
                        <Text style={styles.vitalValue}>{record.bloodSugar} <Text style={styles.vitalUnit}>mmol/L</Text></Text>
                      </View>
                    ) : null}
                    {record.weight ? (
                      <View style={styles.vitalItem}>
                        <Text style={styles.vitalLabel}>Weight</Text>
                        <Text style={styles.vitalValue}>{record.weight} <Text style={styles.vitalUnit}>kg</Text></Text>
                      </View>
                    ) : null}
                  </View>

                  {record.notes ? (
                    <View style={styles.vitalsNotes}>
                      <Text style={styles.vitalsNotesLabel}>Notes</Text>
                      <Text style={styles.vitalsNotesText}>{record.notes}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          );
        })}

          <View style={styles.recordsDivider} />

          {/* ── Medication List ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <Text style={styles.sectionCount}>{medicationList.length} active</Text>
          </View>

        {medicationList.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="medkit-outline" size={28} color={COLORS.grayText || '#6B7C76'} />
            <Text style={styles.emptySectionText}>No medications recorded</Text>
          </View>
        ) : (
          medicationList.map((med) => {
            const isExpanded = expandedMeds[med.id];
            return (
              <View key={med.id} style={styles.recordCard}>
                <TouchableOpacity
                  style={styles.recordCardHeader}
                  activeOpacity={0.7}
                  onPress={() => setExpandedMeds(prev => ({ ...prev, [med.id]: !prev[med.id] }))}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordCardTitle}>{med.name}</Text>
                    <Text style={styles.recordCardSub}>{med.dosage} · {med.frequency || 'No frequency set'}</Text>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.grayText} />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.recordCardBody}>
                    <View style={styles.recordRow}>
                      <Text style={styles.recordLabel}>Route</Text>
                      <Text style={styles.recordValue}>{med.route || '—'}</Text>
                    </View>
                    <View style={styles.recordRow}>
                      <Text style={styles.recordLabel}>Start Date</Text>
                      <Text style={styles.recordValue}>{med.startDate || '—'}</Text>
                    </View>
                    <View style={styles.recordRow}>
                      <Text style={styles.recordLabel}>Added</Text>
                      <Text style={styles.recordValue}>{med.date}</Text>
                    </View>
                    {med.notes ? (
                      <View style={styles.recordNotesRow}>
                        <Text style={styles.recordLabel}>Notes</Text>
                        <Text style={styles.recordNotes}>{med.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })
        )}

          <View style={styles.recordsDivider} />

          {/* ── Incident Reports ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Incident Reports</Text>
            <Text style={styles.sectionCount}>{incidentList.length} {incidentList.length === 1 ? 'report' : 'reports'}</Text>
          </View>

        {incidentList.length === 0 ? (
          <View style={styles.emptySection}>
            <Ionicons name="shield-checkmark-outline" size={28} color={COLORS.primary} />
            <Text style={styles.emptySectionText}>No incidents reported</Text>
          </View>
        ) : (
          incidentList.map((incident) => {
            const isExpanded = expandedIncidents[incident.id];
            return (
              <View key={incident.id} style={[styles.recordCard, { borderLeftWidth: 3, borderLeftColor: '#C62828' }]}>
                <TouchableOpacity
                  style={styles.recordCardHeader}
                  activeOpacity={0.7}
                  onPress={() => setExpandedIncidents(prev => ({ ...prev, [incident.id]: !prev[incident.id] }))}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.incidentTypeBadge}>
                        <Text style={styles.incidentTypeText}>{incident.type}</Text>
                      </View>
                    </View>
                    <Text style={[styles.recordCardSub, { marginTop: 4 }]}>{incident.date} at {incident.time}</Text>
                  </View>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.grayText} />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.recordCardBody}>
                    <View style={styles.recordNotesRow}>
                      <Text style={styles.recordLabel}>Description</Text>
                      <Text style={styles.recordNotes}>{incident.description}</Text>
                    </View>
                    {incident.actionTaken ? (
                      <View style={styles.recordNotesRow}>
                        <Text style={styles.recordLabel}>Action Taken</Text>
                        <Text style={styles.recordNotes}>{incident.actionTaken}</Text>
                      </View>
                    ) : null}
                    {incident.witnesses ? (
                      <View style={styles.recordRow}>
                        <Text style={styles.recordLabel}>Witnesses</Text>
                        <Text style={styles.recordValue}>{incident.witnesses}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            );
          })
        )}

          <View style={styles.recordsDivider} />

          {/* ── Observation Reports ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Observation Reports</Text>
            <Text style={styles.sectionCount}>{observationList.length} {observationList.length === 1 ? 'report' : 'reports'}</Text>
          </View>

          {observationList.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="clipboard-outline" size={28} color={COLORS.grayText || '#6B7C76'} />
              <Text style={styles.emptySectionText}>No observations recorded</Text>
            </View>
          ) : (
            observationList.map((obs) => {
              const isExpanded = expandedObs[obs.id];
              return (
                <View key={obs.id} style={styles.recordCard}>
                  <TouchableOpacity
                    style={styles.recordCardHeader}
                    activeOpacity={0.7}
                    onPress={() => setExpandedObs(prev => ({ ...prev, [obs.id]: !prev[obs.id] }))}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recordCardTitle}>{obs.category || 'Observation'}</Text>
                      <Text style={styles.recordCardSub}>{obs.date}</Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.grayText} />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.recordCardBody}>
                      <View style={styles.obsTagsRow}>
                        {obs.mood ? <View style={styles.obsTag}><Text style={styles.obsTagLabel}>Mood</Text><Text style={styles.obsTagValue}>{obs.mood}</Text></View> : null}
                        {obs.mobility ? <View style={styles.obsTag}><Text style={styles.obsTagLabel}>Mobility</Text><Text style={styles.obsTagValue}>{obs.mobility}</Text></View> : null}
                        {obs.skinCondition ? <View style={styles.obsTag}><Text style={styles.obsTagLabel}>Skin</Text><Text style={styles.obsTagValue}>{obs.skinCondition}</Text></View> : null}
                        {obs.appetite ? <View style={styles.obsTag}><Text style={styles.obsTagLabel}>Appetite</Text><Text style={styles.obsTagValue}>{obs.appetite}</Text></View> : null}
                      </View>
                      {obs.notes ? (
                        <View style={styles.recordNotesRow}>
                          <Text style={styles.recordLabel}>Notes</Text>
                          <Text style={styles.recordNotes}>{obs.notes}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })
          )}

        </View>{/* end recordsCard */}

      </ScrollView>

      {/* Add Vitals Modal */}
      <Modal
        visible={showVitalsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVitalsModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowVitalsModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Record Vitals</Text>
            <TouchableOpacity onPress={handleSaveVitals}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Patient name in modal */}
          <View style={styles.modalPatientRow}>
            <Ionicons name="person-outline" size={16} color={COLORS.primary} />
            <Text style={styles.modalPatientName}>{patient.name}</Text>
          </View>

          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {VITAL_FIELDS.map((field) => {
              const warning = fieldWarnings[field.key];
              const borderColor = warning
                ? warning.type === 'critical' ? '#C62828'
                : warning.type === 'error' ? '#C62828'
                : '#F57C00'
                : '#E8F0ED';
              return (
                <View key={field.key} style={styles.fieldRow}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>{field.label}</Text>
                    <Text style={styles.fieldUnit}>{field.unit}</Text>
                  </View>
                  <TextInput
                    style={[styles.fieldInput, { borderColor }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.grayText}
                    value={vitalsForm[field.key] || ''}
                    onChangeText={(val) => updateField(field.key, val)}
                    keyboardType={field.keyboard || 'default'}
                  />
                  {warning && (
                    <View style={[
                      styles.warningBox,
                      warning.type === 'critical' ? styles.warningCritical
                      : warning.type === 'error' ? styles.warningError
                      : styles.warningCaution
                    ]}>
                      <Text style={[
                        styles.warningTag,
                        warning.type === 'critical' ? styles.warningTagCritical
                        : warning.type === 'error' ? styles.warningTagError
                        : styles.warningTagCaution
                      ]}>
                        {warning.type === 'critical' ? '⚠ CRITICAL' : warning.type === 'error' ? '✕ INVALID' : '⚠ WARNING'}
                      </Text>
                      <Text style={styles.warningText}>{warning.msg}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Notes */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Notes</Text>
              </View>
              <TextInput
                style={[styles.fieldInput, styles.notesInput]}
                placeholder="Additional observations..."
                placeholderTextColor={COLORS.grayText}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Save Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveVitals}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Vitals Record</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Medication Modal ── */}
      <Modal visible={showMedModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowMedModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TouchableOpacity onPress={handleSaveMedication}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <View style={styles.modalPatientRow}>
            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.modalPatientName}>{patient.name}</Text>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            {/* Medication Name - Searchable Dropdown */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Medication Name *</Text></View>
              {medForm.name && !showMedDropdown ? (
                <TouchableOpacity
                  style={styles.dropdownSelect}
                  activeOpacity={0.7}
                  onPress={() => { setShowMedDropdown(true); setMedSearch(''); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Ionicons name="medkit" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.dropdownSelectText}>{medForm.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setMedForm(p => ({ ...p, name: '' })); setMedSearch(''); setShowMedDropdown(true); }}>
                    <Ionicons name="close-circle" size={20} color={COLORS.grayText || '#6B7C76'} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                <View>
                  <View style={styles.medSearchBox}>
                    <Ionicons name="search" size={18} color={COLORS.grayText || '#6B7C76'} />
                    <TextInput
                      style={styles.medSearchInput}
                      placeholder="Search medication..."
                      value={medSearch}
                      onChangeText={t => { setMedSearch(t); setShowMedDropdown(true); }}
                      onFocus={() => setShowMedDropdown(true)}
                      autoCapitalize="words"
                    />
                    {medSearch.length > 0 && (
                      <TouchableOpacity onPress={() => setMedSearch('')}>
                        <Ionicons name="close-circle" size={18} color={COLORS.grayText || '#6B7C76'} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {showMedDropdown && (
                    <View style={styles.medDropdownList}>
                      {canAddCustomMed && (
                        <TouchableOpacity
                          style={styles.medAddCustom}
                          onPress={() => {
                            const custom = medSearch.trim();
                            setCustomMeds(prev => [...prev, custom]);
                            setMedForm(p => ({ ...p, name: custom }));
                            setMedSearch('');
                            setShowMedDropdown(false);
                          }}
                        >
                          <Ionicons name="add-circle" size={20} color={COLORS.primary} />
                          <Text style={styles.medAddCustomText}>Add "{medSearch.trim()}"</Text>
                        </TouchableOpacity>
                      )}
                      {filteredMeds.length > 0 ? (
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                          {filteredMeds.map(med => (
                            <TouchableOpacity
                              key={med}
                              style={[
                                styles.dropdownItem,
                                medForm.name === med && styles.dropdownItemActive,
                              ]}
                              onPress={() => {
                                setMedForm(p => ({ ...p, name: med }));
                                setMedSearch('');
                                setShowMedDropdown(false);
                              }}
                            >
                              <Text style={[
                                styles.dropdownItemText,
                                medForm.name === med && styles.dropdownItemTextActive,
                              ]}>{med}</Text>
                              {medForm.name === med && (
                                <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : (
                        !canAddCustomMed && (
                          <View style={styles.medNoResults}>
                            <Ionicons name="search-outline" size={20} color={COLORS.grayText || '#6B7C76'} />
                            <Text style={styles.medNoResultsText}>No medications found</Text>
                          </View>
                        )
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Dosage */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Dosage *</Text></View>
              <TextInput style={styles.fieldInput} placeholder="e.g. 500mg" value={medForm.dosage} onChangeText={t => setMedForm(p => ({ ...p, dosage: t }))} />
            </View>

            {/* Frequency - Dropdown */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Frequency</Text></View>
              <TouchableOpacity
                style={styles.dropdownSelect}
                activeOpacity={0.7}
                onPress={() => { setShowMedFreqDropdown(!showMedFreqDropdown); setShowMedRouteDropdown(false); }}
              >
                <Text style={[
                  styles.dropdownSelectText,
                  !medForm.frequency && styles.dropdownPlaceholder,
                ]}>{medForm.frequency || 'Select frequency'}</Text>
                <Ionicons name={showMedFreqDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.grayText || '#6B7C76'} />
              </TouchableOpacity>
              {showMedFreqDropdown && (
                <View style={styles.dropdownList}>
                  {MED_FREQUENCIES.map(freq => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.dropdownItem,
                        medForm.frequency === freq && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setMedForm(p => ({ ...p, frequency: freq }));
                        setShowMedFreqDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        medForm.frequency === freq && styles.dropdownItemTextActive,
                      ]}>{freq}</Text>
                      {medForm.frequency === freq && (
                        <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Route - Dropdown */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Route</Text></View>
              <TouchableOpacity
                style={styles.dropdownSelect}
                activeOpacity={0.7}
                onPress={() => { setShowMedRouteDropdown(!showMedRouteDropdown); setShowMedFreqDropdown(false); }}
              >
                <Text style={[
                  styles.dropdownSelectText,
                  !medForm.route && styles.dropdownPlaceholder,
                ]}>{medForm.route || 'Select route'}</Text>
                <Ionicons name={showMedRouteDropdown ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.grayText || '#6B7C76'} />
              </TouchableOpacity>
              {showMedRouteDropdown && (
                <View style={styles.dropdownList}>
                  {MED_ROUTES.map(route => (
                    <TouchableOpacity
                      key={route}
                      style={[
                        styles.dropdownItem,
                        medForm.route === route && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        setMedForm(p => ({ ...p, route: route }));
                        setShowMedRouteDropdown(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        medForm.route === route && styles.dropdownItemTextActive,
                      ]}>{route}</Text>
                      {medForm.route === route && (
                        <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Start Date */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Start Date</Text></View>
              <TextInput style={styles.fieldInput} placeholder="e.g. 2025-01-15" value={medForm.startDate} onChangeText={t => setMedForm(p => ({ ...p, startDate: t }))} />
            </View>

            {/* Notes */}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Notes</Text></View>
              <TextInput style={styles.notesInput} placeholder="Additional instructions or notes..." value={medForm.notes} onChangeText={t => setMedForm(p => ({ ...p, notes: t }))} multiline />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveMedication}>
              <LinearGradient style={styles.saveBtnGradient} colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Medication</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Report Incident Modal ── */}
      <Modal visible={showIncidentModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowIncidentModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Report Incident</Text>
            <TouchableOpacity onPress={handleSaveIncident}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <View style={styles.modalPatientRow}>
            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.modalPatientName}>{patient.name}</Text>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Incident Type *</Text></View>
              <TouchableOpacity
                style={styles.dropdownSelect}
                activeOpacity={0.7}
                onPress={() => setShowIncidentTypeDropdown(!showIncidentTypeDropdown)}
              >
                <Text style={[
                  styles.dropdownSelectText,
                  !incidentForm.type && styles.dropdownPlaceholder,
                ]}>
                  {incidentForm.type || 'Select incident type'}
                </Text>
                <Ionicons
                  name={showIncidentTypeDropdown ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.grayText}
                />
              </TouchableOpacity>
              {showIncidentTypeDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                    {INCIDENT_TYPES.map(option => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dropdownItem,
                          incidentForm.type === option && styles.dropdownItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setIncidentForm(p => ({ ...p, type: option }));
                          setShowIncidentTypeDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          incidentForm.type === option && styles.dropdownItemTextActive,
                        ]}>{option}</Text>
                        {incidentForm.type === option && (
                          <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Date</Text></View>
              <TextInput style={styles.fieldInput} placeholder="e.g. 2025-01-15" value={incidentForm.date} onChangeText={t => setIncidentForm(p => ({ ...p, date: t }))} />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Time</Text></View>
              <TextInput style={styles.fieldInput} placeholder="e.g. 14:30" value={incidentForm.time} onChangeText={t => setIncidentForm(p => ({ ...p, time: t }))} />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Description *</Text></View>
              <TextInput style={styles.notesInput} placeholder="Describe what happened in detail..." value={incidentForm.description} onChangeText={t => setIncidentForm(p => ({ ...p, description: t }))} multiline />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Action Taken</Text></View>
              <TextInput style={styles.notesInput} placeholder="What actions were taken in response..." value={incidentForm.actionTaken} onChangeText={t => setIncidentForm(p => ({ ...p, actionTaken: t }))} multiline />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Witnesses</Text></View>
              <TextInput style={styles.fieldInput} placeholder="Names of any witnesses" value={incidentForm.witnesses} onChangeText={t => setIncidentForm(p => ({ ...p, witnesses: t }))} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveIncident}>
              <LinearGradient style={styles.saveBtnGradient} colors={['#C62828', '#B71C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="warning-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Submit Incident Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Observation Report Modal ── */}
      <Modal visible={showObservationModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowObservationModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Observation Report</Text>
            <TouchableOpacity onPress={handleSaveObservation}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <View style={styles.modalPatientRow}>
            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.modalPatientName}>{patient.name}</Text>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            {[
              { key: 'category', label: 'Category' },
              { key: 'mood', label: 'Mood' },
              { key: 'mobility', label: 'Mobility' },
              { key: 'skinCondition', label: 'Skin Condition' },
              { key: 'appetite', label: 'Appetite' },
            ].map(field => (
              <View style={styles.fieldRow} key={field.key}>
                <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>{field.label}</Text></View>
                <TouchableOpacity
                  style={styles.dropdownSelect}
                  activeOpacity={0.7}
                  onPress={() => setOpenDropdown(openDropdown === field.key ? null : field.key)}
                >
                  <Text style={[
                    styles.dropdownSelectText,
                    !observationForm[field.key] && styles.dropdownPlaceholder,
                  ]}>
                    {observationForm[field.key] || `Select ${field.label.toLowerCase()}`}
                  </Text>
                  <Ionicons
                    name={openDropdown === field.key ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.grayText || '#6B7C76'}
                  />
                </TouchableOpacity>
                {openDropdown === field.key && (
                  <View style={styles.dropdownList}>
                    {OBS_OPTIONS[field.key].map(option => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dropdownItem,
                          observationForm[field.key] === option && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setObservationForm(p => ({ ...p, [field.key]: option }));
                          setOpenDropdown(null);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          observationForm[field.key] === option && styles.dropdownItemTextActive,
                        ]}>{option}</Text>
                        {observationForm[field.key] === option && (
                          <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Notes</Text></View>
              <TextInput style={styles.notesInput} placeholder="Additional observations and details..." value={observationForm.notes} onChangeText={t => setObservationForm(p => ({ ...p, notes: t }))} multiline />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveObservation}>
              <LinearGradient style={styles.saveBtnGradient} colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Observation Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Note Modal ── */}
      <Modal visible={showNoteModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNoteModal(false)}><Text style={styles.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={handleSaveNote}><Text style={styles.modalSave}>Save</Text></TouchableOpacity>
          </View>
          <View style={styles.modalPatientRow}>
            <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
            <Text style={styles.modalPatientName}>{patient.name}</Text>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Title</Text></View>
              <TextInput style={styles.fieldInput} placeholder="Note title" value={noteForm.title} onChangeText={t => setNoteForm(p => ({ ...p, title: t }))} />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Content *</Text></View>
              <TextInput style={[styles.notesInput, { minHeight: 150 }]} placeholder="Write your note here..." value={noteForm.content} onChangeText={t => setNoteForm(p => ({ ...p, content: t }))} multiline />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}><Text style={styles.fieldLabel}>Priority</Text></View>
              <View style={styles.priorityRow}>
                {['Low', 'Normal', 'High', 'Urgent'].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.priorityChip,
                      noteForm.priority === level && styles.priorityChipActive,
                      noteForm.priority === level && level === 'Urgent' && { backgroundColor: '#C62828' },
                      noteForm.priority === level && level === 'High' && { backgroundColor: COLORS.warning || '#F57C00' },
                    ]}
                    onPress={() => setNoteForm(p => ({ ...p, priority: level }))}
                  >
                    <Text style={[
                      styles.priorityChipText,
                      noteForm.priority === level && styles.priorityChipTextActive,
                    ]}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveNote}>
              <LinearGradient style={styles.saveBtnGradient} colors={[COLORS.primary, COLORS.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveBtnText}>Save Note</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  /* Header */
  headerGradient: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  careLevelText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontFamily: 'Outfit-ExtraBold', fontWeight: '800',
    color: COLORS.white,
    marginBottom: 2,
  },
  patientMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  patientCondition: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    marginTop: 2,
  },
  startCarePlanBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  startCarePlanText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.white,
  },

  /* Scroll content */
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },

  /* Quick info */
  quickInfoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E8F0ED',
  },
  quickInfoLabel: {
    fontSize: 11,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  quickInfoValue: {
    fontSize: 12,
    color: COLORS.darkText,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
  },

  /* Action buttons */
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F0ED',
  },
  actionsTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionBtn: {
    width: '18.5%',
    alignItems: 'center',
    gap: 6,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText,
    textAlign: 'center',
    lineHeight: 13,
  },

  /* Records card wrapper */
  recordsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8F0ED',
  },
  recordsDivider: {
    height: 1,
    backgroundColor: '#E8F0ED',
    marginVertical: 18,
  },

  /* Section header */
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
  sectionCount: {
    fontSize: 12,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },

  /* Vitals card */
  vitalsCard: {
    backgroundColor: COLORS.background || '#F5F9FD',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEF2F0',
    overflow: 'hidden',
  },
  vitalsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  vitalsDate: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText,
  },
  vitalsBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 12,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  vitalItem: {
    width: '48%',
    marginBottom: 10,
  },
  vitalLabel: {
    fontSize: 11,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
  },
  vitalUnit: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText,
  },
  vitalsNotes: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  vitalsNotesLabel: {
    fontSize: 11,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    marginBottom: 3,
  },
  vitalsNotesText: {
    fontSize: 12,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    lineHeight: 18,
  },

  /* Modal */
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F0ED',
  },
  modalCancel: {
    fontSize: 15,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.darkText,
  },
  modalSave: {
    fontSize: 15,
    color: COLORS.primary,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  modalPatientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGreen,
  },
  modalPatientName: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText,
  },
  modalScroll: { flex: 1 },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 10,
  },

  /* Fields */
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText,
    flex: 1,
  },
  fieldUnit: {
    fontSize: 11,
    color: COLORS.grayText,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
  },
  fieldInput: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8F0ED',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.darkText,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  /* Validation warnings */
  warningBox: {
    marginTop: 6,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  warningCaution: {
    backgroundColor: '#FFF8E1',
    borderLeftColor: '#F57C00',
  },
  warningCritical: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#C62828',
  },
  warningError: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#C62828',
  },
  warningTag: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    marginBottom: 3,
  },
  warningTagCaution: {
    color: '#F57C00',
  },
  warningTagCritical: {
    color: '#C62828',
  },
  warningTagError: {
    color: '#C62828',
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: '#5D4037',
    lineHeight: 17,
  },

  /* Modal footer */
  modalFooter: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E8F0ED',
  },
  saveBtn: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.white,
  },

  /* Priority chips (Add Note modal) */
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.inputBg || '#F0F7F4',
    borderWidth: 1,
    borderColor: '#DDE8E3',
  },
  priorityChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priorityChipText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.grayText || '#6B7C76',
  },
  priorityChipTextActive: {
    color: COLORS.white,
  },

  /* Record cards (medications, incidents, observations) */
  recordCard: {
    backgroundColor: COLORS.background || '#F5F9FD',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEF2F0',
    overflow: 'hidden',
  },
  recordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  recordCardTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText || '#1A2E28',
  },
  recordCardSub: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText || '#6B7C76',
    marginTop: 2,
  },
  recordCardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F2',
    paddingTop: 12,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.grayText || '#6B7C76',
  },
  recordValue: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText || '#1A2E28',
  },
  recordNotesRow: {
    marginBottom: 10,
  },
  recordNotes: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.darkText || '#1A2E28',
    marginTop: 4,
    lineHeight: 19,
  },
  emptySection: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8F0ED',
    marginBottom: 8,
    gap: 8,
  },
  emptySectionText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.grayText || '#6B7C76',
  },
  incidentTypeBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  incidentTypeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: '#C62828',
  },
  obsTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  obsTag: {
    backgroundColor: COLORS.lightGreen || '#E8F7F2',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  obsTagLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.grayText || '#6B7C76',
    marginBottom: 2,
  },
  obsTagValue: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.secondary || '#437365',
  },

  /* Medication searchable dropdown */
  medSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg || '#F0F7F4',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 8,
  },
  medSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.darkText || '#1A2E28',
    paddingVertical: 10,
  },
  medDropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDE8E3',
    marginTop: 6,
    overflow: 'hidden',
  },
  medAddCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: COLORS.lightGreen || '#E8F7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE8E3',
    gap: 8,
  },
  medAddCustomText: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.primary,
  },
  medNoResults: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  medNoResultsText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText || '#6B7C76',
  },

  /* Dropdown styles (Observation Report) */
  dropdownSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg || '#F0F7F4',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#DDE8E3',
  },
  dropdownSelectText: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.darkText || '#1A2E28',
  },
  dropdownPlaceholder: {
    color: '#A0B0A8',
  },
  dropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDE8E3',
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F2',
  },
  dropdownItemActive: {
    backgroundColor: COLORS.lightGreen || '#E8F7F2',
  },
  dropdownItemText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.darkText || '#1A2E28',
  },
  dropdownItemTextActive: {
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.primary,
  },
});

export default PatientDetailScreen;
