import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { FiPlus, FiSearch, FiX, FiChevronRight, FiChevronLeft, FiCheck, FiSave, FiChevronsLeft, FiChevronsRight, FiUserPlus } from '../icons/hugeicons-feather';
import { apiFetch } from '../api';

const patientsData = [
  { id: 'P-1001', name: 'Kwame Boateng', age: 72, gender: 'Male', diagnosis: 'Hypertension, Type 2 Diabetes', phone: '+233 24 111 2222', address: '14 Osu Badu St, Accra', region: 'Accra', nurses: ['Efua Mensah'], emergency: 'Ama Boateng (+233 20 333 4444)', status: 'active', enrolled: '2024-06-01' },
  { id: 'P-1002', name: 'Abena Osei', age: 65, gender: 'Female', diagnosis: 'Post-surgical wound care', phone: '+233 20 555 6666', address: '7 Adum Road, Kumasi', region: 'Kumasi', nurses: ['Yaa Asantewaa', 'Ama Darko'], emergency: 'Kofi Osei (+233 27 777 8888)', status: 'active', enrolled: '2024-08-15' },
  { id: 'P-1003', name: 'Kofi Ankrah', age: 58, gender: 'Male', diagnosis: 'Diabetes, Peripheral Neuropathy', phone: '+233 27 999 0000', address: '22 Dagomba Line, Tamale', region: 'Tamale', nurses: ['Ama Darko'], emergency: 'Yaa Ankrah (+233 24 111 0000)', status: 'active', enrolled: '2024-09-20' },
  { id: 'P-1004', name: 'Akosua Mensah', age: 80, gender: 'Female', diagnosis: 'GERD, Osteoarthritis', phone: '+233 26 222 3333', address: '3 Cantonments Rd, Accra', region: 'Accra', nurses: [], emergency: 'Kwesi Mensah (+233 55 444 5555)', status: 'active', enrolled: '2025-01-10' },
  { id: 'P-1005', name: 'Yaw Frimpong', age: 45, gender: 'Male', diagnosis: 'Stroke rehabilitation', phone: '+233 23 666 7777', address: '18 Market Circle, Takoradi', region: 'Takoradi', nurses: [], emergency: 'Esi Frimpong (+233 20 888 9999)', status: 'active', enrolled: '2025-03-01' },
  { id: 'P-1006', name: 'Esi Appiah', age: 68, gender: 'Female', diagnosis: 'COPD, Asthma', phone: '+233 55 000 1111', address: '9 Spintex Rd, Accra', region: 'Accra', nurses: ['Yaa Asantewaa'], emergency: 'Kojo Appiah (+233 24 222 3333)', status: 'active', enrolled: '2025-06-15' },
  { id: 'P-1007', name: 'Nana Agyemang', age: 77, gender: 'Male', diagnosis: 'Heart failure, Chronic kidney disease', phone: '+233 27 444 5555', address: '12 Ridge Rd, Accra', region: 'Accra', nurses: ['Efua Mensah'], emergency: 'Adwoa Agyemang (+233 20 666 7777)', status: 'discharged', enrolled: '2024-04-01' },
  { id: 'P-1008', name: 'Afia Kumah', age: 55, gender: 'Female', diagnosis: 'Rheumatoid Arthritis', phone: '+233 26 888 9999', address: '5 Castle Rd, Cape Coast', region: 'Cape Coast', nurses: [], emergency: 'Kwame Kumah (+233 55 000 1111)', status: 'active', enrolled: '2025-11-01' },
  { id: 'P-1009', name: 'Kwesi Mensah', age: 63, gender: 'Male', diagnosis: 'Chronic Kidney Disease Stage 3', phone: '+233 24 333 4444', address: '11 Liberation Rd, Accra', region: 'Accra', nurses: ['Efua Mensah'], emergency: 'Akua Mensah (+233 20 111 2222)', status: 'active', enrolled: '2025-02-10' },
  { id: 'P-1010', name: 'Adwoa Darko', age: 70, gender: 'Female', diagnosis: 'Parkinson Disease', phone: '+233 27 555 6666', address: '8 Asafo Market Rd, Kumasi', region: 'Kumasi', nurses: ['Yaa Asantewaa'], emergency: 'Yaw Darko (+233 26 777 8888)', status: 'active', enrolled: '2025-04-20' },
  { id: 'P-1011', name: 'Kojo Asante', age: 82, gender: 'Male', diagnosis: 'Dementia, Hypertension', phone: '+233 55 111 2222', address: '15 Airport Rd, Accra', region: 'Accra', nurses: [], emergency: 'Ama Asante (+233 24 555 6666)', status: 'active', enrolled: '2025-07-01' },
  { id: 'P-1012', name: 'Efua Aidoo', age: 48, gender: 'Female', diagnosis: 'Multiple Sclerosis', phone: '+233 20 999 0000', address: '6 Beach Rd, Takoradi', region: 'Takoradi', nurses: ['Adwoa Badu'], emergency: 'Kofi Aidoo (+233 27 333 4444)', status: 'active', enrolled: '2025-09-15' },
  { id: 'P-1013', name: 'Yaa Ofosu', age: 74, gender: 'Female', diagnosis: 'Congestive Heart Failure', phone: '+233 26 444 5555', address: '20 Sunyani Rd, Sunyani', region: 'Sunyani', nurses: ['Yaa Asantewaa'], emergency: 'Kwame Ofosu (+233 55 888 9999)', status: 'active', enrolled: '2025-08-01' },
  { id: 'P-1014', name: 'Ama Boahen', age: 60, gender: 'Female', diagnosis: 'Breast cancer post-mastectomy', phone: '+233 24 666 7777', address: '9 Ho Bypass Rd, Ho', region: 'Ho', nurses: ['Ama Darko'], emergency: 'Kofi Boahen (+233 20 000 1111)', status: 'active', enrolled: '2025-10-05' },
  { id: 'P-1015', name: 'Kwaku Mensah', age: 69, gender: 'Male', diagnosis: 'COPD, Emphysema', phone: '+233 27 222 3333', address: '4 Bolgatanga Rd, Bolga', region: 'Bolgatanga', nurses: ['Adwoa Badu'], emergency: 'Abena Mensah (+233 26 555 6666)', status: 'discharged', enrolled: '2024-11-20' },
];

const ROWS_OPTIONS = [5, 10, 15];
const PATIENT_PHOTO_CACHE_KEY = 'patientProfilePhotoCache';

const nursesList = [
  { id: 'N-001', name: 'Efua Mensah', specialisation: 'Geriatric Care', region: 'Accra' },
  { id: 'N-002', name: 'Yaa Asantewaa', specialisation: 'Wound Care', region: 'Kumasi' },
  { id: 'N-003', name: 'Ama Darko', specialisation: 'Diabetes Management', region: 'Tamale' },
  { id: 'N-004', name: 'Adwoa Badu', specialisation: 'Physiotherapy', region: 'Takoradi' },
  { id: 'N-005', name: 'Akua Owusu', specialisation: 'Palliative Care', region: 'Accra' },
  { id: 'N-006', name: 'Abena Fosu', specialisation: 'Cardiac Care', region: 'Cape Coast' },
];

const TABS = [
  { key: 'personal', label: 'Personal Details', num: 1 },
  { key: 'nok', label: 'Next of Kin', num: 2 },
  { key: 'checklist', label: 'Admission Checklist', num: 3 },
  { key: 'medical', label: 'Medical History', num: 4 },
  { key: 'communication', label: 'Communication', num: 5 },
  { key: 'infection', label: 'Infection Control', num: 6 },
  { key: 'breathing', label: 'Breathing & Pain', num: 7 },
  { key: 'sleep', label: 'Sleep & Nutrition', num: 8 },
  { key: 'hygiene', label: 'Hygiene & Psych', num: 9 },
  { key: 'skin', label: 'Skin & Mobility', num: 10 },
  { key: 'vitals', label: 'Vitals & Meds', num: 11 },
];

const lbl = { fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text-secondary)', marginBottom: 4 };
const inp = 'form-control form-control-kh';
const sel = 'form-select form-control-kh';

