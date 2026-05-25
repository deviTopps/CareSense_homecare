import { apiFetch } from '../api';
import { collectAdmissionDraftLookupIds } from './admissionDrafts';
import {
  extractApiPatientId,
  isLikelyMongoObjectId,
  resolvePatientMutationId,
} from './patients';

export const ADMISSION_TAB_KEYS = [
  'personal',
  'nok',
  'checklist',
  'medical',
  'communication',
  'infection',
  'breathing',
  'sleep',
  'hygiene',
  'skin',
  'vitals',
];

export function createAdmissionApiHelpers() {
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

  return {
    postJson: (path, body) => requestJson(path, 'POST', body),
    patchJson: (path, body) => requestJson(path, 'PATCH', body),
    requestJson,
  };
}

export function extractAdmissionPatientId(data) {
  return (
    resolvePatientMutationId(data)
    || resolvePatientMutationId(data?.patient)
    || extractApiPatientId(data)
    || extractApiPatientId(data?.patient)
    || null
  );
}

function collectLookupIdsFromResponse(data, patientId) {
  const candidates = [
    patientId,
    data?.patientId,
    data?.uuid,
    data?.patientUuid,
    data?._id,
    data?.id,
    data?.patient?.patientId,
    data?.patient?.uuid,
    data?.patient?._id,
    extractApiPatientId(data),
    extractApiPatientId(data?.patient),
    isLikelyMongoObjectId(data?._id) ? data._id : '',
    isLikelyMongoObjectId(data?.patient?._id) ? data.patient._id : '',
  ];
  return collectAdmissionDraftLookupIds(patientId, candidates);
}

async function postOrPatch(postJson, patchJson, path, body) {
  const hasPatientId = Boolean(body?.patientId);

  if (hasPatientId) {
    try {
      await patchJson(path, body);
      return;
    } catch (patchError) {
      const patchMessage = String(patchError?.message || '').toLowerCase();
      const patchMissing = patchMessage.includes('not found') || patchMessage.includes('does not exist');
      if (!patchMissing) throw patchError;
    }
  }

  try {
    await postJson(path, body);
  } catch (postError) {
    const message = String(postError?.message || '').toLowerCase();
    if (
      message.includes('already exists')
      || message.includes('use patch')
      || hasPatientId
    ) {
      await patchJson(path, body);
      return;
    }
    throw postError;
  }
}

const yesNo = (value) => (value === true ? 'Yes' : value === false ? 'No' : '');

