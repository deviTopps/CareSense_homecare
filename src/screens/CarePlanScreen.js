import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/colors';

const userImages = [
  require('../../assets/user1.jpg'),
  require('../../assets/user2.jpg'),
  require('../../assets/user3.jpg'),
];

/* ── Care Tasks Generator ── */
const generateCareTasks = (patient) => {
  const baseTasks = [
    {
      id: '1',
      title: 'Patient Greeting & Assessment',
      description: 'Greet the patient, verify identity, and perform an initial visual assessment of their general condition and alertness.',
      icon: 'hand-left-outline',
      duration: '5 min',
      category: 'Assessment',
    },
    {
      id: '2',
      title: 'Record Vital Signs',
      description: 'Measure and record blood pressure, heart rate, temperature, oxygen saturation, and respiratory rate.',
      icon: 'heart-outline',
      duration: '10 min',
      category: 'Vitals',
    },
    {
      id: '3',
      title: 'Medication Administration',
      description: 'Review the medication chart, verify dosages, and administer scheduled medications. Document any refusals or reactions.',
      icon: 'medkit-outline',
      duration: '10 min',
      category: 'Medication',
    },
    {
      id: '4',
      title: 'Skin Integrity Check',
      description: 'Inspect skin for pressure sores, rashes, bruising, or any signs of breakdown. Pay attention to bony prominences.',
      icon: 'body-outline',
      duration: '5 min',
      category: 'Assessment',
    },
    {
      id: '5',
      title: 'Mobility & Exercise Support',
      description: 'Assist with prescribed exercises, repositioning, or walking. Ensure safe transfers and proper use of mobility aids.',
      icon: 'walk-outline',
      duration: '15 min',
      category: 'Physical',
    },
    {
      id: '6',
      title: 'Nutrition & Hydration Check',
      description: 'Ensure adequate food and fluid intake. Assist with meals if needed. Record dietary intake and note any difficulties.',
      icon: 'restaurant-outline',
      duration: '10 min',
      category: 'Nutrition',
    },
    {
      id: '7',
      title: 'Personal Hygiene Assistance',
      description: 'Assist with bathing, oral care, grooming, and dressing as needed. Maintain dignity and privacy throughout.',
      icon: 'water-outline',
      duration: '15 min',
      category: 'Hygiene',
    },
    {
      id: '8',
      title: 'Pain & Comfort Assessment',
      description: 'Ask the patient about pain levels (use 0-10 scale). Ensure comfortable positioning and address any discomfort.',
      icon: 'fitness-outline',
      duration: '5 min',
      category: 'Assessment',
    },
    {
      id: '9',
      title: 'Mental Wellbeing Check',
      description: 'Engage the patient in conversation. Assess mood, orientation, and cognitive function. Note any changes in behaviour.',
      icon: 'happy-outline',
      duration: '10 min',
      category: 'Wellbeing',
    },
    {
      id: '10',
      title: 'Environment Safety Check',
      description: 'Ensure the patient\'s living area is clean, safe, and hazard-free. Check call bells, lighting, and pathways.',
      icon: 'home-outline',
      duration: '5 min',
      category: 'Safety',
    },
    {
      id: '11',
      title: 'Documentation & Handover Notes',
      description: 'Complete all care records, document observations, update the care plan, and prepare handover notes for the next shift.',
      icon: 'document-text-outline',
      duration: '10 min',
      category: 'Documentation',
    },
  ];

  return baseTasks;
};

const categoryColors = {
  Assessment: { bg: '#E3F2FD', text: '#1565C0' },
  Vitals: { bg: '#FCE4EC', text: '#C62828' },
  Medication: { bg: '#E8F5E9', text: '#2E7D32' },
  Physical: { bg: '#FFF3E0', text: '#E65100' },
  Nutrition: { bg: '#F3E5F5', text: '#6A1B9A' },
  Hygiene: { bg: '#E0F7FA', text: '#00695C' },
  Wellbeing: { bg: '#FFF8E1', text: '#F57F17' },
  Safety: { bg: '#EFEBE9', text: '#4E342E' },
  Documentation: { bg: '#E8EAF6', text: '#283593' },
};