const initialAdmissionForm = {
  personal: {
    registrationNumber: '',
    dateOfAssessment: '',
    dateOfAdmission: '',
    firstName: '',
    lastName: '',
    preferredName: '',
    contactNumber: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    residentialAddress: '',
    gpsCode: '',
    email: '',
  },
  nextOfKin: {
    fullName: '',
    relationship: '',
    contactOne: '',
    contactTwo: '',
    spiritualNeed: '',
    personalDoctor: '',
    personalDoctorFacility: '',
    personalDoctorContact: '',
  },
  checklist: {
    clientHandBookGiven: null,
    admittingNurse: '',
    nursePin: '',
    infectionControlSupplies: null,
  },
  medical: {
    anyMedicalHistory: null,
    medicalHistoryDescription: '',
  },
  communication: {
    anyCommunicationNeeds: null,
    anyHearingNeeds: null,
    anySpeechImpairment: null,
    anyVisualImpairment: null,
    anyUnderstandingDifficulties: null,
    communicationNotes: '',
  },
  infection: {
    InfectionCarePlanCompletion: null,
    anyDiabetes: null,
    DiabetesCarePlanCompletion: null,
    isThePatientBedBound: null,
  },
  breathing: {
    anyBreathingDifficulties: null,
    homeOxygenNeeded: null,
    isSmoker: null,
    everSmoked: null,
    painPresent: null,
    anagelsiaPrescribed: null,
    locationOfPain: '',
    painScore: '',
  },
  sleepNutrition: {
    sleep: {
      wakeUpAtNight: null,
      UseOfNightSedation: null,
      userSleepWell: null,
      RestDuringTheDay: null,
      usualTimeToWakeUp: '',
      bestSleepingPosition: '',
    },
    nutrition: {
      allergy: null,
      specialDiet: null,
      needHelpInEating: null,
      feedingAid: null,
      swallowingDifficulties: null,
      dietType: '',
      ngTube: null,
      nutritionConcerns: '',
    },
  },
  hygienePsych: {
    personal: {
      hygieneNeeds: null,
      mouthCarePlan: null,
      diabeteFoot: null,
    },
    bladderBowel: {
      bladderDysfunction: null,
      catheterDescription: '',
      catheterPlan: null,
      incontinentPads: null,
    },
    psychologicalNeeds: {
      psychologicalNeeds: null,
      depressionHistory: null,
      anxietyhistory: null,
      signDementia: null,
      psychologicalNotes: '',
    },
  },
  skinMobility: {
    skinIntegrity: {
      openWounds: null,
      pressureUlcer: null,
      gradeAdmission: '',
      securityItems: '',
    },
    handlingAssessment: {
      isPatientMobile: null,
      isEquipmentNeeded: null,
      numberOfStaffNeeded: '',
      moveInBed: null,
      moveInBedEquipment: '',
      mobilityFromBedToChair: null,
      mobilityFromBedToChairEquipment: '',
      mobilityToWashroom: null,
      mobilityToWashroomEquipment: '',
    },
  },
  vitals: {
    bloodPressure: '',
    bloodSugar: '',
    respiration: '',
    sp02: '',
    pulseRate: '',
    temperature: '',
    urinalysis: '',
    weight: '',
  },
  profileImage: {
    objectKey: '',
    mediaId: '',
  },
};

const Field = ({ label, children, col = 'col-md-6' }) => (
  <div className={col}><label className="form-label" style={lbl}>{label}</label>{children}</div>
);
const YesNo = ({ label, col = 'col-md-6', value, onChange }) => (
  <Field label={label} col={col}>
    <select
      className={sel}
      value={value === true ? 'yes' : value === false ? 'no' : ''}
      onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'yes')}
    >
      <option value="">Select...</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  </Field>
);
const SectionTitle = ({ children }) => (
  <div className="col-12"><h6 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)', margin: '8px 0 0', paddingBottom: 8, borderBottom: '1px solid var(--kh-border-light)' }}>{children}</h6></div>
);

