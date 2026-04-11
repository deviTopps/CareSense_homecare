import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import {
  FiArrowLeft, FiPhone, FiMail, FiMapPin, FiCalendar,
  FiUser, FiHeart, FiActivity, FiShield, FiFileText, FiEdit2,
  FiAlertTriangle, FiAlertCircle, FiCheckCircle, FiThermometer, FiClipboard,
  FiPrinter, FiMoreHorizontal, FiClock, FiCamera, FiPlus, FiX, FiSend,
  FiSearch, FiBell, FiChevronDown, FiChevronRight, FiBarChart2
} from 'react-icons/fi';

/* ── Patient data ── */
const patientsData = [
  {
    id: 'P-1001', name: 'Kwame Boateng', preferredName: 'Kwame', age: 72, gender: 'Male', dob: '1954-03-12',
    diagnosis: 'Hypertension, Type 2 Diabetes', phone: '+233 24 111 2222', email: 'kwame.b@email.com',
    address: '14 Osu Badu St, Accra', gps: 'GA-045-1234', region: 'Accra',
    nurse: 'Efua Mensah', nursePin: 'RN-0042',
    emergency: { name: 'Ama Boateng', relationship: 'Wife', phone: '+233 20 333 4444' },
    doctor: { name: 'Dr. Kwesi Asare', facility: 'Ridge Hospital', phone: '+233 30 278 5678' },
    status: 'active', enrolled: '2024-06-01', regNo: 'KH-2024-001',
    cultural: 'Christian — prefers prayer before meals',
    handbookGiven: true,
    infection: { riskPlan: true, diarrhea: false },
    diabetes: { has: true, carePlan: true, stockings: false },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: true },
    pain: { present: true, analgesia: 'Paracetamol 500mg', location: 'Lower back', score: 1 },
    sleep: { nightWake: true, sedation: false, sleepsWell: true, bestPosition: 'Left side', wakeTime: '06:00' },
    nutrition: { allergies: false, specialDiet: true, dietType: 'Diabetic', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: true, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: false, depression: false, anxiety: false, dementia: false },
    skin: { openWounds: false, pressureUlcer: false },
    mobility: { independent: true, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '138/88', sugar: '7.2 mmol/L', resp: '18', spo2: '97%', pulse: '78', temp: '36.6°C', weight: '82 kg', urinalysis: 'Normal' },
    medications: 'Metformin 500mg BD, Amlodipine 5mg OD, Aspirin 75mg OD',
    communication: { needs: false, hearing: false, speech: false, visual: true, understanding: false },
    medicalHistory: 'Appendectomy (1998), Knee replacement (2018)',
  },
  {
    id: 'P-1002', name: 'Abena Osei', preferredName: 'Abena', age: 65, gender: 'Female', dob: '1961-05-22',
    diagnosis: 'Post-surgical wound care', phone: '+233 20 555 6666', email: 'abena.osei@email.com',
    address: '7 Adum Road, Kumasi', gps: 'AK-012-5678', region: 'Kumasi',
    nurse: 'Yaa Asantewaa', nursePin: 'RN-0018',
    emergency: { name: 'Kofi Osei', relationship: 'Son', phone: '+233 27 777 8888' },
    doctor: { name: 'Dr. Ama Serwaa', facility: 'Komfo Anokye Teaching Hospital', phone: '+233 32 202 3456' },
    status: 'active', enrolled: '2024-08-15', regNo: 'KH-2024-015',
    cultural: 'Muslim — observes Ramadan',
    handbookGiven: true,
    infection: { riskPlan: true, diarrhea: false },
    diabetes: { has: false, carePlan: false, stockings: false },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: false },
    pain: { present: true, analgesia: 'Tramadol 50mg', location: 'Surgical site (abdomen)', score: 2 },
    sleep: { nightWake: true, sedation: true, sleepsWell: false, bestPosition: 'Back', wakeTime: '07:00' },
    nutrition: { allergies: true, specialDiet: false, dietType: 'Normal', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: false, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: true, depression: false, anxiety: true, dementia: false },
    skin: { openWounds: true, pressureUlcer: false },
    mobility: { independent: false, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '125/82', sugar: '5.1 mmol/L', resp: '16', spo2: '99%', pulse: '72', temp: '37.1°C', weight: '65 kg', urinalysis: 'Normal' },
    medications: 'Tramadol 50mg PRN, Amoxicillin 500mg TDS, Omeprazole 20mg OD',
    communication: { needs: false, hearing: false, speech: false, visual: false, understanding: false },
    medicalHistory: 'Hysterectomy (2025), Cholecystectomy (2019)',
  },
  {
    id: 'P-1003', name: 'Kofi Ankrah', preferredName: 'Kofi', age: 58, gender: 'Male', dob: '1968-11-04',
    diagnosis: 'Diabetes, Peripheral Neuropathy', phone: '+233 27 999 0000', email: 'kofi.a@email.com',
    address: '22 Dagomba Line, Tamale', gps: 'NT-034-7890', region: 'Tamale',
    nurse: 'Ama Darko', nursePin: 'RN-0031',
    emergency: { name: 'Yaa Ankrah', relationship: 'Wife', phone: '+233 24 111 0000' },
    doctor: { name: 'Dr. Ibrahim Mahama', facility: 'Tamale Teaching Hospital', phone: '+233 37 202 1234' },
    status: 'active', enrolled: '2024-09-20', regNo: 'KH-2024-022',
    cultural: 'Muslim — Friday prayers, halal diet',
    handbookGiven: true,
    infection: { riskPlan: true, diarrhea: false },
    diabetes: { has: true, carePlan: true, stockings: true },
    breathing: { difficulties: false, oxygen: false, smoker: false, everSmoked: false },
    pain: { present: true, analgesia: 'Gabapentin 300mg', location: 'Feet & lower legs', score: 2 },
    sleep: { nightWake: true, sedation: false, sleepsWell: false, bestPosition: 'Back elevated', wakeTime: '05:30' },
    nutrition: { allergies: false, specialDiet: true, dietType: 'Diabetic', helpEating: false, swallowing: false, ngTube: false },
    hygiene: { independent: true, mouthCare: true },
    bladder: { dysfunction: false, catheter: false, pads: false },
    psych: { concerns: false, depression: true, anxiety: false, dementia: false },
    skin: { openWounds: false, pressureUlcer: false },
    mobility: { independent: true, bedMove: true, bedToChair: true, toilet: true },
    vitals: { bp: '145/92', sugar: '9.8 mmol/L', resp: '18', spo2: '96%', pulse: '80', temp: '36.8°C', weight: '75 kg', urinalysis: 'Glucose +' },
    medications: 'Metformin 1g BD, Insulin Glargine 20u ON, Gabapentin 300mg TDS',
    communication: { needs: false, hearing: false, speech: false, visual: false, understanding: false },
    medicalHistory: 'Type 2 Diabetes diagnosed 2010, Peripheral neuropathy 2020',
  },
];

const painLabels = ['No Pain', 'Mild', 'Moderate', 'Severe'];
const painColors = ['#45B6FE', '#d97706', '#ea580c', '#ef4444'];

/* ── EHR components ── */
const YN = ({ val }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
    background: val ? '#F0F7FE' : '#fef2f2', color: val ? '#1565A0' : '#dc2626',
  }}>{val ? 'Yes' : 'No'}</span>
);

const DataRow = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12.5 }}>
    <span style={{ flexShrink: 0, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ color: 'var(--kh-text)', fontWeight: 500, textAlign: 'right' }}>{children}</span>
  </div>
);