export async function saveAdmissionTab(tabKey, form, patientId, api = createAdmissionApiHelpers()) {
  const { postJson, patchJson } = api;
  let resolvedPatientId = String(patientId || '').trim();

  switch (tabKey) {
    case 'personal': {
      const typedRegistrationNumber = String(form.personal.registrationNumber || '').trim();
      if (!typedRegistrationNumber) {
        throw new Error('Registration number is required before saving personal details.');
      }

      const personalInfoPayload = {
        registrationNumber: typedRegistrationNumber,
        dateOfAssessment: form.personal.dateOfAssessment,
        dateOfAdmission: form.personal.dateOfAdmission,
        firstName: form.personal.firstName,
        lastName: form.personal.lastName,
        preferredName: form.personal.preferredName,
        contactNumber: form.personal.contactNumber,
        dateOfBirth: form.personal.dateOfBirth,
        age: form.personal.age,
        gender: form.personal.gender,
        residentialAddress: form.personal.residentialAddress,
        gpsCode: form.personal.gpsCode,
        email: form.personal.email,
      };

      if (resolvedPatientId) {
        await patchJson('/patients/personal-info', { patientId: resolvedPatientId, ...personalInfoPayload });
        return {
          patientId: resolvedPatientId,
          tabKey,
          lookupIds: collectLookupIdsFromResponse({ patientId: resolvedPatientId }, resolvedPatientId),
        };
      }

      const response = await postJson('/patients/personal-info', personalInfoPayload);
      resolvedPatientId = extractAdmissionPatientId(response);
      if (!resolvedPatientId) {
        throw new Error('Patient created but patientId was not returned by /patients/personal-info');
      }
      return {
        patientId: resolvedPatientId,
        tabKey,
        lookupIds: collectLookupIdsFromResponse(response, resolvedPatientId),
      };
    }
    case 'nok': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/next-of-kin', {
        patientId: resolvedPatientId,
        fullName: form.nextOfKin.fullName,
        relationship: form.nextOfKin.relationship,
        contactOne: form.nextOfKin.contactOne,
        contactTwo: form.nextOfKin.contactTwo,
        spiritualNeed: form.nextOfKin.spiritualNeed,
        personalDoctor: form.nextOfKin.personalDoctor,
        personalDoctorFacility: form.nextOfKin.personalDoctorFacility,
        personalDoctorContact: form.nextOfKin.personalDoctorContact,
      });
      break;
    }
    case 'checklist': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/admission-checklist', {
        patientId: resolvedPatientId,
        clientHandBookGiven: Boolean(form.checklist.clientHandBookGiven),
        admittingNurse: form.checklist.admittingNurse,
        infectionControlSupplies: Boolean(form.checklist.infectionControlSupplies),
      });
      break;
    }
    case 'medical': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/medical-history', {
        patientId: resolvedPatientId,
        anyMedicalHistory: Boolean(form.medical.anyMedicalHistory),
        medicalHistoryDescription: form.medical.medicalHistoryDescription,
      });
      break;
    }
    case 'communication': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/communication-style', {
        patientId: resolvedPatientId,
        anyCommunicationNeeds: Boolean(form.communication.anyCommunicationNeeds),
        anyHearingNeeds: Boolean(form.communication.anyHearingNeeds),
        anySpeechImpairment: Boolean(form.communication.anySpeechImpairment),
        anyVisualImpairment: Boolean(form.communication.anyVisualImpairment),
        anyUnderstandingDifficulties: Boolean(form.communication.anyUnderstandingDifficulties),
        communicationNotes: form.communication.communicationNotes,
      });
      break;
    }
    case 'infection': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/infection-control', {
        patientId: resolvedPatientId,
        InfectionCarePlanCompletion: Boolean(form.infection.InfectionCarePlanCompletion),
        anyDiabetes: Boolean(form.infection.anyDiabetes),
        DiabetesCarePlanCompletion: Boolean(form.infection.DiabetesCarePlanCompletion),
        isThePatientBedBound: Boolean(form.infection.isThePatientBedBound),
      });
      break;
    }
    case 'breathing': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/breath-pain', {
        patientId: resolvedPatientId,
        anyBreathingDifficulties: Boolean(form.breathing.anyBreathingDifficulties),
        homeOxygenNeeded: Boolean(form.breathing.homeOxygenNeeded),
        isSmoker: Boolean(form.breathing.isSmoker),
        everSmoked: Boolean(form.breathing.everSmoked),
        painPresent: form.breathing.painPresent ? 'Yes' : 'No',
        anagelsiaPrescribed: Boolean(form.breathing.anagelsiaPrescribed),
        locationOfPain: form.breathing.locationOfPain,
        painScore: form.breathing.painScore,
      });
      break;
    }
    case 'sleep': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      const sleepNutritionPayload = {
        patientId: resolvedPatientId,
        sleep: {
          wakeUpAtNight: Boolean(form.sleepNutrition.sleep.wakeUpAtNight),
          UseOfNightSedation: Boolean(form.sleepNutrition.sleep.UseOfNightSedation),
          userSleepWell: Boolean(form.sleepNutrition.sleep.userSleepWell),
          RestDuringTheDay: Boolean(form.sleepNutrition.sleep.RestDuringTheDay),
          usualTimeToWakeUp: form.sleepNutrition.sleep.usualTimeToWakeUp,
          bestSleepingPosition: form.sleepNutrition.sleep.bestSleepingPosition,
        },
        nutrition: {
          allergy: Boolean(form.sleepNutrition.nutrition.allergy),
          specialDiet: Boolean(form.sleepNutrition.nutrition.specialDiet),
          needHelpInEating: Boolean(form.sleepNutrition.nutrition.needHelpInEating),
          feedingAid: Boolean(form.sleepNutrition.nutrition.feedingAid),
          swallowingDifficulties: Boolean(form.sleepNutrition.nutrition.swallowingDifficulties),
          dietType: form.sleepNutrition.nutrition.dietType,
          ngTube: Boolean(form.sleepNutrition.nutrition.ngTube),
          nutritionConcerns: form.sleepNutrition.nutrition.nutritionConcerns,
        },
      };
      await postOrPatch(postJson, patchJson, '/patients/sleep-nutrition', sleepNutritionPayload);
      break;
    }
    case 'hygiene': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      const hygienePsychPayload = {
        patientId: resolvedPatientId,
        personal: {
          hygieneNeeds: yesNo(form.hygienePsych.personal.hygieneNeeds),
          mouthCarePlan: yesNo(form.hygienePsych.personal.mouthCarePlan),
          diabeteFoot: yesNo(form.hygienePsych.personal.diabeteFoot),
        },
        bladderBowel: {
          bladderDysfunction: yesNo(form.hygienePsych.bladderBowel.bladderDysfunction),
          catheterDescription: form.hygienePsych.bladderBowel.catheterDescription,
          catheterPlan: yesNo(form.hygienePsych.bladderBowel.catheterPlan),
          incontinentPads: yesNo(form.hygienePsych.bladderBowel.incontinentPads),
        },
        psychologicalNeeds: {
          psychologicalNeeds: yesNo(form.hygienePsych.psychologicalNeeds.psychologicalNeeds),
          depressionHistory: yesNo(form.hygienePsych.psychologicalNeeds.depressionHistory),
          anxietyhistory: yesNo(form.hygienePsych.psychologicalNeeds.anxietyhistory),
          signDementia: yesNo(form.hygienePsych.psychologicalNeeds.signDementia),
          psychologicalNotes: form.hygienePsych.psychologicalNeeds.psychologicalNotes,
        },
      };
      try {
        await patchJson('/patients/sleep-nutrition', hygienePsychPayload);
      } catch {
        await postOrPatch(postJson, patchJson, '/patients/sleep-nutrition', hygienePsychPayload);
      }
      break;
    }
    case 'skin': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/skin-mobility', {
        patientId: resolvedPatientId,
        skinIntegrity: {
          openWounds: Boolean(form.skinMobility.skinIntegrity.openWounds),
          pressureUlcer: Boolean(form.skinMobility.skinIntegrity.pressureUlcer),
          gradeAdmission: form.skinMobility.skinIntegrity.gradeAdmission,
          securityItems: form.skinMobility.skinIntegrity.securityItems,
        },
        handlingAssessment: {
          isPatientMobile: Boolean(form.skinMobility.handlingAssessment.isPatientMobile),
          isEquipmentNeeded: Boolean(form.skinMobility.handlingAssessment.isEquipmentNeeded),
          numberOfStaffNeeded: Number(form.skinMobility.handlingAssessment.numberOfStaffNeeded) || 0,
          moveInBed: Boolean(form.skinMobility.handlingAssessment.moveInBed),
          moveInBedEquipment: form.skinMobility.handlingAssessment.moveInBedEquipment,
          mobilityFromBedToChair: Boolean(form.skinMobility.handlingAssessment.mobilityFromBedToChair),
          mobilityFromBedToChairEquipment: form.skinMobility.handlingAssessment.mobilityFromBedToChairEquipment,
          mobilityToWashroom: Boolean(form.skinMobility.handlingAssessment.mobilityToWashroom),
          mobilityToWashroomEquipment: form.skinMobility.handlingAssessment.mobilityToWashroomEquipment,
        },
      });
      break;
    }
    case 'vitals': {
      if (!resolvedPatientId) throw new Error('Save personal details first to create the patient record.');
      await postOrPatch(postJson, patchJson, '/patients/initial-vitals', {
        patientId: resolvedPatientId,
        bloodPressure: form.vitals.bloodPressure,
        bloodSugar: form.vitals.bloodSugar,
        respiration: form.vitals.respiration,
        sp02: form.vitals.sp02,
        pulseRate: form.vitals.pulseRate,
        temperature: form.vitals.temperature,
        urinalysis: form.vitals.urinalysis,
        weight: form.vitals.weight,
      });
      const objectKey = String(form.profileImage?.objectKey || '').trim();
      const mediaId = String(form.profileImage?.mediaId || '').trim();
      if (objectKey && mediaId) {
        await postOrPatch(postJson, patchJson, '/patients/profile-image', {
          patientId: resolvedPatientId,
          objectKey,
          mediaId,
        });
      }
      break;
    }
    default:
      throw new Error(`Unknown admission section: ${tabKey}`);
  }

  return {
    patientId: resolvedPatientId,
    tabKey,
    lookupIds: collectLookupIdsFromResponse({ patientId: resolvedPatientId }, resolvedPatientId),
  };
}

/** Save only the active admission tab (avoids re-posting earlier sections and failing). */
export async function saveAdmissionProgressForTab(tabIndex, form, patientId, api) {
  const helpers = api || createAdmissionApiHelpers();
  const maxIndex = Math.max(0, Math.min(tabIndex, ADMISSION_TAB_KEYS.length - 1));
  const tabKey = ADMISSION_TAB_KEYS[maxIndex];
  if (!tabKey) throw new Error('Invalid admission tab.');

  const result = await saveAdmissionTab(tabKey, form, patientId, helpers);
  return {
    patientId: result.patientId || String(patientId || '').trim(),
    savedSections: [tabKey],
    lookupIds: result.lookupIds || [],
  };
}