function TabPersonal({ form, setField, onRegistrationBlur, registrationCheck }) {
  const trimmedReg = String(form.personal.registrationNumber || '').trim();
  return (<div className="row g-3">
    <Field label="Reg No." col="col-md-3">
      <input
        className={inp}
        placeholder="e.g. KH-2026-001"
        value={form.personal.registrationNumber}
        onChange={(e) => setField('personal.registrationNumber', e.target.value)}
        onBlur={onRegistrationBlur}
      />
      {trimmedReg && registrationCheck?.loading && <div style={{ fontSize: 11, marginTop: 4, color: 'var(--kh-text-muted)' }}>Checking registration number...</div>}
      {trimmedReg && !registrationCheck?.loading && registrationCheck?.exists && <div style={{ fontSize: 11, marginTop: 4, color: '#dc2626', fontWeight: 600 }}>Registration number already exists.</div>}
      {trimmedReg && !registrationCheck?.loading && !registrationCheck?.exists && registrationCheck?.checkedValue === trimmedReg.toLowerCase() && !registrationCheck?.error && <div style={{ fontSize: 11, marginTop: 4, color: '#059669', fontWeight: 600 }}>Registration number is available.</div>}
      {trimmedReg && !registrationCheck?.loading && registrationCheck?.error && <div style={{ fontSize: 11, marginTop: 4, color: '#b45309', fontWeight: 600 }}>{registrationCheck.error}</div>}
    </Field>
    <Field label="Date of Assessment" col="col-md-3"><input type="date" className={inp} value={form.personal.dateOfAssessment} onChange={(e) => setField('personal.dateOfAssessment', e.target.value)} /></Field>
    <Field label="Date of Admission" col="col-md-3"><input type="date" className={inp} value={form.personal.dateOfAdmission} onChange={(e) => setField('personal.dateOfAdmission', e.target.value)} /></Field>
    <Field label="First Name" col="col-md-3"><input className={inp} placeholder="First name" value={form.personal.firstName} onChange={(e) => setField('personal.firstName', e.target.value)} /></Field>
    <Field label="Last Name" col="col-md-3"><input className={inp} placeholder="Last name" value={form.personal.lastName} onChange={(e) => setField('personal.lastName', e.target.value)} /></Field>
    <Field label="Preferred Name" col="col-md-3"><input className={inp} placeholder="Preferred name" value={form.personal.preferredName} onChange={(e) => setField('personal.preferredName', e.target.value)} /></Field>
    <Field label="Contact Number" col="col-md-3"><input className={inp} placeholder="+233..." value={form.personal.contactNumber} onChange={(e) => setField('personal.contactNumber', e.target.value)} /></Field>
    <Field label="Date of Birth" col="col-md-3"><input type="date" className={inp} value={form.personal.dateOfBirth} onChange={(e) => setField('personal.dateOfBirth', e.target.value)} /></Field>
    <Field label="Age" col="col-md-1"><input type="number" className={inp} value={form.personal.age} onChange={(e) => setField('personal.age', e.target.value)} /></Field>
    <Field label="Sex" col="col-md-2"><select className={sel} value={form.personal.gender} onChange={(e) => setField('personal.gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option></select></Field>
    <Field label="Residential Address" col="col-md-6"><input className={inp} placeholder="Full address" value={form.personal.residentialAddress} onChange={(e) => setField('personal.residentialAddress', e.target.value)} /></Field>
    <Field label="GPS Code" col="col-md-3"><input className={inp} placeholder="e.g. GA-123-4567" value={form.personal.gpsCode} onChange={(e) => setField('personal.gpsCode', e.target.value)} /></Field>
    <Field label="Email Address" col="col-md-3"><input type="email" className={inp} placeholder="email@example.com" value={form.personal.email} onChange={(e) => setField('personal.email', e.target.value)} /></Field>
  </div>);
}
function TabNextOfKin({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Next of Kin</SectionTitle>
    <Field label="Name"><input className={inp} placeholder="Full name" value={form.nextOfKin.fullName} onChange={(e) => setField('nextOfKin.fullName', e.target.value)} /></Field>
    <Field label="Relationship to Service User"><input className={inp} placeholder="e.g. Daughter" value={form.nextOfKin.relationship} onChange={(e) => setField('nextOfKin.relationship', e.target.value)} /></Field>
    <Field label="Contact Details"><input className={inp} placeholder="+233..." value={form.nextOfKin.contactOne} onChange={(e) => setField('nextOfKin.contactOne', e.target.value)} /></Field>
    <Field label="Preferred Contact Details"><input className={inp} placeholder="Alternative contact" value={form.nextOfKin.contactTwo} onChange={(e) => setField('nextOfKin.contactTwo', e.target.value)} /></Field>
    <SectionTitle>Cultural / Spiritual / Religious Needs</SectionTitle>
    <Field label="Cultural / Spiritual / Religious Needs" col="col-md-12"><textarea className={inp} rows={3} placeholder="Describe any cultural, spiritual or religious needs..." value={form.nextOfKin.spiritualNeed} onChange={(e) => setField('nextOfKin.spiritualNeed', e.target.value)} /></Field>
    <SectionTitle>Personal Doctor</SectionTitle>
    <Field label="Personal Doctor Name" col="col-md-4"><input className={inp} placeholder="Doctor name" value={form.nextOfKin.personalDoctor} onChange={(e) => setField('nextOfKin.personalDoctor', e.target.value)} /></Field>
    <Field label="Health Facility" col="col-md-4"><input className={inp} placeholder="Hospital / Clinic" value={form.nextOfKin.personalDoctorFacility} onChange={(e) => setField('nextOfKin.personalDoctorFacility', e.target.value)} /></Field>
    <Field label="Personal Mobile Number" col="col-md-4"><input className={inp} placeholder="+233..." value={form.nextOfKin.personalDoctorContact} onChange={(e) => setField('nextOfKin.personalDoctorContact', e.target.value)} /></Field>
  </div>);
}
function TabChecklist({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Admission Checklist</SectionTitle>
    <YesNo label="Client's Handbook Given" value={form.checklist.clientHandBookGiven} onChange={(v) => setField('checklist.clientHandBookGiven', v)} />
    <Field label="Nurse's Name"><input className={inp} placeholder="Admitting nurse" value={form.checklist.admittingNurse} onChange={(e) => setField('checklist.admittingNurse', e.target.value)} /></Field>
    <Field label="Nurse's PIN Number"><input className={inp} placeholder="PIN" value={form.checklist.nursePin} onChange={(e) => setField('checklist.nursePin', e.target.value)} /></Field>
    <YesNo label="Infection Control Supplies Advised (Gloves, Aprons, Bin Bags, Disinfectant)" col="col-md-12" value={form.checklist.infectionControlSupplies} onChange={(v) => setField('checklist.infectionControlSupplies', v)} />
  </div>);
}
function TabMedical({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>History of Medical & Surgery</SectionTitle>
    <YesNo label="Any History of Medical Conditions or Surgery?" col="col-md-4" value={form.medical.anyMedicalHistory} onChange={(v) => setField('medical.anyMedicalHistory', v)} />
    <Field label="Details (if yes)" col="col-md-8"><textarea className={inp} rows={3} placeholder="Describe medical/surgical history..." value={form.medical.medicalHistoryDescription} onChange={(e) => setField('medical.medicalHistoryDescription', e.target.value)} /></Field>
  </div>);
}
function TabCommunication({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Communication</SectionTitle>
    <YesNo label="Any Communication Needs" col="col-md-4" value={form.communication.anyCommunicationNeeds} onChange={(v) => setField('communication.anyCommunicationNeeds', v)} />
    <YesNo label="Any Hearing Impairment" col="col-md-4" value={form.communication.anyHearingNeeds} onChange={(v) => setField('communication.anyHearingNeeds', v)} />
    <YesNo label="Any Speech Impairment" col="col-md-4" value={form.communication.anySpeechImpairment} onChange={(v) => setField('communication.anySpeechImpairment', v)} />
    <YesNo label="Any Visual Impairment" col="col-md-4" value={form.communication.anyVisualImpairment} onChange={(v) => setField('communication.anyVisualImpairment', v)} />
    <YesNo label="Any Understanding Difficulties" col="col-md-4" value={form.communication.anyUnderstandingDifficulties} onChange={(v) => setField('communication.anyUnderstandingDifficulties', v)} />
    <Field label="Communication Notes" col="col-md-12"><textarea className={inp} rows={2} placeholder="Additional details..." value={form.communication.communicationNotes} onChange={(e) => setField('communication.communicationNotes', e.target.value)} /></Field>
  </div>);
}
function TabInfection({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Infection Control</SectionTitle>
    <YesNo label="Infection Prevention & Control Risk Assessment Care Plan Completed" value={form.infection.InfectionCarePlanCompletion} onChange={(v) => setField('infection.InfectionCarePlanCompletion', v)} />
    <YesNo label="Patient Bed Bound" value={form.infection.isThePatientBedBound} onChange={(v) => setField('infection.isThePatientBedBound', v)} />
    <SectionTitle>Diabetes</SectionTitle>
    <YesNo label="Does the Patient Have Diabetes?" col="col-md-4" value={form.infection.anyDiabetes} onChange={(v) => setField('infection.anyDiabetes', v)} />
    <YesNo label="Diabetes Care Plan Completed (if yes)" col="col-md-4" value={form.infection.DiabetesCarePlanCompletion} onChange={(v) => setField('infection.DiabetesCarePlanCompletion', v)} />
    <YesNo label="Anti-embolism Stockings for Stroke / Bed Bound" col="col-md-4" value={form.infection.isThePatientBedBound} onChange={(v) => setField('infection.isThePatientBedBound', v)} />
  </div>);
}
function TabBreathing({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Breathing</SectionTitle>
    <YesNo label="Any Breathing Difficulties" col="col-md-3" value={form.breathing.anyBreathingDifficulties} onChange={(v) => setField('breathing.anyBreathingDifficulties', v)} />
    <YesNo label="Home Oxygen / Nebs / CPAP / BiPAP" col="col-md-3" value={form.breathing.homeOxygenNeeded} onChange={(v) => setField('breathing.homeOxygenNeeded', v)} />
    <YesNo label="Smoker" col="col-md-3" value={form.breathing.isSmoker} onChange={(v) => setField('breathing.isSmoker', v)} />
    <YesNo label="Ever Smoked" col="col-md-3" value={form.breathing.everSmoked} onChange={(v) => setField('breathing.everSmoked', v)} />
    <SectionTitle>Pain</SectionTitle>
    <YesNo label="Pain Present" col="col-md-3" value={form.breathing.painPresent} onChange={(v) => setField('breathing.painPresent', v)} />
    <YesNo label="Analgesia Prescribed" col="col-md-3" value={form.breathing.anagelsiaPrescribed} onChange={(v) => setField('breathing.anagelsiaPrescribed', v)} />
    <Field label="Location of Pain" col="col-md-3"><input className={inp} placeholder="e.g. Lower back" value={form.breathing.locationOfPain} onChange={(e) => setField('breathing.locationOfPain', e.target.value)} /></Field>
    <Field label="Pain Score" col="col-md-3"><select className={sel} value={form.breathing.painScore} onChange={(e) => setField('breathing.painScore', e.target.value)}><option value="">Select...</option><option value="0">0 — No Pain</option><option value="1">1 — Mild Pain</option><option value="2">2 — Moderate Pain</option><option value="3">3 — Severe Pain</option></select></Field>
  </div>);
}
function TabSleep({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Sleep</SectionTitle>
    <YesNo label="Gets Up at Night" col="col-md-4" value={form.sleepNutrition.sleep.wakeUpAtNight} onChange={(v) => setField('sleepNutrition.sleep.wakeUpAtNight', v)} />
    <YesNo label="Night Sedation Used" col="col-md-4" value={form.sleepNutrition.sleep.UseOfNightSedation} onChange={(v) => setField('sleepNutrition.sleep.UseOfNightSedation', v)} />
    <YesNo label="Sleeps Well" col="col-md-4" value={form.sleepNutrition.sleep.userSleepWell} onChange={(v) => setField('sleepNutrition.sleep.userSleepWell', v)} />
    <YesNo label="Sleep / Rest During Day" col="col-md-4" value={form.sleepNutrition.sleep.RestDuringTheDay} onChange={(v) => setField('sleepNutrition.sleep.RestDuringTheDay', v)} />
    <Field label="Usual Time to Get Up" col="col-md-4"><input type="time" className={inp} value={form.sleepNutrition.sleep.usualTimeToWakeUp} onChange={(e) => setField('sleepNutrition.sleep.usualTimeToWakeUp', e.target.value)} /></Field>
    <Field label="Best Position for Sleeping" col="col-md-4"><input className={inp} placeholder="e.g. Left side" value={form.sleepNutrition.sleep.bestSleepingPosition} onChange={(e) => setField('sleepNutrition.sleep.bestSleepingPosition', e.target.value)} /></Field>
    <SectionTitle>Nutrition</SectionTitle>
    <YesNo label="Any Food Allergies or Intolerances" col="col-md-4" value={form.sleepNutrition.nutrition.allergy} onChange={(v) => setField('sleepNutrition.nutrition.allergy', v)} />
    <YesNo label="Any Special Diets" col="col-md-4" value={form.sleepNutrition.nutrition.specialDiet} onChange={(v) => setField('sleepNutrition.nutrition.specialDiet', v)} />
    <YesNo label="Need Help in Eating or Drinking" col="col-md-4" value={form.sleepNutrition.nutrition.needHelpInEating} onChange={(v) => setField('sleepNutrition.nutrition.needHelpInEating', v)} />
    <YesNo label="Need / Use of Feeding Aid" col="col-md-4" value={form.sleepNutrition.nutrition.feedingAid} onChange={(v) => setField('sleepNutrition.nutrition.feedingAid', v)} />
    <YesNo label="Any Swallowing Difficulties" col="col-md-4" value={form.sleepNutrition.nutrition.swallowingDifficulties} onChange={(v) => setField('sleepNutrition.nutrition.swallowingDifficulties', v)} />
    <Field label="Diet Type" col="col-md-4"><select className={sel} value={form.sleepNutrition.nutrition.dietType} onChange={(e) => setField('sleepNutrition.nutrition.dietType', e.target.value)}><option value="">Select...</option><option>Diabetic</option><option>Hypertensive</option><option>Normal</option><option>Puree</option></select></Field>
    <YesNo label="Does Service User Have an NG Tube" col="col-md-4" value={form.sleepNutrition.nutrition.ngTube} onChange={(v) => setField('sleepNutrition.nutrition.ngTube', v)} />
    <Field label="Nutrition Concerns" col="col-md-8"><textarea className={inp} rows={2} placeholder="Any concerns..." value={form.sleepNutrition.nutrition.nutritionConcerns} onChange={(e) => setField('sleepNutrition.nutrition.nutritionConcerns', e.target.value)} /></Field>
  </div>);
}
function TabHygiene({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Personal Hygiene & Grooming</SectionTitle>
    <YesNo label="Independent with Hygiene Needs" col="col-md-4" value={form.hygienePsych.personal.hygieneNeeds} onChange={(v) => setField('hygienePsych.personal.hygieneNeeds', v)} />
    <YesNo label="Mouth-Care Plan" col="col-md-4" value={form.hygienePsych.personal.mouthCarePlan} onChange={(v) => setField('hygienePsych.personal.mouthCarePlan', v)} />
    <YesNo label="Diabetes (Foot Care)" col="col-md-4" value={form.hygienePsych.personal.diabeteFoot} onChange={(v) => setField('hygienePsych.personal.diabeteFoot', v)} />
    <SectionTitle>Bladder & Bowel</SectionTitle>
    <YesNo label="Bladder and Bowel Dysfunction" col="col-md-3" value={form.hygienePsych.bladderBowel.bladderDysfunction} onChange={(v) => setField('hygienePsych.bladderBowel.bladderDysfunction', v)} />
    <Field label="Catheter Details" col="col-md-3"><input className={inp} placeholder="Type if applicable" value={form.hygienePsych.bladderBowel.catheterDescription} onChange={(e) => setField('hygienePsych.bladderBowel.catheterDescription', e.target.value)} /></Field>
    <YesNo label="Catheter Care Plan" col="col-md-3" value={form.hygienePsych.bladderBowel.catheterPlan} onChange={(v) => setField('hygienePsych.bladderBowel.catheterPlan', v)} />
    <YesNo label="Incontinent Pads" col="col-md-3" value={form.hygienePsych.bladderBowel.incontinentPads} onChange={(v) => setField('hygienePsych.bladderBowel.incontinentPads', v)} />
    <SectionTitle>Psychological</SectionTitle>
    <YesNo label="Psychological Concerns" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.psychologicalNeeds} onChange={(v) => setField('hygienePsych.psychologicalNeeds.psychologicalNeeds', v)} />
    <YesNo label="History of Depression" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.depressionHistory} onChange={(v) => setField('hygienePsych.psychologicalNeeds.depressionHistory', v)} />
    <YesNo label="History of Anxiety" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.anxietyhistory} onChange={(v) => setField('hygienePsych.psychologicalNeeds.anxietyhistory', v)} />
    <YesNo label="Signs of Dementia / Delirium" col="col-md-3" value={form.hygienePsych.psychologicalNeeds.signDementia} onChange={(v) => setField('hygienePsych.psychologicalNeeds.signDementia', v)} />
    <Field label="Psychological Notes" col="col-md-12"><textarea className={inp} rows={2} placeholder="Additional details..." value={form.hygienePsych.psychologicalNeeds.psychologicalNotes} onChange={(e) => setField('hygienePsych.psychologicalNeeds.psychologicalNotes', e.target.value)} /></Field>
  </div>);
}
function TabSkin({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Skin Integrity</SectionTitle>
    <YesNo label="Open Wounds" col="col-md-3" value={form.skinMobility.skinIntegrity.openWounds} onChange={(v) => setField('skinMobility.skinIntegrity.openWounds', v)} />
    <YesNo label="Pressure Ulcer" col="col-md-3" value={form.skinMobility.skinIntegrity.pressureUlcer} onChange={(v) => setField('skinMobility.skinIntegrity.pressureUlcer', v)} />
    <Field label="Grade on Admission" col="col-md-3"><input className={inp} placeholder="Grade" value={form.skinMobility.skinIntegrity.gradeAdmission} onChange={(e) => setField('skinMobility.skinIntegrity.gradeAdmission', e.target.value)} /></Field>
    <Field label="Security Items" col="col-md-3"><input className={inp} placeholder="Items / Lost" value={form.skinMobility.skinIntegrity.securityItems} onChange={(e) => setField('skinMobility.skinIntegrity.securityItems', e.target.value)} /></Field>
    <SectionTitle>Manual Handling Risk Assessment</SectionTitle>
    <YesNo label="Is the Patient Independently Mobile?" col="col-md-6" value={form.skinMobility.handlingAssessment.isPatientMobile} onChange={(v) => setField('skinMobility.handlingAssessment.isPatientMobile', v)} />
    <YesNo label="If No, Equipment Needed" col="col-md-6" value={form.skinMobility.handlingAssessment.isEquipmentNeeded} onChange={(v) => setField('skinMobility.handlingAssessment.isEquipmentNeeded', v)} />
    <Field label="How Much Assistance Required (No. of Staff)" col="col-md-6"><input className={inp} type="number" min="0" placeholder="e.g. 2 staff" value={form.skinMobility.handlingAssessment.numberOfStaffNeeded} onChange={(e) => setField('skinMobility.handlingAssessment.numberOfStaffNeeded', e.target.value === '' ? '' : Number(e.target.value))} /></Field>
    <YesNo label="Can the Patient Move in the Bed?" col="col-md-6" value={form.skinMobility.handlingAssessment.moveInBed} onChange={(v) => setField('skinMobility.handlingAssessment.moveInBed', v)} />
    <Field label="If No, Equipment / Staff Needed" col="col-md-6"><input className={inp} placeholder="Equipment or staff count" value={form.skinMobility.handlingAssessment.moveInBedEquipment} onChange={(e) => setField('skinMobility.handlingAssessment.moveInBedEquipment', e.target.value)} /></Field>
    <YesNo label="Can the Patient Mobilise from Bed to Chair?" col="col-md-6" value={form.skinMobility.handlingAssessment.mobilityFromBedToChair} onChange={(v) => setField('skinMobility.handlingAssessment.mobilityFromBedToChair', v)} />
    <Field label="If No, Equipment Needed" col="col-md-6"><input className={inp} placeholder="Equipment" value={form.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment} onChange={(e) => setField('skinMobility.handlingAssessment.mobilityFromBedToChairEquipment', e.target.value)} /></Field>
    <YesNo label="Can the Patient Transfer to the Toilet?" col="col-md-6" value={form.skinMobility.handlingAssessment.mobilityToWashroom} onChange={(v) => setField('skinMobility.handlingAssessment.mobilityToWashroom', v)} />
    <Field label="If No, Equipment Needed" col="col-md-6"><input className={inp} placeholder="Equipment" value={form.skinMobility.handlingAssessment.mobilityToWashroomEquipment} onChange={(e) => setField('skinMobility.handlingAssessment.mobilityToWashroomEquipment', e.target.value)} /></Field>
  </div>);
}
function TabVitals({ form, setField }) {
  return (<div className="row g-3">
    <SectionTitle>Vitals</SectionTitle>
    <Field label="Blood Pressure" col="col-md-3"><input className={inp} placeholder="e.g. 120/80 mmHg" value={form.vitals.bloodPressure} onChange={(e) => setField('vitals.bloodPressure', e.target.value)} /></Field>
    <Field label="Blood Sugar" col="col-md-3"><input className={inp} placeholder="e.g. 5.6 mmol/L" value={form.vitals.bloodSugar} onChange={(e) => setField('vitals.bloodSugar', e.target.value)} /></Field>
    <Field label="Respiration" col="col-md-3"><input className={inp} placeholder="e.g. 18 bpm" value={form.vitals.respiration} onChange={(e) => setField('vitals.respiration', e.target.value)} /></Field>
    <Field label="SPO2" col="col-md-3"><input className={inp} placeholder="e.g. 98%" value={form.vitals.sp02} onChange={(e) => setField('vitals.sp02', e.target.value)} /></Field>
    <Field label="Pulse" col="col-md-3"><input className={inp} placeholder="e.g. 72 bpm" value={form.vitals.pulseRate} onChange={(e) => setField('vitals.pulseRate', e.target.value)} /></Field>
    <Field label="Temperature" col="col-md-3"><input className={inp} placeholder="e.g. 36.8°C" value={form.vitals.temperature} onChange={(e) => setField('vitals.temperature', e.target.value)} /></Field>
    <Field label="Urinalysis" col="col-md-3"><input className={inp} placeholder="Results" value={form.vitals.urinalysis} onChange={(e) => setField('vitals.urinalysis', e.target.value)} /></Field>
    <Field label="Weight" col="col-md-3"><input className={inp} placeholder="e.g. 68 kg" value={form.vitals.weight} onChange={(e) => setField('vitals.weight', e.target.value)} /></Field>
    <SectionTitle>Admission</SectionTitle>
    <YesNo label="Client Handbook Given" col="col-md-4" value={form.checklist.clientHandBookGiven} onChange={(v) => setField('checklist.clientHandBookGiven', v)} />
    <SectionTitle>Medications</SectionTitle>
    <Field label="Current Medications" col="col-md-12"><textarea className={inp} rows={4} placeholder="List all current medications, dosages and frequency..." value={form.vitals.currentMedications || ''} onChange={(e) => setField('vitals.currentMedications', e.target.value)} /></Field>
  </div>);
}