const Panel = ({ title, icon, accent, children, action }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
    <div style={{
      padding: '10px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      borderLeft: accent ? `3px solid ${accent}` : 'none',
    }}>
      <div className="d-flex align-items-center gap-2">
        {icon && <span style={{ color: accent || '#45B6FE', display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text)' }}>{title}</span>
      </div>
      {action && action}
    </div>
    <div style={{ padding: '12px 16px' }}>{children}</div>
  </div>
);

const VitalTile = ({ label, value, flag }) => (
  <div style={{
    padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 2,
    background: flag ? '#fef2f2' : '#fafbfc', borderLeft: flag ? '3px solid #ef4444' : '3px solid #e5e7eb',
  }}>
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color: flag ? '#ef4444' : 'var(--kh-text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

const FlagItem = ({ label, status, detail }) => (
  <div className="d-flex align-items-center gap-2" style={{ padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
    <div style={{
      width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
      background: status === 'alert' ? '#ef4444' : status === 'warn' ? '#d97706' : '#45B6FE',
    }} />
    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--kh-text)', flex: 1 }}>{label}</span>
    <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{detail}</span>
  </div>
);

const TABS = [
  { key: 'chart', label: 'Chart Summary', icon: <FiClipboard size={14} /> },
  { key: 'clinical', label: 'Clinical Assessment', icon: <FiActivity size={14} /> },
  { key: 'vitals', label: 'Vitals', icon: <FiThermometer size={14} /> },
  { key: 'medications', label: 'Medications', icon: <FiFileText size={14} /> },
  { key: 'care', label: 'Lifestyle Records', icon: <FiHeart size={14} /> },
  { key: 'notes', label: 'Nurse Notes', icon: <FiEdit2 size={14} /> },
  { key: 'incidents', label: 'Incident Reports', icon: <FiAlertTriangle size={14} /> },
  { key: 'careplan', label: 'Care Plan', icon: <FiCheckCircle size={14} /> },
  { key: 'checkliststatus', label: 'Checklist Status', icon: <FiBarChart2 size={14} /> },
];

export default function PatientProfile() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('chart');
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);

  /* Medication database */
  const MEDICATION_DB = [
    { name: 'Metformin', category: 'Antidiabetic', commonDose: '500mg' },
    { name: 'Amlodipine', category: 'Antihypertensive', commonDose: '5mg' },
    { name: 'Aspirin', category: 'Antiplatelet', commonDose: '75mg' },
    { name: 'Amoxicillin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Omeprazole', category: 'Antacid', commonDose: '20mg' },
    { name: 'Paracetamol', category: 'Analgesic', commonDose: '500mg' },
    { name: 'Ibuprofen', category: 'NSAID', commonDose: '400mg' },
    { name: 'Tramadol', category: 'Opioid Analgesic', commonDose: '50mg' },
    { name: 'Gabapentin', category: 'Anticonvulsant', commonDose: '300mg' },
    { name: 'Lisinopril', category: 'ACE Inhibitor', commonDose: '10mg' },
    { name: 'Losartan', category: 'ARB', commonDose: '50mg' },
    { name: 'Atorvastatin', category: 'Statin', commonDose: '20mg' },
    { name: 'Ciprofloxacin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Furosemide', category: 'Diuretic', commonDose: '40mg' },
    { name: 'Prednisolone', category: 'Corticosteroid', commonDose: '5mg' },
    { name: 'Insulin Glargine', category: 'Insulin', commonDose: '20u' },
    { name: 'Salbutamol', category: 'Bronchodilator', commonDose: 'Inhaler' },
    { name: 'Ferrous Sulphate', category: 'Iron Supplement', commonDose: '200mg' },
    { name: 'Calcium Carbonate', category: 'Supplement', commonDose: '500mg' },
    { name: 'Erythropoietin', category: 'Hematopoietic', commonDose: 'Injection' },
    { name: 'Warfarin', category: 'Anticoagulant', commonDose: '5mg' },
    { name: 'Clopidogrel', category: 'Antiplatelet', commonDose: '75mg' },
    { name: 'Doxycycline', category: 'Antibiotic', commonDose: '100mg' },
    { name: 'Azithromycin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Diazepam', category: 'Benzodiazepine', commonDose: '5mg' },
    { name: 'Morphine', category: 'Opioid', commonDose: '10mg' },
    { name: 'Hydrochlorothiazide', category: 'Diuretic', commonDose: '25mg' },
    { name: 'Ceftriaxone', category: 'Antibiotic', commonDose: '1g' },
    { name: 'Cloxacillin', category: 'Antibiotic', commonDose: '500mg' },
    { name: 'Diclofenac', category: 'NSAID', commonDose: '50mg' },
    { name: 'Carvedilol', category: 'Beta Blocker', commonDose: '6.25mg' },
    { name: 'Nifedipine', category: 'Calcium Channel Blocker', commonDose: '30mg' },
    { name: 'Spironolactone', category: 'Diuretic', commonDose: '25mg' },
    { name: 'Digoxin', category: 'Cardiac Glycoside', commonDose: '0.25mg' },
    { name: 'Chlorpheniramine', category: 'Antihistamine', commonDose: '4mg' },
    { name: 'Cetirizine', category: 'Antihistamine', commonDose: '10mg' },
    { name: 'Multivitamin', category: 'Supplement', commonDose: '1 tab' },
    { name: 'Folic Acid', category: 'Supplement', commonDose: '5mg' },
    { name: 'Vitamin B Complex', category: 'Supplement', commonDose: '1 tab' },
    { name: 'Artemether-Lumefantrine', category: 'Antimalarial', commonDose: '20/120mg' },
  ];

  /* Medication state */
  const [addedMeds, setAddedMeds] = useState([]);
  const [deletedExistingMeds, setDeletedExistingMeds] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'existing'|'added', id: number, name: string }
  const [showMedForm, setShowMedForm] = useState(false);
  const [medForm, setMedForm] = useState({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' });
  const [drugSearch, setDrugSearch] = useState('');
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [showCustomDrug, setShowCustomDrug] = useState(false);
  const [customDrugName, setCustomDrugName] = useState('');

  /* Vitals state */
  const [vitalRecords, setVitalRecords] = useState([
    { id: 1001, date: '2026-03-24', time: '06:45', bp: '158/102', sugar: '14.2', resp: '24', spo2: '91', pulse: '112', temp: '38.6', weight: '78kg', urinalysis: 'Protein ++', recordedBy: 'Amina Mensah, RN', notes: 'Patient reported feeling dizzy and short of breath upon waking. Elevated BP and tachycardia noted. Blood sugar significantly above target. Low oxygen saturation — supplemental O₂ initiated at 2L via nasal cannula. Fever detected. Physician Dr. Kwesi Asare notified immediately for review.' },
  ]);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [vitalForm, setVitalForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    bp: '', sugar: '', resp: '', spo2: '', pulse: '', temp: '', weight: '', urinalysis: '',
    recordedBy: '', notes: '',
  });
  const [expandedVital, setExpandedVital] = useState(null);

  /* Reminder state */
  const [showReminderForm, setShowReminderForm] = useState(null); // med id
  const [reminderForm, setReminderForm] = useState({ times: ['08:00'], startDate: new Date().toISOString().slice(0, 10), endDate: '', reminderType: 'daily', notifyNurse: true, notifyPatient: false });

  /* Nurse Notes state */
  const [nurseNotes, setNurseNotes] = useState([
    { id: 1, date: '2025-01-15', time: '08:30', nurse: 'Amina Mensah, RN', category: 'Assessment', priority: 'Normal', content: 'Patient appears well-rested this morning. Vital signs stable. Reports mild discomfort in lower back, rated 3/10 on pain scale. Administered prescribed analgesic. Will reassess in 2 hours.', pinned: false },
    { id: 2, date: '2025-01-14', time: '14:15', nurse: 'Grace Osei, RN', category: 'Medication', priority: 'High', content: 'Patient experienced mild nausea after afternoon medications. Withheld evening dose of Metformin per physician order. Blood glucose monitored – within normal range (6.8 mmol/L). Physician notified and awaiting further instructions.', pinned: false },
    { id: 3, date: '2025-01-14', time: '09:00', nurse: 'Amina Mensah, RN', category: 'Care Update', priority: 'Normal', content: 'Wound dressing changed on left lower leg. Wound healing well, no signs of infection. Surrounding skin intact. Saline irrigation performed. Fresh sterile dressing applied. Next dressing change scheduled for 16 Jan.', pinned: false },
    { id: 4, date: '2025-01-13', time: '16:45', nurse: 'Kwame Boateng, RN', category: 'Communication', priority: 'Normal', content: 'Spoke with patient\'s daughter (emergency contact) regarding care progress. She expressed satisfaction with care plan. Requested update on next physician visit. Informed her visit is scheduled for 20 Jan.', pinned: false },
    { id: 5, date: '2025-01-13', time: '07:00', nurse: 'Amina Mensah, RN', category: 'Shift Handover', priority: 'Normal', content: 'Night shift report: Patient slept through the night with one bathroom break at 03:00. No falls. Vitals checked at 06:00 – all within normal limits. Morning medications due at 08:00.', pinned: false },
  ]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), nurse: '', category: 'Assessment', priority: 'Normal', content: '' });
  const [noteFilter, setNoteFilter] = useState('All');

  const FREQ_OPTIONS = ['OD', 'BD', 'TDS', 'QDS', 'PRN', 'ON', 'Weekly', 'Stat'];
  const ROUTE_OPTIONS = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Rectal', 'Sublingual'];

  /* Filtered drug list */
  const filteredDrugs = MEDICATION_DB.filter(d =>
    d.name.toLowerCase().includes(drugSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(drugSearch.toLowerCase())
  );
  const drugNotFound = drugSearch.length >= 2 && filteredDrugs.length === 0;

  const selectDrug = (drug) => {
    setMedForm(f => ({ ...f, drug: drug.name, dosage: drug.commonDose }));
    setDrugSearch(drug.name);
    setShowDrugDropdown(false);
    setShowCustomDrug(false);
  };

  const applyCustomDrug = () => {
    if (!customDrugName.trim()) return;
    setMedForm(f => ({ ...f, drug: customDrugName.trim() }));
    setDrugSearch(customDrugName.trim());
    setShowCustomDrug(false);
    setShowDrugDropdown(false);
  };

  const handleAddMed = () => {
    if (!medForm.drug || !medForm.dosage || !medForm.frequency) return;
    const newMed = { ...medForm, id: Date.now(), addedDate: new Date().toISOString().slice(0, 10), reminders: null };
    setAddedMeds(prev => [...prev, newMed]);
    setMedForm({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' });
    setDrugSearch('');
    setShowCustomDrug(false);
    setShowMedForm(false);
    /* Auto-open reminder form for the new med */
    setShowReminderForm(newMed.id);
    setReminderForm({ times: ['08:00'], startDate: new Date().toISOString().slice(0, 10), endDate: '', reminderType: 'daily', notifyNurse: true, notifyPatient: false });
  };

  const handleRemoveMed = (id) => {
    setAddedMeds(prev => prev.filter(m => m.id !== id));
    if (showReminderForm === id) setShowReminderForm(null);
  };

  const confirmDeleteMed = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'existing') {
      setDeletedExistingMeds(prev => [...prev, confirmDelete.id]);
    } else {
      handleRemoveMed(confirmDelete.id);
    }
    setConfirmDelete(null);
  };

  const saveReminder = (medId) => {
    setAddedMeds(prev => prev.map(m => m.id === medId ? { ...m, reminders: { ...reminderForm } } : m));
    setShowReminderForm(null);
    setReminderForm({ times: ['08:00'], startDate: new Date().toISOString().slice(0, 10), endDate: '', reminderType: 'daily', notifyNurse: true, notifyPatient: false });
  };

  const addReminderTime = () => {
    setReminderForm(f => ({ ...f, times: [...f.times, '12:00'] }));
  };

  const removeReminderTime = (idx) => {
    setReminderForm(f => ({ ...f, times: f.times.filter((_, i) => i !== idx) }));
  };

  const updateReminderTime = (idx, val) => {
    setReminderForm(f => ({ ...f, times: f.times.map((t, i) => i === idx ? val : t) }));
  };

  /* Vitals helpers */
  const handleAddVital = () => {
    if (!vitalForm.bp && !vitalForm.sugar && !vitalForm.pulse && !vitalForm.temp && !vitalForm.spo2 && !vitalForm.resp && !vitalForm.weight) return;
    const newRecord = { ...vitalForm, id: Date.now() };
    setVitalRecords(prev => [newRecord, ...prev]);
    setVitalForm({
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      bp: '', sugar: '', resp: '', spo2: '', pulse: '', temp: '', weight: '', urinalysis: '',
      recordedBy: '', notes: '',
    });
    setShowVitalForm(false);
  };

  const deleteVitalRecord = (id) => {
    setVitalRecords(prev => prev.filter(r => r.id !== id));
    if (expandedVital === id) setExpandedVital(null);
  };

  /* Get latest vital value (from added records or admission) */
  const getLatestVital = (field) => {
    const latest = vitalRecords.find(r => r[field]);
    return latest ? latest[field] : p.vitals[field];
  };

  /* Check if vital is flagged */
  const isVitalFlagged = (field, value) => {
    if (!value) return false;
    if (field === 'bp') return parseInt(value) >= 140;
    if (field === 'sugar') return parseFloat(value) > 7;
    if (field === 'spo2') return parseInt(value) < 95;
    if (field === 'urinalysis') return value !== 'Normal' && value !== '';
    if (field === 'temp') return parseFloat(value) > 37.5;
    if (field === 'pulse') return parseInt(value) > 100 || parseInt(value) < 60;
    return false;
  };

  /* Nurse Notes handlers */
  const NOTE_CATEGORIES = ['Assessment', 'Medication', 'Care Update', 'Communication', 'Shift Handover', 'Incident', 'Observation', 'Other'];
  const handleAddNote = () => {
    if (!noteForm.content.trim()) return;
    const newNote = { ...noteForm, id: Date.now(), pinned: false };
    setNurseNotes(prev => [newNote, ...prev]);
    setNoteForm({ date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), nurse: '', category: 'Assessment', priority: 'Normal', content: '' });
    setShowNoteForm(false);
  };
  const handleDeleteNote = (id) => {
    setNurseNotes(prev => prev.filter(n => n.id !== id));
  };
  const handlePinNote = (id) => {
    setNurseNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };
  const filteredNotes = nurseNotes
    .filter(n => noteFilter === 'All' || n.category === noteFilter)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getCategoryColor = (cat) => {
    const colors = { Assessment: '#45B6FE', Medication: '#3b82f6', 'Care Update': '#8b5cf6', Communication: '#f59e0b', 'Shift Handover': '#2E7DB8', Incident: '#dc2626', Observation: '#06b6d4', Other: '#6b7280' };
    return colors[cat] || '#6b7280';
  };

  /* ── Incident Report state ── */
  const INCIDENT_TYPES = ['Fall', 'Medication Error', 'Skin Breakdown', 'Behavioral', 'Equipment Failure', 'Missed Visit', 'Injury', 'Allergic Reaction', 'Infection', 'Other'];
  const INCIDENT_SEVERITIES = ['Minor', 'Moderate', 'Serious', 'Critical'];
  const [incidents, setIncidents] = useState([
    { id: 1, date: '2026-03-22', time: '14:05', reportedBy: 'Efua Mensah, RN', type: 'Fall', severity: 'Moderate', location: 'Bedroom — bedside', description: 'Patient slipped during bed-to-chair transfer. Grabbed side rail but lost footing. Assisted to floor safely by nurse. Bruising noted on left hip — no visible fracture. Patient alert and oriented after incident.', immediateAction: 'Ice pack applied to left hip. Vitals checked — BP 142/88, Pulse 92, stable. Patient kept in bed for observation. Physician notified.', witnesses: 'Nurse Efua Mensah', injuryDetails: 'Bruising on left hip, no open wound, no fracture suspected', followUp: 'X-ray ordered to rule out hairline fracture. Fall risk reassessment scheduled. Bed rails raised.', status: 'open', physicianNotified: true, familyNotified: true },
    { id: 2, date: '2026-03-18', time: '10:15', reportedBy: 'Amina Mensah, RN', type: 'Medication Error', severity: 'Minor', location: 'Patient home — living room', description: 'Omeprazole 40mg administered instead of prescribed 20mg during morning medication round. Error identified by nurse upon reviewing medication chart 15 minutes after administration.', immediateAction: 'Patient monitored for 2 hours. No adverse reaction observed. Physician Dr. Kwesi Asare notified immediately. Incident documented.', witnesses: 'Patient (self-report of receiving pill)', injuryDetails: 'No adverse reaction or injury', followUp: 'Double-check protocol reinforced. Medication labels reviewed. No further action needed — single dose overage within safe limits per physician.', status: 'resolved', physicianNotified: true, familyNotified: false },
    { id: 3, date: '2026-03-10', time: '08:30', reportedBy: 'Grace Osei, RN', type: 'Skin Breakdown', severity: 'Moderate', location: 'Patient home — bedroom', description: 'Stage 2 pressure ulcer identified on sacral area during morning personal care. Approximately 3cm x 2cm area of partial-thickness skin loss. Surrounding skin erythematous.', immediateAction: 'Wound cleaned with normal saline. Hydrocolloid dressing applied. Repositioning schedule initiated — every 2 hours. Nutrition assessment requested.', witnesses: 'Nurse Grace Osei', injuryDetails: 'Stage 2 pressure ulcer, sacral area, 3cm x 2cm', followUp: 'Wound care plan initiated. Pressure-relieving mattress requested. Daily wound assessment. Dietitian referral for protein supplementation.', status: 'in-progress', physicianNotified: true, familyNotified: true },
  ]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
    reportedBy: '', type: 'Fall', severity: 'Minor', location: '',
    description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
    physicianNotified: false, familyNotified: false,
  });
  const [incidentFilter, setIncidentFilter] = useState('All');
  const [expandedIncident, setExpandedIncident] = useState(null);

  const handleAddIncident = () => {
    if (!incidentForm.description.trim() || !incidentForm.type) return;
    const newIncident = { ...incidentForm, id: Date.now(), status: 'open' };
    setIncidents(prev => [newIncident, ...prev]);
    setIncidentForm({
      date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5),
      reportedBy: '', type: 'Fall', severity: 'Minor', location: '',
      description: '', immediateAction: '', witnesses: '', injuryDetails: '', followUp: '',
      physicianNotified: false, familyNotified: false,
    });
    setShowIncidentForm(false);
  };
  const handleDeleteIncident = (id) => {
    setIncidents(prev => prev.filter(inc => inc.id !== id));
    if (expandedIncident === id) setExpandedIncident(null);
  };
  const handleUpdateIncidentStatus = (id, newSt) => {
    setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: newSt } : inc));
  };
  const filteredIncidents = incidents
    .filter(inc => incidentFilter === 'All' || inc.type === incidentFilter)
    .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
  const getIncidentSeverityStyle = (sev) => {
    const styles = { Minor: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD' }, Moderate: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' }, Serious: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' }, Critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' } };
    return styles[sev] || styles.Minor;
  };
  const getIncidentStatusStyle = (st) => {
    const styles = { open: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Open' }, 'in-progress': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', label: 'In Progress' }, resolved: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', label: 'Resolved' } };
    return styles[st] || styles.open;
  };

  /* ── Care Plan state ── */
  const CARE_CATEGORIES = ['Personal Care', 'Medication Management', 'Nutrition & Diet', 'Mobility & Exercise', 'Wound Care', 'Monitoring & Vitals', 'Emotional Support', 'Hygiene', 'Safety', 'Therapy', 'Other'];
  const CARE_FREQUENCIES = ['Daily', 'Twice Daily', 'Three Times Daily', 'Weekly', 'Twice Weekly', 'Biweekly', 'Monthly', 'As Needed', 'Once'];
  const CARE_PRIORITIES = ['High', 'Medium', 'Low'];
  const [carePlanItems, setCarePlanItems] = useState([
    { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', notes: 'Patient requires help getting in and out of the tub. Use non-slip mat.', checked: true, createdDate: '2026-03-01' },
    { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', notes: 'Metformin 500mg, Amlodipine 5mg, Aspirin 75mg — after breakfast.', checked: true, createdDate: '2026-03-01' },
    { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', notes: 'Record BP and blood sugar morning and evening. Flag if BP > 140/90 or glucose > 10 mmol/L.', checked: false, createdDate: '2026-03-01' },
    { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', notes: 'Low-sugar, low-sodium meals. Include vegetables and lean protein. Avoid fried foods.', checked: false, createdDate: '2026-03-02' },
    { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', notes: '15–20 minutes gentle walk. Use walking frame. Stop if patient reports dizziness or pain.', checked: false, createdDate: '2026-03-02' },
    { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', notes: 'Clean with normal saline. Apply hydrocolloid dressing. Monitor for signs of infection.', checked: false, createdDate: '2026-03-05' },
    { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', notes: 'Discuss daily news, family updates. Encourage participation in light activities. Monitor mood.', checked: false, createdDate: '2026-03-01' },
    { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', notes: 'Check for loose rugs, wet floors, poor lighting. Ensure grab bars in bathroom are secure.', checked: false, createdDate: '2026-03-03' },
  ]);
  const [showCarePlanForm, setShowCarePlanForm] = useState(false);
  const [carePlanForm, setCarePlanForm] = useState({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
  const [carePlanFilter, setCarePlanFilter] = useState('All');
  const [editingCarePlan, setEditingCarePlan] = useState(null);
  const [confirmDeleteCarePlan, setConfirmDeleteCarePlan] = useState(null);

  const handleAddCarePlanItem = () => {
    if (!carePlanForm.task.trim()) return;
    if (editingCarePlan) {
      setCarePlanItems(prev => prev.map(item => item.id === editingCarePlan ? { ...item, ...carePlanForm } : item));
      setEditingCarePlan(null);
    } else {
      const newItem = { ...carePlanForm, id: Date.now(), checked: false, createdDate: new Date().toISOString().slice(0, 10) };
      setCarePlanItems(prev => [...prev, newItem]);
    }
    setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' });
    setShowCarePlanForm(false);
  };
  const handleToggleCarePlanItem = (id) => {
    setCarePlanItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };
  const handleDeleteCarePlanItem = () => {
    if (!confirmDeleteCarePlan) return;
    setCarePlanItems(prev => prev.filter(item => item.id !== confirmDeleteCarePlan.id));
    setConfirmDeleteCarePlan(null);
  };
  const handleEditCarePlanItem = (item) => {
    setCarePlanForm({ task: item.task, category: item.category, frequency: item.frequency, priority: item.priority, notes: item.notes });
    setEditingCarePlan(item.id);
    setShowCarePlanForm(true);
  };
  const filteredCarePlanItems = carePlanItems
    .filter(item => carePlanFilter === 'All' || item.category === carePlanFilter)
    .sort((a, b) => {
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });
  const carePlanProgress = carePlanItems.length > 0
    ? Math.round((carePlanItems.filter(i => i.checked).length / carePlanItems.length) * 100)
    : 0;
  const getCarePriorityStyle = (p) => {
    const styles = { High: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }, Medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' }, Low: { bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD' } };
    return styles[p] || styles.Medium;
  };
  const getCareCategoryIcon = (cat) => {
    const icons = { 'Personal Care': '🛁', 'Medication Management': '💊', 'Nutrition & Diet': '🥗', 'Mobility & Exercise': '🚶', 'Wound Care': '🩹', 'Monitoring & Vitals': '📊', 'Emotional Support': '💬', Hygiene: '🧼', Safety: '🛡️', Therapy: '🏥', Other: '📋' };
    return icons[cat] || '📋';
  };

  /* ── Care Checklist Status state ── */
  const [checklistStatusDate, setChecklistStatusDate] = useState(new Date().toISOString().slice(0, 10));
  const [checklistHistory] = useState({
    '2026-03-24': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '07:15' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:05' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:30' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Grace Osei, RN', completedAt: '10:00' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
    ],
    '2026-03-23': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '07:30' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:00' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '09:00' },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:00' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '16:00' },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '10:30' },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Grace Osei, RN', completedAt: '14:00' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '11:00' },
    ],
    '2026-03-22': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '07:45' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '08:10' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:30' },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:15' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '15:00' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: false, completedBy: null, completedAt: null },
    ],
    '2026-03-21': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '07:20' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '07:55' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '08:00' },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '11:45' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '16:30' },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '09:00' },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: true, completedBy: 'Kwame Boateng, RN', completedAt: '13:30' },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '10:00' },
    ],
    '2026-03-20': [
      { id: 1, task: 'Assist patient with morning bath and oral hygiene', category: 'Personal Care', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '07:00' },
      { id: 2, task: 'Administer morning medications as prescribed', category: 'Medication Management', frequency: 'Daily', priority: 'High', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '08:15' },
      { id: 3, task: 'Blood pressure and blood glucose monitoring', category: 'Monitoring & Vitals', frequency: 'Twice Daily', priority: 'High', completed: false, completedBy: null, completedAt: null },
      { id: 4, task: 'Prepare balanced diabetic-friendly meals', category: 'Nutrition & Diet', frequency: 'Three Times Daily', priority: 'Medium', completed: true, completedBy: 'Grace Osei, RN', completedAt: '12:00' },
      { id: 5, task: 'Assisted walking exercise around the compound', category: 'Mobility & Exercise', frequency: 'Daily', priority: 'Medium', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '15:00' },
      { id: 6, task: 'Change wound dressing on left lower leg', category: 'Wound Care', frequency: 'Twice Weekly', priority: 'High', completed: true, completedBy: 'Grace Osei, RN', completedAt: '09:30' },
      { id: 7, task: 'Engage patient in conversation and companionship', category: 'Emotional Support', frequency: 'Daily', priority: 'Low', completed: false, completedBy: null, completedAt: null },
      { id: 8, task: 'Ensure home environment is hazard-free', category: 'Safety', frequency: 'Weekly', priority: 'Medium', completed: true, completedBy: 'Amina Mensah, RN', completedAt: '11:00' },
    ],
  });

  /* Get checklist data for a specific date — use history if available, else fallback to live carePlanItems for today */
  const getChecklistForDate = (dateStr) => {
    if (checklistHistory[dateStr]) return checklistHistory[dateStr];
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr === today) {
      return carePlanItems.map(item => ({
        id: item.id, task: item.task, category: item.category, frequency: item.frequency,
        priority: item.priority, completed: item.checked, completedBy: item.checked ? 'Current Session' : null,
        completedAt: item.checked ? '—' : null,
      }));
    }
    return null;
  };
  const selectedDateChecklist = getChecklistForDate(checklistStatusDate);
  const selectedDateCompleted = selectedDateChecklist ? selectedDateChecklist.filter(i => i.completed).length : 0;
  const selectedDateTotal = selectedDateChecklist ? selectedDateChecklist.length : 0;
  const selectedDatePercent = selectedDateTotal > 0 ? Math.round((selectedDateCompleted / selectedDateTotal) * 100) : 0;
  const getCompletionLabel = (pct) => {
    if (pct === 100) return { text: 'Fully Completed', bg: '#F0F7FE', color: '#1565A0', border: '#BAE0FD', icon: '✅' };
    if (pct >= 75) return { text: 'Mostly Completed', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe', icon: '🔵' };
    if (pct >= 50) return { text: 'Partially Completed', bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: '🟡' };
    if (pct > 0) return { text: 'Minimally Completed', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', icon: '🟠' };
    return { text: 'Not Started', bg: '#fef2f2', color: '#dc2626', border: '#fecaca', icon: '🔴' };
  };
  /* Quick nav dates for the last 7 days */
  const quickDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const formatShortDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { day: days[d.getDay()], date: d.getDate(), month: months[d.getMonth()] };
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const p = patientsData.find(pt => pt.id === patientId);

  if (!p) {
    return (
      <div className="page-wrapper text-center py-5">
        <FiUser size={48} style={{ color: 'var(--kh-border)', marginBottom: 16 }} />
        <h6 style={{ color: 'var(--kh-text-muted)' }}>Patient record not found</h6>
        <button className="btn btn-kh-primary mt-3" onClick={() => navigate('/patients')}>Return to Registry</button>
      </div>
    );
  }

  /* flag calculations */
  const flags = [];
  if (p.pain.present) flags.push({ label: `Pain — ${p.pain.location}`, status: p.pain.score >= 2 ? 'alert' : 'warn', detail: `Score ${p.pain.score}/3` });
  if (p.diabetes.has) flags.push({ label: 'Diabetes', status: 'warn', detail: p.nutrition.dietType });
  if (p.skin.openWounds) flags.push({ label: 'Open Wounds', status: 'alert', detail: 'Active' });
  if (p.skin.pressureUlcer) flags.push({ label: 'Pressure Ulcer', status: 'alert', detail: 'Active' });
  if (p.psych.depression) flags.push({ label: 'Depression', status: 'warn', detail: 'Flagged' });
  if (p.psych.anxiety) flags.push({ label: 'Anxiety', status: 'warn', detail: 'Flagged' });
  if (p.communication.visual) flags.push({ label: 'Visual Impairment', status: 'warn', detail: 'Noted' });
  if (!p.mobility.independent) flags.push({ label: 'Mobility Assist Required', status: 'warn', detail: 'Not independent' });
  if (flags.length === 0) flags.push({ label: 'No active clinical flags', status: 'ok', detail: '' });

  return (
    <div className="page-wrapper" style={{ background: '#f8f9fa' }}>

      {/* ── EHR Header Bar ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: '16px 20px', marginBottom: 16 }}>
        <div className="d-flex align-items-center gap-3">
          <button onClick={() => navigate('/patients')} style={{
            background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '7px 9px',
            cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex',
          }}><FiArrowLeft size={15} /></button>

          {/* Patient photo upload */}
          <input type="file" accept="image/*" ref={fileRef} onChange={handlePhoto} style={{ display: 'none' }} />
          <div
            onClick={() => fileRef.current?.click()}
            title="Upload patient photo"
            style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
              border: '2px dashed #d1d5db', background: photo ? 'none' : '#f9fafb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#45B6FE'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}
          >
            {photo
              ? <img src={photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <FiCamera size={18} style={{ color: '#9ca3af' }} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--kh-text)' }}>{p.name}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.5px',
                background: p.status === 'active' ? '#F0F7FE' : '#fef3c7',
                color: p.status === 'active' ? '#1565A0' : '#92400e',
                border: `1px solid ${p.status === 'active' ? '#BAE0FD' : '#fde68a'}`,
              }}>{p.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 2 }}>
              <span style={{ fontWeight: 600, color: 'var(--kh-text)' }}>{p.id}</span>
              <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
              {p.gender}, {p.age} yrs
              <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
              DOB: {p.dob}
              <span style={{ margin: '0 6px', color: '#d1d5db' }}>|</span>
              <span style={{ fontWeight: 600 }}>{p.regNo}</span>
            </div>
          </div>

          {/* Quick contact */}
          <div className="d-flex gap-4" style={{ fontSize: 11.5, color: 'var(--kh-text-muted)' }}>
            <div className="text-end">
              <div style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px', marginBottom: 2 }}>Primary Nurse</div>
              <div style={{ fontWeight: 600, color: 'var(--kh-text)', fontSize: 12.5 }}>{p.nurse}</div>
              <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{p.nursePin}</div>
            </div>
            <div style={{ width: 1, background: '#e5e7eb' }} />
            <div className="text-end">
              <div style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.5px', marginBottom: 2 }}>Physician</div>
              <div style={{ fontWeight: 600, color: 'var(--kh-text)', fontSize: 12.5 }}>{p.doctor.name}</div>
              <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{p.doctor.facility}</div>
            </div>
          </div>

          <div style={{ width: 1, height: 36, background: '#e5e7eb' }} />
          <div className="d-flex gap-1">
            <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '7px 9px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiPrinter size={14} /></button>
            <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '7px 9px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiEdit2 size={14} /></button>
            <button style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '7px 9px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}><FiMoreHorizontal size={14} /></button>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', gap: 0, background: '#F0F7FE', borderRadius: '2px 2px 0 0', borderBottom: '2px solid #45B6FE', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 12.5,
            fontWeight: tab === t.key ? 700 : 500, border: 'none', cursor: 'pointer',
            background: tab === t.key ? '#45B6FE' : 'transparent',
            color: tab === t.key ? '#fff' : '#2E7DB8',
            borderBottom: tab === t.key ? '2px solid #45B6FE' : '2px solid transparent',
            marginBottom: -2, transition: 'all 0.15s',
            borderRadius: '2px 2px 0 0',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ═══ CHART SUMMARY ═══ */}
      {tab === 'chart' && (
        <div className="row g-3">
          {/* Left column */}
          <div className="col-lg-4">
            <Panel title="Demographics" icon={<FiUser size={14} />}>
              <DataRow label="Full Name">{p.name}</DataRow>
              <DataRow label="Preferred Name">{p.preferredName}</DataRow>
              <DataRow label="Date of Birth">{p.dob}</DataRow>
              <DataRow label="Sex">{p.gender}</DataRow>
              <DataRow label="Phone">{p.phone}</DataRow>
              <DataRow label="Email">{p.email}</DataRow>
              <DataRow label="Address">{p.address}</DataRow>
              <DataRow label="GPS Code">{p.gps}</DataRow>
              <DataRow label="Region">{p.region}</DataRow>
            </Panel>

            <Panel title="Emergency Contact" icon={<FiHeart size={14} />} accent="#d97706">
              <DataRow label="Name">{p.emergency.name}</DataRow>
              <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
              <DataRow label="Phone">{p.emergency.phone}</DataRow>
            </Panel>

            <Panel title="Cultural / Religious" icon={<FiShield size={14} />}>
              <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.6 }}>{p.cultural}</div>
            </Panel>
          </div>

          {/* Center column */}
          <div className="col-lg-4">
            <Panel title="Primary Diagnosis" icon={<FiAlertTriangle size={14} />} accent="#ef4444">
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 8 }}>{p.diagnosis}</div>
              <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', lineHeight: 1.6 }}>
                <span style={{ fontWeight: 600 }}>History:</span> {p.medicalHistory}
              </div>
            </Panel>

            <Panel title="Clinical Flags" icon={<FiAlertTriangle size={14} />} accent={flags[0]?.status === 'alert' ? '#ef4444' : flags[0]?.status === 'warn' ? '#d97706' : '#45B6FE'}>
              {flags.map((f, i) => <FlagItem key={i} label={f.label} status={f.status} detail={f.detail} />)}
            </Panel>

            <Panel title="Admission Record" icon={<FiCalendar size={14} />}>
              <DataRow label="Reg No.">{p.regNo}</DataRow>
              <DataRow label="Date Admitted">{p.enrolled}</DataRow>
              <DataRow label="Handbook Given"><YN val={p.handbookGiven} /></DataRow>
              <DataRow label="Primary Nurse">{p.nurse} ({p.nursePin})</DataRow>
              <DataRow label="Physician">{p.doctor.name}</DataRow>
              <DataRow label="Facility">{p.doctor.facility}</DataRow>
            </Panel>
          </div>

          {/* Right column — Quick vitals */}
          <div className="col-lg-4">
            <Panel title="Latest Vitals" icon={<FiThermometer size={14} />} accent="#3b82f6"
              action={<span style={{ fontSize: 10.5, color: 'var(--kh-text-muted)' }}><FiClock size={11} /> On admission</span>}
            >
              <div className="row g-2">
                <div className="col-6"><VitalTile label="Blood Pressure" value={p.vitals.bp} flag={parseInt(p.vitals.bp) >= 140} /></div>
                <div className="col-6"><VitalTile label="Blood Sugar" value={p.vitals.sugar} flag={parseFloat(p.vitals.sugar) > 7} /></div>
                <div className="col-6"><VitalTile label="SPO2" value={p.vitals.spo2} /></div>
                <div className="col-6"><VitalTile label="Pulse" value={p.vitals.pulse + ' bpm'} /></div>
                <div className="col-6"><VitalTile label="Temperature" value={p.vitals.temp} /></div>
                <div className="col-6"><VitalTile label="Weight" value={p.vitals.weight} /></div>
              </div>
            </Panel>

            <Panel title="Current Medications" icon={<FiFileText size={14} />} accent="#45B6FE">
              {p.medications.split(', ').map((med, i) => (
                <div key={i} className="d-flex align-items-center gap-2" style={{
                  padding: '7px 10px', borderBottom: '1px solid #f3f4f6', fontSize: 12.5,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#45B6FE', flexShrink: 0 }} />
                  <span style={{ color: 'var(--kh-text)', fontWeight: 500 }}>{med}</span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ CLINICAL ASSESSMENT ═══ */}
      {tab === 'clinical' && (
        <div className="row g-3">
          <div className="col-lg-6">
            <Panel title="Communication" icon={<FiUser size={14} />}>
              <DataRow label="Communication Needs"><YN val={p.communication.needs} /></DataRow>
              <DataRow label="Hearing Impairment"><YN val={p.communication.hearing} /></DataRow>
              <DataRow label="Speech Impairment"><YN val={p.communication.speech} /></DataRow>
              <DataRow label="Visual Impairment"><YN val={p.communication.visual} /></DataRow>
              <DataRow label="Understanding Issues"><YN val={p.communication.understanding} /></DataRow>
            </Panel>

            <Panel title="Infection Control" icon={<FiShield size={14} />}>
              <DataRow label="Risk Assessment Plan"><YN val={p.infection.riskPlan} /></DataRow>
              <DataRow label="Diarrhea on Admission"><YN val={p.infection.diarrhea} /></DataRow>
            </Panel>

            <Panel title="Diabetes Management" icon={<FiActivity size={14} />} accent={p.diabetes.has ? '#d97706' : undefined}>
              <DataRow label="Diabetes Present"><YN val={p.diabetes.has} /></DataRow>
              <DataRow label="Care Plan Active"><YN val={p.diabetes.carePlan} /></DataRow>
              <DataRow label="Anti-embolism Stockings"><YN val={p.diabetes.stockings} /></DataRow>
            </Panel>

            <Panel title="Breathing" icon={<FiActivity size={14} />}>
              <DataRow label="Breathing Difficulties"><YN val={p.breathing.difficulties} /></DataRow>
              <DataRow label="Home O₂ / CPAP"><YN val={p.breathing.oxygen} /></DataRow>
              <DataRow label="Current Smoker"><YN val={p.breathing.smoker} /></DataRow>
              <DataRow label="Smoking History"><YN val={p.breathing.everSmoked} /></DataRow>
            </Panel>
          </div>
          <div className="col-lg-6">
            <Panel title="Pain Assessment" icon={<FiAlertTriangle size={14} />} accent={p.pain.present ? painColors[p.pain.score] : undefined}>
              <DataRow label="Pain Present"><YN val={p.pain.present} /></DataRow>
              <DataRow label="Pain Score">
                <div className="d-flex align-items-center gap-2">
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0,1,2,3].map(s => (
                      <div key={s} style={{
                        width: 24, height: 8, borderRadius: 1,
                        background: s <= p.pain.score ? painColors[p.pain.score] : '#e5e7eb',
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: painColors[p.pain.score] }}>{p.pain.score}/3 {painLabels[p.pain.score]}</span>
                </div>
              </DataRow>
              <DataRow label="Location">{p.pain.location || '—'}</DataRow>
              <DataRow label="Analgesia">{p.pain.analgesia || '—'}</DataRow>
            </Panel>

            <Panel title="Psychological" icon={<FiShield size={14} />} accent={p.psych.concerns || p.psych.depression || p.psych.anxiety ? '#d97706' : undefined}>
              <DataRow label="Concerns Flagged"><YN val={p.psych.concerns} /></DataRow>
              <DataRow label="Depression"><YN val={p.psych.depression} /></DataRow>
              <DataRow label="Anxiety"><YN val={p.psych.anxiety} /></DataRow>
              <DataRow label="Dementia / Delirium"><YN val={p.psych.dementia} /></DataRow>
            </Panel>

            <Panel title="Skin Integrity" icon={<FiAlertTriangle size={14} />} accent={p.skin.openWounds || p.skin.pressureUlcer ? '#ef4444' : undefined}>
              <DataRow label="Open Wounds"><YN val={p.skin.openWounds} /></DataRow>
              <DataRow label="Pressure Ulcer"><YN val={p.skin.pressureUlcer} /></DataRow>
            </Panel>

            <Panel title="Mobility" icon={<FiUser size={14} />}>
              <DataRow label="Independently Mobile"><YN val={p.mobility.independent} /></DataRow>
              <DataRow label="Move in Bed"><YN val={p.mobility.bedMove} /></DataRow>
              <DataRow label="Bed to Chair"><YN val={p.mobility.bedToChair} /></DataRow>
              <DataRow label="Transfer to Toilet"><YN val={p.mobility.toilet} /></DataRow>
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ VITALS ═══ */}
      {tab === 'vitals' && (
        <div className="row g-3">
          {/* ── Vitals Header ── */}
          <div className="col-lg-12">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: '#45B6FE', display: 'flex' }}><FiActivity size={15} /></span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>Vitals</span>
                <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginLeft: 4 }}>
                  {vitalRecords.length > 0 ? `Last updated: ${vitalRecords[0].date} at ${vitalRecords[0].time}` : `Admission: ${p.enrolled}`}
                </span>
              </div>
              <button onClick={() => setShowVitalForm(true)} style={{
                padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                background: '#45B6FE', color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <FiPlus size={14} /> Add Vital Record
              </button>
            </div>
          </div>

          {/* ── Add New Vital Record Form ── */}
          {showVitalForm && (
            <div className="col-lg-12">
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  padding: '12px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between',
                  background: '#F0F7FE', borderLeft: '3px solid #45B6FE',
                }}>
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7DB8' }}>Record New Vitals</span>
                  </div>
                  <button onClick={() => setShowVitalForm(false)}
                    style={{ background: 'none', border: '1px solid #A8D8FC', borderRadius: 2, padding: '4px 6px', cursor: 'pointer', color: '#45B6FE', display: 'flex' }}>
                    <FiX size={14} />
                  </button>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  {/* Date/Time/Nurse row */}
                  <div className="row g-2 mb-3">
                    <div className="col-md-3">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Date *</label>
                      <input type="date" value={vitalForm.date} onChange={e => setVitalForm(f => ({ ...f, date: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                    <div className="col-md-2">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Time *</label>
                      <input type="time" value={vitalForm.time} onChange={e => setVitalForm(f => ({ ...f, time: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                    <div className="col-md-3">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Recorded By</label>
                      <input value={vitalForm.recordedBy} onChange={e => setVitalForm(f => ({ ...f, recordedBy: e.target.value }))} placeholder="Nurse name"
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                    <div className="col-md-4">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Notes</label>
                      <input value={vitalForm.notes} onChange={e => setVitalForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..."
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                  </div>

                  {/* Vital fields */}
                  <div className="row g-2 mb-3">
                    {[
                      { key: 'bp', label: 'Blood Pressure', placeholder: 'e.g. 130/85' },
                      { key: 'sugar', label: 'Blood Sugar', placeholder: 'e.g. 6.5 mmol/L' },
                      { key: 'spo2', label: 'SPO₂', placeholder: 'e.g. 97%' },
                      { key: 'pulse', label: 'Pulse', placeholder: 'e.g. 78' },
                      { key: 'temp', label: 'Temperature', placeholder: 'e.g. 36.6°C' },
                      { key: 'resp', label: 'Respiration', placeholder: 'e.g. 18' },
                      { key: 'weight', label: 'Weight', placeholder: 'e.g. 82 kg' },
                      { key: 'urinalysis', label: 'Urinalysis', placeholder: 'e.g. Normal' },
                    ].map((field, i) => (
                      <div key={i} className="col-md-3 col-sm-6">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>
                          {field.label}
                        </label>
                        <input value={vitalForm[field.key]} onChange={e => setVitalForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                      </div>
                    ))}
                  </div>

                  {/* Submit row */}
                  <div className="d-flex justify-content-end gap-2">
                    <button onClick={() => setShowVitalForm(false)} style={{
                      padding: '8px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                      background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db',
                    }}>Cancel</button>
                    <button onClick={handleAddVital} style={{
                      padding: '8px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                      background: '#45B6FE', color: '#fff', border: 'none',
                      opacity: (!vitalForm.bp && !vitalForm.sugar && !vitalForm.pulse && !vitalForm.temp && !vitalForm.spo2 && !vitalForm.resp && !vitalForm.weight) ? 0.5 : 1,
                    }}>
                      Save Vital Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Vitals History Table ── */}
          <div className="col-lg-12">
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                padding: '12px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                borderLeft: '3px solid #2E7DB8',
              }}>
                <div className="d-flex align-items-center gap-2">
                  <span style={{ color: '#2E7DB8', display: 'flex' }}><FiClock size={14} /></span>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text)' }}>Vitals History</span>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--kh-text-muted)' }}>{vitalRecords.length + 1} records</span>
              </div>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F7FE' }}>
                      {['Date & Time', 'BP', 'Sugar', 'SPO₂', 'Pulse', 'Temp', 'Resp', 'Weight', 'Recorded By', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 12px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: '#45B6FE', borderBottom: '2px solid #45B6FE',
                          textAlign: 'left', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Added vital records */}
                    {vitalRecords.map((r, idx) => (
                      <>
                        <tr key={r.id}
                          style={{ background: idx % 2 === 0 ? 'transparent' : '#fafbfc', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.15s' }}
                          onClick={() => setExpandedVital(expandedVital === r.id ? null : r.id)}
                          onMouseEnter={e => e.currentTarget.style.background = '#F0F7FE'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : '#fafbfc'}
                        >
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{r.date}</div>
                            <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{r.time}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.bp ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('bp', r.bp) ? '#ef4444' : 'var(--kh-text)' }}>{r.bp}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.sugar ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('sugar', r.sugar) ? '#d97706' : 'var(--kh-text)' }}>{r.sugar}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.spo2 ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('spo2', r.spo2) ? '#ef4444' : 'var(--kh-text)' }}>{r.spo2}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.pulse ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('pulse', r.pulse) ? '#8b5cf6' : 'var(--kh-text)' }}>{r.pulse}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.temp ? <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('temp', r.temp) ? '#ef4444' : 'var(--kh-text)' }}>{r.temp}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.resp ? <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{r.resp}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.weight ? <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{r.weight}</span> : <span style={{ color: '#d1d5db' }}>—</span>}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{r.recordedBy || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div className="d-flex align-items-center gap-1">
                              <span style={{ display: 'flex', color: '#45B6FE', cursor: 'pointer' }} title="Expand">
                                {expandedVital === r.id ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                              </span>
                              <button onClick={(e) => { e.stopPropagation(); deleteVitalRecord(r.id); }} style={{
                                background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 2,
                              }} title="Delete record"><FiX size={14} /></button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded detail row */}
                        {expandedVital === r.id && (
                          <tr key={`exp-${r.id}`}>
                            <td colSpan={10} style={{ padding: 0, background: '#f9fafb' }}>
                              <div style={{ padding: '12px 18px', borderBottom: '2px solid #e5e7eb' }}>
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                  {[
                                    r.bp && { label: 'Blood Pressure', value: r.bp, flagged: isVitalFlagged('bp', r.bp), color: '#45B6FE' },
                                    r.sugar && { label: 'Blood Sugar', value: r.sugar, flagged: isVitalFlagged('sugar', r.sugar), color: '#45B6FE' },
                                    r.spo2 && { label: 'SPO₂', value: r.spo2, flagged: isVitalFlagged('spo2', r.spo2), color: '#2E7DB8' },
                                    r.pulse && { label: 'Pulse', value: r.pulse, flagged: isVitalFlagged('pulse', r.pulse), color: '#45B6FE' },
                                    r.temp && { label: 'Temperature', value: r.temp, flagged: isVitalFlagged('temp', r.temp), color: '#2E7DB8' },
                                    r.resp && { label: 'Respiration', value: r.resp, flagged: false, color: '#45B6FE' },
                                    r.weight && { label: 'Weight', value: r.weight, flagged: false, color: '#2E7DB8' },
                                    r.urinalysis && { label: 'Urinalysis', value: r.urinalysis, flagged: isVitalFlagged('urinalysis', r.urinalysis), color: '#2E7DB8' },
                                  ].filter(Boolean).map((v, vi) => (
                                    <div key={vi} style={{
                                      padding: '8px 14px', borderRadius: 2, minWidth: 100,
                                      background: v.flagged ? '#fef2f2' : '#fff',
                                      border: `1px solid ${v.flagged ? '#fecaca' : '#e5e7eb'}`,
                                      borderLeft: `3px solid ${v.flagged ? '#ef4444' : v.color}`,
                                    }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--kh-text-muted)', marginBottom: 2 }}>{v.label}</div>
                                      <div style={{ fontSize: 15, fontWeight: 800, color: v.flagged ? '#ef4444' : 'var(--kh-text)' }}>{v.value}</div>
                                    </div>
                                  ))}
                                </div>
                                {r.notes && (
                                  <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 4 }}>
                                    <span style={{ fontWeight: 700 }}>Notes:</span> {r.notes}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}

                    {/* Admission vitals row (always last) */}
                    <tr style={{
                      background: vitalRecords.length % 2 === 0 ? 'transparent' : '#fafbfc',
                      borderBottom: '1px solid #f3f4f6',
                    }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{p.enrolled}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 2, background: '#F0F7FE', color: '#45B6FE', border: '1px solid #A8D8FC', marginTop: 2 }}>ADMISSION</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('bp', p.vitals.bp) ? '#ef4444' : 'var(--kh-text)' }}>{p.vitals.bp}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('sugar', p.vitals.sugar) ? '#d97706' : 'var(--kh-text)' }}>{p.vitals.sugar}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('spo2', p.vitals.spo2) ? '#ef4444' : 'var(--kh-text)' }}>{p.vitals.spo2}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('pulse', p.vitals.pulse) ? '#8b5cf6' : 'var(--kh-text)' }}>{p.vitals.pulse}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: isVitalFlagged('temp', p.vitals.temp) ? '#ef4444' : 'var(--kh-text)' }}>{p.vitals.temp}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{p.vitals.resp}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--kh-text)' }}>{p.vitals.weight}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--kh-text-muted)', fontWeight: 500 }}>{p.nurse}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#45B6FE' }}>Baseline</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MEDICATIONS ═══ */}
      {tab === 'medications' && (
        <div className="row g-3">
          <div className="col-lg-12">
            <Panel title="Active Medications" icon={<FiFileText size={14} />} accent="#45B6FE"
              action={
                <div className="d-flex align-items-center gap-3">
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#45B6FE' }}>{p.medications.split(', ').filter((_, i) => !deletedExistingMeds.includes(i)).length + addedMeds.length} active</span>
                  <button onClick={() => { setShowMedForm(true); setDrugSearch(''); setShowCustomDrug(false); }} style={{
                    padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: '#45B6FE', color: '#fff', border: 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <FiPlus size={13} /> Add Medication
                  </button>
                </div>
              }
            >
              {/* Add Medication Form */}
              {showMedForm && (
                <div style={{ padding: '16px', marginBottom: 16, borderRadius: 2, background: '#F0F7FE', border: '1px solid #A8D8FC' }}>
                  <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#45B6FE' }}>New Medication</span>
                    <button onClick={() => { setShowMedForm(false); setMedForm({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' }); setDrugSearch(''); setShowCustomDrug(false); }}
                      style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '4px 6px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}>
                      <FiX size={14} />
                    </button>
                  </div>

                  <div className="row g-2 mb-2">
                    {/* Searchable Drug Dropdown */}
                    <div className="col-md-4">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Drug Name *</label>
                      <div style={{ position: 'relative' }}>
                        <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 2 }} />
                        <input
                          value={drugSearch}
                          onChange={e => { setDrugSearch(e.target.value); setShowDrugDropdown(true); setMedForm(f => ({ ...f, drug: '' })); setShowCustomDrug(false); }}
                          onFocus={() => setShowDrugDropdown(true)}
                          placeholder="Search medication..."
                          style={{ width: '100%', padding: '8px 30px 8px 32px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }}
                        />
                        <FiChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />

                        {/* Dropdown list */}
                        {showDrugDropdown && drugSearch.length >= 1 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                            background: '#fff', border: '1px solid #d1d5db', borderTop: 'none', borderRadius: '0 0 2px 2px',
                            maxHeight: 220, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          }}>
                            {filteredDrugs.length > 0 ? (
                              filteredDrugs.map((d, i) => (
                                <div key={i} onClick={() => selectDrug(d)} style={{
                                  padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                                  transition: 'background 0.1s',
                                }} onMouseEnter={e => e.currentTarget.style.background = '#F0F7FE'}
                                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{d.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>{d.category} · {d.commonDose}</div>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: '12px' }}>
                                <div style={{ fontSize: 12.5, color: '#dc2626', fontWeight: 600, marginBottom: 6 }}>
                                  <FiAlertTriangle size={12} style={{ marginRight: 4 }} /> "{drugSearch}" not found in database
                                </div>
                                <button onClick={() => { setShowCustomDrug(true); setCustomDrugName(drugSearch); setShowDrugDropdown(false); }} style={{
                                  width: '100%', padding: '8px 12px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                                  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                }}>
                                  <FiPlus size={12} /> Add as Custom Medication
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected drug badge */}
                      {medForm.drug && (
                        <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #BAE0FD' }}>
                          <FiCheckCircle size={11} style={{ color: '#1565A0' }} />
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1565A0' }}>{medForm.drug}</span>
                          <button onClick={() => { setMedForm(f => ({ ...f, drug: '', dosage: '' })); setDrugSearch(''); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1565A0', display: 'flex', padding: 0, marginLeft: 2 }}>
                            <FiX size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="col-md-3">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Dosage *</label>
                      <input value={medForm.dosage} onChange={e => setMedForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg"
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                    </div>
                    <div className="col-md-2">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Frequency *</label>
                      <select value={medForm.frequency} onChange={e => setMedForm(f => ({ ...f, frequency: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer' }}>
                        <option value="">Select</option>
                        {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Route</label>
                      <select value={medForm.route} onChange={e => setMedForm(f => ({ ...f, route: e.target.value }))}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer' }}>
                        {ROUTE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Custom Drug Entry */}
                  {showCustomDrug && (
                    <div style={{ padding: '12px 14px', marginBottom: 10, borderRadius: 2, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#dc2626', marginBottom: 6 }}>
                        <FiPlus size={11} style={{ marginRight: 4 }} /> Add Custom Medication
                      </div>
                      <div className="d-flex gap-2">
                        <input value={customDrugName} onChange={e => setCustomDrugName(e.target.value)} placeholder="Enter medication name"
                          style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                        <button onClick={applyCustomDrug} disabled={!customDrugName.trim()} style={{
                          padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 2, border: 'none',
                          cursor: customDrugName.trim() ? 'pointer' : 'not-allowed',
                          background: customDrugName.trim() ? '#dc2626' : '#e5e7eb',
                          color: customDrugName.trim() ? '#fff' : '#9ca3af',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <FiCheckCircle size={12} /> Confirm
                        </button>
                        <button onClick={() => { setShowCustomDrug(false); setCustomDrugName(''); }}
                          style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, borderRadius: 2, cursor: 'pointer', background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--kh-text-muted)', marginBottom: 4 }}>Notes</label>
                    <input value={medForm.notes} onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional instructions or notes..."
                      style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #d1d5db', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                  </div>

                  <div className="d-flex gap-2 justify-content-end">
                    <button onClick={() => { setShowMedForm(false); setMedForm({ drug: '', dosage: '', frequency: '', route: 'Oral', notes: '' }); setDrugSearch(''); setShowCustomDrug(false); }}
                      style={{ padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer', background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db' }}>
                      Cancel
                    </button>
                    <button onClick={handleAddMed} disabled={!medForm.drug || !medForm.dosage || !medForm.frequency}
                      style={{
                        padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, border: 'none',
                        cursor: medForm.drug && medForm.dosage && medForm.frequency ? 'pointer' : 'not-allowed',
                        background: medForm.drug && medForm.dosage && medForm.frequency ? '#45B6FE' : '#e5e7eb',
                        color: medForm.drug && medForm.dosage && medForm.frequency ? '#fff' : '#9ca3af',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                      <FiSend size={12} /> Add & Set Reminder
                    </button>
                  </div>
                </div>
              )}

              {/* Reminder Form (appears after adding a med) */}
              {showReminderForm && (() => {
                const med = addedMeds.find(m => m.id === showReminderForm);
                if (!med) return null;
                return (
                  <div style={{ padding: '16px', marginBottom: 16, borderRadius: 2, background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 12 }}>
                      <div className="d-flex align-items-center gap-2">
                        <FiBell size={14} style={{ color: '#d97706' }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Set Reminder for {med.drug}</span>
                      </div>
                      <button onClick={() => setShowReminderForm(null)}
                        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 2, padding: '4px 6px', cursor: 'pointer', color: 'var(--kh-text-muted)', display: 'flex' }}>
                        <FiX size={14} />
                      </button>
                    </div>

                    {/* Medication summary */}
                    <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 2, background: '#fff', border: '1px solid #e5e7eb' }}>
                      <div className="d-flex align-items-center gap-3">
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>{med.drug}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2, background: '#F0F7FE', color: '#45B6FE', border: '1px solid #A8D8FC' }}>{med.dosage} · {med.frequency}</span>
                        <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>via {med.route}</span>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      {/* Reminder Type */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>Schedule</label>
                        <select value={reminderForm.reminderType} onChange={e => setReminderForm(f => ({ ...f, reminderType: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 600, border: '1px solid #fde68a', borderRadius: 2, background: '#fff', color: 'var(--kh-text)', cursor: 'pointer' }}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {/* Start Date */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>Start Date</label>
                        <input type="date" value={reminderForm.startDate} onChange={e => setReminderForm(f => ({ ...f, startDate: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #fde68a', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                      </div>

                      {/* End Date */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>End Date</label>
                        <input type="date" value={reminderForm.endDate} onChange={e => setReminderForm(f => ({ ...f, endDate: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontWeight: 500, border: '1px solid #fde68a', borderRadius: 2, background: '#fff', color: 'var(--kh-text)' }} />
                      </div>

                      {/* Notify */}
                      <div className="col-md-3">
                        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e', marginBottom: 4 }}>Notify</label>
                        <div className="d-flex flex-column gap-1">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={reminderForm.notifyNurse} onChange={e => setReminderForm(f => ({ ...f, notifyNurse: e.target.checked }))} style={{ accentColor: '#d97706' }} />
                            Nurse
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={reminderForm.notifyPatient} onChange={e => setReminderForm(f => ({ ...f, notifyPatient: e.target.checked }))} style={{ accentColor: '#d97706' }} />
                            Patient
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Reminder Times */}
                    <div style={{ marginBottom: 14 }}>
                      <div className="d-flex align-items-center justify-content-between" style={{ marginBottom: 6 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#92400e' }}>
                          <FiClock size={11} style={{ marginRight: 4 }} /> Reminder Times
                        </label>
                        <button onClick={addReminderTime} style={{
                          padding: '3px 10px', fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                          background: '#fff', color: '#d97706', border: '1px solid #fde68a',
                          display: 'flex', alignItems: 'center', gap: 3,
                        }}>
                          <FiPlus size={11} /> Add Time
                        </button>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {reminderForm.times.map((t, i) => (
                          <div key={i} className="d-flex align-items-center gap-1" style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 2, padding: '4px 8px' }}>
                            <input type="time" value={t} onChange={e => updateReminderTime(i, e.target.value)}
                              style={{ border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--kh-text)', background: 'transparent', width: 90, outline: 'none' }} />
                            {reminderForm.times.length > 1 && (
                              <button onClick={() => removeReminderTime(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 0 }}>
                                <FiX size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save / Skip */}
                    <div className="d-flex gap-2 justify-content-end">
                      <button onClick={() => setShowReminderForm(null)}
                        style={{ padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer', background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db' }}>
                        Skip Reminder
                      </button>
                      <button onClick={() => saveReminder(med.id)}
                        style={{
                          padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, border: 'none', cursor: 'pointer',
                          background: '#d97706', color: '#fff',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                        <FiBell size={12} /> Save Reminder
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F0F7FE' }}>
                      {['#', 'Drug Name', 'Dosage', 'Frequency', 'Route', 'Reminder', 'Status', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 14px', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.5px', color: '#45B6FE', borderBottom: '2px solid #45B6FE',
                          textAlign: 'left', whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.medications.split(', ').map((med, origIdx) => {
                      if (deletedExistingMeds.includes(origIdx)) return null;
                      const parts = med.split(' ');
                      const drug = parts.slice(0, -2).join(' ') || med;
                      const dose = parts.length >= 3 ? parts[parts.length - 2] : '—';
                      const freq = parts.length >= 3 ? parts[parts.length - 1] : '—';
                      const visibleIdx = p.medications.split(', ').slice(0, origIdx).filter((_, ii) => !deletedExistingMeds.includes(ii)).length;
                      return (
                        <tr key={origIdx} style={{ background: visibleIdx % 2 === 1 ? '#fafbfc' : 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)' }}>{visibleIdx + 1}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{drug}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--kh-text)' }}>{dose}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: '#F0F7FE', color: '#45B6FE', border: '1px solid #A8D8FC' }}>{freq}</span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--kh-text)' }}>Oral</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>—</span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: '#F0F7FE', color: '#1565A0', border: '1px solid #BAE0FD', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FiCheckCircle size={11} /> Active
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button onClick={() => setConfirmDelete({ type: 'existing', id: origIdx, name: drug })} style={{
                              background: 'none', border: '1px solid #fecaca', borderRadius: 2, padding: '3px 6px',
                              cursor: 'pointer', color: '#dc2626', display: 'inline-flex', alignItems: 'center',
                            }} title="Delete medication">
                              <FiX size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)}
                    {addedMeds.map((med, i) => {
                      const existingCount = p.medications.split(', ').filter((_, ii) => !deletedExistingMeds.includes(ii)).length;
                      const rowIdx = existingCount + i;
                      return (
                        <tr key={med.id} style={{ background: rowIdx % 2 === 1 ? '#fafbfc' : 'transparent', borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--kh-text-muted)' }}>{rowIdx + 1}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{med.drug}</div>
                            {med.notes && <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', marginTop: 2 }}>{med.notes}</div>}
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--kh-text)' }}>{med.dosage}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: '#F0F7FE', color: '#45B6FE', border: '1px solid #A8D8FC' }}>{med.frequency}</span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--kh-text)' }}>{med.route}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {med.reminders ? (
                              <div>
                                <div className="d-flex align-items-center gap-1" style={{ marginBottom: 2 }}>
                                  <FiBell size={11} style={{ color: '#d97706' }} />
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e' }}>{med.reminders.reminderType}</span>
                                </div>
                                <div className="d-flex flex-wrap gap-1">
                                  {med.reminders.times.map((t, ti) => (
                                    <span key={ti} style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 2, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>{t}</span>
                                  ))}
                                </div>
                                {(med.reminders.notifyNurse || med.reminders.notifyPatient) && (
                                  <div style={{ fontSize: 10, color: 'var(--kh-text-muted)', marginTop: 2 }}>
                                    → {[med.reminders.notifyNurse && 'Nurse', med.reminders.notifyPatient && 'Patient'].filter(Boolean).join(', ')}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button onClick={() => { setShowReminderForm(med.id); setReminderForm({ times: ['08:00'], startDate: new Date().toISOString().slice(0, 10), endDate: '', reminderType: 'daily', notifyNurse: true, notifyPatient: false }); }}
                                style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 2, cursor: 'pointer', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <FiBell size={11} /> Set
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 2, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FiCheckCircle size={11} /> New
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <button onClick={() => setConfirmDelete({ type: 'added', id: med.id, name: med.drug })} style={{
                              background: 'none', border: '1px solid #fecaca', borderRadius: 2, padding: '3px 6px',
                              cursor: 'pointer', color: '#dc2626', display: 'inline-flex', alignItems: 'center',
                            }} title="Remove medication">
                              <FiX size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ LIFESTYLE RECORDS ═══ */}
      {tab === 'care' && (
        <div className="row g-3">
          <div className="col-lg-4">
            <Panel title="Sleep" icon={<FiClock size={14} />}>
              <DataRow label="Gets Up at Night"><YN val={p.sleep.nightWake} /></DataRow>
              <DataRow label="Night Sedation"><YN val={p.sleep.sedation} /></DataRow>
              <DataRow label="Sleeps Well"><YN val={p.sleep.sleepsWell} /></DataRow>
              <DataRow label="Wake Time">{p.sleep.wakeTime}</DataRow>
              <DataRow label="Best Position">{p.sleep.bestPosition}</DataRow>
            </Panel>

            <Panel title="Nutrition" icon={<FiHeart size={14} />}>
              <DataRow label="Food Allergies"><YN val={p.nutrition.allergies} /></DataRow>
              <DataRow label="Special Diet"><YN val={p.nutrition.specialDiet} /></DataRow>
              <DataRow label="Diet Type"><span style={{ fontWeight: 600 }}>{p.nutrition.dietType}</span></DataRow>
              <DataRow label="Eating Assistance"><YN val={p.nutrition.helpEating} /></DataRow>
              <DataRow label="Swallowing Issues"><YN val={p.nutrition.swallowing} /></DataRow>
              <DataRow label="NG Tube"><YN val={p.nutrition.ngTube} /></DataRow>
            </Panel>
          </div>

          <div className="col-lg-4">
            <Panel title="Personal Hygiene" icon={<FiCheckCircle size={14} />}>
              <DataRow label="Independent"><YN val={p.hygiene.independent} /></DataRow>
              <DataRow label="Mouth-Care Plan"><YN val={p.hygiene.mouthCare} /></DataRow>
            </Panel>

            <Panel title="Bladder & Bowel" icon={<FiActivity size={14} />}>
              <DataRow label="Dysfunction"><YN val={p.bladder.dysfunction} /></DataRow>
              <DataRow label="Catheter"><YN val={p.bladder.catheter} /></DataRow>
              <DataRow label="Incontinent Pads"><YN val={p.bladder.pads} /></DataRow>
            </Panel>

            <Panel title="Physician Contact" icon={<FiPhone size={14} />}>
              <DataRow label="Doctor">{p.doctor.name}</DataRow>
              <DataRow label="Facility">{p.doctor.facility}</DataRow>
              <DataRow label="Phone">{p.doctor.phone}</DataRow>
            </Panel>
          </div>

          <div className="col-lg-4">
            <Panel title="Active Care Protocols" icon={<FiClipboard size={14} />} accent="#45B6FE">
              {[
                { label: 'Infection Control Plan', active: p.infection.riskPlan },
                { label: 'Diabetes Care Plan', active: p.diabetes.carePlan },
                { label: 'Mouth-Care Plan', active: p.hygiene.mouthCare },
                { label: 'Pain Management', active: p.pain.present },
                { label: 'Wound Management', active: p.skin.openWounds },
                { label: 'Mobility Support', active: !p.mobility.independent },
              ].filter(c => c.active).map((c, i) => (
                <div key={i} className="d-flex align-items-center gap-2" style={{ padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <FiCheckCircle size={13} style={{ color: '#45B6FE', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--kh-text)' }}>{c.label}</span>
                </div>
              ))}
              {[
                { label: 'Infection Control Plan', active: p.infection.riskPlan },
                { label: 'Diabetes Care Plan', active: p.diabetes.carePlan },
                { label: 'Mouth-Care Plan', active: p.hygiene.mouthCare },
                { label: 'Pain Management', active: p.pain.present },
                { label: 'Wound Management', active: p.skin.openWounds },
                { label: 'Mobility Support', active: !p.mobility.independent },
              ].filter(c => c.active).length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--kh-text-muted)', padding: '8px 0' }}>No active care protocols</div>
              )}
            </Panel>

            <Panel title="Emergency Contact" icon={<FiAlertTriangle size={14} />} accent="#d97706">
              <DataRow label="Name">{p.emergency.name}</DataRow>
              <DataRow label="Relationship">{p.emergency.relationship}</DataRow>
              <DataRow label="Phone">{p.emergency.phone}</DataRow>
            </Panel>
          </div>
        </div>
      )}

      {/* ═══ NURSE NOTES ═══ */}
      {tab === 'notes' && (
        <div>
          {/* Header with Add Note button */}
          <div style={{
            background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
            marginBottom: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderLeft: '3px solid #45B6FE',
            }}>
              <div className="d-flex align-items-center gap-2">
                <FiEdit2 size={15} style={{ color: '#45B6FE' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)' }}>Nurse Notes</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: '#45B6FE', color: '#fff',
                  padding: '2px 8px', borderRadius: 10, marginLeft: 4,
                }}>{nurseNotes.length}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {/* Category filter */}
                <select
                  value={noteFilter}
                  onChange={e => setNoteFilter(e.target.value)}
                  style={{
                    fontSize: 12, padding: '6px 10px', borderRadius: 2,
                    border: '1px solid #d1d5db', color: 'var(--kh-text)', cursor: 'pointer',
                    background: '#fff',
                  }}
                >
                  <option value="All">All Categories</option>
                  {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: showNoteForm ? '#fff' : '#45B6FE',
                    color: showNoteForm ? '#45B6FE' : '#fff',
                    border: showNoteForm ? '1px solid #45B6FE' : 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {showNoteForm ? <><FiX size={13} /> Cancel</> : <><FiPlus size={13} /> Add Note</>}
                </button>
              </div>
            </div>

            {/* Add Note Form */}
            {showNoteForm && (
              <div style={{ padding: '18px', background: '#F0F7FE', borderBottom: '1px solid #e5e7eb' }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCalendar size={11} /> Date
                    </label>
                    <input type="date" value={noteForm.date} onChange={e => setNoteForm({ ...noteForm, date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock size={11} /> Time
                    </label>
                    <input type="time" value={noteForm.time} onChange={e => setNoteForm({ ...noteForm, time: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiUser size={11} /> Nurse
                    </label>
                    <input type="text" placeholder="Nurse name" value={noteForm.nurse} onChange={e => setNoteForm({ ...noteForm, nurse: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4 }}>Category</label>
                    <select value={noteForm.category} onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      {NOTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4 }}>Priority</label>
                    <select value={noteForm.priority} onChange={e => setNoteForm({ ...noteForm, priority: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#2E7DB8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiEdit2 size={11} /> Note Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter detailed nurse note..."
                    value={noteForm.content}
                    onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3,
                      border: '1px solid #d1d5db', background: '#fff', resize: 'vertical',
                      lineHeight: 1.6,
                    }}
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button onClick={handleAddNote} disabled={!noteForm.content.trim()} style={{
                    padding: '9px 24px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: noteForm.content.trim() ? '#45B6FE' : '#d1d5db',
                    color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FiSend size={13} /> Save Note
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes Timeline */}
          {filteredNotes.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
              padding: '40px 20px', textAlign: 'center',
            }}>
              <FiEdit2 size={32} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                {noteFilter !== 'All' ? `No notes found in "${noteFilter}" category` : 'No nurse notes yet'}
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                Click "Add Note" to create the first nurse note for this patient
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredNotes.map((note, idx) => (
                <div key={note.id} style={{
                  background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
                  overflow: 'hidden', transition: 'box-shadow 0.15s',
                  borderLeft: `3px solid ${getCategoryColor(note.category)}`,
                }}>
                  {/* Note header */}
                  <div style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid #f3f4f6',
                  }}>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                        background: getCategoryColor(note.category) + '18',
                        color: getCategoryColor(note.category),
                      }}>{note.category}</span>
                      {note.priority === 'High' && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#d97706' }}>
                          High Priority
                        </span>
                      )}
                      {note.priority === 'Urgent' && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#fee2e2', color: '#dc2626' }}>
                          Urgent
                        </span>
                      )}
                      {note.pinned && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#e0f2fe', color: '#0284c7' }}>
                          Pinned
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>•</span>
                      <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiCalendar size={11} /> {note.date}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiClock size={11} /> {note.time}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button onClick={() => handlePinNote(note.id)} title={note.pinned ? 'Unpin' : 'Pin'} style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 2,
                        color: note.pinned ? '#0284c7' : '#9ca3af', fontSize: 12,
                      }}>
                        <FiAlertCircle size={14} />
                      </button>
                      <button onClick={() => handleDeleteNote(note.id)} title="Delete note" style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 2,
                        color: '#9ca3af', fontSize: 12,
                      }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Note body */}
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', background: '#2E7DB8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <FiUser size={11} style={{ color: '#fff' }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: '#2E7DB8' }}>{note.nurse || 'Unknown Nurse'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ INCIDENT REPORTS ═══ */}
      {tab === 'incidents' && (
        <div>
          {/* Header */}
          <div style={{
            background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
            marginBottom: 16, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderLeft: '3px solid #dc2626',
            }}>
              <div className="d-flex align-items-center gap-2">
                <FiAlertTriangle size={15} style={{ color: '#dc2626' }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)' }}>Incident Reports</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, background: '#dc2626', color: '#fff',
                  padding: '2px 8px', borderRadius: 10, marginLeft: 4,
                }}>{incidents.length}</span>
                {incidents.filter(i => i.status === 'open').length > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, background: '#fef2f2', color: '#dc2626',
                    padding: '2px 8px', borderRadius: 10, border: '1px solid #fecaca',
                  }}>{incidents.filter(i => i.status === 'open').length} Open</span>
                )}
              </div>
              <div className="d-flex align-items-center gap-2">
                <select
                  value={incidentFilter}
                  onChange={e => setIncidentFilter(e.target.value)}
                  style={{
                    fontSize: 12, padding: '6px 10px', borderRadius: 2,
                    border: '1px solid #d1d5db', color: 'var(--kh-text)', cursor: 'pointer',
                    background: '#fff',
                  }}
                >
                  <option value="All">All Types</option>
                  {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={() => setShowIncidentForm(!showIncidentForm)}
                  style={{
                    padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: showIncidentForm ? '#fff' : '#dc2626',
                    color: showIncidentForm ? '#dc2626' : '#fff',
                    border: showIncidentForm ? '1px solid #dc2626' : 'none',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  {showIncidentForm ? <><FiX size={13} /> Cancel</> : <><FiPlus size={13} /> Report Incident</>}
                </button>
              </div>
            </div>

            {/* Add Incident Form */}
            {showIncidentForm && (
              <div style={{ padding: '18px', background: '#fef8f8', borderBottom: '1px solid #e5e7eb' }}>
                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiCalendar size={11} /> Date
                    </label>
                    <input type="date" value={incidentForm.date} onChange={e => setIncidentForm({ ...incidentForm, date: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock size={11} /> Time
                    </label>
                    <input type="time" value={incidentForm.time} onChange={e => setIncidentForm({ ...incidentForm, time: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-3">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiUser size={11} /> Reported By
                    </label>
                    <input type="text" placeholder="Nurse name" value={incidentForm.reportedBy} onChange={e => setIncidentForm({ ...incidentForm, reportedBy: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Incident Type</label>
                    <select value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Severity</label>
                    <select value={incidentForm.severity} onChange={e => setIncidentForm({ ...incidentForm, severity: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                      {INCIDENT_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-12">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiMapPin size={11} /> Location of Incident
                    </label>
                    <input type="text" placeholder="e.g. Bedroom — bedside, Bathroom, Kitchen..." value={incidentForm.location} onChange={e => setIncidentForm({ ...incidentForm, location: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiAlertTriangle size={11} /> Incident Description *
                  </label>
                  <textarea rows={3} placeholder="Describe what happened in detail..." value={incidentForm.description}
                    onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiShield size={11} /> Immediate Action Taken
                  </label>
                  <textarea rows={2} placeholder="Describe immediate actions taken..." value={incidentForm.immediateAction}
                    onChange={e => setIncidentForm({ ...incidentForm, immediateAction: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Witnesses</label>
                    <input type="text" placeholder="Names of any witnesses" value={incidentForm.witnesses}
                      onChange={e => setIncidentForm({ ...incidentForm, witnesses: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                  <div className="col-md-6">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Injury Details</label>
                    <input type="text" placeholder="Describe any injuries (if applicable)" value={incidentForm.injuryDetails}
                      onChange={e => setIncidentForm({ ...incidentForm, injuryDetails: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff' }} />
                  </div>
                </div>

                <div className="mb-3">
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Follow-Up Plan</label>
                  <textarea rows={2} placeholder="Describe follow-up actions planned..." value={incidentForm.followUp}
                    onChange={e => setIncidentForm({ ...incidentForm, followUp: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 12.5, borderRadius: 3, border: '1px solid #d1d5db', background: '#fff', resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                {/* Notification checkboxes */}
                <div className="d-flex gap-4 mb-3">
                  <label style={{ fontSize: 12, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={incidentForm.physicianNotified} onChange={e => setIncidentForm({ ...incidentForm, physicianNotified: e.target.checked })} />
                    <span style={{ fontWeight: 600 }}>Physician Notified</span>
                  </label>
                  <label style={{ fontSize: 12, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={incidentForm.familyNotified} onChange={e => setIncidentForm({ ...incidentForm, familyNotified: e.target.checked })} />
                    <span style={{ fontWeight: 600 }}>Family/Next of Kin Notified</span>
                  </label>
                </div>

                <div className="d-flex justify-content-end">
                  <button onClick={handleAddIncident} disabled={!incidentForm.description.trim()} style={{
                    padding: '9px 24px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                    background: incidentForm.description.trim() ? '#dc2626' : '#d1d5db',
                    color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FiSend size={13} /> Submit Incident Report
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Incident List */}
          {filteredIncidents.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
              padding: '40px 20px', textAlign: 'center',
            }}>
              <FiAlertTriangle size={32} style={{ color: '#d1d5db', marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: 'var(--kh-text-muted)', fontWeight: 500 }}>
                {incidentFilter !== 'All' ? `No incidents found for "${incidentFilter}" type` : 'No incident reports filed'}
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
                Click "Report Incident" to file a new incident report for this patient
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredIncidents.map((inc) => {
                const sevStyle = getIncidentSeverityStyle(inc.severity);
                const statStyle = getIncidentStatusStyle(inc.status);
                const isExpanded = expandedIncident === inc.id;
                return (
                  <div key={inc.id} style={{
                    background: '#fff', borderRadius: 2, border: '1px solid #e5e7eb',
                    overflow: 'hidden', borderLeft: `3px solid ${sevStyle.color}`,
                  }}>
                    {/* Incident header — clickable */}
                    <div
                      onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                      style={{
                        padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', borderBottom: isExpanded ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <FiChevronRight size={14} style={{ color: 'var(--kh-text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: sevStyle.bg, color: sevStyle.color, border: `1px solid ${sevStyle.border}`,
                          textTransform: 'uppercase', letterSpacing: '0.3px',
                        }}>{inc.severity}</span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        }}>{inc.type}</span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          background: statStyle.bg, color: statStyle.color, border: `1px solid ${statStyle.border}`,
                          textTransform: 'capitalize',
                        }}>{statStyle.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>•</span>
                        <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiCalendar size={11} /> {inc.date}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FiClock size={11} /> {inc.time}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: 11.5, color: '#2E7DB8', fontWeight: 600 }}>{inc.reportedBy || 'Unknown'}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteIncident(inc.id); }} title="Delete incident" style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 2,
                          color: '#9ca3af', fontSize: 12,
                        }}>
                          <FiX size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ padding: '16px 18px' }}>
                        {/* Description */}
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#dc2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FiAlertTriangle size={11} /> Incident Description
                          </div>
                          <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{inc.description}</div>
                        </div>

                        {/* Location & Witnesses */}
                        <div className="row g-2 mb-3">
                          {inc.location && (
                            <div className="col-md-6">
                              <div style={{ padding: '10px 14px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--kh-text-muted)', marginBottom: 3 }}>Location</div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 5 }}><FiMapPin size={12} style={{ color: '#2E7DB8' }} /> {inc.location}</div>
                              </div>
                            </div>
                          )}
                          {inc.witnesses && (
                            <div className="col-md-6">
                              <div style={{ padding: '10px 14px', borderRadius: 2, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--kh-text-muted)', marginBottom: 3 }}>Witnesses</div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--kh-text)', display: 'flex', alignItems: 'center', gap: 5 }}><FiUser size={12} style={{ color: '#2E7DB8' }} /> {inc.witnesses}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Injury Details */}
                        {inc.injuryDetails && (
                          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 2, background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#dc2626', marginBottom: 3 }}>Injury Details</div>
                            <div style={{ fontSize: 12.5, color: '#991b1b', lineHeight: 1.5 }}>{inc.injuryDetails}</div>
                          </div>
                        )}

                        {/* Immediate Action */}
                        {inc.immediateAction && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2E7DB8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiShield size={11} /> Immediate Action Taken
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, padding: '10px 14px', borderRadius: 2, background: '#F0F7FE', border: '1px solid #d1fae5' }}>{inc.immediateAction}</div>
                          </div>
                        )}

                        {/* Follow-Up Plan */}
                        {inc.followUp && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563eb', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiClipboard size={11} /> Follow-Up Plan
                            </div>
                            <div style={{ fontSize: 12.5, color: 'var(--kh-text)', lineHeight: 1.7, padding: '10px 14px', borderRadius: 2, background: '#eff6ff', border: '1px solid #bfdbfe' }}>{inc.followUp}</div>
                          </div>
                        )}

                        {/* Notification flags & status controls */}
                        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                          <div className="d-flex gap-2">
                            {inc.physicianNotified && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: '#F0F7FE', color: '#1565A0', border: '1px solid #BAE0FD', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiCheckCircle size={11} /> Physician Notified
                              </span>
                            )}
                            {inc.familyNotified && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: '#F0F7FE', color: '#1565A0', border: '1px solid #BAE0FD', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiCheckCircle size={11} /> Family Notified
                              </span>
                            )}
                            {!inc.physicianNotified && (
                              <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiAlertCircle size={11} /> Physician Not Notified
                              </span>
                            )}
                          </div>
                          {inc.status !== 'resolved' && (
                            <div className="d-flex gap-2">
                              {inc.status === 'open' && (
                                <button onClick={() => handleUpdateIncidentStatus(inc.id, 'in-progress')} style={{
                                  padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                                  background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                  <FiClock size={12} /> Mark In Progress
                                </button>
                              )}
                              <button onClick={() => handleUpdateIncidentStatus(inc.id, 'resolved')} style={{
                                padding: '6px 14px', fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                                background: '#45B6FE', color: '#fff', border: 'none',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <FiCheckCircle size={12} /> Resolve
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reported by footer */}
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', background: '#991b1b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <FiUser size={11} style={{ color: '#fff' }} />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#991b1b' }}>Reported by {inc.reportedBy || 'Unknown'}</span>
                          <span style={{ fontSize: 11, color: 'var(--kh-text-muted)' }}>on {inc.date} at {inc.time}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Care Plan Tab ── */}
      {tab === 'careplan' && (
        <div style={{ padding: '0 2px' }}>

          {/* Header & Progress */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>
                <FiCheckCircle size={15} style={{ color: '#45B6FE', marginRight: 6, verticalAlign: -2 }} />
                Care Plan
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginTop: 2 }}>Custom care checklist for this patient — {carePlanItems.filter(i => i.checked).length} of {carePlanItems.length} completed</div>
            </div>
            <button onClick={() => { setShowCarePlanForm(true); setEditingCarePlan(null); setCarePlanForm({ task: '', category: 'Personal Care', frequency: 'Daily', priority: 'Medium', notes: '' }); }} style={{
              padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
              background: '#45B6FE', color: '#fff', border: 'none',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <FiPlus size={14} /> Add Care Item
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ background: '#f3f4f6', borderRadius: 2, height: 8, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{
              width: `${carePlanProgress}%`, height: '100%', borderRadius: 2,
              background: carePlanProgress === 100 ? '#45B6FE' : 'linear-gradient(90deg, #45B6FE, #2E7DB8)',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Category Filter */}
          <div className="d-flex align-items-center gap-2 mb-3" style={{ overflowX: 'auto', paddingBottom: 4 }}>
            {['All', ...CARE_CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setCarePlanFilter(cat)} style={{
                padding: '5px 14px', fontSize: 11.5, fontWeight: 600, borderRadius: 2, cursor: 'pointer', whiteSpace: 'nowrap',
                background: carePlanFilter === cat ? '#45B6FE' : '#fff',
                color: carePlanFilter === cat ? '#fff' : 'var(--kh-text-muted)',
                border: `1px solid ${carePlanFilter === cat ? '#45B6FE' : '#e5e7eb'}`,
              }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Add / Edit Care Item Form */}
          {showCarePlanForm && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: 20, marginBottom: 16 }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--kh-text)' }}>
                  {editingCarePlan ? 'Edit Care Item' : 'Add New Care Item'}
                </div>
                <button onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <FiX size={16} style={{ color: 'var(--kh-text-muted)' }} />
                </button>
              </div>

              {/* Task description */}
              <div className="mb-3">
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Care Task *</label>
                <input
                  type="text" placeholder="Describe the care task to be administered..."
                  value={carePlanForm.task} onChange={e => setCarePlanForm(f => ({ ...f, task: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none' }}
                />
              </div>

              <div className="row g-2 mb-3">
                {/* Category */}
                <div className="col-md-4">
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    value={carePlanForm.category} onChange={e => setCarePlanForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', background: '#fff' }}
                  >
                    {CARE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Frequency */}
                <div className="col-md-4">
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Frequency</label>
                  <select
                    value={carePlanForm.frequency} onChange={e => setCarePlanForm(f => ({ ...f, frequency: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', background: '#fff' }}
                  >
                    {CARE_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Priority */}
                <div className="col-md-4">
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Priority</label>
                  <select
                    value={carePlanForm.priority} onChange={e => setCarePlanForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', background: '#fff' }}
                  >
                    {CARE_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-3">
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Additional Notes</label>
                <textarea
                  rows={2} placeholder="Any additional instructions or details..."
                  value={carePlanForm.notes} onChange={e => setCarePlanForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none', resize: 'vertical' }}
                />
              </div>

              {/* Form actions */}
              <div className="d-flex gap-2 justify-content-end">
                <button onClick={() => { setShowCarePlanForm(false); setEditingCarePlan(null); }} style={{
                  padding: '8px 18px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db',
                }}>Cancel</button>
                <button onClick={handleAddCarePlanItem} style={{
                  padding: '8px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#45B6FE', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                  opacity: !carePlanForm.task.trim() ? 0.5 : 1,
                }}>
                  <FiCheckCircle size={13} /> {editingCarePlan ? 'Save Changes' : 'Add to Plan'}
                </button>
              </div>
            </div>
          )}

          {/* Care Plan Checklist */}
          {filteredCarePlanItems.length === 0 ? (
            <div className="text-center py-5">
              <FiCheckCircle size={36} style={{ color: '#e5e7eb', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text-muted)' }}>No care items {carePlanFilter !== 'All' ? 'in this category' : 'yet'}</div>
              <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 4 }}>Click "Add Care Item" to build this patient's care plan</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {filteredCarePlanItems.map(item => {
                const prStyle = getCarePriorityStyle(item.priority);
                return (
                  <div key={item.id} style={{
                    background: item.checked ? '#fafafa' : '#fff',
                    border: `1px solid ${item.checked ? '#e5e7eb' : '#e5e7eb'}`,
                    borderRadius: 2, padding: '14px 16px',
                    borderLeft: `3px solid ${item.checked ? '#d1d5db' : prStyle.color}`,
                    transition: 'all 0.2s ease',
                    opacity: item.checked ? 0.7 : 1,
                  }}>
                    <div className="d-flex align-items-start gap-3">
                      {/* Checkbox */}
                      <div
                        onClick={() => handleToggleCarePlanItem(item.id)}
                        style={{
                          width: 22, height: 22, borderRadius: 2, flexShrink: 0, cursor: 'pointer', marginTop: 1,
                          border: item.checked ? 'none' : '2px solid #d1d5db',
                          background: item.checked ? '#45B6FE' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {item.checked && <FiCheckCircle size={14} style={{ color: '#fff' }} />}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span style={{
                            fontSize: 13.5, fontWeight: 600, color: item.checked ? 'var(--kh-text-muted)' : 'var(--kh-text)',
                            textDecoration: item.checked ? 'line-through' : 'none',
                          }}>
                            {item.task}
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap" style={{ marginTop: 6 }}>
                          {/* Category badge */}
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
                            background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #dcfce7',
                          }}>
                            {getCareCategoryIcon(item.category)} {item.category}
                          </span>

                          {/* Frequency badge */}
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
                            background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
                          }}>
                            <FiClock size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{item.frequency}
                          </span>

                          {/* Priority badge */}
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 2,
                            background: prStyle.bg, color: prStyle.color, border: `1px solid ${prStyle.border}`,
                          }}>
                            {item.priority}
                          </span>

                          {/* Created date */}
                          <span style={{ fontSize: 10.5, color: 'var(--kh-text-muted)' }}>
                            Added {item.createdDate}
                          </span>
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <div style={{
                            fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 8,
                            padding: '8px 12px', background: '#f9fafb', borderRadius: 2,
                            borderLeft: '2px solid #e5e7eb', lineHeight: 1.5,
                          }}>
                            {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="d-flex align-items-center gap-1" style={{ flexShrink: 0 }}>
                        <button onClick={() => handleEditCarePlanItem(item)} title="Edit" style={{
                          width: 30, height: 30, borderRadius: 2, border: 'none', cursor: 'pointer',
                          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FiEdit2 size={13} style={{ color: 'var(--kh-text-muted)' }} />
                        </button>
                        <button onClick={() => setConfirmDeleteCarePlan(item)} title="Delete" style={{
                          width: 30, height: 30, borderRadius: 2, border: 'none', cursor: 'pointer',
                          background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <FiX size={14} style={{ color: '#dc2626' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary footer */}
          {carePlanItems.length > 0 && (
            <div className="d-flex align-items-center justify-content-between mt-3 px-1" style={{ paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
              <div className="d-flex align-items-center gap-3">
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>
                  <strong style={{ color: '#45B6FE' }}>{carePlanItems.filter(i => i.checked).length}</strong> completed
                </span>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>
                  <strong style={{ color: '#d97706' }}>{carePlanItems.filter(i => !i.checked).length}</strong> remaining
                </span>
                <span style={{ fontSize: 12, color: 'var(--kh-text-muted)' }}>
                  <strong>{carePlanItems.filter(i => i.priority === 'High' && !i.checked).length}</strong> high priority
                </span>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: carePlanProgress === 100 ? '#45B6FE' : '#2E7DB8',
              }}>
                {carePlanProgress}% Complete
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Care Checklist Status Tab ── */}
      {tab === 'checkliststatus' && (
        <div style={{ padding: '0 2px' }}>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--kh-text)' }}>
                <FiBarChart2 size={15} style={{ color: '#45B6FE', marginRight: 6, verticalAlign: -2 }} />
                Care Checklist Status
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', marginTop: 2 }}>Track daily care checklist completion — select a date to review</div>
            </div>
          </div>

          {/* Date Picker & Quick Nav */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: 16, marginBottom: 16 }}>
            <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Select Date</label>
                <input
                  type="date" value={checklistStatusDate}
                  onChange={e => setChecklistStatusDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  style={{ padding: '8px 12px', fontSize: 13, borderRadius: 3, border: '1px solid #d1d5db', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--kh-text)', display: 'block', marginBottom: 4 }}>Quick Select — Last 7 Days</label>
                <div className="d-flex gap-1 flex-wrap">
                  {quickDates.map(qd => {
                    const fd = formatShortDate(qd);
                    const isActive = checklistStatusDate === qd;
                    const hasData = !!checklistHistory[qd] || qd === new Date().toISOString().slice(0, 10);
                    const qdChecklist = getChecklistForDate(qd);
                    const qdPct = qdChecklist ? Math.round((qdChecklist.filter(i => i.completed).length / qdChecklist.length) * 100) : -1;
                    return (
                      <button key={qd} onClick={() => setChecklistStatusDate(qd)} style={{
                        padding: '6px 10px', borderRadius: 2, cursor: 'pointer', textAlign: 'center', minWidth: 52,
                        background: isActive ? '#45B6FE' : '#fff',
                        color: isActive ? '#fff' : hasData ? 'var(--kh-text)' : 'var(--kh-text-muted)',
                        border: `1px solid ${isActive ? '#45B6FE' : '#e5e7eb'}`,
                        opacity: hasData ? 1 : 0.5,
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{fd.day}</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{fd.date}</div>
                        <div style={{ fontSize: 9.5, fontWeight: 500 }}>{fd.month}</div>
                        {hasData && qdPct >= 0 && (
                          <div style={{
                            fontSize: 9, fontWeight: 700, marginTop: 2,
                            color: isActive ? 'rgba(255,255,255,0.85)' : qdPct === 100 ? '#1565A0' : qdPct >= 50 ? '#d97706' : '#dc2626',
                          }}>{qdPct}%</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary Card */}
          {selectedDateChecklist ? (
            <>
              <div style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: 20, marginBottom: 16,
              }}>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-3">
                    {/* Circular progress */}
                    <div style={{ position: 'relative', width: 64, height: 64 }}>
                      <svg width="64" height="64" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                        <circle cx="32" cy="32" r="28" fill="none"
                          stroke={selectedDatePercent === 100 ? '#45B6FE' : selectedDatePercent >= 50 ? '#d97706' : '#dc2626'}
                          strokeWidth="5" strokeLinecap="round"
                          strokeDasharray={`${(selectedDatePercent / 100) * 175.9} 175.9`}
                          transform="rotate(-90 32 32)" style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      </svg>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 800,
                        color: selectedDatePercent === 100 ? '#45B6FE' : selectedDatePercent >= 50 ? '#d97706' : '#dc2626',
                      }}>{selectedDatePercent}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--kh-text)' }}>
                        {checklistStatusDate === new Date().toISOString().slice(0, 10) ? 'Today' : checklistStatusDate}
                      </div>
                      <div style={{
                        display: 'inline-block', fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 2, marginTop: 4,
                        background: getCompletionLabel(selectedDatePercent).bg,
                        color: getCompletionLabel(selectedDatePercent).color,
                        border: `1px solid ${getCompletionLabel(selectedDatePercent).border}`,
                      }}>
                        {getCompletionLabel(selectedDatePercent).icon} {getCompletionLabel(selectedDatePercent).text}
                      </div>
                    </div>
                  </div>
                  <div className="d-flex gap-4">
                    <div className="text-center">
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#45B6FE' }}>{selectedDateCompleted}</div>
                      <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Completed</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{selectedDateTotal - selectedDateCompleted}</div>
                      <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Missed</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--kh-text)' }}>{selectedDateTotal}</div>
                      <div style={{ fontSize: 11, color: 'var(--kh-text-muted)', fontWeight: 600 }}>Total</div>
                    </div>
                  </div>
                </div>

                {/* Full-width progress bar */}
                <div style={{ background: '#f3f4f6', borderRadius: 2, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${selectedDatePercent}%`, height: '100%', borderRadius: 2,
                    background: selectedDatePercent === 100 ? '#45B6FE' : selectedDatePercent >= 50 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #dc2626, #ef4444)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Checklist Items for Selected Date */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)' }}>Checklist Items</span>
                    <span style={{ fontSize: 11.5, color: 'var(--kh-text-muted)', fontWeight: 600 }}>{selectedDateCompleted}/{selectedDateTotal} completed</span>
                  </div>
                </div>

                {selectedDateChecklist.map((item, idx) => {
                  const prStyle = getCarePriorityStyle(item.priority);
                  return (
                    <div key={item.id} style={{
                      padding: '14px 16px', borderBottom: idx < selectedDateChecklist.length - 1 ? '1px solid #f3f4f6' : 'none',
                      background: item.completed ? '#fafffe' : '#fff',
                    }}>
                      <div className="d-flex align-items-start gap-3">
                        {/* Status icon */}
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                          background: item.completed ? '#45B6FE' : '#fef2f2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {item.completed
                            ? <FiCheckCircle size={13} style={{ color: '#fff' }} />
                            : <FiX size={12} style={{ color: '#dc2626' }} />
                          }
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text)' }}>{item.task}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap" style={{ marginTop: 5 }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 2,
                              background: '#F0F7FE', color: '#2E7DB8', border: '1px solid #dcfce7',
                            }}>
                              {getCareCategoryIcon(item.category)} {item.category}
                            </span>
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 2,
                              background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
                            }}>
                              <FiClock size={9} style={{ marginRight: 2, verticalAlign: -1 }} />{item.frequency}
                            </span>
                            <span style={{
                              fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 2,
                              background: prStyle.bg, color: prStyle.color, border: `1px solid ${prStyle.border}`,
                            }}>
                              {item.priority}
                            </span>
                          </div>
                        </div>

                        {/* Completion detail */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {item.completed ? (
                            <>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#45B6FE' }}>Completed</div>
                              <div style={{ fontSize: 10.5, color: 'var(--kh-text-muted)', marginTop: 2 }}>
                                <FiClock size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{item.completedAt}
                              </div>
                              <div style={{ fontSize: 10.5, color: 'var(--kh-text-muted)', marginTop: 1 }}>
                                <FiUser size={10} style={{ marginRight: 3, verticalAlign: -1 }} />{item.completedBy}
                              </div>
                            </>
                          ) : (
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#dc2626' }}>Missed</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 7-Day Trend */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, padding: 16, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--kh-text)', marginBottom: 12 }}>7-Day Completion Trend</div>
                <div className="d-flex align-items-end gap-2" style={{ height: 80 }}>
                  {[...quickDates].reverse().map(qd => {
                    const qdData = getChecklistForDate(qd);
                    const qdPct = qdData ? Math.round((qdData.filter(i => i.completed).length / qdData.length) * 100) : 0;
                    const fd = formatShortDate(qd);
                    const isSelected = checklistStatusDate === qd;
                    return (
                      <div key={qd} className="d-flex flex-column align-items-center" style={{ flex: 1, cursor: 'pointer' }} onClick={() => setChecklistStatusDate(qd)}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: qdPct === 100 ? '#45B6FE' : qdPct >= 50 ? '#d97706' : qdPct > 0 ? '#dc2626' : '#d1d5db', marginBottom: 4 }}>
                          {qdData ? `${qdPct}%` : '—'}
                        </div>
                        <div style={{
                          width: '100%', borderRadius: '2px 2px 0 0', minHeight: 4,
                          height: `${Math.max(qdPct * 0.6, 4)}px`,
                          background: isSelected
                            ? '#45B6FE'
                            : qdPct === 100 ? '#BAE0FD' : qdPct >= 50 ? '#fde68a' : qdPct > 0 ? '#fecaca' : '#f3f4f6',
                          border: isSelected ? '2px solid #45B6FE' : 'none',
                          transition: 'all 0.3s ease',
                        }} />
                        <div style={{
                          fontSize: 10, fontWeight: isSelected ? 700 : 500, marginTop: 4,
                          color: isSelected ? '#45B6FE' : 'var(--kh-text-muted)',
                        }}>{fd.day} {fd.date}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-5" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
              <FiCalendar size={36} style={{ color: '#e5e7eb', marginBottom: 12 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--kh-text-muted)' }}>No checklist data for this date</div>
              <div style={{ fontSize: 12, color: 'var(--kh-text-muted)', marginTop: 4 }}>Select a date with recorded care activity to view completion status</div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete Care Plan Item Modal ── */}
      {confirmDeleteCarePlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setConfirmDeleteCarePlan(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 2, width: 400, maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                <FiAlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Remove Care Item</div>
                <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 1 }}>This action cannot be undone</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, color: 'var(--kh-text)', lineHeight: 1.6, marginBottom: 16 }}>
                Are you sure you want to remove <strong style={{ color: '#dc2626' }}>{confirmDeleteCarePlan.task}</strong> from the care plan?
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button onClick={() => setConfirmDeleteCarePlan(null)} style={{
                  padding: '9px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db',
                }}>Cancel</button>
                <button onClick={handleDeleteCarePlanItem} style={{
                  padding: '9px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#dc2626', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <FiX size={13} /> Remove Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 2, width: 400, maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                <FiAlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Delete Medication</div>
                <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 1 }}>This action cannot be undone</div>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 13, color: 'var(--kh-text)', lineHeight: 1.6, marginBottom: 16 }}>
                Are you sure you want to delete <strong style={{ color: '#dc2626' }}>{confirmDelete.name}</strong> from the medication list?
              </div>

              <div style={{ padding: '10px 14px', borderRadius: 2, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
                <div className="d-flex align-items-center gap-2">
                  <FiAlertCircle size={13} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#991b1b', fontWeight: 500 }}>Deleting a medication will remove it from the patient's active medication list and any associated reminders.</span>
                </div>
              </div>

              {/* Modal actions */}
              <div className="d-flex gap-2 justify-content-end">
                <button onClick={() => setConfirmDelete(null)} style={{
                  padding: '9px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#fff', color: 'var(--kh-text-muted)', border: '1px solid #d1d5db',
                }}>Cancel</button>
                <button onClick={confirmDeleteMed} style={{
                  padding: '9px 20px', fontSize: 12.5, fontWeight: 700, borderRadius: 2, cursor: 'pointer',
                  background: '#dc2626', color: '#fff', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <FiX size={13} /> Delete Medication
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