const CarePlanScreen = ({ route, navigation }) => {
  const { patient } = route.params;
  const tasks = generateCareTasks(patient);
  const [completedTasks, setCompletedTasks] = useState({});
  const [activeTask, setActiveTask] = useState(0);
  const [notes, setNotes] = useState({});
  const scrollRef = useRef(null);
  const fadeAnims = useRef(tasks.map(() => new Animated.Value(1))).current;

  const completedCount = Object.keys(completedTasks).length;
  const progress = completedCount / tasks.length;
  const allDone = completedCount === tasks.length;

  const imgIndex = (parseInt(patient.id) - 1) % userImages.length;

  const handleComplete = (taskIndex) => {
    const task = tasks[taskIndex];

    // Animate completion
    Animated.sequence([
      Animated.timing(fadeAnims[taskIndex], { toValue: 0.5, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnims[taskIndex], { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setCompletedTasks(prev => ({ ...prev, [task.id]: true }));

    // Auto-advance to next incomplete task
    if (taskIndex < tasks.length - 1) {
      const nextIndex = taskIndex + 1;
      setActiveTask(nextIndex);
      // Scroll to next task
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: nextIndex * 160, animated: true });
      }, 300);
    }
  };

  const handleUncomplete = (taskIndex) => {
    const task = tasks[taskIndex];
    setCompletedTasks(prev => {
      const updated = { ...prev };
      delete updated[task.id];
      return updated;
    });
  };

  const handleFinishVisit = () => {
    Alert.alert(
      'Complete Visit',
      `All ${tasks.length} tasks have been completed for ${patient.name}. Submit this care plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            Alert.alert('Care Plan Submitted', 'The care plan has been successfully recorded.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
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
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Care Plan</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.headerPatient}>
          <Image source={userImages[imgIndex]} style={styles.headerAvatar} />
          <View style={styles.headerPatientInfo}>
            <Text style={styles.headerPatientName} numberOfLines={1}>{patient.name}</Text>
            <Text style={styles.headerPatientMeta}>{patient.condition}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} of {tasks.length} tasks completed
          </Text>
        </View>
      </LinearGradient>

      {/* Task List */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tasks.map((task, index) => {
          const isCompleted = completedTasks[task.id];
          const isActive = activeTask === index && !isCompleted;
          const isLocked = !isCompleted && index > 0 && !completedTasks[tasks[index - 1].id] && index !== activeTask;
          const catColor = categoryColors[task.category] || categoryColors.Assessment;

          return (
            <Animated.View key={task.id} style={{ opacity: fadeAnims[index] }}>
              <TouchableOpacity
                style={[
                  styles.taskCard,
                  isActive && styles.taskCardActive,
                  isCompleted && styles.taskCardCompleted,
                  isLocked && styles.taskCardLocked,
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!isLocked) setActiveTask(index);
                }}
                disabled={isLocked}
              >
                {/* Step number & connector */}
                <View style={styles.taskLeft}>
                  <View style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isActive && styles.stepCircleActive,
                    isLocked && styles.stepCircleLocked,
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    ) : (
                      <Text style={[
                        styles.stepNumber,
                        isActive && styles.stepNumberActive,
                        isLocked && styles.stepNumberLocked,
                      ]}>{index + 1}</Text>
                    )}
                  </View>
                  {index < tasks.length - 1 && (
                    <View style={[
                      styles.connector,
                      isCompleted && styles.connectorCompleted,
                    ]} />
                  )}
                </View>

                {/* Task content */}
                <View style={styles.taskContent}>
                  <View style={styles.taskTopRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor.bg }]}>
                      <Text style={[styles.categoryText, { color: catColor.text }]}>{task.category}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color={COLORS.grayText} />
                      <Text style={styles.durationText}>{task.duration}</Text>
                    </View>
                  </View>

                  <View style={styles.taskTitleRow}>
                    <Ionicons
                      name={task.icon}
                      size={18}
                      color={isCompleted ? '#4CAF50' : isActive ? COLORS.primary : COLORS.grayText}
                    />
                    <Text style={[
                      styles.taskTitle,
                      isCompleted && styles.taskTitleCompleted,
                    ]}>{task.title}</Text>
                  </View>

                  {(isActive || isCompleted) && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}

                  {/* Notes input for active task */}
                  {isActive && !isCompleted && (
                    <TextInput
                      style={styles.taskNotesInput}
                      placeholder="Add notes (optional)..."
                      placeholderTextColor="#A0B0A8"
                      value={notes[task.id] || ''}
                      onChangeText={(t) => setNotes(prev => ({ ...prev, [task.id]: t }))}
                      multiline
                    />
                  )}

                  {/* Action button */}
                  {isActive && !isCompleted && (
                    <TouchableOpacity
                      style={styles.completeBtn}
                      activeOpacity={0.85}
                      onPress={() => handleComplete(index)}
                    >
                      <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.completeBtnGradient}
                      >
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                        <Text style={styles.completeBtnText}>Mark as Completed</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {isCompleted && (
                    <View style={styles.completedRow}>
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleUncomplete(index)}>
                        <Text style={styles.undoText}>Undo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Spacer for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      {allDone && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.finishBtn} activeOpacity={0.85} onPress={handleFinishVisit}>
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.finishBtnGradient}
            >
              <Ionicons name="checkmark-done-circle" size={22} color={COLORS.white} />
              <Text style={styles.finishBtnText}>Complete Visit & Submit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  /* Header */
  header: {
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.white,
  },
  headerPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerPatientInfo: {
    flex: 1,
  },
  headerPatientName: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.white,
  },
  headerPatientMeta: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  progressSection: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },

  /* Scroll */
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },

  /* Task card */
  taskCard: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  taskCardActive: {},
  taskCardCompleted: {},
  taskCardLocked: {
    opacity: 0.5,
  },

  /* Step indicator */
  taskLeft: {
    alignItems: 'center',
    width: 36,
    marginRight: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#DDE8E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E6F3FF',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepCircleLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  stepNumber: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.grayText,
  },
  stepNumberActive: {
    color: COLORS.primary,
  },
  stepNumberLocked: {
    color: '#BDBDBD',
  },
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: '#DDE8E3',
    marginVertical: 4,
    minHeight: 20,
  },
  connectorCompleted: {
    backgroundColor: '#4CAF50',
  },

  /* Task content */
  taskContent: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F0ED',
  },
  taskTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.grayText,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: COLORS.darkText,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.grayText,
  },
  taskDescription: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.grayText,
    lineHeight: 19,
    marginTop: 6,
    marginLeft: 26,
  },
  taskNotesInput: {
    backgroundColor: COLORS.inputBg || '#EFF5FB',
    borderRadius: 6,
    padding: 12,
    fontSize: 13,
    fontFamily: 'Outfit-Regular', fontWeight: '400',
    color: COLORS.darkText,
    marginTop: 10,
    marginLeft: 26,
    minHeight: 44,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E8F0ED',
  },

  /* Complete button */
  completeBtn: {
    marginTop: 12,
    marginLeft: 26,
    borderRadius: 6,
    overflow: 'hidden',
  },
  completeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  completeBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.white,
  },

  /* Completed state */
  completedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 26,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold', fontWeight: '600',
    color: '#4CAF50',
  },
  undoText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium', fontWeight: '500',
    color: COLORS.grayText,
    textDecorationLine: 'underline',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E8F0ED',
  },
  finishBtn: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  finishBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  finishBtnText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold', fontWeight: '700',
    color: COLORS.white,
  },
});

export default CarePlanScreen;
