import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiX, FiChevronRight, FiChevronLeft, FiCheck, FiSave, FiChevronsLeft, FiChevronsRight, FiUserPlus } from 'react-icons/fi';

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

const Field = ({ label, children, col = 'col-md-6' }) => (
  <div className={col}><label className="form-label" style={lbl}>{label}</label>{children}</div>
);
const YesNo = ({ label, col = 'col-md-6' }) => (
  <Field label={label} col={col}><select className={sel}><option value="">Select...</option><option value="yes">Yes</option><option value="no">No</option></select></Field>
);
const SectionTitle = ({ children }) => (
  <div className="col-12"><h6 style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--kh-text)', margin: '8px 0 0', paddingBottom: 8, borderBottom: '1px solid var(--kh-border-light)' }}>{children}</h6></div>
);

function TabPersonal() {
  return (<div className="row g-3">
    <Field label="Reg No." col="col-md-3"><input className={inp} placeholder="e.g. KH-2026-001" /></Field>
    <Field label="Date of Assessment" col="col-md-3"><input type="date" className={inp} /></Field>
    <Field label="Date of Admission" col="col-md-3"><input type="date" className={inp} /></Field>
    <Field label="Service User's Name" col="col-md-3"><input className={inp} placeholder="Full name" /></Field>
    <Field label="Preferred Name" col="col-md-3"><input className={inp} placeholder="Preferred name" /></Field>
    <Field label="Contact Number" col="col-md-3"><input className={inp} placeholder="+233..." /></Field>
    <Field label="Date of Birth" col="col-md-3"><input type="date" className={inp} /></Field>
    <Field label="Age" col="col-md-1"><input type="number" className={inp} /></Field>
    <Field label="Sex" col="col-md-2"><select className={sel}><option value="">Select</option><option>Male</option><option>Female</option></select></Field>
    <Field label="Residential Address" col="col-md-6"><input className={inp} placeholder="Full address" /></Field>
    <Field label="GPS Code" col="col-md-3"><input className={inp} placeholder="e.g. GA-123-4567" /></Field>
    <Field label="Email Address" col="col-md-3"><input type="email" className={inp} placeholder="email@example.com" /></Field>
  </div>);
}
function TabNextOfKin() {
  return (<div className="row g-3">
    <SectionTitle>Next of Kin</SectionTitle>
    <Field label="Name"><input className={inp} placeholder="Full name" /></Field>
    <Field label="Relationship to Service User"><input className={inp} placeholder="e.g. Daughter" /></Field>
    <Field label="Contact Details"><input className={inp} placeholder="+233..." /></Field>
    <Field label="Preferred Contact Details"><input className={inp} placeholder="Alternative contact" /></Field>
    <SectionTitle>Cultural / Spiritual / Religious Needs</SectionTitle>
    <Field label="Cultural / Spiritual / Religious Needs" col="col-md-12"><textarea className={inp} rows={3} placeholder="Describe any cultural, spiritual or religious needs..." /></Field>
    <SectionTitle>Personal Doctor</SectionTitle>
    <Field label="Personal Doctor Name" col="col-md-4"><input className={inp} placeholder="Doctor name" /></Field>
    <Field label="Health Facility" col="col-md-4"><input className={inp} placeholder="Hospital / Clinic" /></Field>
    <Field label="Personal Mobile Number" col="col-md-4"><input className={inp} placeholder="+233..." /></Field>
  </div>);
}
function TabChecklist() {
  return (<div className="row g-3">
    <SectionTitle>Admission Checklist</SectionTitle>
    <YesNo label="Client's Handbook Given" />
    <Field label="Nurse's Name"><input className={inp} placeholder="Admitting nurse" /></Field>
    <Field label="Nurse's PIN Number"><input className={inp} placeholder="PIN" /></Field>
    <YesNo label="Infection Control Supplies Advised (Gloves, Aprons, Bin Bags, Disinfectant)" col="col-md-12" />
  </div>);
}
function TabMedical() {
  return (<div className="row g-3">
    <SectionTitle>History of Medical & Surgery</SectionTitle>
    <YesNo label="Any History of Medical Conditions or Surgery?" col="col-md-4" />
    <Field label="Details (if yes)" col="col-md-8"><textarea className={inp} rows={3} placeholder="Describe medical/surgical history..." /></Field>
  </div>);
}
function TabCommunication() {
  return (<div className="row g-3">
    <SectionTitle>Communication</SectionTitle>
    <YesNo label="Any Communication Needs" col="col-md-4" />
    <YesNo label="Any Hearing Impairment" col="col-md-4" />
    <YesNo label="Any Speech Impairment" col="col-md-4" />
    <YesNo label="Any Visual Impairment" col="col-md-4" />
    <YesNo label="Any Understanding Difficulties" col="col-md-4" />
    <Field label="Communication Notes" col="col-md-12"><textarea className={inp} rows={2} placeholder="Additional details..." /></Field>
  </div>);
}
function TabInfection() {
  return (<div className="row g-3">
    <SectionTitle>Infection Control</SectionTitle>
    <YesNo label="Infection Prevention & Control Risk Assessment Care Plan Completed" />
    <YesNo label="Diarrhea on Admission" />
    <SectionTitle>Diabetes</SectionTitle>
    <YesNo label="Does the Patient Have Diabetes?" col="col-md-4" />
    <YesNo label="Diabetes Care Plan Completed (if yes)" col="col-md-4" />
    <YesNo label="Anti-embolism Stockings for Stroke / Bed Bound" col="col-md-4" />
  </div>);
}
function TabBreathing() {
  return (<div className="row g-3">
    <SectionTitle>Breathing</SectionTitle>
    <YesNo label="Any Breathing Difficulties" col="col-md-3" />
    <YesNo label="Home Oxygen / Nebs / CPAP / BiPAP" col="col-md-3" />
    <YesNo label="Smoker" col="col-md-3" />
    <YesNo label="Ever Smoked" col="col-md-3" />
    <SectionTitle>Pain</SectionTitle>
    <YesNo label="Pain Present" col="col-md-3" />
    <Field label="Analgesia Prescribed" col="col-md-3"><input className={inp} placeholder="Medication" /></Field>
    <Field label="Location of Pain" col="col-md-3"><input className={inp} placeholder="e.g. Lower back" /></Field>
    <Field label="Pain Score" col="col-md-3"><select className={sel}><option value="">Select...</option><option value="0">0 — No Pain</option><option value="1">1 — Mild Pain</option><option value="2">2 — Moderate Pain</option><option value="3">3 — Severe Pain</option></select></Field>
  </div>);
}
function TabSleep() {
  return (<div className="row g-3">
    <SectionTitle>Sleep</SectionTitle>
    <YesNo label="Gets Up at Night" col="col-md-4" />
    <YesNo label="Night Sedation Used" col="col-md-4" />
    <YesNo label="Sleeps Well" col="col-md-4" />
    <YesNo label="Sleep / Rest During Day" col="col-md-4" />
    <Field label="Usual Time to Get Up" col="col-md-4"><input type="time" className={inp} /></Field>
    <Field label="Best Position for Sleeping" col="col-md-4"><input className={inp} placeholder="e.g. Left side" /></Field>
    <SectionTitle>Nutrition</SectionTitle>
    <YesNo label="Any Food Allergies or Intolerances" col="col-md-4" />
    <YesNo label="Any Special Diets" col="col-md-4" />
    <YesNo label="Need Help in Eating or Drinking" col="col-md-4" />
    <YesNo label="Need / Use of Feeding Aid" col="col-md-4" />
    <YesNo label="Any Swallowing Difficulties" col="col-md-4" />
    <Field label="Diet Type" col="col-md-4"><select className={sel}><option value="">Select...</option><option>Diabetic</option><option>Hypertensive</option><option>Normal</option><option>Puree</option></select></Field>
    <YesNo label="Does Service User Have an NG Tube" col="col-md-4" />
    <Field label="Nutrition Concerns" col="col-md-8"><textarea className={inp} rows={2} placeholder="Any concerns..." /></Field>
  </div>);
}
function TabHygiene() {
  return (<div className="row g-3">
    <SectionTitle>Personal Hygiene & Grooming</SectionTitle>
    <YesNo label="Independent with Hygiene Needs" col="col-md-4" />
    <YesNo label="Mouth-Care Plan" col="col-md-4" />
    <YesNo label="Diabetes (Foot Care)" col="col-md-4" />
    <SectionTitle>Bladder & Bowel</SectionTitle>
    <YesNo label="Bladder and Bowel Dysfunction" col="col-md-3" />
    <Field label="Catheter Details" col="col-md-3"><input className={inp} placeholder="Type if applicable" /></Field>
    <YesNo label="Catheter Care Plan" col="col-md-3" />
    <YesNo label="Incontinent Pads" col="col-md-3" />
    <SectionTitle>Psychological</SectionTitle>
    <YesNo label="Psychological Concerns" col="col-md-3" />
    <YesNo label="History of Depression" col="col-md-3" />
    <YesNo label="History of Anxiety" col="col-md-3" />
    <YesNo label="Signs of Dementia / Delirium" col="col-md-3" />
    <Field label="Psychological Notes" col="col-md-12"><textarea className={inp} rows={2} placeholder="Additional details..." /></Field>
  </div>);
}
function TabSkin() {
  return (<div className="row g-3">
    <SectionTitle>Skin Integrity</SectionTitle>
    <YesNo label="Open Wounds" col="col-md-3" />
    <YesNo label="Pressure Ulcer" col="col-md-3" />
    <Field label="Grade on Admission" col="col-md-3"><input className={inp} placeholder="Grade" /></Field>
    <Field label="Security Items" col="col-md-3"><input className={inp} placeholder="Items / Lost" /></Field>
    <SectionTitle>Manual Handling Risk Assessment</SectionTitle>
    <YesNo label="Is the Patient Independently Mobile?" col="col-md-6" />
    <Field label="If No, Equipment Needed" col="col-md-6"><input className={inp} placeholder="Equipment" /></Field>
    <Field label="How Much Assistance Required (No. of Staff)" col="col-md-6"><input className={inp} placeholder="e.g. 2 staff" /></Field>
    <YesNo label="Can the Patient Move in the Bed?" col="col-md-6" />
    <Field label="If No, Equipment / Staff Needed" col="col-md-6"><input className={inp} placeholder="Equipment or staff count" /></Field>
    <YesNo label="Can the Patient Mobilise from Bed to Chair?" col="col-md-6" />
    <Field label="If No, Equipment Needed" col="col-md-6"><input className={inp} placeholder="Equipment" /></Field>
    <YesNo label="Can the Patient Transfer to the Toilet?" col="col-md-6" />
    <Field label="If No, Equipment Needed" col="col-md-6"><input className={inp} placeholder="Equipment" /></Field>
  </div>);
}
function TabVitals() {
  return (<div className="row g-3">
    <SectionTitle>Vitals</SectionTitle>
    <Field label="Blood Pressure" col="col-md-3"><input className={inp} placeholder="e.g. 120/80 mmHg" /></Field>
    <Field label="Blood Sugar" col="col-md-3"><input className={inp} placeholder="e.g. 5.6 mmol/L" /></Field>
    <Field label="Respiration" col="col-md-3"><input className={inp} placeholder="e.g. 18 bpm" /></Field>
    <Field label="SPO2" col="col-md-3"><input className={inp} placeholder="e.g. 98%" /></Field>
    <Field label="Pulse" col="col-md-3"><input className={inp} placeholder="e.g. 72 bpm" /></Field>
    <Field label="Temperature" col="col-md-3"><input className={inp} placeholder="e.g. 36.8°C" /></Field>
    <Field label="Urinalysis" col="col-md-3"><input className={inp} placeholder="Results" /></Field>
    <Field label="Weight" col="col-md-3"><input className={inp} placeholder="e.g. 68 kg" /></Field>
    <SectionTitle>Admission</SectionTitle>
    <YesNo label="Client Handbook Given" col="col-md-4" />
    <SectionTitle>Medications</SectionTitle>
    <Field label="Current Medications" col="col-md-12"><textarea className={inp} rows={4} placeholder="List all current medications, dosages and frequency..." /></Field>
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
  const openModal = () => { setShowModal(true); setActiveTab(0); setCompletedTabs([]); };

  const ActiveTabComponent = TAB_COMPONENTS[TABS[activeTab].key];
  const progress = Math.round((completedTabs.length / TABS.length) * 100);

  const pgBtn = (onClick, disabled, children) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '6px 10px', border: '1px solid var(--kh-border-light)', borderRadius: 2,
      background: disabled ? 'var(--kh-off-white)' : '#fff', cursor: disabled ? 'default' : 'pointer',
      color: disabled ? 'var(--kh-text-muted)' : 'var(--kh-text)', fontSize: 13, display: 'flex', alignItems: 'center',
    }}>{children}</button>
  );

  return (
    <div className="page-wrapper">

      {/* Data Table Card */}
      <div className="kh-card">
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
              {paged.map((p, i) => (
                <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                  <td className="col-num">{startRow + i}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="avatar sm" style={{ background: i % 2 === 0 ? '#45B6FE' : '#2E7DB8' }}>
                        {p.name.split(' ').map(n => n[0]).join('')}
                      </div>
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
              {paged.length === 0 && (
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
      </div>

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
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}><ActiveTabComponent /></div>
                <div style={{ padding: '14px 28px', borderTop: '1px solid var(--kh-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div>{activeTab > 0 && <button onClick={handlePrev} className="btn btn-kh-outline d-flex align-items-center gap-1" style={{ fontSize: 13 }}><FiChevronLeft size={15} /> Previous</button>}</div>
                  <div className="d-flex gap-2">
                    <button onClick={handleSave} className="btn btn-kh-outline d-flex align-items-center gap-1" style={{ fontSize: 13 }}><FiSave size={14} /> Save Progress</button>
                    {activeTab < TABS.length - 1 ? (
                      <button onClick={handleNext} className="btn btn-kh-primary d-flex align-items-center gap-1" style={{ fontSize: 13 }}>Save & Continue <FiChevronRight size={15} /></button>
                    ) : (
                      <button onClick={() => { markComplete(activeTab); setShowModal(false); }} className="btn btn-kh-primary d-flex align-items-center gap-1" style={{ fontSize: 13 }}><FiCheck size={15} /> Complete Admission</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