const TAB_COMPONENTS = {
  personal: TabPersonal, nok: TabNextOfKin, checklist: TabChecklist,
  medical: TabMedical, communication: TabCommunication, infection: TabInfection,
  breathing: TabBreathing, sleep: TabSleep, hygiene: TabHygiene,
  skin: TabSkin, vitals: TabVitals,
};

export default function Patients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [completedTabs, setCompletedTabs] = useState([]);
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [patients, setPatients] = useState(patientsData);
  const [assignModal, setAssignModal] = useState(null); // patient object or null
  const [nurseSearch, setNurseSearch] = useState('');
  const [admissionForm, setAdmissionForm] = useState(initialAdmissionForm);
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [admissionError, setAdmissionError] = useState('');
  const [registrationCheck, setRegistrationCheck] = useState({ loading: false, exists: false, checkedValue: '', error: '' });
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState('');
  const [avatarLoadErrors, setAvatarLoadErrors] = useState({});

  const readPatientPhotoCache = () => {
    try {
      const raw = localStorage.getItem(PATIENT_PHOTO_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const getCachedPatientPhotoUrl = (patient) => {
    const cache = readPatientPhotoCache();
    const identifiers = [
      patient?.id,
      patient?.patientId,
      patient?.registrationNumber,
      patient?.regNo,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    for (const id of identifiers) {
      const entry = cache[id];
      if (!entry || typeof entry !== 'object') continue;
      const url = String(entry?.url || '').trim();
      const preview = String(entry?.previewDataUrl || '').trim();
      if (url) return url;
      if (preview) return preview;
    }

    return null;
  };

  const extractPatientProfileImageUrl = (patient) => {
    const profileImage = patient?.profileImage || patient?.image || patient?.photo || {};
    const documents = Array.isArray(patient?.documents) ? patient.documents : [];

    const profileDoc = documents.find((doc) => {
      const documentType = String(doc?.documentType || '').toLowerCase();
      return documentType.includes('profile') || documentType.includes('photo') || documentType.includes('avatar');
    }) || null;

    return (
      profileImage?.link?.url
      || profileImage?.url
      || patient?.profileImageUrl
      || patient?.imageUrl
      || patient?.photoUrl
      || patient?.avatarUrl
      || profileDoc?.link?.url
      || null
    );
  };

  const normalizePatient = (patient, index) => {
    const firstName = patient?.firstName || '';
    const lastName = patient?.lastName || '';
    const fullName = patient?.name || patient?.fullName || `${firstName} ${lastName}`.trim();

    const nurseCandidates = patient?.nurses
      || patient?.assignedNurses
      || patient?.assigned_nurses
      || [];

    const nurses = Array.isArray(nurseCandidates)
      ? nurseCandidates.map((nurse) => {
        if (typeof nurse === 'string') return nurse;
        return nurse?.name || `${nurse?.firstName || ''} ${nurse?.lastName || ''}`.trim() || 'Assigned Nurse';
      }).filter(Boolean)
      : [];

    const enrolledRaw = patient?.dateOfAdmission || patient?.admissionDate || patient?.createdAt || patient?.created_at || '';
    const enrolled = typeof enrolledRaw === 'string' && enrolledRaw.includes('T') ? enrolledRaw.split('T')[0] : (enrolledRaw || '-');

    const statusRaw = String(patient?.status || 'active').toLowerCase();
    const status = statusRaw === 'discharged' ? 'discharged' : 'active';
    const profileImageUrl = extractPatientProfileImageUrl(patient) || getCachedPatientPhotoUrl(patient);

    return {
      id: patient?.id || patient?.patientId || patient?.registrationNumber || `P-${String(index + 1).padStart(4, '0')}`,
      name: fullName || 'Unknown Patient',
      age: patient?.age ?? '-',
      gender: patient?.gender || '-',
      diagnosis: patient?.diagnosis || '-',
      phone: patient?.contactNumber || patient?.phone || '-',
      address: patient?.residentialAddress || patient?.address || '-',
      region: patient?.region || patient?.location || patient?.residentialAddress || '-',
      nurses,
      emergency: patient?.emergency || '-',
      status,
      enrolled,
      profileImageUrl,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const loadPatients = async () => {
      setPatientsLoading(true);
      setPatientsError('');
      try {
        const response = await apiFetch('/patients', { method: 'GET' });
        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data?.message || data?.error || 'Failed to load patients.');
        }

        const patientList = Array.isArray(data)
          ? data
          : Array.isArray(data?.patients)
            ? data.patients
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.items)
                ? data.items
                : [];

        if (!isMounted) return;

        if (patientList.length > 0) {
          setPatients(patientList.map((patient, index) => normalizePatient(patient, index)));
        } else {
          setPatients([]);
        }
      } catch (error) {
        if (!isMounted) return;
        setPatientsError(error?.message || 'Unable to fetch patients right now.');
      } finally {
        if (isMounted) setPatientsLoading(false);
      }
    };

    loadPatients();
    return () => { isMounted = false; };
  }, []);

  /* ── filtering ── */
  const filtered = patients.filter(p => {
    const sl = search.toLowerCase();
    const sm = !search || p.name.toLowerCase().includes(sl) || p.id.toLowerCase().includes(sl) || p.nurses.some(n => n.toLowerCase().includes(sl));
    const fm = filter === 'All' || p.status === filter.toLowerCase();
    return sm && fm;
  });

  /* ── sorting ── */
  const sorted = [...filtered].sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (sortCol === 'nurse') { va = (a.nurses || []).join(', '); vb = (b.nurses || []).join(', '); }
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  /* ── pagination ── */
  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paged = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const startRow = (page - 1) * rowsPerPage + 1;
  const endRow = Math.min(page * rowsPerPage, sorted.length);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  /* ── modal helpers ── */
  const markComplete = (idx) => { if (!completedTabs.includes(idx)) setCompletedTabs([...completedTabs, idx]); };
  const handleNext = () => { markComplete(activeTab); if (activeTab < TABS.length - 1) setActiveTab(activeTab + 1); };
  const handlePrev = () => { if (activeTab > 0) setActiveTab(activeTab - 1); };
  const handleSave = () => { markComplete(activeTab); };
  const setAdmissionField = (path, value) => {
    const keys = path.split('.');
    setAdmissionForm(prev => {
      const next = { ...prev };
      let cursor = next;
      let source = prev;

      for (let i = 0; i < keys.length - 1; i += 1) {
        const key = keys[i];
        cursor[key] = { ...(source?.[key] || {}) };
        cursor = cursor[key];
        source = source?.[key] || {};
      }

      cursor[keys[keys.length - 1]] = value;
      return next;
    });

    if (path === 'personal.registrationNumber') {
      setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
    }
  };

  const openModal = () => {
    setShowModal(true);
    setActiveTab(0);
    setCompletedTabs([]);
    setAdmissionError('');
    setAdmissionForm(initialAdmissionForm);
    setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
  };

  const normalizeRegistrationNumber = (value) => String(value || '').trim().toLowerCase();

  const checkRegistrationNumberExists = async (rawRegistrationNumber) => {
    const normalized = normalizeRegistrationNumber(rawRegistrationNumber);
    if (!normalized) {
      setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
      return false;
    }

    if (registrationCheck.checkedValue === normalized && !registrationCheck.error) {
      return registrationCheck.exists;
    }

    setRegistrationCheck({ loading: true, exists: false, checkedValue: normalized, error: '' });

    try {
      const response = await apiFetch('/patients', { method: 'GET' });
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Unable to validate registration number right now.');
      }

      const patientList = Array.isArray(data)
        ? data
        : Array.isArray(data?.patients)
          ? data.patients
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.items)
              ? data.items
              : [];

      const exists = patientList.some((patient) => {
        const candidate = patient?.registrationNumber || patient?.regNo || patient?.registration_number || '';
        return normalizeRegistrationNumber(candidate) === normalized;
      });

      setRegistrationCheck({ loading: false, exists, checkedValue: normalized, error: '' });
      return exists;
    } catch {
      setRegistrationCheck({
        loading: false,
        exists: false,
        checkedValue: normalized,
        error: 'Could not verify now; check will run again on submit.',
      });
      return false;
    }
  };

  const handleRegistrationBlur = async () => {
    const reg = String(admissionForm.personal.registrationNumber || '').trim();
    if (!reg) {
      setRegistrationCheck({ loading: false, exists: false, checkedValue: '', error: '' });
      return;
    }
    await checkRegistrationNumberExists(reg);
  };

  const ActiveTabComponent = TAB_COMPONENTS[TABS[activeTab].key];
  const progress = Math.round((completedTabs.length / TABS.length) * 100);

  const pgBtn = (onClick, disabled, children) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '6px 10px', border: '1px solid var(--kh-border-light)', borderRadius: 2,
      background: disabled ? 'var(--kh-off-white)' : '#fff', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'var(--kh-text-muted)' : 'var(--kh-text)', fontSize: 13, display: 'flex', alignItems: 'center',
    }}>{children}</button>
  );

  const extractPatientId = (data) => (
    data?.patientId
    || data?.id
    || data?.patient?.id
    || data?.patient?.patientId
    || null
  );

  const createPatientAdmission = async () => {
    setSavingAdmission(true);
    setAdmissionError('');

    try {
      const requestJson = async (path, method, body) => {
        const response = await apiFetch(path, {
          method,
          body: JSON.stringify(body),
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data?.message || data?.error || `Failed request: ${path}`);
        }

        return data;
      };

      const postJson = (path, body) => requestJson(path, 'POST', body);
      const patchJson = (path, body) => requestJson(path, 'PATCH', body);

      const typedRegistrationNumber = String(admissionForm.personal.registrationNumber || '').trim();
      if (!typedRegistrationNumber) {
        throw new Error('Please enter a registration number before submitting the admission form.');
      }

      const alreadyExists = await checkRegistrationNumberExists(typedRegistrationNumber);
      if (alreadyExists) {
        throw new Error(`Registration number "${typedRegistrationNumber}" already exists in your organization.`);
      }

      const personalInfoPayload = {
        registrationNumber: typedRegistrationNumber,
        dateOfAssessment: admissionForm.personal.dateOfAssessment,
        dateOfAdmission: admissionForm.personal.dateOfAdmission,
        firstName: admissionForm.personal.firstName,
        lastName: admissionForm.personal.lastName,
        preferredName: admissionForm.personal.preferredName,
        contactNumber: admissionForm.personal.contactNumber,
        dateOfBirth: admissionForm.personal.dateOfBirth,
        age: admissionForm.personal.age,
        gender: admissionForm.personal.gender,
        residentialAddress: admissionForm.personal.residentialAddress,
        gpsCode: admissionForm.personal.gpsCode,
        email: admissionForm.personal.email,
      };

      const personalInfoResponse = await postJson('/patients/personal-info', personalInfoPayload);
      const patientId = extractPatientId(personalInfoResponse);

      if (!patientId) {
        throw new Error('Patient created but patientId was not returned by /patients/personal-info');
      }

      await postJson('/patients/next-of-kin', {
        patientId,
        fullName: admissionForm.nextOfKin.fullName,
        relationship: admissionForm.nextOfKin.relationship,
        contactOne: admissionForm.nextOfKin.contactOne,
        contactTwo: admissionForm.nextOfKin.contactTwo,
        spiritualNeed: admissionForm.nextOfKin.spiritualNeed,
        personalDoctor: admissionForm.nextOfKin.personalDoctor,
        personalDoctorFacility: admissionForm.nextOfKin.personalDoctorFacility,
        personalDoctorContact: admissionForm.nextOfKin.personalDoctorContact,
      });

      await postJson('/patients/admission-checklist', {
        patientId,
        clientHandBookGiven: Boolean(admissionForm.checklist.clientHandBookGiven),
        admittingNurse: admissionForm.checklist.admittingNurse,
        infectionControlSupplies: Boolean(admissionForm.checklist.infectionControlSupplies),
      });

      await postJson('/patients/medical-history', {
        patientId,
        anyMedicalHistory: Boolean(admissionForm.medical.anyMedicalHistory),
        medicalHistoryDescription: admissionForm.medical.medicalHistoryDescription,
      });

      await postJson('/patients/communication-style', {
        patientId,
        anyCommunicationNeeds: Boolean(admissionForm.communication.anyCommunicationNeeds),
        anyHearingNeeds: Boolean(admissionForm.communication.anyHearingNeeds),
        anySpeechImpairment: Boolean(admissionForm.communication.anySpeechImpairment),
        anyVisualImpairment: Boolean(admissionForm.communication.anyVisualImpairment),
        anyUnderstandingDifficulties: Boolean(admissionForm.communication.anyUnderstandingDifficulties),
        communicationNotes: admissionForm.communication.communicationNotes,
      });

      await postJson('/patients/infection-control', {
        patientId,
        InfectionCarePlanCompletion: Boolean(admissionForm.infection.InfectionCarePlanCompletion),
        anyDiabetes: Boolean(admissionForm.infection.anyDiabetes),
        DiabetesCarePlanCompletion: Boolean(admissionForm.infection.DiabetesCarePlanCompletion),
        isThePatientBedBound: Boolean(admissionForm.infection.isThePatientBedBound),
      });

      await postJson('/patients/breath-pain', {
        patientId,
        anyBreathingDifficulties: Boolean(admissionForm.breathing.anyBreathingDifficulties),
        homeOxygenNeeded: Boolean(admissionForm.breathing.homeOxygenNeeded),
        isSmoker: Boolean(admissionForm.breathing.isSmoker),
        everSmoked: Boolean(admissionForm.breathing.everSmoked),
        painPresent: admissionForm.breathing.painPresent ? 'Yes' : 'No',
        anagelsiaPrescribed: Boolean(admissionForm.breathing.anagelsiaPrescribed),
        locationOfPain: admissionForm.breathing.locationOfPain,
        painScore: admissionForm.breathing.painScore,
      });

      const sleepNutritionPayload = {
        patientId,
        sleep: {
          wakeUpAtNight: Boolean(admissionForm.sleepNutrition.sleep.wakeUpAtNight),
          UseOfNightSedation: Boolean(admissionForm.sleepNutrition.sleep.UseOfNightSedation),
          userSleepWell: Boolean(admissionForm.sleepNutrition.sleep.userSleepWell),
          RestDuringTheDay: Boolean(admissionForm.sleepNutrition.sleep.RestDuringTheDay),
          usualTimeToWakeUp: admissionForm.sleepNutrition.sleep.usualTimeToWakeUp,
          bestSleepingPosition: admissionForm.sleepNutrition.sleep.bestSleepingPosition,
        },
        nutrition: {
          allergy: Boolean(admissionForm.sleepNutrition.nutrition.allergy),
          specialDiet: Boolean(admissionForm.sleepNutrition.nutrition.specialDiet),
          needHelpInEating: Boolean(admissionForm.sleepNutrition.nutrition.needHelpInEating),
          feedingAid: Boolean(admissionForm.sleepNutrition.nutrition.feedingAid),
          swallowingDifficulties: Boolean(admissionForm.sleepNutrition.nutrition.swallowingDifficulties),
          dietType: admissionForm.sleepNutrition.nutrition.dietType,
          ngTube: Boolean(admissionForm.sleepNutrition.nutrition.ngTube),
          nutritionConcerns: admissionForm.sleepNutrition.nutrition.nutritionConcerns,
        },
      };

      const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '');

      const hygienePsychPayload = {
        personal: {
          hygieneNeeds: yesNo(admissionForm.hygienePsych.personal.hygieneNeeds),
          mouthCarePlan: yesNo(admissionForm.hygienePsych.personal.mouthCarePlan),
          diabeteFoot: yesNo(admissionForm.hygienePsych.personal.diabeteFoot),
        },
        bladderBowel: {
          bladderDysfunction: yesNo(admissionForm.hygienePsych.bladderBowel.bladderDysfunction),
          catheterDescription: admissionForm.hygienePsych.bladderBowel.catheterDescription,
          catheterPlan: yesNo(admissionForm.hygienePsych.bladderBowel.catheterPlan),
          incontinentPads: yesNo(admissionForm.hygienePsych.bladderBowel.incontinentPads),
        },
        psychologicalNeeds: {
          psychologicalNeeds: yesNo(admissionForm.hygienePsych.psychologicalNeeds.psychologicalNeeds),
          depressionHistory: yesNo(admissionForm.hygienePsych.psychologicalNeeds.depressionHistory),
          anxietyhistory: yesNo(admissionForm.hygienePsych.psychologicalNeeds.anxietyhistory),
          signDementia: yesNo(admissionForm.hygienePsych.psychologicalNeeds.signDementia),
          psychologicalNotes: admissionForm.hygienePsych.psychologicalNeeds.psychologicalNotes,
        },
      };

      try {
        await postJson('/patients/sleep-nutrition', sleepNutritionPayload);
      } catch (error) {
        const message = String(error?.message || '').toLowerCase();
        if (message.includes('already exists') || message.includes('use patch')) {
          await patchJson('/patients/sleep-nutrition', sleepNutritionPayload);
        } else {
          throw error;
        }
      }

      try {
        await patchJson('/patients/sleep-nutrition', {
          patientId,
          sleep: sleepNutritionPayload.sleep,
          nutrition: sleepNutritionPayload.nutrition,
          ...hygienePsychPayload,
        });
      } catch {
      }

      await postJson('/patients/skin-mobility', {
        patientId,
        skinIntegrity: {
          openWounds: Boolean(admissionForm.skinMobility.skinIntegrity.openWounds),
          pressureUlcer: Boolean(admissionForm.skinMobility.skinIntegrity.pressureUlcer),
          gradeAdmission: admissionForm.skinMobility.skinIntegrity.gradeAdmission,
          securityItems: admissionForm.skinMobility.skinIntegrity.securityItems,
        },
        handlingAssessment: {
          isPatientMobile: Boolean(admissionForm.skinMobility.handlingAssessment.isPatientMobile),
          isEquipmentNeeded: Boolean(admissionForm.skinMobility.handlingAssessment.isEquipmentNeeded),
          numberOfStaffNeeded: Number(admissionForm.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
          moveInBed: Boolean(admissionForm.skinMobility.handlingAssessment.moveInBed),
          moveInBedEquipment: admissionForm.skinMobility.handlingAssessment.moveInBedEquipment,
          mobilityFromBedToChair: Boolean(admissionForm.skinMobility.handlingAssessment.mobilityFromBedToChair),
          mobilityFromBedToChairEquipment: admissionForm.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
          mobilityToWashroom: Boolean(admissionForm.skinMobility.handlingAssessment.mobilityToWashroom),
          mobilityToWashroomEquipment: admissionForm.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
        },
      });

      await postJson('/patients/initial-vitals', {
        patientId,
        bloodPressure: admissionForm.vitals.bloodPressure,
        bloodSugar: admissionForm.vitals.bloodSugar,
        respiration: admissionForm.vitals.respiration,
        sp02: admissionForm.vitals.sp02,
        pulseRate: admissionForm.vitals.pulseRate,
        temperature: admissionForm.vitals.temperature,
        urinalysis: admissionForm.vitals.urinalysis,
        weight: admissionForm.vitals.weight,
      });

      const objectKey = String(admissionForm.profileImage.objectKey || '').trim();
      const mediaId = String(admissionForm.profileImage.mediaId || '').trim();
      if (objectKey && mediaId) {
        await postJson('/patients/profile-image', {
          patientId,
          objectKey,
          mediaId,
        });
      }

      setPatients(prev => ([
        {
          id: patientId,
          name: `${personalInfoPayload.firstName} ${personalInfoPayload.lastName}`,
          age: Number(personalInfoPayload.age) || '-',
          gender: personalInfoPayload.gender,
          diagnosis: '-',
          phone: personalInfoPayload.contactNumber,
          address: personalInfoPayload.residentialAddress,
          region: personalInfoPayload.residentialAddress,
          nurses: [],
          emergency: '-',
          status: 'active',
          enrolled: personalInfoPayload.dateOfAdmission,
        },
        ...prev,
      ]));

      markComplete(activeTab);
      setShowModal(false);
    } catch (error) {
      const message = String(error?.message || 'Unable to submit admission form.');
      const typedRegistrationNumber = String(admissionForm.personal.registrationNumber || '').trim();
      if (message.toLowerCase().includes('registration number already exists') && typedRegistrationNumber) {
        setAdmissionError(`Registration number "${typedRegistrationNumber}" already exists in your organization.`);
      } else {
        setAdmissionError(message);
      }
    } finally {
      setSavingAdmission(false);
    }
  };

  return (
    <motion.div className="page-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24 }}>

      {/* Data Table Card */}
      <motion.div className="kh-card" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
        {/* Tab bar with green background */}
        <div style={{ background: '#45B6FE', padding: '14px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div className="d-flex gap-2 align-items-center">
            <div style={{ position: 'relative' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
              <input className="form-control form-control-kh" placeholder="Search patients..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 34, width: 240, fontSize: 13, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }} />
            </div>
            <div className="d-flex gap-1">
              {['All', 'Active', 'Discharged'].map(f => (
                <button key={f} onClick={() => { setFilter(f); setPage(1); }} style={{
                  padding: '6px 16px', borderRadius: 2, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: filter === f ? '#fff' : 'rgba(255,255,255,0.15)',
                  color: filter === f ? '#45B6FE' : '#fff',
                  transition: 'all 0.15s',
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{filtered.length} patients</span>
            <button className="btn d-flex align-items-center gap-2" onClick={openModal} style={{
              background: '#fff', color: '#45B6FE', fontSize: 13, fontWeight: 700, borderRadius: 2, padding: '7px 16px', border: 'none',
            }}>
              <FiPlus size={15} /> Admit Client
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table kh-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('name')}>Patient <SortIcon col="name" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('age')}>Age <SortIcon col="age" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('gender')}>Gender <SortIcon col="gender" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('region')}>Region <SortIcon col="region" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('nurse')}>Assigned Nurse <SortIcon col="nurse" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('enrolled')}>Enrolled <SortIcon col="enrolled" /></th>
                <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('status')}>Status <SortIcon col="status" /></th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {patientsLoading && (
                <tr><td colSpan={9} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>Loading patients...</td></tr>
              )}
              {!patientsLoading && patientsError && (
                <tr><td colSpan={9} className="text-center py-4" style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{patientsError}</td></tr>
              )}
              {!patientsLoading && !patientsError && paged.map((p, i) => (
                <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="col-num">{startRow + i}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {(() => {
                        const avatarKey = `${p.id}::${p.profileImageUrl || ''}`;
                        const showImage = Boolean(p.profileImageUrl) && !avatarLoadErrors[avatarKey];
                        return (
                      <div className="avatar sm" style={{
                        background: showImage ? '#fff' : (i % 2 === 0 ? '#45B6FE' : '#2E7DB8'),
                        overflow: 'hidden',
                        borderRadius: '50%',
                      }}>
                        {showImage
                          ? <img
                              src={p.profileImageUrl}
                              alt={p.name}
                              loading="lazy"
                              onError={() => setAvatarLoadErrors(prev => ({ ...prev, [avatarKey]: true }))}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            />
                          : p.name.split(' ').map(n => n[0]).join('')}
                      </div>
                        );
                      })()}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--kh-text)', fontSize: 13 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{p.age}</td>
                  <td style={{ fontSize: 13 }}>{p.gender}</td>
                  <td style={{ fontSize: 13 }}>{p.region}</td>
                  <td style={{ fontSize: 13 }}>
                    <div className="d-flex flex-wrap align-items-center gap-1">
                      {p.nurses.map((name, ni) => (
                        <span key={ni} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#D6ECFC', color: '#1565A0', border: '1px solid #BAE0FD',
                          borderRadius: 2, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                        }}>
                          {name}
                          <span
                            onClick={e => { e.stopPropagation(); setPatients(prev => prev.map(pt => pt.id === p.id ? { ...pt, nurses: pt.nurses.filter((_, idx) => idx !== ni) } : pt)); }}
                            style={{ cursor: 'pointer', marginLeft: 2, color: '#1565A0', fontWeight: 700, fontSize: 13, lineHeight: 1 }}
                            title={`Remove ${name}`}
                          >×</span>
                        </span>
                      ))}
                      <button
                        onClick={e => { e.stopPropagation(); setAssignModal(p); setNurseSearch(''); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: p.nurses.length === 0 ? '#fff4ed' : '#f0f0f0',
                          color: p.nurses.length === 0 ? '#ea580c' : '#6b7280',
                          border: `1px solid ${p.nurses.length === 0 ? '#fed7aa' : '#d1d5db'}`,
                          borderRadius: 2, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#45B6FE'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#45B6FE'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = p.nurses.length === 0 ? '#fff4ed' : '#f0f0f0'; e.currentTarget.style.color = p.nurses.length === 0 ? '#ea580c' : '#6b7280'; e.currentTarget.style.borderColor = p.nurses.length === 0 ? '#fed7aa' : '#d1d5db'; }}
                      >
                        <FiUserPlus size={11} /> {p.nurses.length === 0 ? 'Assign' : '+'}
                      </button>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{p.enrolled}</td>
                  <td><span className={`badge-kh ${p.status === 'active' ? 'completed' : 'scheduled'}`}>{p.status}</span></td>
                  <td style={{ textAlign: 'center' }}><FiChevronRight size={14} style={{ color: '#45B6FE' }} /></td>
                </tr>
              ))}
              {!patientsLoading && !patientsError && paged.length === 0 && (
                <tr><td colSpan={9} className="text-center py-4" style={{ color: 'var(--kh-text-muted)', fontSize: 13 }}>No patients found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div style={{ padding: '14px 22px', borderTop: '2px solid #D6ECFC', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="d-flex align-items-center gap-2" style={{ fontSize: 12.5, color: 'var(--kh-text-muted)' }}>
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              style={{ border: '1px solid #d1d5db', borderRadius: 2, padding: '5px 10px', fontSize: 12.5, background: '#fff', color: 'var(--kh-text)', fontWeight: 600 }}
            >
              {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#2E7DB8' }}>Showing {startRow}–{endRow} of {sorted.length}</span>
          </div>
          <div className="d-flex gap-1">
            {pgBtn(() => setPage(1), page === 1, <FiChevronsLeft size={14} />)}
            {pgBtn(() => setPage(p => p - 1), page === 1, <FiChevronLeft size={14} />)}
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <span key={p}>
                  {showEllipsis && <span style={{ padding: '6px 4px', fontSize: 12, color: 'var(--kh-text-muted)' }}>…</span>}
                  <button onClick={() => setPage(p)} style={{
                    padding: '6px 12px', border: '1px solid var(--kh-border-light)', borderRadius: 2,
                    background: page === p ? '#45B6FE' : '#fff', color: page === p ? '#fff' : 'var(--kh-text)',
                    cursor: 'pointer', fontSize: 12.5, fontWeight: page === p ? 700 : 400,
                  }}>{p}</button>
                </span>
              );
            })}
            {pgBtn(() => setPage(p => p + 1), page === totalPages, <FiChevronRight size={14} />)}
            {pgBtn(() => setPage(totalPages), page === totalPages, <FiChevronsRight size={14} />)}
          </div>
        </div>
      </motion.div>

      {/* ═══ ASSIGN NURSE MODAL ═══ */}
      {assignModal && (() => {
        const currentPatient = patients.find(p => p.id === assignModal.id);
        const assignedNames = currentPatient ? currentPatient.nurses : [];
        return (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 1060 }} onClick={() => setAssignModal(null)}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: 2, border: 'none', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ background: '#45B6FE', padding: '18px 24px', color: '#fff' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 style={{ fontWeight: 700, fontSize: 16, margin: 0, color: '#fff' }}>Assign Nurses</h6>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                      Patient: <strong>{assignModal.name}</strong> ({assignModal.id}) · {assignModal.region}
                    </div>
                  </div>
                  <button onClick={() => setAssignModal(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 2, padding: '5px 7px', cursor: 'pointer', color: '#fff', display: 'flex' }}><FiX size={16} /></button>
                </div>
                {/* Currently assigned badges */}
                {assignedNames.length > 0 && (
                  <div className="d-flex flex-wrap gap-1" style={{ marginTop: 10 }}>
                    {assignedNames.map((name, i) => (
                      <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 2,
                        padding: '3px 10px', fontSize: 11.5, fontWeight: 600,
                      }}>
                        {name}
                        <span
                          onClick={() => setPatients(prev => prev.map(pt => pt.id === assignModal.id ? { ...pt, nurses: pt.nurses.filter((_, idx) => idx !== i) } : pt))}
                          style={{ cursor: 'pointer', marginLeft: 2, fontWeight: 700, fontSize: 14, lineHeight: 1, opacity: 0.8 }}
                          title={`Remove ${name}`}
                        >×</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Search */}
              <div style={{ padding: '16px 24px 8px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ position: 'relative' }}>
                  <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--kh-text-muted)' }} />
                  <input className="form-control form-control-kh" placeholder="Search by name, specialisation or region..." value={nurseSearch}
                    onChange={e => setNurseSearch(e.target.value)} style={{ paddingLeft: 34, fontSize: 13 }} />
                </div>
              </div>
              {/* Nurse List */}
              <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
                {nursesList
                  .filter(nr => !nurseSearch || nr.name.toLowerCase().includes(nurseSearch.toLowerCase()) || nr.specialisation.toLowerCase().includes(nurseSearch.toLowerCase()) || nr.region.toLowerCase().includes(nurseSearch.toLowerCase()))
                  .map(nr => {
                    const isAssigned = assignedNames.includes(nr.name);
                    return (
                    <div key={nr.id}
                      onClick={() => {
                        if (isAssigned) {
                          setPatients(prev => prev.map(pt => pt.id === assignModal.id ? { ...pt, nurses: pt.nurses.filter(n => n !== nr.name) } : pt));
                        } else {
                          setPatients(prev => prev.map(pt => pt.id === assignModal.id ? { ...pt, nurses: [...pt.nurses, nr.name] } : pt));
                        }
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid #f3f4f6', background: isAssigned ? '#F0F7FE' : 'transparent' }}
                      onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.background = '#fafbfc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isAssigned ? '#F0F7FE' : 'transparent'; }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isAssigned ? '#45B6FE' : '#D6ECFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: isAssigned ? '#fff' : '#45B6FE' }}>
                          {isAssigned ? <FiCheck size={16} /> : nr.name.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--kh-text)' }}>{nr.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>{nr.specialisation} · {nr.region}</div>
                        </div>
                      </div>
                      {isAssigned ? (
                        <button style={{
                          background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 2,
                          padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <FiX size={13} /> Remove
                        </button>
                      ) : (
                        <button style={{
                          background: '#45B6FE', color: '#fff', border: 'none', borderRadius: 2,
                          padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <FiPlus size={13} /> Assign
                        </button>
                      )}
                    </div>
                    );
                  })}
              </div>
              {/* Footer */}
              <div style={{ padding: '14px 24px', borderTop: '2px solid #D6ECFC', background: '#fafbfc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12.5, color: '#2E7DB8', fontWeight: 600 }}>{assignedNames.length} nurse{assignedNames.length !== 1 ? 's' : ''} assigned</span>
                <button onClick={() => setAssignModal(null)} style={{
                  background: '#45B6FE', color: '#fff', border: 'none', borderRadius: 2,
                  padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>Done</button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ═══ ADMISSION MODAL ═══ */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 1060 }} onClick={() => setShowModal(false)}>
          <div style={{ display: 'flex', height: '100vh', padding: 30, maxWidth: 'calc(100vw - 40px)', margin: '0 auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', width: '100%', background: '#fff', borderRadius: 2, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.15)' }}>
              {/* LEFT: Tab Navigation */}
              <div style={{ width: 260, background: 'var(--kh-off-white)', borderRight: '1px solid var(--kh-border-light)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid var(--kh-border-light)' }}>
                  <h6 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--kh-text)' }}>Client Admission</h6>
                  <p style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', margin: '4px 0 12px' }}>Complete each section. Save & continue anytime.</p>
                  <div style={{ background: 'var(--kh-border-light)', borderRadius: 10, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#45B6FE', borderRadius: 10, transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginTop: 6, fontWeight: 600 }}>{progress}% complete — {completedTabs.length} of {TABS.length} sections</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                  {TABS.map((tab, i) => {
                    const isActive = activeTab === i;
                    const isDone = completedTabs.includes(i);
                    return (
                      <button key={tab.key} onClick={() => setActiveTab(i)} style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 12px', marginBottom: 2, border: 'none', borderRadius: 2,
                        background: isActive ? '#fff' : 'transparent',
                        boxShadow: isActive ? 'var(--kh-shadow-sm)' : 'none',
                        cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0,
                          background: isDone ? '#45B6FE' : isActive ? 'var(--kh-primary-light)' : 'var(--kh-border-light)',
                          color: isDone ? '#fff' : isActive ? '#45B6FE' : 'var(--kh-text-muted)',
                        }}>{isDone ? <FiCheck size={13} /> : tab.num}</div>
                        <span style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--kh-text)' : 'var(--kh-text-muted)' }}>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* RIGHT: Form Content */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--kh-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div>
                    <h6 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Client Admission Form</h6>
                    <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>Step {activeTab + 1} of {TABS.length} — {TABS[activeTab].label}</span>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--kh-text-muted)', padding: 6 }}><FiX size={20} /></button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}><ActiveTabComponent form={admissionForm} setField={setAdmissionField} onRegistrationBlur={handleRegistrationBlur} registrationCheck={registrationCheck} /></div>
                <div style={{ padding: '14px 28px', borderTop: '1px solid var(--kh-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div>{activeTab > 0 && <button onClick={handlePrev} className="btn btn-kh-outline d-flex align-items-center gap-1" style={{ fontSize: 13 }}><FiChevronLeft size={15} /> Previous</button>}</div>
                  <div className="d-flex gap-2">
                    <button onClick={handleSave} className="btn btn-kh-outline d-flex align-items-center gap-1" style={{ fontSize: 13 }}><FiSave size={14} /> Save Progress</button>
                    {activeTab < TABS.length - 1 ? (
                      <button onClick={handleNext} className="btn btn-kh-primary d-flex align-items-center gap-1" style={{ fontSize: 13 }}>Save & Continue <FiChevronRight size={15} /></button>
                    ) : (
                      <button onClick={createPatientAdmission} disabled={savingAdmission} className="btn btn-kh-primary d-flex align-items-center gap-1" style={{ fontSize: 13, opacity: savingAdmission ? 0.75 : 1, cursor: savingAdmission ? 'not-allowed' : 'pointer' }}>
                        <FiCheck size={15} /> {savingAdmission ? 'Submitting...' : 'Complete Admission'}
                      </button>
                    )}
                  </div>
                </div>
                {admissionError && (
                  <div style={{ padding: '0 28px 14px', color: '#dc2626', fontSize: 12.5, fontWeight: 600 }}>
                    {admissionError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
