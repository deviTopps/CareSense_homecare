import { resolvePatientMutationId } from './patients';

const tri = (value) => (value === true || value === false ? value : null);

function boolFromApi(value) {
  if (value === true || value === false) return value;
  const normalized = String(value ?? '').toLowerCase();
  if (normalized === 'yes' || normalized === 'true') return true;
  if (normalized === 'no' || normalized === 'false') return false;
  return null;
}

/** Map GET /patients/:id payload into the admission modal form shape. */
export function buildAdmissionFormFromApiPatient(raw, baseForm) {
  const patient = raw?.patient || raw?.data?.patient || raw?.data || raw || {};
  const next = baseForm ? JSON.parse(JSON.stringify(baseForm)) : {};

  const personal = patient.personalInfo || patient.personal || patient;
  const nextOfKin = patient.nextOfKin || {};
  const checklist = patient.admissionChecklist || patient.checklist || {};
  const medical = patient.medicalHistory || patient.medical || {};
  const communication = patient.communicationStyle || patient.communication || {};
  const infection = patient.infectionControl || patient.infection || {};
  const breath = patient.breathPain || patient.breathing || {};
  const sleepNutrition = patient.sleepNutrition || {};
  const sleep = sleepNutrition.sleep || patient.sleep || {};
  const nutrition = sleepNutrition.nutrition || patient.nutrition || {};
  const hygienePsych = patient.hygienePsychological || patient.hygienePsych || {};
  const personalHygiene = hygienePsych.personal || sleepNutrition.personal || patient.personal || {};
  const bladderBowel = hygienePsych.bladderBowel || sleepNutrition.bladderBowel || patient.bladderBowel || {};
  const psych = hygienePsych.psychologicalNeeds || sleepNutrition.psychologicalNeeds || patient.psychologicalNeeds || {};
  const skinMobility = patient.skinMobility || {};
  const skin = skinMobility.skinIntegrity || patient.skinIntegrity || {};
  const handling = skinMobility.handlingAssessment || patient.handlingAssessment || {};
  const vitals = patient.initialVitals || patient.vitals || {};

  next.personal = {
    ...next.personal,
    registrationNumber: personal.registrationNumber || personal.regNo || next.personal?.registrationNumber || '',
    dateOfAssessment: personal.dateOfAssessment || next.personal?.dateOfAssessment || '',
    dateOfAdmission: personal.dateOfAdmission || next.personal?.dateOfAdmission || '',
    firstName: personal.firstName || next.personal?.firstName || '',
    lastName: personal.lastName || next.personal?.lastName || '',
    preferredName: personal.preferredName || next.personal?.preferredName || '',
    contactNumber: personal.contactNumber || personal.phone || next.personal?.contactNumber || '',
    dateOfBirth: personal.dateOfBirth || personal.dob || next.personal?.dateOfBirth || '',
    age: personal.age !== undefined && personal.age !== null ? String(personal.age) : (next.personal?.age || ''),
    gender: personal.gender || next.personal?.gender || '',
    residentialAddress: personal.residentialAddress || personal.address || next.personal?.residentialAddress || '',
    gpsCode: personal.gpsCode || next.personal?.gpsCode || '',
    email: personal.email || next.personal?.email || '',
  };

  next.nextOfKin = {
    ...next.nextOfKin,
    fullName: nextOfKin.fullName || '',
    relationship: nextOfKin.relationship || '',
    contactOne: nextOfKin.contactOne || '',
    contactTwo: nextOfKin.contactTwo || '',
    spiritualNeed: nextOfKin.spiritualNeed || '',
    personalDoctor: nextOfKin.personalDoctor || '',
    personalDoctorFacility: nextOfKin.personalDoctorFacility || '',
    personalDoctorContact: nextOfKin.personalDoctorContact || '',
  };

  next.checklist = {
    ...next.checklist,
    clientHandBookGiven: tri(boolFromApi(checklist.clientHandBookGiven)),
    admittingNurse: checklist.admittingNurse || '',
    nursePin: checklist.nursePin || '',
    infectionControlSupplies: tri(boolFromApi(checklist.infectionControlSupplies)),
  };

  next.medical = {
    ...next.medical,
    anyMedicalHistory: tri(boolFromApi(medical.anyMedicalHistory)),
    medicalHistoryDescription: medical.medicalHistoryDescription || '',
  };

  next.communication = {
    ...next.communication,
    anyCommunicationNeeds: tri(boolFromApi(communication.anyCommunicationNeeds)),
    anyHearingNeeds: tri(boolFromApi(communication.anyHearingNeeds)),
    anySpeechImpairment: tri(boolFromApi(communication.anySpeechImpairment)),
    anyVisualImpairment: tri(boolFromApi(communication.anyVisualImpairment)),
    anyUnderstandingDifficulties: tri(boolFromApi(communication.anyUnderstandingDifficulties)),
    communicationNotes: communication.communicationNotes || '',
  };

  next.infection = {
    ...next.infection,
    InfectionCarePlanCompletion: tri(boolFromApi(infection.InfectionCarePlanCompletion ?? infection.infectionCarePlanCompletion)),
    anyDiabetes: tri(boolFromApi(infection.anyDiabetes)),
    DiabetesCarePlanCompletion: tri(boolFromApi(infection.DiabetesCarePlanCompletion ?? infection.diabetesCarePlanCompletion)),
    isThePatientBedBound: tri(boolFromApi(infection.isThePatientBedBound)),
  };

  const painPresentRaw = String(breath.painPresent || '').toLowerCase();
  next.breathing = {
    ...next.breathing,
    anyBreathingDifficulties: tri(boolFromApi(breath.anyBreathingDifficulties)),
    homeOxygenNeeded: tri(boolFromApi(breath.homeOxygenNeeded)),
    isSmoker: tri(boolFromApi(breath.isSmoker)),
    everSmoked: tri(boolFromApi(breath.everSmoked)),
    painPresent: painPresentRaw === 'yes' || breath.painPresent === true
      ? true
      : painPresentRaw === 'no' || breath.painPresent === false
        ? false
        : null,
    anagelsiaPrescribed: tri(boolFromApi(breath.anagelsiaPrescribed)),
    locationOfPain: breath.locationOfPain || '',
    painScore: breath.painScore !== undefined && breath.painScore !== null ? String(breath.painScore) : '',
  };

  next.sleepNutrition = {
    sleep: {
      wakeUpAtNight: tri(boolFromApi(sleep.wakeUpAtNight)),
      UseOfNightSedation: tri(boolFromApi(sleep.UseOfNightSedation ?? sleep.useOfNightSedation)),
      userSleepWell: tri(boolFromApi(sleep.userSleepWell)),
      RestDuringTheDay: tri(boolFromApi(sleep.RestDuringTheDay ?? sleep.restDuringTheDay)),
      usualTimeToWakeUp: sleep.usualTimeToWakeUp || '',
      bestSleepingPosition: sleep.bestSleepingPosition || '',
    },
    nutrition: {
      allergy: tri(boolFromApi(nutrition.allergy)),
      specialDiet: tri(boolFromApi(nutrition.specialDiet)),
      needHelpInEating: tri(boolFromApi(nutrition.needHelpInEating)),
      feedingAid: tri(boolFromApi(nutrition.feedingAid)),
      swallowingDifficulties: tri(boolFromApi(nutrition.swallowingDifficulties)),
      dietType: nutrition.dietType || '',
      ngTube: tri(boolFromApi(nutrition.ngTube)),
      nutritionConcerns: nutrition.nutritionConcerns || '',
    },
  };

  next.hygienePsych = {
    personal: {
      hygieneNeeds: tri(boolFromApi(personalHygiene.hygieneNeeds)),
      mouthCarePlan: tri(boolFromApi(personalHygiene.mouthCarePlan)),
      diabeteFoot: tri(boolFromApi(personalHygiene.diabeteFoot)),
    },
    bladderBowel: {
      bladderDysfunction: tri(boolFromApi(bladderBowel.bladderDysfunction)),
      catheterDescription: bladderBowel.catheterDescription || '',
      catheterPlan: tri(boolFromApi(bladderBowel.catheterPlan)),
      incontinentPads: tri(boolFromApi(bladderBowel.incontinentPads)),
    },
    psychologicalNeeds: {
      psychologicalNeeds: tri(boolFromApi(psych.psychologicalNeeds)),
      depressionHistory: tri(boolFromApi(psych.depressionHistory)),
      anxietyhistory: tri(boolFromApi(psych.anxietyhistory ?? psych.anxietyHistory)),
      signDementia: tri(boolFromApi(psych.signDementia)),
      psychologicalNotes: psych.psychologicalNotes || '',
    },
  };

  next.skinMobility = {
    skinIntegrity: {
      openWounds: tri(boolFromApi(skin.openWounds)),
      pressureUlcer: tri(boolFromApi(skin.pressureUlcer)),
      gradeAdmission: skin.gradeAdmission || '',
      securityItems: skin.securityItems || '',
    },
    handlingAssessment: {
      isPatientMobile: tri(boolFromApi(handling.isPatientMobile)),
      isEquipmentNeeded: tri(boolFromApi(handling.isEquipmentNeeded)),
      numberOfStaffNeeded: handling.numberOfStaffNeeded ?? '',
      moveInBed: tri(boolFromApi(handling.moveInBed)),
      moveInBedEquipment: handling.moveInBedEquipment || '',
      mobilityFromBedToChair: tri(boolFromApi(handling.mobilityFromBedToChair)),
      mobilityFromBedToChairEquipment: handling.mobilityFromBedToChairEquipment || '',
      mobilityToWashroom: tri(boolFromApi(handling.mobilityToWashroom)),
      mobilityToWashroomEquipment: handling.mobilityToWashroomEquipment || '',
    },
  };

  next.vitals = {
    bloodPressure: vitals.bloodPressure || '',
    bloodSugar: vitals.bloodSugar || '',
    respiration: vitals.respiration || '',
    sp02: vitals.sp02 || vitals.spo2 || '',
    pulseRate: vitals.pulseRate || '',
    temperature: vitals.temperature || '',
    urinalysis: vitals.urinalysis || '',
    weight: vitals.weight || '',
  };

  return next;
}

export function resolveAdmissionResumePatientId(raw, fallbackId = '') {
  return resolvePatientMutationId(raw) || resolvePatientMutationId(raw?.patient) || String(fallbackId || '').trim();
}
